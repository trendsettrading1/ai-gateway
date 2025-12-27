// Vercel Serverless API for DalaCreate
// This file handles: /api/* routes

const express = require('express');
const app = express();

app.use(require('cors')());
app.use(express.json());

// Health check (accessible at /api/health)
app.get('/health', (req, res) => {
    res.json({
        status: 'healthy',
        service: 'DalaCreate AI Gateway',
        version: '2.0',
        deployed_on: 'Vercel',
        timestamp: new Date().toISOString()
    });
});

// Your AI endpoints
app.post('/generate-component', async (req, res) => {
    try {
        const { componentType, description } = req.body;
        
        // Your AI logic here
        const response = {
            success: true,
            component: \// Generated \: \\,
            estimated_cost: 'R2.50',
            timestamp: new Date().toISOString()
        };
        
        res.json(response);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// Export for Vercel
module.exports = app;
