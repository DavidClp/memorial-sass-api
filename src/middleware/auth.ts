import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';

export interface AuthPayload {
	email: string;
	name: string;
}

export interface AuthRequest extends Request {
	user?: AuthPayload;
}

export function requireAuth(req: AuthRequest, res: Response, next: NextFunction): void | Response {
	const header = req.headers['authorization'];

	if (!header || !header.startsWith('Bearer ')) {
		return res.status(401).json({ error: 'Token ausente ou inválido' });
	}
	const token = header.substring('Bearer '.length);
	try {
		const secret = process.env.JWT_SECRET || 'changeme';
		const payload = jwt.verify(token, secret) as AuthPayload;
		req.user = { email: payload.email, name: payload.name };
		return next();
	} catch {
		return res.status(401).json({ error: 'Token inválido' });
	}
}