import { Router } from 'express';
import swaggerUi from 'swagger-ui-express';
import { createRequire } from 'module';

const require = createRequire(import.meta.url);
const swaggerDocument = require('../../src/swagger.json');

const router = Router();

router.use("/", swaggerUi.serve, swaggerUi.setup(swaggerDocument));


export default router;
