// src/routes/api.routes.js
import { Router } from 'express';
import authRoutes from './auth.routes.js'; // ← Esta linha estava causando o erro
import bikeRoutes from './bike/bike.routes.js';
import iotRoutes from './iot/iot.routes.js';
import readingsRoutes from './readings/readings.routes.js';

const router = Router();

router.use('/auth', authRoutes);
router.use('/bikes', bikeRoutes);
router.use('/iot', iotRoutes);
router.use('/readings', readingsRoutes);

export default router;