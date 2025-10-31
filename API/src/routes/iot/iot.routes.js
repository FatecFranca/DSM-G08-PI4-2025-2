import { Router } from 'express';
import { IotTokenController } from '../../controllers/iotTokenController.js';
import { authenticateUser } from '../../middlewares/authUser.js';

const router = Router();

// Todas as rotas exigem autenticação de usuário
router.use(authenticateUser);

router.post('/tokens', IotTokenController.generateToken);
router.get('/tokens', IotTokenController.getUserTokens);
router.delete('/tokens/:token_id', IotTokenController.revokeToken);

export default router;