// gateway.js - Optional Express app
const express = require('express');
const app = express();

app.get('/', (req, res) => {
  res.json({
    message: 'DalaCreate AI Gateway',
    endpoints: {
      health: '/api/health',
      generate: '/api/generate',
      demo: '/'
    }
  });
});

module.exports = app;
