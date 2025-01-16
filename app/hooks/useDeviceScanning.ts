//useDeviceScanning.ts
import { useState, useEffect, useRef } from 'react';
import NetInfo from '@react-native-community/netinfo';
import axios from 'axios';

interface Device {
  id: string;
  name: string;
  ip: string;
  port: number;
}

const useDeviceScanning = () => {
  const [availableDevices, setAvailableDevices] = useState<Device[]>([]);
  const [isScanning, setIsScanning] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const wsConnections = useRef<Map<string, WebSocket>>(new Map());
  const devicesMap = useRef<Map<string, Device>>(new Map());

  const testConnection = async (ip: string): Promise<boolean> => {
    try {
      // First try HTTP connection to verify server is running
      const response = await axios.get(`http://${ip}:3000/ping`, { timeout: 1000 });
      return response.data === 'Server is running';
    } catch {
      return false;
    }
  };

  const connectToWebSocket = (ip: string) => {
    // Only create a new connection if one doesn't exist
    if (wsConnections.current.has(ip)) return;

    try {
      const ws = new WebSocket(`ws://${ip}:3001`);
      wsConnections.current.set(ip, ws);

      ws.onopen = () => {
        console.log(`WebSocket connected to ${ip}`);
      };

      ws.onmessage = (event) => {
        try {
          const device = JSON.parse(event.data);
          const deviceId = `${device.ip}:${device.port}`;

          if (!devicesMap.current.has(deviceId)) {
            devicesMap.current.set(deviceId, {
              id: deviceId,
              name: device.name,
              ip: device.ip,
              port: device.port
            });
            setAvailableDevices(Array.from(devicesMap.current.values()));
          }
        } catch (e) {
          console.error('Error parsing device data:', e);
        }
      };

      ws.onerror = () => {
        ws.close();
        wsConnections.current.delete(ip);
      };

      ws.onclose = () => {
        wsConnections.current.delete(ip);
      };
    } catch (e) {
      console.log(`Failed to connect to ${ip}`);
    }
  };

  const scanNetwork = async () => {
    setIsScanning(true);
    setError(null);
    devicesMap.current.clear();
    setAvailableDevices([]);

    try {
      const netInfo = await NetInfo.fetch();
      if (netInfo.type !== 'wifi') {
        throw new Error('Please connect to a WiFi network');
      }

      // Close existing connections
      wsConnections.current.forEach(ws => ws.close());
      wsConnections.current.clear();

      // Get the subnet from WiFi details
      const subnet = netInfo.details?.ipAddress?.split('.').slice(0, 3).join('.') || '192.168.1';
      
      // Test specific IP if known
      const knownIP = '192.168.1.107';
      if (await testConnection(knownIP)) {
        connectToWebSocket(knownIP);
      }

      // Scan subnet
      for (let i = 1; i <= 10; i++) {
        const ip = `${subnet}.${i}`;
        if (await testConnection(ip)) {
          connectToWebSocket(ip);
        }
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to scan for devices');
    } finally {
      // Stop scanning after 5 seconds
      setTimeout(() => {
        setIsScanning(false);
      }, 5000);
    }
  };

  useEffect(() => {
    scanNetwork();
    return () => {
      wsConnections.current.forEach(ws => ws.close());
    };
  }, []);

  return {
    availableDevices,
    isScanning,
    error,
    scanNetwork
  };
};

export default useDeviceScanning;