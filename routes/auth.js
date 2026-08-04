const express = require('express');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { db } = require('../services/firebase');
const router = express.Router();

router.post('/register', async (req, res) => {
  try {
    const { email, password, restaurantName, phone } = req.body;
    const userRef = db.collection('users').doc();
    const hashedPassword = await bcrypt.hash(password, 10);

    await userRef.set({
      email,
      password: hashedPassword,
      restaurantName,
      phone: phone || '',
      plan: 'basic',              // Novo usuario comeca no plano Basico
      createdAt: new Date(),
      generationsUsed: 0,
      generationsLimit: 5,
      videosGeneratedThisMonth: 0,
      lastVideoReset: ''
    });

    const token = jwt.sign({ uid: userRef.id }, process.env.JWT_SECRET, { expiresIn: '7d' });
    res.json({ token, uid: userRef.id, restaurantName, plan: 'basic' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body;
    const snapshot = await db.collection('users').where('email', '==', email).limit(1).get();
    if (snapshot.empty) return res.status(400).json({ error: 'Usuario nao encontrado' });

    const userDoc = snapshot.docs[0];
    const user = userDoc.data();

    const valid = await bcrypt.compare(password, user.password);
    if (!valid) return res.status(400).json({ error: 'Senha incorreta' });

    const token = jwt.sign({ uid: userDoc.id }, process.env.JWT_SECRET, { expiresIn: '7d' });
    res.json({ 
      token, 
      uid: userDoc.id, 
      restaurantName: user.restaurantName, 
      plan: user.plan || 'basic',
      generationsUsed: user.generationsUsed || 0
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
