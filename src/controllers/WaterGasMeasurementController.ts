import { Request, Response } from 'express';
import { CreateWaterGasMeasurementService } from '../services/CreateWaterGasMeasurementService';
import { v4 as uuidv4 } from 'uuid';
import { AppDataSource } from '../data-source';
import { Measure } from '../entity/Measure';
import { GoogleGenerativeAI } from '@google/generative-ai';
import readline from 'readline';
import path from 'path';
import fs from 'fs';
import sharp from 'sharp';

const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout
});

const promptUser = (question: string): Promise<string> => {
    return new Promise((resolve) => {
        rl.question(question, (answer) => resolve(answer));
    });
};

const closeReadline = () => rl.close();

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
        const { image, customerCode, measureDatetime, measureType, hasConfirmed } = request.body;
        const base64String = image.replace(/^data:image\/[a-z]+;base64,/, '');
        const uuid = uuidv4();
    
        if (!customerCode || !measureDatetime || !measureType) {
            return response.status(400).json({
                error_code: "INVALID_DATA",
                error_description: "Os dados fornecidos no corpo da requisição são inválidos"
            });
        }
    
        try {
            const apiKey = 'AIzaSyDpyfitP0Y1bvRidadnEFd-85KtnwjnDpo'; // Atualize para sua chave de API válida
            const genAI = new GoogleGenerativeAI(apiKey);
            const model = genAI.getGenerativeModel({ model: "gemini-1.5-pro" });
    
            const readingValue = await analyzeImage(model, base64String);
            const value = parseMeasurementValue(readingValue);
    
            // Save image locally
            const imageBuffer = Buffer.from(base64String, 'base64');
            const uploadsDir = path.join(__dirname, 'uploads');
            if (!fs.existsSync(uploadsDir)) {
                fs.mkdirSync(uploadsDir);
            }
    
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
    
            const confirmation = await promptUser(`O valor identificado é ${value}. Está correto? (yes/no): `);
    
            if (confirmation.toLowerCase() === 'yes') {
                await new CreateWaterGasMeasurementService().execute({
                    uuid,
                    customerCode,
                    measureDatetime,
                    measureType,
                    measureValue: value,
                    hasConfirmed: true,
                    imageUrl
                });
    
                return response.status(200).json({
                    image_url: imageUrl,
                    measure_value: value,
                    measure_uuid: uuid
                });
            } else {
                const confirmedValue = await promptUser(`Digite o valor confirmado manualmente: `);
                const parsedValue = parseInt(confirmedValue, 10);
    
                if (isNaN(parsedValue)) {
                    return response.status(400).json({
                        success: false,
                        message: "Valor confirmado inválido."
                    });
                }
    
                // Verifique se a medição já existe
                const existingMeasurement = await new CreateWaterGasMeasurementService().findByUuid(uuid);
    
                if (existingMeasurement) {
                    const result = await new CreateWaterGasMeasurementService().update({
                        uuid,
                        customerCode,
                        measureDatetime,
                        measureType,
                        measureValue: parsedValue,
                        hasConfirmed: true,
                        imageUrl
                    });
    
                    if (result.affected === 0) {
                        console.error("Atualização falhou: Nenhuma linha foi afetada.");
                        return response.status(500).json({
                            success: false,
                            message: "Falha ao atualizar a medição."
                        });
                    }
    
                    return response.status(200).json({
                        success: true,
                        message: "Medição atualizada manualmente com sucesso."
                    });
                } else {
                    // Cria uma nova medição se não existir
                    await new CreateWaterGasMeasurementService().execute({
                        uuid,
                        customerCode,
                        measureDatetime,
                        measureType,
                        measureValue: parsedValue,
                        hasConfirmed: true,
                        imageUrl
                    });
    
                    return response.status(200).json({
                        success: true,
                        message: "Medição criada e confirmada manualmente com sucesso."
                    });
                }
            }
        } catch (error) {
            console.error("Erro ao processar a entrada do usuário:", error);
            return response.status(500).json({
                success: false,
                message: "Erro ao processar a entrada do usuário."
            });
        } finally {
            rl.close();
        }
    }

    async handlePatch(request: Request, response: Response) {
        const { measure_uuid, confirmed_value, customerCode, measureDatetime, measureType, imageUrl } = request.body;

        if (!measure_uuid || confirmed_value === undefined) {
            return response.status(400).json({
                error_code: "INVALID_DATA",
                error_description: "Os dados fornecidos no corpo da requisição são inválidos"
            });
        }

        try {
            const existingMeasurement = await new CreateWaterGasMeasurementService().findByUuid(measure_uuid);
            if (!existingMeasurement) {
                return response.status(404).json({
                    error_code: "MEASURE_NOT_FOUND",
                    error_description: "Leitura não encontrada"
                });
            }

            if (existingMeasurement.hasConfirmed) {
                return response.status(409).json({
                    error_code: "CONFIRMATION_DUPLICATE",
                    error_description: "Leitura do mês já realizada"
                });
            }

            await new CreateWaterGasMeasurementService().update({
                uuid: measure_uuid,
                customerCode,
                measureDatetime,
                measureType,
                measureValue: confirmed_value,
                hasConfirmed: true,
                imageUrl
            });

            return response.status(200).json({ success: true });
        } catch (error) {
            return response.status(500).json({
                error_code: "UPDATE_FAILED",
                error_description: "Erro ao atualizar a medição. Por favor, tente novamente."
            });
        }
    }
}

const checkReadingExists = async (datetime: Date | string, type: string): Promise<boolean> => {
    if (typeof datetime === 'string') {
        datetime = new Date(datetime);
    }

    if (!(datetime instanceof Date) || isNaN(datetime.getTime())) {
        throw new Error('Invalid date provided');
    }

    const year = datetime.getFullYear();
    const month = datetime.getMonth() + 1;

    const result = await AppDataSource.getRepository(Measure)
        .createQueryBuilder('measure')
        .where('measure.measureType = :type', { type })
        .andWhere('EXTRACT(YEAR FROM measure.measureDatetime) = :year', { year })
        .andWhere('EXTRACT(MONTH FROM measure.measureDatetime) = :month', { month })
        .getOne();

    return !!result;
};

export { WaterGasMeasurementController };
