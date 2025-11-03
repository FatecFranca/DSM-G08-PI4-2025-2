import { Router } from 'express';
import ReadingsController from '../../controllers/readingsController.js';
import { authIotSimple } from '../../middlewares/authIot.js'; // 👈 MIDDLEWARE SIMPLIFICADO
import { readingsLimiter } from '../../middlewares/rateLimit.js';

const router = Router();

// Agora usa autenticação simplificada
router.post('/', readingsLimiter, authIotSimple, ReadingsController.create);

export default router;