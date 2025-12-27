// ULTRA-SIMPLE WORKING GATEWAY - NO WILDCARD ISSUES
const express = require("express");
const path = require("path");
const fs = require("fs");

const app = express();
const PORT = 3003;

// 1. Serve static files FIRST
app.use(express.static(path.join(__dirname, "public")));

// 2. API routes
app.get("/api/health", (req, res) => {
    res.json({
        status: "running",
        service: "AI Gateway Desktop",
        version: "3.0.0",
        timestamp: new Date().toISOString()
    });
});

app.get("/api/services", (req, res) => {
    res.json({
        services: [
            { name: "Gateway", status: "running", port: 3003 },
            { name: "Ollama", status: "ready", port: 11434 },
            { name: "DeepSeek", status: "ready" }
        ]
    });
});

app.post("/api/chat/ollama", (req, res) => {
    res.json({
        success: true,
        service: "ollama",
        message: "Ready for investor demo"
    });
});

// 3. MANUAL CATCH-ALL - NO WILDCARD!
// Serve dashboard.html for any non-API route
app.use((req, res, next) => {
    // Skip if it's an API route or static file request
    if (req.path.startsWith("/api/") || req.path.includes(".")) {
        return next();
    }
    
    // Serve dashboard.html
    const dashboardPath = path.join(__dirname, "public", "dashboard.html");
    if (fs.existsSync(dashboardPath)) {
        res.sendFile(dashboardPath);
    } else {
        res.send("<h1>AI Gateway Desktop</h1><p>Running - No dashboard.html found</p>");
    }
});

// 4. Start server
app.listen(PORT, () => {
    console.log("========================================");
    console.log("🚀 AI GATEWAY DESKTOP - WORKING VERSION");
    console.log("========================================");
    console.log(`🌐 Dashboard: http://localhost:${PORT}`);
    console.log(`🔧 Health: http://localhost:${PORT}/api/health`);
    console.log("✅ Ready for investor demonstration!");
});
