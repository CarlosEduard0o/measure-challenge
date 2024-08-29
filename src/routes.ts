import { Router, Request, Response } from 'express';
import { WaterGasMeasurementController } from './controllers/WaterGasMeasurementController';

const router = Router();
const waterGasMeasurementController = new WaterGasMeasurementController();

router.get('/:customer_code/list', waterGasMeasurementController.handleList);


router.post('/upload', waterGasMeasurementController.handle)

router.patch('/confirm', waterGasMeasurementController.handlePatch)

export { router }