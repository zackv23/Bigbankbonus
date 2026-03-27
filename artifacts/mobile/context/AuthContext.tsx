import AsyncStorage from "@react-native-async-storage/async-storage";
import * as LocalAuthentication from "expo-local-authentication";
import * as SecureStore from "expo-secure-store";
import React, { createContext, useCallback, useContext, useEffect, useState } from "react";
import { Platform } from "react-native";

interface User {
  id: string;
  email: string;
  name: string;
  provider: "apple" | "google" | "demo";
  avatar?: string;
}

interface AuthContextType {
  user: User | null;
  isLoading: boolean;
  isAuthenticated: boolean;
  isPinSet: boolean;
  isBiometricsAvailable: boolean;
  signIn: (user: User) => Promise<void>;
  signOut: () => Promise<void>;
  setPin: (pin: string) => Promise<void>;
  verifyPin: (pin: string) => Promise<boolean>;
  authenticateWithBiometrics: () => Promise<boolean>;
}

const AuthContext = createContext<AuthContextType | null>(null);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isPinSet, setIsPinSet] = useState(false);
  const [isBiometricsAvailable, setIsBiometricsAvailable] = useState(false);

  useEffect(() => {
    const init = async () => {
      try {
        const stored = await AsyncStorage.getItem("bbb_user");
        if (stored) setUser(JSON.parse(stored));
        const pin = await AsyncStorage.getItem("bbb_pin_set");
        if (pin === "true") setIsPinSet(true);
        if (Platform.OS !== "web") {
          const compatible = await LocalAuthentication.hasHardwareAsync();
          const enrolled = await LocalAuthentication.isEnrolledAsync();
          setIsBiometricsAvailable(compatible && enrolled);
        }
      } catch (e) {
        console.error("Auth init error:", e);
      } finally {
        setIsLoading(false);
      }
    };
    init();
  }, []);

  const signIn = useCallback(async (userData: User) => {
    await AsyncStorage.setItem("bbb_user", JSON.stringify(userData));
    setUser(userData);
  }, []);

  const signOut = useCallback(async () => {
    await AsyncStorage.multiRemove(["bbb_user"]);
    setUser(null);
  }, []);

  const setPin = useCallback(async (pin: string) => {
    if (Platform.OS === "web") {
      await AsyncStorage.setItem("bbb_pin", pin);
    } else {
      await SecureStore.setItemAsync("bbb_pin", pin);
    }
    await AsyncStorage.setItem("bbb_pin_set", "true");
    setIsPinSet(true);
  }, []);

  const verifyPin = useCallback(async (pin: string): Promise<boolean> => {
    try {
      let stored: string | null = null;
      if (Platform.OS === "web") {
        stored = await AsyncStorage.getItem("bbb_pin");
      } else {
        stored = await SecureStore.getItemAsync("bbb_pin");
      }
      return stored === pin;
    } catch {
      return false;
    }
  }, []);

  const authenticateWithBiometrics = useCallback(async (): Promise<boolean> => {
    if (Platform.OS === "web") return true;
    try {
      const result = await LocalAuthentication.authenticateAsync({
        promptMessage: "Authenticate to BigBankBonus",
        fallbackLabel: "Use PIN",
        cancelLabel: "Cancel",
      });
      return result.success;
    } catch {
      return false;
    }
  }, []);

  return (
    <AuthContext.Provider
      value={{
        user,
        isLoading,
        isAuthenticated: !!user,
        isPinSet,
        isBiometricsAvailable,
        signIn,
        signOut,
        setPin,
        verifyPin,
        authenticateWithBiometrics,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within AuthProvider");
  return ctx;
}
