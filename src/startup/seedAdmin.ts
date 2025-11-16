import bcrypt from 'bcryptjs';
import { v4 as uuidv4 } from 'uuid';
import { prisma } from '../infra/prisma/client.js';

export async function ensureAdminSeed() {
	const email = process.env.ADMIN_EMAIL;
	const password = process.env.ADMIN_PASSWORD;
	if (!email || !password) {
		console.warn('[seedAdmin] ADMIN_EMAIL/ADMIN_PASSWORD não definidos. Pular seed de admin.');
		return;
	}
	const exists = await prisma.user.findUnique({ where: { email }, select: { id: true } });
	if (exists?.id) return;
	const hash = await bcrypt.hash(password, 10);
	await prisma.user.create({
		data: { id: uuidv4(), email, senha: hash, name: 'Administrador' },
	});
	console.log('[seedAdmin] Usuário admin criado:', email);
}


