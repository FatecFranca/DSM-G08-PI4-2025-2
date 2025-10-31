import pool from '../config/config.js';

// Middleware para autenticar dispositivos IoT via token
export async function authIotToken(req, res, next) {
    const token = req.header('x-iot-token');
    
    if (!token) {
        return res.status(401).json({ error: 'Token IoT não fornecido' });
    }

    try {
        // Verificar token no banco (agora na tabela Iot_token)
        const [tokenRows] = await pool.query(
            `SELECT it.*, u.id as user_id, u.email, b.id_bike 
             FROM Iot_token it 
             JOIN Users u ON it.user_id = u.id 
             JOIN Bike b ON it.bike_id = b.id 
             WHERE it.token = ? AND it.is_active = TRUE AND it.expires_at > UTC_TIMESTAMP(6)`,
            [token]
        );

        if (tokenRows.length === 0) {
            return res.status(401).json({ error: 'Token inválido, expirado ou revogado' });
        }

        const iotToken = tokenRows[0];
        
        // Adicionar informações ao request
        req.iot = {
            token_id: iotToken.id,
            user_id: iotToken.user_id,
            bike_id: iotToken.bike_id,
            bike_identifier: iotToken.id_bike,
            device_name: iotToken.device_name
        };

        // Atualizar last_seen da bike
        await pool.query(
            'UPDATE Bike SET last_seen = UTC_TIMESTAMP(6) WHERE id = ?',
            [iotToken.bike_id]
        );

        next();
    } catch (error) {
        console.error('Erro na autenticação IoT:', error);
        res.status(500).json({ error: 'Erro interno do servidor' });
    }
}