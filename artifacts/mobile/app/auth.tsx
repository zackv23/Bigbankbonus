import { Feather } from "@expo/vector-icons";
import * as AppleAuthentication from "expo-apple-authentication";
import * as Google from "expo-auth-session/providers/google";
import * as Haptics from "expo-haptics";
import { LinearGradient } from "expo-linear-gradient";
import { router } from "expo-router";
import * as WebBrowser from "expo-web-browser";
import React, { useEffect, useRef, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  Animated,
  KeyboardAvoidingView,
  Modal,
  Platform,
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import Reanimated, { FadeInDown, FadeInUp } from "react-native-reanimated";

import MoneyAnimation from "@/components/MoneyAnimation";
import { useAuth } from "@/context/AuthContext";

WebBrowser.maybeCompleteAuthSession();

const GOOGLE_WEB_CLIENT_ID = process.env.EXPO_PUBLIC_GOOGLE_CLIENT_ID;
const GOOGLE_IOS_CLIENT_ID = process.env.EXPO_PUBLIC_GOOGLE_IOS_CLIENT_ID;
const GOOGLE_ANDROID_CLIENT_ID = process.env.EXPO_PUBLIC_GOOGLE_ANDROID_CLIENT_ID;

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
  const [loading, setLoading] = useState<"apple" | "google" | "demo" | "email" | null>(null);

  // Email sign-up modal
  const [emailModalVisible, setEmailModalVisible] = useState(false);
  const [emailName, setEmailName] = useState("");
  const [emailAddress, setEmailAddress] = useState("");
  const [emailError, setEmailError] = useState("");
  const fadeAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (emailModalVisible) {
      Animated.timing(fadeAnim, { toValue: 1, duration: 200, useNativeDriver: false }).start();
    } else {
      fadeAnim.setValue(0);
    }
  }, [emailModalVisible]);

  // Google OAuth — web client ID drives Expo Go + web; iOS/Android IDs used in native builds
  const [, googleResponse, googlePromptAsync] = Google.useAuthRequest({
    clientId: GOOGLE_WEB_CLIENT_ID ?? "",
    iosClientId: GOOGLE_IOS_CLIENT_ID,
    androidClientId: GOOGLE_ANDROID_CLIENT_ID,
  });

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
        } catch {
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

  // Handlers
  const handleGoogleLogin = async () => {
    if (!GOOGLE_WEB_CLIENT_ID && !GOOGLE_IOS_CLIENT_ID && !GOOGLE_ANDROID_CLIENT_ID) {
      Alert.alert(
        "Google Sign In",
        "Google Sign In isn't configured yet. Use email sign-up or the Demo to get started.",
        [{ text: "OK" }],
      );
      return;
    }
    try {
      if (Platform.OS !== "web") Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
      setLoading("google");
      await googlePromptAsync();
    } catch {
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

  const handleEmailSignUp = async () => {
    setEmailError("");
    const name = emailName.trim();
    const email = emailAddress.trim().toLowerCase();
    if (!name) { setEmailError("Please enter your name."); return; }
    if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      setEmailError("Please enter a valid email address.");
      return;
    }
    try {
      if (Platform.OS !== "web") Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
      setLoading("email");
      await signIn({
        id: "email_" + email.replace(/[^a-z0-9]/g, "_"),
        email,
        name,
        provider: "demo",
      });
      setEmailModalVisible(false);
      router.replace("/(tabs)");
    } catch {
      Alert.alert("Error", "Sign up failed. Please try again.");
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
      <View style={[StyleSheet.absoluteFill, { backgroundColor: "rgba(0,0,0,0.35)" }]} />

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

          <View style={styles.freeSignupBanner}>
            <Feather name="shield" size={14} color="#4CAF50" />
            <Text style={styles.freeSignupText}>
              Free to sign up — no credit card required.{"\n"}You're only charged after approval.
            </Text>
          </View>

          <View style={styles.buttons}>
            {/* Primary: Email sign-up */}
            <Pressable
              style={({ pressed }) => [styles.btn, styles.emailBtn, { opacity: pressed || loading === "email" ? 0.85 : 1 }]}
              onPress={() => {
                if (Platform.OS !== "web") Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                setEmailModalVisible(true);
              }}
              disabled={!!loading}
            >
              {loading === "email" ? (
                <ActivityIndicator color="#fff" size="small" />
              ) : (
                <>
                  <Feather name="mail" size={20} color="#fff" />
                  <Text style={[styles.btnText, { color: "#fff" }]}>Sign Up Free with Email</Text>
                </>
              )}
            </Pressable>

            {/* Apple — iOS only */}
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

            {/* Google */}
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

            {/* Demo divider */}
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

          <Pressable onPress={() => router.push("/legal")} style={{ alignSelf: "center" }}>
            <Text style={styles.legal}>
              By continuing, you agree to our{" "}
              <Text style={{ color: "rgba(255,255,255,0.65)", textDecorationLine: "underline" }}>Terms of Service</Text>
              {" "}and{" "}
              <Text style={{ color: "rgba(255,255,255,0.65)", textDecorationLine: "underline" }}>Privacy Policy</Text>
            </Text>
          </Pressable>
        </Reanimated.View>
      </View>

      {/* Email Sign-Up Modal */}
      <Modal
        visible={emailModalVisible}
        transparent
        animationType="slide"
        onRequestClose={() => setEmailModalVisible(false)}
      >
        <KeyboardAvoidingView
          style={styles.modalOverlay}
          behavior={Platform.OS === "ios" ? "padding" : "height"}
        >
          <View style={styles.modalCard}>
            <LinearGradient
              colors={["#833AB4", "#E1306C", "#F77737"]}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 0 }}
              style={styles.modalHeaderBar}
            />
            <View style={styles.modalContent}>
              <Text style={styles.modalTitle}>Create Free Account</Text>
              <Text style={styles.modalSubtitle}>No credit card required</Text>

              <Text style={styles.inputLabel}>Your Name</Text>
              <TextInput
                style={styles.input}
                placeholder="Jane Smith"
                placeholderTextColor="#999"
                value={emailName}
                onChangeText={t => { setEmailName(t); setEmailError(""); }}
                autoCapitalize="words"
                returnKeyType="next"
              />

              <Text style={styles.inputLabel}>Email Address</Text>
              <TextInput
                style={styles.input}
                placeholder="jane@example.com"
                placeholderTextColor="#999"
                value={emailAddress}
                onChangeText={t => { setEmailAddress(t); setEmailError(""); }}
                keyboardType="email-address"
                autoCapitalize="none"
                autoCorrect={false}
                returnKeyType="done"
                onSubmitEditing={handleEmailSignUp}
              />

              {emailError ? <Text style={styles.errorText}>{emailError}</Text> : null}

              <Pressable
                style={({ pressed }) => [styles.modalSubmitBtn, { opacity: pressed || loading === "email" ? 0.85 : 1 }]}
                onPress={handleEmailSignUp}
                disabled={loading === "email"}
              >
                <LinearGradient
                  colors={["#833AB4", "#E1306C", "#F77737"]}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 0 }}
                  style={styles.modalSubmitGradient}
                >
                  {loading === "email" ? (
                    <ActivityIndicator color="#fff" size="small" />
                  ) : (
                    <Text style={styles.modalSubmitText}>Get Started Free</Text>
                  )}
                </LinearGradient>
              </Pressable>

              <Pressable style={styles.modalCancelBtn} onPress={() => setEmailModalVisible(false)}>
                <Text style={styles.modalCancelText}>Cancel</Text>
              </Pressable>
            </View>
          </View>
        </KeyboardAvoidingView>
      </Modal>
    </View>
  );
}

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
  appName: { fontSize: 34, fontFamily: "Inter_700Bold", color: "#FFFFFF", letterSpacing: -0.5 },
  tagline: { fontSize: 16, fontFamily: "Inter_400Regular", color: "rgba(255,255,255,0.7)", marginTop: 4, letterSpacing: 2, textTransform: "uppercase" },
  animationWrapper: { flex: 1, alignItems: "center", justifyContent: "center" },
  bottomSection: { gap: 20 },
  subtitle: { fontSize: 16, fontFamily: "Inter_400Regular", color: "rgba(255,255,255,0.8)", textAlign: "center", lineHeight: 24 },
  buttons: { gap: 12 },
  btn: { flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 10, paddingVertical: 16, borderRadius: 14 },
  emailBtn: { backgroundColor: "#833AB4", shadowColor: "#833AB4", shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.4, shadowRadius: 8, elevation: 6 },
  appleBtn: { backgroundColor: "#000", borderWidth: 1, borderColor: "rgba(255,255,255,0.2)" },
  googleBtn: { backgroundColor: "#FFFFFF" },
  demoBtn: { backgroundColor: "rgba(255,255,255,0.15)", borderWidth: 1, borderColor: "rgba(255,255,255,0.3)" },
  btnText: { fontFamily: "Inter_600SemiBold", fontSize: 16 },
  divider: { flexDirection: "row", alignItems: "center", gap: 10 },
  dividerLine: { flex: 1, height: StyleSheet.hairlineWidth, backgroundColor: "rgba(255,255,255,0.25)" },
  dividerText: { fontSize: 12, fontFamily: "Inter_400Regular", color: "rgba(255,255,255,0.4)" },
  freeSignupBanner: { flexDirection: "row", alignItems: "flex-start", gap: 8, backgroundColor: "rgba(76,175,80,0.15)", borderWidth: 1, borderColor: "rgba(76,175,80,0.35)", borderRadius: 12, paddingHorizontal: 14, paddingVertical: 10 },
  freeSignupText: { flex: 1, fontSize: 12, fontFamily: "Inter_400Regular", color: "rgba(255,255,255,0.9)", lineHeight: 18 },
  legal: { fontSize: 11, fontFamily: "Inter_400Regular", color: "rgba(255,255,255,0.4)", textAlign: "center", lineHeight: 16 },
  // Modal
  modalOverlay: { flex: 1, justifyContent: "flex-end", backgroundColor: "rgba(0,0,0,0.6)" },
  modalCard: { backgroundColor: "#fff", borderTopLeftRadius: 24, borderTopRightRadius: 24, overflow: "hidden" },
  modalHeaderBar: { height: 5, width: 40, borderRadius: 3, alignSelf: "center", marginTop: 12, marginBottom: 4 },
  modalContent: { paddingHorizontal: 24, paddingTop: 12, paddingBottom: 40 },
  modalTitle: { fontSize: 24, fontFamily: "Inter_700Bold", color: "#0A0A0A", marginBottom: 4 },
  modalSubtitle: { fontSize: 14, fontFamily: "Inter_400Regular", color: "#666", marginBottom: 24 },
  inputLabel: { fontSize: 13, fontFamily: "Inter_600SemiBold", color: "#333", marginBottom: 6 },
  input: { borderWidth: 1.5, borderColor: "#E0E0E0", borderRadius: 12, paddingHorizontal: 16, paddingVertical: 14, fontSize: 16, fontFamily: "Inter_400Regular", color: "#0A0A0A", marginBottom: 16, backgroundColor: "#FAFAFA" },
  errorText: { fontSize: 13, fontFamily: "Inter_400Regular", color: "#E1306C", marginBottom: 12, marginTop: -8 },
  modalSubmitBtn: { borderRadius: 14, overflow: "hidden", marginTop: 8 },
  modalSubmitGradient: { paddingVertical: 16, alignItems: "center", justifyContent: "center" },
  modalSubmitText: { fontSize: 16, fontFamily: "Inter_600SemiBold", color: "#fff" },
  modalCancelBtn: { alignItems: "center", marginTop: 16 },
  modalCancelText: { fontSize: 15, fontFamily: "Inter_400Regular", color: "#999" },
});
