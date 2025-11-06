import { Router } from 'express';
import { BikeController } from '../../controllers/bikeController.js';
import { BikeService } from '../../service/bikeService.js';
import { BikeRepository } from '../../repositories/bikeRepository.js';
import { authenticateUser } from '../../middlewares/authUser.js';
import { authIotSimple } from '../../middlewares/authIot.js'; // 👈 CORRIGIDO

const router = Router();
const repository = new BikeRepository();
const service = new BikeService(repository);
const controller = new BikeController(service);

// Rotas para usuários autenticados
router.get('/my-bikes', authenticateUser, controller.getUserBikes);
router.post('/', authenticateUser, controller.create);

// Rotas para IoT
router.get('/device/:id_bike', authIotSimple, controller.getByIdBike);
router.put('/:id/status', authIotSimple, controller.updateStatus);
router.put('/:id/last-seen', authIotSimple, controller.updateLastSeen);
router.post('/:id/calculate-speed', authIotSimple, controller.calculateSpeed);

// Rotas administrativas
router.get('/', controller.getAll);
router.get('/:id', controller.getOne);
router.put('/:id', controller.update);
router.delete('/:id', controller.delete);

export default router;