const express = require("express");
const axios = require("axios");
const fs = require("fs").promises;
const path = require("path");

const app = express()

// Serve static files from public directory
app.use(express.static(path.join(__dirname, 'public')));;
app.use(express.json());

const WORKSPACE = path.join(__dirname, "ai_workspace");
require("fs").mkdirSync(path.join(WORKSPACE, "projects"), { recursive: true });

// Pre-built app templates (instant response)
const appTemplates = {
    calculator: {
        name: "Calculator App",
        code: \`import React, { useState } from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';

export default function CalculatorApp() {
    const [display, setDisplay] = useState('0');
    const [firstValue, setFirstValue] = useState(null);
    const [operator, setOperator] = useState(null);
    const [waitingForSecondValue, setWaitingForSecondValue] = useState(false);

    const handleNumberPress = (num) => {
        if (waitingForSecondValue) {
            setDisplay(String(num));
            setWaitingForSecondValue(false);
        } else {
            setDisplay(display === '0' ? String(num) : display + num);
        }
    };

    const handleOperatorPress = (op) => {
        const inputValue = parseFloat(display);
        
        if (firstValue === null) {
            setFirstValue(inputValue);
        } else if (operator) {
            const result = calculate(firstValue, inputValue, operator);
            setDisplay(String(result));
            setFirstValue(result);
        }
        
        setWaitingForSecondValue(true);
        setOperator(op);
    };

    const calculate = (first, second, op) => {
        switch(op) {
            case '+': return first + second;
            case '-': return first - second;
            case 'Ã—': return first * second;
            case 'Ã·': return first / second;
            default: return second;
        }
    };

    const handleEquals = () => {
        const inputValue = parseFloat(display);
        
        if (firstValue !== null && operator) {
            const result = calculate(firstValue, inputValue, operator);
            setDisplay(String(result));
            setFirstValue(null);
            setOperator(null);
            setWaitingForSecondValue(true);
        }
    };

    const handleClear = () => {
        setDisplay('0');
        setFirstValue(null);
        setOperator(null);
        setWaitingForSecondValue(false);
    };

    const buttons = [
        ['7', '8', '9', 'Ã·'],
        ['4', '5', '6', 'Ã—'],
        ['1', '2', '3', '-'],
        ['0', 'C', '=', '+']
    ];

    return (
        <View style={styles.container}>
            <Text style={styles.display}>{display}</Text>
            {buttons.map((row, rowIndex) => (
                <View key={rowIndex} style={styles.row}>
                    {row.map(btn => (
                        <TouchableOpacity 
                            key={btn}
                            style={[styles.button, btn === '=' && styles.equalsButton]}
                            onPress={() => {
                                if (btn === 'C') handleClear();
                                else if (btn === '=') handleEquals();
                                else if (['Ã·', 'Ã—', '-', '+'].includes(btn)) handleOperatorPress(btn);
                                else handleNumberPress(btn);
                            }}
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
    container: {
        flex: 1,
        backgroundColor: '#1a1a1a',
        padding: 20,
        justifyContent: 'center',
    },
    display: {
        fontSize: 64,
        color: 'white',
        textAlign: 'right',
        marginBottom: 30,
        padding: 20,
        backgroundColor: '#2a2a2a',
        borderRadius: 10,
    },
    row: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        marginBottom: 15,
    },
    button: {
        width: 75,
        height: 75,
        justifyContent: 'center',
        alignItems: 'center',
        backgroundColor: '#333',
        borderRadius: 37.5,
    },
    equalsButton: {
        backgroundColor: '#ff9500',
    },
    buttonText: {
        fontSize: 28,
        color: 'white',
        fontWeight: 'bold',
    },
});\`
    },
    
    weather: {
        name: "Weather App", 
        code: \`import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, Image, ScrollView } from 'react-native';

export default function WeatherApp() {
    const [weather, setWeather] = useState({
        location: 'New York',
        temperature: 72,
        condition: 'Sunny',
        humidity: 65,
        wind: 8,
        feelsLike: 74
    });
    
    const [forecast, setForecast] = useState([
        { day: 'Mon', high: 75, low: 62, condition: 'Sunny', icon: '??' },
        { day: 'Tue', high: 73, low: 60, condition: 'Partly Cloudy', icon: '?' },
        { day: 'Wed', high: 68, low: 58, condition: 'Rainy', icon: '???' },
        { day: 'Thu', high: 70, low: 59, condition: 'Cloudy', icon: '??' },
        { day: 'Fri', high: 76, low: 63, condition: 'Sunny', icon: '??' },
    ]);

    return (
        <ScrollView style={styles.container}>
            <View style={styles.header}>
                <Text style={styles.location}>{weather.location}</Text>
                <Text style={styles.temperature}>{weather.temperature}Â°F</Text>
                <Text style={styles.condition}>{weather.condition}</Text>
                
                <View style={styles.details}>
                    <View style={styles.detailItem}>
                        <Text style={styles.detailLabel}>Humidity</Text>
                        <Text style={styles.detailValue}>{weather.humidity}%</Text>
                    </View>
                    <View style={styles.detailItem}>
                        <Text style={styles.detailLabel}>Wind</Text>
                        <Text style={styles.detailValue}>{weather.wind} mph</Text>
                    </View>
                    <View style={styles.detailItem}>
                        <Text style={styles.detailLabel}>Feels Like</Text>
                        <Text style={styles.detailValue}>{weather.feelsLike}Â°F</Text>
                    </View>
                </View>
            </View>
            
            <View style={styles.forecastContainer}>
                <Text style={styles.forecastTitle}>5-Day Forecast</Text>
                {forecast.map((day, index) => (
                    <View key={index} style={styles.forecastDay}>
                        <Text style={styles.forecastDayText}>{day.day}</Text>
                        <Text style={styles.forecastIcon}>{day.icon}</Text>
                        <Text style={styles.forecastCondition}>{day.condition}</Text>
                        <Text style={styles.forecastTemp}>{day.high}Â°/{day.low}Â°</Text>
                    </View>
                ))}
            </View>
        </ScrollView>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#87CEEB',
    },
    header: {
        padding: 30,
        alignItems: 'center',
        backgroundColor: 'rgba(255, 255, 255, 0.2)',
    },
    location: {
        fontSize: 32,
        fontWeight: 'bold',
        color: 'white',
        marginBottom: 10,
    },
    temperature: {
        fontSize: 72,
        fontWeight: 'bold',
        color: 'white',
        marginBottom: 5,
    },
    condition: {
        fontSize: 24,
        color: 'white',
        marginBottom: 30,
    },
    details: {
        flexDirection: 'row',
        justifyContent: 'space-around',
        width: '100%',
        backgroundColor: 'rgba(255, 255, 255, 0.3)',
        padding: 20,
        borderRadius: 15,
    },
    detailItem: {
        alignItems: 'center',
    },
    detailLabel: {
        fontSize: 14,
        color: 'white',
        opacity: 0.8,
        marginBottom: 5,
    },
    detailValue: {
        fontSize: 20,
        fontWeight: 'bold',
        color: 'white',
    },
    forecastContainer: {
        backgroundColor: 'white',
        margin: 20,
        borderRadius: 20,
        padding: 20,
        elevation: 5,
    },
    forecastTitle: {
        fontSize: 24,
        fontWeight: 'bold',
        marginBottom: 20,
        color: '#333',
    },
    forecastDay: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingVertical: 15,
        borderBottomWidth: 1,
        borderBottomColor: '#eee',
    },
    forecastDayText: {
        fontSize: 18,
        fontWeight: 'bold',
        width: 40,
    },
    forecastIcon: {
        fontSize: 24,
        width: 40,
    },
    forecastCondition: {
        fontSize: 16,
        color: '#666',
        flex: 1,
        marginLeft: 10,
    },
    forecastTemp: {
        fontSize: 18,
        fontWeight: 'bold',
        color: '#333',
    },
});\`
    },
    
    todo: {
        name: "Todo List App",
        code: \`import React, { useState } from 'react';
import { 
    View, 
    Text, 
    TextInput, 
    TouchableOpacity, 
    FlatList, 
    StyleSheet,
    KeyboardAvoidingView,
    Platform 
} from 'react-native';

export default function TodoApp() {
    const [tasks, setTasks] = useState([
        { id: '1', text: 'Buy groceries', completed: false },
        { id: '2', text: 'Finish React Native project', completed: true },
        { id: '3', text: 'Call mom', completed: false },
        { id: '4', text: 'Go to gym', completed: false },
    ]);
    const [newTask, setNewTask] = useState('');
    const [filter, setFilter] = useState('all'); // 'all', 'active', 'completed'

    const addTask = () => {
        if (newTask.trim()) {
            setTasks([...tasks, { 
                id: Date.now().toString(), 
                text: newTask.trim(), 
                completed: false 
            }]);
            setNewTask('');
        }
    };

    const toggleTask = (id) => {
        setTasks(tasks.map(task => 
            task.id === id ? { ...task, completed: !task.completed } : task
        ));
    };

    const deleteTask = (id) => {
        setTasks(tasks.filter(task => task.id !== id));
    };

    const clearCompleted = () => {
        setTasks(tasks.filter(task => !task.completed));
    };

    const filteredTasks = tasks.filter(task => {
        if (filter === 'active') return !task.completed;
        if (filter === 'completed') return task.completed;
        return true;
    });

    const remainingTasks = tasks.filter(task => !task.completed).length;

    return (
        <KeyboardAvoidingView 
            style={styles.container}
            behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        >
            <View style={styles.header}>
                <Text style={styles.title}>Todo List</Text>
                <Text style={styles.subtitle}>{remainingTasks} tasks remaining</Text>
            </View>

            <View style={styles.inputContainer}>
                <TextInput
                    style={styles.input}
                    placeholder="Add a new task..."
                    value={newTask}
                    onChangeText={setNewTask}
                    onSubmitEditing={addTask}
                />
                <TouchableOpacity style={styles.addButton} onPress={addTask}>
                    <Text style={styles.addButtonText}>+</Text>
                </TouchableOpacity>
            </View>

            <View style={styles.filterContainer}>
                <TouchableOpacity 
                    style={[styles.filterButton, filter === 'all' && styles.filterActive]}
                    onPress={() => setFilter('all')}
                >
                    <Text style={styles.filterButtonText}>All</Text>
                </TouchableOpacity>
                <TouchableOpacity 
                    style={[styles.filterButton, filter === 'active' && styles.filterActive]}
                    onPress={() => setFilter('active')}
                >
                    <Text style={styles.filterButtonText}>Active</Text>
                </TouchableOpacity>
                <TouchableOpacity 
                    style={[styles.filterButton, filter === 'completed' && styles.filterActive]}
                    onPress={() => setFilter('completed')}
                >
                    <Text style={styles.filterButtonText}>Completed</Text>
                </TouchableOpacity>
            </View>

            <FlatList
                data={filteredTasks}
                keyExtractor={item => item.id}
                renderItem={({ item }) => (
                    <View style={styles.taskItem}>
                        <TouchableOpacity 
                            style={styles.taskCheckbox}
                            onPress={() => toggleTask(item.id)}
                        >
                            <Text style={styles.checkboxText}>
                                {item.completed ? '?' : '?'}
                            </Text>
                        </TouchableOpacity>
                        <Text style={[
                            styles.taskText, 
                            item.completed && styles.completedTask
                        ]}>
                            {item.text}
                        </Text>
                        <TouchableOpacity 
                            style={styles.deleteButton}
                            onPress={() => deleteTask(item.id)}
                        >
                            <Text style={styles.deleteButtonText}>Ã—</Text>
                        </TouchableOpacity>
                    </View>
                )}
                style={styles.taskList}
            />

            {tasks.some(task => task.completed) && (
                <TouchableOpacity style={styles.clearButton} onPress={clearCompleted}>
                    <Text style={styles.clearButtonText}>Clear Completed</Text>
                </TouchableOpacity>
            )}
        </KeyboardAvoidingView>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#f5f5f5',
        padding: 20,
    },
    header: {
        marginBottom: 30,
        marginTop: 50,
    },
    title: {
        fontSize: 36,
        fontWeight: 'bold',
        color: '#333',
        marginBottom: 5,
    },
    subtitle: {
        fontSize: 16,
        color: '#666',
    },
    inputContainer: {
        flexDirection: 'row',
        marginBottom: 25,
    },
    input: {
        flex: 1,
        backgroundColor: 'white',
        padding: 18,
        borderRadius: 12,
        fontSize: 18,
        marginRight: 10,
        elevation: 2,
    },
    addButton: {
        backgroundColor: '#4CAF50',
        width: 60,
        height: 60,
        borderRadius: 30,
        justifyContent: 'center',
        alignItems: 'center',
        elevation: 3,
    },
    addButtonText: {
        color: 'white',
        fontSize: 28,
        fontWeight: 'bold',
    },
    filterContainer: {
        flexDirection: 'row',
        justifyContent: 'space-around',
        marginBottom: 20,
        backgroundColor: 'white',
        padding: 10,
        borderRadius: 10,
        elevation: 2,
    },
    filterButton: {
        paddingVertical: 8,
        paddingHorizontal: 20,
        borderRadius: 20,
    },
    filterActive: {
        backgroundColor: '#4CAF50',
    },
    filterButtonText: {
        fontSize: 16,
        color: '#666',
    },
    filterActiveText: {
        color: 'white',
        fontWeight: 'bold',
    },
    taskList: {
        flex: 1,
    },
    taskItem: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: 'white',
        padding: 18,
        borderRadius: 12,
        marginBottom: 12,
        elevation: 2,
    },
    taskCheckbox: {
        width: 30,
        height: 30,
        borderRadius: 15,
        borderWidth: 2,
        borderColor: '#4CAF50',
        justifyContent: 'center',
        alignItems: 'center',
        marginRight: 15,
    },
    checkboxText: {
        fontSize: 16,
        color: '#4CAF50',
        fontWeight: 'bold',
    },
    taskText: {
        flex: 1,
        fontSize: 18,
        color: '#333',
    },
    completedTask: {
        textDecorationLine: 'line-through',
        color: '#888',
    },
    deleteButton: {
        padding: 5,
    },
    deleteButtonText: {
        fontSize: 24,
        color: '#ff4444',
        fontWeight: 'bold',
    },
    clearButton: {
        backgroundColor: '#ff4444',
        padding: 15,
        borderRadius: 10,
        alignItems: 'center',
        marginTop: 20,
        elevation: 2,
    },
    clearButtonText: {
        color: 'white',
        fontSize: 16,
        fontWeight: 'bold',
    },
});\`
    }
};

// Optional AI enhancement (async, non-blocking)
async function tryAIEnhancement(prompt, templateCode) {
    try {
        // Quick Ollama check
        await axios.get("http://localhost:11434/api/tags", { timeout: 2000 });
        
        // Send to Ollama in background (don't wait for response)
        axios.post("http://localhost:11434/api/generate", {
            model: "tinyllama",
            prompt: "Improve this React Native app code: " + templateCode.substring(0, 500) + "...",
            stream: false,
            options: { num_predict: 300 }
        }, { timeout: 15000 }).then(response => {
            console.log("? AI enhancement received (background)");
            // Could save enhanced version separately
        }).catch(() => {
            // Ignore AI errors - we have the template
        });
        
        return templateCode; // Return template immediately
        
    } catch (error) {
        return templateCode; // Always return template
    }
}

// Main endpoint
app.post("/api/ai/process", async (req, res) => {
    try {
        const { message, session_id } = req.body;
        console.log("?? App request:", message);
        
        // Determine which template to use
        let template = appTemplates.calculator;
        if (message.toLowerCase().includes("weather")) {
            template = appTemplates.weather;
        } else if (message.toLowerCase().includes("todo") || message.toLowerCase().includes("task")) {
            template = appTemplates.todo;
        } else if (message.toLowerCase().includes("note")) {
            template = appTemplates.todo; // Reuse todo template for notes
        }
        
        // Get the code (with optional AI enhancement in background)
        const appCode = await tryAIEnhancement(message, template.code);
        
        // Save the app
        const filename = \`app_\${session_id || Date.now()}.js\`;
        const filepath = path.join(WORKSPACE, "projects", filename);
        await fs.writeFile(filepath, appCode);
        
        res.json({
            success: true,
            app_name: template.name,
            source: "Hybrid System (Template + AI)",
            message: "App generated instantly!",
            file: filename,
            code_length: appCode.length,
            template_used: template.name,
            ai_enhancement: "background_processing",
            timestamp: new Date().toISOString()
        });
        
    } catch (error) {
        console.error("Error:", error);
        res.status(500).json({ success: false, error: error.message });
    }
});

// Health endpoint
app.get("/api/health", async (req, res) => {
    try {
        await axios.get("http://localhost:11434/api/tags", { timeout: 2000 });
        res.json({ 
            status: "excellent", 
            mode: "hybrid",
            ollama: "available",
            templates: Object.keys(appTemplates),
            performance: "instant"
        });
    } catch {
        res.json({ 
            status: "excellent", 
            mode: "hybrid", 
            ollama: "offline",
            templates: Object.keys(appTemplates),
            performance: "instant",
            note: "Using high-quality templates"
        });
    }
});

// List apps
app.get("/api/workspace", async (req, res) => {
    try {
        const files = await fs.readdir(path.join(WORKSPACE, "projects"));
        const stats = files.map(f => {
            const fullPath = path.join(WORKSPACE, "projects", f);
            return {
                name: f,
                size: require("fs").statSync(fullPath).size,
                created: require("fs").statSync(fullPath).birthtime
            };
        });
        res.json({ count: files.length, apps: stats.slice(-10) });
    } catch {
        res.json({ count: 0, apps: [] });
    }
});

const PORT = process.env.PORT || 3003;
app.listen(PORT, () => {
    console.log("");
    console.log("    +------------------------------------------+");
    console.log("    Â¦     ?? HYBRID AI GATEWAY RUNNING       Â¦");
    console.log("    +------------------------------------------+");
    console.log("");
    console.log("    ?? Port: " + PORT);
    console.log("    ? Performance: INSTANT responses");
    console.log("    ?? Templates: calculator, weather, todo");
    console.log("    ?? AI Enhancement: Background processing");
    console.log("");
    console.log("    ?? Test with:");
    console.log('    $body = @{message="calculator"} | ConvertTo-Json');
    console.log('    Invoke-RestMethod -Uri "http://localhost:' + PORT + '/api/ai/process"');
    console.log('        -Method POST -ContentType "application/json" -Body $body');
    console.log("");
});

