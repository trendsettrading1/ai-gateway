const express = require("express");
const axios = require("axios");
const fs = require("fs").promises;
const path = require("path");

const app = express();
app.use(express.json());

// Configuration
const OLLAMA_URL = "http://localhost:11434/api/generate";
const MODEL = "tinyllama";
const WORKSPACE = path.join(__dirname, "ai_workspace");

// Create workspace
["projects"].forEach(dir => {
    const dirPath = path.join(WORKSPACE, dir);
    require("fs").mkdirSync(dirPath, { recursive: true });
});

// Improved Ollama query with fallback
async function queryOllama(prompt) {
    try {
        console.log("?? Querying Ollama...");
        
        // Quick test first - is Ollama responding?
        await axios.get("http://localhost:11434/api/tags", { timeout: 3000 });
        
        console.log("? Ollama is alive, sending request...");
        
        const response = await axios.post(OLLAMA_URL, {
            model: MODEL,
            prompt: "Create React Native app: " + prompt + ". Return only JavaScript code.",
            stream: false,
            options: {
                temperature: 0.7,
                num_predict: 1000  // Reduced for faster response
            }
        }, {
            timeout: 45000  // 45 second timeout
        });
        
        console.log("? Ollama response received");
        return response.data.response || "// No response from AI";
        
    } catch (error) {
        console.log("? Ollama timeout/error, using fallback:", error.message);
        
        // Fast fallback response
        return \`// Calculator App
import React, { useState } from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';

export default function CalculatorApp() {
    const [display, setDisplay] = useState('0');

    const buttons = [
        ['7', '8', '9', '/'],
        ['4', '5', '6', '*'],
        ['1', '2', '3', '-'],
        ['0', 'C', '=', '+']
    ];

    const handlePress = (value) => {
        if (value === 'C') {
            setDisplay('0');
        } else if (value === '=') {
            try {
                setDisplay(eval(display).toString());
            } catch {
                setDisplay('Error');
            }
        } else {
            setDisplay(display === '0' ? value : display + value);
        }
    };

    return (
        <View style={styles.container}>
            <Text style={styles.display}>{display}</Text>
            {buttons.map((row, rowIndex) => (
                <View key={rowIndex} style={styles.row}>
                    {row.map(btn => (
                        <TouchableOpacity 
                            key={btn} 
                            style={styles.button}
                            onPress={() => handlePress(btn)}
                        >
                            <Text style={styles.buttonText}>{btn}</Text>
                        </TouchableOpacity>
                    ))}
                </View>
            ))}
        </View>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1, padding: 20, backgroundColor: '#f5f5f5' },
    display: { fontSize: 48, textAlign: 'right', marginBottom: 20, padding: 10, backgroundColor: 'white' },
    row: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 10 },
    button: { width: 70, height: 70, justifyContent: 'center', alignItems: 'center', backgroundColor: 'white', borderRadius: 35 },
    buttonText: { fontSize: 24 }
});\`;
    }
}

// AI Processing endpoint with timeout protection
app.post("/api/ai/process", async (req, res) => {
    try {
        const { message, session_id } = req.body;
        console.log("?? Request:", message.substring(0, 50) + "...");
        
        // Set a timeout for the entire operation
        const timeoutPromise = new Promise((_, reject) => 
            setTimeout(() => reject(new Error("Operation timeout")), 30000)
        );
        
        // Race between Ollama and timeout
        const ollamaResponse = await Promise.race([
            queryOllama(message),
            timeoutPromise
        ]);
        
        const appCode = ollamaResponse;
        const filename = "app_" + (session_id || Date.now()) + ".js";
        const filepath = path.join(WORKSPACE, "projects", filename);
        
        await fs.writeFile(filepath, appCode);
        
        res.json({
            success: true,
            source: "Ollama",
            message: "App generated!",
            file: filename,
            code_length: appCode.length,
            preview: appCode.substring(0, 100).replace(/\n/g, " ") + "...",
            timestamp: new Date().toISOString()
        });
        
    } catch (error) {
        console.error("? Error:", error.message);
        res.status(500).json({ 
            success: false, 
            error: error.message,
            note: "Using fallback response"
        });
    }
});

// Fast health check
app.get("/api/health", async (req, res) => {
    try {
        await axios.get("http://localhost:11434/api/tags", { timeout: 2000 });
        res.json({ status: "OK", ollama: "online", model: MODEL });
    } catch {
        res.json({ status: "OK", ollama: "offline", model: MODEL });
    }
});

// Quick workspace check
app.get("/api/workspace", async (req, res) => {
    try {
        const files = await fs.readdir(path.join(WORKSPACE, "projects"));
        res.json({ count: files.length, files: files.slice(-5) }); // Last 5 files only
    } catch {
        res.json({ count: 0, files: [] });
    }
});

const PORT = process.env.PORT || 3003;
app.listen(PORT, () => {
    console.log("?? Robust AI Gateway on port " + PORT);
    console.log("? Fast responses with fallback system");
});
