import React, { useState, useEffect } from 'react';
import { View, PanResponder, Button, StyleSheet } from 'react-native';
import axios from 'axios';

const App = () => {
    const [serverIp, setServerIp] = useState('192.168.1.107'); // Replace with your computer's IP
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

    const panResponder = PanResponder.create({
        onMoveShouldSetPanResponder: () => true,
        onPanResponderGrant: () => {
            // No need to fetch the mouse position here anymore
        },
        onPanResponderMove: (event, gesture) => {
            // Calculate the new mouse position based on the last known position and gesture displacement
            const newX = Math.min(
                Math.max(0, mousePosition.x + (gesture.dx / 300) * screenSize.width),
                screenSize.width
            );
            const newY = Math.min(
                Math.max(0, mousePosition.y + (gesture.dy / 300) * screenSize.height),
                screenSize.height
            );

            // Update the mouse position state
            setMousePosition({ x: newX, y: newY });

            // Send the new mouse position to the desktop server
            axios.post(`http://${serverIp}:3000/mouse/move`, { x: newX, y: newY });
        },
        onPanResponderRelease: () => {
            // Optionally, you can update the mouse position here if needed
        },
    });

    const handleClick = () => {
        // Send a left-click command to the desktop server
        axios.post(`http://${serverIp}:3000/mouse/click`, { button: 'left' });
    };

    return (
        <View style={styles.container}>
            <View style={styles.touchpad} {...panResponder.panHandlers} />
            <Button title="Click" onPress={handleClick} />
        </View>
    );
};

const styles = StyleSheet.create({
    container: { flex: 1, justifyContent: 'center', alignItems: 'center' },
    touchpad: {
        width: 300,
        height: 300,
        backgroundColor: '#ddd',
        borderRadius: 10,
        marginBottom: 20,
    },
});

export default App;