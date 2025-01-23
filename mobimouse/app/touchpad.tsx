//touchpad.tsx
import { useRouter, useLocalSearchParams } from 'expo-router';
import React, { useState, useEffect, useRef } from 'react';
import { View, PanResponder, Button, StyleSheet } from 'react-native';
import axios from 'axios';

const Touchpad = () => {
    const router = useRouter();
    const { serverIp } = useLocalSearchParams<{ serverIp: string }>();
    const [screenSize, setScreenSize] = useState({ width: 0, height: 0 });
    const [mousePosition, setMousePosition] = useState({ x: 0, y: 0 });

    // Refs for gesture handling
    const lastTapTime = useRef(0);
    const lastClickTime = useRef(0);
    const pressStartTime = useRef(0);
    const hasMoved = useRef(false);
    const dragStartPos = useRef({ x: 0, y: 0 });
    const isDragging = useRef(false);

    // Constants
    const DOUBLE_TAP_DELAY = 300;
    const HOLD_DURATION = 500;
    const MOVEMENT_THRESHOLD = 5;

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

    const handleMouseClick = async (button: 'left' | 'right') => {
        try {
            await axios.post(`http://${serverIp}:3000/mouse/click`, { button });
        } catch (error) {
            console.error('Click error:', error);
        }
    };

    const handleMouseDown = async (button: 'left' | 'right') => {
        try {
            await axios.post(`http://${serverIp}:3000/mouse/hold`, { button, action: 'down' });
        } catch (error) {
            console.error('Mouse down error:', error);
        }
    };

    const handleMouseUp = async (button: 'left' | 'right') => {
        try {
            await axios.post(`http://${serverIp}:3000/mouse/hold`, { button, action: 'up' });
        } catch (error) {
            console.error('Mouse up error:', error);
        }
    };

    const panResponder = PanResponder.create({
        onStartShouldSetPanResponder: () => true,
        onMoveShouldSetPanResponder: () => true,

        onPanResponderGrant: async (evt) => {
            const currentTime = Date.now();
            pressStartTime.current = currentTime;
            hasMoved.current = false;
            
            // Store initial position for potential drag
            dragStartPos.current = { ...mousePosition };

            // Handle double tap
            if (currentTime - lastTapTime.current < DOUBLE_TAP_DELAY) {
                isDragging.current = true;
                await handleMouseDown('left');
            }
            
            lastTapTime.current = currentTime;
        },

        onPanResponderMove: async (evt, gestureState) => {
            // Check if movement exceeds threshold
            if (Math.abs(gestureState.dx) > MOVEMENT_THRESHOLD || 
                Math.abs(gestureState.dy) > MOVEMENT_THRESHOLD) {
                hasMoved.current = true;
            }

            // Calculate new mouse position
            const sensitivity = 1.5; // Adjust this value to change mouse movement speed
            const newX = Math.min(Math.max(0, 
                mousePosition.x + (gestureState.dx * sensitivity)), screenSize.width);
            const newY = Math.min(Math.max(0, 
                mousePosition.y + (gestureState.dy * sensitivity)), screenSize.height);

            setMousePosition({ x: newX, y: newY });
            
            try {
                await axios.post(`http://${serverIp}:3000/mouse/move`, { x: newX, y: newY });
            } catch (error) {
                console.error('Move error:', error);
            }
        },

        onPanResponderRelease: async (evt) => {
            const pressDuration = Date.now() - pressStartTime.current;

            // Handle drag end
            if (isDragging.current) {
                await handleMouseUp('left');
                isDragging.current = false;
                return;
            }

            // Handle tap/click
            if (!hasMoved.current) {
                if (pressDuration < HOLD_DURATION) {
                    // Single tap
                    await handleMouseClick('left');
                } else {
                    // Long press - right click
                    await handleMouseClick('right');
                }
            }
        },

        onPanResponderTerminate: async () => {
            // Clean up any held mouse buttons if gesture is interrupted
            if (isDragging.current) {
                await handleMouseUp('left');
                isDragging.current = false;
            }
        },
    });

    return (
        <View style={styles.container}>
            <View style={styles.touchpad} {...panResponder.panHandlers} />
            <View style={styles.buttonContainer}>
                <Button title="Left Click" onPress={() => handleMouseClick('left')} />
                <Button title="Right Click" onPress={() => handleMouseClick('right')} />
            </View>
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        backgroundColor: '#f5f5f5',
    },
    touchpad: {
        width: 300,
        height: 400,
        backgroundColor: '#ddd',
        borderRadius: 10,
        marginBottom: 20,
        shadowColor: '#000',
        shadowOffset: {
            width: 0,
            height: 2,
        },
        shadowOpacity: 0.25,
        shadowRadius: 3.84,
        elevation: 5,
    },
    buttonContainer: {
        flexDirection: 'row',
        gap: 20,
    },
});

export default Touchpad;