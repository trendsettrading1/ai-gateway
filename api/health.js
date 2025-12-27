// api/health.js - Vercel serverless function
module.exports = (req, res) => {
  res.json({
    status: 'healthy',
    service: 'DalaCreate AI Gateway',
    version: '2.0',
    timestamp: new Date().toISOString()
  });
};
