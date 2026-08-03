const express = require('express');
const { verifyToken } = require('../middleware/auth');
const { db } = require('../services/firebase');
const router = express.Router();

router.post('/save', verifyToken, async (req, res) => {
  try {
    const { dishName, videoBase64, texts } = req.body;

    await db.collection('users').doc(req.user.uid).collection('videos').add({
      dishName,
      videoBase64: videoBase64?.substring(0, 1000) || '', // preview only
      texts,
      createdAt: new Date()
    });

    res.json({ success: true, message: 'Vídeo salvo no histórico' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
