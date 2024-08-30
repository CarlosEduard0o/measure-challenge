import { Request, Response } from 'express';
import { CreateWaterGasMeasurementService } from '../services/CreateWaterGasMeasurementService';
import { v4 as uuidv4 } from 'uuid';
import { AppDataSource } from '../data-source';
import { Measure } from '../entity/Measure';
import { GoogleGenerativeAI } from '@google/generative-ai';
import path from 'path';
import fs from 'fs';
import sharp from 'sharp';
import { GEMINI_API_KEY } from "../config/enviroment";
import { MeasurementType } from '../services/CreateWaterGasMeasurementService';

const isMeasurementType = (value: any): value is MeasurementType => {
    return Object.values(MeasurementType).includes(value);
};

const analyzeImage = async (model: any, base64String: string, retries = 3): Promise<string> => {
    const prompt = "Please identify the meter reading value in the image. The reading is located in the central area, with the first five digits in black and the last two in red. Ignore the serial number at the top.";
    const image = {
        inlineData: {
            data: base64String.replace(/^data:image\/\w+;base64,/, ''),
            mimeType: "image/png",
        },
    };

    try {
        const result = await model.generateContent([prompt, image]);
        return result.response.text();
    } catch (error) {
        if (retries > 0) {
            console.warn(`Retrying due to error: ${error.message}. Retries left: ${retries}`);
            await new Promise(resolve => setTimeout(resolve, 3000));
            return analyzeImage(model, base64String, retries - 1);
        } else {
            throw new Error(`Failed to analyze image after retries: ${error.message}`);
        }
    }
};

const parseMeasurementValue = (rawValue: string): number | null => {
    const cleanedValue = rawValue.replace(/[^0-9]/g, '');
    return isNaN(parseInt(cleanedValue, 10)) ? null : parseInt(cleanedValue, 10);
};

const generateTempImageUrl = (fileName: string) => {
    const baseUrl = 'http://localhost:5000/uploads/';
    return `${baseUrl}${fileName}`;
};

const ensureUploadsDirExists = () => {
    const uploadsDir = path.join(__dirname, '..', 'uploads');
    if (!fs.existsSync(uploadsDir)) {
        fs.mkdirSync(uploadsDir);
    }
};

class WaterGasMeasurementController {

    async handleList(request: Request, response: Response) {
        const { customer_code } = request.params;
        const measureType = request.query.measure_type?.toString().toUpperCase();
        const allowedTypes = ["WATER", "GAS"];

        if (measureType && !allowedTypes.includes(measureType)) {
            return response.status(400).json({
                error_code: "INVALID_TYPE",
                error_description: "Tipo de medição não permitida"
            });
        }

        try {
            const measurements = await AppDataSource.getRepository(Measure)
                .createQueryBuilder("measure")
                .where("measure.customerCode = :customer_code", { customer_code })
                .andWhere(measureType ? "measure.measureType = :measureType" : "1=1", { measureType })
                .getMany();

            if (measurements.length === 0) {
                return response.status(404).json({
                    error_code: "MEASURES_NOT_FOUND",
                    error_description: "Nenhuma leitura encontrada"
                });
            }

            const responsePayload = {
                customer_code,
                measures: measurements.map(measure => ({
                    measure_uuid: measure.measureUuid,
                    measure_datetime: measure.measureDatetime,
                    measure_type: measure.measureType,
                    has_confirmed: measure.hasConfirmed,
                    image_url: measure.imageUrl
                }))
            };

            return response.status(200).json(responsePayload);
        } catch (error) {
            return response.status(500).json({
                error_code: "INTERNAL_SERVER_ERROR",
                error_description: "Erro ao recuperar as medições. Por favor, tente novamente."
            });
        }
    }

    async handle(request: Request, response: Response) {
        const { image, customer_code, measure_datetime, measure_type } = request.body;
        const base64String = image.replace(/^data:image\/[a-z]+;base64,/, '');
        const uuid = uuidv4();

        if (!customer_code || !measure_datetime || !measure_type) {
            return response.status(400).json({
                error_code: "INVALID_DATA",
                error_description: "Os dados fornecidos no corpo da requisição são inválidos"
            });
        }

        try {
            const apiKey = GEMINI_API_KEY;
            
            const genAI = new GoogleGenerativeAI(apiKey);
            const model = genAI.getGenerativeModel({ model: "gemini-1.5-pro" });

            const readingValue = await analyzeImage(model, base64String);
            const value = parseMeasurementValue(readingValue);
            //const value = 500000;

            // Save image locally
            const imageBuffer = Buffer.from(base64String, 'base64');
            const uploadsDir = path.join(__dirname, 'uploads');
            ensureUploadsDirExists();

            try {
                await sharp(imageBuffer).toBuffer();
            } catch (err) {
                return response.status(400).json({
                    error_code: "INVALID_IMAGE_FORMAT",
                    error_description: "Formato de imagem não suportado"
                });
            }

            const imageFileName = `${uuid}.jpg`;
            const imagePath = path.join(__dirname, '..', 'uploads', imageFileName);
            await sharp(imageBuffer).toFile(imagePath);

            const imageUrl = generateTempImageUrl(imageFileName);

        // Cria a medição com hasConfirmed como false
        await new CreateWaterGasMeasurementService().execute({
            uuid,
            customerCode: customer_code,
            measureDatetime: measure_datetime,
            measureType: measure_type,
            measureValue: value,
            hasConfirmed: false,
            imageUrl
        });

            return response.status(200).json({
                image_url: imageUrl,
                measure_value: value,
                measure_uuid: uuid,
                //has_confirmed: false
            });
        } catch (error) {
            console.error("Erro ao processar a medição:", error);
            return response.status(500).json({
                success: false,
                message: "Erro ao processar a medição."
            });
        }
    }

    async handlePatch(request: Request, response: Response) {
        const { measure_uuid, confirmed_value } = request.body;
    
        // Validação dos dados enviados no corpo da requisição
        if (!measure_uuid || confirmed_value === undefined) {
            return response.status(400).json({
                error_code: "INVALID_DATA",
                error_description: "Os dados fornecidos no corpo da requisição são inválidos"
            });
        }
    
        try {
            // Verifica se a medição existe
            const existingMeasurement = await new CreateWaterGasMeasurementService().findByUuid(measure_uuid);
            console.log("RETORNO: " + existingMeasurement);
            if (!existingMeasurement) {
                return response.status(404).json({
                    error_code: "MEASURE_NOT_FOUND",
                    error_description: "Leitura não encontrada"
                });
            }
    
            // Verifica se a medição já foi confirmada
            if (existingMeasurement.hasConfirmed) {
                return response.status(409).json({
                    error_code: "CONFIRMATION_DUPLICATE",
                    error_description: "Leitura já confirmada"
                });
            }
    
            // Atualiza a medição com o novo valor confirmado
            await new CreateWaterGasMeasurementService().update({
                uuid: measure_uuid,
                customerCode: existingMeasurement.customerCode, // mantido como no existente
                measureDatetime: existingMeasurement.measureDatetime, // mantido como no existente
                measureType: existingMeasurement.measureType, // mantido como no existente
                measureValue: confirmed_value,
                hasConfirmed: true,
                imageUrl: existingMeasurement.imageUrl // mantido como no existente
            });
    
            return response.status(200).json({ success: true });
    
        } catch (error) {
            return response.status(404).json({
                error_code: "MEASURE_NOT_FOUND",
                error_description: "Leitura não encontrada"
            });
        }
    }
    
}

export { WaterGasMeasurementController };
