const express = require('express');
const cors = require('cors');
const dotenv = require('dotenv');
const jwt = require('jsonwebtoken');

// Carrega variáveis de ambiente
dotenv.config();

const app = express();

// ============================================
// CONFIGURAÇÃO CORS - permite acesso do frontend
// ============================================
app.use(cors({
  origin: ['https://menuia-khaki.vercel.app', 'http://localhost:3000'],
  methods: ['GET', 'POST', 'PUT', 'DELETE'],
  credentials: true
}));

// ============================================
// AUMENTA LIMITE DE PAYLOAD PARA 10MB
// Isso permite enviar fotos em alta resolução
// sem compressão no celular
// ============================================
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ limit: '10mb', extended: true }));

// ============================================
// SERVIÇOS FIREBASE
// ============================================
const { db } = require('./services/firebase');

// ============================================
// ROTAS
// ============================================
const authRoutes = require('./routes/auth');
const contentRoutes = require('./routes/content');
const videosRoutes = require('./routes/videos');

app.use('/api/auth', authRoutes);
app.use('/api/content', contentRoutes);
app.use('/api/videos', videosRoutes);

// ============================================
// ROTA DE TESTE
// ============================================
app.get('/', (req, res) => {
  res.json({ 
    message: 'MenuIA Backend rodando!',
    status: 'online',
    timestamp: new Date().toISOString()
  });
});

// ============================================
// ROTA DE SAÚDE (health check)
// ============================================
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// ============================================
// ERRO 404
// ============================================
app.use((req, res) => {
  res.status(404).json({ error: 'Rota não encontrada' });
});

// ============================================
// ERRO 500
// ============================================
app.use((err, req, res, next) => {
  console.error('Erro no servidor:', err);
  res.status(500).json({ error: 'Erro interno do servidor' });
});

// ============================================
// INICIA SERVIDOR
// ============================================
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`✅ Servidor rodando na porta ${PORT}`);
  console.log(`📦 Limite de payload: 10MB (fotos em alta resolução)`);
});
