require('dotenv').config();
const express = require('express');
const cors = require('cors');

const authRoutes = require('./routes/auth');
const contentRoutes = require('./routes/content');
const videoRoutes = require('./routes/video');
const menuRoutes = require('./routes/menu');
const whatsappRoutes = require('./routes/whatsapp');

const app = express();
app.use(cors());
app.use(express.json({ limit: '10mb' }));

app.use('/api/auth', authRoutes);
app.use('/api/content', contentRoutes);
app.use('/api/video', videoRoutes);
app.use('/api/menu', menuRoutes);
app.use('/api/whatsapp', whatsappRoutes);

app.get('/health', (req, res) => res.json({ status: 'ok', service: 'MenuIA' }));

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`MenuIA Backend rodando na porta ${PORT}`));
