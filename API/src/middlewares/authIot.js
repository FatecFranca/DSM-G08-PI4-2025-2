import pool from '../config/config.js';

// Autenticação simplificada para IoT - usa a tabela Bike
const simpleIotAuth = async (req, res, next) => {
    const bikeId = req.header('x-bike-id');
    
    if (!bikeId) {
        return res.status(401).json({ error: 'x-bike-id header required' });
    }

    try {
        // Verificar se a bike existe na tabela Bike
        const [rows] = await pool.query(
            'SELECT id, id_bike, circunferencia_m FROM Bike WHERE id_bike = ?', 
            [bikeId]
        );
        
        if (!rows || rows.length === 0) {
            return res.status(401).json({ error: 'Bike not registered' });
        }

        req.bike = rows[0];
        
        // Atualizar last_seen
        await pool.query(
            'UPDATE Bike SET last_seen = UTC_TIMESTAMP(6) WHERE id = ?', 
            [rows[0].id]
        );
        
        next();
    } catch (err) {
        console.error('authIot error', err);
        res.status(500).json({ error: 'Erro na autenticação IoT' });
    }
}

export { simpleIotAuth };