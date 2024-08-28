import { Request, Response } from 'express';
import { CreateWaterGasMeasurementService } from '../services/CreateWaterGasMeasurementService';
import { v4 as uuidv4 } from 'uuid';

class WaterGasMeasurementController {
    async handle(request: Request, response: Response) {

        const createWaterGasMeasurementService = new CreateWaterGasMeasurementService();
        const imageUrl = request.body.imageUrl;
        const customerCode = request.body.customerCode;
        const measureDatetime = request.body.measureDatetime;
        const measureType = request.body.measureType;
        const measureValue = request.body.measureType;
        const hasConfirmed = request.body.hasConfirmed;
        const uuid = uuidv4(); 
        

        function isBase64(str: string): boolean {
            try {
                return btoa(atob(str)) === str;
            } catch (err) {
                return false;
            } 
        }

        
        const measurement = await createWaterGasMeasurementService.execute({uuid, customerCode, measureDatetime, measureType, measureValue, hasConfirmed, imageUrl});

        //if (!image || !isBase64(image) || !customer_code || !measureDatetime || !measureType) {
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

        // return response.status(200).json(
        //     {
        //         image_url: "url image",
        //         measure_value: 5000,
        //         measure_uuid: "Measure uuid"
        //     });

        return response.status(200).json(measurement);
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