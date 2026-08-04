const express = require('express');
const router = express.Router();
const admin = require('firebase-admin');
const { db } = require('../services/firebase');

// POST /api/auth/register
router.post('/register', async (req, res) => {
  try {
    const { email, password, restaurantName, phone } = req.body;

    // Cria usuário no Firebase Auth
    const userRecord = await admin.auth().createUser({
      email,
      password,
      displayName: restaurantName
    });

    // Salva dados no Firestore
    await db.collection('users').doc(userRecord.uid).set({
      email,
      restaurantName,
      phone: phone || '',
      plan: 'basic',           // Todo novo usuário começa no plano básico
      generationsUsed: 0,
      generationsLimit: 5,
      videosGeneratedThisMonth: 0,
      lastVideoReset: '',
      createdAt: new Date()
    });

    // Gera token
    const token = await admin.auth().createCustomToken(userRecord.uid);

    res.json({
      token,
      uid: userRecord.uid,
      email,
      restaurantName,
      plan: 'basic'
    });
  } catch (err) {
    console.error('Erro no register:', err);
    res.status(400).json({ error: err.message });
  }
});

// POST /api/auth/login
router.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body;

    // Busca usuário no Firebase Auth pelo email
    const userRecord = await admin.auth().getUserByEmail(email);

    // Busca dados adicionais no Firestore
    const userDoc = await db.collection('users').doc(userRecord.uid).get();
    const userData = userDoc.exists ? userDoc.data() : {};

    // Gera token
    const token = await admin.auth().createCustomToken(userRecord.uid);

    res.json({
      token,
      uid: userRecord.uid,
      email: userRecord.email,
      restaurantName: userData.restaurantName || '',
      plan: userData.plan || 'basic',
      generationsUsed: userData.generationsUsed || 0
    });
  } catch (err) {
    console.error('Erro no login:', err);
    res.status(401).json({ error: 'Email ou senha inválidos' });
  }
});

module.exports = router;
