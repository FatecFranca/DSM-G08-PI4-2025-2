import { BikeService } from '../service/bikeService.js';
import { BikeRepository } from '../repositories/bikeRepository.js';

const repository = new BikeRepository();
const service = new BikeService(repository);

export class BikeController {
    constructor(service) {
        this.service = service;
    }

    // 🔄 MÉTODOS CRUD (compatibilidade com rotas existentes)
    getAll = async (req, res) => {
        try {
            const bikes = await this.service.getAll();
            res.json(bikes);
        } catch (error) {
            res.status(500).json({ error: error.message });
        }
    };

    getOne = async (req, res) => {
        try {
            const { id } = req.params;
            const bike = await this.service.getOne(id);
            
            if (!bike) {
                return res.status(404).json({ error: 'Bike not found' });
            }
            
            res.json(bike);
        } catch (error) {
            res.status(500).json({ error: error.message });
        }
    };

    create = async (req, res) => {
        try {
            const { nome, circunferencia_m, pulses_per_rotation } = req.body;
            const newBike = await this.service.create({
                nome,
                circunferencia_m: circunferencia_m || 2.1, // valor padrão ~67cm diâmetro
                pulses_per_rotation: pulses_per_rotation || 1
            });
            res.status(201).json(newBike);
        } catch (error) {
            res.status(500).json({ error: error.message });
        }
    };

    update = async (req, res) => {
        try {
            const { id } = req.params;
            const bikeData = req.body;
            const updatedBike = await this.service.update(id, bikeData);
            
            if (!updatedBike) {
                return res.status(404).json({ error: 'Bike not found' });
            }
            
            res.json(updatedBike);
        } catch (error) {
            res.status(500).json({ error: error.message });
        }
    };

    delete = async (req, res) => {
        try {
            const { id } = req.params;
            const success = await this.service.delete(id);
            
            if (!success) {
                return res.status(404).json({ error: 'Bike not found' });
            }
            
            res.status(204).send();
        } catch (error) {
            res.status(500).json({ error: error.message });
        }
    };

    // 🔥 NOVOS MÉTODOS PARA IOT
    getByDeviceId = async (req, res) => {
        try {
            const { deviceId } = req.params;
            const bike = await this.service.getByDeviceId(deviceId);
            
            if (!bike) {
                return res.status(404).json({ error: 'Bike not found' });
            }
            
            res.json(bike);
        } catch (error) {
            res.status(500).json({ error: error.message });
        }
    };

    updateStatus = async (req, res) => {
        try {
            const { id } = req.params;
            const { status } = req.body; // 'online', 'offline', 'maintenance'
            
            const updatedBike = await this.service.updateStatus(id, status);
            
            if (!updatedBike) {
                return res.status(404).json({ error: 'Bike not found' });
            }
            
            res.json(updatedBike);
        } catch (error) {
            res.status(500).json({ error: error.message });
        }
    };

    updateLastSeen = async (req, res) => {
        try {
            const { id } = req.params;
            const success = await this.service.updateLastSeen(id);
            
            if (!success) {
                return res.status(404).json({ error: 'Bike not found' });
            }
            
            res.json({ message: 'Last seen updated', bikeId: id });
        } catch (error) {
            res.status(500).json({ error: error.message });
        }
    };

    // Calcular velocidade em tempo real
    calculateSpeed = async (req, res) => {
        try {
            const { id } = req.params;
            const { pulse_count, time_interval } = req.body; // time_interval em segundos
            
            const bike = await this.service.getOne(id);
            if (!bike) {
                return res.status(404).json({ error: 'Bike not found' });
            }
            
            const speedData = this.service.calculateSpeed(bike, pulse_count, time_interval);
            res.json(speedData);
        } catch (error) {
            res.status(500).json({ error: error.message });
        }
    };
}