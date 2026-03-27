import { Feather } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";
import { LinearGradient } from "expo-linear-gradient";
import { router } from "expo-router";
import React, { useState } from "react";
import {
  ActivityIndicator,
  Alert,
  Animated,
  Platform,
  Pressable,
  StyleSheet,
  Text,
  View,
  useColorScheme,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import Reanimated, { FadeInDown, FadeInUp } from "react-native-reanimated";

import { useAuth } from "@/context/AuthContext";
import Colors from "@/constants/colors";
import MoneyAnimation from "@/components/MoneyAnimation";

export default function AuthScreen() {
  const { signIn, isBiometricsAvailable, authenticateWithBiometrics } = useAuth();
  const insets = useSafeAreaInsets();
  const colorScheme = useColorScheme();
  const isDark = colorScheme === "dark";
  const [loading, setLoading] = useState(false);

  const handleDemoLogin = async () => {
    try {
      setLoading(true);
      if (Platform.OS !== "web") await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
      await signIn({
        id: "demo_user_" + Date.now().toString(),
        email: "demo@bigbankbonus.com",
        name: "Demo User",
        provider: "demo",
      });
      router.replace("/(tabs)");
    } catch (e) {
      Alert.alert("Error", "Login failed. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const handleAppleLogin = async () => {
    if (Platform.OS !== "web") await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setLoading(true);
    setTimeout(async () => {
      await signIn({
        id: "apple_" + Date.now().toString(),
        email: "user@icloud.com",
        name: "Apple User",
        provider: "apple",
      });
      router.replace("/(tabs)");
      setLoading(false);
    }, 1000);
  };

  const handleGoogleLogin = async () => {
    if (Platform.OS !== "web") await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setLoading(true);
    setTimeout(async () => {
      await signIn({
        id: "google_" + Date.now().toString(),
        email: "user@gmail.com",
        name: "Google User",
        provider: "google",
      });
      router.replace("/(tabs)");
      setLoading(false);
    }, 1000);
  };

  const c = isDark ? Colors.dark : Colors.light;

  return (
    <View style={[styles.container, { backgroundColor: "#0A0A0A" }]}>
      <LinearGradient
        colors={["#833AB4", "#E1306C", "#F77737"]}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={StyleSheet.absoluteFill}
      />
      <View style={[StyleSheet.absoluteFill, { backgroundColor: "rgba(0,0,0,0.65)" }]} />

      <View style={[styles.content, { paddingTop: insets.top + (Platform.OS === "web" ? 67 : 20), paddingBottom: insets.bottom + 34 }]}>
        <Reanimated.View entering={FadeInUp.delay(100).duration(600)} style={styles.header}>
          <View style={styles.logoContainer}>
            <LinearGradient
              colors={["#833AB4", "#E1306C", "#F77737"]}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
              style={styles.logoGradient}
            >
              <Feather name="dollar-sign" size={36} color="#fff" />
            </LinearGradient>
          </View>
          <Text style={styles.appName}>BigBankBonus</Text>
          <Text style={styles.tagline}>Find. Apply. Earn.</Text>
        </Reanimated.View>

        <Reanimated.View entering={FadeInDown.delay(200).duration(600)} style={styles.animationWrapper}>
          <MoneyAnimation />
        </Reanimated.View>

        <Reanimated.View entering={FadeInUp.delay(400).duration(600)} style={styles.bottomSection}>
          <Text style={styles.subtitle}>
            Discover thousands of bank bonuses.{"\n"}
            Track and automate your earnings.
          </Text>

          <View style={styles.buttons}>
            {Platform.OS === "ios" && (
              <Pressable
                style={({ pressed }) => [styles.btn, styles.appleBtn, { opacity: pressed ? 0.85 : 1 }]}
                onPress={handleAppleLogin}
                disabled={loading}
              >
                <Feather name="smartphone" size={20} color="#fff" />
                <Text style={[styles.btnText, { color: "#fff" }]}>Continue with Apple</Text>
              </Pressable>
            )}

            <Pressable
              style={({ pressed }) => [styles.btn, styles.googleBtn, { opacity: pressed ? 0.85 : 1 }]}
              onPress={handleGoogleLogin}
              disabled={loading}
            >
              <Feather name="globe" size={20} color="#0A0A0A" />
              <Text style={[styles.btnText, { color: "#0A0A0A" }]}>Continue with Google</Text>
            </Pressable>

            <Pressable
              style={({ pressed }) => [styles.btn, styles.demoBtn, { opacity: pressed ? 0.85 : 1 }]}
              onPress={handleDemoLogin}
              disabled={loading}
            >
              {loading ? (
                <ActivityIndicator color="#fff" size="small" />
              ) : (
                <>
                  <Feather name="zap" size={20} color="#fff" />
                  <Text style={[styles.btnText, { color: "#fff" }]}>Try Demo</Text>
                </>
              )}
            </Pressable>
          </View>

          <Text style={styles.legal}>
            By continuing, you agree to our Terms of Service and Privacy Policy
          </Text>
        </Reanimated.View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  content: { flex: 1, paddingHorizontal: 24 },
  header: { alignItems: "center", marginBottom: 8 },
  logoContainer: { marginBottom: 16 },
  logoGradient: {
    width: 80,
    height: 80,
    borderRadius: 22,
    alignItems: "center",
    justifyContent: "center",
    shadowColor: "#E1306C",
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.5,
    shadowRadius: 16,
    elevation: 10,
  },
  appName: {
    fontSize: 34,
    fontFamily: "Inter_700Bold",
    color: "#FFFFFF",
    letterSpacing: -0.5,
  },
  tagline: {
    fontSize: 16,
    fontFamily: "Inter_400Regular",
    color: "rgba(255,255,255,0.7)",
    marginTop: 4,
    letterSpacing: 2,
    textTransform: "uppercase",
  },
  animationWrapper: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
  },
  bottomSection: { gap: 20 },
  subtitle: {
    fontSize: 16,
    fontFamily: "Inter_400Regular",
    color: "rgba(255,255,255,0.8)",
    textAlign: "center",
    lineHeight: 24,
  },
  buttons: { gap: 12 },
  btn: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 10,
    paddingVertical: 16,
    borderRadius: 14,
  },
  appleBtn: { backgroundColor: "#000000", borderWidth: 1, borderColor: "rgba(255,255,255,0.2)" },
  googleBtn: { backgroundColor: "#FFFFFF" },
  demoBtn: { backgroundColor: "rgba(255,255,255,0.15)", borderWidth: 1, borderColor: "rgba(255,255,255,0.3)" },
  btnText: { fontFamily: "Inter_600SemiBold", fontSize: 16 },
  legal: {
    fontSize: 11,
    fontFamily: "Inter_400Regular",
    color: "rgba(255,255,255,0.4)",
    textAlign: "center",
    lineHeight: 16,
  },
});
