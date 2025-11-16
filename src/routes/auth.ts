import { Router } from 'express';
import { PrismaUsersRepository } from '../infra/repositories/PrismaUsersRepository.js';
import { AuthService } from '../services/AuthService.js';

export const authRouter = Router();

authRouter.post('/login', async (req, res) => {
	const { email, senha } = req.body || {};
	if (!email || !senha) {
		return res.status(400).json({ error: 'Credenciais inválidas' });
	}
	const service = new AuthService(new PrismaUsersRepository());
	const result = await service.login(email, senha);
	if (!result.ok) return res.status(result.status).json({ error: result.error });
	return res.status(200).json({ success: true, token: result.token, user: result.user });
});


