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

    // Método para atualizar parcialmente uma medição (PATCH)
    async handlePatch(request: Request, response: Response) {
        try {
            const result = await AppDataSource
                .createQueryBuilder()
                .update(Measure)
                .set(request.body)
                .where("measureUuid = :id", { id: request.params.id })
                .execute();

            if (result.affected === 0) {
                return response.status(404).json({ error: 'Measure not found' });
            }

            response.status(200).json({ message: 'Measure updated successfully' });
        } catch (error) {
            response.status(500).json({ error: error.message });
        }
    }

    // Método para obter todas as medidas de um usuário (GET)
    async getAllMeasuresForUser(request: Request, response: Response) {
        try {
            const { customerCode } = request.params;

            const measures = await AppDataSource
                .getRepository(Measure)
                .createQueryBuilder('measure')
                .where('measure.customerCode = :customerCode', { customerCode })
                .getMany();

            if (measures.length === 0) {
                return response.status(404).json({ error: 'No measures found for this customer' });
            }

            response.status(200).json(measures);
        } catch (error) {
            response.status(500).json({ error: error.message });
        }
    }

    // Método para atualizar parcialmente uma medição
    async updateMeasure(measureUuid: string, updateData: Partial<Measure>): Promise<any> {
        try {
            const result = await AppDataSource
                .createQueryBuilder()
                .update(Measure)
                .set(updateData)
                .where("measureUuid = :id", { id: measureUuid })
                .execute();

            return result;
        } catch (error) {
            throw new Error(`Failed to update measure: ${error.message}`);
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