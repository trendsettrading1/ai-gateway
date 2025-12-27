// gateway.js - Simple version for Vercel
const express = require('express');
const app = express();

app.get('/', (req, res) => {
  res.json({
    message: 'DalaCreate AI Gateway',
    endpoints: {
      api: '/api/*',
      demo: '/'
    }
  });
});

// Export for Vercel
module.exports = app;
