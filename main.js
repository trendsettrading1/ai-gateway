// main.js - Main Electron process
const { app, BrowserWindow, Menu, Tray, ipcMain, dialog } = require('electron');
const path = require('path');
const { spawn } = require('child_process');
const Store = require('electron-store');
const notifier = require('node-notifier');

// Configuration store
const store = new Store();

let mainWindow;
let tray = null;
let gatewayProcess = null;
const isDev = process.env.NODE_ENV === 'development';

// Gateway configuration
const GATEWAY_PORT = 3003;
const GATEWAY_PATH = path.join(__dirname, 'gateway-server.js');

function createWindow() {
    // Create the browser window
    mainWindow = new BrowserWindow({
        width: 1200,
        height: 800,
        icon: path.join(__dirname, 'assets', 'icon.ico'),
        webPreferences: {
            nodeIntegration: false,
            contextIsolation: true,
            preload: path.join(__dirname, 'preload.js')
        },
        show: false,
        backgroundColor: '#0a0a0f',
        titleBarStyle: 'hiddenInset',
        frame: true
    });

    // Load the interface
    if (isDev) {
        mainWindow.loadURL('http://localhost:3003/desktop');
        mainWindow.webContents.openDevTools();
    } else {
        mainWindow.loadFile('interface/index.html');
    }

    // Show when ready
    mainWindow.once('ready-to-show', () => {
        mainWindow.show();
        
        // Check if it's first run
        if (!store.get('hasRunBefore')) {
            dialog.showMessageBox(mainWindow, {
                type: 'info',
                title: 'Welcome to AI Gateway',
                message: 'Welcome to AI Gateway Desktop!',
                detail: 'The application will start the AI gateway server automatically. You can access it at http://localhost:3003',
                buttons: ['OK']
            });
            store.set('hasRunBefore', true);
        }
    });

    // Handle window closed
    mainWindow.on('closed', () => {
        mainWindow = null;
    });

    // Create application menu
    createMenu();
}

// Create application menu
function createMenu() {
    const template = [
        {
            label: 'File',
            submenu: [
                {
                    label: 'Open Gateway Dashboard',
                    click: () => {
                        if (mainWindow) {
                            mainWindow.loadURL(`http://localhost:${GATEWAY_PORT}`);
                        }
                    }
                },
                { type: 'separator' },
                {
                    label: 'Open Workspace Folder',
                    click: () => {
                        const workspacePath = path.join(__dirname, 'ai_workspace');
                        require('electron').shell.openPath(workspacePath);
                    }
                },
                { type: 'separator' },
                { role: 'quit' }
            ]
        },
        {
            label: 'View',
            submenu: [
                { role: 'reload' },
                { role: 'forcereload' },
                { type: 'separator' },
                { role: 'resetzoom' },
                { role: 'zoomin' },
                { role: 'zoomout' },
                { type: 'separator' },
                { role: 'togglefullscreen' }
            ]
        },
        {
            label: 'Gateway',
            submenu: [
                {
                    label: 'Start Gateway Server',
                    click: startGatewayServer
                },
                {
                    label: 'Stop Gateway Server',
                    click: stopGatewayServer
                },
                { type: 'separator' },
                {
                    label: 'Gateway Status',
                    click: () => {
                        checkGatewayStatus();
                    }
                }
            ]
        },
        {
            label: 'Help',
            submenu: [
                {
                    label: 'Documentation',
                    click: () => {
                        require('electron').shell.openExternal('https://github.com/your-repo/docs');
                    }
                },
                {
                    label: 'Report Issue',
                    click: () => {
                        require('electron').shell.openExternal('https://github.com/your-repo/issues');
                    }
                },
                { type: 'separator' },
                {
                    label: 'About AI Gateway',
                    click: () => {
                        dialog.showMessageBox({
                            type: 'info',
                            title: 'About AI Gateway',
                            message: 'AI Gateway Desktop',
                            detail: `Version: ${app.getVersion()}\nA multimodal AI orchestration platform\n\n© ${new Date().getFullYear()} AI Gateway Team`
                        });
                    }
                }
            ]
        }
    ];

    const menu = Menu.buildFromTemplate(template);
    Menu.setApplicationMenu(menu);
}

// Start the gateway server
function startGatewayServer() {
    if (gatewayProcess) {
        showNotification('Gateway', 'Gateway server is already running');
        return;
    }

    showNotification('Gateway', 'Starting AI Gateway server...');
    
    gatewayProcess = spawn('node', [GATEWAY_PATH], {
        cwd: __dirname,
        stdio: 'pipe'
    });

    gatewayProcess.stdout.on('data', (data) => {
        console.log(`Gateway: ${data}`);
        if (mainWindow) {
            mainWindow.webContents.send('gateway-log', data.toString());
        }
    });

    gatewayProcess.stderr.on('data', (data) => {
        console.error(`Gateway Error: ${data}`);
        if (mainWindow) {
            mainWindow.webContents.send('gateway-error', data.toString());
        }
    });

    gatewayProcess.on('close', (code) => {
        console.log(`Gateway process exited with code ${code}`);
        gatewayProcess = null;
        if (mainWindow) {
            mainWindow.webContents.send('gateway-stopped');
        }
    });

    // Wait a moment for server to start
    setTimeout(() => {
        checkGatewayStatus();
    }, 2000);
}

// Stop the gateway server
function stopGatewayServer() {
    if (gatewayProcess) {
        gatewayProcess.kill();
        gatewayProcess = null;
        showNotification('Gateway', 'Gateway server stopped');
        if (mainWindow) {
            mainWindow.webContents.send('gateway-stopped');
        }
    }
}

// Check gateway status
function checkGatewayStatus() {
    const { net } = require('electron');
    const request = net.request(`http://localhost:${GATEWAY_PORT}/api/health`);
    
    request.on('response', (response) => {
        let data = '';
        response.on('data', (chunk) => {
            data += chunk;
        });
        response.on('end', () => {
            try {
                const status = JSON.parse(data);
                dialog.showMessageBox(mainWindow, {
                    type: 'info',
                    title: 'Gateway Status',
                    message: `Gateway is ${status.status}`,
                    detail: `Port: ${GATEWAY_PORT}\nApps Generated: ${status.apps_generated || 0}\nImage Prompts: ${status.images_generated || 0}`,
                    buttons: ['OK']
                });
            } catch (e) {
                dialog.showMessageBox(mainWindow, {
                    type: 'error',
                    title: 'Gateway Status',
                    message: 'Gateway is not responding',
                    buttons: ['OK']
                });
            }
        });
    });
    
    request.on('error', () => {
        dialog.showMessageBox(mainWindow, {
            type: 'error',
            title: 'Gateway Status',
            message: 'Gateway is not running',
            buttons: ['OK']
        });
    });
    
    request.end();
}

// Show system notification
function showNotification(title, message) {
    notifier.notify({
        title: title,
        message: message,
        icon: path.join(__dirname, 'assets', 'icon.ico'),
        sound: false
    });
}

// Create system tray
function createTray() {
    const iconPath = path.join(__dirname, 'assets', 'tray.ico');
    tray = new Tray(iconPath);
    
    const contextMenu = Menu.buildFromTemplate([
        {
            label: 'Open AI Gateway',
            click: () => {
                if (mainWindow) {
                    mainWindow.show();
                }
            }
        },
        {
            label: 'Gateway Dashboard',
            click: () => {
                if (mainWindow) {
                    mainWindow.loadURL(`http://localhost:${GATEWAY_PORT}`);
                    mainWindow.show();
                }
            }
        },
        { type: 'separator' },
        {
            label: 'Start Gateway',
            click: startGatewayServer
        },
        {
            label: 'Stop Gateway',
            click: stopGatewayServer
        },
        { type: 'separator' },
        {
            label: 'Quit',
            click: () => {
                stopGatewayServer();
                app.quit();
            }
        }
    ]);
    
    tray.setToolTip('AI Gateway Desktop');
    tray.setContextMenu(contextMenu);
    
    tray.on('click', () => {
        if (mainWindow) {
            mainWindow.isVisible() ? mainWindow.hide() : mainWindow.show();
        }
    });
}

// IPC handlers
ipcMain.handle('get-gateway-status', async () => {
    return new Promise((resolve) => {
        const { net } = require('electron');
        const request = net.request(`http://localhost:${GATEWAY_PORT}/api/health`);
        
        request.on('response', (response) => {
            let data = '';
            response.on('data', (chunk) => {
                data += chunk;
            });
            response.on('end', () => {
                try {
                    resolve(JSON.parse(data));
                } catch {
                    resolve({ status: 'offline' });
                }
            });
        });
        
        request.on('error', () => {
            resolve({ status: 'offline' });
        });
        
        request.end();
    });
});

// App lifecycle
app.whenReady().then(() => {
    createWindow();
    createTray();
    startGatewayServer(); // Auto-start gateway
    
    // Auto-start on login setting
    app.setLoginItemSettings({
        openAtLogin: store.get('startAtLogin', false)
    });
});

app.on('window-all-closed', () => {
    // Don't quit when all windows are closed (we have tray)
    if (process.platform !== 'darwin') {
        // Keep running in tray
    }
});

app.on('activate', () => {
    if (mainWindow === null) {
        createWindow();
    }
});

app.on('before-quit', () => {
    stopGatewayServer();
});

// Handle second instance
const gotTheLock = app.requestSingleInstanceLock();

if (!gotTheLock) {
    app.quit();
} else {
    app.on('second-instance', () => {
        if (mainWindow) {
            if (mainWindow.isMinimized()) mainWindow.restore();
            mainWindow.focus();
        }
    });
}
