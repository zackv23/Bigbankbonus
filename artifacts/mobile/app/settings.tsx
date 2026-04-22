import { Feather } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";
import { LinearGradient } from "expo-linear-gradient";
import * as Sharing from "expo-sharing";
import { router } from "expo-router";
import * as Notifications from "expo-notifications";
import AsyncStorage from "@react-native-async-storage/async-storage";
import React, { useCallback, useEffect, useRef, useState } from "react";
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
  Linking,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import * as FileSystem from "expo-file-system/legacy";

import Colors from "@/constants/colors";
import { useAuth } from "@/context/AuthContext";
import { CHROME_EXTENSION_TEMPLATE } from "@/constants/banks";

const BASE_URL = process.env.EXPO_PUBLIC_DOMAIN
  ? `https://${process.env.EXPO_PUBLIC_DOMAIN}`
  : "http://localhost:8080";

// ─── Reusable row ────────────────────────────────────────────────────────────

function SettingsRow({ icon, label, sublabel, onPress, right, tint, last }: {
  icon: string; label: string; sublabel?: string; onPress?: () => void;
  right?: React.ReactNode; tint?: string; last?: boolean;
}) {
  const colorScheme = useColorScheme();
  const isDark = colorScheme === "dark";
  const c = isDark ? Colors.dark : Colors.light;

  return (
    <Pressable
      style={({ pressed }) => [
        sS.row,
        { borderBottomColor: last ? "transparent" : c.separator, opacity: pressed && !!onPress ? 0.7 : 1 },
      ]}
      onPress={onPress}
    >
      <View style={[sS.rowIcon, { backgroundColor: (tint ?? c.tintSecondary) + "22" }]}>
        <Feather name={icon as any} size={18} color={tint ?? c.tintSecondary} />
      </View>
      <View style={sS.rowContent}>
        <Text style={[sS.rowLabel, { color: c.text }]}>{label}</Text>
        {sublabel && <Text style={[sS.rowSublabel, { color: c.textSecondary }]}>{sublabel}</Text>}
      </View>
      {right ?? (onPress ? <Feather name="chevron-right" size={18} color={c.textTertiary} /> : null)}
    </Pressable>
  );
}

function SectionHeader({ label }: { label: string }) {
  const c = (useColorScheme() === "dark" ? Colors.dark : Colors.light);
  return <Text style={[sS.sectionLabel, { color: c.textSecondary }]}>{label}</Text>;
}

// ─── Bank Score section ──────────────────────────────────────────────────────

function BankScoreSection({ userId, c, isDark }: { userId: string; c: typeof Colors.light; isDark: boolean }) {
  const [bankScore, setBankScore] = useState("");
  const [ewsScore, setEwsScore]   = useState("");
  const [savedScore, setSavedScore] = useState<number | null>(null);
  const [saving, setSaving]       = useState(false);
  const [loading, setLoading]     = useState(true);

  useEffect(() => {
    (async () => {
      try {
        const res = await fetch(`${BASE_URL}/api/profile/score?userId=${encodeURIComponent(userId)}`);
        if (res.ok) {
          const data = await res.json();
          if (data.bankScore) { setSavedScore(data.bankScore); setBankScore(String(data.bankScore)); }
          if (data.ewsScore)  setEwsScore(String(data.ewsScore));
        }
      } catch {}
      setLoading(false);
    })();
  }, [userId]);

  const handleSave = async () => {
    const n = parseInt(bankScore, 10);
    if (isNaN(n) || n < 100 || n > 900) {
      Alert.alert("Invalid Score", "Enter a valid score between 100 and 900."); return;
    }
    setSaving(true);
    try {
      const body: Record<string, any> = { userId, bankScore: n };
      if (ewsScore) body.ewsScore = parseInt(ewsScore, 10);
      const res = await fetch(`${BASE_URL}/api/profile/score`, {
        method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(body),
      });
      if (res.ok) {
        setSavedScore(n);
        if (Platform.OS !== "web") Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
        Alert.alert("Score Saved", n >= 700
          ? `Score of ${n} unlocks AI strategy! Visit the Strategy tab.`
          : `Score saved. 700+ unlocks personalized AI strategy.`);
      }
    } catch {
      Alert.alert("Error", "Could not save score. Try again.");
    }
    setSaving(false);
  };

  const scoreColor = savedScore
    ? savedScore >= 750 ? "#4CAF50" : savedScore >= 700 ? "#FFB300" : "#F44336"
    : c.textSecondary;

  return (
    <View style={bS.wrap}>
      <View style={bS.header}>
        <LinearGradient colors={["#833AB4", "#E1306C"]} style={bS.headerIcon}>
          <Feather name="target" size={14} color="#fff" />
        </LinearGradient>
        <View style={{ flex: 1 }}>
          <Text style={[bS.title, { color: c.text }]}>Bank Score</Text>
          <Text style={[bS.subtitle, { color: c.textSecondary }]}>Score 700+ unlocks AI strategy</Text>
        </View>
        {savedScore != null && (
          <View style={[bS.badge, { backgroundColor: scoreColor + "22" }]}>
            <Text style={[bS.badgeText, { color: scoreColor }]}>{savedScore}</Text>
          </View>
        )}
      </View>
      {loading ? <ActivityIndicator color="#833AB4" style={{ marginVertical: 10 }} /> : (
        <>
          <Text style={[bS.label, { color: c.textSecondary }]}>ChexSystems / EWS Score</Text>
          <TextInput
            style={[bS.input, { backgroundColor: c.backgroundSecondary, color: c.text, borderColor: c.cardBorder }]}
            placeholder="e.g. 720" placeholderTextColor={c.textTertiary}
            value={bankScore} onChangeText={t => setBankScore(t.replace(/\D/g, "").slice(0, 3))}
            keyboardType="number-pad" maxLength={3}
          />
          <Text style={[bS.hint, { color: c.textTertiary }]}>
            {bankScore && parseInt(bankScore) >= 700 ? "Excellent! Qualifies for AI recommendations." : "700+ required for personalized AI strategy."}
          </Text>
          <Pressable onPress={handleSave} disabled={saving} style={bS.btn}>
            <LinearGradient colors={["#833AB4", "#E1306C"]} start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }} style={bS.btnGrad}>
              {saving ? <ActivityIndicator color="#fff" size="small" /> : (
                <><Feather name="check" size={14} color="#fff" /><Text style={bS.btnText}>Save Score</Text></>
              )}
            </LinearGradient>
          </Pressable>
        </>
      )}
    </View>
  );
}

// ─── Notifications section ───────────────────────────────────────────────────

function NotificationsSection({ userId, c, isDark }: { userId: string; c: typeof Colors.light; isDark: boolean }) {
  const [emailEnabled, setEmailEnabled] = useState(false);
  const [emailAddr, setEmailAddr]       = useState("");
  const [smsEnabled, setSmsEnabled]     = useState(false);
  const [phoneNum, setPhoneNum]         = useState("");
  const [pushEnabled, setPushEnabled]   = useState(false);
  const [saving, setSaving]             = useState(false);
  const [loading, setLoading]           = useState(true);
  const mounted = useRef(true);

  useEffect(() => {
    (async () => {
      const [em, ea, sm, ph, pe] = await Promise.all([
        AsyncStorage.getItem("bbb_notify_email_enabled"),
        AsyncStorage.getItem("bbb_notify_email_addr"),
        AsyncStorage.getItem("bbb_notify_sms_enabled"),
        AsyncStorage.getItem("bbb_notify_phone"),
        AsyncStorage.getItem("bbb_notify_push_enabled"),
      ]);
      if (!mounted.current) return;
      if (em === "true") setEmailEnabled(true);
      if (ea) setEmailAddr(ea);
      if (sm === "true") setSmsEnabled(true);
      if (ph) setPhoneNum(ph);
      if (pe === "true") setPushEnabled(true);
      setLoading(false);
    })();
    return () => { mounted.current = false; };
  }, []);

  const requestPushPermission = async (): Promise<boolean> => {
    if (Platform.OS === "web") return false;
    const { status } = await Notifications.requestPermissionsAsync();
    return status === "granted";
  };

  const handlePushToggle = async (val: boolean) => {
    if (val) {
      const granted = await requestPushPermission();
      if (!granted) {
        Alert.alert(
          "Push Notifications Disabled",
          "Enable notifications in your device Settings to receive push alerts.",
          [
            { text: "Open Settings", onPress: () => Linking.openSettings() },
            { text: "Cancel", style: "cancel" },
          ],
        );
        return;
      }
    }
    setPushEnabled(val);
    await AsyncStorage.setItem("bbb_notify_push_enabled", val ? "true" : "false");
  };

  const handleSave = async () => {
    if (emailEnabled && !emailAddr.includes("@")) {
      Alert.alert("Invalid Email", "Please enter a valid email address."); return;
    }
    if (smsEnabled && phoneNum.replace(/\D/g, "").length < 10) {
      Alert.alert("Invalid Phone", "Please enter a valid 10-digit US phone number."); return;
    }
    setSaving(true);
    try {
      await AsyncStorage.multiSet([
        ["bbb_notify_email_enabled", emailEnabled ? "true" : "false"],
        ["bbb_notify_email_addr",    emailAddr],
        ["bbb_notify_sms_enabled",   smsEnabled ? "true" : "false"],
        ["bbb_notify_phone",         phoneNum],
        ["bbb_notify_push_enabled",  pushEnabled ? "true" : "false"],
      ]);

      // Sync prefs to all active autopay schedules on the server
      await fetch(`${BASE_URL}/api/autopay/notify-prefs`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          userId,
          notifyEmail: emailEnabled ? emailAddr : null,
          notifyPhone: smsEnabled  ? formatE164(phoneNum) : null,
        }),
      });

      if (Platform.OS !== "web") Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      Alert.alert("Saved", "Your notification preferences have been updated.");
    } catch {
      Alert.alert("Error", "Could not save preferences. Try again.");
    }
    setSaving(false);
  };

  function formatE164(raw: string): string {
    const digits = raw.replace(/\D/g, "");
    return digits.startsWith("1") ? `+${digits}` : `+1${digits}`;
  }

  const fieldStyle = [nS.input, { backgroundColor: c.backgroundSecondary, color: c.text, borderColor: c.cardBorder }];

  if (loading) return <ActivityIndicator color="#833AB4" style={{ margin: 20 }} />;

  return (
    <View style={nS.wrap}>
      {/* Push */}
      <View style={[nS.row, { borderBottomColor: c.separator }]}>
        <View style={[nS.iconWrap, { backgroundColor: "#F7773722" }]}>
          <Feather name="bell" size={18} color="#F77737" />
        </View>
        <View style={nS.content}>
          <Text style={[nS.label, { color: c.text }]}>Push Notifications</Text>
          <Text style={[nS.sub, { color: c.textSecondary }]}>Autopay cycle alerts in-app</Text>
        </View>
        <Switch
          value={pushEnabled}
          onValueChange={handlePushToggle}
          trackColor={{ false: "#ccc", true: "#F77737" }}
          thumbColor={Platform.OS === "android" ? (pushEnabled ? "#fff" : "#f4f3f4") : undefined}
        />
      </View>

      {/* Email */}
      <View style={[nS.row, { borderBottomColor: c.separator }]}>
        <View style={[nS.iconWrap, { backgroundColor: "#E1306C22" }]}>
          <Feather name="mail" size={18} color="#E1306C" />
        </View>
        <View style={nS.content}>
          <Text style={[nS.label, { color: c.text }]}>Email Alerts</Text>
          <Text style={[nS.sub, { color: c.textSecondary }]}>Push, pull, and statement emails</Text>
        </View>
        <Switch
          value={emailEnabled}
          onValueChange={setEmailEnabled}
          trackColor={{ false: "#ccc", true: "#E1306C" }}
          thumbColor={Platform.OS === "android" ? (emailEnabled ? "#fff" : "#f4f3f4") : undefined}
        />
      </View>
      {emailEnabled && (
        <View style={[nS.inputWrap, { borderBottomColor: c.separator }]}>
          <TextInput
            style={fieldStyle}
            value={emailAddr}
            onChangeText={setEmailAddr}
            placeholder="you@example.com"
            placeholderTextColor={c.textTertiary}
            keyboardType="email-address"
            autoCapitalize="none"
            autoCorrect={false}
          />
        </View>
      )}

      {/* SMS */}
      <View style={[nS.row, { borderBottomColor: c.separator }]}>
        <View style={[nS.iconWrap, { backgroundColor: "#833AB422" }]}>
          <Feather name="message-circle" size={18} color="#833AB4" />
        </View>
        <View style={nS.content}>
          <Text style={[nS.label, { color: c.text }]}>SMS / Text Alerts</Text>
          <Text style={[nS.sub, { color: c.textSecondary }]}>Via Twilio — US numbers only</Text>
        </View>
        <Switch
          value={smsEnabled}
          onValueChange={setSmsEnabled}
          trackColor={{ false: "#ccc", true: "#833AB4" }}
          thumbColor={Platform.OS === "android" ? (smsEnabled ? "#fff" : "#f4f3f4") : undefined}
        />
      </View>
      {smsEnabled && (
        <View style={[nS.inputWrap, { borderBottomColor: c.separator }]}>
          <TextInput
            style={fieldStyle}
            value={phoneNum}
            onChangeText={t => setPhoneNum(t.replace(/[^\d\s\-().+]/g, ""))}
            placeholder="(555) 867-5309"
            placeholderTextColor={c.textTertiary}
            keyboardType="phone-pad"
          />
        </View>
      )}

      {/* Save button */}
      <Pressable onPress={handleSave} disabled={saving} style={{ margin: 14 }}>
        <LinearGradient
          colors={["#833AB4", "#E1306C", "#F77737"]}
          start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }}
          style={nS.saveBtn}
        >
          {saving
            ? <ActivityIndicator color="#fff" size="small" />
            : <><Feather name="save" size={16} color="#fff" /><Text style={nS.saveText}>Save Preferences</Text></>}
        </LinearGradient>
      </Pressable>
    </View>
  );
}

// ─── Main screen ─────────────────────────────────────────────────────────────

export default function SettingsScreen() {
  const insets      = useSafeAreaInsets();
  const colorScheme = useColorScheme();
  const isDark      = colorScheme === "dark";
  const c           = isDark ? Colors.dark : Colors.light;
  const { user, signOut, isBiometricsAvailable } = useAuth();

  // ── Biometrics toggle ────────────────────────────────────────────────────
  const [biometricsEnabled, setBiometricsEnabled] = useState(false);
  const [biometricsLoading, setBiometricsLoading]  = useState(true);

  useEffect(() => {
    AsyncStorage.getItem("bbb_biometrics_enabled").then(v => {
      setBiometricsEnabled(v === "true");
      setBiometricsLoading(false);
    });
  }, []);

  const handleBiometricsToggle = async (val: boolean) => {
    if (Platform.OS !== "web") Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    await AsyncStorage.setItem("bbb_biometrics_enabled", val ? "true" : "false");
    setBiometricsEnabled(val);
    if (val) {
      Alert.alert(
        "Biometric Login Enabled",
        "You'll be prompted to authenticate with Face ID / Touch ID when the app returns from background (after 30 seconds).",
      );
    }
  };

  // ── Chrome extension download ────────────────────────────────────────────
  const handleDownloadExtension = async () => {
    if (Platform.OS !== "web") Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    const json = JSON.stringify(CHROME_EXTENSION_TEMPLATE, null, 2);
    try {
      if (Platform.OS === "web") {
        const blob = new Blob([json], { type: "application/json" });
        const url = URL.createObjectURL(blob);
        const a = document.createElement("a");
        a.href = url; a.download = "bigbankbonus-autofill-extension.json"; a.click();
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
      Alert.alert("Extension Ready", "Open Chrome › Extensions › Load unpacked to install.");
    } catch {
      Alert.alert("Error", "Could not download extension. Try again.");
    }
  };

  const handleSignOut = () => {
    Alert.alert("Sign Out", "Are you sure?", [
      { text: "Cancel", style: "cancel" },
      { text: "Sign Out", style: "destructive", onPress: async () => { await signOut(); router.replace("/auth"); } },
    ]);
  };

  return (
    <View style={[sS.container, { backgroundColor: c.background }]}>
      {/* ── Header ── */}
      <View style={[sS.header, { paddingTop: insets.top + (Platform.OS === "web" ? 67 : 12) }]}>
        <LinearGradient colors={["#833AB4", "#E1306C"]} style={StyleSheet.absoluteFill} />
        <View style={sS.headerRow}>
          <Pressable style={sS.backBtn} onPress={() => router.back()}>
            <Feather name="x" size={20} color="#fff" />
          </Pressable>
          <Text style={sS.headerTitle}>Settings</Text>
          <View style={{ width: 36 }} />
        </View>
        {user && (
          <View style={sS.profileRow}>
            <View style={sS.avatar}>
              <LinearGradient colors={["#F77737", "#E1306C"]} style={StyleSheet.absoluteFill} />
              <Text style={sS.avatarText}>{user.name.charAt(0)}</Text>
            </View>
            <View>
              <Text style={sS.profileName}>{user.name}</Text>
              <Text style={sS.profileEmail}>{user.email}</Text>
            </View>
          </View>
        )}
      </View>

      <ScrollView contentContainerStyle={{ paddingBottom: insets.bottom + 40 }}>

        {/* ── Pro upgrade banner ── */}
        <Pressable onPress={() => router.push("/subscription")} style={{ marginHorizontal: 16, marginTop: 12, borderRadius: 16, overflow: "hidden" }}>
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

        {/* ── Bank Score ── */}
        <View style={[sS.card, { backgroundColor: c.card, borderColor: c.cardBorder, marginTop: 16 }]}>
          <BankScoreSection userId={user?.id ?? "demo-user"} c={c} isDark={isDark} />
        </View>

        {/* ── Security ── */}
        <View style={sS.section}>
          <SectionHeader label="SECURITY" />
          <View style={[sS.card, { backgroundColor: c.card, borderColor: c.cardBorder }]}>
            {isBiometricsAvailable && !biometricsLoading && (
              <SettingsRow
                icon="shield"
                label="Biometric Login"
                sublabel={biometricsEnabled ? "Face ID / Touch ID active — triggers after 30 s in background" : "Enable Face ID or Touch ID"}
                tint="#00C853"
                right={
                  <Switch
                    value={biometricsEnabled}
                    onValueChange={handleBiometricsToggle}
                    trackColor={{ false: "#ccc", true: "#00C853" }}
                    thumbColor={Platform.OS === "android" ? (biometricsEnabled ? "#fff" : "#f4f3f4") : undefined}
                  />
                }
              />
            )}
            <SettingsRow icon="lock" label="Change PIN" sublabel="Update your 6-digit PIN" tint="#833AB4" onPress={() => router.push("/pin")} last />
          </View>
        </View>

        {/* ── Notifications ── */}
        <View style={sS.section}>
          <SectionHeader label="NOTIFICATIONS" />
          <View style={[sS.card, { backgroundColor: c.card, borderColor: c.cardBorder, overflow: "hidden" }]}>
            <NotificationsSection userId={user?.id ?? "demo-user"} c={c} isDark={isDark} />
          </View>
        </View>

        {/* ── Tools ── */}
        <View style={sS.section}>
          <SectionHeader label="TOOLS" />
          <View style={[sS.card, { backgroundColor: c.card, borderColor: c.cardBorder }]}>
            <SettingsRow icon="download" label="Chrome Extension" sublabel="AutoFill template for bank signups" tint="#2196F3" onPress={handleDownloadExtension} />
            <SettingsRow
              icon="help-circle" label="Extension Setup Guide" sublabel="How to install the autofill extension" tint="#F77737"
              onPress={() => Alert.alert(
                "Chrome Extension Setup",
                "1. Download the extension JSON\n2. Open Chrome › chrome://extensions\n3. Enable Developer Mode\n4. Click 'Load unpacked'\n5. Select the downloaded folder\n\nThe extension auto-fills your info on bank signup pages.",
                [{ text: "Got it" }],
              )}
              last
            />
          </View>
        </View>

        {/* ── Integrations ── */}
        <View style={sS.section}>
          <SectionHeader label="INTEGRATIONS" />
          <View style={[sS.card, { backgroundColor: c.card, borderColor: c.cardBorder }]}>
            <SettingsRow
              icon="credit-card" label="Stripe Connection" sublabel="Subscription billing ready" tint="#6772E5"
              right={<View style={[sS.badge, { backgroundColor: "#00C85322" }]}><Text style={[sS.badgeText, { color: "#00C853" }]}>Ready</Text></View>}
            />
            <SettingsRow
              icon="activity" label="Plaid Bank Link" sublabel="Required for ACH autopay automation" tint="#00C853"
              right={<View style={[sS.badge, { backgroundColor: "#FFB30022" }]}><Text style={[sS.badgeText, { color: "#FFB300" }]}>Connect</Text></View>}
              onPress={() => Alert.alert("Plaid Linking", "Link your bank account via Plaid from the Hub tab to enable ACH autopay automation.")}
              last
            />
          </View>
        </View>

        {/* ── Legal ── */}
        <View style={sS.section}>
          <SectionHeader label="LEGAL" />
          <View style={[sS.card, { backgroundColor: c.card, borderColor: c.cardBorder }]}>
            <SettingsRow icon="shield" label="Privacy Policy" sublabel="How we handle your data" tint="#833AB4" onPress={() => router.push("/legal")} />
            <SettingsRow icon="file-text" label="Terms of Service" sublabel="Usage rules, fees, and disclaimers" tint="#E1306C" onPress={() => router.push("/legal")} />
            <SettingsRow icon="mail" label="Contact Support" sublabel="support@bigbankbonus.com" tint="#F77737" onPress={() => Linking.openURL("mailto:support@bigbankbonus.com")} last />
          </View>
        </View>

        {/* ── About ── */}
        <View style={sS.section}>
          <SectionHeader label="ABOUT" />
          <View style={[sS.card, { backgroundColor: c.card, borderColor: c.cardBorder }]}>
            <SettingsRow icon="info" label="Version" sublabel="1.0.0 · BigBankBonus" tint="#607D8B" />
            <SettingsRow icon="globe" label="BigBankBonus.com" tint="#2196F3" onPress={() => Linking.openURL("https://bigbankbonus.com")} last />
          </View>
        </View>

        {/* ── Sign Out ── */}
        <Pressable style={sS.signOutBtn} onPress={handleSignOut}>
          <Feather name="log-out" size={18} color="#F44336" />
          <Text style={sS.signOutText}>Sign Out</Text>
        </Pressable>

      </ScrollView>
    </View>
  );
}

// ─── Styles ──────────────────────────────────────────────────────────────────

const sS = StyleSheet.create({
  container:   { flex: 1 },
  header:      { paddingHorizontal: 16, paddingBottom: 20 },
  headerRow:   { flexDirection: "row", alignItems: "center", justifyContent: "space-between", marginBottom: 16 },
  backBtn:     { width: 36, height: 36, backgroundColor: "rgba(255,255,255,0.15)", borderRadius: 10, alignItems: "center", justifyContent: "center" },
  headerTitle: { fontSize: 18, fontFamily: "Inter_700Bold", color: "#fff" },
  profileRow:  { flexDirection: "row", alignItems: "center", gap: 12 },
  avatar:      { width: 48, height: 48, borderRadius: 14, overflow: "hidden", alignItems: "center", justifyContent: "center" },
  avatarText:  { fontSize: 20, fontFamily: "Inter_700Bold", color: "#fff" },
  profileName: { fontSize: 16, fontFamily: "Inter_700Bold", color: "#fff" },
  profileEmail:{ fontSize: 13, fontFamily: "Inter_400Regular", color: "rgba(255,255,255,0.7)" },
  section:     { paddingHorizontal: 16, marginTop: 20 },
  sectionLabel:{ fontSize: 11, fontFamily: "Inter_700Bold", letterSpacing: 2, marginBottom: 8 },
  card:        { borderRadius: 16, borderWidth: 1, overflow: "hidden" },
  row:         { flexDirection: "row", alignItems: "center", gap: 12, padding: 14, borderBottomWidth: 1 },
  rowIcon:     { width: 36, height: 36, borderRadius: 10, alignItems: "center", justifyContent: "center" },
  rowContent:  { flex: 1 },
  rowLabel:    { fontSize: 15, fontFamily: "Inter_600SemiBold" },
  rowSublabel: { fontSize: 12, fontFamily: "Inter_400Regular", marginTop: 2 },
  badge:       { paddingHorizontal: 10, paddingVertical: 4, borderRadius: 8 },
  badgeText:   { fontSize: 12, fontFamily: "Inter_600SemiBold" },
  signOutBtn:  { flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 8, margin: 16, paddingVertical: 16, borderRadius: 14, backgroundColor: "#F4433614", borderWidth: 1, borderColor: "#F4433622", marginTop: 8 },
  signOutText: { fontSize: 16, fontFamily: "Inter_600SemiBold", color: "#F44336" },
});

const bS = StyleSheet.create({
  wrap:     { marginHorizontal: 16, marginTop: 20, marginBottom: 4 },
  header:   { flexDirection: "row", alignItems: "center", gap: 10, marginBottom: 12 },
  headerIcon:{ width: 32, height: 32, borderRadius: 10, alignItems: "center", justifyContent: "center" },
  title:    { fontSize: 13, fontFamily: "Inter_700Bold", textTransform: "uppercase", letterSpacing: 1 },
  subtitle: { fontSize: 11, fontFamily: "Inter_400Regular", marginTop: 1 },
  badge:    { paddingHorizontal: 10, paddingVertical: 4, borderRadius: 10 },
  badgeText:{ fontSize: 15, fontFamily: "Inter_700Bold" },
  label:    { fontSize: 12, fontFamily: "Inter_600SemiBold", marginBottom: 6 },
  input:    { borderWidth: 1, borderRadius: 12, paddingHorizontal: 14, paddingVertical: 12, fontSize: 18, fontFamily: "Inter_700Bold", marginBottom: 6 },
  hint:     { fontSize: 11, fontFamily: "Inter_400Regular", marginBottom: 12 },
  btn:      { borderRadius: 12, overflow: "hidden", marginBottom: 4 },
  btnGrad:  { flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 6, paddingVertical: 12 },
  btnText:  { fontSize: 14, fontFamily: "Inter_700Bold", color: "#fff" },
});

const nS = StyleSheet.create({
  wrap:     { paddingTop: 4, paddingBottom: 4 },
  row:      { flexDirection: "row", alignItems: "center", gap: 12, paddingHorizontal: 14, paddingVertical: 14, borderBottomWidth: 1 },
  iconWrap: { width: 36, height: 36, borderRadius: 10, alignItems: "center", justifyContent: "center" },
  content:  { flex: 1 },
  label:    { fontSize: 15, fontFamily: "Inter_600SemiBold" },
  sub:      { fontSize: 12, fontFamily: "Inter_400Regular", marginTop: 2 },
  inputWrap:{ paddingHorizontal: 14, paddingVertical: 10, borderBottomWidth: 1 },
  input:    { borderWidth: 1, borderRadius: 12, paddingHorizontal: 14, paddingVertical: 11, fontSize: 15, fontFamily: "Inter_400Regular" },
  saveBtn:  { flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 8, paddingVertical: 13, borderRadius: 12 },
  saveText: { fontSize: 15, fontFamily: "Inter_700Bold", color: "#fff" },
});
