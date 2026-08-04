const express = require('express');
const router = express.Router();
const { generateVideoScript } = require('../services/openai');
const auth = require('../middleware/auth');

// POST /api/videos/generate - Gerar roteiro de vídeo
router.post('/generate', auth, async (req, res) => {
  try {
    const { restaurantName, dishName, price, photoDescription, tone, videoDuration } = req.body;
    
    if (!restaurantName || !dishName) {
      return res.status(400).json({ error: 'Nome do restaurante e prato são obrigatórios' });
    }

    const script = await generateVideoScript(
      photoDescription,
      restaurantName,
      dishName,
      price,
      tone,
      videoDuration || '15'
    );

    res.json(script);
  } catch (error) {
    console.error('Erro ao gerar roteiro de vídeo:', error);
    res.status(500).json({ error: 'Erro ao gerar roteiro de vídeo' });
  }
});

module.exports = router;
