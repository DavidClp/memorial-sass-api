import ffmpeg from 'fluent-ffmpeg';
import ffmpegInstaller from '@ffmpeg-installer/ffmpeg';
import { writeFileSync, unlinkSync, readFileSync } from 'fs';
import { join } from 'path';
import { tmpdir } from 'os';

// Configurar o caminho do FFmpeg do pacote (não precisa instalar manualmente no servidor)
ffmpeg.setFfmpegPath(ffmpegInstaller.path);

/**
 * Comprime um vídeo usando FFmpeg para reduzir o tamanho do arquivo
 * @param inputBuffer - Buffer do vídeo original
 * @param mimeType - Tipo MIME do vídeo original
 * @returns Buffer do vídeo comprimido
 */
export async function compressVideo(inputBuffer: Buffer, mimeType: string): Promise<Buffer> {
	const tempInputPath = join(tmpdir(), `input_${Date.now()}_${Math.random().toString(36).substring(7)}.${getExtensionFromMime(mimeType)}`);
	const tempOutputPath = join(tmpdir(), `output_${Date.now()}_${Math.random().toString(36).substring(7)}.mp4`);

	try {
		// Escrever buffer temporário no disco
		writeFileSync(tempInputPath, inputBuffer);

		// Comprimir vídeo com FFmpeg
		await new Promise<void>((resolve, reject) => {
			ffmpeg(tempInputPath)
				.videoCodec('libx264') // Codec H.264
				.audioCodec('aac') // Codec de áudio AAC
				.outputOptions([
					'-preset medium', // Balance entre velocidade e compressão
					'-crf 26', // Quality factor (18-28, menor = melhor qualidade)
					'-maxrate 2M', // Bitrate máximo de 2 Mbps
					'-bufsize 4M', // Buffer size
					'-vf scale=1920:1080:force_original_aspect_ratio=decrease', // Máximo 1080p, mantém aspect ratio
					'-movflags +faststart', // Otimiza para streaming
					'-pix_fmt yuv420p', // Compatibilidade com players
				])
				.on('end', () => {
					resolve();
				})
				.on('error', (err) => {
					reject(err);
				})
				.save(tempOutputPath);
		});

		// Ler vídeo comprimido
		const compressedBuffer = readFileSync(tempOutputPath);

		// Limpar arquivos temporários
		unlinkSync(tempInputPath);
		unlinkSync(tempOutputPath);

		return compressedBuffer;
	} catch (error) {
		// Limpar arquivos temporários em caso de erro
		try {
			unlinkSync(tempInputPath);
		} catch {}
		try {
			unlinkSync(tempOutputPath);
		} catch {}

		throw Object.assign(
			new Error(`Erro ao comprimir vídeo: ${error instanceof Error ? error.message : 'Erro desconhecido'}`),
			{ status: 500 }
		);
	}
}

/**
 * Obtém a extensão do arquivo baseado no tipo MIME
 */
function getExtensionFromMime(mimeType: string): string {
	const mimeToExt: Record<string, string> = {
		'video/mp4': 'mp4',
		'video/webm': 'webm',
		'video/quicktime': 'mov',
		'video/x-msvideo': 'avi',
	};
	return mimeToExt[mimeType] || 'mp4';
}

