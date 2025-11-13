// src/routes/auth.routes.js
import { Router } from 'express';
import { AuthController } from '../controllers/authController.js';
import { authenticateUser } from '../middlewares/authUser.js';

const router = Router();

router.post('/register', AuthController.register);
router.post('/login', AuthController.login);
router.get('/profile', authenticateUser, AuthController.getProfile);

router.post('/iot/generate', authenticateUser, AuthController.generateIotToken);
router.get('/iot', authenticateUser, AuthController.getIotToken);
router.post('/logout', authenticateUser, AuthController.logout);

export default router;