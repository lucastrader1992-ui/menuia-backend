const express = require('express');
const { verifyToken } = require('../middleware/auth');
const { db } = require('../services/firebase');
const axios = require('axios');
const router = express.Router();

router.post('/send', verifyToken, async (req, res) => {
  try {
    const { phoneNumbers, message, imageBase64 } = req.body;
    const results = [];

    for (const phone of phoneNumbers) {
      try {
        const payload = {
          number: phone.replace(/\D/g, ''),
          text: message,
        };

        if (imageBase64) {
          payload.media = imageBase64;
          payload.mediatype = 'image';
        }

        const response = await axios.post(
          `${process.env.EVOLUTION_API_URL}/message/sendText/${process.env.EVOLUTION_INSTANCE}`,
          payload,
          { headers: { 'apikey': process.env.EVOLUTION_API_KEY } }
        );

        results.push({ phone, status: 'sent', id: response.data?.key?.id });
      } catch (err) {
        results.push({ phone, status: 'error', error: err.message });
      }
    }

    // Salva no histórico
    await db.collection('users').doc(req.user.uid).collection('campaigns').add({
      message,
      recipients: phoneNumbers.length,
      results,
      createdAt: new Date()
    });

    res.json({ success: true, results });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.get('/campaigns', verifyToken, async (req, res) => {
  try {
    const snapshot = await db.collection('users').doc(req.user.uid)
      .collection('campaigns').orderBy('createdAt', 'desc').limit(20).get();

    const campaigns = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
    res.json({ campaigns });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
