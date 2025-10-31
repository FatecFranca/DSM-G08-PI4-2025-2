import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import pool from '../config/config.js';

const JWT_SECRET = process.env.JWT_SECRET || 'seu_jwt_secreto_aqui';

export class AuthController {
    static async register(req, res) {
        try {
            const { email, password, name } = req.body;

            if (!email || !password || !name) {
                return res.status(400).json({ error: 'Email, senha e nome são obrigatórios' });
            }

            // Verificar se usuário já existe
            const [existingUsers] = await pool.query(
                'SELECT id FROM Users WHERE email = ?',
                [email]
            );

            if (existingUsers.length > 0) {
                return res.status(400).json({ error: 'Usuário já existe' });
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
            const token = jwt.sign(
                { userId: result.insertId, email },
                JWT_SECRET,
                { expiresIn: '7d' }
            );

            res.status(201).json({
                user: {
                    id: result.insertId,
                    email,
                    name
                },
                token
            });

        } catch (error) {
            console.error('Erro no registro:', error);
            res.status(500).json({ error: 'Erro interno do servidor' });
        }
    }

    static async login(req, res) {
        try {
            const { email, password } = req.body;

            if (!email || !password) {
                return res.status(400).json({ error: 'Email e senha são obrigatórios' });
            }

            // Buscar usuário
            const [users] = await pool.query(
                'SELECT * FROM Users WHERE email = ?',
                [email]
            );

            if (users.length === 0) {
                return res.status(401).json({ error: 'Credenciais inválidas' });
            }

            const user = users[0];

            // Verificar senha
            const validPassword = await bcrypt.compare(password, user.password_hash);
            if (!validPassword) {
                return res.status(401).json({ error: 'Credenciais inválidas' });
            }

            // Gerar token JWT
            const token = jwt.sign(
                { userId: user.id, email: user.email },
                JWT_SECRET,
                { expiresIn: '7d' }
            );

            res.json({
                user: {
                    id: user.id,
                    email: user.email,
                    name: user.name
                },
                token
            });

        } catch (error) {
            console.error('Erro no login:', error);
            res.status(500).json({ error: 'Erro interno do servidor' });
        }
    }

    static async getProfile(req, res) {
        try {
            const userId = req.userId;

            const [users] = await pool.query(
                'SELECT id, email, name, created_at FROM Users WHERE id = ?',
                [userId]
            );

            if (users.length === 0) {
                return res.status(404).json({ error: 'Usuário não encontrado' });
            }

            res.json({ user: users[0] });
        } catch (error) {
            console.error('Erro ao buscar perfil:', error);
            res.status(500).json({ error: 'Erro interno do servidor' });
        }
    }

    // Adicione este método ao final da classe AuthController no authController.js
    static async logout(req, res) {
        try {
            // Em sistemas JWT, o logout é feito no cliente descartando o token
            // Mas podemos invalidar tokens se estiver usando uma blacklist
            res.json({ message: 'Logout realizado com sucesso' });
        } catch (error) {
            console.error('Erro no logout:', error);
            res.status(500).json({ error: 'Erro interno do servidor' });
        }
    }
}

