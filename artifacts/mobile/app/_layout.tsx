import {
  Inter_400Regular,
  Inter_600SemiBold,
  Inter_700Bold,
  useFonts,
} from "@expo-google-fonts/inter";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { Stack, router, useSegments } from "expo-router";
import * as SplashScreen from "expo-splash-screen";
import React, { useEffect, useRef } from "react";
import { AppState, AppStateStatus, Platform } from "react-native";
import { GestureHandlerRootView } from "react-native-gesture-handler";
import { KeyboardProvider } from "react-native-keyboard-controller";
import { SafeAreaProvider } from "react-native-safe-area-context";
import { setBaseUrl } from "@workspace/api-client-react";
import * as LocalAuthentication from "expo-local-authentication";
import * as Notifications from "expo-notifications";
import AsyncStorage from "@react-native-async-storage/async-storage";

import { ErrorBoundary } from "@/components/ErrorBoundary";
import { AuthProvider, useAuth } from "@/context/AuthContext";
import { AccountsProvider } from "@/context/AccountsContext";
import { SchedulerProvider } from "@/context/SchedulerContext";
import { CreditsProvider } from "@/context/CreditsContext";
import { PlaidProvider } from "@/context/PlaidContext";

// ─── Notification handler ─────────────────────────────────────────────────────
Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowBanner: true,
    shouldShowList: true,
    shouldPlaySound: true,
    shouldSetBadge: true,
    shouldShowAlert: true,
  }),
});

// ─── Register push token ──────────────────────────────────────────────────────
async function registerPushToken(userId?: string): Promise<void> {
  if (Platform.OS === "web") return;
  try {
    const { status: existing } = await Notifications.getPermissionsAsync();
    const { status } = existing === "granted"
      ? { status: existing }
      : await Notifications.requestPermissionsAsync();
    if (status !== "granted") return;
    const { data: token } = await Notifications.getExpoPushTokenAsync();
    await AsyncStorage.setItem("bbb_push_token", token);

    // Sync to server — writes push token onto all active autopay schedules
    if (userId) {
      const domain = process.env.EXPO_PUBLIC_DOMAIN;
      const base = domain ? `https://${domain}` : "http://localhost:8080";
      fetch(`${base}/api/autopay/notify-prefs`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userId, pushToken: token }),
      }).catch(() => {}); // non-fatal
    }
  } catch { /* non-fatal */ }
}

// ─── Schedule bonus reminder ──────────────────────────────────────────────────
export async function scheduleBonusReminder(opts: {
  bankName: string; bonusAmount: number; daysFromNow: number;
}): Promise<void> {
  if (Platform.OS === "web") return;
  try {
    const trigger = new Date();
    trigger.setDate(trigger.getDate() + opts.daysFromNow);
    trigger.setHours(9, 0, 0, 0);
    await Notifications.scheduleNotificationAsync({
      content: {
        title: `💰 ${opts.bankName} bonus may have arrived!`,
        body: `Your $${opts.bonusAmount} bonus should be posting now. Check your account.`,
        data: { type: "bonus_reminder", bankName: opts.bankName },
        sound: "default",
      },
      trigger: { type: Notifications.SchedulableTriggerInputTypes.DATE, date: trigger },
    });
  } catch { /* non-fatal */ }
}

// ─── Biometrics helper ────────────────────────────────────────────────────────
async function shouldPromptBiometrics(): Promise<boolean> {
  if (Platform.OS === "web") return false;
  const enabled = await AsyncStorage.getItem("bbb_biometrics_enabled");
  if (enabled !== "true") return false;
  const hasHW = await LocalAuthentication.hasHardwareAsync();
  const enrolled = await LocalAuthentication.isEnrolledAsync();
  return hasHW && enrolled;
}

if (process.env.EXPO_PUBLIC_DOMAIN) {
  setBaseUrl(`https://${process.env.EXPO_PUBLIC_DOMAIN}`);
}

SplashScreen.preventAutoHideAsync();

const queryClient = new QueryClient();

// Screens that don't require authentication
const PUBLIC_SCREENS = ["auth", "legal"];

function RootLayoutNav() {
  const { isAuthenticated, isLoading, user } = useAuth() as any;
  const segments = useSegments();
  const appState = useRef(AppState.currentState);
  const lastBgTime = useRef<number>(0);
  const biometricsInFlight = useRef(false);

  // Auth redirect
  useEffect(() => {
    if (!isLoading) {
      SplashScreen.hideAsync();
      const currentScreen = segments[0] as string | undefined;
      const isPublicScreen = !currentScreen || PUBLIC_SCREENS.includes(currentScreen);
      if (!isAuthenticated && !isPublicScreen) {
        router.replace("/auth");
      }
    }
  }, [isAuthenticated, isLoading, segments]);

  // Register push token and sync to server when user logs in
  useEffect(() => {
    if (isAuthenticated) registerPushToken(user?.id);
  }, [isAuthenticated, user?.id]);

  // Handle notification taps → deep link
  useEffect(() => {
    const sub = Notifications.addNotificationResponseReceivedListener(response => {
      const data = (response.notification.request.content.data ?? {}) as Record<string, string>;
      if (data.type === "bonus_reminder") router.push("/(tabs)/accounts");
      else if (data.type === "autopay_update") router.push("/(tabs)/calendar");
      else if (data.type === "statement") router.push("/(tabs)/analytics");
    });
    return () => sub.remove();
  }, []);

  // Biometrics auto-prompt on foreground after 30s in background
  useEffect(() => {
    if (!isAuthenticated || Platform.OS === "web") return;
    const onChange = async (next: AppStateStatus) => {
      const prev = appState.current;
      appState.current = next;
      const comingForeground = next === "active" && (prev === "background" || prev === "inactive");
      if (!comingForeground || biometricsInFlight.current) return;
      const bgDuration = Date.now() - lastBgTime.current;
      if (bgDuration < 30_000) return; // under 30 s — skip
      const should = await shouldPromptBiometrics();
      if (!should) return;
      biometricsInFlight.current = true;
      const result = await LocalAuthentication.authenticateAsync({
        promptMessage: "Authenticate to access BigBankBonus",
        cancelLabel: "Use PIN",
        disableDeviceFallback: false,
        fallbackLabel: "Use PIN",
      });
      biometricsInFlight.current = false;
      if (!result.success) router.push("/pin");
    };
    const bgSub = AppState.addEventListener("change", (s) => {
      if (s === "background" || s === "inactive") lastBgTime.current = Date.now();
      onChange(s);
    });
    return () => bgSub.remove();
  }, [isAuthenticated]);

  return (
    <Stack screenOptions={{ headerShown: false }}>
      <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
      <Stack.Screen name="auth" options={{ headerShown: false, presentation: "fullScreenModal" }} />
      <Stack.Screen name="legal" options={{ headerShown: false, presentation: "modal" }} />
      <Stack.Screen name="pin" options={{ headerShown: false, presentation: "fullScreenModal" }} />
      <Stack.Screen name="bank/[id]" options={{ headerShown: false, presentation: "card" }} />
      <Stack.Screen name="payment" options={{ headerShown: false, presentation: "modal" }} />
      <Stack.Screen name="settings" options={{ headerShown: false, presentation: "modal" }} />
      <Stack.Screen name="subscription" options={{ headerShown: false, presentation: "modal" }} />
      <Stack.Screen name="offer-upsell" options={{ headerShown: false, presentation: "fullScreenModal" }} />
      <Stack.Screen name="checklist" options={{ headerShown: false, presentation: "modal" }} />
      <Stack.Screen name="statement" options={{ headerShown: false, presentation: "modal" }} />
    </Stack>
  );
}

export default function RootLayout() {
  const [fontsLoaded, fontError] = useFonts({
    Inter_400Regular,
    Inter_600SemiBold,
    Inter_700Bold,
  });

  if (!fontsLoaded && !fontError) return null;

  return (
    <SafeAreaProvider>
      <ErrorBoundary>
        <QueryClientProvider client={queryClient}>
          <GestureHandlerRootView style={{ flex: 1 }}>
            <KeyboardProvider>
              <AuthProvider>
                <AccountsProvider>
                  <SchedulerProvider>
                    <CreditsProvider>
                      <PlaidProvider>
                        <RootLayoutNav />
                      </PlaidProvider>
                    </CreditsProvider>
                  </SchedulerProvider>
                </AccountsProvider>
              </AuthProvider>
            </KeyboardProvider>
          </GestureHandlerRootView>
        </QueryClientProvider>
      </ErrorBoundary>
    </SafeAreaProvider>
  );
}
