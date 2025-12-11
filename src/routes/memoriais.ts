import { Router } from 'express';
import { requireAuth } from '../middleware/auth.js';
import { createMemorialSchema, updateMemorialSchema } from '../validators/memoriais.js';
import { v4 as uuidv4 } from 'uuid';
import { parseDataUrlToBuffer } from '../shared/helpers/base64.js';
import { deleteAllFromPrefix } from '../shared/helpers/deleteFromS3.js';
import { PrismaMemoriaisRepository } from '../infra/repositories/PrismaMemoriaisRepository.js';
import { PrismaComentariosRepository } from '../infra/repositories/PrismaComentariosRepository.js';
import { MemoriaisService } from '../services/MemoriaisService.js';
import { ComentariosService } from '../services/ComentariosService.js';
import sharp from 'sharp';
import { uploadToS3 } from '../shared/helpers/uploadToS3.js';
import { compressVideo } from '../shared/helpers/compressVideo.js';

export const memoriaisRouter = Router();
const memoriaisRepository = new PrismaMemoriaisRepository();
const comentariosRepository = new PrismaComentariosRepository();
const service = new MemoriaisService(memoriaisRepository);
const comentariosService = new ComentariosService(comentariosRepository, memoriaisRepository);

function rowToDto(row: { id: string; nome: string; biografia: string; slug: string; fotoMainUrl: string; corPrincipal: string; galeriaFotos: string[]; galeriaVideos: string[]; dataNascimento?: Date | null; dataMorte?: Date | null; causaMorte?: string | null }) {
	return row;
}

memoriaisRouter.get('/', async (_req, res) => {
	const rows = await service.list();
	return res.status(200).json(rows.map(rowToDto));
});

// ==================== Rotas de Comentários (DEVEM VIR ANTES DE /:slug) ====================

/**
 * GET /memoriais/:slug/comentarios?page=1&limit=5
 * Lista comentários de um memorial com paginação
 */
memoriaisRouter.get('/:slug/comentarios', async (req, res) => {
	try {
		const slug = req.params.slug;
		const pagina = parseInt(req.query.page as string) || 1;
		const limite = parseInt(req.query.limit as string) || 5;

		if (pagina < 1) {
			return res.status(400).json({ error: 'Página deve ser maior que 0' });
		}

		if (limite < 1 || limite > 100) {
			return res.status(400).json({ error: 'Limite deve estar entre 1 e 100' });
		}

		const result = await comentariosService.listByMemorialSlug(slug, pagina, limite);
		if (!result.ok) {
			return res.status(result.status).json({ error: result.error });
		}

		return res.status(200).json({
			comentarios: result.data.comentarios.map(c => ({
				id: c.id,
				memorialId: c.memorialId,
				nome: c.nome,
				texto: c.texto,
				criadoEm: c.criadoEm.toISOString(),
			})),
			total: result.data.total,
			pagina: result.data.pagina,
			totalPaginas: result.data.totalPaginas,
		});
	} catch (err: any) {
		console.error('Erro ao listar comentários:', err);
		return res.status(500).json({ error: 'Erro ao listar comentários' });
	}
});

/**
 * POST /memoriais/:slug/comentarios
 * Cria um novo comentário (público, sem autenticação)
 */
memoriaisRouter.post('/:slug/comentarios', async (req, res) => {
	try {
		const slug = req.params.slug;
		const { nome, texto } = req.body;

		if (!texto || typeof texto !== 'string' || texto.trim().length === 0) {
			return res.status(400).json({ error: 'Texto do comentário é obrigatório' });
		}

		if (texto.trim().length > 5000) {
			return res.status(400).json({ error: 'Texto do comentário não pode exceder 5000 caracteres' });
		}

		if (nome && typeof nome === 'string' && nome.trim().length > 100) {
			return res.status(400).json({ error: 'Nome não pode exceder 100 caracteres' });
		}

		const result = await comentariosService.create(slug, {
			nome: nome?.trim() || undefined,
			texto: texto.trim(),
		});

		if (!result.ok) {
			return res.status(result.status).json({ error: result.error });
		}

		return res.status(201).json({
			id: result.data.id,
			memorialId: result.data.memorialId,
			nome: result.data.nome,
			texto: result.data.texto,
			criadoEm: result.data.criadoEm.toISOString(),
		});
	} catch (err: any) {
		console.error('Erro ao criar comentário:', err);
		return res.status(500).json({ error: 'Erro ao criar comentário' });
	}
});

memoriaisRouter.get('/:slug', async (req, res) => {
	const slug = req.params.slug;
	const row = await service.findBySlug(slug);
	if (!row) return res.status(404).json({ error: 'Memorial não encontrado' });
	return res.status(200).json(rowToDto(row));
});

/**
 * Verifica se uma string é um data URL base64 de imagem
 */
function isBase64DataUrl(str: string): boolean {
	return /^data:image\/.+;base64,.+/.test(str);
}

/**
 * Verifica se uma string é um data URL base64 de vídeo
 */
function isBase64VideoUrl(str: string): boolean {
	return /^data:video\/.+;base64,.+/.test(str);
}

/**
 * Processa múltiplas imagens em lotes de 5 em paralelo
 */
async function processImagesInBatches(images: string[], slug: string, batchSize: number = 5): Promise<string[]> {
	const results: string[] = [];
	
	for (let i = 0; i < images.length; i += batchSize) {
		const batch = images.slice(i, i + batchSize);
		const batchPromises = batch.map((img) => {
			const gKey = `memorial/${slug}/gallery_${uuidv4()}.webp`;
			return processImage(img, gKey);
		});
		
		const batchResults = await Promise.all(batchPromises);
		results.push(...batchResults);
	}
	
	return results;
}

/**
 * Processa uma imagem: se for base64, faz upload para S3. Se for URL, retorna a URL.
 */
async function processImage(imageData: string, key: string): Promise<string> {
	// Se já é uma URL (não base64), retorna diretamente
	if (!isBase64DataUrl(imageData)) {
		// Verifica se é uma URL válida
		try {
			new URL(imageData);
			return imageData;
		} catch {
			throw Object.assign(new Error('Imagem inválida: deve ser base64 ou URL válida'), { status: 400 });
		}
	}

	// Se é base64, processa e faz upload
	const { buffer, mimeType } = parseDataUrlToBuffer(imageData);

	const webpBuffer = await sharp(buffer)
		.rotate()
		.resize(1200, 1200, {
			fit: 'inside',
			withoutEnlargement: true
		})
		.webp({
			quality: 90,
			effort: 3,
			smartSubsample: true
		})
		.toBuffer();

	// Garantir que a chave termina com .webp
	const webpKey = key.replace(/\.[^/.]+$/, '') + '.webp';

	const webpFile = {
		buffer: webpBuffer,
		mimetype: 'image/webp',
		originalname: webpKey.split('/').pop() || 'image.webp',
	};

	const imageUrl = await uploadToS3(webpFile, webpKey, false);

	return imageUrl;
}

/**
 * Tipos de vídeo permitidos
 */
const ALLOWED_VIDEO_TYPES = ['video/mp4', 'video/webm', 'video/quicktime'];
const MAX_VIDEO_SIZE = 50 * 1024 * 1024; // 50MB

/**
 * Processa um vídeo: se for base64, valida tamanho e tipo, comprime e faz upload para S3. Se for URL, retorna a URL.
 */
async function processVideo(videoData: string, key: string): Promise<string> {
	// Se já é uma URL (não base64), retorna diretamente
	if (!isBase64VideoUrl(videoData)) {
		// Verifica se é uma URL válida
		try {
			new URL(videoData);
			return videoData;
		} catch {
			throw Object.assign(new Error('Vídeo inválido: deve ser base64 ou URL válida'), { status: 400 });
		}
	}

	// Se é base64, processa e valida
	const { buffer, mimeType, extension } = parseDataUrlToBuffer(videoData);

	// Validar tipo de vídeo
	if (!ALLOWED_VIDEO_TYPES.includes(mimeType)) {
		throw Object.assign(new Error(`Tipo de vídeo não permitido. Tipos permitidos: ${ALLOWED_VIDEO_TYPES.join(', ')}`), { status: 400 });
	}

	// Validar tamanho máximo (50MB antes da compressão)
	if (buffer.length > MAX_VIDEO_SIZE) {
		throw Object.assign(new Error(`Vídeo muito grande. Tamanho máximo: ${MAX_VIDEO_SIZE / (1024 * 1024)}MB`), { status: 400 });
	}

	// Comprimir vídeo para reduzir tamanho
	let finalBuffer: Buffer;
	let finalMimeType: string;
	let finalExtension: string;

	try {
		console.log(`Comprimindo vídeo: ${(buffer.length / (1024 * 1024)).toFixed(2)}MB`);
		finalBuffer = await compressVideo(buffer, mimeType);
		finalMimeType = 'video/mp4';
		finalExtension = 'mp4';
		const reduction = ((1 - finalBuffer.length / buffer.length) * 100).toFixed(1);
		console.log(`Vídeo comprimido: ${(finalBuffer.length / (1024 * 1024)).toFixed(2)}MB (redução de ${reduction}%)`);
	} catch (error) {
		console.error('Erro ao comprimir vídeo, usando original:', error);
		// Se a compressão falhar, usar o vídeo original
		finalBuffer = buffer;
		finalMimeType = mimeType;
		finalExtension = extension;
	}

	// Garantir que a chave termina com .mp4 (sempre MP4 após compressão)
	const videoKey = key.replace(/\.[^/.]+$/, '') + '.mp4';

	const videoFile = {
		buffer: finalBuffer,
		mimetype: finalMimeType,
		originalname: videoKey.split('/').pop() || 'video.mp4',
	};

	const videoUrl = await uploadToS3(videoFile, videoKey, false);

	return videoUrl;
}

/**
 * Processa múltiplos vídeos em lotes de 3 em paralelo (menos que imagens devido ao tamanho)
 */
async function processVideosInBatches(videos: string[], slug: string, batchSize: number = 3): Promise<string[]> {
	const results: string[] = [];
	
	for (let i = 0; i < videos.length; i += batchSize) {
		const batch = videos.slice(i, i + batchSize);
		const batchPromises = batch.map((video) => {
			const vKey = `memorial/${slug}/video_${uuidv4()}`;
			return processVideo(video, vKey);
		});
		
		const batchResults = await Promise.all(batchPromises);
		results.push(...batchResults);
	}
	
	return results;
}

memoriaisRouter.post('/', requireAuth, async (req, res) => {
	try {
		const parsed = createMemorialSchema.parse(req.body);

		const mainKey = `memorial/${parsed.slug}/main_${Date.now()}.webp`;
		const mainUrl = await processImage(parsed.fotoMainUrl, mainKey);

		console.time('processImage');
		const galleryUrls = await processImagesInBatches(parsed.galeriaFotos || [], parsed.slug);
		console.timeEnd('processImage');

		console.time('processVideo');
		const videoUrls = await processVideosInBatches(parsed.galeriaVideos || [], parsed.slug);
		console.timeEnd('processVideo');

		const result = await service.create({
			nome: parsed.nome,
			biografia: parsed.biografia,
			slug: parsed.slug,
			fotoMainUrl: mainUrl,
			corPrincipal: parsed.corPrincipal,
			galeriaFotos: galleryUrls,
			galeriaVideos: videoUrls,
			dataNascimento: parsed.dataNascimento ? new Date(parsed.dataNascimento) : null,
			dataMorte: parsed.dataMorte ? new Date(parsed.dataMorte) : null,
			causaMorte: parsed.causaMorte ?? null,
		});
		if (!result.ok) return res.status(result.status).json({ error: result.error });
		return res.status(201).json(rowToDto(result.data));
	} catch (err: any) {
		console.log('err', err);
		if (err?.issues) {
			return res.status(400).json({ error: 'Validação falhou', details: err.issues });
		}
		return res.status(500).json({ error: 'Erro ao processar imagens' });
	}
});

memoriaisRouter.put('/:slug', requireAuth, async (req, res) => {
	const slug = req.params.slug;
	const existing = await service.findBySlug(slug);
	if (!existing) return res.status(404).json({ error: 'Memorial não encontrado' });
	try {
		const parsed = updateMemorialSchema.parse(req.body ?? {});
		// validação de conflito via service em update
		let newMainUrl = existing.fotoMainUrl;
		if (parsed.fotoMainUrl) {
			const mainKey = `memorial/${parsed.slug ?? existing.slug}/main_${Date.now()}.webp`;
			newMainUrl = await processImage(parsed.fotoMainUrl, mainKey);
		}
		let galleryUrls = existing.galeriaFotos;
		if (parsed.galeriaFotos) {
			galleryUrls = await processImagesInBatches(parsed.galeriaFotos, parsed.slug ?? existing.slug);
		}
		let videoUrls = existing.galeriaVideos;
		if (parsed.galeriaVideos) {
			videoUrls = await processVideosInBatches(parsed.galeriaVideos, parsed.slug ?? existing.slug);
		}
		const updated = {
			nome: parsed.nome ?? existing.nome,
			biografia: parsed.biografia ?? existing.biografia,
			slug: parsed.slug ?? existing.slug,
			fotoMainUrl: newMainUrl,
			corPrincipal: parsed.corPrincipal ?? existing.corPrincipal,
			galeriaFotos: galleryUrls,
			galeriaVideos: videoUrls,
			dataNascimento: parsed.dataNascimento !== undefined ? (parsed.dataNascimento ? new Date(parsed.dataNascimento) : null) : existing.dataNascimento,
			dataMorte: parsed.dataMorte !== undefined ? (parsed.dataMorte ? new Date(parsed.dataMorte) : null) : existing.dataMorte,
			causaMorte: parsed.causaMorte !== undefined ? parsed.causaMorte : existing.causaMorte,
		};
		const result = await service.update(slug, updated);
		if (!result.ok) return res.status(result.status).json({ error: result.error });
		return res.status(200).json(rowToDto(result.data));
	} catch (err: any) {
		console.log('err', err);
		if (err?.issues) {
			return res.status(400).json({ error: 'Validação falhou', details: err.issues });
		}
		return res.status(500).json({ error: 'Erro ao atualizar memorial' });
	}
});

memoriaisRouter.delete('/:slug', requireAuth, async (req, res) => {
	const slug = req.params.slug;
	const existing = await service.findBySlug(slug);
	if (!existing) return res.status(404).json({ error: 'Memorial não encontrado' });

	// Deletar toda a "pasta" do memorial na S3 (todos os objetos com prefixo memorial/${slug}/)
	// Isso garante que todas as imagens sejam deletadas, mesmo as órfãs que não estão mais no banco
	try {
		const prefix = `memorial/${slug}/`;
		await deleteAllFromPrefix(prefix);
	} catch (error) {
		console.error('Erro ao deletar imagens da S3:', error);
		// Se falhar, continuamos com a remoção do registro para não bloquear a operação
	}

	const result = await service.delete(slug);
	if (!result.ok) return res.status(result.status).json({ error: result.error });

	return res.status(200).json({ success: true, message: 'Memorial deletado com sucesso' });
});


