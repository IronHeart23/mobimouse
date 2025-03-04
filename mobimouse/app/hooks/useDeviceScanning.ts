import { useState, useEffect } from "react";
import NetInfo from "@react-native-community/netinfo";
import * as Network from "expo-network";
import axios from "axios";

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
  const [networkType, setNetworkType] = useState<string | null>(null);

  // Configure axios for HTTP connections
  const axiosInstance = axios.create({
    timeout: 1000,
    headers: {
      Accept: "application/json",
      "Content-Type": "application/json",
    },
  });

  // Try to connect to a direct IP if provided
  const tryDirectConnect = async (ipAddress: string) => {
    try {
      const response = await axiosInstance.get(`http://${ipAddress}:3000/ping`);
      if (response.data && response.data.status === "ok") {
        return {
          id: `${ipAddress}:3000`,
          name: response.data.name || `Device at ${ipAddress}`,
          ip: ipAddress,
          port: 3000,
        };
      }
    } catch (error) {
      console.log(`Failed to connect directly to: ${ipAddress}`);
    }
    return null;
  };

  // Scan a subnet for available devices
  const scanSubnet = async (subnet: string) => {
    const scanPromises = [];
    
    for (let i = 1; i < 255; i++) {
      const testIP = `${subnet}.${i}`;
      scanPromises.push(
        axiosInstance
          .get(`http://${testIP}:3000/ping`)
          .then((response) => {
            if (response.data && response.data.status === "ok") {
              return {
                id: `${testIP}:3000`,
                name: response.data.name || `Device at ${testIP}`,
                ip: testIP,
                port: 3000,
              };
            }
            return null;
          })
          .catch(() => null)
      );
    }

    const results = await Promise.all(scanPromises);
    return results.filter((device): device is Device => device !== null);
  };

  // Common hotspot IP patterns
  const commonHotspotIPs = [
    "192.168.43.1", // Common Android hotspot gateway
    "172.20.10.1",  // Common iOS hotspot gateway
  ];

  const scanNetwork = async () => {
    setIsScanning(true);
    setError(null);
    setAvailableDevices([]);

    try {
      const netInfo = await NetInfo.fetch();
      setNetworkType(netInfo.type);
      
      // Get IP address regardless of connection type
      const ipAddress = await Network.getIpAddressAsync();
      console.log("Current IP Address:", ipAddress);
      
      if (!ipAddress) {
        throw new Error("Could not determine IP address");
      }

      let devices: Device[] = [];

      // Handle WiFi connections
      if (netInfo.type === "wifi") {
        const subnet = ipAddress.substring(0, ipAddress.lastIndexOf("."));
        console.log("Scanning WiFi subnet:", subnet);
        devices = await scanSubnet(subnet);
      } 
      // Handle cellular or other connections (might be hotspot)
      else {
        // Try common hotspot gateway addresses
        console.log("Not on WiFi, trying common hotspot addresses...");
        for (const hotspotIP of commonHotspotIPs) {
          const device = await tryDirectConnect(hotspotIP);
          if (device) {
            devices.push(device);
          }
        }

        // If we're on mobile data but have an IP, try to scan that subnet too
        if (ipAddress && ipAddress.includes(".")) {
          const subnet = ipAddress.substring(0, ipAddress.lastIndexOf("."));
          console.log("Trying to scan current subnet:", subnet);
          const moreDevices = await scanSubnet(subnet);
          devices = [...devices, ...moreDevices];
        }
        
        // Try to connect to localhost and common IP addresses
        const localDevice = await tryDirectConnect("127.0.0.1");
        if (localDevice) {
          devices.push(localDevice);
        }
      }

      setAvailableDevices(devices);
      
      if (devices.length === 0) {
        setError("No devices found. Check if server is running.");
      }
    } catch (err) {
      console.error("Detailed scan error:", err);
      setError(
        err instanceof Error 
          ? err.message 
          : "Failed to scan network"
      );
    } finally {
      setIsScanning(false);
    }
  };

  useEffect(() => {
    scanNetwork();
    
    // Set up network state listener
    const unsubscribe = NetInfo.addEventListener(state => {
      if (state.type !== networkType) {
        setNetworkType(state.type);
        scanNetwork();
      }
    });

    return () => unsubscribe();
  }, []);

  return {
    availableDevices,
    isScanning,
    error,
    scanNetwork,
    networkType,
  };
};

export default useDeviceScanning;