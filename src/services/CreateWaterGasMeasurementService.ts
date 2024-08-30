import { AppDataSource } from "../data-source";
import { Measure } from "../entity/Measure";
import { UpdateResult } from 'typeorm'; // Importação de UpdateResult

enum MeasurementType {
    WATER = "WATER",
    GAS = "GAS"
}

interface IMeasurement {
    uuid: string;
    customerCode: string;
    measureDatetime: Date;
    measureType: MeasurementType;
    measureValue: number;
    hasConfirmed?: boolean; // Confirmação (opcional)
    imageUrl?: string; // URL da imagem (opcional)
}

class CreateWaterGasMeasurementService {

    // Cria uma nova medição e retorna os dados da medição inserida
    async execute(measurement: IMeasurement) {
        const measure = await AppDataSource
            .createQueryBuilder()
            .insert()
            .into(Measure)
            .values(this.mapToMeasure(measurement))
            .returning(['measureUuid', 'imageUrl', 'measureValue'])
            .execute();

        return this.formatResponse(measure.generatedMaps[0]);
    }

    // Atualiza uma medição existente
    async update(measurement: Partial<IMeasurement>): Promise<UpdateResult> {
        console.log('Atualizando medição com os seguintes dados:', measurement);
    
        const result = await AppDataSource
            .createQueryBuilder()
            .update(Measure)
            .set(this.mapToMeasure(measurement))
            .where("measureUuid = :uuid", { uuid: measurement.uuid })
            .execute();
    
        console.log('Resultado da atualização:', result);
    
        return result; // Retorna o resultado da atualização
    }


    // Encontra uma medição pelo UUID
    async findByUuid(uuid: string): Promise<Measure | null> {
        return await AppDataSource
            .getRepository(Measure)
            .findOneBy({ measureUuid: uuid });
    }

    // Mapeia os dados da medição para a entidade Measure
    private mapToMeasure(measurement: Partial<IMeasurement>) {
        return {
            customerCode: measurement.customerCode,
            measureDatetime: measurement.measureDatetime,
            measureType: measurement.measureType,
            measureValue: measurement.measureValue,
            hasConfirmed: measurement.hasConfirmed ?? false,
            imageUrl: measurement.imageUrl ?? 'http://example.com/image.jpg'
        };
    }

    // Formata a resposta com os dados da medição
    private formatResponse(insertedMeasure: any) {
        return {
            image_url: insertedMeasure.imageUrl,
            measure_value: insertedMeasure.measureValue,
            measure_uuid: insertedMeasure.measureUuid
        };
    }
}

export { CreateWaterGasMeasurementService };
