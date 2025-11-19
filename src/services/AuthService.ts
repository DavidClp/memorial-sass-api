import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { IUsersRepository } from '../domain/repositories/IUsersRepository.js';

export class AuthService {
	constructor(private readonly usersRepo: IUsersRepository) {}

	async login(email: string, senha: string) {
		const user = await this.usersRepo.findByEmail(email);
		if (!user) {
			console.log('nao tem usuario');
			return { ok: false as const, status: 401, error: 'Credenciais inválidas' };
		}
		
		const ok = await bcrypt.compare(senha, user.senha);
		if (!ok) {
			console.log('senha nao confere');
			return { ok: false as const, status: 401, error: 'Credenciais inválidas' };
		}

		const payload = { email: user.email, name: user.name };

		const token = jwt.sign(payload, process.env.JWT_SECRET || 'changeme'/* , { expiresIn: '12h' } */);
		return { ok: true as const, token, user: payload };
	}
}


