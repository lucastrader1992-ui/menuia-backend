const express = require('express');
const router = express.Router();
const jwt = require('jsonwebtoken');
const { db } = require('../services/firebase');
const { generateVideoScript } = require('../services/openai');

// ============================================
// CONFIGURAÇÃO: 20 vídeos/mês para TODOS os planos
// ============================================
const VIDEO_LIMIT_PER_MONTH = 20;

// Helper: verifica quota de vídeos do usuário
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

  return {
    canGenerate: videosUsed < VIDEO_LIMIT_PER_MONTH,
    limit: VIDEO_LIMIT_PER_MONTH,
    used: videosUsed,
    remaining: Math.max(0, VIDEO_LIMIT_PER_MONTH - videosUsed)
  };
}

// POST /api/videos/generate - Gerar roteiro de vídeo
router.post('/generate', async (req, res) => {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({ error: 'Nao autorizado' });
    }

    const token = authHeader.split(' ')[1];
    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    const userDoc = await db.collection('users').doc(decoded.uid).get();
    const userData = userDoc.exists ? userDoc.data() : {};
    const user = { uid: decoded.uid, ...userData };

    const quota = await checkVideoQuota(user);

    if (!quota.canGenerate) {
      return res.status(403).json({ 
        error: `Limite de ${VIDEO_LIMIT_PER_MONTH} videos/mes atingido.`,
        quota
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

// GET /api/videos/quota - Ver quota restante
router.get('/quota', async (req, res) => {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({ error: 'Nao autorizado' });
    }

    const token = authHeader.split(' ')[1];
    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    const userDoc = await db.collection('users').doc(decoded.uid).get();
    const userData = userDoc.exists ? userDoc.data() : {};
    const user = { uid: decoded.uid, ...userData };

    const quota = await checkVideoQuota(user);
    res.json(quota);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// POST /api/videos/render - Renderizar vídeo no servidor
// TODO: Implementar quando tiver conta no Renderly/Shotstack
router.post('/render', async (req, res) => {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({ error: 'Nao autorizado' });
    }

    const token = authHeader.split(' ')[1];
    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    const userDoc = await db.collection('users').doc(decoded.uid).get();
    const userData = userDoc.exists ? userDoc.data() : {};
    const user = { uid: decoded.uid, ...userData };

    const quota = await checkVideoQuota(user);
    if (!quota.canGenerate) {
      return res.status(403).json({ 
        error: `Limite de ${VIDEO_LIMIT_PER_MONTH} videos/mes atingido.`,
        quota
      });
    }

    const { imageBase64, dishName, price, restaurantName, texts } = req.body;

    if (!imageBase64 || !dishName) {
      return res.status(400).json({ error: 'Imagem e nome do prato sao obrigatorios' });
    }

    // ============================================
    // FUTURO: Implementar chamada à API Renderly/Shotstack aqui
    // ============================================
    // 1. Fazer upload da imagem para Firebase Storage
    // 2. Montar template JSON com foto + textos
    // 3. Enviar para Renderly/Shotstack
    // 4. Receber URL do MP4
    // 5. Atualizar quota
    // 6. Retornar URL para o frontend
    // ============================================

    res.status(501).json({ 
      error: 'Renderizacao no servidor em desenvolvimento. Use a versao do navegador.',
      fallback: true,
      quota
    });

  } catch (error) {
    console.error('Erro ao renderizar video:', error);
    res.status(500).json({ error: 'Erro ao renderizar video no servidor' });
  }
});

module.exports = router;
