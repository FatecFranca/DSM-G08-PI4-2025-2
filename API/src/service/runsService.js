import pool from '../config/config.js';
import { randomUUID } from 'crypto';

// util (mantive sua função original)
function computeSpeedKmh(circunference_m, delta_us) {
    if (!delta_us || delta_us <= 0) return null;
    const tempo_s = delta_us / 1_000_000;
    if (tempo_s <= 0) return null;
    const v_ms = circunference_m / tempo_s;
    return v_ms * 3.6;
}

// NOVA util: calcula velocidade média (km/h) a partir de um array de delta_us (microsegundos)
// usa fórmula: avg_speed = (N * circ) / (sum(delta_us)/1e6) convertendo para km/h
function computeAverageSpeedKmhFromDeltas(circunference_m, deltasUsArray) {
    if (!Array.isArray(deltasUsArray) || deltasUsArray.length === 0) return null;
    // filtra apenas >0
    const valid = deltasUsArray.map(d => Number(d)).filter(d => d > 0);
    if (valid.length === 0) return null;

    // soma de todos os delta_us
    const sumDeltaUs = valid.reduce((acc, x) => acc + x, 0); // em microssegundos
    if (sumDeltaUs <= 0) return null;

    const n = valid.length;
    // total distance em metros = n * circunferencia_m
    const totalDistanceM = n * Number(circunference_m);
    const totalTimeS = sumDeltaUs / 1_000_000; // converte micros -> s
    if (totalTimeS <= 0) return null;

    const avgMs = totalDistanceM / totalTimeS; // m/s
    const avgKmh = avgMs * 3.6;
    return avgKmh;
}

export class RunsService {
    // cria run — aceita bike_uuid (id_bike) ou bike id numérico
    static async createRun(payload, user) {
        const { bike_uuid, bike_id, name } = payload;
        if (!bike_uuid && !bike_id) throw new Error('bike_uuid ou bike_id é necessário');

        // buscar bike e validar pertencimento
        let bikeRow;
        if (bike_uuid) {
            const [rows] = await pool.query('SELECT id, id_bike, user_id FROM Bike WHERE id_bike = ?', [bike_uuid]);
            bikeRow = rows[0];
        } else {
            const [rows] = await pool.query('SELECT id, id_bike, user_id FROM Bike WHERE id = ?', [bike_id]);
            bikeRow = rows[0];
        }

        if (!bikeRow) throw new Error('Bike não encontrada');
        if (bikeRow.user_id !== user.user_id) throw new Error('Bike não pertence ao usuário');

        const id_run = payload.id_run || `run_${randomUUID()}`; // id_run string
        const sql = `INSERT INTO Run (id_run, user_id, bike_id, name, status) VALUES (?, ?, ?, ?, 'active')`;
        const [result] = await pool.query(sql, [id_run, user.user_id, bikeRow.id, name || null]);

        return {
            id: result.insertId,
            id_run,
            bike_id: bikeRow.id,
            name: name || null,
            status: 'active'
        };
    }

    // retorna métricas: leitura_count, distance_m, duration_s, avg_kmh, max_kmh, last_reading
    static async getRunMetrics(id_run, user) {
        // validar run e circunferencia
        const [runRows] = await pool.query(
            'SELECT R.id, R.id_run, R.started_at, R.ended_at, R.status, B.circunferencia_m FROM Run R JOIN Bike B ON R.bike_id = B.id WHERE R.id_run = ? AND R.user_id = ?',
            [id_run, user.user_id]
        );
        if (!runRows || runRows.length === 0) return null;
        const run = runRows[0];
        const circ = Number(run.circunferencia_m);

        // agregados (contagem de leituras válidas e somas)
        const [aggRows] = await pool.query(
            `SELECT 
         COUNT(CASE WHEN rotacao_next > 0 THEN 1 END) AS valid_readings_count,
         SUM(NULLIF(rotacao_next,0)) AS sum_rot_us,
         MIN(NULLIF(rotacao_next,0)) AS min_rot_us,
         MAX(NULLIF(rotacao_next,0)) AS max_rot_us,
         MAX(rotacao_regis) AS last_ts
       FROM Dados
       WHERE id_run = ?`,
            [run.id]
        );

        const agg = aggRows[0];
        const readings_count = Number(agg.valid_readings_count || 0);
        const sum_rot_us = agg.sum_rot_us ? Number(agg.sum_rot_us) : 0;
        const min_rot_us = agg.min_rot_us ? Number(agg.min_rot_us) : null;
        const total_time_s = sum_rot_us / 1_000_000;
        const distance_m = readings_count * circ;
        const avg_speed_ms = total_time_s > 0 ? (distance_m / total_time_s) : 0;
        const avg_kmh = avg_speed_ms * 3.6;
        const max_kmh = min_rot_us ? computeSpeedKmh(circ, min_rot_us) : null;

        // ULTIMA LEITURA: pegar pela última data registrada (rotacao_regis DESC, id DESC)
        const [lastRows] = await pool.query(
            `SELECT id, rotacao_regis, rotacao_next, id_bike 
       FROM Dados 
       WHERE id_run = ? 
       ORDER BY rotacao_regis DESC, id DESC 
       LIMIT 1`,
            [run.id]
        );
        const last = lastRows[0] || null;
        let last_speed_kmh = null;
        if (last && last.rotacao_next && last.rotacao_next > 0) {
            last_speed_kmh = computeSpeedKmh(circ, Number(last.rotacao_next));
        }

        // === Novidade: média das 10 últimas voltas (por tempo total) ===
        const N = 10;
        const [lastNRows] = await pool.query(
            `SELECT rotacao_next, rotacao_regis 
       FROM Dados 
       WHERE id_run = ? AND rotacao_next > 0 
       ORDER BY rotacao_regis DESC, id DESC 
       LIMIT ?`,
            [run.id, N]
        );

        const deltas = (lastNRows || []).map(r => Number(r.rotacao_next));
        const avg10_kmh = computeAverageSpeedKmhFromDeltas(circ, deltas); // null se insuficiente/ inválido
        const count_used = deltas.length;

        return {
            id_run: run.id_run,
            status: run.status,
            started_at: run.started_at,
            ended_at: run.ended_at,
            readings_count,
            distance_m: Number(distance_m.toFixed(3)),
            duration_s: Number(total_time_s.toFixed(3)),
            avg_kmh: Number((avg_kmh || 0).toFixed(2)),
            max_kmh: max_kmh ? Number(max_kmh.toFixed(2)) : null,
            // last tradicional (última leitura)
            last: last ? {
                id: last.id,
                timestamp: last.rotacao_regis,
                delta_us: Number(last.rotacao_next),
                speed_kmh: last_speed_kmh ? Number(last_speed_kmh.toFixed(2)) : null,
            } : null,
            // novo: média baseada nas últimas N voltas
            avg_last_n: {
                n_requested: N,
                count_used,
                avg_kmh: avg10_kmh ? Number(avg10_kmh.toFixed(2)) : null
            }
        };
    }

    // Última leitura simples (útil para polling) — agora devolve média das últimas 10 junto com last
    static async getRunLastReading(id_run, user) {
        const [runRows] = await pool.query(
            'SELECT R.id, B.circunferencia_m FROM Run R JOIN Bike B ON R.bike_id = B.id WHERE R.id_run = ? AND R.user_id = ?',
            [id_run, user.user_id]
        );
        if (!runRows || runRows.length === 0) return null;
        const run = runRows[0];
        const circ = Number(run.circunferencia_m);

        // última leitura por data
        const [rows] = await pool.query(
            `SELECT id, rotacao_regis, rotacao_next FROM Dados WHERE id_run = ? ORDER BY rotacao_regis DESC, id DESC LIMIT 1`,
            [run.id]
        );
        if (!rows || rows.length === 0) return null;
        const r = rows[0];
        const last_speed_kmh = computeSpeedKmh(circ, Number(r.rotacao_next));

        // média últimas 10 (mesmo processo)
        const N = 10;
        const [lastN] = await pool.query(
            `SELECT rotacao_next, rotacao_regis FROM Dados WHERE id_run = ? AND rotacao_next > 0 ORDER BY rotacao_regis DESC, id DESC LIMIT ?`,
            [run.id, N]
        );
        const deltas = (lastN || []).map(x => Number(x.rotacao_next));
        const avg10_kmh = computeAverageSpeedKmhFromDeltas(circ, deltas);
        const age_seconds = (Date.now() - new Date(r.rotacao_regis).getTime()) / 1000;

        return {
            id: r.id,
            timestamp: r.rotacao_regis,
            delta_us: Number(r.rotacao_next),
            speed_kmh: last_speed_kmh ? Number(last_speed_kmh.toFixed(2)) : null,
            avg_last_n: {
                n_requested: N,
                count_used: deltas.length,
                avg_kmh: avg10_kmh ? Number(avg10_kmh.toFixed(2)) : null
            },
            age_seconds: Number(age_seconds.toFixed(2))
        };
    }

    // Live por bike_uuid: achar run active e devolver média das últimas 10 + last
    static async getLiveByBikeUuid(bike_uuid, user) {
        const [bikeRows] = await pool.query('SELECT id, id_bike, circunferencia_m, user_id FROM Bike WHERE id_bike = ?', [bike_uuid]);
        const bike = bikeRows[0];
        if (!bike) return null;
        if (bike.user_id !== user.user_id) throw new Error('Bike não pertence ao usuário');

        // achar run ativa
        const [runRows] = await pool.query(
            'SELECT id, id_run FROM Run WHERE bike_id = ? AND user_id = ? AND status = "active" ORDER BY started_at DESC LIMIT 1',
            [bike.id, user.user_id]
        );
        if (!runRows || runRows.length === 0) return null;
        const run = runRows[0];
        const circ = Number(bike.circunferencia_m);

        // última leitura por data
        const [lastRows] = await pool.query('SELECT id, rotacao_regis, rotacao_next FROM Dados WHERE id_run = ? ORDER BY rotacao_regis DESC, id DESC LIMIT 1', [run.id]);
        if (!lastRows || lastRows.length === 0) return { id_run: run.id_run, message: 'Sem leituras ainda' };
        const last = lastRows[0];

        // média últimas N
        const N = 10;
        const [lastNRows] = await pool.query('SELECT rotacao_next, rotacao_regis FROM Dados WHERE id_run = ? AND rotacao_next > 0 ORDER BY rotacao_regis DESC, id DESC LIMIT ?', [run.id, N]);
        const deltas = (lastNRows || []).map(r => Number(r.rotacao_next));
        const avg10_kmh = computeAverageSpeedKmhFromDeltas(circ, deltas);

        const speed_kmh_last = computeSpeedKmh(circ, Number(last.rotacao_next));
        const age_seconds = (Date.now() - new Date(last.rotacao_regis).getTime()) / 1000;

        return {
            bike_uuid: bike.id_bike,
            id_run: run.id_run,
            last: {
                id: last.id,
                timestamp: last.rotacao_regis,
                delta_us: Number(last.rotacao_next),
                speed_kmh: speed_kmh_last ? Number(speed_kmh_last.toFixed(2)) : null,
                age_seconds: Number(age_seconds.toFixed(2))
            },
            avg_last_n: {
                n_requested: N,
                count_used: deltas.length,
                avg_kmh: avg10_kmh ? Number(avg10_kmh.toFixed(2)) : null
            }
        };
    }

    static async stopRunByIdRun(id_run, user) {
        // atualiza run pelo id_run string
        const [res] = await pool.query(
            'UPDATE Run SET status = "completed", ended_at = NOW(), updated_at = NOW() WHERE id_run = ? AND user_id = ? AND status = "active"',
            [id_run, user.user_id]
        );
        return res.affectedRows > 0;
    }

    static async stopRunByBikeUuid(bike_uuid, user) {
        // buscar bike
        const [bikeRows] = await pool.query('SELECT id FROM Bike WHERE id_bike = ? AND user_id = ?', [bike_uuid, user.user_id]);
        if (bikeRows.length === 0) return null;
        const bikeId = bikeRows[0].id;

        // buscar run ativa
        const [runRows] = await pool.query('SELECT id, id_run FROM Run WHERE bike_id = ? AND user_id = ? AND status = "active" ORDER BY started_at DESC LIMIT 1', [bikeId, user.user_id]);
        if (runRows.length === 0) return null;

        const id_run = runRows[0].id_run;
        await pool.query('UPDATE Run SET status = "completed", ended_at = NOW(), updated_at = NOW() WHERE id_run = ? AND user_id = ?', [id_run, user.user_id]);
        return { id_run };
    }

    static async getAllRuns({ user, limit = 100, offset = 0, status = null, bike_uuid = null }) {
        if (!user || !user.user_id) throw new Error('Usuário não autenticado');

        // base query — selecionar informações úteis
        let sql = `
      SELECT
        R.id_run,
        R.id,
        R.name,
        R.status,
        R.started_at,
        R.ended_at,
        R.updated_at,
        R.user_id,
        R.bike_id,
        B.id_bike AS bike_uuid,
        B.circunferencia_m
      FROM Run R
      JOIN Bike B ON R.bike_id = B.id
      WHERE R.user_id = ?
    `;
        const params = [user.user_id];

        if (status) {
            sql += ' AND R.status = ?';
            params.push(status);
        }

        if (bike_uuid) {
            sql += ' AND B.id_bike = ?';
            params.push(bike_uuid);
        }

        sql += ' ORDER BY R.started_at DESC LIMIT ? OFFSET ?';
        params.push(Number(limit), Number(offset));

        const [rows] = await pool.query(sql, params);

        // map para formato mais amigável
        return (rows || []).map(r => ({
            id: r.id,
            id_run: r.id_run,
            name: r.name,
            status: r.status,
            started_at: r.started_at,
            ended_at: r.ended_at,
            updated_at: r.updated_at,
            bike_id: r.bike_id,
            bike_uuid: r.bike_uuid,
            circunferencia_m: r.circunferencia_m
        }));
    }

}