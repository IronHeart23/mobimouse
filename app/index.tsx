import React, { useState } from 'react';
import { View, PanResponder, Button, StyleSheet } from 'react-native';
import axios from 'axios';

const App = () => {
    const [serverIp, setServerIp] = useState('COMPUTER_IP'); // Replace with your computer's IP
    const [screenSize, setScreenSize] = useState({ width: 0, height: 0 });
    const [mousePosition, setMousePosition] = useState({ x: 0, y: 0 }); // Tracks initial mouse position

    React.useEffect(() => {
        // Fetch the desktop screen size when the app starts
        axios.get(`http://${serverIp}:3000/screen`).then((response) => {
            setScreenSize(response.data);
        });
    }, [serverIp]);

    const panResponder = PanResponder.create({
        onMoveShouldSetPanResponder: () => true,
        onPanResponderGrant: () => {
            // Fetch the current mouse position on the desktop when a gesture starts
            axios.get(`http://${serverIp}:3000/mouse/position`).then((response) => {
                setMousePosition(response.data); // Store the initial position
            });
        },
        onPanResponderMove: (event, gesture) => {
            // Calculate the new mouse position based on the initial position and gesture displacement
            const newX = Math.min(
                Math.max(0, mousePosition.x + (gesture.dx / 300) * screenSize.width),
                screenSize.width
            );
            const newY = Math.min(
                Math.max(0, mousePosition.y + (gesture.dy / 300) * screenSize.height),
                screenSize.height
            );

            // Send the new mouse position to the desktop server
            axios.post(`http://${serverIp}:3000/mouse/move`, { x: newX, y: newY });
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
