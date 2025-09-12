export class CrudService {
    constructor(repository) {
        this.repository = repository;
    }

    async create(data) {
        return this.repository.create(data);
    }

    async getAll() {
        return this.repository.getAll();
    }

    async getOne(id) {
        return this.repository.getOne(id);
    }

    async update(id, data) {
        return this.repository.update(id, data);
    }

    async delete(id) {
        return this.repository.delete(id);
    }
}
