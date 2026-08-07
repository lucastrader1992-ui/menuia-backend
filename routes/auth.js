const express = require('express');
const router = express.Router();
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { db } = require('../services/firebase');

// POST /api/auth/register
router.post('/register', async (req, res) => {
  try {
    const { email, password, restaurantName } = req.body;

    if (!email || !password || !restaurantName) {
      return res.status(400).json({ error: 'Email, senha e nome do restaurante sao obrigatorios' });
    }

    // Verifica se email já existe
    const existing = await db.collection('users').where('email', '==', email).get();
    if (!existing.empty) {
      return res.status(400).json({ error: 'Email ja cadastrado' });
    }

    // Hash da senha
    const hashedPassword = await bcrypt.hash(password, 10);

    // Cria usuário com plano "unico" (plano único R$ 100)
    const userRef = db.collection('users').doc();
    await userRef.set({
      uid: userRef.id,
      email,
      password: hashedPassword,
      restaurantName,
      plan: 'unico',              // ← Plano único R$ 100/mês
      contentsGeneratedThisMonth: 0,
      videosGeneratedThisMonth: 0,
      lastContentReset: '',
      lastVideoReset: '',
      createdAt: new Date().toISOString()
    });

    // Gera token JWT
    const token = jwt.sign(
      { uid: userRef.id, email, restaurantName },
      process.env.JWT_SECRET,
      { expiresIn: '24h' }
    );

    res.status(201).json({
      token,
      user: {
        uid: userRef.id,
        email,
        restaurantName,
        plan: 'unico'
      }
    });
  } catch (error) {
    console.error('Erro no cadastro:', error);
    res.status(500).json({ error: 'Erro ao criar conta' });
  }
});

// POST /api/auth/login
router.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ error: 'Email e senha sao obrigatorios' });
    }

    const userSnapshot = await db.collection('users').where('email', '==', email).get();
    if (userSnapshot.empty) {
      return res.status(401).json({ error: 'Email ou senha incorretos' });
    }

    const userDoc = userSnapshot.docs[0];
    const userData = userDoc.data();

    const isValid = await bcrypt.compare(password, userData.password);
    if (!isValid) {
      return res.status(401).json({ error: 'Email ou senha incorretos' });
    }

    const token = jwt.sign(
      { uid: userData.uid, email, restaurantName: userData.restaurantName },
      process.env.JWT_SECRET,
      { expiresIn: '24h' }
    );

    res.json({
      token,
      user: {
        uid: userData.uid,
        email,
        restaurantName: userData.restaurantName,
        plan: userData.plan || 'unico'
      }
    });
  } catch (error) {
    console.error('Erro no login:', error);
    res.status(500).json({ error: 'Erro ao fazer login' });
  }
});

module.exports = router;
