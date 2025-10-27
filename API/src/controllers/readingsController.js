import { ReadingsService } from '../service/readingsService.js';

export default class ReadingsController {
    static async create(req, res) {
        try {
            const payload = Array.isArray(req.body) ? req.body : [req.body];
            
            // 🚨 CORREÇÃO: Usar a bike do middleware authIot
            const bike = req.bike; // Do middleware simpleIotAuth
            
            // Adicionar id_bike a cada leitura se não existir
            const processedPayload = payload.map(reading => ({
                ...reading,
                id_bike: reading.id_bike || bike.id_bike // Usar id_bike da bike autenticada
            }));

            const result = await ReadingsService.processBatch(processedPayload, { 
                bikeId: bike.id 
            });
            
            res.status(201).json(result);
        } catch (err) {
            console.error('readings.create error:', err);
            res.status(500).json({ error: 'Erro ao salvar leituras' });
        }
    }
}