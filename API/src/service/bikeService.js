import { BikeRepository } from '../repositories/bikeRepository.js';
import pool from '../config/config.js'; // 👈 ADICIONE ESTA LINHA

export class BikeService {
    constructor(repository) {
        this.repository = repository;
    }

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

    async getByUserId(user_id) {
        return await this.repository.getByUserId(user_id);
    }

    async getByIdBike(id_bike) {
        return await this.repository.getByIdBike(id_bike);
    }

    async updateStatus(id, status) {
        // 🔥 CORREÇÃO: Use o repository em vez do pool direto
        return await this.repository.updateStatus(id, status);
    }

    // Cálculo de velocidade SIMPLIFICADO - SEM pulses_per_rotation
    calculateSpeed(bike, pulseCount, timeInterval) {
        // 1 PULSO POR ROTAÇÃO (FIXO)
        const distancePerPulse = bike.circunferencia_m; // metros por pulso
        const totalDistance = pulseCount * distancePerPulse; // metros
        const speedMs = totalDistance / timeInterval; // m/s
        const speedKmh = speedMs * 3.6; // km/h
        
        return {
            speed_ms: speedMs,
            speed_kmh: speedKmh,
            distance_m: totalDistance,
            pulse_count: pulseCount,
            circunferencia_m: bike.circunferencia_m
        };
    }
}