import { AppDataSource } from "./data-source";
import express from 'express';
import path from 'path';
import { router } from './routes';

const server = express();

// Configura o Express para usar JSON e rotas
server.use(express.json());
server.use(router);

// Servir arquivos estáticos da pasta 'uploads'
server.use('/uploads', express.static(path.join(__dirname, 'uploads')));

AppDataSource.initialize().then(async () => {

    console.log('Banco de dados conectado com sucesso.');

    // Inicia o servidor Express
    server.listen(5000, () => {
        console.log('Servidor rodando na porta 5000: http://localhost:5000/');
    });

}).catch(error => console.log(error));
