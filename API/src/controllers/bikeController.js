import { BikeService } from '../service/bikeService.js';
import { BikeRepository } from '../repositories/bikeRepository.js';

const repository = new BikeRepository();
const service = new BikeService(repository);

export class BikeController {
    constructor(service) {
        this.service = service;

        // 🔥 GARANTIR BINDING DOS MÉTODOS
        this.getAll = this.getAll.bind(this);
        this.getOne = this.getOne.bind(this);
        this.create = this.create.bind(this);
        this.update = this.update.bind(this);
        this.delete = this.delete.bind(this);
        this.getUserBikes = this.getUserBikes.bind(this);
        this.getByIdBike = this.getByIdBike.bind(this);
        this.updateStatus = this.updateStatus.bind(this);
        this.updateLastSeen = this.updateLastSeen.bind(this);
        this.calculateSpeed = this.calculateSpeed.bind(this);
    }

    // 🔄 MÉTODOS CRUD
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
            const { id_bike, name, circunferencia_m, description } = req.body;
            const user = req.user;
            const user_id = user.user_id;

            const newBike = await this.service.create({
                id_bike,
                name: name || 'Minha Bike',
                circunferencia_m: circunferencia_m || 2.1,
                description: description || null,
                user_id: user_id
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

    // Buscar bikes do usuário logado
    getUserBikes = async (req, res) => {
        try {
            // lê o user id de forma robusta
            const userId = req.user?.user_id || req.user?.id || req.userId;
            if (!userId) {
                return res.status(401).json({ error: 'Usuário não autenticado' });
            }

            const bikes = await this.service.getByUserId(userId);
            return res.json(bikes);
        } catch (error) {
            console.error('getUserBikes error:', error);
            return res.status(500).json({ error: error.message });
        }
    };

    // Buscar bike por id_bike (para o IoT)
    getByIdBike = async (req, res) => {
        try {
            const { id_bike } = req.params;
            const bike = await this.service.getByIdBike(id_bike);

            if (!bike) {
                return res.status(404).json({ error: 'Bike not found' });
            }

            res.json(bike);
        } catch (error) {
            res.status(500).json({ error: error.message });
        }
    };

    // 🔥 MÉTODO updateStatus CORRIGIDO
    updateStatus = async (req, res) => {
        try {
            const { id } = req.params;
            const { status } = req.body;

            const success = await this.service.updateStatus(id, status);

            if (!success) {
                return res.status(404).json({ error: 'Bike not found' });
            }

            res.json({ message: 'Status atualizado', bikeId: id, status });
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
            const { pulse_count, time_interval } = req.body;

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