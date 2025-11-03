import pool from '../config/config.js';
import { io } from '../../server.js';

export class ReadingsService {
    static async processBatch(payload, user) {
        if (!payload || payload.length === 0) return { inserted: 0 };

        const placeholders = [];
        const values = [];

        for (const p of payload) {
            const bikeUuid = p.bike_uuid;
            if (!bikeUuid) {
                console.warn('Leitura ignorada: bike_uuid não fornecido');
                continue;
            }

            // Buscar bike pelo UUID e verificar se pertence ao usuário
            const [bikeRows] = await pool.query(
                `SELECT id, circunferencia_m FROM Bike WHERE id_bike = ? AND user_id = ?`,
                [bikeUuid, user.user_id]
            );

            if (bikeRows.length === 0) {
                console.warn('Leitura ignorada: bike não encontrada ou não pertence ao usuário', bikeUuid);
                continue;
            }

            const bike = bikeRows[0];
            const runId = p.run_id || 1; // Run fixa por enquanto
            const rotacao_regis = p.ts ? new Date(p.ts) : new Date();
            const rotacao_next = p.delta_us || 0;

            placeholders.push('(?, ?, ?, ?)');
            values.push(bike.id, runId, rotacao_regis, rotacao_next);

            // Cálculo SIMPLIFICADO da velocidade (1 pulso por rotação)
            if (rotacao_next > 0 && io) {
                const distancia_por_rotacao = bike.circunferencia_m;
                const tempo_segundos = rotacao_next / 1000000;
                const velocidade_ms = distancia_por_rotacao / tempo_segundos;
                const speedKmh = velocidade_ms * 3.6;
                
                if (speedKmh <= 200) { // Filtro de velocidade máxima
                    io.to(bikeUuid).emit('speed_update', {
                        bike_id: bikeUuid,
                        speed_kmh: Number(speedKmh.toFixed(1)),
                        timestamp: rotacao_regis,
                        delta_us: rotacao_next
                    });
                }
            }
        }

        if (placeholders.length === 0) return { inserted: 0 };

        const sql = `INSERT INTO Dados (id_bike, id_run, rotacao_regis, rotacao_next) VALUES ${placeholders.join(',')}`;
        const [result] = await pool.query(sql, values);
        
        return { 
            inserted: result.affectedRows,
            user_id: user.user_id 
        };
    }
}