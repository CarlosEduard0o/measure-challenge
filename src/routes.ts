import { Router, Request, Response } from 'express';
import { WaterGasMeasurementController } from './controllers/WaterGasMeasurementController';
import { CustomerController } from './controllers/CustomerController';

const router = Router();
const waterGasMeasurementController = new WaterGasMeasurementController();
const customerController = new CustomerController();

router.get('/:customer_code/list', waterGasMeasurementController.handleList);

// Rota para listar um cliente por customerCode
router.get('/customers/:customerCode', customerController.handleListByCode.bind(customerController));

// Rota para listar todos os clientes
router.get('/customers', customerController.handleList.bind(customerController));

router.post('/upload', waterGasMeasurementController.handle)

// Rota para criar um novo cliente
router.post('/customers', customerController.handle.bind(customerController));

router.patch('/confirm', waterGasMeasurementController.handlePatch)

// Rota para atualizar um cliente existente
router.patch('/customers', customerController.handlePatch.bind(customerController));

export { router }

