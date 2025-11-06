// src/middlewares/authIot.js
import jwt from 'jsonwebtoken';
import pool from '../config/config.js';

const JWT_SECRET = process.env.JWT_SECRET || 'seu_jwt_secreto_aqui';

export async function authIotSimple(req, res, next) {
    try {
        // 1) Verifica header x-iot-token primeiro (sensores podem usar esse)
        const iotTokenHeader = req.header('x-iot-token') || req.header('authorization');

        // 2) Se veio como Authorization: Bearer <token>, extrai
        let token = null;
        if (req.header('x-iot-token')) token = req.header('x-iot-token');
        else if (req.header('authorization') && req.header('authorization').startsWith('Bearer ')) {
            token = req.header('authorization').replace('Bearer ', '');
        }

        if (!token) return res.status(401).json({ error: 'Token IoT/JWT necessário' });

        // 3) Tenta decodificar como JWT
        try {
            const decoded = jwt.verify(token, JWT_SECRET);
            if (decoded.userId) {
                req.user = { user_id: decoded.userId, email: decoded.email };
                return next();
            }
        } catch (jwtErr) {
            // não é JWT; segue para buscar iot_token
        }

        // 4) Verifica se token existe em Users.iot_token
        const [rows] = await pool.query('SELECT id, email FROM Users WHERE iot_token = ?', [token]);
        if (rows.length === 0) return res.status(401).json({ error: 'Token inválido' });

        req.user = { user_id: rows[0].id, email: rows[0].email };
        return next();

    } catch (err) {
        console.error('authIotSimple error:', err);
        return res.status(500).json({ error: 'Erro na autenticação IoT' });
    }
}
