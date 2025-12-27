// build.js - Build script for Electron app
const { build } = require('electron-builder');
const fs = require('fs');
const path = require('path');

console.log('🔨 Building AI Gateway Desktop App...');

// Ensure all required files exist
const requiredFiles = [
    'multimodal_gateway.js',
    'gateway-server.js',
    'main.js',
    'preload.js',
    'interface/index.html',
    'assets/icon.png'
];

for (const file of requiredFiles) {
    if (!fs.existsSync(file)) {
        console.error(`❌ Missing required file: ${file}`);
        process.exit(1);
    }
}

// Build configuration
const config = {
    appId: 'com.aigateway.desktop',
    productName: 'AI Gateway',
    directories: {
        output: 'dist',
        buildResources: 'assets'
    },
    files: [
        '*.js',
        'interface/**/*',
        'ai_workspace/**/*',
        'node_modules/**/*',
        '!node_modules/.bin',
        '!**/*.map'
    ],
    win: {
        target: 'nsis',
        icon: 'assets/icon.png'
    },
    nsis: {
        oneClick: false,
        allowToChangeInstallationDirectory: true,
        createDesktopShortcut: true,
        createStartMenuShortcut: true,
        shortcutName: 'AI Gateway'
    },
    mac: {
        target: 'dmg',
        icon: 'assets/icon.icns'
    },
    linux: {
        target: 'AppImage',
        icon: 'assets/icon.png'
    }
};

// Build the app
build({
    config: config
}).then(() => {
    console.log('✅ Build completed successfully!');
    console.log('📁 Output directory: dist/');
}).catch((error) => {
    console.error('❌ Build failed:', error);
    process.exit(1);
});
