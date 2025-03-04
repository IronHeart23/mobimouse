import React, { useState } from 'react';
import { View, Text, StyleSheet, ScrollView, ActivityIndicator, Pressable, TextInput } from 'react-native';
import { Link } from 'expo-router';
import { MaterialIcons, Entypo, Ionicons } from '@expo/vector-icons';
import useDeviceScanning from './hooks/useDeviceScanning';

export default function Home() {
  const { availableDevices, isScanning, error, scanNetwork, networkType } = useDeviceScanning();
  const [menuVisible, setMenuVisible] = useState(false);
  const [manualConnectVisible, setManualConnectVisible] = useState(false);
  const [manualIP, setManualIP] = useState('');

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
        
        <Pressable 
          style={styles.menuItem}
          onPress={() => {
            setManualConnectVisible(true);
            setMenuVisible(false);
          }}
        >
          <MaterialIcons name="add" size={24} color="#ffffff" />
          <Text style={styles.menuItemText}>Manual Connect</Text>
        </Pressable>
      </View>
    </Pressable>
  );

  const ManualConnectModal = () => (
    <Pressable 
      style={styles.modalOverlay}
      onPress={() => setManualConnectVisible(false)}
    >
      <Pressable 
        style={styles.modalContent} 
        onPress={(e) => e.stopPropagation()} // This prevents the overlay's onPress from firing
      >
        <Text style={styles.modalTitle}>Connect to IP Address</Text>
        <TextInput
          style={styles.ipInput}
          placeholder="192.168.1.x"
          placeholderTextColor="#999999"
          value={manualIP}
          onChangeText={setManualIP}
          keyboardType="numeric"
          autoCapitalize="none"
        />
        <View style={styles.modalButtons}>
          <Pressable
            style={[styles.modalButton, styles.cancelButton]}
            onPress={() => setManualConnectVisible(false)}
          >
            <Text style={styles.modalButtonText}>Cancel</Text>
          </Pressable>
          <Link
            href={{
              pathname: "/touchpad",
              params: { serverIp: manualIP }
            }}
            asChild
          >
            <Pressable
              style={[styles.modalButton, styles.connectButton]}
              onPress={() => setManualConnectVisible(false)}
            >
              <Text style={styles.modalButtonText}>Connect</Text>
            </Pressable>
          </Link>
        </View>
      </Pressable>
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
      <View style={styles.networkStatus}>
        {networkType === 'wifi' ? (
          <View style={styles.networkStatusItem}>
            <MaterialIcons name="wifi" size={24} color="#4CAF50" />
            <Text style={styles.networkStatusText}>
              Connected to WiFi
            </Text>
          </View>
        ) : networkType === 'cellular' ? (
          <View style={styles.networkStatusItem}>
            <MaterialIcons name="signal-cellular-4-bar" size={24} color="#4CAF50" />
            <Text style={styles.networkStatusText}>
              Using mobile data
            </Text>
          </View>
        ) : (
          <View style={styles.networkStatusItem}>
            <MaterialIcons name="wifi-off" size={24} color="#cccccc" />
            <Text style={styles.networkStatusText}>
              Not connected to any network
            </Text>
          </View>
        )}
      </View>

      <Text style={styles.descriptionText}>
        {networkType === 'wifi' 
          ? "Other devices running MobiMouse server in your same network will appear here."
          : "Connect directly to your computer by entering its IP address or try scanning for available devices."}
      </Text>

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
          <View>
            <Text style={styles.noDevicesText}>No devices found</Text>
            <Pressable 
              style={styles.manualConnectButton}
              onPress={() => setManualConnectVisible(true)}
            >
              <MaterialIcons name="add" size={20} color="#fff" />
              <Text style={styles.manualConnectText}>Connect manually</Text>
            </Pressable>
          </View>
        )}
      </ScrollView>

      {/* Menu Overlay */}
      {menuVisible && <Menu />}
      
      {/* Manual Connect Modal */}
      {manualConnectVisible && <ManualConnectModal />}
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
    marginBottom: 20,
  },
  networkStatusItem: {
    flexDirection: 'row',
    alignItems: 'center',
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
    marginBottom: 20,
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
  manualConnectButton: {
    flexDirection: 'row',
    backgroundColor: '#2a2a2a',
    borderRadius: 8,
    padding: 16,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 20,
  },
  manualConnectText: {
    color: '#ffffff',
    fontSize: 16,
    marginLeft: 10,
  },
  modalOverlay: {
    position: 'absolute',
    top: 0,
    right: 0,
    bottom: 0,
    left: 0,
    backgroundColor: 'rgba(0,0,0,0.7)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContent: {
    backgroundColor: '#2a2a2a',
    borderRadius: 12,
    padding: 24,
    width: '80%',
    maxWidth: 400,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#ffffff',
    marginBottom: 16,
    textAlign: 'center',
  },
  ipInput: {
    backgroundColor: '#3a3a3a',
    color: '#ffffff',
    padding: 12,
    borderRadius: 8,
    marginBottom: 20,
    fontSize: 16,
  },
  modalButtons: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  modalButton: {
    flex: 1,
    padding: 12,
    borderRadius: 8,
    alignItems: 'center',
  },
  cancelButton: {
    backgroundColor: '#444444',
    marginRight: 8,
  },
  connectButton: {
    backgroundColor: '#4CAF50',
    marginLeft: 8,
  },
  modalButtonText: {
    color: '#ffffff',
    fontWeight: 'bold',
    fontSize: 16,
  },
});