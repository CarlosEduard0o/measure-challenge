import { Router, Request, Response } from 'express';
import { WaterGasMeasurementController } from './controllers/WaterGasMeasurementController';

const router = Router();
const waterGasMeasurementController = new WaterGasMeasurementController();

router.get('/', (request: Request, response: Response) => {
    //TODAS AS FUNCIONALIDADES DESSA ROTA
    return response.json({ mensagem: "Bem vindo a nossa API" })
})

router.post('/upload', waterGasMeasurementController.handle)

export { router }