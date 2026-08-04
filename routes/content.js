const express = require('express');
const jwt = require('jsonwebtoken');
const { generateContent, generatePromotionIdea } = require('../services/openai');
const { db } = require('../services/firebase');
const router = express.Router();

// Middleware para verificar JWT
function verifyToken(req, res, next) {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({ error: 'Token nao fornecido' });
    }
    const token = authHeader.split(' ')[1];
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    req.user = { uid: decoded.uid };
    next();
  } catch (err) {
    res.status(401).json({ error: 'Token invalido' });
  }
}

router.post('/generate', verifyToken, async (req, res) => {
  try {
    const { photoDescription, dishName, price, tone, imageBase64 } = req.body;
    const user = req.user;

    // Busca dados do usuario
    const userDoc = await db.collection('users').doc(user.uid).get();
    const userData = userDoc.exists ? userDoc.data() : {};
    
    // Só bloqueia se for plano free (nao pagante)
    if (userData.plan === 'free' && (userData.generationsUsed || 0) >= (userData.generationsLimit || 5)) {
      return res.status(403).json({ error: 'Limite de geracoes atingido. Faca upgrade para um plano pago.' });
    }

    const content = await generateContent(photoDescription, userData.restaurantName || '', dishName, price, tone);

    // Salva no historico
    await db.collection('users').doc(user.uid).collection('contents').add({
      dishName,
      price,
      content,
      imageBase64: imageBase64?.substring(0, 500) || '',
      createdAt: new Date()
    });

    // Incrementa contador (apenas para controle, nao bloqueia planos pagos)
    if (userData.plan === 'free') {
      await db.collection('users').doc(user.uid).update({
        generationsUsed: (userData.generationsUsed || 0) + 1
      });
    }

    res.json({ success: true, content });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.post('/promotion-idea', verifyToken, async (req, res) => {
  try {
    const { inventory, dayOfWeek, weather } = req.body;
    const idea = await generatePromotionIdea(inventory, dayOfWeek, weather);
    res.json({ success: true, idea });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.get('/history', verifyToken, async (req, res) => {
  try {
    const snapshot = await db.collection('users').doc(req.user.uid)
      .collection('contents').orderBy('createdAt', 'desc').limit(20).get();

    const history = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
    res.json({ history });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
