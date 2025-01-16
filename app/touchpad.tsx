//Snapshot 2w1jv1d
//2nd Week 01 January Version 1.d

//To-do:
//1. Add 'Right click button' __ADDED__ 
//2. Need to add gesture for Left and Right click
//  Left click: Tap or Double Tap, Right click: __Complete__
//3. Two finger swipe for scrolling
//3. Automatically gets the user IP address forf connection
//4. 5-digit pin for connecting to a specific desktop

//touchpad.tsx
import { useRouter, useLocalSearchParams } from 'expo-router';  // Instead of using navigation prop
import React, { useState, useEffect, useRef } from 'react';

import { View, PanResponder, Button, StyleSheet } from 'react-native';
import axios from 'axios';

const App = () => {
    const router = useRouter(); // Use the router hook
    //const [serverIp, setServerIp] = useState('192.168.1.107'); // Replace with your computer's IP
    const { serverIp } = useLocalSearchParams<{ serverIp: string }>();
    const [screenSize, setScreenSize] = useState({ width: 0, height: 0 });
    const [mousePosition, setMousePosition] = useState({ x: 0, y: 0 }); // Tracks current mouse position

    useEffect(() => {
        const fetchInitialData = async () => {
            try {
                const screenResponse = await axios.get(`http://${serverIp}:3000/screen`);
                setScreenSize(screenResponse.data);

                const mouseResponse = await axios.get(`http://${serverIp}:3000/mouse/position`);
                setMousePosition(mouseResponse.data);
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

// Add this state for tracking touches
const [touchCount, setTouchCount] = useState(0);

const [lastClickTime, setLastClickTime] = useState(0);
const CLICK_DELAY = 200; // Delay to check for potential double tap

const [isLeftClickHeld, setIsLeftClickHeld] = useState(false);

const MOVEMENT_THRESHOLD = 1; // Increased threshold for movement detection

const panResponder = PanResponder.create({
    onStartShouldSetPanResponder: () => true,
    onMoveShouldSetPanResponder: () => true,
    
    onPanResponderGrant: (evt) => {
        const touches = evt.nativeEvent.touches.length;
        setTouchCount(touches);
        
        const currentTime = Date.now();
        pressStartTime.current = currentTime;
        hasMoved.current = false;
        
        if (touches === 2) {
            setIsLeftClickHeld(true);
            axios.post(`http://${serverIp}:3000/mouse/hold`, { button: 'left', action: 'down' });
        } else if (touches === 1) {
            if (currentTime - lastTapTime.current < TAP_INTERVAL) {
                setLastClickTime(0);
                axios.post(`http://${serverIp}:3000/mouse/hold`, { button: 'left', action: 'down' });
                setIsDragging(true);
            }
            lastTapTime.current = currentTime;
        }
    },
    
    onPanResponderMove: (event, gesture) => {
        const touches = event.nativeEvent.touches.length;
        
        // Increase threshold for movement detection
        if (Math.abs(gesture.dx) > MOVEMENT_THRESHOLD || Math.abs(gesture.dy) > MOVEMENT_THRESHOLD) {
            hasMoved.current = true;
        }
        
        const newX = Math.min(Math.max(0, mousePosition.x + (gesture.dx / 300) * screenSize.width), screenSize.width);
        const newY = Math.min(Math.max(0, mousePosition.y + (gesture.dy / 300) * screenSize.height), screenSize.height);
        setMousePosition({ x: newX, y: newY });
        axios.post(`http://${serverIp}:3000/mouse/move`, { x: newX, y: newY });
    },
    
    onPanResponderRelease: () => {
        const pressDuration = Date.now() - pressStartTime.current;
        const currentTime = Date.now();
        
        if (isLeftClickHeld) {
            setIsLeftClickHeld(false);
            axios.post(`http://${serverIp}:3000/mouse/hold`, { button: 'left', action: 'up' });
        }
        
        // Only trigger clicks if there was minimal movement
        if (touchCount === 1) {
            if (isDragging) {
                axios.post(`http://${serverIp}:3000/mouse/hold`, { button: 'left', action: 'up' });
                setIsDragging(false);
            } else if (!hasMoved.current) {  // This check is now more strict due to higher threshold
                if (pressDuration < 500) {
                    setLastClickTime(currentTime);
                    setTimeout(() => {
                        if (Date.now() - lastClickTime >= TAP_INTERVAL) {
                            handleClick('left');
                        }
                    }, CLICK_DELAY);
                } else {
                    handleClick('right');
                }
            }
        }
        
        setTouchCount(0);
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