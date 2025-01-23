//server.js
const express = require('express');
const cors = require('cors');
const WebSocket = require('ws');
const os = require('os');
const ffi = require('ffi-napi');
const ref = require('ref-napi');
const StructType = require('ref-struct-napi');
const app = express();
const port = 3000;
const wsPort = 3001;

// Error handling for uncaught exceptions
process.on('uncaughtException', (err) => {
    console.error('Uncaught Exception:', err);
});

process.on('unhandledRejection', (reason, promise) => {
    console.error('Unhandled Rejection at:', promise, 'reason:', reason);
});

// Define Windows API structures with error handling
let user32;
try {
    const POINT = StructType({
        x: 'long',
        y: 'long'
    });

    // Mouse event constants
    const MOUSEEVENTF_LEFTDOWN = 0x0002;
    const MOUSEEVENTF_LEFTUP = 0x0004;
    const MOUSEEVENTF_RIGHTDOWN = 0x0008;
    const MOUSEEVENTF_RIGHTUP = 0x0010;

    user32 = ffi.Library('user32', {
        'SetCursorPos': ['bool', ['int', 'int']],
        'GetCursorPos': ['bool', [ref.refType(POINT)]],
        'mouse_event': ['void', ['int', 'int', 'int', 'int', 'int']],
        'GetSystemMetrics': ['int', ['int']]
    });
} catch (error) {
    console.error('Failed to load user32.dll:', error);
    process.exit(1);
}

// Keep track of active connections
const activeConnections = new Set();

function getLocalIPs() {
    try {
        const interfaces = os.networkInterfaces();
        const addresses = [];
        
        for (const name of Object.keys(interfaces)) {
            for (const interface of interfaces[name]) {
                if (interface.family === 'IPv4' && !interface.internal) {
                    addresses.push(interface.address);
                }
            }
        }
        return addresses;
    } catch (error) {
        console.error('Error getting local IPs:', error);
        return ['localhost'];
    }
}

const localIPs = getLocalIPs();

// Mouse control functions with retry logic
function withRetry(fn, maxRetries = 3) {
    return async (...args) => {
        for (let i = 0; i < maxRetries; i++) {
            try {
                return await fn(...args);
            } catch (error) {
                if (i === maxRetries - 1) throw error;
                await new Promise(resolve => setTimeout(resolve, 100));
            }
        }
    };
}

const moveMouse = withRetry(async (x, y) => {
    const result = user32.SetCursorPos(Math.floor(x), Math.floor(y));
    if (!result) throw new Error('Failed to move cursor');
});

const mouseClick = withRetry(async (button = 'left') => {
    if (button === 'left') {
        user32.mouse_event(MOUSEEVENTF_LEFTDOWN, 0, 0, 0, 0);
        await new Promise(resolve => setTimeout(resolve, 50));
        user32.mouse_event(MOUSEEVENTF_LEFTUP, 0, 0, 0, 0);
    } else if (button === 'right') {
        user32.mouse_event(MOUSEEVENTF_RIGHTDOWN, 0, 0, 0, 0);
        await new Promise(resolve => setTimeout(resolve, 50));
        user32.mouse_event(MOUSEEVENTF_RIGHTUP, 0, 0, 0, 0);
    }
});

const mouseHold = withRetry(async (button = 'left', action = 'down') => {
    if (button === 'left') {
        action === 'down' ? 
            user32.mouse_event(MOUSEEVENTF_LEFTDOWN, 0, 0, 0, 0) :
            user32.mouse_event(MOUSEEVENTF_LEFTUP, 0, 0, 0, 0);
    } else if (button === 'right') {
        action === 'down' ?
            user32.mouse_event(MOUSEEVENTF_RIGHTDOWN, 0, 0, 0, 0) :
            user32.mouse_event(MOUSEEVENTF_RIGHTUP, 0, 0, 0, 0);
    }
});

const getMousePosition = withRetry(async () => {
    const point = new POINT();
    const result = user32.GetCursorPos(point.ref());
    if (!result) throw new Error('Failed to get cursor position');
    return { x: point.x, y: point.y };
});

// Express middleware for logging
app.use((req, res, next) => {
    console.log(`${new Date().toISOString()} ${req.method} ${req.url}`);
    next();
});

app.use(cors());
app.use(express.json());

// Request handlers with proper error handling
app.post('/mouse/move', async (req, res) => {
    try {
        const { x, y } = req.body;
        console.log(`Moving mouse to x: ${x}, y: ${y}`);
        await moveMouse(x, y);
        res.json({ success: true });
    } catch (error) {
        console.error('Error moving mouse:', error);
        res.status(500).json({ error: error.message });
    }
});

app.post('/mouse/click', async (req, res) => {
    try {
        const { button = 'left' } = req.body;
        await mouseClick(button);
        res.json({ success: true });
    } catch (error) {
        console.error('Error clicking mouse:', error);
        res.status(500).json({ error: error.message });
    }
});

app.post('/mouse/hold', async (req, res) => {
    try {
        const { button = 'left', action = 'down' } = req.body;
        console.log(`Mouse ${button} button ${action}`);
        await mouseHold(button, action);
        res.json({ success: true });
    } catch (error) {
        console.error('Error with mouse hold:', error);
        res.status(500).json({ error: error.message });
    }
});

app.get('/mouse/position', async (req, res) => {
    try {
        const pos = await getMousePosition();
        res.json(pos);
    } catch (error) {
        console.error('Error getting mouse position:', error);
        res.status(500).json({ error: error.message });
    }
});

app.get('/ping', (req, res) => {
    res.json({ status: 'ok', connections: activeConnections.size });
});

app.get('/screen', (req, res) => {
    try {
        const SM_CXSCREEN = 0;
        const SM_CYSCREEN = 1;
        
        const width = user32.GetSystemMetrics(SM_CXSCREEN);
        const height = user32.GetSystemMetrics(SM_CYSCREEN);
        
        res.json({ width, height });
    } catch (error) {
        console.error('Error getting screen metrics:', error);
        res.status(500).json({ error: error.message });
    }
});

// WebSocket server with connection tracking
const wss = new WebSocket.Server({ port: wsPort });

wss.on('connection', (ws) => {
    const id = Date.now().toString();
    activeConnections.add(id);
    console.log(`Client connected (${activeConnections.size} total)`);
    
    ws.send(JSON.stringify({
        type: 'connected',
        name: os.hostname(),
        ip: localIPs[0],
        port: port
    }));

    ws.on('close', () => {
        activeConnections.delete(id);
        console.log(`Client disconnected (${activeConnections.size} remaining)`);
    });

    ws.on('error', (error) => {
        console.error('WebSocket error:', error);
        activeConnections.delete(id);
    });
});

// Start server with error handling
const server = app.listen(port, () => {
    console.log(`Server running at http://localhost:${port}`);
    console.log('Available on:');
    localIPs.forEach(ip => {
        console.log(`  http://${ip}:${port}`);
    });
}).on('error', (error) => {
    console.error('Server error:', error);
});

// Graceful shutdown
process.on('SIGTERM', () => {
    server.close(() => {
        console.log('Server shutting down');
        process.exit(0);
    });
});