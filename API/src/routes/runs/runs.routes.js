import { Router } from 'express';
import RunsController from '../../controllers/runsController.js';
import { authIotSimple } from '../../middlewares/authIot.js';

const router = Router();

// listar runs (com paginação e filtros via query string)
router.get('/', authIotSimple, RunsController.getAll);

// criar nova run
router.post('/', authIotSimple, RunsController.create);

// métricas da run
router.get('/:id_run/metrics', authIotSimple, RunsController.metrics);

// última leitura (para polling rápido)
router.get('/:id_run/last', authIotSimple, RunsController.last);

// live por bike_uuid (acha run active e retorna última leitura)
router.get('/bike/:bike_uuid/live', authIotSimple, RunsController.liveByBike);

// POST /runs/:id_run/stop  (encerra pela id_run string)
router.post('/:id_run/stop', authIotSimple, RunsController.stop);

// POST /runs/bike/:bike_uuid/stop  (encerra a run ativa da bike)
router.post('/bike/:bike_uuid/stop', authIotSimple, RunsController.stopByBike);

export default router;