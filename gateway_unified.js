const express = require("express");
const fs = require("fs").promises;
const path = require("path");

const app = express();
app.use(express.json());

const WORKSPACE = path.join(__dirname, "ai_workspace");
require("fs").mkdirSync(path.join(WORKSPACE, "projects"), { recursive: true });

// App templates
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
import { View, Text, StyleSheet } from 'react-native';

export default function WeatherApp() {
  return (
    <View style={styles.container}>
      <Text style={styles.title}>Weather App</Text>
      <Text style={styles.temp}>72°F</Text>
      <Text style={styles.condition}>Sunny</Text>
      <View style={styles.forecast}>
        <Text>Mon: 75°</Text>
        <Text>Tue: 73°</Text>
        <Text>Wed: 68°</Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: 'skyblue' },
  title: { fontSize: 32, color: 'white', marginBottom: 20 },
  temp: { fontSize: 64, color: 'white', fontWeight: 'bold', marginBottom: 10 },
  condition: { fontSize: 24, color: 'white', marginBottom: 30 },
  forecast: { flexDirection: 'row', justifyContent: 'space-around', width: '80%' }
});`,
    
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

// Universal endpoint for ALL communicators
app.post("/api/ai/process", async (req, res) => {
    try {
        const { message, session_id, source = "unknown" } = req.body;
        
        console.log(`📨 Request from ${source}: ${message.substring(0, 50)}...`);
        
        // Determine template
        let appCode = templates.calculator;
        if (message.toLowerCase().includes("weather")) {
            appCode = templates.weather;
        } else if (message.toLowerCase().includes("todo")) {
            appCode = templates.todo;
        }
        
        // Save file with source prefix
        const filename = `app_${source}_${session_id || Date.now()}.js`;
        const filepath = path.join(WORKSPACE, "projects", filename);
        await fs.writeFile(filepath, appCode);
        
        res.json({
            success: true,
            message: `App generated from ${source}!`,
            source: source,
            file: filename,
            download_url: `http://localhost:3003/api/download/${filename}`,
            view_url: `http://localhost:3003/api/view/${filename}`,
            timestamp: new Date().toISOString()
        });
        
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// Specialized endpoints
app.post("/api/human/process", async (req, res) => {
    try {
        const { message, session_id } = req.body;
        console.log(`👤 Human request: ${message.substring(0, 50)}...`);
        
        // Forward to universal endpoint with human source
        req.body.source = "human";
        return app._router.handle(req, res);
        
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

app.post("/api/deepseek/process", async (req, res) => {
    try {
        const { prompt, session_id } = req.body;
        console.log(`🤖 DeepSeek request: ${prompt.substring(0, 50)}...`);
        
        // Forward to universal endpoint with deepseek source
        req.body = { message: prompt, session_id, source: "deepseek" };
        return app._router.handle(req, res);
        
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

app.post("/api/ollama/process", async (req, res) => {
    try {
        const { prompt, session_id } = req.body;
        console.log(`🧠 Ollama request: ${prompt.substring(0, 50)}...`);
        
        // Forward to universal endpoint with ollama source
        req.body = { message: prompt, session_id, source: "ollama" };
        return app._router.handle(req, res);
        
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// Health endpoint
app.get("/api/health", async (req, res) => {
    try {
        const files = await fs.readdir(path.join(WORKSPACE, "projects"));
        
        res.json({
            status: "operational",
            gateway: "unified_ai_communication",
            endpoints: {
                universal: "POST /api/ai/process",
                human: "POST /api/human/process",
                deepseek: "POST /api/deepseek/process",
                ollama: "POST /api/ollama/process"
            },
            templates: ["calculator", "weather", "todo"],
            apps_generated: files.length,
            supported_sources: ["human", "deepseek", "ollama", "chatgpt", "claude", "any_ai"]
        });
        
    } catch (error) {
        res.json({ status: "operational", error: error.message });
    }
});

// File download
app.get("/api/download/:filename", async (req, res) => {
    try {
        const filepath = path.join(WORKSPACE, "projects", req.params.filename);
        res.download(filepath);
    } catch {
        res.status(404).json({ error: "File not found" });
    }
});

// File view
app.get("/api/view/:filename", async (req, res) => {
    try {
        const filepath = path.join(WORKSPACE, "projects", req.params.filename);
        const content = await fs.readFile(filepath, "utf8");
        res.type("text/plain").send(content);
    } catch {
        res.status(404).json({ error: "File not found" });
    }
});

// List workspace
app.get("/api/workspace", async (req, res) => {
    try {
        const files = await fs.readdir(path.join(WORKSPACE, "projects"));
        const stats = files.map(f => ({
            name: f,
            source: f.split("_")[1] || "unknown",
            size: require("fs").statSync(path.join(WORKSPACE, "projects", f)).size
        }));
        res.json({ total: files.length, apps: stats.slice(-10) });
    } catch {
        res.json({ total: 0, apps: [] });
    }
});

const PORT = 3003;
app.listen(PORT, () => {
    console.log("");
    console.log("    🚀 UNIFIED AI COMMUNICATION GATEWAY");
    console.log("    ====================================");
    console.log("");
    console.log("    📍 Port: " + PORT);
    console.log("");
    console.log("    👥 SUPPORTED COMMUNICATORS:");
    console.log("    • 👤 Humans    - POST /api/human/process");
    console.log("    • 🤖 DeepSeek  - POST /api/deepseek/process");
    console.log("    • 🧠 Ollama    - POST /api/ollama/process");
    console.log("    • 🤖 Any AI    - POST /api/ai/process");
    console.log("");
    console.log("    🔗 Universal endpoint: POST /api/ai/process");
    console.log("");
    console.log("    Ready for multi-source AI communication! 🎯");
    console.log("");
});
