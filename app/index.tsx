//Snapshot 1w1jv1b
//1st Week 01 January Version 1.b

//To-do:
//1. Add 'Right click button' __ADDED__ 
//2. Need to add gesture for Left and Right click
//  Left click: Tap or Double Tap, Right click: __Semi-Complete__
//3. Automatically gets the user IP address forf connection
//4. 5-digit pin for connecting to a specific desktop

import React, { useState, useEffect, useRef } from 'react';
import { View, PanResponder, Button, StyleSheet } from 'react-native';
import axios from 'axios';

const App = () => {
    const [serverIp, setServerIp] = useState('IP_ADDRESS'); // Replace with your computer's IP
    const [screenSize, setScreenSize] = useState({ width: 0, height: 0 });
    const [mousePosition, setMousePosition] = useState({ x: 0, y: 0 }); // Tracks current mouse position

    useEffect(() => {
        // Fetch the desktop screen size and current mouse position when the app starts
        const fetchInitialData = async () => {
            try {
                const screenResponse = await axios.get(`http://${serverIp}:3000/screen`);
                setScreenSize(screenResponse.data);

                // Fetch the current mouse position after getting the screen size
                const mouseResponse = await axios.get(`http://${serverIp}:3000/mouse/position`);
                setMousePosition(mouseResponse.data); // Initialize with current mouse position
            } catch (error) {
                console.error('Error fetching initial data:', error);
            }
        };

        fetchInitialData();
    }, [serverIp]);

    const [isHolding, setIsHolding] = useState(false);
    const lastTapTime = useRef(0);
    const TAP_INTERVAL = 300; // ms between taps to count as double-tap
    
    const [isDragging, setIsDragging] = useState(false);
const lastMouseCheck = useRef(Date.now());
const IDLE_CHECK_INTERVAL = 2000; // Check mouse position after 2s idle

useEffect(() => {
    const checkMousePosition = async () => {
        if (Date.now() - lastMouseCheck.current > IDLE_CHECK_INTERVAL) {
            try {
                const mouseResponse = await axios.get(`http://${serverIp}:3000/mouse/position`);
                setMousePosition(mouseResponse.data);
                lastMouseCheck.current = Date.now();
            } catch (error) {
                console.error('Error fetching mouse position:', error);
            }
        }
    };

    const interval = setInterval(checkMousePosition, IDLE_CHECK_INTERVAL);
    return () => clearInterval(interval);
}, [serverIp]);

const panResponder = PanResponder.create({
    onStartShouldSetPanResponder: () => true,
    onMoveShouldSetPanResponder: () => true,
    
    onPanResponderGrant: () => {
        pressStartTime.current = Date.now();
        hasMoved.current = false;
        setIsDragging(true);
        axios.post(`http://${serverIp}:3000/mouse/hold`, { button: 'left', action: 'down' });
    },
    
    onPanResponderMove: (event, gesture) => {
        if (Math.abs(gesture.dx) > 5 || Math.abs(gesture.dy) > 5) {
            hasMoved.current = true;
        }
        
        const newX = Math.min(Math.max(0, mousePosition.x + (gesture.dx / 300) * screenSize.width), screenSize.width);
        const newY = Math.min(Math.max(0, mousePosition.y + (gesture.dy / 300) * screenSize.height), screenSize.height);
        setMousePosition({ x: newX, y: newY });
        lastMouseCheck.current = Date.now();
        axios.post(`http://${serverIp}:3000/mouse/move`, { x: newX, y: newY });
    },
    
    onPanResponderRelease: () => {
        const pressDuration = Date.now() - pressStartTime.current;
        
        if (isDragging && hasMoved.current) {
            setIsDragging(false);
            axios.post(`http://${serverIp}:3000/mouse/hold`, { button: 'left', action: 'up' });
        } else if (!hasMoved.current) {
            if (pressDuration < 500) {
                handleClick('left');
            } else {
                handleClick('right');
            }
        }
    },
});
    const pressStartTime = useRef(0);
    const hasMoved = useRef(false);

    const handleClick = (buttonType: 'left' | 'right') => {
        axios.post(`http://${serverIp}:3000/mouse/click`, { button: buttonType });
    };

    return (
        <View style={styles.container}>
            <View style={styles.touchpad} {...panResponder.panHandlers} />
            <View style={styles.buttonContainer}>
                <Button title="Left Click" onPress={() => handleClick('left')} />
                <Button title="Right Click" onPress={() => handleClick('right')} />
            </View>
        </View>
    );
};

const styles = StyleSheet.create({
    container: { flex: 1, justifyContent: 'center', alignItems: 'center' },
    touchpad: {
        width: 400,
        height: 700,
        backgroundColor: '#ddd',
        borderRadius: 10,
        marginBottom: 20,
    },
    buttonContainer: {
        flexDirection: 'row',
        gap: 10,
    }
});

export default App;