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

    console.log('Banco de dados conectado com sucesso.');

    // Inicia o servidor Express
    server.listen(5000, () => {
        console.log('Servidor rodando na porta 5000: http://localhost:5000/');
    });

}).catch(error => console.log(error));
