import { RunsService } from '../service/runsService.js';

export default class RunsController {
    static async create(req, res) {
        try {
            const user = req.user;
            const payload = req.body; // { bike_uuid | bike_id, name, id_run? }

            const run = await RunsService.createRun(payload, user);
            res.status(201).json(run);
        } catch (err) {
            console.error('RunsController.create', err);
            res.status(500).json({ error: 'Erro ao criar run', message: err.message });
        }
    }

    static async metrics(req, res) {
        try {
            const user = req.user;
            const id_run = req.params.id_run;
            const metrics = await RunsService.getRunMetrics(id_run, user);
            if (!metrics) return res.status(404).json({ error: 'Run não encontrada' });
            res.json(metrics);
        } catch (err) {
            console.error('RunsController.metrics', err);
            res.status(500).json({ error: 'Erro ao buscar métricas', message: err.message });
        }
    }

    static async last(req, res) {
        try {
            const user = req.user;
            const id_run = req.params.id_run;
            const last = await RunsService.getRunLastReading(id_run, user);
            if (!last) return res.status(404).json({ error: 'Run ou leituras não encontradas' });
            res.json(last);
        } catch (err) {
            console.error('RunsController.last', err);
            res.status(500).json({ error: 'Erro ao buscar última leitura', message: err.message });
        }
    }

    static async liveByBike(req, res) {
        try {
            const user = req.user;
            const bike_uuid = req.params.bike_uuid;
            const live = await RunsService.getLiveByBikeUuid(bike_uuid, user);
            if (!live) return res.status(404).json({ error: 'Bike ou run ativa não encontrada' });
            res.json(live);
        } catch (err) {
            console.error('RunsController.liveByBike', err);
            res.status(500).json({ error: 'Erro ao buscar dados live', message: err.message });
        }
    }

    static async stop(req, res) {
        try {
            const user = req.user;
            const id_run = req.params.id_run;
            const result = await RunsService.stopRunByIdRun(id_run, user);
            if (!result) return res.status(404).json({ error: 'Run não encontrada ou não pertence ao usuário' });
            return res.json({ message: 'Run finalizada', id_run });
        } catch (err) {
            console.error('RunsController.stop', err);
            return res.status(500).json({ error: 'Erro ao finalizar run' });
        }
    }

    static async stopByBike(req, res) {
        try {
            const user = req.user;
            const bike_uuid = req.params.bike_uuid;
            const result = await RunsService.stopRunByBikeUuid(bike_uuid, user);
            if (!result) return res.status(404).json({ error: 'Run ativa não encontrada para essa bike' });
            return res.json({ message: 'Run finalizada', id_run: result.id_run });
        } catch (err) {
            console.error('RunsController.stopByBike', err);
            return res.status(500).json({ error: 'Erro ao finalizar run por bike' });
        }
    }
}
