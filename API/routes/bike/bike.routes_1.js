import { Router } from 'express';
import { CrudController } from '../../controllers/crudControllers.js';
import { CrudService } from '../../service/crudService.js';
import { BikeRepository } from '../../repositories/bikeRepository.js';

const router = Router();
const service = new CrudService(BikeRepository);
const controller = new CrudController(service);

router.get('/', controller.getAll);
router.get('/:id', controller.getOne);
router.post('/', controller.create);
router.put('/:id', controller.update);
router.delete('/:id', controller.delete);

export default router;
