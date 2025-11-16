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
});

export const updateMemorialSchema = z.object({
	nome: z.string().min(1).max(255).optional(),
	biografia: z.string().min(10).max(10000).optional(),
	slug: z.string().min(1).max(100).regex(slugRegex).optional(),
	fotoMainUrl: z.string().min(1).optional(),
	corPrincipal: z.string().regex(hexColorRegex).optional(),
	galeriaFotos: z.array(z.string()).min(0).optional(),
});

export type CreateMemorialInput = z.infer<typeof createMemorialSchema>;
export type UpdateMemorialInput = z.infer<typeof updateMemorialSchema>;


