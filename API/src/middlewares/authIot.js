import pool from '../config/config.js';

// Middleware SIMPLIFICADO - token permanente por usuário
export async function authIotSimple(req, res, next) {
    const token = req.header('x-iot-token');
    
    if (!token) {
        return res.status(401).json({ error: 'Token IoT não fornecido' });
    }

    try {
        // Verificar token direto na tabela Users
        const [userRows] = await pool.query(
            `SELECT id, email, name 
             FROM Users 
             WHERE iot_token = ?`,
            [token]
        );

        if (userRows.length === 0) {
            return res.status(401).json({ error: 'Token IoT inválido' });
        }

        const user = userRows[0];
        
        // Adicionar informações ao request
        req.user = {
            user_id: user.id,
            email: user.email,
            name: user.name
        };

        next();
    } catch (error) {
        console.error('Erro na autenticação IoT simplificada:', error);
        res.status(500).json({ error: 'Erro interno do servidor' });
    }
}