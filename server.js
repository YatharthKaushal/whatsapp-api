import express from 'express';
import dotenv from 'dotenv';
dotenv.config();
// server.js (ESM - ensure "type": "module" in package.json)

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(express.json());

// Routes
app.get('/', (req, res) => {
  res.json({ ok: true, message: 'API is running' });
});

app.get('/health', (req, res) => {
  res.json({ status: 'healthy', uptime: process.uptime() });
});

// 404 handler
app.use((req, res) => {
  res.status(404).json({ error: 'Not found' });
});

// Error handler
// eslint-disable-next-line no-unused-vars
app.use((err, req, res, next) => {
  console.error('Unhandled error:', err);
  res.status(err.status || 500).json({ error: 'Internal Server Error' });
});

// Start server
const server = app.listen(PORT, () => {
  console.log(`Server listening on ${process.env.BASE_URL}:${PORT}`);
});

// Graceful shutdown
const shutdown = (signal) => {
  console.log(`\nReceived ${signal}. Shutting down...`);
  server.close(() => {
    console.log('HTTP server closed.');
    process.exit(0);
  });
  setTimeout(() => {
    console.warn('Force exiting after timeout.');
    process.exit(1);
  }, 10000).unref();
};

process.on('SIGINT', () => shutdown('SIGINT'));
process.on('SIGTERM', () => shutdown('SIGTERM'));

export default app;