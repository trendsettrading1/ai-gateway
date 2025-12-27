// gateway-server.js - Wrapper for your existing gateway
const { spawn } = require('child_process');
const path = require('path');
const fs = require('fs');

console.log('🚀 Starting AI Gateway Server...');

// Use the existing multimodal_gateway.js
const gatewayPath = path.join(__dirname, 'multimodal_gateway.js');

// Check if file exists
if (!fs.existsSync(gatewayPath)) {
    console.error('❌ Gateway file not found:', gatewayPath);
    process.exit(1);
}

// Start the gateway
const gateway = spawn('node', [gatewayPath], {
    stdio: 'inherit',
    shell: true
});

// Handle process events
gateway.on('error', (err) => {
    console.error('❌ Failed to start gateway:', err);
    process.exit(1);
});

gateway.on('close', (code) => {
    console.log(`🔴 Gateway process exited with code ${code}`);
    process.exit(code);
});

// Handle termination signals
process.on('SIGINT', () => {
    console.log('🛑 Received SIGINT, stopping gateway...');
    gateway.kill('SIGINT');
});

process.on('SIGTERM', () => {
    console.log('🛑 Received SIGTERM, stopping gateway...');
    gateway.kill('SIGTERM');
});
