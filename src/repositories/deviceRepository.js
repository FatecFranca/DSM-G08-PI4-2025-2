import pool from '../config/config.js';
import { v4 as uuidv4 } from 'uuid';

export class DeviceRepository {
    static async create({ device_uuid = null, bike_id = null, firmware_version = null, api_key = null }) {
        const duuid = device_uuid ?? uuidv4();
        const [result] = await pool.query(
            `INSERT INTO devices (device_uuid, bike_id, firmware_version, api_key, created_at) VALUES (?, ?, ?, ?, UTC_TIMESTAMP(6))`,
            [duuid, bike_id, firmware_version, api_key]
        );
        return { id: result.insertId, device_uuid: duuid };
    }

    static async getByUUID(device_uuid) {
        const [rows] = await pool.query('SELECT * FROM devices WHERE device_uuid = ?', [device_uuid]);
        return rows[0] || null;
    }
}
