// src/middlewares/authUser.js
import jwt from 'jsonwebtoken';
import pool from '../config/config.js';

const JWT_SECRET = process.env.JWT_SECRET || 'seu_jwt_secreto_aqui';

export async function authenticateUser(req, res, next) {
  const authHeader = req.header('Authorization');

  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ error: 'Token de acesso necessário' });
  }

  const token = authHeader.replace('Bearer ', '');

  try {
    const decoded = jwt.verify(token, JWT_SECRET);
    // Normal JWT (userId/email)
    if (decoded.userId) {
      req.user = { user_id: decoded.userId, email: decoded.email };
      return next();
    }

    // Caso o token seja um iot_token salvo no Users, podemos procurar o user
    // (opcional — mas deixo aqui para cobrir cenários)
    const [rows] = await pool.query('SELECT id, email FROM Users WHERE iot_token = ?', [token]);
    if (rows.length > 0) {
      req.user = { user_id: rows[0].id, email: rows[0].email };
      return next();
    }

    return res.status(401).json({ error: 'Token inválido' });
  } catch (err) {
    console.error('Erro na autenticação JWT:', err);
    return res.status(401).json({ error: 'Token inválido' });
  }
}
