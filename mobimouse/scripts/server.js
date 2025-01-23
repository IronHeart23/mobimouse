const express = require('express');
const robot = require('robotjs');
const cors = require('cors');
const os = require('os');
const path = require('path');
const app = express();
const port = 3000;

// Get local IPs
function getLocalIPs() {
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
}

const localIPs = getLocalIPs();
console.log('Server IPs:', localIPs);

// Enhanced CORS and middleware
app.use(cors());
app.use(express.json());
app.use((req, res, next) => {
    console.log(`${new Date().toISOString()} - ${req.method} ${req.url}`);
    next();
});

// Basic endpoints
app.get('/ping', (req, res) => {
    res.send('Server is running');
});

app.post('/mouse/move', (req, res) => {
    const { x, y } = req.body;
    try {
        robot.moveMouse(x, y);
        res.send('Mouse moved!');
    } catch (error) {
        res.status(500).send('Failed to move mouse');
    }
});

app.post('/mouse/click', (req, res) => {
    const { button = 'left' } = req.body;
    try {
        robot.mouseClick(button);
        res.send(`Mouse ${button} click executed!`);
    } catch (error) {
        res.status(500).send('Failed to click mouse');
    }
});

app.get('/screen', (req, res) => {
    try {
        const screenSize = robot.getScreenSize();
        res.json(screenSize);
    } catch (error) {
        res.status(500).send('Failed to get screen size');
    }
});

app.get('/mouse/position', (req, res) => {
    try {
        const mousePos = robot.getMousePos();
        res.json(mousePos);
    } catch (error) {
        res.status(500).send('Failed to get mouse position');
    }
});

app.post('/mouse/hold', (req, res) => {
    const { button, action } = req.body;
    try {
        robot.mouseToggle(action, button);
        res.send(`Mouse ${button} ${action}`);
    } catch (error) {
        res.status(500).send('Failed to toggle mouse');
    }
});

app.listen(port, () => {
    console.log('\nServer running on:');
    localIPs.forEach(ip => {
        console.log(`  http://${ip}:${port}`);
    });
});