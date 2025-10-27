import pool from '../config/config.js';

export class BikeRepository {
    // cria e retorna objeto criado - ATUALIZADO para novo schema
    static async create({ id_bike, name, circunferencia_m, pulses_per_rotation, description, user_id }) {
        const [result] = await pool.query(
            `INSERT INTO Bike (id_bike, name, circunferencia_m, pulses_per_rotation, description, user_id, status, last_seen) 
             VALUES (?, ?, ?, ?, ?, ?, 'offline', UTC_TIMESTAMP(6))`,
            [id_bike, name, circunferencia_m, pulses_per_rotation, description, user_id]
        );
        return { 
            id: result.insertId, 
            id_bike, 
            name, 
            circunferencia_m, 
            pulses_per_rotation, 
            description, 
            user_id,
            status: 'offline'
        };
    }

    static async getAll() {
        const [rows] = await pool.query('SELECT * FROM Bike ORDER BY id DESC');
        return rows;
    }

    static async getOne(id) {
        const [rows] = await pool.query('SELECT * FROM Bike WHERE id = ?', [id]);
        return rows[0] || null;
    }

    // 👇 NOVO MÉTODO - Buscar por id_bike (para IoT)
    static async getByIdBike(id_bike) {
        const [rows] = await pool.query('SELECT * FROM Bike WHERE id_bike = ?', [id_bike]);
        return rows[0] || null;
    }

    // 👇 NOVO MÉTODO - Buscar bikes do usuário
    static async getByUserId(user_id) {
        const [rows] = await pool.query('SELECT * FROM Bike WHERE user_id = ? ORDER BY id DESC', [user_id]);
        return rows;
    }

    static async update(id, { id_bike, name, circunferencia_m, pulses_per_rotation, description, status }) {
        const [result] = await pool.query(
            `UPDATE Bike SET id_bike = ?, name = ?, circunferencia_m = ?, pulses_per_rotation = ?, description = ?, status = ? WHERE id = ?`,
            [id_bike, name, circunferencia_m, pulses_per_rotation, description, status, id]
        );
        if (result.affectedRows === 0) return null;
        return this.getOne(id);
    }

    static async updateStatus(id, status) {
        const [result] = await pool.query(
            `UPDATE Bike SET status = ?, last_seen = UTC_TIMESTAMP(6) WHERE id = ?`,
            [status, id]
        );
        return result.affectedRows > 0;
    }

    static async updateLastSeen(id) {
        const [result] = await pool.query(
            `UPDATE Bike SET last_seen = UTC_TIMESTAMP(6) WHERE id = ?`,
            [id]
        );
        return result.affectedRows > 0;
    }

    static async delete(id) {
        const [result] = await pool.query('DELETE FROM Bike WHERE id = ?', [id]);
        return result.affectedRows > 0;
    }
}