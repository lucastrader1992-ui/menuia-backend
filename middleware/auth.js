const jwt = require('jsonwebtoken');
const { db } = require('../services/firebase');

async function verifyToken(req, res, next) {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({ error: 'Token nao fornecido' });
    }

    const token = authHeader.split(' ')[1];
    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    // Busca dados do usuario no Firestore
    const userDoc = await db.collection('users').doc(decoded.uid).get();
    const userData = userDoc.exists ? userDoc.data() : {};

    req.user = {
      uid: decoded.uid,
      email: userData.email || '',
      restaurantName: userData.restaurantName || '',
      plan: userData.plan || 'basic',
      generationsUsed: userData.generationsUsed || 0,
      videosGeneratedThisMonth: userData.videosGeneratedThisMonth || 0,
      lastVideoReset: userData.lastVideoReset || ''
    };

    next();
  } catch (err) {
    console.error('Erro no auth:', err);
    res.status(401).json({ error: 'Token invalido ou expirado' });
  }
}

module.exports = { verifyToken };
