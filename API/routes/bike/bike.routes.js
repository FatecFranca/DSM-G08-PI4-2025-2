import { Router } from 'express';
import { BikeController } from '../../controllers/bikeController.js';
import { BikeService } from '../../service/bikeService.js';
import { BikeRepository } from '../../repositories/bikeRepository.js';

const router = Router();
const repository = new BikeRepository();
const service = new BikeService(repository);
const controller = new BikeController(service);

// CRUD Básico
router.get('/', controller.getAll);
router.get('/:id', controller.getOne);
router.post('/', controller.create);
router.put('/:id', controller.update);
router.delete('/:id', controller.delete);

// Novos endpoints IoT
router.get('/device/:deviceId', controller.getByDeviceId);
router.put('/:id/status', controller.updateStatus);
router.put('/:id/last-seen', controller.updateLastSeen);
router.post('/:id/calculate-speed', controller.calculateSpeed);

export default router;