import { Router } from 'express';
import ReadingsController from '../../controllers/readingsController.js';
import { requireDevice } from '../../middlewares/authDevice.js';
import { readingsLimiter } from '../../middlewares/rateLimit.js';

const router = Router();

router.post('/', readingsLimiter, requireDevice, ReadingsController.create);

export default router;
