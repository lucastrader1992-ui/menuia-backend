const express = require('express');
const { verifyToken } = require('../middleware/auth');
const { generateContent, generatePromotionIdea } = require('../services/openai');
const { db } = require('../services/firebase');
const router = express.Router();

router.post('/generate', verifyToken, async (req, res) => {
  try {
    const { photoDescription, dishName, price, tone, imageBase64 } = req.body;
    const user = req.user;

    if (user.plan === 'free' && user.generationsUsed >= user.generationsLimit) {
      return res.status(403).json({ error: 'Limite de gerações atingido. Faça upgrade.' });
    }

    const content = await generateContent(photoDescription, user.restaurantName, dishName, price, tone);

    // Salva no histórico
    await db.collection('users').doc(user.uid).collection('contents').add({
      dishName,
      price,
      content,
      imageBase64: imageBase64?.substring(0, 500) || '',
      createdAt: new Date()
    });

    // Incrementa contador
    await db.collection('users').doc(user.uid).update({
      generationsUsed: (user.generationsUsed || 0) + 1
    });

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
