import { ReadingsService } from '../service/readingsService.js';

export default class ReadingsController {
    static async create(req, res) {
        try {
            const payload = Array.isArray(req.body) ? req.body : [req.body];
            
            // 🔥 AGORA usa as informações do middleware authIotToken
            const iot = req.iot;
            
            // Adicionar bike_id automaticamente baseado no token
            const processedPayload = payload.map(reading => ({
                ...reading,
                id_bike: iot.bike_identifier // Usa o id_bike do token
            }));

            const result = await ReadingsService.processBatch(processedPayload, { 
                iotInfo: iot 
            });
            
            res.status(201).json({
                ...result,
                device: iot.device_name,
                bike: iot.bike_identifier
            });
        } catch (err) {
            console.error('readings.create error:', err);
            res.status(500).json({ error: 'Erro ao salvar leituras' });
        }
    }
}