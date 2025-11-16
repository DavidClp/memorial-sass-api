export type ParsedBase64 = {
	buffer: Buffer;
	mimeType: string;
	extension: string;
};

const mimeToExt: Record<string, string> = {
	'image/jpeg': 'jpg',
	'image/png': 'png',
	'image/webp': 'webp',
	'image/gif': 'gif',
};

export function parseDataUrlToBuffer(dataUrl: string): ParsedBase64 {
	// Ex.: data:image/jpeg;base64,/9j/4AAQ...
	const match = /^data:(.+);base64,(.+)$/.exec(dataUrl);
	if (!match) {
		throw Object.assign(new Error('Imagem base64 inválida'), { status: 400 });
	}
	const mimeType = match[1];
	const b64 = match[2];
	const buffer = Buffer.from(b64, 'base64');
	const extension = mimeToExt[mimeType] || 'bin';
	return { buffer, mimeType, extension };
}

export function s3UrlToKey(url: string): string | null {
	try {
		const u = new URL(url);
		// pathname begins with '/'
		return u.pathname.startsWith('/') ? u.pathname.slice(1) : u.pathname;
	} catch {
		return null;
	}
}


