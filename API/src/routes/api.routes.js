import { Router } from 'express';
import authRoutes from './auth.routes.js';
import bikeRoutes from './bike/bike.routes.js';
import readingsRoutes from './readings/readings.routes.js';
import runsRoutes from './runs/runs.routes.js';
import estatisticasRoutes from './estatisticas.routes.js'; // 👈 NOVA ROTA
import pool from '../config/config.js';

const router = Router();

router.get('/health', async (req, res) => {
    try {
        const healthCheck = {
            status: 'ok',
            timestamp: new Date().toISOString(),
            uptime: process.uptime(),
            memory: process.memoryUsage(),
            database: 'checking'
        };

        try {
            const [rows] = await pool.query('SELECT 1 as db_status');
            healthCheck.database = 'connected';
            healthCheck.db_status = rows[0].db_status;
        } catch (dbError) {
            healthCheck.database = 'disconnected';
            healthCheck.db_error = dbError.message;
        }

        res.status(200).json(healthCheck);
    } catch (error) {
        res.status(500).json({
            status: 'error',
            timestamp: new Date().toISOString(),
            error: error.message
        });
    }
});

router.get('/health/simple', (req, res) => {
    res.status(200).json({ 
        status: 'ok', 
        timestamp: new Date().toISOString(),
        service: 'bike-iot-api'
    });
});

router.get('/health/db', async (req, res) => {
    try {
        const [rows] = await pool.query('SELECT 1 as healthy, NOW() as db_time');
        res.status(200).json({
            database: 'healthy',
            db_time: rows[0].db_time,
            timestamp: new Date().toISOString()
        });
    } catch (error) {
        res.status(500).json({
            database: 'unhealthy',
            error: error.message,
            timestamp: new Date().toISOString()
        });
    }
});

router.use('/auth', authRoutes);
router.use('/bikes', bikeRoutes);
router.use('/readings', readingsRoutes);
router.use('/runs', runsRoutes);
router.use('/estatisticas', estatisticasRoutes);

export default router;