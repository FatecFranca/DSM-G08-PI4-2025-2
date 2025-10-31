// src/routes/auth.routes.js
import { Router } from 'express';
import { AuthController } from '../controllers/authController.js';
import { authenticateUser } from '../middlewares/authUser.js'; // ← Nome correto

const router = Router();

router.post('/register', AuthController.register);
router.post('/login', AuthController.login);
router.get('/profile', authenticateUser, AuthController.getProfile); // ← Nome correto

export default router;