import pool from '../config/config.js';
import { io } from '../../server.js';

/**
 * payload: array de leituras:
 * {
 *   bike_uuid: string,        -- obrigatório
 *   delta_us: number|null,
 *   pulse_count: number (default 1),
 *   speed_kmh: number|null,
 *   battery_pct: number|null,
 *   lat: number|null,
 *   lon: number|null,
 *   ts: string|null,
 *   run_id: number|null
 * }
 *
 * options: { deviceId } -> id do device autenticado
 */
export class ReadingsService {
    static async processBatch(payload, options = {}) {
        if (!payload || payload.length === 0) return { inserted: 0 };

        // map bike_uuid -> bike row
        const bikeUuids = [...new Set(payload.map(p => p.bike_uuid).filter(Boolean))];
        const bikesMap = {};
        if (bikeUuids.length) {
            const [rows] = await pool.query(
                'SELECT id, uuid, circunferencia_m, pulses_per_rotation FROM bikes WHERE uuid IN (?)',
                [bikeUuids]
            );
            for (const r of rows) bikesMap[r.uuid] = r;
        }

        // preparar insert bulk
        const placeholders = [];
        const values = [];

        for (const p of payload) {
            const bike = p.bike_uuid ? bikesMap[p.bike_uuid] : null;
            if (!bike) {
                console.warn('Leitura ignorada: bike_uuid não encontrada', p.bike_uuid);
                continue;
            }

            const pulse_count = Number(p.pulse_count ?? 1);
            const delta_us = p.delta_us != null ? Number(p.delta_us) : null;
            let speed_kmh = p.speed_kmh != null ? Number(p.speed_kmh) : null;
            let valid = p.valid != null ? !!p.valid : true;

            // calcular speed se possível
            if ((speed_kmh === null || isNaN(speed_kmh)) && delta_us && delta_us > 0) {
                const distance_m = (Number(bike.circunferencia_m) * (pulse_count / Number(bike.pulses_per_rotation)));
                const speed_m_s = distance_m / (delta_us / 1_000_000);
                speed_kmh = speed_m_s * 3.6;
                if (!isFinite(speed_kmh) || speed_kmh > 200) valid = false;
            }

            // check for suspicious delta_us (debounce)
            if (delta_us && delta_us < 1000) valid = false; // <1ms provavelmente glitch

            const ts = p.ts ?? new Date().toISOString().slice(0, 19).replace('T', ' ');

            placeholders.push('(?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, UTC_TIMESTAMP(6))');
            values.push(
                p.run_id ?? null,
                bike.id,
                options.deviceId ?? p.device_id ?? null,
                ts,
                delta_us,
                pulse_count,
                speed_kmh,
                p.battery_pct ?? null,
                p.lat ?? null,
                p.lon ?? null,
                valid ? 1 : 0
            );

            // emitir para dashboard
            if (speed_kmh != null && valid) {
                io.to(bike.uuid).emit('reading', {
                    bike_uuid: bike.uuid,
                    speed_kmh: Number(Number(speed_kmh).toFixed(3)),
                    ts,
                    battery_pct: p.battery_pct ?? null,
                    lat: p.lat ?? null,
                    lon: p.lon ?? null
                });
            }
        }

        if (placeholders.length === 0) return { inserted: 0 };

        const sql = `
      INSERT INTO readings
      (run_id, bike_id, device_id, ts, delta_us, pulse_count, speed_kmh, battery_pct, lat, lon, valid, created_at)
      VALUES ${placeholders.join(',')}
    `;
        const [result] = await pool.query(sql, values);
        return { inserted: result.affectedRows };
    }
}
