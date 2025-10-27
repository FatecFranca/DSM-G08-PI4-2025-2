import pool from '../config/config.js';
import { v4 as uuidv4 } from 'uuid';

export class RunService {
    static async getOrCreateActiveRun(bikeId) {
        try {
            // Buscar run ativa para a bike
            const [rows] = await pool.query(
                'SELECT id, id_run FROM Run WHERE bike_id = ? AND status = "active" LIMIT 1',
                [bikeId]
            );

            if (rows.length > 0) {
                return rows[0];
            }

            // Criar nova run ativa
            const runId = `run_${Date.now()}_${uuidv4().slice(0, 8)}`;
            const [result] = await pool.query(
                `INSERT INTO Run (id_run, bike_id, status, started_at) 
                 VALUES (?, ?, "active", UTC_TIMESTAMP(6))`,
                [runId, bikeId]
            );

            return { id: result.insertId, id_run: runId };
        } catch (error) {
            console.error('Erro em getOrCreateActiveRun:', error);
            throw error;
        }
    }

    static async endRun(runId) {
        await pool.query(
            'UPDATE Run SET status = "completed", ended_at = UTC_TIMESTAMP(6) WHERE id = ?',
            [runId]
        );
    }

    static async getRunStats(runId) {
        const [rows] = await pool.query(
            `SELECT 
                COUNT(*) as total_pulsos,
                MIN(rotacao_regis) as inicio,
                MAX(rotacao_regis) as fim
             FROM Dados 
             WHERE id_run = ?`,
            [runId]
        );
        return rows[0] || null;
    }
}