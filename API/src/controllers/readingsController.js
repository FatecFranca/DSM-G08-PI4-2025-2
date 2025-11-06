import { ReadingsService } from '../service/readingsService.js';

export default class ReadingsController {
    static async create(req, res) {
        try {
            const payload = Array.isArray(req.body) ? req.body : [req.body];
            const user = req.user; // 👈 Agora vem do middleware simplificado
            
            const result = await ReadingsService.processBatch(payload, user);
            
            res.status(201).json({
                ...result,
                user: user.email
            });
        } catch (err) {
            console.error('readings.create error:', err);
            res.status(500).json({ error: 'Erro ao salvar leituras' });
        }
    }
}