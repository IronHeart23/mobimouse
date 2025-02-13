//touchpad.tsx
import { useRouter, useLocalSearchParams } from "expo-router";
import React, { useState, useEffect, useRef } from "react";
import {
  View,
  Text,
  PanResponder,
  Pressable,
  StyleSheet,
  SafeAreaView,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import axios from "axios";

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
        const screenResponse = await axios.get(
          `http://${serverIp}:3000/screen`
        );
        setScreenSize(screenResponse.data);
        const mouseResponse = await axios.get(
          `http://${serverIp}:3000/mouse/position`
        );
        setMousePosition(mouseResponse.data);
      } catch (error) {
        console.error("Error fetching initial data:", error);
      }
    };
    fetchInitialData();
  }, [serverIp]);

  type MouseButton = "left" | "right" | "middle";

  const handleMouseClick = async (button: MouseButton) => {
    try {
      await axios.post(`http://${serverIp}:3000/mouse/click`, { button });
    } catch (error) {
      console.error("Click error:", error);
    }
  };

  const handleMouseHold = async (
    button: "left" | "right",
    action: "down" | "up"
  ) => {
    try {
      await axios.post(`http://${serverIp}:3000/mouse/hold`, {
        button,
        action,
      });
    } catch (error) {
      console.error(`Mouse ${action} error:`, error);
    }
  };

  const handleMouseDown = async (button: "left" | "right") => {
    try {
      await axios.post(`http://${serverIp}:3000/mouse/hold`, {
        button,
        action: "down",
      });
    } catch (error) {
      console.error("Mouse down error:", error);
    }
  };

  const handleMouseUp = async (button: "left" | "right") => {
    try {
      await axios.post(`http://${serverIp}:3000/mouse/hold`, {
        button,
        action: "up",
      });
    } catch (error) {
      console.error("Mouse up error:", error);
    }
  };

  const panResponder = PanResponder.create({
    onStartShouldSetPanResponder: () => true,
    onMoveShouldSetPanResponder: () => true,
    onPanResponderGrant: async (evt) => {
      const currentTime = Date.now();
      pressStartTime.current = currentTime;
      hasMoved.current = false;

      dragStartPos.current = { ...mousePosition };
      if (currentTime - lastTapTime.current < DOUBLE_TAP_DELAY) {
        isDragging.current = true;
        await handleMouseHold("left", "down"); // Only use left click for drag
      }

      lastTapTime.current = currentTime;
    },

    onPanResponderMove: async (evt, gestureState) => {
      // Check if movement exceeds threshold
      if (
        Math.abs(gestureState.dx) > MOVEMENT_THRESHOLD ||
        Math.abs(gestureState.dy) > MOVEMENT_THRESHOLD
      ) {
        hasMoved.current = true;
      }

      // Calculate new mouse position
      const sensitivity = 1.5; // Adjust this value to change mouse movement speed
      const newX = Math.min(
        Math.max(0, mousePosition.x + gestureState.dx * sensitivity),
        screenSize.width
      );
      const newY = Math.min(
        Math.max(0, mousePosition.y + gestureState.dy * sensitivity),
        screenSize.height
      );

      setMousePosition({ x: newX, y: newY });

      try {
        await axios.post(`http://${serverIp}:3000/mouse/move`, {
          x: newX,
          y: newY,
        });
      } catch (error) {
        console.error("Move error:", error);
      }
    },

    onPanResponderRelease: async (evt) => {
      const pressDuration = Date.now() - pressStartTime.current;

      if (isDragging.current) {
        await handleMouseHold("left", "up");
        isDragging.current = false;
        return;
      }

      if (!hasMoved.current) {
        if (pressDuration < HOLD_DURATION) {
          await handleMouseClick("left");
        } else {
          await handleMouseClick("right");
        }
      }
    },
    onPanResponderTerminate: async () => {
      if (isDragging.current) {
        await handleMouseHold("left", "up");
        isDragging.current = false;
      }
    },
  });

  const handleMiddleClick = () => {
    handleMouseClick("left");
  };

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <Pressable onPress={() => router.back()} style={styles.backButton}>
          <Ionicons name="chevron-back" size={24} color="#fff" />
          <Text style={styles.headerTitle}>Touch Input</Text>
        </Pressable>
        <Ionicons name="keypad-outline" size={24} color="#fff" />
      </View>

      {/* Touch area with instruction text */}
      <View style={styles.touchAreaContainer}>
        <Text style={styles.instructionText}>
          Move your finger on the screen to move the mouse cursor
        </Text>
        <View style={styles.touchpad} {...panResponder.panHandlers} />
      </View>

      {/* Bottom buttons */}
      <View style={styles.buttonContainer}>
        <Pressable
          style={styles.button}
          onPress={() => handleMouseClick("left")}
        >
          <Text style={styles.buttonText}>L</Text>
        </Pressable>
        <Pressable
          style={[styles.button, styles.middleButton]}
          onPress={() => handleMouseClick("middle")}
        >
          <Text style={styles.buttonText}>M</Text>
        </Pressable>
        <Pressable
          style={styles.button}
          onPress={() => handleMouseClick("right")}
        >
          <Text style={styles.buttonText}>R</Text>
        </Pressable>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#1a1a1a",
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: "#333333",
    backgroundColor: "#1a1a1a",
  },
  backButton: {
    flexDirection: "row",
    alignItems: "center",
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: "500",
    marginLeft: 8,
    color: "#ffffff",
  },
  touchAreaContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    paddingHorizontal: 20,
    backgroundColor: "#1a1a1a",
  },
  instructionText: {
    fontSize: 16,
    color: "#cccccc",
    textAlign: "center",
    marginBottom: 20,
  },
  touchpad: {
    width: "100%",
    flex: 1,
    backgroundColor: "#2a2a2a",
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "#333333",
  },
  buttonContainer: {
    flexDirection: "row",
    justifyContent: "center",
    padding: 20,
    gap: 10,
    backgroundColor: "#1a1a1a",
  },
  button: {
    flex: 1,
    backgroundColor: "#2a2a2a",
    borderRadius: 25,
    height: 50,
    justifyContent: "center",
    alignItems: "center",
    maxWidth: 120,
    borderWidth: 1,
    borderColor: "#333333",
  },
  middleButton: {
    maxWidth: 50,
  },
  buttonText: {
    fontSize: 16,
    fontWeight: "500",
    color: "#ffffff",
  },
});

export default Touchpad;
