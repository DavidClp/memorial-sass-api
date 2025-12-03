export interface Comentario {
	id: string;
	memorialId: string;
	nome?: string | null;
	texto: string;
	criadoEm: Date;
}

export interface ComentariosPaginated {
	comentarios: Comentario[];
	total: number;
	pagina: number;
	totalPaginas: number;
}

export interface IComentariosRepository {
	listByMemorialId(memorialId: string, pagina: number, limite: number): Promise<ComentariosPaginated>;
	countByMemorialId(memorialId: string): Promise<number>;
	create(data: Omit<Comentario, 'id' | 'criadoEm'>): Promise<Comentario>;
}

