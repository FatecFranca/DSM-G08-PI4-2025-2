import pool from '../config/config.js';
import { v4 as uuidv4 } from 'uuid';

export class IotTokenController {
    // Gerar novo token para IoT
    static async generateToken(req, res) {
        try {
            const userId = req.userId;
            const { bike_id, device_name, expires_in_hours = 24 } = req.body;

            // Verificar se a bike pertence ao usuário
            const [bikeRows] = await pool.query(
                'SELECT id FROM Bike WHERE id = ? AND user_id = ?',
                [bike_id, userId]
            );

            if (bikeRows.length === 0) {
                return res.status(404).json({ error: 'Bike não encontrada ou não pertence ao usuário' });
            }

            // Gerar token único
            const token = `iot_${uuidv4()}`;
            const expiresAt = new Date();
            expiresAt.setHours(expiresAt.getHours() + expires_in_hours);

            // Inserir token no banco (agora na tabela Iot_token)
            const [result] = await pool.query(
                `INSERT INTO Iot_token (user_id, bike_id, token, device_name, expires_at) 
                 VALUES (?, ?, ?, ?, ?)`,
                [userId, bike_id, token, device_name, expiresAt]
            );

            res.status(201).json({
                token,
                expires_at: expiresAt,
                device_name,
                message: 'Token gerado com sucesso'
            });

        } catch (error) {
            console.error('Erro ao gerar token IoT:', error);
            res.status(500).json({ error: 'Erro interno do servidor' });
        }
    }

    // Listar tokens do usuário
    static async getUserTokens(req, res) {
        try {
            const userId = req.userId;

            const [tokens] = await pool.query(
                `SELECT it.*, b.name as bike_name 
                 FROM Iot_token it 
                 JOIN Bike b ON it.bike_id = b.id 
                 WHERE it.user_id = ? 
                 ORDER BY it.created_at DESC`,
                [userId]
            );

            res.json(tokens);
        } catch (error) {
            console.error('Erro ao buscar tokens:', error);
            res.status(500).json({ error: 'Erro interno do servidor' });
        }
    }

    // Revogar token
    static async revokeToken(req, res) {
        try {
            const userId = req.userId;
            const { token_id } = req.params;

            const [result] = await pool.query(
                'UPDATE Iot_token SET is_active = FALSE WHERE id = ? AND user_id = ?',
                [token_id, userId]
            );

            if (result.affectedRows === 0) {
                return res.status(404).json({ error: 'Token não encontrado' });
            }

            res.json({ message: 'Token revogado com sucesso' });
        } catch (error) {
            console.error('Erro ao revogar token:', error);
            res.status(500).json({ error: 'Erro interno do servidor' });
        }
    }
}