// DalaCreate AI Gateway - Vercel Compatible
const express = require('express');
const app = express();

// Middleware
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// CORS for all origins (Vercel handles CORS differently)
app.use((req, res, next) => {
    res.header('Access-Control-Allow-Origin', '*');
    res.header('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
    res.header('Access-Control-Allow-Headers', 'Content-Type, Authorization');
    next();
});

// ========== REQUIRED ENDPOINTS ==========

// Health check (Vercel needs this)
app.get('/health', (req, res) => {
    res.json({
        status: 'healthy',
        service: 'DalaCreate AI Gateway',
        version: '2.0',
        environment: process.env.NODE_ENV || 'production',
        timestamp: new Date().toISOString(),
        deployed_on: 'Vercel'
    });
});

// API root
app.get('/api', (req, res) => {
    res.json({
        message: 'DalaCreate AI Gateway API',
        endpoints: {
            health: '/health',
            ai_component: '/api/ai/generate-component',
            dev_studio: '/api/ai-dev-studio/*'
        },
        documentation: 'https://github.com/trendsettrading1/ai-gateway'
    });
});

// ========== YOUR AI ENDPOINTS ==========

// Component generation endpoint (example - keep your existing)
app.post('/api/ai/generate-component', async (req, res) => {
    try {
        const { componentType, description } = req.body;
        
        // Your existing AI logic here
        const response = {
            success: true,
            component: // Generated  component for: ,
            estimated_cost: "R2.50",
            generated_at: new Date().toISOString()
        };
        
        res.json(response);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// Add more of your existing endpoints here...

// ========== VERCEL SPECIFIC ==========

// Handle Vercel serverless environment
if (process.env.VERCEL) {
    // Export for Vercel serverless
    module.exports = app;
} else {
    // Local development
    const PORT = process.env.PORT || 3003;
    app.listen(PORT, '0.0.0.0', () => {
        console.log(\🚀 Local server: http://localhost:\\);
    });
}
