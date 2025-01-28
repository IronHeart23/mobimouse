//index.tsx
import React, { useState } from 'react';
import { View, Text, StyleSheet, ScrollView, ActivityIndicator, Pressable } from 'react-native';
import { Link } from 'expo-router';
import { MaterialIcons, Entypo } from '@expo/vector-icons';
import useDeviceScanning from './hooks/useDeviceScanning';

export default function Home() {
  const { availableDevices, isScanning, error, scanNetwork } = useDeviceScanning();
  const [menuVisible, setMenuVisible] = useState(false);

  const Menu = () => (
    <Pressable 
      style={styles.menuOverlay} 
      onPress={() => setMenuVisible(false)}
    >
      <View style={styles.menu}>
        <Pressable 
          style={styles.menuItem}
          onPress={() => {
            scanNetwork();
            setMenuVisible(false);
          }}
        >
          <MaterialIcons name="refresh" size={24} color="#ffffff" />
          <Text style={styles.menuItemText}>Refresh</Text>
        </Pressable>
      </View>
    </Pressable>
  );

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.title}>MobiMouse Connect</Text>
        <Pressable onPress={() => setMenuVisible(true)}>
          <Entypo name="dots-three-vertical" size={24} color="#ffffff" />
        </Pressable>
      </View>

      {/* Network Status Message */}
      {error?.includes('WiFi') ? (
        <View style={styles.networkStatus}>
          <MaterialIcons name="wifi-off" size={24} color="#cccccc" />
          <Text style={styles.networkStatusText}>
            You're not connected to Wi-Fi network
          </Text>
        </View>
      ) : (
        <Text style={styles.descriptionText}>
          Other devices running MobiMouse server in your same network will appear here.
        </Text>
      )}

      {/* Device List */}
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

      {/* Menu Overlay */}
      {menuVisible && <Menu />}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#1a1a1a',
    padding: 20,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
  },
  title: {
    fontSize: 34,
    fontWeight: 'bold',
    color: '#ffffff',
  },
  networkStatus: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 40,
  },
  networkStatusText: {
    fontSize: 16,
    color: '#cccccc',
    marginLeft: 10,
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
  deviceIp: {
    fontSize: 14,
    color: '#999999',
  },
  noDevicesText: {
    color: '#999999',
    fontSize: 16,
    textAlign: 'center',
    marginTop: 20,
  },
  menuOverlay: {
    position: 'absolute',
    top: 0,
    right: 0,
    bottom: 0,
    left: 0,
    backgroundColor: 'rgba(0,0,0,0.5)',
  },
  menu: {
    position: 'absolute',
    top: 60,
    right: 20,
    backgroundColor: '#2a2a2a',
    borderRadius: 8,
    padding: 8,
    minWidth: 150,
  },
  menuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
  },
  menuItemText: {
    color: '#ffffff',
    fontSize: 16,
    marginLeft: 12,
  },
});