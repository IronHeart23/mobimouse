//Snapshot 1wv1a

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
