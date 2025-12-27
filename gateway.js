// DalaCreate Gateway - Vercel Compatible
// This handles root requests

const express = require('express');
const app = express();

// Root endpoint
app.get('/', (req, res) => {
    res.json({
        message: 'DalaCreate AI Gateway',
        endpoints: {
            api: '/api/*',
            health: '/api/health',
            demo: 'https://YOUR-VERCEL-URL.vercel.app'
        },
        status: 'running'
    });
});

// Export for Vercel
module.exports = app;
