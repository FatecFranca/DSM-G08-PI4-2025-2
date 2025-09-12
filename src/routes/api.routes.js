import { Router } from 'express';
import bikeRoutes from './bike/bike.routes.js';
import readingsRoutes from './readings/readings.routes.js';

const router = Router();
router.get('/health', (req, res) => res.json({ status: 'ok' }));

router.use('/bike', bikeRoutes);
router.use('/readings', readingsRoutes);

export default router;
