import { IComentariosRepository, Comentario, ComentariosPaginated } from '../../domain/repositories/IComentariosRepository.js';
import { prisma } from '../prisma/client.js';

export class PrismaComentariosRepository implements IComentariosRepository {
	async listByMemorialId(memorialId: string, pagina: number, limite: number): Promise<ComentariosPaginated> {
		const skip = (pagina - 1) * limite;
		
		const [comentarios, total] = await Promise.all([
			prisma.comentario.findMany({
				where: { memorialId },
				orderBy: { criadoEm: 'desc' },
				skip,
				take: limite,
			}),
			prisma.comentario.count({
				where: { memorialId },
			}),
		]);

		const totalPaginas = Math.ceil(total / limite);

		return {
			comentarios: comentarios.map(r => ({
				id: r.id,
				memorialId: r.memorialId,
				nome: r.nome,
				texto: r.texto,
				criadoEm: r.criadoEm,
			})),
			total,
			pagina,
			totalPaginas,
		};
	}

	async countByMemorialId(memorialId: string): Promise<number> {
		return prisma.comentario.count({
			where: { memorialId },
		});
	}

	async create(data: Omit<Comentario, 'id' | 'criadoEm'>): Promise<Comentario> {
		const r = await prisma.comentario.create({
			data: {
				memorialId: data.memorialId,
				nome: data.nome ?? null,
				texto: data.texto,
			},
		});

		return {
			id: r.id,
			memorialId: r.memorialId,
			nome: r.nome,
			texto: r.texto,
			criadoEm: r.criadoEm,
		};
	}
}

