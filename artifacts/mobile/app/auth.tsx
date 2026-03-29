import { Feather } from "@expo/vector-icons";
import * as AppleAuthentication from "expo-apple-authentication";
import * as Google from "expo-auth-session/providers/google";
import * as Haptics from "expo-haptics";
import { LinearGradient } from "expo-linear-gradient";
import { router } from "expo-router";
import * as WebBrowser from "expo-web-browser";
import React, { useEffect, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  Platform,
  Pressable,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import Reanimated, { FadeInDown, FadeInUp } from "react-native-reanimated";

import MoneyAnimation from "@/components/MoneyAnimation";
import { useAuth } from "@/context/AuthContext";

// Required so expo-auth-session can close the browser after redirect
WebBrowser.maybeCompleteAuthSession();

const GOOGLE_CLIENT_ID = process.env.EXPO_PUBLIC_GOOGLE_CLIENT_ID;

// ─── Google User Profile helper ───────────────────────────────────────────────
async function fetchGoogleProfile(accessToken: string) {
  const res = await fetch("https://www.googleapis.com/oauth2/v2/userinfo", {
    headers: { Authorization: `Bearer ${accessToken}` },
  });
  if (!res.ok) throw new Error("Failed to fetch Google profile");
  return res.json() as Promise<{ id: string; email: string; name: string; picture?: string }>;
}

export default function AuthScreen() {
  const { signIn } = useAuth();
  const insets = useSafeAreaInsets();
  const [loading, setLoading] = useState<"apple" | "google" | "demo" | null>(null);

  // ─── Google OAuth request ──────────────────────────────────────────────────
  const [, googleResponse, googlePromptAsync] = Google.useAuthRequest({
    clientId: GOOGLE_CLIENT_ID ?? "",
    // For production native builds:
    // iosClientId: process.env.EXPO_PUBLIC_GOOGLE_IOS_CLIENT_ID,
    // androidClientId: process.env.EXPO_PUBLIC_GOOGLE_ANDROID_CLIENT_ID,
  });

  // Handle Google auth response
  useEffect(() => {
    const handleGoogle = async () => {
      if (googleResponse?.type === "success") {
        const token = googleResponse.authentication?.accessToken;
        if (!token) return;
        try {
          const profile = await fetchGoogleProfile(token);
          await signIn({
            id: "google_" + profile.id,
            email: profile.email,
            name: profile.name,
            provider: "google",
            avatar: profile.picture,
          });
          router.replace("/(tabs)");
        } catch (e) {
          Alert.alert("Sign In Failed", "Could not get your Google profile. Please try again.");
        } finally {
          setLoading(null);
        }
      } else if (googleResponse?.type === "error") {
        Alert.alert("Google Sign In Error", googleResponse.error?.message ?? "Sign in was cancelled.");
        setLoading(null);
      } else if (googleResponse?.type === "dismiss" || googleResponse?.type === "cancel") {
        setLoading(null);
      }
    };
    handleGoogle();
  }, [googleResponse]);

  // ─── Handlers ─────────────────────────────────────────────────────────────
  const handleGoogleLogin = async () => {
    if (!GOOGLE_CLIENT_ID) {
      Alert.alert(
        "Google Sign In Not Configured",
        "To enable Google Sign In, add your EXPO_PUBLIC_GOOGLE_CLIENT_ID to the project environment variables. Use the Demo login to try the app.",
        [{ text: "OK" }]
      );
      return;
    }
    try {
      if (Platform.OS !== "web") Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
      setLoading("google");
      await googlePromptAsync();
      // response is handled in useEffect above
    } catch (e) {
      Alert.alert("Error", "Could not start Google Sign In.");
      setLoading(null);
    }
  };

  const handleAppleLogin = async () => {
    try {
      if (Platform.OS !== "web") Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
      setLoading("apple");
      const credential = await AppleAuthentication.signInAsync({
        requestedScopes: [
          AppleAuthentication.AppleAuthenticationScope.FULL_NAME,
          AppleAuthentication.AppleAuthenticationScope.EMAIL,
        ],
      });
      // Apple only provides email + name on the FIRST sign-in.
      // On subsequent logins they are null — fall back to stored values.
      const name = credential.fullName
        ? [credential.fullName.givenName, credential.fullName.familyName].filter(Boolean).join(" ")
        : "Apple User";
      const email = credential.email ?? "apple_" + credential.user + "@privaterelay.appleid.com";
      await signIn({
        id: "apple_" + credential.user,
        email,
        name: name || "Apple User",
        provider: "apple",
      });
      router.replace("/(tabs)");
    } catch (e: any) {
      if (e.code !== "ERR_REQUEST_CANCELED") {
        Alert.alert("Apple Sign In Failed", e.message ?? "Please try again.");
      }
    } finally {
      setLoading(null);
    }
  };

  const handleDemoLogin = async () => {
    try {
      if (Platform.OS !== "web") Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
      setLoading("demo");
      await signIn({
        id: "demo_user_" + Date.now().toString(),
        email: "demo@bigbankbonus.com",
        name: "Demo User",
        provider: "demo",
      });
      router.replace("/(tabs)");
    } catch {
      Alert.alert("Error", "Login failed. Please try again.");
    } finally {
      setLoading(null);
    }
  };

  // ─── Apple availability (iOS 13+ only) ───────────────────────────────────
  const [appleAvailable, setAppleAvailable] = useState(false);
  useEffect(() => {
    if (Platform.OS === "ios") {
      AppleAuthentication.isAvailableAsync().then(setAppleAvailable);
    }
  }, []);

  return (
    <View style={styles.container}>
      <LinearGradient
        colors={["#833AB4", "#E1306C", "#F77737"]}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={StyleSheet.absoluteFill}
      />
      <View style={[StyleSheet.absoluteFill, { backgroundColor: "rgba(0,0,0,0.65)" }]} />

      <View style={[styles.content, { paddingTop: insets.top + (Platform.OS === "web" ? 67 : 20), paddingBottom: insets.bottom + 34 }]}>
        {/* Header */}
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

        {/* Animation */}
        <Reanimated.View entering={FadeInDown.delay(200).duration(600)} style={styles.animationWrapper}>
          <MoneyAnimation />
        </Reanimated.View>

        {/* Auth buttons */}
        <Reanimated.View entering={FadeInUp.delay(400).duration(600)} style={styles.bottomSection}>
          <Text style={styles.subtitle}>
            Discover thousands of bank bonuses.{"\n"}
            Track and automate your earnings.
          </Text>

          <View style={styles.buttons}>
            {/* Apple Sign In — shown only on iOS where it's available */}
            {appleAvailable && (
              <Pressable
                style={({ pressed }) => [styles.btn, styles.appleBtn, { opacity: pressed || loading === "apple" ? 0.85 : 1 }]}
                onPress={handleAppleLogin}
                disabled={!!loading}
              >
                {loading === "apple" ? (
                  <ActivityIndicator color="#fff" size="small" />
                ) : (
                  <>
                    <AppleIcon />
                    <Text style={[styles.btnText, { color: "#fff" }]}>Continue with Apple</Text>
                  </>
                )}
              </Pressable>
            )}

            {/* Google Sign In — all platforms */}
            <Pressable
              style={({ pressed }) => [styles.btn, styles.googleBtn, { opacity: pressed || loading === "google" ? 0.85 : 1 }]}
              onPress={handleGoogleLogin}
              disabled={!!loading}
            >
              {loading === "google" ? (
                <ActivityIndicator color="#333" size="small" />
              ) : (
                <>
                  <GoogleIcon />
                  <Text style={[styles.btnText, { color: "#0A0A0A" }]}>Continue with Google</Text>
                </>
              )}
            </Pressable>

            {/* Demo / divider */}
            <View style={styles.divider}>
              <View style={styles.dividerLine} />
              <Text style={styles.dividerText}>or</Text>
              <View style={styles.dividerLine} />
            </View>

            <Pressable
              style={({ pressed }) => [styles.btn, styles.demoBtn, { opacity: pressed || loading === "demo" ? 0.85 : 1 }]}
              onPress={handleDemoLogin}
              disabled={!!loading}
            >
              {loading === "demo" ? (
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

// ─── Inline SVG-like brand icons ──────────────────────────────────────────────
function GoogleIcon() {
  return (
    <View style={{ width: 20, height: 20, alignItems: "center", justifyContent: "center" }}>
      <Text style={{ fontSize: 16, fontWeight: "700", color: "#4285F4" }}>G</Text>
    </View>
  );
}

function AppleIcon() {
  return (
    <View style={{ width: 20, height: 20, alignItems: "center", justifyContent: "center" }}>
      <Feather name="smartphone" size={18} color="#fff" />
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
  animationWrapper: { flex: 1, alignItems: "center", justifyContent: "center" },
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
  appleBtn: { backgroundColor: "#000", borderWidth: 1, borderColor: "rgba(255,255,255,0.2)" },
  googleBtn: { backgroundColor: "#FFFFFF" },
  demoBtn: { backgroundColor: "rgba(255,255,255,0.15)", borderWidth: 1, borderColor: "rgba(255,255,255,0.3)" },
  btnText: { fontFamily: "Inter_600SemiBold", fontSize: 16 },
  divider: { flexDirection: "row", alignItems: "center", gap: 10 },
  dividerLine: { flex: 1, height: StyleSheet.hairlineWidth, backgroundColor: "rgba(255,255,255,0.25)" },
  dividerText: { fontSize: 12, fontFamily: "Inter_400Regular", color: "rgba(255,255,255,0.4)" },
  legal: {
    fontSize: 11,
    fontFamily: "Inter_400Regular",
    color: "rgba(255,255,255,0.4)",
    textAlign: "center",
    lineHeight: 16,
  },
});
