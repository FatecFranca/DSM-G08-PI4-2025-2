import pool from '../config/config.js';
import { io } from '../../server.js';
import { RunService } from './runService.js';

export class ReadingsService {
    static async processBatch(payload, options = {}) {
        if (!payload || payload.length === 0) return { inserted: 0 };

        // Mapear id_bike para a linha da bike
        const idBikes = [...new Set(payload.map(p => p.id_bike).filter(Boolean))];
        const bikesMap = {};
        if (idBikes.length) {
            const [rows] = await pool.query(
                'SELECT id, id_bike, circunferencia_m FROM Bike WHERE id_bike IN (?)',
                [idBikes]
            );
            for (const r of rows) bikesMap[r.id_bike] = r;
        }

        const placeholders = [];
        const values = [];

        for (const p of payload) {
            const bike = p.id_bike ? bikesMap[p.id_bike] : null;
            if (!bike) {
                console.warn('Leitura ignorada: id_bike não encontrada', p.id_bike);
                continue;
            }

            // Usar RunService para obter run ativa
            let runId = p.run_id;
            if (!runId) {
                const activeRun = await RunService.getOrCreateActiveRun(bike.id);
                runId = activeRun.id;
            }

            const rotacao_regis = p.ts ? new Date(p.ts).toISOString().slice(0, 19).replace('T', ' ') : 
                                       new Date().toISOString().slice(0, 19).replace('T', ' ');
            
            const rotacao_next = p.delta_us || 0;

            // Calcular velocidade
            let speed_kmh = null;
            if (rotacao_next > 0) {
                const distancia_por_rotacao = bike.circunferencia_m;
                const tempo_segundos = rotacao_next / 1000000;
                const velocidade_ms = distancia_por_rotacao / tempo_segundos;
                speed_kmh = velocidade_ms * 3.6;
                
                if (speed_kmh > 200) {
                    console.warn('Velocidade inválida ignorada:', speed_kmh);
                    continue;
                }
            }

            placeholders.push('(?, ?, ?, ?)');
            values.push(
                bike.id,
                runId,
                rotacao_regis,
                rotacao_next
            );

            // Emitir via WebSocket (se configurado)
            if (speed_kmh !== null && io) {
                io.to(bike.id_bike).emit('speed_update', {
                    bike_id: bike.id_bike,
                    speed_kmh: Number(speed_kmh.toFixed(1)),
                    timestamp: rotacao_regis
                });
            }
        }

        if (placeholders.length === 0) return { inserted: 0 };

        // Inserir na tabela Dados
        const sql = `
            INSERT INTO Dados (id_bike, id_run, rotacao_regis, rotacao_next)
            VALUES ${placeholders.join(',')}
        `;
        
        const [result] = await pool.query(sql, values);
        return { inserted: result.affectedRows };
    }
}