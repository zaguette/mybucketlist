// server.js
require('dotenv').config();
const express = require('express');
const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const app = express();

app.use(express.json());

// Conexão com MongoDB Atlas (otimizada para ambientes serverless)
// Reutiliza conexão entre invocações para evitar abrir muitas conexões.
const MONGODB_URI = process.env.MONGODB_URI;
const mongooseOptions = {
  // Use mongoose defaults for v6+/v8; keep options explicit for clarity
  // autoIndex: false, // desabilitar em produção se quiser
};

// Cache global para reuso entre invocações (Lambda/Vercel reuse entre cold starts)
if (!global.__MONGOOSE_CACHE__) global.__MONGOOSE_CACHE__ = { conn: null, promise: null };

async function connectToDatabase() {
  const cached = global.__MONGOOSE_CACHE__;
  if (cached.conn) return cached.conn;
  if (!cached.promise) {
    cached.promise = mongoose.connect(MONGODB_URI, mongooseOptions)
      .then((m) => {
        cached.conn = m;
        // Log DB name if available (mongoose.connection.name or db.databaseName). Fallback to parsing URI.
        let dbName = null;
        try {
          if (mongoose && mongoose.connection) {
            dbName = mongoose.connection.name || (mongoose.connection.db && mongoose.connection.db.databaseName) || null;
          }
        } catch (e) { /* ignore */ }
        if (!dbName) {
          try {
            const parsed = new URL(MONGODB_URI);
            dbName = parsed.pathname ? parsed.pathname.replace('/', '') : null;
          } catch (e) { /* ignore */ }
        }
        console.log('✅ Conectado ao MongoDB Atlas' + (dbName ? ` — DB: ${dbName}` : ''));
        return cached.conn;
      })
      .catch(err => {
        // Limpa promise para que tentativas futuras possam tentar novamente
        cached.promise = null;
        console.error('❌ Erro ao conectar:', err);
        throw err;
      });
  }
  return cached.promise;
}

// Middleware: garante conexão antes de processar qualquer rota
app.use(async (req, res, next) => {
  try {
    await connectToDatabase();
    return next();
  } catch (err) {
    return next(err);
  }
});

// ---------------------- MODELOS ----------------------

const userSchema = new mongoose.Schema({
  nome: String,
  email: { type: String, unique: true },
  passwordHash: String,
  isDev: { type: Boolean, default: false },
  createdAt: { type: Date, default: Date.now }
});

const goalSchema = new mongoose.Schema({
  userId: mongoose.Schema.Types.ObjectId,
  titulo: String,
  descricao: String,
  data: String,
  concluida: { type: Boolean, default: false },
  icon: { type: String, default: '⭐' },
  color: { type: String, default: '#ffffff' },
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now }
});

const photoSchema = new mongoose.Schema({
  goalId: mongoose.Schema.Types.ObjectId,
  url: String,
  createdAt: { type: Date, default: Date.now }
});

const User = mongoose.model('User', userSchema);
const Goal = mongoose.model('Goal', goalSchema);
const Photo = mongoose.model('Photo', photoSchema);

// ---------------------- AUTENTICAÇÃO ----------------------

function authMiddleware(req, res, next) {
  const auth = req.headers.authorization;
  if (!auth) return res.status(401).json({ error: 'Token ausente' });
  const [, token] = auth.split(' ');
  try {
    const payload = jwt.verify(token, process.env.JWT_SECRET);
    req.userId = payload.userId;
    next();
  } catch {
    return res.status(401).json({ error: 'Token inválido' });
  }
}

// Registro
app.post('/api/register', async (req, res) => {
  const { nome, email, password } = req.body;
  const existing = await User.findOne({ email });
  if (existing) return res.status(400).json({ error: 'Email já cadastrado' });

  const hash = await bcrypt.hash(password, 10);
  const user = await User.create({ nome, email, passwordHash: hash });
  const token = jwt.sign({ userId: user._id }, process.env.JWT_SECRET);
  res.json({ token, user });
});

// Login
app.post('/api/login', async (req, res) => {
  const { email, password } = req.body;
  const user = await User.findOne({ email });
  if (!user) return res.status(400).json({ error: 'Credenciais inválidas' });

  const ok = await bcrypt.compare(password, user.passwordHash);
  if (!ok) return res.status(400).json({ error: 'Credenciais inválidas' });

  const token = jwt.sign({ userId: user._id }, process.env.JWT_SECRET);
  res.json({ token, user });
});

// ---------------------- METAS ----------------------

app.get('/api/goals', authMiddleware, async (req, res) => {
  const goals = await Goal.find({ userId: req.userId }).sort({ createdAt: -1 });
  const withPhotos = await Promise.all(goals.map(async (g) => {
    const fotos = await Photo.find({ goalId: g._id });
    return { ...g._doc, fotos: fotos.map(f => f.url) };
  }));
  res.json(withPhotos);
});

app.post('/api/goals', authMiddleware, async (req, res) => {
  const { titulo, descricao, icon, color } = req.body;
  if (!titulo) return res.status(400).json({ error: 'Título obrigatório' });
  const goal = await Goal.create({ userId: req.userId, titulo, descricao, icon, color });
  res.json(goal);
});

app.put('/api/goals/:id', authMiddleware, async (req, res) => {
  const { id } = req.params;
  const goal = await Goal.findOne({ _id: id, userId: req.userId });
  if (!goal) return res.status(404).json({ error: 'Meta não encontrada' });
  Object.assign(goal, req.body, { updatedAt: new Date() });
  await goal.save();
  res.json(goal);
});

app.post('/api/goals/:id/photos', authMiddleware, async (req, res) => {
  const { id } = req.params;
  const { url } = req.body;
  const goal = await Goal.findOne({ _id: id, userId: req.userId });
  if (!goal) return res.status(404).json({ error: 'Meta não encontrada' });
  await Photo.create({ goalId: id, url });
  res.json({ ok: true });
});

app.delete('/api/goals/:id', authMiddleware, async (req, res) => {
  const { id } = req.params;
  await Goal.deleteOne({ _id: id, userId: req.userId });
  await Photo.deleteMany({ goalId: id });
  res.json({ ok: true });
});

// ---------------------- INICIAR SERVIDOR ----------------------

const PORT = process.env.PORT || 4000;

// Only start the HTTP server when this file is run directly (local/dev). When imported
// by a serverless wrapper (Vercel), we should NOT call app.listen().
if (require.main === module) {
  app.listen(PORT, () => console.log(`🚀 Servidor rodando na porta ${PORT}`));
}

// Export a serverless handler so Vercel (and other serverless platforms) can run the app.
// We export the handler function returned by serverless-http.
const serverless = require('serverless-http');
module.exports = serverless(app);
