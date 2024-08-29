import { Request, Response } from 'express';
import { CreateWaterGasMeasurementService } from '../services/CreateWaterGasMeasurementService';
import { v4 as uuidv4 } from 'uuid';
import { AppDataSource } from '../data-source';
import { Measure } from '../entity/Measure';
import readline from 'readline';

const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout
});


function promptUser(question: string): Promise<string> {
    return new Promise((resolve) => {
        rl.question(question, (answer) => {
            resolve(answer);
            // Não feche o readline aqui
        });
    });
}

// Função para fechar o readline quando todas as operações estiverem concluídas
function closeReadline() {
    rl.close();
}


class WaterGasMeasurementController {

    async handleList(request: Request, response: Response) {
        const { customer_code } = request.params;

        // Suporte apenas para tipos de medição "WATER" ou "GAS"
        const allowedTypes = ["WATER", "GAS"];
        const measureType = request.query.measure_type?.toString().toUpperCase();

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
                customer_code: customer_code,
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

        const { GoogleGenerativeAI } = require("@google/generative-ai");
        const fs = require("fs")
        const readline = require('readline');

        const apiKey = 'AIzaSyB4FcTvZIfU6iT1VUCw6y-d53lL8kikpdM';
        const genAI = new GoogleGenerativeAI(apiKey);
        const model = genAI.getGenerativeModel({ model: "gemini-1.5-pro" })

        const createWaterGasMeasurementService = new CreateWaterGasMeasurementService();
        const imageUrl = request.body.imageUrl;
        const base64String = request.body.image.replace(/^data:image\/png;base64,/, '');
        const customerCode = request.body.customerCode;
        const measureDatetime = request.body.measureDatetime;
        const measureType = request.body.measureType;
        const measureValue = request.body.measureType;
        const hasConfirmed = request.body.hasConfirmed;
        const uuid = uuidv4();


        // Printar o valor da imagem base64 no console
        if (base64String) {
            //     console.log("Imagem base64 recebida:", base64String);
        }

        function isBase64(str: string): boolean {
            try {
                return btoa(atob(str)) === str;
            } catch (err) {
                return false;
            }
        }

        //const measurement = await createWaterGasMeasurementService.execute({ uuid, customerCode, measureDatetime, measureType, measureValue, hasConfirmed, imageUrl });

        //if (!base64String || !isBase64(base64String) || !customer_code || !measureDatetime || !measureType) {
        if (!customerCode || !measureDatetime || !measureType) {
            return response.status(400).json({
                error_code: "INVALID_DATA",
                error_description: "Os dados fornecidos no corpo da requisição são inválidos"
            });
        }

        const existsReading = checkReadingExists(measureDatetime, measureType); // Função fictícia

        if (existsReading) {
            return response.status(409).json({
                error_code: "DOUBLE_REPORT",
                error_description: "Leitura do mês já realizada."
            });
        }

        // async function promptUser(question: string): Promise<string> {
        //     const rl = readline.createInterface({
        //         input: process.stdin,
        //         output: process.stdout
        //     });

        //     return new Promise((resolve) => {
        //         rl.question(question, (answer: string) => {
        //             rl.close();
        //             resolve(answer);
        //         });
        //     });
        // }


        // Enviar a imagem para a API Gemini Vision
        const prompt = "Please identify the meter reading value in the image. The reading is located in the central area, with the first five digits in black and the last two in red. Ignore the serial number at the top.";
        const image = {
            inlineData: {
                data: base64String.toString("base64").replace(/^data:image\/\w+;base64,/, ''),
                mimeType: "image/png",
            },
        };

        async function analyzeImage() {
            try {
                const result = await model.generateContent([prompt, image]);
                //console.log(result.response.text());
                const readingValue = result.response.text();


                function parseMeasurementValue(rawValue: string): number | null {
                    // Remove qualquer caractere não numérico, exceto números
                    const cleanedValue = rawValue.replace(/[^0-9]/g, '');

                    // Converte para número e verifica se é válido
                    const parsedValue = parseInt(cleanedValue, 10);

                    // Retorna o valor se for um número válido
                    return isNaN(parsedValue) ? null : parsedValue;
                }

                const value = parseMeasurementValue(readingValue);

                // Confirmar com o usuário
                const confirmation = await promptUser(`O valor identificado é ${value}. Está correto? (yes/no): `);
                if (confirmation.toLowerCase() === 'yes') {
                    console.log("Valor confirmado pelo usuário.");
                    await createWaterGasMeasurementService.execute({
                        uuid,
                        customerCode,
                        measureDatetime,
                        measureType,
                        measureValue: value,
                        hasConfirmed: true,
                        imageUrl: request.body.imageUrl
                    });

                    return response.status(200).json({
                        success: true,
                        message: "Medição confirmada e persistida com sucesso."
                    });

                } else {
                    console.log("Valor não confirmado. Verifique a qualidade da imagem.");

                    const confirmedValue = await promptUser(`Digite o valor confirmado manualmente: `);
                    const parsedValue = parseInt(confirmedValue, 10);

                    if (isNaN(parsedValue)) {
                        console.error("Valor digitado não é um número válido.");
                        return response.status(400).json({
                            success: false,
                            message: "Valor confirmado inválido."
                        });
                    }

                    await createWaterGasMeasurementService.update({
                        uuid,
                        customerCode,
                        measureDatetime,
                        measureType,
                        measureValue: parsedValue,
                        hasConfirmed: true,
                        imageUrl: request.body.imageUrl
                    });

                    return response.status(200).json({
                        success: true,
                        message: "Medição atualizada manualmente com sucesso."
                    });
                }
            } catch (error) {
                console.error("Erro ao processar a entrada do usuário:", error);
                return response.status(500).json({
                    success: false,
                    message: "Erro ao processar a entrada do usuário."
                });
            } finally {
                closeReadline(); // Fecha o readline após todas as operações
            }
        }

        analyzeImage();

        //return response.status(200).json(measurement);
    }

    async handlePatch(request: Request, response: Response) {
        //const { measureUuid } = request.params; // O UUID da medição é passado como parâmetro na URL
        const { measure_uuid, confirmed_value } = request.body;
        const { imageUrl, customerCode, measureDatetime, measureType, measureValue, hasConfirmed } = request.body;
        const createWaterGasMeasurementService = new CreateWaterGasMeasurementService();

        if (!measure_uuid || confirmed_value === undefined) {
            return response.status(400).json({
                error_code: "INVALID_DATA",
                error_description: "Os dados fornecidos no corpo da requisição são inválidos"
            });
        }

        const existingMeasurement = await createWaterGasMeasurementService.findByUuid(measure_uuid);
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

        // Validação básica dos dados
        if (!measure_uuid || !customerCode || !measureDatetime || !measureType) {
            return response.status(400).json({
                error_code: "INVALID_DATA",
                error_description: "Os dados fornecidos no corpo da requisição são inválidos"
            });
        }

        // Verifica se a leitura já existe

        if (!existingMeasurement) {
            return response.status(404).json({
                error_code: "MEASURE_NOT_FOUND",
                error_description: "Leitura não encontrada"
            });
        }

        // Verifica se a leitura já foi confirmada
        if (existingMeasurement.hasConfirmed) {
            return response.status(409).json({
                error_code: "CONFIRMATION_DUPLICATE",
                error_description: "Leitura do mês já realizada"
            });
        }

        try {
            await createWaterGasMeasurementService.update({
                uuid: measure_uuid,
                measureValue: confirmed_value,
                hasConfirmed: true
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


// Função fictícia para verificar a existência da leitura
function checkReadingExists(datetime: string, type: string): boolean {
    // Lógica para verificar se já existe uma leitura no banco de dados
    // Isso pode envolver consultas ao banco de dados para checar se uma leitura com
    // o mesmo tipo e dentro do mesmo mês já foi registrada.
    return false;
}

export { WaterGasMeasurementController }