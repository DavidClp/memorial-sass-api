import { IMemoriaisRepository, Memorial } from '../../domain/repositories/IMemoriaisRepository.js';
import { prisma } from '../prisma/client.js';

export class PrismaMemoriaisRepository implements IMemoriaisRepository {
	async list(): Promise<Memorial[]> {
		const rows = await prisma.memorial.findMany({ orderBy: { createdAt: 'desc' } });
		return rows.map(r => ({
			id: r.id,
			nome: r.nome,
			biografia: r.biografia,
			slug: r.slug,
			fotoMainUrl: r.fotoMainUrl,
			corPrincipal: r.corPrincipal,
			galeriaFotos: (r.galeriaFotos as unknown as string[]) ?? [],
			galeriaVideos: (r.galeriaVideos as unknown as string[]) ?? [],
			dataNascimento: r.birthDate,
			dataMorte: r.departureDate,
			causaMorte: r.causaMorte,
		}));
	}

	async findBySlug(slug: string): Promise<Memorial | undefined> {
		const r = await prisma.memorial.findUnique({ where: { slug } });
		if (!r) return undefined;
		return {
			id: r.id,
			nome: r.nome,
			biografia: r.biografia,
			slug: r.slug,
			fotoMainUrl: r.fotoMainUrl,
			corPrincipal: r.corPrincipal,
			galeriaFotos: (r.galeriaFotos as unknown as string[]) ?? [],
			galeriaVideos: (r.galeriaVideos as unknown as string[]) ?? [],
			dataNascimento: r.birthDate,
			dataMorte: r.departureDate,
			causaMorte: r.causaMorte,
		};
	}

	async existsSlug(slug: string): Promise<boolean> {
		const r = await prisma.memorial.findUnique({ where: { slug }, select: { id: true } });
		return !!r;
	}

	async insert(data: Omit<Memorial, 'id'>): Promise<Memorial> {
		const r = await prisma.memorial.create({
			data: {
				nome: data.nome,
				biografia: data.biografia,
				slug: data.slug,
				fotoMainUrl: data.fotoMainUrl,
				corPrincipal: data.corPrincipal,
				galeriaFotos: data.galeriaFotos as unknown as any,
				galeriaVideos: data.galeriaVideos as unknown as any,
				birthDate: data.dataNascimento ?? null,
				departureDate: data.dataMorte ?? null,
				causaMorte: data.causaMorte ?? null,
			},
		});
		return {
			id: r.id,
			nome: r.nome,
			biografia: r.biografia,
			slug: r.slug,
			fotoMainUrl: r.fotoMainUrl,
			corPrincipal: r.corPrincipal,
			galeriaFotos: (r.galeriaFotos as unknown as string[]) ?? [],
			galeriaVideos: (r.galeriaVideos as unknown as string[]) ?? [],
			dataNascimento: r.birthDate,
			dataMorte: r.departureDate,
			causaMorte: r.causaMorte,
		};
	}

	async updateBySlug(originalSlug: string, data: Partial<Omit<Memorial, 'id'>>): Promise<Memorial | undefined> {
		const r = await prisma.memorial.update({
			where: { slug: originalSlug },
			data: {
				nome: data.nome,
				biografia: data.biografia,
				slug: data.slug,
				fotoMainUrl: data.fotoMainUrl,
				corPrincipal: data.corPrincipal,
				galeriaFotos: data.galeriaFotos as unknown as any,
				galeriaVideos: data.galeriaVideos as unknown as any,
				birthDate: data.dataNascimento !== undefined ? data.dataNascimento : undefined,
				departureDate: data.dataMorte !== undefined ? data.dataMorte : undefined,
				causaMorte: data.causaMorte !== undefined ? data.causaMorte : undefined,
			},
		}).catch(() => undefined);
		if (!r) return undefined;
		return {
			id: r.id,
			nome: r.nome,
			biografia: r.biografia,
			slug: r.slug,
			fotoMainUrl: r.fotoMainUrl,
			corPrincipal: r.corPrincipal,
			galeriaFotos: (r.galeriaFotos as unknown as string[]) ?? [],
			galeriaVideos: (r.galeriaVideos as unknown as string[]) ?? [],
			dataNascimento: r.birthDate,
			dataMorte: r.departureDate,
			causaMorte: r.causaMorte,
		};
	}

	async deleteBySlug(slug: string): Promise<boolean> {
		const r = await prisma.memorial.delete({ where: { slug } }).catch(() => undefined);
		return !!r;
	}
}


