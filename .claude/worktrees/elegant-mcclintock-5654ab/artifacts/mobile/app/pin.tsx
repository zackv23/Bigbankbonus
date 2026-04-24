import { Feather } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";
import { LinearGradient } from "expo-linear-gradient";
import { router } from "expo-router";
import React, { useState } from "react";
import {
  Platform,
  Pressable,
  StyleSheet,
  Text,
  View,
  useColorScheme,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import Reanimated, { FadeInDown, useAnimatedStyle, useSharedValue, withSequence, withTiming } from "react-native-reanimated";

import Colors from "@/constants/colors";
import { useAuth } from "@/context/AuthContext";

const PIN_LENGTH = 6;

export default function PinScreen() {
  const insets = useSafeAreaInsets();
  const colorScheme = useColorScheme();
  const isDark = colorScheme === "dark";
  const c = isDark ? Colors.dark : Colors.light;
  const { setPin, isPinSet } = useAuth();

  const [pin, setLocalPin] = useState("");
  const [confirmPin, setConfirmPin] = useState("");
  const [phase, setPhase] = useState<"set" | "confirm">("set");
  const [error, setError] = useState("");
  const shakeX = useSharedValue(0);

  const shake = () => {
    shakeX.value = withSequence(
      withTiming(-12, { duration: 50 }),
      withTiming(12, { duration: 50 }),
      withTiming(-8, { duration: 50 }),
      withTiming(8, { duration: 50 }),
      withTiming(0, { duration: 50 })
    );
  };

  const dotsStyle = useAnimatedStyle(() => ({ transform: [{ translateX: shakeX.value }] }));

  const handleKeyPress = async (key: string) => {
    if (Platform.OS !== "web") Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setError("");

    if (phase === "set") {
      const next = pin + key;
      setLocalPin(next);
      if (next.length === PIN_LENGTH) {
        setPhase("confirm");
        setLocalPin("");
      }
    } else {
      const next = confirmPin + key;
      setConfirmPin(next);
      if (next.length === PIN_LENGTH) {
        if (next === pin.padEnd(PIN_LENGTH, "0") || (phase === "confirm" && next)) {
          if (next !== pin && pin.length === PIN_LENGTH) {
            if (Platform.OS !== "web") Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
            shake();
            setError("PINs don't match. Try again.");
            setConfirmPin("");
            setLocalPin("");
            setPhase("set");
            return;
          }
          await setPin(next);
          if (Platform.OS !== "web") Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
          router.back();
        }
      }
    }
  };

  const handleDelete = () => {
    if (Platform.OS !== "web") Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    if (phase === "set") setLocalPin(p => p.slice(0, -1));
    else setConfirmPin(p => p.slice(0, -1));
  };

  const currentPin = phase === "set" ? pin : confirmPin;

  return (
    <View style={[styles.container, { backgroundColor: c.background }]}>
      <View style={[styles.header, { paddingTop: insets.top + (Platform.OS === "web" ? 67 : 20) }]}>
        <LinearGradient colors={["#833AB4", "#E1306C"]} style={StyleSheet.absoluteFill} />
        <Pressable style={styles.closeBtn} onPress={() => router.back()}>
          <Feather name="x" size={20} color="#fff" />
        </Pressable>
        <Feather name="lock" size={32} color="#fff" style={styles.lockIcon} />
        <Text style={styles.headerTitle}>{phase === "set" ? (isPinSet ? "New PIN" : "Create PIN") : "Confirm PIN"}</Text>
        <Text style={styles.headerSub}>{phase === "set" ? "Enter a 6-digit PIN to secure your account" : "Re-enter your PIN to confirm"}</Text>
      </View>

      <View style={styles.content}>
        <Reanimated.View style={[styles.dots, dotsStyle]}>
          {Array.from({ length: PIN_LENGTH }).map((_, i) => (
            <View key={i} style={[styles.dot, {
              backgroundColor: i < currentPin.length ? "#E1306C" : c.backgroundTertiary,
              transform: [{ scale: i < currentPin.length ? 1.15 : 1 }],
            }]} />
          ))}
        </Reanimated.View>

        {error ? (
          <Reanimated.View entering={FadeInDown.duration(300)} style={[styles.errorBadge, { backgroundColor: "#F4433622" }]}>
            <Feather name="alert-circle" size={14} color="#F44336" />
            <Text style={styles.errorText}>{error}</Text>
          </Reanimated.View>
        ) : null}

        <View style={styles.keypad}>
          {["1","2","3","4","5","6","7","8","9","","0","⌫"].map((key, i) => (
            <Pressable
              key={i}
              style={({ pressed }) => [
                styles.key,
                key === "" && styles.keyEmpty,
                key !== "" && key !== "⌫" && { backgroundColor: c.backgroundSecondary, borderColor: c.cardBorder },
                key === "⌫" && { backgroundColor: "transparent" },
                pressed && key !== "" && { opacity: 0.6, transform: [{ scale: 0.95 }] },
              ]}
              onPress={() => key === "⌫" ? handleDelete() : key !== "" ? handleKeyPress(key) : null}
              disabled={key === ""}
            >
              {key === "⌫" ? (
                <Feather name="delete" size={22} color={c.text} />
              ) : (
                <Text style={[styles.keyText, { color: c.text }]}>{key}</Text>
              )}
            </Pressable>
          ))}
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: { paddingHorizontal: 16, paddingBottom: 32, alignItems: "center" },
  closeBtn: { position: "absolute", top: 20, right: 16, width: 36, height: 36, backgroundColor: "rgba(255,255,255,0.15)", borderRadius: 10, alignItems: "center", justifyContent: "center" },
  lockIcon: { marginTop: 20, marginBottom: 12 },
  headerTitle: { fontSize: 24, fontFamily: "Inter_700Bold", color: "#fff" },
  headerSub: { fontSize: 14, fontFamily: "Inter_400Regular", color: "rgba(255,255,255,0.7)", marginTop: 6, textAlign: "center" },
  content: { flex: 1, alignItems: "center", justifyContent: "center", padding: 24, gap: 32 },
  dots: { flexDirection: "row", gap: 14 },
  dot: { width: 16, height: 16, borderRadius: 8 },
  errorBadge: { flexDirection: "row", alignItems: "center", gap: 8, paddingHorizontal: 14, paddingVertical: 8, borderRadius: 10 },
  errorText: { fontSize: 14, fontFamily: "Inter_600SemiBold", color: "#F44336" },
  keypad: { flexDirection: "row", flexWrap: "wrap", width: 280, gap: 16, justifyContent: "center" },
  key: { width: 78, height: 78, borderRadius: 24, alignItems: "center", justifyContent: "center", borderWidth: 1 },
  keyEmpty: { backgroundColor: "transparent", borderWidth: 0 },
  keyText: { fontSize: 26, fontFamily: "Inter_400Regular" },
});
