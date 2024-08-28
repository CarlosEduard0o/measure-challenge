enum MeasurementType{
    WATER = "WATER",
    GAS = "GAS"
}

interface IMeasurement {
    image: String
    customer_code: String
    measure_datetime: Date
    measure_type: MeasurementType
}

class CreateWaterGasMeasurementService {
    execute({ image, customer_code, measure_datetime, measure_type} : IMeasurement){
        //Por enquanto simulando que esse array data é um banco de dados
        const data = [];

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

        const image_url = image+"url";
        const measure_value = 5000;
        const measure_uuid = "AKAa45647a8654a654"

        data.push({image_url, measure_value, measure_uuid});
        return data;
    }
}

export { CreateWaterGasMeasurementService }