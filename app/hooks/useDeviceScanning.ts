import { useState, useEffect } from 'react';
import NetInfo from '@react-native-community/netinfo';
import * as Network from 'expo-network';
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

  const scanNetwork = async () => {
    setIsScanning(true);
    setError(null);
    setAvailableDevices([]);

    try {
      const netInfo = await NetInfo.fetch();
      if (netInfo.type !== 'wifi') {
        throw new Error('Please connect to a WiFi network');
      }

      const ipAddress = await Network.getIpAddressAsync();
      const subnet = ipAddress.substring(0, ipAddress.lastIndexOf('.'));
      
      // Scan common ports on all IPs in subnet
      const scanPromises = [];
      for (let i = 1; i < 255; i++) {
        const testIP = `${subnet}.${i}`;
        scanPromises.push(
          axios.get(`http://${testIP}:3000/ping`, { timeout: 1000 })
            .then(() => ({
              id: `${testIP}:3000`,
              name: `Device at ${testIP}`,
              ip: testIP,
              port: 3000
            }))
            .catch(() => null)
        );
      }

      const results = await Promise.all(scanPromises);
      const devices = results.filter((device): device is Device => device !== null);
      setAvailableDevices(devices);

    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to scan network');
    } finally {
      setIsScanning(false);
    }
  };

  useEffect(() => {
    scanNetwork();
  }, []);

  return {
    availableDevices,
    isScanning,
    error,
    scanNetwork
  };
};

export default useDeviceScanning;