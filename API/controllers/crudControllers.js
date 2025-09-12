export class CrudController {
    constructor(service) {
        this.service = service;

        // amarrações para garantir o `this` em rotas
        this.getAll = this.getAll.bind(this);
        this.create = this.create.bind(this);
        this.update = this.update.bind(this);
        this.delete = this.delete.bind(this);
        this.getOne = this.getOne.bind(this);
    }

    async getAll(req, res) {
        try {
            const rows = await this.service.getAll();
            res.json(rows);
        } catch (err) {
            console.error('getAll error:', err);
            res.status(500).json({ error: 'Erro ao buscar registros' });
        }
    }

    async create(req, res) {
        try {
            const data = req.body;
            const created = await this.service.create(data);
            res.status(201).json(created);
        } catch (err) {
            console.error('create error:', err);
            res.status(500).json({ error: 'Erro ao criar registro' });
        }
    }

    async update(req, res) {
        try {
            const id = req.params.id;
            const data = req.body;
            const updated = await this.service.update(id, data);
            if (!updated) return res.status(404).json({ error: 'Registro não encontrado' });
            res.json(updated);
        } catch (err) {
            console.error('update error:', err);
            res.status(500).json({ error: 'Erro ao atualizar registro' });
        }
    }

    async getOne(req, res) {
        try {
            const id = req.params.id;
            const row = await this.service.getOne(id);
            if (!row) return res.status(404).json({ error: 'Registro não encontrado' });
            res.json(row);
        } catch (err) {
            console.error('getOne error:', err);
            res.status(500).json({ error: 'Erro ao buscar registro' });
        }
    }

    async delete(req, res) {
        try {
            const id = req.params.id;
            const ok = await this.service.delete(id);
            if (!ok) return res.status(404).json({ error: 'Registro não encontrado' });
            res.status(204).send();
        } catch (err) {
            console.error('delete error:', err);
            res.status(500).json({ error: 'Erro ao excluir registro' });
        }
    }
}
