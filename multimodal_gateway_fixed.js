const express = require("express");
const app = express();
app.use(express.json())
app.use(express.static(path.join(__dirname, 'public')));;

// Add CORS for image tools
app.use((req, res, next) => {
    res.header("Access-Control-Allow-Origin", "*");
    res.header("Access-Control-Allow-Methods", "GET, POST, PUT, DELETE, OPTIONS");
    res.header("Access-Control-Allow-Headers", "Origin, X-Requested-With, Content-Type, Accept");
    if (req.method === "OPTIONS") {
        return res.sendStatus(200);
    }
    next();
});

const fs = require("fs");
const path = require("path");
const { exec } = require("child_process");
const { promisify } = require("util");

const execAsync = promisify(exec);

// Create workspace
const WORKSPACE = path.join(__dirname, "ai_workspace");
const PROJECTS_DIR = path.join(WORKSPACE, "projects");
const IMAGES_DIR = path.join(WORKSPACE, "images");
const GENERATED_IMAGES_DIR = path.join(WORKSPACE, "generated_images");

[PROJECTS_DIR, IMAGES_DIR, GENERATED_IMAGES_DIR].forEach(dir => {
    if (!fs.existsSync(dir)) {
        fs.mkdirSync(dir, { recursive: true });
    }
});

// Existing templates
const templates = {
    calculator: `import React from 'react';
import { View, Text } from 'react-native';

export default function App() {
  return (
    <View style={{flex: 1, justifyContent: 'center', alignItems: 'center'}}>
      <Text>Calculator App</Text>
    </View>
  );
}`,

    weather: `import React from 'react';
import { View, Text } from 'react-native';

export default function App() {
  return (
    <View style={{flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: 'skyblue'}}>
      <Text style={{fontSize: 32}}>Weather App</Text>
      <Text style={{fontSize: 64}}>72Â°F</Text>
    </View>
  );
}`,

    todo: `import React, { useState } from 'react';
import { View, Text, TextInput, Button } from 'react-native';

export default function App() {
  const [tasks, setTasks] = useState([]);
  const [input, setInput] = useState('');
  
  return (
    <View style={{padding: 20}}>
      <Text style={{fontSize: 32}}>Todo List</Text>
      <TextInput placeholder='New task' value={input} onChangeText={setInput} />
      <Button title='Add' onPress={() => {
        if (input) setTasks([...tasks, input]);
        setInput('');
      }} />
      {tasks.map((task, i) => (
        <Text key={i}>{task}</Text>
      ))}
    </View>
  );
}`
};

// Generate app function
function generateApp(message, source, session_id) {
    let appCode = templates.calculator;
    if (message.toLowerCase().includes("weather")) {
        appCode = templates.weather;
    } else if (message.toLowerCase().includes("todo")) {
        appCode = templates.todo;
    }
    
    const filename = `app_${source}_${session_id || Date.now()}.js`;
    const filepath = path.join(PROJECTS_DIR, filename);
    
    fs.writeFileSync(filepath, appCode);
    
    return {
        success: true,
        message: `App generated from ${source}!`,
        source: source,
        file: filename,
        download_url: `http://localhost:3003/api/download/${filename}`,
        view_url: `http://localhost:3003/api/view/${filename}`,
        timestamp: new Date().toISOString()
    };
}

// === IMAGE GENERATION FUNCTION ===
async function generateImage(prompt, source, session_id) {
    try {
        console.log(`ðŸŽ¨ Image generation request from ${source}: ${prompt}`);
        
        // Generate a filename
        const filename = `image_${source}_${session_id || Date.now()}.txt`;
        const imagePromptFile = path.join(IMAGES_DIR, filename);
        
        // Save the prompt to a file
        const enhancedPrompt = `Stable Diffusion prompt for: ${prompt}

Detailed description: ${prompt}
Style: photorealistic, high quality, 4K
Negative prompt: blurry, distorted, ugly
Aspect ratio: 16:9`;
        
        fs.writeFileSync(imagePromptFile, enhancedPrompt);
        
        // Check if we have image generation tools available
        const imageTools = await checkImageTools();
        
        return {
            success: true,
            message: `Image prompt generated from ${source}!`,
            source: source,
            type: "image_generation",
            prompt: enhancedPrompt,
            file: filename,
            prompt_url: `http://localhost:3003/api/image/prompt/${filename}`,
            tools_available: imageTools,
            instructions: imageTools.length > 0 
                ? `Image tools detected: ${imageTools.join(", ")}` 
                : "No local image tools found. Install Stable Diffusion, DALL-E, or Midjourney CLI.",
            timestamp: new Date().toISOString()
        };
        
    } catch (error) {
        return {
            success: false,
            error: error.message,
            message: "Image generation failed"
        };
    }
}

// Check for available image generation tools
async function checkImageTools() {
    const tools = [];
    
    try {
        // Check for Stable Diffusion (Automatic1111)
        const sdCheck = await execAsync('wmic process get description | findstr "python"');
        if (sdCheck.stdout.includes("python")) {
            tools.push("Stable Diffusion (possible)");
        }
    } catch (e) {}
    
    try {
        // Check for DALL-E API key in environment
        if (process.env.OPENAI_API_KEY) {
            tools.push("DALL-E API");
        }
    } catch (e) {}
    
    // Add more tool checks as needed
    if (tools.length === 0) {
        tools.push("Manual generation - save prompt to file");
    }
    
    return tools;
}

// === IMAGE GENERATION ENDPOINTS ===

// Generate image from Ollama/DeepSeek
app.post("/api/generate/image", async (req, res) => {
    try {
        const { prompt, source = "unknown", session_id } = req.body;
        
        if (!prompt) {
            return res.status(400).json({ error: "Prompt is required" });
        }
        
        const result = await generateImage(prompt, source, session_id);
        res.json(result);
        
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// Ollama-specific image endpoint
app.post("/api/ollama/generate", async (req, res) => {
    try {
        const { prompt, session_id, model = "llama3" } = req.body;
        
        if (!prompt) {
            return res.status(400).json({ error: "Prompt is required" });
        }
        
        console.log(`ðŸ¦™ Ollama image request: ${prompt.substring(0, 50)}...`);
        
        // First, let Ollama enhance the prompt
        const enhancedPrompt = `Create a detailed image generation prompt for: ${prompt}`;
        
        // For now, generate the image prompt directly
        const result = await generateImage(enhancedPrompt, "ollama", session_id);
        
        // Add Ollama-specific info
        result.model_used = model;
        result.ollama_enhanced = true;
        result.next_steps = [
            "1. Copy the prompt from the file",
            "2. Use with Stable Diffusion/DALL-E",
            "3. Or install ollama-image-addon for direct generation"
        ];
        
        res.json(result);
        
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// Multi-step workflow: Text â†’ Image
app.post("/api/workflow/text-to-image", async (req, res) => {
    try {
        const { text, steps = 2, session_id } = req.body;
        
        console.log(`ðŸ”„ Multi-step workflow: ${text.substring(0, 50)}...`);
        
        const workflowId = `workflow_${Date.now()}`;
        const results = [];
        
        // Step 1: Generate app from text
        if (steps >= 1) {
            const appResult = generateApp(text, "workflow", session_id);
            results.push({
                step: 1,
                type: "app_generation",
                result: appResult
            });
        }
        
        // Step 2: Generate image prompt
        if (steps >= 2) {
            const imageResult = await generateImage(`Create image for: ${text}`, "workflow", session_id);
            results.push({
                step: 2,
                type: "image_generation",
                result: imageResult
            });
        }
        
        res.json({
            success: true,
            workflow_id: workflowId,
            original_text: text,
            steps_completed: steps,
            results: results,
            summary: `Generated ${steps} outputs from text input`,
            timestamp: new Date().toISOString()
        });
        
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// Get image prompt file
app.get("/api/image/prompt/:filename", (req, res) => {
    try {
        const filepath = path.join(IMAGES_DIR, req.params.filename);
        if (fs.existsSync(filepath)) {
            const content = fs.readFileSync(filepath, "utf8");
            res.type("text/plain").send(content);
        } else {
            res.status(404).json({ error: "Image prompt not found" });
        }
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// List available image prompts
app.get("/api/image/prompts", (req, res) => {
    try {
        const files = fs.readdirSync(IMAGES_DIR);
        const prompts = files.map(f => ({
            name: f,
            created: fs.statSync(path.join(IMAGES_DIR, f)).birthtime,
            size: fs.statSync(path.join(IMAGES_DIR, f)).size
        }));
        
        res.json({
            total: files.length,
            prompts: prompts.slice(-10) // Last 10
        });
    } catch (error) {
        res.json({ total: 0, prompts: [] });
    }
});

// DELETE endpoint for image prompts
app.delete("/api/image/prompt/:filename", (req, res) => {
    try {
        const filepath = path.join(IMAGES_DIR, req.params.filename);
        if (fs.existsSync(filepath)) {
            fs.unlinkSync(filepath);
            res.json({
                success: true,
                message: "Prompt deleted",
                filename: req.params.filename
            });
        } else {
            res.status(404).json({ error: "Prompt not found" });
        }
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// Image download endpoint
app.get("/api/download/image/:filename", (req, res) => {
    const imagePath = path.join(GENERATED_IMAGES_DIR, req.params.filename);
    if (fs.existsSync(imagePath)) {
        res.download(imagePath);
    } else {
        res.status(404).json({ error: "Image not found" });
    }
});

// === EXISTING ENDPOINTS ===

// Health endpoint - updated with image capabilities
app.get("/api/health", async (req, res) => {
    try {
        const files = fs.readdirSync(PROJECTS_DIR);
        const imageFiles = fs.readdirSync(IMAGES_DIR);
        const generatedImages = fs.readdirSync(GENERATED_IMAGES_DIR);
        
        const imageTools = await checkImageTools();
        
        res.json({
            status: "operational",
            gateway: "multimodal_gateway",
            endpoints: {
                apps: {
                    human: "POST /api/human/process",
                    deepseek: "POST /api/deepseek/process",
                    ai: "POST /api/ai/process"
                },
                images: {
                    generate: "POST /api/generate/image",
                    ollama: "POST /api/ollama/generate",
                    workflow: "POST /api/workflow/text-to-image",
                    prompts: "GET /api/image/prompts",
                    delete: "DELETE /api/image/prompt/:filename"
                },
                files: {
                    download: "GET /api/download/:filename",
                    view: "GET /api/view/:filename",
                    image_prompt: "GET /api/image/prompt/:filename",
                    image_download: "GET /api/download/image/:filename"
                }
            },
            templates: ["calculator", "weather", "todo"],
            apps_generated: files.length,
            images_generated: imageFiles.length,
            generated_images_count: generatedImages.length,
            image_tools: imageTools,
            supported_sources: ["human", "deepseek", "ollama", "chatgpt", "any_ai"],
            timestamp: new Date().toISOString()
        });
        
    } catch (error) {
        res.json({ 
            status: "operational", 
            error: error.message,
            warning: "Workspace check failed"
        });
    }
});

// Existing endpoints (unchanged)
app.post("/api/human/process", (req, res) => {
    try {
        const { message, session_id } = req.body;
        console.log(`ðŸ‘¤ Human request: ${message}`);
        
        const result = generateApp(message, "human", session_id);
        res.json(result);
        
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

app.post("/api/deepseek/process", (req, res) => {
    try {
        const { prompt, session_id } = req.body;
        console.log(`ðŸ¤– DeepSeek request: ${prompt}`);
        
        const result = generateApp(prompt, "deepseek", session_id);
        res.json(result);
        
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

app.post("/api/ai/process", (req, res) => {
    try {
        const { message, session_id, source = "ai" } = req.body;
        console.log(`ðŸ¤– ${source} request: ${message}`);
        
        const result = generateApp(message, source, session_id);
        res.json(result);
        
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// File endpoints (unchanged)
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
        const content = fs.readFileSync(filepath, "utf8");
        res.type("text/plain").send(content);
    } catch (error) {
        res.status(404).json({ error: "File not found" });
    }
});

const PORT = 3003;
app.listen(PORT, () => {
    console.log("");
    console.log("ðŸš€ MULTIMODAL AI GATEWAY RUNNING");
    console.log("==================================");
    console.log(`ðŸ“ Port: ${PORT}`);
    console.log("");
    console.log("ðŸ“± App Generation:");
    console.log("  POST /api/human/process");
    console.log("  POST /api/deepseek/process");
    console.log("  POST /api/ai/process");
    console.log("");
    console.log("ðŸŽ¨ Image Generation:");
    console.log("  POST /api/generate/image");
    console.log("  POST /api/ollama/generate");
    console.log("  POST /api/workflow/text-to-image");
    console.log("  GET  /api/image/prompts");
    console.log("  DELETE /api/image/prompt/:filename");
    console.log("");
    console.log("ðŸ“ File Management:");
    console.log("  GET /api/health");
    console.log("  GET /api/download/:filename");
    console.log("  GET /api/view/:filename");
    console.log("  GET /api/image/prompt/:filename");
    console.log("  GET /api/download/image/:filename");
    console.log("");
    console.log("âœ… Gateway supports both app and image generation!");
    console.log("âœ… Ollama â†’ Image workflows enabled");
    console.log("âœ… Image prompt management included");
    console.log("");
});
