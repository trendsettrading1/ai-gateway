const express = require("express");
const app = express();
app.use(express.json());

// Allow all CORS
app.use((req, res, next) => {
    res.header("Access-Control-Allow-Origin", "*");
    res.header("Access-Control-Allow-Methods", "GET, POST, PUT, DELETE, OPTIONS");
    res.header("Access-Control-Allow-Headers", "Origin, X-Requested-With, Content-Type, Accept");
    if (req.method === "OPTIONS") return res.sendStatus(200);
    next();
});

const fs = require("fs");
const path = require("path");

// Create workspace directories
const BASE_DIR = __dirname;
const PROJECTS_DIR = path.join(BASE_DIR, "projects");
const IMAGES_DIR = path.join(BASE_DIR, "images");

if (!fs.existsSync(PROJECTS_DIR)) fs.mkdirSync(PROJECTS_DIR, { recursive: true });
if (!fs.existsSync(IMAGES_DIR)) fs.mkdirSync(IMAGES_DIR, { recursive: true });

// Simple templates
const templates = {
    calculator: "// Calculator App\nconsole.log('Calculator Ready');",
    weather: "// Weather App\nconsole.log('Weather App Ready');",
    todo: "// Todo App\nconsole.log('Todo App Ready');"
};

// Generate app
function generateApp(message, source, session_id) {
    let appCode = templates.calculator;
    if (message.toLowerCase().includes("weather")) appCode = templates.weather;
    if (message.toLowerCase().includes("todo")) appCode = templates.todo;
    
    const filename = `app_${source}_${session_id || Date.now()}.js`;
    const filepath = path.join(PROJECTS_DIR, filename);
    
    fs.writeFileSync(filepath, appCode);
    
    return {
        success: true,
        message: `App generated from ${source}!`,
        file: filename,
        download_url: `http://localhost:3003/api/download/${filename}`,
        view_url: `http://localhost:3003/api/view/${filename}`,
        timestamp: new Date().toISOString()
    };
}

// Generate image prompt
function generateImage(prompt, source, session_id) {
    const filename = `image_${source}_${session_id || Date.now()}.txt`;
    const filepath = path.join(IMAGES_DIR, filename);
    
    const enhancedPrompt = `Stable Diffusion prompt for: ${prompt}
    
Style: photorealistic, high quality
Negative: blurry, distorted, ugly
Aspect ratio: 16:9`;
    
    fs.writeFileSync(filepath, enhancedPrompt);
    
    return {
        success: true,
        message: `Image prompt generated from ${source}!`,
        file: filename,
        prompt_url: `http://localhost:3003/api/image/prompt/${filename}`,
        prompt: enhancedPrompt,
        timestamp: new Date().toISOString()
    };
}

// =========== ENDPOINTS ===========

// Health endpoint
app.get("/api/health", (req, res) => {
    try {
        const apps = fs.existsSync(PROJECTS_DIR) ? fs.readdirSync(PROJECTS_DIR) : [];
        const images = fs.existsSync(IMAGES_DIR) ? fs.readdirSync(IMAGES_DIR) : [];
        
        res.json({
            status: "operational",
            location: BASE_DIR,
            apps_generated: apps.length,
            images_generated: images.length,
            endpoints: [
                "GET /api/health",
                "POST /api/human/process",
                "POST /api/generate/image",
                "GET /api/image/prompts",
                "GET /api/download/:filename",
                "GET /api/image/prompt/:filename"
            ]
        });
    } catch (error) {
        res.json({ status: "error", error: error.message });
    }
});

// Human input
app.post("/api/human/process", (req, res) => {
    try {
        const { message, session_id } = req.body;
        console.log(`👤 Human: ${message.substring(0, 50)}...`);
        
        if (!message) {
            return res.status(400).json({ error: "Message is required" });
        }
        
        const result = generateApp(message, "human", session_id);
        res.json(result);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// Generate image
app.post("/api/generate/image", (req, res) => {
    try {
        const { prompt, source = "unknown", session_id } = req.body;
        console.log(`🎨 Image: ${prompt.substring(0, 50)}...`);
        
        if (!prompt) {
            return res.status(400).json({ error: "Prompt is required" });
        }
        
        const result = generateImage(prompt, source, session_id);
        res.json(result);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// File downloads
app.get("/api/download/:filename", (req, res) => {
    try {
        const filepath = path.join(PROJECTS_DIR, req.params.filename);
        if (fs.existsSync(filepath)) {
            res.download(filepath);
        } else {
            res.status(404).json({ error: "File not found" });
        }
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

app.get("/api/view/:filename", (req, res) => {
    try {
        const filepath = path.join(PROJECTS_DIR, req.params.filename);
        if (fs.existsSync(filepath)) {
            const content = fs.readFileSync(filepath, "utf8");
            res.type("text/plain").send(content);
        } else {
            res.status(404).json({ error: "File not found" });
        }
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

app.get("/api/image/prompt/:filename", (req, res) => {
    try {
        const filepath = path.join(IMAGES_DIR, req.params.filename);
        if (fs.existsSync(filepath)) {
            const content = fs.readFileSync(filepath, "utf8");
            res.type("text/plain").send(content);
        } else {
            res.status(404).json({ error: "Prompt not found" });
        }
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

app.get("/api/image/prompts", (req, res) => {
    try {
        if (fs.existsSync(IMAGES_DIR)) {
            const files = fs.readdirSync(IMAGES_DIR);
            const prompts = files.map(f => ({
                name: f,
                size: fs.statSync(path.join(IMAGES_DIR, f)).size
            }));
            
            res.json({ total: files.length, prompts: prompts.slice(-10) });
        } else {
            res.json({ total: 0, prompts: [] });
        }
    } catch (error) {
        res.json({ total: 0, prompts: [] });
    }
});

const PORT = 3003;
app.listen(PORT, () => {
    console.log(`
✅ AI GATEWAY RUNNING SUCCESSFULLY
📍 Port: ${PORT}
📁 Location: ${BASE_DIR}
🔗 Health: http://localhost:${PORT}/api/health
`);
    console.log("📱 Endpoints:");
    console.log("  GET  /api/health");
    console.log("  POST /api/human/process");
    console.log("  POST /api/generate/image");
    console.log("  GET  /api/image/prompts");
    console.log("  GET  /api/download/:filename");
    console.log("  GET  /api/image/prompt/:filename");
});
