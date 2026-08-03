const express = require('express');
const { verifyToken } = require('../middleware/auth');
const { db } = require('../services/firebase');
const QRCode = require('qrcode');
const router = express.Router();

router.post('/create', verifyToken, async (req, res) => {
  try {
    const { items, theme } = req.body;
    const menuId = db.collection('menus').doc().id;

    await db.collection('menus').doc(menuId).set({
      userId: req.user.uid,
      restaurantName: req.user.restaurantName,
      items,
      theme: theme || 'default',
      active: true,
      createdAt: new Date()
    });

    const publicUrl = `${process.env.FRONTEND_URL || 'https://menuia.app'}/menu/${menuId}`;
    const qrCodeData = await QRCode.toDataURL(publicUrl);

    res.json({ success: true, menuId, publicUrl, qrCode: qrCodeData });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.get('/public/:menuId', async (req, res) => {
  try {
    const doc = await db.collection('menus').doc(req.params.menuId).get();
    if (!doc.exists) return res.status(404).json({ error: 'Cardápio não encontrado' });

    res.json({ id: doc.id, ...doc.data() });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
