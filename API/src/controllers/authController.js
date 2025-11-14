import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import pool from '../config/config.js';
import crypto from 'crypto';

const JWT_SECRET = process.env.JWT_SECRET || 'seu_jwt_secreto_aqui';

function formatErrorResponse(errorCode, message, details = null) {
    const resp = { error: message };
    if (details) resp.details = details;
    if (errorCode) resp.code = errorCode;
    return resp;
}

export class AuthController {
    static async register(req, res) {
        try {
            // proteção: req.body pode ser undefined
            const body = req.body || {};
            const { email, password, name } = body;

            // validação básica
            if (!email || !password || !name) {
                return res.status(400).json(formatErrorResponse('VALIDATION_ERROR', 'Email, senha e nome são obrigatórios'));
            }

            // opcional: validação simples de formato de email
            if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
                return res.status(400).json(formatErrorResponse('VALIDATION_ERROR', 'Email inválido'));
            }

            // Verificar se usuário já existe
            const [existingUsers] = await pool.query('SELECT id FROM Users WHERE email = ?', [email]);

            if (existingUsers && existingUsers.length > 0) {
                return res.status(409).json(formatErrorResponse('USER_EXISTS', 'Usuário já existe'));
            }

            // Hash da senha
            const saltRounds = 10;
            const password_hash = await bcrypt.hash(password, saltRounds);

            // Criar usuário
            const [result] = await pool.query(
                'INSERT INTO Users (email, password_hash, name) VALUES (?, ?, ?)',
                [email, password_hash, name]
            );

            // Gerar token JWT
            const token = jwt.sign({ userId: result.insertId, email }, JWT_SECRET, { expiresIn: '7d' });

            return res.status(201).json({
                user: {
                    id: result.insertId,
                    email,
                    name
                },
                token
            });

        } catch (error) {
            console.error('[AuthController.register] Erro no registro:', error);

            // Erros de BD podem ter error.code (ex: ER_DUP_ENTRY)
            if (error && error.code === 'ER_DUP_ENTRY') {
                return res.status(409).json(formatErrorResponse('USER_EXISTS', 'Usuário já existe (conflito no DB)'));
            }

            return res.status(500).json(formatErrorResponse('INTERNAL_ERROR', 'Erro interno do servidor'));
        }
    }

    static async login(req, res) {
        try {
            const body = req.body || {};
            const { email, password } = body;

            if (!email || !password) {
                return res.status(400).json(formatErrorResponse('VALIDATION_ERROR', 'Email e senha são obrigatórios'));
            }

            // Buscar usuário
            // console.log("AAAAAAAAAAAAAAAAAAAAAAA")
            const [users] = await pool.query('SELECT * FROM Users WHERE email = ?', [email]);

            if (!users || users.length === 0) {
                // não vaza se email existe - resposta genérica
                return res.status(401).json(formatErrorResponse('AUTH_FAILED', 'Credenciais inválidas'));
            }

            const user = users[0];

            // Verificar senha
            const validPassword = await bcrypt.compare(password, user.password_hash);
            if (!validPassword) {
                return res.status(401).json(formatErrorResponse('AUTH_FAILED', 'Credenciais inválidas'));
            }

            // Gerar token JWT
            const token = jwt.sign({ userId: user.id, email: user.email }, JWT_SECRET, { expiresIn: '7d' });

            return res.json({
                user: {
                    id: user.id,
                    email: user.email,
                    name: user.name
                },
                token
            });

        } catch (error) {
            console.error('[AuthController.login] Erro no login:', error);
            return res.status(500).json(formatErrorResponse('INTERNAL_ERROR', 'Erro interno do servidor'));
        }
    }

    static async getProfile(req, res) {
        try {
            // suporte a dois padrões: middleware que define req.userId ou req.user.user_id
            const userId = req.userId || (req.user && (req.user.user_id || req.user.userId));
            if (!userId) {
                return res.status(401).json(formatErrorResponse('AUTH_REQUIRED', 'Autenticação requerida'));
            }

            const [users] = await pool.query('SELECT id, email, name, created_at FROM Users WHERE id = ?', [userId]);

            if (!users || users.length === 0) {
                return res.status(404).json(formatErrorResponse('NOT_FOUND', 'Usuário não encontrado'));
            }

            return res.json({ user: users[0] });
        } catch (error) {
            console.error('[AuthController.getProfile] Erro ao buscar perfil:', error);
            return res.status(500).json(formatErrorResponse('INTERNAL_ERROR', 'Erro interno do servidor'));
        }
    }

    static async logout(req, res) {
        try {
            // logout com JWT é no cliente — aqui só respondemos
            return res.json({ message: 'Logout realizado com sucesso' });
        } catch (error) {
            console.error('[AuthController.logout] Erro no logout:', error);
            return res.status(500).json(formatErrorResponse('INTERNAL_ERROR', 'Erro interno do servidor'));
        }
    }

    static async getIotToken(req, res) {
        try {
            const userId = (req.user && (req.user.user_id || req.user.userId)) || req.userId;
            if (!userId) {
                return res.status(401).json(formatErrorResponse('AUTH_REQUIRED', 'Autenticação requerida'));
            }

            const [rows] = await pool.query('SELECT iot_token, iot_token_created_at FROM Users WHERE id = ?', [userId]);

            if (!rows || rows.length === 0) {
                return res.status(404).json(formatErrorResponse('NOT_FOUND', 'Usuário não encontrado'));
            }

            return res.json({ iot_token: rows[0].iot_token, created_at: rows[0].iot_token_created_at });
        } catch (err) {
            console.error('[AuthController.getIotToken] error:', err);
            return res.status(500).json(formatErrorResponse('INTERNAL_ERROR', 'Erro ao buscar iot_token'));
        }
    }

    static async generateIotToken(req, res) {
        try {
            const userId = (req.user && (req.user.user_id || req.user.userId)) || req.userId;
            if (!userId) {
                return res.status(401).json(formatErrorResponse('AUTH_REQUIRED', 'Autenticação requerida'));
            }

            const token = `user_${userId}_${crypto.randomBytes(12).toString('hex')}`;
            const now = new Date();

            await pool.query('UPDATE Users SET iot_token = ?, iot_token_created_at = ? WHERE id = ?', [token, now, userId]);

            return res.json({ iot_token: token, created_at: now });
        } catch (err) {
            console.error('[AuthController.generateIotToken] error:', err);
            return res.status(500).json(formatErrorResponse('INTERNAL_ERROR', 'Erro ao gerar iot_token'));
        }
    }
}