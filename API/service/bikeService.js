import { BikeRepository } from '../repositories/bikeRepository.js';

export class BikeService {
    constructor(repository) {
        this.repository = repository;
    }

    // Métodos CRUD básicos (para manter compatibilidade)
    async getAll() {
        return await this.repository.getAll();
    }

    async getOne(id) {
        return await this.repository.getOne(id);
    }

    async create(data) {
        return await this.repository.create(data);
    }

    async update(id, data) {
        return await this.repository.update(id, data);
    }

    async delete(id) {
        return await this.repository.delete(id);
    }

    // 🔥 MÉTODOS ESPECÍFICOS PARA IOT
    async getByDeviceId(deviceId) {
        // Como não temos deviceId separado, usamos o UUID
        return await this.repository.findByUuid(deviceId);
    }

    async updateStatus(bikeId, status) {
        // Primeiro precisamos adicionar campo 'status' na tabela
        const [result] = await pool.query(
            `UPDATE bikes SET status = ?, last_seen = UTC_TIMESTAMP(6) WHERE id = ?`,
            [status, bikeId]
        );
        if (result.affectedRows === 0) return null;
        return this.repository.getOne(bikeId);
    }

    async updateLastSeen(bikeId) {
        const [result] = await pool.query(
            `UPDATE bikes SET last_seen = UTC_TIMESTAMP(6) WHERE id = ?`,
            [bikeId]
        );
        return result.affectedRows > 0;
    }

    // Cálculo de velocidade baseado nas pulsações do sensor Hall
    calculateSpeed(bike, pulseCount, timeInterval) {
        // bike.circunferencia_m = perímetro da roda em metros
        // bike.pulses_per_rotation = pulsos por rotação (normalmente 1)
        // timeInterval = tempo em segundos entre as leituras
        
        const distancePerPulse = bike.circunferencia_m / bike.pulses_per_rotation;
        const totalDistance = pulseCount * distancePerPulse; // em metros
        const speedMs = totalDistance / timeInterval; // m/s
        const speedKmh = speedMs * 3.6; // km/h
        
        return {
            speed_ms: speedMs,
            speed_kmh: speedKmh,
            distance_m: totalDistance,
            pulse_count: pulseCount
        };
    }
}