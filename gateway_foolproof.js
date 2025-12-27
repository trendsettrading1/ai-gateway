// FOOLPROOF AI GATEWAY - WILL WORK
const express = require('express');
const path = require('path');
const app = express();
const PORT = 3003;

// Middleware
app.use(express.json());

// Serve ALL files from public directory
app.use(express.static('public'));

// Health endpoint
app.get('/api/health', (req, res) => {
    res.json({
        status: 'running',
        service: 'AI Gateway Desktop',
        version: '1.0.0',
        timestamp: new Date().toISOString()
    });
});

// Test endpoint
app.get('/api/test', (req, res) => {
    res.json({ message: 'API is working!' });
});

// Catch-all: Serve index for any other route
app.get('*', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'dashboard.html'));
});

// Start server
app.listen(PORT, () => {
    console.log('═══════════════════════════════════════════════════════');
    console.log('                 AI GATEWAY DESKTOP                   ');
    console.log('═══════════════════════════════════════════════════════');
    console.log('');
    console.log('✅ SERVER STATUS: RUNNING');
    console.log('✅ PORT: ' + PORT);
    console.log('✅ DASHBOARD: http://localhost:' + PORT);
    console.log('✅ HEALTH API: http://localhost:' + PORT + '/api/health');
    console.log('');
    console.log('🚀 READY FOR INVESTOR DEMONSTRATION');
    console.log('');
});
