import { Router } from 'express';
import bikeRoutes from './bike/bike.routes.js';
import readingsRoutes from './readings/readings.routes.js';
import authRoutes from './auth.routes.js';
import runsRoutes from './runs/runs.routes.js'; // <- novo
//import iotRoutes from './iot/iot.routes.js';
import pool from '../config/config.js'; // 👈 IMPORTE O POOL

const router = Router();

// 🔥 ROTA HEALTH COMPLETA
router.get('/health', async (req, res) => {
    try {
        const healthCheck = {
            status: 'ok',
            timestamp: new Date().toISOString(),
            uptime: process.uptime(),
            memory: process.memoryUsage(),
            database: 'checking'
        };

        // Verificar conexão com o banco
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

// 🔥 ROTA HEALTH SIMPLES (para IoT)
router.get('/health/simple', (req, res) => {
    res.status(200).json({ 
        status: 'ok', 
        timestamp: new Date().toISOString(),
        service: 'bike-iot-api'
    });
});

// 🔥 ROTA HEALTH DO BANCO (só verifica database)
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

// Suas rotas normais
router.use('/auth', authRoutes);
router.use('/bike', bikeRoutes);
router.use('/readings', readingsRoutes);
router.use('/runs', runsRoutes);
//router.use('/iot', iotRoutes);

export default router;