// app.js
import express from 'express';
import path from 'path';
import helmet from 'helmet';
import cors from 'cors';
import v1Routes from './src/routes/api.routes.js';

const app = express();

app.use(helmet());
app.use(cors());

app.use(express.json({ limit: '1mb' }));
app.use(express.urlencoded({ extended: true }));

app.use(express.static(path.resolve('public')));

app.use('/v1', v1Routes);

app.use((req, res) => res.status(404).json({ error: 'Endpoint não encontrado' }));

app.use((err, req, res, next) => {
    console.error(err);
    res.status(500).json({ error: 'Erro interno' });
});

export default app;
