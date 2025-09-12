import { ReadingsService } from '../service/readingsService.js';

export default class ReadingsController {
    static async create(req, res) {
        try {
            const payload = Array.isArray(req.body) ? req.body : [req.body];

            const deviceId = req.device ? req.device.id : null;

            const result = await ReadingsService.processBatch(payload, { deviceId });
            res.status(201).json(result);
        } catch (err) {
            console.error('readings.create error:', err);
            res.status(500).json({ error: 'Erro ao salvar leituras' });
        }
    }
}
