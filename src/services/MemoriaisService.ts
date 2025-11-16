import { IMemoriaisRepository, Memorial } from '../domain/repositories/IMemoriaisRepository.js';

export class MemoriaisService {
	constructor(private readonly repo: IMemoriaisRepository) {}

	list() {
		return this.repo.list();
	}

	findBySlug(slug: string) {
		return this.repo.findBySlug(slug);
	}

	async create(data: Omit<Memorial, 'id'>) {
		const exists = await this.repo.existsSlug(data.slug);
		
		if (exists) return { ok: false as const, status: 409, error: 'Slug já existe' };

		const created = await this.repo.insert(data);
		return { ok: true as const, data: created };
	}

	async update(originalSlug: string, data: Partial<Omit<Memorial, 'id'>>) {
		if (data.slug && data.slug !== originalSlug) {
			const exists = await this.repo.existsSlug(data.slug);
			if (exists) return { ok: false as const, status: 409, error: 'Novo slug já existe' };
		}
		const updated = await this.repo.updateBySlug(originalSlug, data);
		if (!updated) return { ok: false as const, status: 404, error: 'Memorial não encontrado' };
		return { ok: true as const, data: updated };
	}

	async delete(slug: string) {
		const ok = await this.repo.deleteBySlug(slug);
		if (!ok) return { ok: false as const, status: 404, error: 'Memorial não encontrado' };
		return { ok: true as const };
	}
}


