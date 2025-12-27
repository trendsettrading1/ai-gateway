const express = require("express");
const app = express();
app.use(express.json());

const fs = require("fs").promises;
const path = require("path");

// Create workspace
const WORKSPACE = path.join(__dirname, "ai_workspace");
require("fs").mkdirSync(path.join(WORKSPACE, "projects"), { recursive: true });

// Simple templates
const templates = {
    calculator: "import React from 'react';\nimport { View, Text } from 'react-native';\n\nexport default function App() {\n  return (\n    <View style={{flex: 1, justifyContent: 'center', alignItems: 'center'}}>\n      <Text>Calculator App</Text>\n    </View>\n  );\n}",
    
    weather: "import React from 'react';\nimport { View, Text } from 'react-native';\n\nexport default function App() {\n  return (\n    <View style={{flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: 'skyblue'}}>\n      <Text style={{fontSize: 32}}>Weather App</Text>\n      <Text style={{fontSize: 64}}>72°F</Text>\n    </View>\n  );\n}",
    
    todo: "import React, { useState } from 'react';\nimport { View, Text, TextInput, Button } from 'react-native';\n\nexport default function App() {\n  const [tasks, setTasks] = useState([]);\n  const [input, setInput] = useState('');\n  \n  return (\n    <View style={{padding: 20}}>\n      <Text style={{fontSize: 32}}>Todo List</Text>\n      <TextInput placeholder='New task' value={input} onChangeText={setInput} />\n      <Button title='Add' onPress={() => {\n        if (input) setTasks([...tasks, input]);\n        setInput('');\n      }} />\n      {tasks.map((task, i) => (\n        <Text key={i}>{task}</Text>\n      ))}\n    </View>\n  );\n}"
};

// AI Processing endpoint
app.post("/api/ai/process", async (req, res) => {
    try {
        const { message, session_id } = req.body;
        console.log("🤖 Request:", message);
        
        // Choose template based on message
        let appCode = templates.calculator;
        if (message.toLowerCase().includes("weather")) {
            appCode = templates.weather;
        } else if (message.toLowerCase().includes("todo")) {
            appCode = templates.todo;
        }
        
        // Save file
        const filename = "app_" + (session_id || Date.now()) + ".js";
        const filepath = path.join(WORKSPACE, "projects", filename);
        await fs.writeFile(filepath, appCode);
        
        res.json({
            success: true,
            message: "App generated!",
            file: filename,
            code_length: appCode.length,
            timestamp: new Date().toISOString()
        });
        
    } catch (error) {
        console.error("Error:", error);
        res.status(500).json({ error: error.message });
    }
});

// Health check
app.get("/api/health", (req, res) => {
    res.json({ 
        status: "operational", 
        templates: ["calculator", "weather", "todo"],
        time: new Date().toISOString() 
    });
});

// List generated apps
app.get("/api/workspace", async (req, res) => {
    try {
        const files = await fs.readdir(path.join(WORKSPACE, "projects"));
        res.json({ count: files.length, files: files.slice(-10) });
    } catch {
        res.json({ count: 0, files: [] });
    }
});

const PORT = 3003;
app.listen(PORT, () => {
    console.log("");
    console.log("🚀 AI GATEWAY RUNNING ON PORT " + PORT);
    console.log("");
    console.log("Endpoints:");
    console.log("  POST /api/ai/process  - Generate apps");
    console.log("  GET  /api/health      - System status");
    console.log("  GET  /api/workspace   - List apps");
    console.log("");
    console.log("Test with:");
    console.log('  curl http://localhost:3003/api/health');
    console.log("");
});
