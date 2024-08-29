import { Request, Response } from 'express';
import { CreateWaterGasMeasurementService } from '../services/CreateWaterGasMeasurementService';
import { v4 as uuidv4 } from 'uuid';
import { AppDataSource } from '../data-source';
import { Measure } from '../entity/Measure';

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

        const measurement = await createWaterGasMeasurementService.execute({ uuid, customerCode, measureDatetime, measureType, measureValue, hasConfirmed, imageUrl });

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

    async handlePatch(request: Request, response: Response){
        const { measureUuid } = request.params; // O UUID da medição é passado como parâmetro na URL
        const { imageUrl, customerCode, measureDatetime, measureType, measureValue, hasConfirmed } = request.body;
    
        // Validação básica dos dados
        if (!measureUuid || !customerCode || !measureDatetime || !measureType) {
            return response.status(400).json({
                error_code: "INVALID_DATA",
                error_description: "Os dados fornecidos no corpo da requisição são inválidos"
            });
        }
    
        const createWaterGasMeasurementService = new CreateWaterGasMeasurementService();
    
        // Verifica se a leitura já existe
        const existingMeasurement = await createWaterGasMeasurementService.findByUuid(measureUuid);
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
                uuid: measureUuid,
                customerCode,
                measureDatetime,
                measureType,
                measureValue,
                hasConfirmed,
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


// Função fictícia para verificar a existência da leitura
function checkReadingExists(datetime: string, type: string): boolean {
    // Lógica para verificar se já existe uma leitura no banco de dados
    // Isso pode envolver consultas ao banco de dados para checar se uma leitura com
    // o mesmo tipo e dentro do mesmo mês já foi registrada.
    return true;
}

export { WaterGasMeasurementController }