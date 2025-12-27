const express = require("express");
const axios = require("axios");
const fs = require("fs").promises;
const path = require("path");

const app = express();
app.use(express.json());

// Configuration
const DEEPSEEK_URL = "http://localhost:8080/v1/chat/completions";
const WORKSPACE = path.join(__dirname, "ai_workspace");

// Create workspace directories
["projects", "logs", "instructions"].forEach(dir => {
    const dirPath = path.join(WORKSPACE, dir);
    require("fs").mkdirSync(dirPath, { recursive: true });
});

// Connect to DeepSeek
async function queryDeepSeek(prompt) {
    try {
        console.log("?? Connecting to DeepSeek...");
        
        const response = await axios.post(DEEPSEEK_URL, {
            model: "tinyllama-1.1b-chat-v1.0.Q2_K.gguf",
            messages: [
                { 
                    role: "system", 
                    content: "You are an expert React Native developer. Return ONLY complete, runnable code with no explanations. Format: javascript code block." 
                },
                { role: "user", content: prompt }
            ],
            temperature: 0.7,
            max_tokens: 2000
        });
        
        return response.data.choices[0].message.content;
    } catch (error) {
        console.error("? DeepSeek connection failed:", error.message);
        // Fallback to mock response
        const mockApp = `// Mock app (DeepSeek offline)
import React from "react";
import { View, Text, StyleSheet } from "react-native";

export default function App() {
    return (
        <View style={styles.container}>
            <Text>App: ${prompt.substring(0, 50)}...</Text>
            <Text>DeepSeek: Offline - Using mock</Text>
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        justifyContent: "center",
        alignItems: "center"
    }
});`;
        return mockApp;
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
        
        // Get code from DeepSeek
        const deepseekResponse = await queryDeepSeek("Create React Native app: " + message);
        const appCode = extractCode(deepseekResponse);
        
        // Save the generated app
        const filename = "app_" + (session_id || Date.now()) + ".js";
        const filepath = path.join(WORKSPACE, "projects", filename);
        await fs.writeFile(filepath, appCode);
        
        res.json({
            success: true,
            source: "DeepSeek AI",
            message: "App generated from DeepSeek!",
            file: filename,
            code_length: appCode.length,
            preview: appCode.substring(0, 150) + "...",
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

// Health check with DeepSeek status
app.get("/api/health", async (req, res) => {
    try {
        // Test DeepSeek connection
        const deepseekStatus = await axios.get("http://localhost:8080/v1/models").catch(() => ({ status: "offline" }));
        
        res.json({
            status: "operational",
            deepseek: deepseekStatus.status === "offline" ? "offline" : "online",
            platform: "Windows/PowerShell",
            workspace: WORKSPACE,
            timestamp: new Date().toISOString()
        });
    } catch (error) {
        res.json({
            status: "partial",
            deepseek: "offline",
            error: error.message
        });
    }
});

// List generated apps
app.get("/api/workspace", async (req, res) => {
    try {
        const files = await fs.readdir(path.join(WORKSPACE, "projects"));
        res.json({
            count: files.length,
            files: files.map(f => ({
                name: f,
                path: path.join(WORKSPACE, "projects", f),
                url: "http://localhost:3003/api/project/" + f
            }))
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

const PORT = process.env.PORT || 3003;
app.listen(PORT, () => {
    console.log("");
    console.log("    +------------------------------------------+");
    console.log("    ¦     ?? AI-TO-AI GATEWAY RUNNING        ¦");
    console.log("    ¦     WITH DEEPSEEK INTEGRATION          ¦");
    console.log("    +------------------------------------------+");
    console.log("");
    console.log("    ?? Port: " + PORT);
    console.log("    ?? DeepSeek: " + DEEPSEEK_URL);
    console.log("    ?? Workspace: " + WORKSPACE);
    console.log("");
    console.log("    ?? Test AI-to-AI communication:");
    console.log("");
    console.log('    $body = @{');
    console.log('        message = "calculator app with buttons"');
    console.log('        session_id = "deepseek_test"');
    console.log('    } | ConvertTo-Json');
    console.log("");
    console.log('    Invoke-RestMethod -Uri "http://localhost:' + PORT + '/api/ai/process"');
    console.log('        -Method POST');
    console.log('        -ContentType "application/json"');
    console.log('        -Body $body');
    console.log("");
});
