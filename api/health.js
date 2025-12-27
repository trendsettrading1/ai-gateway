// File: api/health.js
// Simple health endpoint for Vercel
module.exports = (req, res) => {
  res.json({
    status: 'healthy',
    service: 'DalaCreate AI Gateway',
    version: '2.0',
    timestamp: new Date().toISOString(),
    environment: process.env.NODE_ENV || 'production'
  });
};
