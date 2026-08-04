const express = require('express');
const router = express.Router();
const { generateVideoScript } = require('../services/openai');
const { db } = require('../services/firebase');

// Helper: verifica quota de videos do usuario
async function checkVideoQuota(user) {
  const now = new Date();
  const currentMonth = `${now.getFullYear()}-${now.getMonth() + 1}`;
  const lastReset = user.lastVideoReset || '';
  
  let videosUsed = user.videosGeneratedThisMonth || 0;
  
  if (lastReset !== currentMonth) {
    await db.collection('users').doc(user.uid).update({
      videosGeneratedThisMonth: 0,
      lastVideoReset: currentMonth
    });
    videosUsed = 0;
  }
  
  const limits = { basic: 0, pro: 8, premium: 20 };
  const plan = user.plan || 'basic';
  const limit = limits[plan] || 0;
  
  return {
    canGenerate: limit > 0 && videosUsed < limit,
    limit,
    used: videosUsed,
    remaining: Math.max(0, limit - videosUsed),
    plan
  };
}

router.post('/generate', async (req, res) => {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({ error: 'Nao autorizado' });
    }

    const token = authHeader.split(' ')[1];
    const admin = require('firebase-admin');
    const decoded = await admin.auth().verifyIdToken(token);
    
    const userDoc = await db.collection('users').doc(decoded.uid).get();
    const userData = userDoc.exists ? userDoc.data() : {};
    const user = { uid: decoded.uid, ...userData };

    const quota = await checkVideoQuota(user);
    
    if (!quota.canGenerate) {
      return res.status(403).json({ 
        error: quota.plan === 'basic' 
          ? 'Videos disponiveis apenas no Plano Pro ou Premium. Faca upgrade!' 
          : `Limite de ${quota.limit} videos/mes atingido.`
      });
    }

    const { restaurantName, dishName, price, photoDescription, tone, videoDuration } = req.body;

    if (!restaurantName || !dishName) {
      return res.status(400).json({ error: 'Nome do restaurante e prato sao obrigatorios' });
    }

    const script = await generateVideoScript(
      photoDescription,
      restaurantName,
      dishName,
      price,
      tone,
      videoDuration || '15'
    );

    await db.collection('users').doc(user.uid).update({
      videosGeneratedThisMonth: quota.used + 1
    });

    res.json({ ...script, quota: { ...quota, used: quota.used + 1 } });
  } catch (error) {
    console.error('Erro ao gerar roteiro:', error);
    res.status(500).json({ error: 'Erro ao gerar roteiro de video' });
  }
});

router.get('/quota', async (req, res) => {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({ error: 'Nao autorizado' });
    }

    const token = authHeader.split(' ')[1];
    const admin = require('firebase-admin');
    const decoded = await admin.auth().verifyIdToken(token);
    
    const userDoc = await db.collection('users').doc(decoded.uid).get();
    const userData = userDoc.exists ? userDoc.data() : {};
    const user = { uid: decoded.uid, ...userData };

    const quota = await checkVideoQuota(user);
    res.json(quota);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
