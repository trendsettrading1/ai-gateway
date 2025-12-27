const express = require("express");
const axios = require("axios");
const fs = require("fs").promises;
const path = require("path");

const app = express();
app.use(express.json());

// Configuration for Ollama
const OLLAMA_URL = "http://localhost:11434/api/generate";
const MODEL = "tinyllama";
const WORKSPACE = path.join(__dirname, "ai_workspace");

// Create workspace directories
["projects", "logs", "instructions"].forEach(dir => {
    const dirPath = path.join(WORKSPACE, dir);
    require("fs").mkdirSync(dirPath, { recursive: true });
});

// Connect to Ollama
async function queryOllama(prompt) {
    try {
        console.log("?? Querying Ollama...");
        
        const response = await axios.post(OLLAMA_URL, {
            model: MODEL,
            prompt: `You are an expert React Native developer. Create complete, runnable React Native app code based on this description: ${prompt}\n\nReturn ONLY the complete code with imports, components, and styling. Format: javascript code block. No explanations.`,
            stream: false,
            options: {
                temperature: 0.7,
                num_predict: 2000
            }
        }, {
            timeout: 60000
        });
        
        console.log("? Ollama response received");
        return response.data.response;
        
    } catch (error) {
        console.error("? Ollama connection failed:", error.message);
        
        // Fallback mock response
        return \`\`\`javascript
import React from "react";
import { View, Text, StyleSheet } from "react-native";

export default function App() {
    return (
        <View style={styles.container}>
            <Text style={styles.title}>Generated App</Text>
            <Text style={styles.subtitle}>Description: \${prompt.substring(0, 50)}...</Text>
            <Text style={styles.note}>Ollama: Offline - Using fallback</Text>
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        justifyContent: "center",
        alignItems: "center",
        backgroundColor: "#f0f0f0",
        padding: 20
    },
    title: {
        fontSize: 28,
        fontWeight: "bold",
        marginBottom: 10,
        color: "#333"
    },
    subtitle: {
        fontSize: 16,
        color: "#666",
        textAlign: "center",
        marginBottom: 20
    },
    note: {
        fontSize: 14,
        color: "#999",
        fontStyle: "italic"
    }
});
\`\`\`;
    }
}

// Extract code from response
function extractCode(content) {
    const codeMatch = content.match(/```(?:javascript|jsx?)\n([\s\S]*?)\n```/);
    return codeMatch ? codeMatch[1] : content;
}

// AI Processing endpoint
app.post("/api/ai/process", async (req, res) => {
    try {
        const { message, session_id } = req.body;
        console.log("?? AI Request:", message);
        
        // Get code from Ollama
        const ollamaResponse = await queryOllama(message);
        const appCode = extractCode(ollamaResponse);
        
        // Save the generated app
        const filename = \`app_\${session_id || Date.now()}.js\`;
        const filepath = path.join(WORKSPACE, "projects", filename);
        await fs.writeFile(filepath, appCode);
        
        res.json({
            success: true,
            source: \`Ollama (\${MODEL})\`,
            message: "App generated from AI!",
            file: filename,
            code_length: appCode.length,
            preview: appCode.substring(0, 150).replace(/\n/g, " ") + "...",
            timestamp: new Date().toISOString()
        });
        
    } catch (error) {
        console.error("? Processing error:", error);
        res.status(500).json({ 
            success: false, 
            error: error.message,
            fallback: "Using mock response"
        });
    }
});

// Health check with Ollama status
app.get("/api/health", async (req, res) => {
    try {
        // Test Ollama connection
        const ollamaStatus = await axios.get("http://localhost:11434/api/tags", {
            timeout: 5000
        }).catch(() => ({ status: "offline" }));
        
        // Get model info
        let models = [];
        if (ollamaStatus.data) {
            models = ollamaStatus.data.models.map(m => m.name);
        }
        
        res.json({
            status: "operational",
            ollama: ollamaStatus.status === "offline" ? "offline" : "online",
            model: MODEL,
            available_models: models,
            platform: "Windows/PowerShell",
            workspace: WORKSPACE,
            timestamp: new Date().toISOString()
        });
        
    } catch (error) {
        res.json({
            status: "partial",
            ollama: "offline",
            error: error.message,
            note: "Ollama might be starting up"
        });
    }
});

// List generated apps
app.get("/api/workspace", async (req, res) => {
    try {
        const files = await fs.readdir(path.join(WORKSPACE, "projects"));
        
        const fileDetails = await Promise.all(files.map(async (f) => {
            const fullPath = path.join(WORKSPACE, "projects", f);
            const stats = require("fs").statSync(fullPath);
            const content = await fs.readFile(fullPath, "utf8");
            
            return {
                name: f,
                size: stats.size,
                created: stats.birthtime,
                lines: content.split("\n").length,
                preview: content.substring(0, 100) + "..."
            };
        }));
        
        res.json({
            workspace: WORKSPACE,
            total_apps: files.length,
            apps: fileDetails
        });
    } catch (error) {
        res.json({ error: error.message });
    }
});

// Serve a specific app file
app.get("/api/project/:filename", async (req, res) => {
    try {
        const filepath = path.join(WORKSPACE, "projects", req.params.filename);
        const content = await fs.readFile(filepath, "utf8");
        res.type("javascript").send(content);
    } catch (error) {
        res.status(404).json({ error: "File not found" });
    }
});

// Download app file
app.get("/api/download/:filename", async (req, res) => {
    try {
        const filepath = path.join(WORKSPACE, "projects", req.params.filename);
        res.download(filepath);
    } catch (error) {
        res.status(404).json({ error: "File not found" });
    }
});

const PORT = process.env.PORT || 3003;
app.listen(PORT, () => {
    console.log(\`\n\`);
    console.log(\`    +------------------------------------------+\`);
    console.log(\`    ¦     ?? AI GATEWAY WITH OLLAMA          ¦\`);
    console.log(\`    +------------------------------------------+\`);
    console.log(\`\n\`);
    console.log(\`    ?? Port: \${PORT}\`);
    console.log(\`    ?? Ollama: \${OLLAMA_URL}\`);
    console.log(\`    ?? Model: \${MODEL}\`);
    console.log(\`    ?? Workspace: \${WORKSPACE}\`);
    console.log(\`\n\`);
    console.log(\`    ?? Test with PowerShell:\`);
    console.log(\`\n\`);
    console.log(\`    \$body = @{\`);
    console.log(\`        message = "calculator app with buttons"\`);
    console.log(\`        session_id = "test"\`);
    console.log(\`    } | ConvertTo-Json\`);
    console.log(\`\n\`);
    console.log(\`    Invoke-RestMethod -Uri "http://localhost:\${PORT}/api/ai/process"\`);
    console.log(\`        -Method POST\`);
    console.log(\`        -ContentType "application/json"\`);
    console.log(\`        -Body \$body\`);
    console.log(\`\n\`);
});
