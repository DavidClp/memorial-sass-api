import { z } from 'zod';

export const hexColorRegex = /^#[0-9A-Fa-f]{6}$/;
export const slugRegex = /^[a-z0-9_]+$/;

export const createMemorialSchema = z.object({
	nome: z.string().min(1).max(255),
	biografia: z.string().min(10).max(10000),
	slug: z.string().min(1).max(100).regex(slugRegex),
	fotoMainUrl: z.string().min(1), // base64 data URL
	corPrincipal: z.string().regex(hexColorRegex),
	galeriaFotos: z.array(z.string()).min(0),
	galeriaVideos: z.array(z.string()).min(0),
	anoNascimento: z.number().int().min(1000).max(3000).optional().nullable(),
	anoMorte: z.number().int().min(1000).max(3000).optional().nullable(),
	causaMorte: z.string().max(500).optional().nullable(),
});

export const updateMemorialSchema = z.object({
	nome: z.string().min(1).max(255).optional(),
	biografia: z.string().min(10).max(10000).optional(),
	slug: z.string().min(1).max(100).regex(slugRegex).optional(),
	fotoMainUrl: z.string().min(1).optional(),
	corPrincipal: z.string().regex(hexColorRegex).optional(),
	galeriaFotos: z.array(z.string()).min(0).optional(),
	galeriaVideos: z.array(z.string()).min(0).optional(),
	anoNascimento: z.number().int().min(1000).max(3000).optional().nullable(),
	anoMorte: z.number().int().min(1000).max(3000).optional().nullable(),
	causaMorte: z.string().max(500).optional().nullable(),
});

export type CreateMemorialInput = z.infer<typeof createMemorialSchema>;
export type UpdateMemorialInput = z.infer<typeof updateMemorialSchema>;


