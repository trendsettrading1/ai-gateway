const express = require("express");
const app = express();
app.use(express.json());

// Use regular fs, not fs.promises
const fs = require("fs");
const path = require("path");

// Create workspace
const WORKSPACE = path.join(__dirname, "ai_workspace");
if (!fs.existsSync(path.join(WORKSPACE, "projects"))) {
    fs.mkdirSync(path.join(WORKSPACE, "projects"), { recursive: true });
}

// Simple templates
const templates = {
    calculator: "import React from 'react';\nimport { View, Text } from 'react-native';\n\nexport default function App() {\n  return (\n    <View style={{flex: 1, justifyContent: 'center', alignItems: 'center'}}>\n      <Text>Calculator App</Text>\n    </View>\n  );\n}",

    weather: "import React from 'react';\nimport { View, Text } from 'react-native';\n\nexport default function App() {\n  return (\n    <View style={{flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: 'skyblue'}}>\n      <Text style={{fontSize: 32}}>Weather App</Text>\n      <Text style={{fontSize: 64}}>72°F</Text>\n    </View>\n  );\n}",

    todo: "import React, { useState } from 'react';\nimport { View, Text, TextInput, Button } from 'react-native';\n\nexport default function App() {\n  const [tasks, setTasks] = useState([]);\n  const [input, setInput] = useState('');\n  \n  return (\n    <View style={{padding: 20}}>\n      <Text style={{fontSize: 32}}>Todo List</Text>\n      <TextInput placeholder='New task' value={input} onChangeText={setInput} />\n      <Button title='Add' onPress={() => {\n        if (input) setTasks([...tasks, input]);\n        setInput('');\n      }} />\n      {tasks.map((task, i) => (\n        <Text key={i}>{task}</Text>\n      ))}\n    </View>\n  );\n}"
};

// Generate app function - using regular fs writeFileSync
function generateApp(message, source, session_id) {
    let appCode = templates.calculator;
    if (message.toLowerCase().includes("weather")) {
        appCode = templates.weather;
    } else if (message.toLowerCase().includes("todo")) {
        appCode = templates.todo;
    }
    
    const filename = `app_${source}_${session_id || Date.now()}.js`;
    const filepath = path.join(WORKSPACE, "projects", filename);
    
    // Use fs.writeFileSync instead of async
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

// Human endpoint - FIXED
app.post("/api/human/process", (req, res) => {
    try {
        const { message, session_id } = req.body;
        console.log(`👤 Human request: ${message}`);
        
        const result = generateApp(message, "human", session_id);
        res.json(result);
        
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// DeepSeek endpoint
app.post("/api/deepseek/process", (req, res) => {
    try {
        const { prompt, session_id } = req.body;
        console.log(`🤖 DeepSeek request: ${prompt}`);
        
        const result = generateApp(prompt, "deepseek", session_id);
        res.json(result);
        
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// Universal AI endpoint
app.post("/api/ai/process", (req, res) => {
    try {
        const { message, session_id, source = "ai" } = req.body;
        console.log(`🤖 ${source} request: ${message}`);
        
        const result = generateApp(message, source, session_id);
        res.json(result);
        
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// Health endpoint
app.get("/api/health", (req, res) => {
    try {
        let files = [];
        try {
            files = fs.readdirSync(path.join(WORKSPACE, "projects"));
        } catch (e) {
            // Directory might be empty
        }
        
        res.json({
            status: "operational",
            gateway: "simple_gateway_fixed",
            endpoints: {
                human: "POST /api/human/process",
                deepseek: "POST /api/deepseek/process",
                ai: "POST /api/ai/process"
            },
            templates: ["calculator", "weather", "todo"],
            apps_generated: files.length,
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

// File download
app.get("/api/download/:filename", (req, res) => {
    try {
        const filepath = path.join(WORKSPACE, "projects", req.params.filename);
        if (fs.existsSync(filepath)) {
            res.download(filepath);
        } else {
            res.status(404).json({ error: "File not found" });
        }
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// File view
app.get("/api/view/:filename", (req, res) => {
    try {
        const filepath = path.join(WORKSPACE, "projects", req.params.filename);
        const content = fs.readFileSync(filepath, "utf8");
        res.type("text/plain").send(content);
    } catch (error) {
        res.status(404).json({ error: "File not found" });
    }
});

const PORT = 3003;
app.listen(PORT, () => {
    console.log("");
    console.log("🚀 SIMPLE GATEWAY (FIXED) RUNNING");
    console.log("==================================");
    console.log(`📍 Port: ${PORT}`);
    console.log("");
    console.log("📡 Endpoints:");
    console.log("  POST /api/human/process");
    console.log("  POST /api/deepseek/process");
    console.log("  POST /api/ai/process");
    console.log("  GET  /api/health");
    console.log("  GET  /api/download/:filename");
    console.log("  GET  /api/view/:filename");
    console.log("");
    console.log("✅ Fixed: fs.promises → fs");
    console.log("✅ All endpoints should work now!");
    console.log("");
    console.log("Test with: irm http://localhost:3003/api/health");
    console.log("");
});
