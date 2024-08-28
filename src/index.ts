import { AppDataSource } from "./data-source";
import express from 'express';
import { Measure } from "./entity/Measure";
import { Customer } from "./entity/Customer";
import { router } from './routes';

const server = express();

// Configura o Express para usar JSON e rotas
server.use(express.json());
server.use(router);

AppDataSource.initialize().then(async () => {

    // Inserindo um novo cliente no banco de dados
    // console.log("Inserting a new customer into the database...");
    // const customer = new Customer();
    // customer.customerCode = "CUST001";
    // customer.name = "John Doe";
    // await AppDataSource.manager.save(customer);
    // console.log("Saved a new customer with customerCode: " + customer.customerCode);

    // Inserindo uma nova medição no banco de dados
    // console.log("Inserting a new measure into the database...");
    // const measure = new Measure();
    // measure.customerCode = customer.customerCode;
    // measure.measureDatetime = new Date();
    // measure.measureType = "Water";
    // measure.measureValue = 100;
    // await AppDataSource.manager.save(measure);
    // console.log("Saved a new measure with measureUuid: " + measure.measureUuid);

    // Carregando todos os clientes do banco de dados
    // console.log("Loading customers from the database...");
    // const customers = await AppDataSource.manager.find(Customer);
    // console.log("Loaded customers: ", customers);

    // Carregando todas as medições do banco de dados
    // console.log("Loading measures from the database...");
    // const measures = await AppDataSource.manager.find(Measure);
    // console.log("Loaded measures: ", measures);

    // console.log("Here you can setup and run express / fastify / any other framework.");

    console.log('Banco de dados conectado com sucesso.');

    // Inicia o servidor Express
    server.listen(5000, () => {
        console.log('Servidor rodando na porta 5000: http://localhost:5000/');
    });

}).catch(error => console.log(error));
