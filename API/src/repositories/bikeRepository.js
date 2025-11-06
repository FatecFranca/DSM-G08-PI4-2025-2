import pool from '../config/config.js';

export class BikeRepository {
    // REMOVIDO pulses_per_rotation
    async create({ id_bike, name, circunferencia_m, description, user_id }) {
        const [result] = await pool.query(
            `INSERT INTO Bike (id_bike, name, circunferencia_m, description, user_id, status, last_seen) 
             VALUES (?, ?, ?, ?, ?, 'offline', UTC_TIMESTAMP(6))`,
            [id_bike, name, circunferencia_m, description, user_id]
        );
        return { 
            id: result.insertId, 
            id_bike, 
            name, 
            circunferencia_m, 
            description, 
            user_id,
            status: 'offline'
        };
    }

    async getAll() {
        const [rows] = await pool.query('SELECT * FROM Bike ORDER BY id DESC');
        return rows;
    }

    async getOne(id) {
        const [rows] = await pool.query('SELECT * FROM Bike WHERE id = ?', [id]);
        return rows[0] || null;
    }

    async getByIdBike(id_bike) {
        const [rows] = await pool.query('SELECT * FROM Bike WHERE id_bike = ?', [id_bike]);
        return rows[0] || null;
    }

    async getByUserId(user_id) {
        const [rows] = await pool.query('SELECT * FROM Bike WHERE user_id = ? ORDER BY id DESC', [user_id]);
        return rows;
    }

    // REMOVIDO pulses_per_rotation
    async update(id, { id_bike, name, circunferencia_m, description, status }) {
        const [result] = await pool.query(
            `UPDATE Bike SET id_bike = ?, name = ?, circunferencia_m = ?, description = ?, status = ? WHERE id = ?`,
            [id_bike, name, circunferencia_m, description, status, id]
        );
        if (result.affectedRows === 0) return null;
        return this.getOne(id);
    }

    async updateStatus(id, status) {
        const [result] = await pool.query(
            `UPDATE Bike SET status = ?, last_seen = UTC_TIMESTAMP(6) WHERE id = ?`,
            [status, id]
        );
        return result.affectedRows > 0;
    }

    async updateLastSeen(id) {
        const [result] = await pool.query(
            `UPDATE Bike SET last_seen = UTC_TIMESTAMP(6) WHERE id = ?`,
            [id]
        );
        return result.affectedRows > 0;
    }

    async delete(id) {
        const [result] = await pool.query('DELETE FROM Bike WHERE id = ?', [id]);
        return result.affectedRows > 0;
    }
}