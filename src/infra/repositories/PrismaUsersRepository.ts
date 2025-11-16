import { IUsersRepository, User } from '../../domain/repositories/IUsersRepository.js';
import { prisma } from '../prisma/client.js';

export class PrismaUsersRepository implements IUsersRepository {
	async findByEmail(email: string): Promise<User | undefined> {
		const u = await prisma.user.findUnique({ where: { email } });
		if (!u) return undefined;
		return { id: u.id, email: u.email, senha: u.senha, name: u.name };
	}
}


