import { Feather } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";
import { LinearGradient } from "expo-linear-gradient";
import * as Sharing from "expo-sharing";
import { router } from "expo-router";
import React, { useCallback, useEffect, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  Platform,
  Pressable,
  ScrollView,
  Share,
  StyleSheet,
  Switch,
  Text,
  TextInput,
  View,
  useColorScheme,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import * as FileSystem from "expo-file-system";

import Colors from "@/constants/colors";
import { useAuth } from "@/context/AuthContext";
import { CHROME_EXTENSION_TEMPLATE } from "@/constants/banks";

function SettingsRow({ icon, label, sublabel, onPress, right, tint }: {
  icon: string; label: string; sublabel?: string; onPress?: () => void;
  right?: React.ReactNode; tint?: string;
}) {
  const colorScheme = useColorScheme();
  const isDark = colorScheme === "dark";
  const c = isDark ? Colors.dark : Colors.light;

  return (
    <Pressable
      style={({ pressed }) => [sStyles.row, { borderBottomColor: c.separator, opacity: pressed && !!onPress ? 0.7 : 1 }]}
      onPress={onPress}
    >
      <View style={[sStyles.rowIcon, { backgroundColor: (tint || c.tintSecondary) + "22" }]}>
        <Feather name={icon as any} size={18} color={tint || c.tintSecondary} />
      </View>
      <View style={sStyles.rowContent}>
        <Text style={[sStyles.rowLabel, { color: c.text }]}>{label}</Text>
        {sublabel && <Text style={[sStyles.rowSublabel, { color: c.textSecondary }]}>{sublabel}</Text>}
      </View>
      {right || (onPress && <Feather name="chevron-right" size={18} color={c.textTertiary} />)}
    </Pressable>
  );
}

function BankScoreSection({ userId, c, isDark }: { userId: string; c: typeof Colors.light; isDark: boolean }) {
  const [bankScore, setBankScore] = useState("");
  const [ewsScore, setEwsScore] = useState("");
  const [savedScore, setSavedScore] = useState<number | null>(null);
  const [saving, setSaving] = useState(false);
  const [loadingScore, setLoadingScore] = useState(true);

  useEffect(() => {
    const fetchScore = async () => {
      try {
        const domain = process.env.EXPO_PUBLIC_DOMAIN;
        const baseUrl = domain ? `https://${domain}` : "http://localhost:8080";
        const res = await fetch(`${baseUrl}/api/profile/score?userId=${encodeURIComponent(userId)}`);
        if (res.ok) {
          const data = await res.json();
          if (data.bankScore) {
            setSavedScore(data.bankScore);
            setBankScore(String(data.bankScore));
          }
          if (data.ewsScore) setEwsScore(String(data.ewsScore));
        }
      } catch {}
      setLoadingScore(false);
    };
    fetchScore();
  }, [userId]);

  const handleSave = async () => {
    const scoreNum = parseInt(bankScore, 10);
    if (isNaN(scoreNum) || scoreNum < 100 || scoreNum > 900) {
      Alert.alert("Invalid Score", "Please enter a valid score between 100 and 900.");
      return;
    }
    setSaving(true);
    try {
      const domain = process.env.EXPO_PUBLIC_DOMAIN;
      const baseUrl = domain ? `https://${domain}` : "http://localhost:8080";
      const body: Record<string, any> = { userId, bankScore: scoreNum };
      if (ewsScore) body.ewsScore = parseInt(ewsScore, 10);
      const res = await fetch(`${baseUrl}/api/profile/score`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      if (res.ok) {
        setSavedScore(scoreNum);
        if (Platform.OS !== "web") Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
        Alert.alert(
          "Score Saved",
          scoreNum >= 700
            ? `Your score of ${scoreNum} unlocks AI strategy recommendations! Visit the Strategy tab to see your personalized plan.`
            : `Score saved. A score of 700+ unlocks personalized AI strategy recommendations.`
        );
      }
    } catch {
      Alert.alert("Error", "Could not save your score. Please try again.");
    }
    setSaving(false);
  };

  const scoreColor = savedScore
    ? savedScore >= 750 ? "#4CAF50" : savedScore >= 700 ? "#FFB300" : "#F44336"
    : c.textSecondary;

  return (
    <View style={bsStyles.wrap}>
      <View style={bsStyles.header}>
        <LinearGradient colors={["#833AB4", "#E1306C"]} style={bsStyles.headerIcon}>
          <Feather name="target" size={14} color="#fff" />
        </LinearGradient>
        <View style={{ flex: 1 }}>
          <Text style={[bsStyles.title, { color: c.text }]}>Bank Score</Text>
          <Text style={[bsStyles.subtitle, { color: c.textSecondary }]}>Score 700+ unlocks AI strategy</Text>
        </View>
        {savedScore && (
          <View style={[bsStyles.scoreBadge, { backgroundColor: scoreColor + "22" }]}>
            <Text style={[bsStyles.scoreBadgeText, { color: scoreColor }]}>{savedScore}</Text>
          </View>
        )}
      </View>

      {loadingScore ? (
        <ActivityIndicator color="#833AB4" style={{ marginVertical: 10 }} />
      ) : (
        <>
          <Text style={[bsStyles.label, { color: c.textSecondary }]}>ChexSystems / EWS Score</Text>
          <TextInput
            style={[bsStyles.input, { backgroundColor: c.backgroundSecondary, color: c.text, borderColor: c.cardBorder }]}
            placeholder="e.g. 720"
            placeholderTextColor={c.textTertiary}
            value={bankScore}
            onChangeText={t => setBankScore(t.replace(/\D/g, "").slice(0, 3))}
            keyboardType="number-pad"
            maxLength={3}
          />
          <Text style={[bsStyles.hint, { color: c.textTertiary }]}>
            {bankScore && parseInt(bankScore) >= 700
              ? "Excellent! Your score qualifies for AI recommendations."
              : "Score of 700+ required to unlock personalized AI strategy."}
          </Text>
          <Pressable onPress={handleSave} disabled={saving} style={bsStyles.saveBtn}>
            <LinearGradient colors={["#833AB4", "#E1306C"]} start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }} style={bsStyles.saveBtnGrad}>
              {saving ? <ActivityIndicator color="#fff" size="small" /> : <><Feather name="check" size={14} color="#fff" /><Text style={bsStyles.saveBtnText}>Save Score</Text></>}
            </LinearGradient>
          </Pressable>
        </>
      )}
    </View>
  );
}

const bsStyles = StyleSheet.create({
  wrap: { marginHorizontal: 16, marginTop: 20 },
  header: { flexDirection: "row", alignItems: "center", gap: 10, marginBottom: 12 },
  headerIcon: { width: 32, height: 32, borderRadius: 10, alignItems: "center", justifyContent: "center" },
  title: { fontSize: 13, fontFamily: "Inter_700Bold", textTransform: "uppercase", letterSpacing: 1 },
  subtitle: { fontSize: 11, fontFamily: "Inter_400Regular", marginTop: 1 },
  scoreBadge: { paddingHorizontal: 10, paddingVertical: 4, borderRadius: 10 },
  scoreBadgeText: { fontSize: 15, fontFamily: "Inter_700Bold" },
  label: { fontSize: 12, fontFamily: "Inter_600SemiBold", marginBottom: 6 },
  input: { borderWidth: 1, borderRadius: 12, paddingHorizontal: 14, paddingVertical: 12, fontSize: 18, fontFamily: "Inter_700Bold", marginBottom: 6 },
  hint: { fontSize: 11, fontFamily: "Inter_400Regular", marginBottom: 12 },
  saveBtn: { borderRadius: 12, overflow: "hidden" },
  saveBtnGrad: { flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 6, paddingVertical: 12 },
  saveBtnText: { fontSize: 14, fontFamily: "Inter_700Bold", color: "#fff" },
});

export default function SettingsScreen() {
  const insets = useSafeAreaInsets();
  const colorScheme = useColorScheme();
  const isDark = colorScheme === "dark";
  const c = isDark ? Colors.dark : Colors.light;
  const { user, signOut, isBiometricsAvailable } = useAuth();
  const [biometricsEnabled, setBiometricsEnabled] = useState(true);

  const handleDownloadExtension = async () => {
    if (Platform.OS !== "web") Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    const json = JSON.stringify(CHROME_EXTENSION_TEMPLATE, null, 2);
    try {
      if (Platform.OS === "web") {
        const blob = new Blob([json], { type: "application/json" });
        const url = URL.createObjectURL(blob);
        const a = document.createElement("a");
        a.href = url;
        a.download = "bigbankbonus-autofill-extension.json";
        a.click();
        URL.revokeObjectURL(url);
      } else {
        const path = FileSystem.documentDirectory + "bigbankbonus-autofill-extension.json";
        await FileSystem.writeAsStringAsync(path, json);
        if (await Sharing.isAvailableAsync()) {
          await Sharing.shareAsync(path, { mimeType: "application/json" });
        } else {
          Share.share({ message: "BigBankBonus AutoFill Extension\n\n" + json });
        }
      }
      Alert.alert("Extension Ready", "The Chrome autofill extension template has been downloaded. Open Chrome > Extensions > Load unpacked to install.");
    } catch (e) {
      Alert.alert("Error", "Could not download extension. Please try again.");
    }
  };

  const handleSignOut = () => {
    Alert.alert("Sign Out", "Are you sure you want to sign out?", [
      { text: "Cancel", style: "cancel" },
      {
        text: "Sign Out",
        style: "destructive",
        onPress: async () => {
          await signOut();
          router.replace("/auth");
        },
      },
    ]);
  };

  return (
    <View style={[sStyles.container, { backgroundColor: c.background }]}>
      <View style={[sStyles.header, { paddingTop: insets.top + (Platform.OS === "web" ? 67 : 12) }]}>
        <LinearGradient colors={["#833AB4", "#E1306C"]} style={StyleSheet.absoluteFill} />
        <View style={sStyles.headerRow}>
          <Pressable style={sStyles.backBtn} onPress={() => router.back()}>
            <Feather name="x" size={20} color="#fff" />
          </Pressable>
          <Text style={sStyles.headerTitle}>Settings</Text>
          <View style={{ width: 36 }} />
        </View>
        {user && (
          <View style={sStyles.profileRow}>
            <View style={sStyles.avatar}>
              <LinearGradient colors={["#F77737", "#E1306C"]} style={StyleSheet.absoluteFill} />
              <Text style={sStyles.avatarText}>{user.name.charAt(0)}</Text>
            </View>
            <View>
              <Text style={sStyles.profileName}>{user.name}</Text>
              <Text style={sStyles.profileEmail}>{user.email}</Text>
            </View>
          </View>
        )}
      </View>

      <ScrollView contentContainerStyle={{ paddingBottom: insets.bottom + (Platform.OS === "web" ? 34 : 40) }}>

        {/* Pro upgrade banner */}
        <Pressable onPress={() => router.push("/subscription")} style={{ marginHorizontal: 16, marginTop: 12, marginBottom: 4, borderRadius: 16, overflow: "hidden" }}>
          <LinearGradient colors={["#833AB4", "#E1306C", "#F77737"]} style={{ flexDirection: "row", alignItems: "center", padding: 16, gap: 12 }} start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }}>
            <View style={{ flex: 1 }}>
              <Text style={{ fontSize: 15, fontFamily: "Inter_700Bold", color: "#fff" }}>Upgrade to Pro</Text>
              <Text style={{ fontSize: 12, fontFamily: "Inter_400Regular", color: "rgba(255,255,255,0.85)", marginTop: 2 }}>
                All 200+ live deals · AI agent · Autopay scheduler
              </Text>
            </View>
            <View style={{ backgroundColor: "rgba(255,255,255,0.25)", borderRadius: 20, paddingHorizontal: 12, paddingVertical: 6 }}>
              <Text style={{ fontSize: 12, fontFamily: "Inter_700Bold", color: "#fff" }}>$6.99/mo</Text>
            </View>
            <Feather name="arrow-right" size={16} color="#fff" />
          </LinearGradient>
        </Pressable>

        {/* Bank Score Section */}
        <View style={[sStyles.sectionCard, { backgroundColor: c.card, borderColor: c.cardBorder, marginHorizontal: 16, marginTop: 16, borderWidth: 1, borderRadius: 16, overflow: "hidden" }]}>
          <BankScoreSection userId={user?.id ?? "demo-user"} c={c} isDark={isDark} />
        </View>

        <View style={sStyles.section}>
          <Text style={[sStyles.sectionLabel, { color: c.textSecondary }]}>SECURITY</Text>
          <View style={[sStyles.sectionCard, { backgroundColor: c.card, borderColor: c.cardBorder }]}>
            {isBiometricsAvailable && (
              <SettingsRow
                icon="fingerprint"
                label="Biometric Login"
                sublabel="Use Face ID or Touch ID"
                tint="#00C853"
                right={<Switch value={biometricsEnabled} onValueChange={setBiometricsEnabled} trackColor={{ false: "#ccc", true: "#833AB4" }} />}
              />
            )}
            <SettingsRow icon="lock" label="Change PIN" sublabel="Update your 6-digit PIN" tint="#833AB4" onPress={() => router.push("/pin")} />
          </View>
        </View>

        <View style={sStyles.section}>
          <Text style={[sStyles.sectionLabel, { color: c.textSecondary }]}>TOOLS</Text>
          <View style={[sStyles.sectionCard, { backgroundColor: c.card, borderColor: c.cardBorder }]}>
            <SettingsRow
              icon="download"
              label="Download Chrome Extension"
              sublabel="AutoFill template for bank signups"
              tint="#2196F3"
              onPress={handleDownloadExtension}
            />
            <SettingsRow
              icon="chrome"
              label="Extension Setup Guide"
              sublabel="How to install the autofill extension"
              tint="#F77737"
              onPress={() => Alert.alert(
                "Chrome Extension Setup",
                "1. Download the extension JSON file\n2. Open Chrome and go to chrome://extensions\n3. Enable Developer Mode (top right)\n4. Click 'Load unpacked'\n5. Select the downloaded extension folder\n\nThe extension will auto-fill your info on bank signup pages.",
                [{ text: "Got it" }]
              )}
            />
          </View>
        </View>

        <View style={sStyles.section}>
          <Text style={[sStyles.sectionLabel, { color: c.textSecondary }]}>LEGAL</Text>
          <View style={[sStyles.sectionCard, { backgroundColor: c.card, borderColor: c.cardBorder }]}>
            <SettingsRow icon="shield" label="Privacy Policy" sublabel="How we handle your data" tint="#833AB4" onPress={() => router.push("/legal")} />
            <SettingsRow icon="file-text" label="Terms of Service" sublabel="Usage rules, fees, and disclaimers" tint="#E1306C" onPress={() => router.push("/legal")} />
            <SettingsRow icon="mail" label="Contact Support" sublabel="support@bigbankbonus.com" tint="#F77737" onPress={() => { const { Linking } = require("react-native"); Linking.openURL("mailto:support@bigbankbonus.com"); }} />
          </View>
        </View>

        <View style={sStyles.section}>
          <Text style={[sStyles.sectionLabel, { color: c.textSecondary }]}>INTEGRATIONS</Text>
          <View style={[sStyles.sectionCard, { backgroundColor: c.card, borderColor: c.cardBorder }]}>
            <SettingsRow
              icon="credit-card"
              label="Stripe Connection"
              sublabel="Ready for BigBankBonus.com integration"
              tint="#6772E5"
              right={<View style={[sStyles.statusBadge, { backgroundColor: "#00C85322" }]}><Text style={[sStyles.statusText, { color: "#00C853" }]}>Ready</Text></View>}
            />
            <SettingsRow
              icon="activity"
              label="BBB Business Checking"
              sublabel="Link to BigBankBonus.com account"
              tint="#00C853"
              right={<View style={[sStyles.statusBadge, { backgroundColor: "#FFB30022" }]}><Text style={[sStyles.statusText, { color: "#FFB300" }]}>Connect</Text></View>}
              onPress={() => Alert.alert("Coming Soon", "Direct integration with BigBankBonus.com business checking will be available in the next update.")}
            />
          </View>
        </View>

        <View style={sStyles.section}>
          <Text style={[sStyles.sectionLabel, { color: c.textSecondary }]}>ABOUT</Text>
          <View style={[sStyles.sectionCard, { backgroundColor: c.card, borderColor: c.cardBorder }]}>
            <SettingsRow icon="info" label="Version" sublabel="1.0.0 · BigBankBonus" tint="#607D8B" />
            <SettingsRow icon="globe" label="BigBankBonus.com" tint="#2196F3" onPress={() => {}} />
            <SettingsRow icon="shield" label="Privacy Policy" tint="#9C27B0" onPress={() => {}} />
            <SettingsRow icon="file-text" label="Terms of Service" tint="#607D8B" onPress={() => {}} />
          </View>
        </View>

        <Pressable style={sStyles.signOutBtn} onPress={handleSignOut}>
          <Feather name="log-out" size={18} color="#F44336" />
          <Text style={sStyles.signOutText}>Sign Out</Text>
        </Pressable>
      </ScrollView>
    </View>
  );
}

const sStyles = StyleSheet.create({
  container: { flex: 1 },
  header: { paddingHorizontal: 16, paddingBottom: 20 },
  headerRow: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", marginBottom: 16 },
  backBtn: { width: 36, height: 36, backgroundColor: "rgba(255,255,255,0.15)", borderRadius: 10, alignItems: "center", justifyContent: "center" },
  headerTitle: { fontSize: 18, fontFamily: "Inter_700Bold", color: "#fff" },
  profileRow: { flexDirection: "row", alignItems: "center", gap: 12 },
  avatar: { width: 48, height: 48, borderRadius: 14, overflow: "hidden", alignItems: "center", justifyContent: "center" },
  avatarText: { fontSize: 20, fontFamily: "Inter_700Bold", color: "#fff" },
  profileName: { fontSize: 16, fontFamily: "Inter_700Bold", color: "#fff" },
  profileEmail: { fontSize: 13, fontFamily: "Inter_400Regular", color: "rgba(255,255,255,0.7)" },
  section: { paddingHorizontal: 16, marginTop: 20 },
  sectionLabel: { fontSize: 11, fontFamily: "Inter_700Bold", letterSpacing: 2, marginBottom: 8 },
  sectionCard: { borderRadius: 16, borderWidth: 1, overflow: "hidden" },
  row: { flexDirection: "row", alignItems: "center", gap: 12, padding: 14, borderBottomWidth: 1 },
  rowIcon: { width: 36, height: 36, borderRadius: 10, alignItems: "center", justifyContent: "center" },
  rowContent: { flex: 1 },
  rowLabel: { fontSize: 15, fontFamily: "Inter_600SemiBold" },
  rowSublabel: { fontSize: 12, fontFamily: "Inter_400Regular", marginTop: 2 },
  statusBadge: { paddingHorizontal: 10, paddingVertical: 4, borderRadius: 8 },
  statusText: { fontSize: 12, fontFamily: "Inter_600SemiBold" },
  signOutBtn: { flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 8, margin: 16, paddingVertical: 16, borderRadius: 14, backgroundColor: "#F4433614", borderWidth: 1, borderColor: "#F4433622", marginTop: 8 },
  signOutText: { fontSize: 16, fontFamily: "Inter_600SemiBold", color: "#F44336" },
});
