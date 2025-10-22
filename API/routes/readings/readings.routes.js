import { Router } from 'express';
import ReadingsController from '../../controllers/readingsController.js';
import { simpleIotAuth } from '../../middlewares/authIot.js'; // 👈 CORRIGIDO
import { readingsLimiter } from '../../middlewares/rateLimit.js';

const router = Router();

router.post('/', readingsLimiter, simpleIotAuth, ReadingsController.create);

export default router;