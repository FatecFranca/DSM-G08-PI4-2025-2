import pool from '../config/config.js';

// Middleware que valida header x-device-uuid e atualiza last_seen.
// Se não houver device_uuid, deixa passar (para endpoints públicos). Para /v1/readings será aplicado explicitamente.
export async function requireDevice(req, res, next) {
    const device_uuid = req.header('x-device-uuid');
    if (!device_uuid) return res.status(401).json({ error: 'x-device-uuid header required' });

    try {
        const [rows] = await pool.query('SELECT id FROM devices WHERE device_uuid = ?', [device_uuid]);
        if (!rows || rows.length === 0) return res.status(401).json({ error: 'device not registered' });

        req.device = rows[0]; // { id }
        // atualiza last_seen (silenciosamente)
        await pool.query('UPDATE devices SET last_seen = UTC_TIMESTAMP(6) WHERE id = ?', [rows[0].id]);
        next();
    } catch (err) {
        console.error('authDevice error', err);
        res.status(500).json({ error: 'Erro ao autenticar device' });
    }
}
