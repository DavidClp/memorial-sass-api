import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import { json } from 'express';
import { authRouter } from './routes/auth.js';
import { memoriaisRouter } from './routes/memoriais.js';
import { ensureAdminSeed } from './startup/seedAdmin.js';
import { ensureDb } from './startup/ensureDb.js';

const app = express();

app.use(helmet());
app.use(cors({
	origin: '*',
	methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
	allowedHeaders: ['Content-Type', 'Authorization'],
}));
app.use(json({ limit: '15mb' }));

app.get('/health', (_req, res) => {
	res.setHeader('Content-Type', 'application/json');
	res.status(200).json({ ok: true });
});

app.use('/auth', authRouter);
app.use('/memoriais', memoriaisRouter);

// Error handler (formato padronizado)
// eslint-disable-next-line @typescript-eslint/no-unused-vars
app.use((err: any, _req: express.Request, res: express.Response, _next: express.NextFunction) => {
	const status = typeof err.status === 'number' ? err.status : 500;
	const message = err?.message ?? 'Erro no servidor';
	const details = err?.details ?? undefined;
	res.status(status).json({
		error: message,
		...(err?.code && { code: err.code }),
		...(details && { details }),
	});
});

async function bootstrap() {
	await ensureDb();
	await ensureAdminSeed();
	const port = Number(process.env.PORT || 4000);
	app.listen(port, () => {
		console.log(`[memorial-sass-api] rodando em http://localhost:${port}`);
	});
}

bootstrap().catch((e) => {
	console.error('Falha ao iniciar a aplicação:', e);
	process.exit(1);
});


