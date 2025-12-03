import { IComentariosRepository, Comentario, ComentariosPaginated } from '../domain/repositories/IComentariosRepository.js';
import { IMemoriaisRepository } from '../domain/repositories/IMemoriaisRepository.js';

export class ComentariosService {
	constructor(
		private readonly repo: IComentariosRepository,
		private readonly memoriaisRepo: IMemoriaisRepository
	) {}

	async listByMemorialSlug(slug: string, pagina: number, limite: number): Promise<{ ok: true; data: ComentariosPaginated } | { ok: false; status: number; error: string }> {
		const memorial = await this.memoriaisRepo.findBySlug(slug);
		if (!memorial) {
			return { ok: false, status: 404, error: 'Memorial não encontrado' };
		}

		const data = await this.repo.listByMemorialId(memorial.id, pagina, limite);
		return { ok: true, data };
	}

	async create(slug: string, data: { nome?: string; texto: string }): Promise<{ ok: true; data: Comentario } | { ok: false; status: number; error: string }> {
		const memorial = await this.memoriaisRepo.findBySlug(slug);
		if (!memorial) {
			return { ok: false, status: 404, error: 'Memorial não encontrado' };
		}

		const comentario = await this.repo.create({
			memorialId: memorial.id,
			nome: data.nome || null,
			texto: data.texto,
		});

		return { ok: true, data: comentario };
	}
}

