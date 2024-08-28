import { AppDataSource } from "../data-source";
import { Measure } from "../entity/Measure";
import { v4 as uuidv4 } from 'uuid';

enum MeasurementType {
    WATER = "WATER",
    GAS = "GAS"
}

interface IMeasurement {
    uuid: string,
    customerCode: String
    measureDatetime: Date
    measureType: MeasurementType
    measureValue: number, // Valor da medição
    hasConfirmed: boolean, // Confirmação (opcional)
    imageUrl: String,
    // createdAt: Date; // Data e hora de criação
    // updatedAt: Date; // Data e hora da última atualização
}

class CreateWaterGasMeasurementService {
    async execute({ uuid, customerCode, measureDatetime, measureType, measureValue, hasConfirmed, imageUrl }: IMeasurement) {
        //Por enquanto simulando que esse array data é um banco de dados

        //aqui seria a persistência
        //Ao que parece eu vou gerar a url temporária aqui, pedir para o Gemini ler o valor aqui e também o uuid aqui
        //Isso tudo será retornado.
        //Aqui eu teria que colocar dentro de data:
        // {
        //     “image_url”: string,
        //     “measure_value”:integer,
        //     “measure_uuid”: string
        // }
        //Justamente para retornar isso

        const measure = await AppDataSource
            .createQueryBuilder()
            .insert()
            .into(Measure)
            .values([
                {
                    //measureUuid: uuid,
                    customerCode: 'CUST001', // Código do cliente
                    measureDatetime: new Date(), // Data e hora da medição
                    measureType: 'Water', // Tipo de medição
                    measureValue: 5000, // Valor da medição
                    hasConfirmed: false, // Confirmação (opcional)
                    imageUrl: 'http://example.com/image.jpg' // URL da imagem (opcional)
                },
            ])
            .execute()
        console.log(measure);
        return measure;
    }


    // Método para atualizar parcialmente uma medição (PATCH)
    async handlePatch(request: Request, response: Response) {
        try {
            const measureUuid = request.params.id;
            const updateData = request.body;

            const result = await this.measureService.updateMeasure(measureUuid, updateData);

            if (result.affected === 0) {
                return response.status(404).json({ error: 'Measure not found' });
            }

            response.status(200).json({ message: 'Measure updated successfully' });
        } catch (error) {
            response.status(500).json({ error: error.message });
        }
    }

    // Método para obter todas as medidas de um usuário
    async getAllMeasuresForUser(request: Request, response: Response) {
        try {
            const { customerCode } = request.params;

            const measures = await this.measureService.getAllMeasuresForUser(customerCode);

            if (measures.length === 0) {
                return response.status(404).json({ error: 'No measures found for this customer' });
            }

            response.status(200).json(measures);
        } catch (error) {
            response.status(500).json({ error: error.message });
        }
    }


}



// PATCH
// await dataSource
//     .createQueryBuilder()
//     .update(User)
//     .set({ firstName: "Timber", lastName: "Saw" })
//     .where("id = :id", { id: 1 })
//     .execute()



// //GET 
export { CreateWaterGasMeasurementService }