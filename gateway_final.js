const express = require("express");
const fs = require("fs").promises;
const path = require("path");

const app = express();
app.use(express.json());

// Enable CORS for all origins
app.use((req, res, next) => {
    res.header("Access-Control-Allow-Origin", "*");
    res.header("Access-Control-Allow-Methods", "GET, POST, PUT, DELETE, OPTIONS");
    res.header("Access-Control-Allow-Headers", "Origin, X-Requested-With, Content-Type, Accept");
    if (req.method === "OPTIONS") {
        return res.sendStatus(200);
    }
    next();
});

const WORKSPACE = path.join(__dirname, "ai_workspace");
fs.mkdirSync(path.join(WORKSPACE, "projects"), { recursive: true });

// Templates
const templates = {
    calculator: `import React from 'react';
import { View, Text } from 'react-native';

export default function App() {
  return (
    <View style={{flex: 1, justifyContent: 'center', alignItems: 'center'}}>
      <Text style={{fontSize: 32}}>Calculator App</Text>
      <Text style={{fontSize: 16}}>Basic arithmetic operations</Text>
    </View>
  );
}`,

    weather: `import React from 'react';
import { View, Text } from 'react-native';

export default function WeatherApp() {
  return (
    <View style={{flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: 'skyblue'}}>
      <Text style={{fontSize: 32, color: 'white'}}>Weather App</Text>
      <Text style={{fontSize: 64, color: 'white', fontWeight: 'bold'}}>72°F</Text>
      <Text style={{fontSize: 24, color: 'white'}}>Sunny</Text>
    </View>
  );
}`,

    todo: `import React, { useState } from 'react';
import { View, Text, TextInput, Button } from 'react-native';

export default function TodoApp() {
  const [tasks, setTasks] = useState([]);
  const [input, setInput] = useState('');
  
  return (
    <View style={{padding: 20}}>
      <Text style={{fontSize: 32}}>Todo List</Text>
      <TextInput 
        placeholder="New task" 
        value={input} 
        onChangeText={setInput}
        style={{borderWidth: 1, padding: 10, marginBottom: 10}}
      />
      <Button title="Add" onPress={() => {
        if (input) setTasks([...tasks, input]);
        setInput('');
      }} />
      {tasks.map((task, i) => (
        <Text key={i} style={{padding: 10}}>{task}</Text>
      ))}
    </View>
  );
}`
};

// Generate app function
async function generateApp(message, source, session_id) {
    let appCode = templates.calculator;
    if (message.toLowerCase().includes("weather")) {
        appCode = templates.weather;
    } else if (message.toLowerCase().includes("todo")) {
        appCode = templates.todo;
    }
    
    const filename = `app_${source}_${session_id}_${Date.now()}.js`;
    const filepath = path.join(WORKSPACE, "projects", filename);
    await fs.writeFile(filepath, appCode);
    
    return {
        success: true,
        message: `App generated from ${source}!`,
        source: source,
        file: filename,
        timestamp: new Date().toISOString()
    };
}

// Human endpoint - FIXED VERSION
app.post("/api/human/process", async (req, res) => {
    try {
        console.log("👤 Human request received");
        const { message, session_id } = req.body;
        console.log(`Message: ${message}`);
        console.log(`Session: ${session_id}`);
        
        const result = await generateApp(message, "human", session_id);
        res.json(result);
        
    } catch (error) {
        console.error("Human endpoint error:", error);
        res.status(500).json({ 
            error: error.message,
            details: "Check server logs"
        });
    }
});

// DeepSeek endpoint
app.post("/api/deepseek/process", async (req, res) => {
    try {
        const { prompt, session_id } = req.body;
        const result = await generateApp(prompt, "deepseek", session_id);
        res.json(result);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// Universal AI endpoint
app.post("/api/ai/process", async (req, res) => {
    try {
        const { message, session_id, source = "ai" } = req.body;
        const result = await generateApp(message, source, session_id);
        res.json(result);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// Health check
app.get("/api/health", (req, res) => {
    res.json({
        status: "operational",
        gateway: "simple_fixed_gateway",
        endpoints: [
            "POST /api/human/process",
            "POST /api/deepseek/process", 
            "POST /api/ai/process"
        ],
        timestamp: new Date().toISOString()
    });
});

// Start server
const PORT = 3003;
app.listen(PORT, () => {
    console.log("");
    console.log("🚀 SIMPLE FIXED GATEWAY RUNNING");
    console.log("================================");
    console.log(`📍 Port: ${PORT}`);
    console.log("");
    console.log("📡 Endpoints:");
    console.log("  POST /api/human/process");
    console.log("  POST /api/deepseek/process");
    console.log("  POST /api/ai/process");
    console.log("  GET  /api/health");
    console.log("");
    console.log("✅ Ready! Test with PowerShell:");
    console.log('irm http://localhost:3003/api/health');
    console.log("");
});
