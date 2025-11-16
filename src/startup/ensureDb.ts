import { prisma } from '../infra/prisma/client.js';

export async function ensureDb() {
	// Com Prisma, garantimos a conexão; a criação de tabelas é via migrations.
	await prisma.$connect();
}


