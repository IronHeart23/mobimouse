//server.js
const express = require('express');
const robot = require('robotjs');
const cors = require('cors');
const WebSocket = require('ws');
const os = require('os');
const app = express();
const port = 3000;
const wsPort = 3001;

// Enhanced IP detection
function getLocalIP() {
    const interfaces = os.networkInterfaces();
    const addresses = [];
    
    console.log('Available network interfaces:');
    for (const name of Object.keys(interfaces)) {
        console.log(`\nInterface: ${name}`);
        for (const interface of interfaces[name]) {
            if (interface.family === 'IPv4') {
                console.log(`  Address: ${interface.address}`);
                console.log(`  Internal: ${interface.internal}`);
                if (!interface.internal) {
                    addresses.push(interface.address);
                }
            }
        }
    }
    
    console.log('\nPotential server IPs:', addresses);
    return addresses[0] || '127.0.0.1';
}

const ip = getLocalIP();
console.log('\nSelected server IP:', ip);
console.log('Server hostname:', os.hostname());

// Create WebSocket server with error handling
const wss = new WebSocket.Server({ port: wsPort }, () => {
    console.log(`WebSocket server is running on port ${wsPort}`);
});

wss.on('error', (error) => {
    console.error('WebSocket server error:', error);
});

// Handle WebSocket connections with detailed logging
wss.on('connection', (ws, req) => {
    console.log(`New client connected from ${req.socket.remoteAddress}`);
    
    // Send server info immediately upon connection
    const serverInfo = JSON.stringify({
        name: os.hostname(),
        ip: ip,
        port: port
    });
    
    console.log('Sending server info:', serverInfo);
    ws.send(serverInfo);
    
    ws.on('message', (message) => {
        console.log('Received message:', message.toString());
    });
    
    ws.on('error', (error) => {
        console.error('WebSocket client error:', error);
    });
    
    ws.on('close', () => {
        console.log('Client disconnected');
    });
});

// Enhanced CORS configuration
app.use(cors({
    origin: '*',
    methods: ['GET', 'POST'],
    allowedHeaders: ['Content-Type']
}));

app.use(express.json());

// Add request logging middleware
app.use((req, res, next) => {
    console.log(`${new Date().toISOString()} - ${req.method} ${req.url}`);
    next();
});

// Test endpoint to verify server is running
app.get('/ping', (req, res) => {
    res.send('Server is running');
});

// Original endpoints with added logging
app.post('/mouse/move', (req, res) => {
    const { x, y } = req.body;
    console.log(`Moving mouse to x: ${x}, y: ${y}`);
    try {
        robot.moveMouse(x, y);
        res.send('Mouse moved!');
    } catch (error) {
        console.error('Error moving mouse:', error);
        res.status(500).send('Failed to move mouse');
    }
});

app.post('/mouse/click', (req, res) => {
    const { button = 'left' } = req.body;
    console.log(`Mouse click: ${button}`);
    try {
        robot.mouseClick(button);
        res.send(`Mouse ${button} click executed!`);
    } catch (error) {
        console.error('Error clicking mouse:', error);
        res.status(500).send('Failed to click mouse');
    }
});

app.get('/screen', (req, res) => {
    try {
        const screenSize = robot.getScreenSize();
        console.log('Screen size:', screenSize);
        res.json(screenSize);
    } catch (error) {
        console.error('Error getting screen size:', error);
        res.status(500).send('Failed to get screen size');
    }
});

app.get('/mouse/position', (req, res) => {
    try {
        const mousePos = robot.getMousePos();
        console.log('Mouse position:', mousePos);
        res.json(mousePos);
    } catch (error) {
        console.error('Error getting mouse position:', error);
        res.status(500).send('Failed to get mouse position');
    }
});

app.post('/mouse/hold', (req, res) => {
    const { button, action } = req.body;
    console.log(`Mouse ${button} ${action}`);
    try {
        robot.mouseToggle(action, button);
        res.send(`Mouse ${button} ${action}`);
    } catch (error) {
        console.error('Error toggling mouse:', error);
        res.status(500).send('Failed to toggle mouse');
    }
});

const server = app.listen(port, () => {
    console.log(`\nHTTP server running at http://localhost:${port}`);
    console.log(`Try accessing: http://${ip}:${port}/ping`);
});

server.on('error', (error) => {
    console.error('HTTP server error:', error);
});