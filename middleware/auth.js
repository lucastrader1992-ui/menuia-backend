const jwt = require('jsonwebtoken');
const { db } = require('../services/firebase');

async function verifyToken(req, res, next) {
  const token = req.headers.authorization?.split(' ')[1];
  if (!token) return res.status(401).json({ error: 'Token não fornecido' });

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const userDoc = await db.collection('users').doc(decoded.uid).get();
    if (!userDoc.exists) return res.status(401).json({ error: 'Usuário não encontrado' });

    req.user = { uid: decoded.uid, ...userDoc.data() };
    next();
  } catch (err) {
    res.status(401).json({ error: 'Token inválido' });
  }
}

module.exports = { verifyToken };
