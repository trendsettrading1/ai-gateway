// API endpoint: /api/health
module.exports = (req, res) => {
    res.json({
        status: 'healthy',
        service: 'DalaCreate AI Gateway',
        version: '2.0',
        environment: process.env.NODE_ENV || 'production',
        timestamp: new Date().toISOString(),
        region: process.env.VERCEL_REGION || 'unknown'
    });
};
