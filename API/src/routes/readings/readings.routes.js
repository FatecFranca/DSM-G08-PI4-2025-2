import { Router } from 'express';
import ReadingsController from '../../controllers/readingsController.js';
import { authIotToken } from '../../middlewares/authIotToken.js'; // 👈 MIDDLEWARE ATUALIZADO
import { readingsLimiter } from '../../middlewares/rateLimit.js';

const router = Router();

// Agora usa autenticação por token IoT
router.post('/', readingsLimiter, authIotToken, ReadingsController.create);

export default router;