//Snapshot 2w1jv1d

// app/index.tsx
import React, { useState, useEffect } from 'react';
import { View, Text, Pressable, StyleSheet, ScrollView } from 'react-native';
import { Link } from 'expo-router';
import { MaterialIcons } from '@expo/vector-icons';
import axios from 'axios';

export default function Home() {
  const [availableDevices, setAvailableDevices] = useState([
    // For testing, remove or modify when implementing actual device scanning
    { id: '1', name: 'DESKTOP-OKA3Q8C', ip: '192.168.1.100' }
  ]);

  // Function to scan for devices running server.js
  const scanForDevices = async () => {
    try {
      // This is a placeholder for actual network scanning logic
      // You'll need to implement the actual device discovery mechanism
      // For example, broadcasting UDP packets or using mDNS
      
      // Placeholder for demonstration
      const testDevice = {
        id: '1',
        name: 'DESKTOP-OKA3Q8C',
        ip: '192.168.1.100'
      };
      
      setAvailableDevices([testDevice]);
    } catch (error) {
      console.error('Error scanning for devices:', error);
    }
  };

  useEffect(() => {
    scanForDevices();
  }, []);

  return (
    <View style={styles.container}>
      <Text style={styles.title}>MobiMouse Connect</Text>
      
      <Text style={styles.descriptionText}>
        Other devices running MobiMouse server in your same network should appear here.
      </Text>

      <Text style={styles.sectionTitle}>Available devices</Text>

      <ScrollView style={styles.deviceList}>
        {availableDevices.map((device) => (
          <Link key={device.id} href="/touchpad" asChild>
            <Pressable style={styles.deviceItem}>
              <MaterialIcons name="computer" size={24} color="#fff" style={styles.deviceIcon} />
              <Text style={styles.deviceName}>{device.name}</Text>
            </Pressable>
          </Link>
        ))}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#1a1a1a',
    padding: 20,
  },
  title: {
    fontSize: 34,
    fontWeight: 'bold',
    color: '#ffffff',
    marginBottom: 20,
  },
  descriptionText: {
    fontSize: 16,
    color: '#cccccc',
    marginBottom: 40,
    lineHeight: 24,
  },
  sectionTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#ffffff',
    marginBottom: 15,
  },
  deviceList: {
    flex: 1,
  },
  deviceItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    backgroundColor: '#2a2a2a',
    borderRadius: 8,
    marginBottom: 10,
  },
  deviceIcon: {
    marginRight: 15,
  },
  deviceName: {
    fontSize: 18,
    color: '#ffffff',
  },
});