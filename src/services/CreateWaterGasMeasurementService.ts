import { AppDataSource } from "../data-source";
import { Measure } from "../entity/Measure";
import { v4 as uuidv4 } from 'uuid';

enum MeasurementType {
    WATER = "WATER",
    GAS = "GAS"
}

interface IMeasurement {
    uuid: string,
    customerCode: string,
    measureDatetime: Date,
    measureType: MeasurementType,
    measureValue: number, // Valor da medição
    hasConfirmed: boolean, // Confirmação (opcional)
    imageUrl: String,
    // createdAt: Date; // Data e hora de criação
    // updatedAt: Date; // Data e hora da última atualização
}

class CreateWaterGasMeasurementService {
    async execute({ uuid, customerCode, measureDatetime, measureType, measureValue, hasConfirmed, imageUrl }: IMeasurement) {

        //Ao que parece eu vou gerar a url temporária aqui, pedir para o Gemini ler o valor aqui e também o uuid aqui

        const measure = await AppDataSource
            .createQueryBuilder()
            .insert()
            .into(Measure)
            .values([
                {
                    //measureUuid: uuid,
                    customerCode: customerCode, // Código do cliente
                    measureDatetime: new Date(), // Data e hora da medição
                    measureType: measureType, // Tipo de medição
                    measureValue: measureValue, // Valor da medição
                    hasConfirmed: false, // Confirmação (opcional)
                    imageUrl: 'http://example.com/image.jpg' // URL da imagem (opcional)
                },
            ])
            .returning(['measureUuid', 'imageUrl', 'measureValue'])
            .execute();

        const insertedMeasure = measure.generatedMaps[0];

        const response = {
            image_url: insertedMeasure.imageUrl,
            measure_value: insertedMeasure.measureValue,
            measure_uuid: insertedMeasure.measureUuid,
        };

        console.log(response);
        return response;
    }

    async update({
        uuid,
        customerCode,
        measureDatetime,
        measureType,
        measureValue,
        hasConfirmed,
        imageUrl
    }: {
        uuid: string;
        customerCode?: string;
        measureDatetime?: Date;
        measureType?: string;
        measureValue?: number;
        hasConfirmed?: boolean;
        imageUrl?: string;
    }): Promise<void> {
        console.log('Atualizando medição com os seguintes dados:', {
            uuid,
            customerCode,
            measureDatetime,
            measureType,
            measureValue,
            hasConfirmed,
            imageUrl
        });
    
        const result = await AppDataSource
        .createQueryBuilder()
        .update(Measure)
        .set({
            customerCode,
            measureDatetime,
            measureType,
            measureValue,
            hasConfirmed,
            imageUrl
        })
        .where("measureUuid = :uuid", { uuid })
        .execute();
    
    console.log('Resultado da atualização:', result);
    
    }

    async findByUuid(uuid: string): Promise<Measure | null> {
        return await AppDataSource
            .getRepository(Measure)
            .findOneBy({ measureUuid: uuid });
    }

}


export { CreateWaterGasMeasurementService }