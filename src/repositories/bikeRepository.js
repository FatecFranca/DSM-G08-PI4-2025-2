import pool from '../config/config.js';
import { v4 as uuidv4 } from 'uuid';

export class BikeRepository {
    // cria e retorna objeto criado
    static async create({ nome, circunferencia_m, pulses_per_rotation }) {
        const uuid = uuidv4();
        const [result] = await pool.query(
            `INSERT INTO bikes (uuid, nome, circunferencia_m, pulses_per_rotation, created_at)
       VALUES (?, ?, ?, ?, UTC_TIMESTAMP(6))`,
            [uuid, nome ?? null, circunferencia_m ?? 0, pulses_per_rotation ?? 1]
        );
        return { id: result.insertId, uuid, nome, circunferencia_m, pulses_per_rotation };
    }

    static async getAll() {
        const [rows] = await pool.query('SELECT * FROM bikes ORDER BY id DESC');
        return rows;
    }

    static async getOne(id) {
        const [rows] = await pool.query('SELECT * FROM bikes WHERE id = ?', [id]);
        return rows[0] || null;
    }

    static async update(id, { nome, circunferencia_m, pulses_per_rotation }) {
        const [result] = await pool.query(
            `UPDATE bikes SET nome = ?, circunferencia_m = ?, pulses_per_rotation = ? WHERE id = ?`,
            [nome, circunferencia_m, pulses_per_rotation, id]
        );
        if (result.affectedRows === 0) return null;
        return this.getOne(id);
    }

    static async delete(id) {
        const [result] = await pool.query('DELETE FROM bikes WHERE id = ?', [id]);
        return result.affectedRows > 0;
    }
}
