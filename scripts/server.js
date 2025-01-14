//Snapshot 2w1jv1d
//2nd Week 01 January Version 1.d

const express = require('express');
const robot = require('robotjs');
const cors = require('cors'); // To allow requests from your mobile app

const app = express();
const port = 3000;

app.use(cors());
app.use(express.json());

// Endpoint to move the mouse
app.post('/mouse/move', (req, res) => {
    const { x, y } = req.body;
    robot.moveMouse(x, y);
    res.send('Mouse moved!');
});

// Endpoint to simulate mouse click
app.post('/mouse/click', (req, res) => {
    const { button = 'left' } = req.body; // Default to left button
    robot.mouseClick(button);
    res.send(`Mouse ${button} click executed!`);
});

// Endpoint to get screen size (useful for scaling coordinates)
app.get('/screen', (req, res) => {
    const screenSize = robot.getScreenSize();
    res.json(screenSize);
});

app.listen(port, () => {
    console.log(`Server running at http://localhost:${port}`);
});

// Endpoint to get current mouse position
app.get('/mouse/position', (req, res) => {
    const mousePos = robot.getMousePos();
    res.json(mousePos);
});

const handleClick = (buttonType) => {
    axios.post(`http://${serverIp}:3000/mouse/click`, { button: buttonType });
};

app.post('/mouse/hold', (req, res) => {
    const { button, action } = req.body;
    if (action === 'down') {
        robot.mouseToggle('down', button);
    } else {
        robot.mouseToggle('up', button);
    }
    res.send(`Mouse ${button} ${action}`);
});

app.post('/scroll', (req, res) => {
    const { amount } = req.body;
    
    // Adjust scroll sensitivity
    const scrollAmount = Math.round(amount / 3); // Adjust divisor for sensitivity
    
    try {
        // Vertical scroll
        robot.scrollMouse(0, scrollAmount);
        res.send('Scrolled successfully');
    } catch (error) {
        console.error('Scroll error:', error);
        res.status(500).send('Scroll failed');
    }
});

// In your server.js
app.get('/discover', (req, res) => {
    res.json({
      name: require('os').hostname(),
      ip: require('ip').address(),
      // Add any other relevant device info
    });
  });