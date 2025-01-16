//index.tsx
import React from 'react';
import { View, Text, Pressable, StyleSheet, ScrollView, ActivityIndicator } from 'react-native';
import { Link } from 'expo-router';
import { MaterialIcons } from '@expo/vector-icons';
import useDeviceScanning from './hooks/useDeviceScanning';

export default function Home() {
  const { availableDevices, isScanning, error, scanNetwork } = useDeviceScanning();

  return (
    <View style={styles.container}>
      <Text style={styles.title}>MobiMouse Connect</Text>
      
      <Text style={styles.descriptionText}>
        Other devices running MobiMouse server in your same network will appear here.
      </Text>

      <Pressable 
        style={styles.scanButton}
        onPress={scanNetwork}
        disabled={isScanning}
      >
        <Text style={styles.scanButtonText}>
          {isScanning ? 'Scanning...' : 'Scan for Devices'}
        </Text>
      </Pressable>

      {error && (
        <Text style={styles.errorText}>{error}</Text>
      )}

      <Text style={styles.sectionTitle}>Available devices</Text>

      <ScrollView style={styles.deviceList}>
        {isScanning ? (
          <ActivityIndicator size="large" color="#4CAF50" />
        ) : availableDevices.length > 0 ? (
          availableDevices.map((device) => (
            <Link 
              key={device.id}
              href={{
                pathname: "/touchpad",
                params: { serverIp: device.ip }
              }}
              asChild
            >
              <Pressable style={styles.deviceItem}>
                <MaterialIcons name="computer" size={24} color="#fff" style={styles.deviceIcon} />
                <View>
                  <Text style={styles.deviceName}>{device.name}</Text>
                  <Text style={styles.deviceIp}>{device.ip}</Text>
                </View>
              </Pressable>
            </Link>
          ))
        ) : (
          <Text style={styles.noDevicesText}>No devices found</Text>
        )}
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
  scanButton: {
    backgroundColor: '#4CAF50',
    padding: 12,
    borderRadius: 8,
    marginBottom: 20,
  },
  scanButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
    textAlign: 'center',
  },
  errorText: {
    color: '#ff4444',
    fontSize: 14,
    marginBottom: 20,
  },
  deviceIp: {
    fontSize: 14,
    color: '#999999',
  },
  noDevicesText: {
    color: '#999999',
    fontSize: 16,
    textAlign: 'center',
    marginTop: 20,
  }
});