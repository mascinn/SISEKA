const express = require('express');
const cors = require('cors');
const { initDatabase } = require('./database');

// Import Routes
const authRoutes = require('./routes/auth');
const kioskRoutes = require('./routes/kiosks');
const depositRoutes = require('./routes/deposits');

const app = express();
const PORT = process.env.PORT || 5000;

// Middleware
app.use(cors());
app.use(express.json());

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/kiosks', kioskRoutes);
app.use('/api/deposits', depositRoutes);

// Basic Health Check Endpoint
app.get('/api/health', (req, res) => {
  res.json({
    status: 'ok',
    message: 'SISEKA WASI\'I Backend API is running smoothly',
    timestamp: new Date().toISOString()
  });
});

// Start Server & Initialize Database
async function startServer() {
  await initDatabase();
  return app.listen(PORT, () => {
    console.log(`🚀 Server SISEKA WASI'I berjalan di http://localhost:${PORT}`);
    console.log(`📡 Health Check: http://localhost:${PORT}/api/health`);
    console.log(`🔑 Auth Endpoint: http://localhost:${PORT}/api/auth/login`);
    console.log(`🏪 Kiosks Endpoint: http://localhost:${PORT}/api/kiosks`);
    console.log(`💰 Deposits Endpoint: http://localhost:${PORT}/api/deposits`);
  });
}

if (require.main === module) {
  startServer();
}

module.exports = { app, startServer };
