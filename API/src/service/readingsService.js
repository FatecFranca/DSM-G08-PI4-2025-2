// src/service/readingsService.js
import pool from '../config/config.js';
import { io } from '../../server.js';
import { randomUUID } from 'crypto';

function computeSpeedKmh(circunferencia_m, delta_us) {
    if (!delta_us || delta_us <= 0) return null;
    const tempo_s = delta_us / 1_000_000;
    const v_ms = circunferencia_m / tempo_s;
    return v_ms * 3.6;
}

export class ReadingsService {
    static async processBatch(payload, user) {
        if (!payload || payload.length === 0) return { inserted: 0 };

        const placeholders = [];
        const values = [];

        // cache para run por bike.id (evita nova query/insert a cada leitura na mesma bike)
        const bikeRunCache = new Map();

        for (const p of payload) {
            const bikeUuid = p.bike_uuid;
            if (!bikeUuid) {
                console.warn('Leitura ignorada: bike_uuid não fornecido');
                continue;
            }

            // Buscar bike e verificar se pertence ao usuário
            const [bikeRows] = await pool.query(
                `SELECT id, circunferencia_m FROM Bike WHERE id_bike = ? AND user_id = ?`,
                [bikeUuid, user.user_id]
            );
            if (bikeRows.length === 0) {
                console.warn('Leitura ignorada: bike não encontrada ou não pertence ao usuário', bikeUuid);
                continue;
            }
            const bike = bikeRows[0];

            // obter id_run NUMÉRICO da run ativa (ou criar se não existir)
            let runNumericId = null;

            if (p.run_id) {
                // se veio id_run (string) do payload — transformar para id numérico
                const [runRowsByString] = await pool.query('SELECT id FROM Run WHERE id_run = ? AND user_id = ?', [p.run_id, user.user_id]);
                if (runRowsByString.length) runNumericId = runRowsByString[0].id;
            }

            if (!runNumericId) {
                // checar cache
                if (bikeRunCache.has(bike.id)) {
                    runNumericId = bikeRunCache.get(bike.id);
                } else {
                    // buscar run ativa para essa bike e usuário
                    const [activeRunRows] = await pool.query(
                        'SELECT id, id_run FROM Run WHERE bike_id = ? AND user_id = ? AND status = "active" ORDER BY started_at DESC LIMIT 1',
                        [bike.id, user.user_id]
                    );

                    if (activeRunRows.length) {
                        runNumericId = activeRunRows[0].id;
                        bikeRunCache.set(bike.id, runNumericId);
                    } else {
                        // NÃO HÁ run ativa -> cria automaticamente (com id_run gerado)
                        const newIdRun = `run_${randomUUID()}`;
                        const [ins] = await pool.query(
                            'INSERT INTO Run (id_run, user_id, bike_id, name, status, started_at) VALUES (?, ?, ?, ?, "active", NOW())',
                            [newIdRun, user.user_id, bike.id, 'Auto run']
                        );
                        runNumericId = ins.insertId;
                        bikeRunCache.set(bike.id, runNumericId);
                    }
                }
            }

            // montar leitura
            const rotacao_regis = p.ts ? new Date(p.ts) : new Date();
            const rotacao_next = p.delta_us || 0;

            placeholders.push('(?, ?, ?, ?)');
            values.push(bike.id, runNumericId, rotacao_regis, rotacao_next);

            // emitir socket (se houver)
            if (rotacao_next > 0 && io) {
                const distancia_por_rotacao = bike.circunferencia_m;
                const tempo_segundos = rotacao_next / 1000000;
                if (tempo_segundos > 0) {
                    const velocidade_ms = distancia_por_rotacao / tempo_segundos;
                    const speedKmh = velocidade_ms * 3.6;

                    if (speedKmh <= 200) {
                        io.to(bikeUuid).emit('speed_update', {
                            bike_id: bikeUuid,
                            speed_kmh: Number(speedKmh.toFixed(1)),
                            timestamp: rotacao_regis,
                            delta_us: rotacao_next
                        });
                    }
                }
            }
        } // end for

        if (placeholders.length === 0) return { inserted: 0 };

        const sql = `INSERT INTO Dados (id_bike, id_run, rotacao_regis, rotacao_next) VALUES ${placeholders.join(',')}`;
        const [result] = await pool.query(sql, values);

        return {
            inserted: result.affectedRows,
            user_id: user.user_id
        };
    }
}
