export type Memorial = {
	id: string;
	nome: string;
	biografia: string;
	slug: string;
	fotoMainUrl: string;
	corPrincipal: string;
	galeriaFotos: string[];
	galeriaVideos: string[];
	dataNascimento?: Date | null;
	dataMorte?: Date | null;
	causaMorte?: string | null;
};

export interface IMemoriaisRepository {
	list(): Promise<Memorial[]>;
	findBySlug(slug: string): Promise<Memorial | undefined>;
	existsSlug(slug: string): Promise<boolean>;
	insert(data: Omit<Memorial, 'id'>): Promise<Memorial>;
	updateBySlug(originalSlug: string, data: Partial<Omit<Memorial, 'id'>>): Promise<Memorial | undefined>;
	deleteBySlug(slug: string): Promise<boolean>;
}


