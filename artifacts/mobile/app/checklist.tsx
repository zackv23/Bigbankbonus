import { Feather } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import { router, useLocalSearchParams } from "expo-router";
import * as Haptics from "expo-haptics";
import React, { useState, useEffect, type ComponentProps } from "react";
import {
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
  useColorScheme,
} from "react-native";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import Colors from "@/constants/colors";

type FeatherIconName = ComponentProps<typeof Feather>["name"];

interface ChecklistItem {
  id: string;
  step: number;
  title: string;
  description: string;
  icon: FeatherIconName;
  completed: boolean;
}

const DEFAULT_CHECKLIST: Omit<ChecklistItem, "completed">[] = [
  {
    id: "login",
    step: 1,
    title: "Log in to your new bank account",
    description: "Log in to your new account within 24 hours of approval. Activate your debit card if one was issued.",
    icon: "log-in",
  },
  {
    id: "routing",
    step: 2,
    title: "Verify your routing & account numbers",
    description: "Confirm that the routing and account numbers saved in BigBankBonus match what's shown in your bank's portal.",
    icon: "hash",
  },
  {
    id: "ach",
    step: 3,
    title: "Review your ACH direct deposit schedule",
    description: "Check the Schedule tab to confirm your first direct deposit is queued. Ensure the amount meets the bank's minimum DD requirement.",
    icon: "calendar",
  },
  {
    id: "stacking",
    step: 4,
    title: "Review your stacking strategy",
    description: "Visit the AI Agent tab and ask for a personalized stacking plan based on your approved account. Maximize your bonus earnings.",
    icon: "layers",
  },
  {
    id: "autopay",
    step: 5,
    title: "Enable Autopay for hands-free deposits",
    description: "In the Accounts tab, enable the Autopay DD Scheduler so deposits are handled automatically. No manual transfers needed.",
    icon: "refresh-cw",
  },
  {
    id: "plaid",
    step: 6,
    title: "Link your funding bank via Plaid",
    description: "Connect the bank account you'll use to fund your direct deposits. This enables seamless ACH transfers.",
    icon: "link",
  },
  {
    id: "bonus-timeline",
    step: 7,
    title: "Note your bonus timeline",
    description: "Check the bank's offer page for when the bonus posts (typically 90–180 days after meeting requirements). Set a reminder.",
    icon: "clock",
  },
  {
    id: "support",
    step: 8,
    title: "Save our support contact",
    description: "Questions? Reach us at support@bigbankbonus.com. We respond within 24 hours on business days.",
    icon: "mail",
  },
];

const STORAGE_KEY = "bbb_checklist_state";

export default function ChecklistScreen() {
  const insets = useSafeAreaInsets();
  const colorScheme = useColorScheme();
  const isDark = colorScheme === "dark";
  const c = isDark ? Colors.dark : Colors.light;
  const params = useLocalSearchParams<{ bankName?: string }>();
  const bankName = params.bankName ?? "Your Bank";

  const [items, setItems] = useState<ChecklistItem[]>(
    DEFAULT_CHECKLIST.map(item => ({ ...item, completed: false }))
  );

  useEffect(() => {
    AsyncStorage.getItem(STORAGE_KEY).then(stored => {
      if (stored) {
        const saved: Record<string, boolean> = JSON.parse(stored);
        setItems(prev => prev.map(item => ({
          ...item,
          completed: saved[item.id] ?? false,
        })));
      }
    });
  }, []);

  const toggleItem = async (id: string) => {
    if (Platform.OS !== "web") Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    const next = items.map(item =>
      item.id === id ? { ...item, completed: !item.completed } : item
    );
    setItems(next);
    const state: Record<string, boolean> = {};
    next.forEach(item => { state[item.id] = item.completed; });
    await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(state));
  };

  const completedCount = items.filter(i => i.completed).length;
  const progress = completedCount / items.length;
  const allDone = completedCount === items.length;

  return (
    <View style={[s.container, { backgroundColor: c.background }]}>
      <ScrollView contentContainerStyle={{ paddingBottom: insets.bottom + 40 }} showsVerticalScrollIndicator={false}>
        {/* Header */}
        <LinearGradient
          colors={["#833AB4", "#E1306C", "#F77737"]}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 0 }}
          style={[s.header, { paddingTop: insets.top + 16 }]}
        >
          <Pressable onPress={() => router.back()} style={s.backBtn} hitSlop={12}>
            <Feather name="arrow-left" size={22} color="#fff" />
          </Pressable>
          <View style={s.headerBadge}>
            <Feather name="check-circle" size={13} color="#fff" />
            <Text style={s.headerBadgeText}>POST-APPROVAL CHECKLIST</Text>
          </View>
          <Text style={s.headerTitle}>What To Do Next</Text>
          <Text style={s.headerSub}>
            Your {bankName} account has been approved.{"\n"}
            Complete these steps to start earning your bonus.
          </Text>
        </LinearGradient>

        <View style={s.body}>
          {/* Progress */}
          <View style={[s.progressCard, { backgroundColor: c.card, borderColor: c.cardBorder }]}>
            <View style={s.progressTop}>
              <Text style={[s.progressLabel, { color: c.text }]}>
                {allDone ? "All steps complete!" : `${completedCount} of ${items.length} steps done`}
              </Text>
              <Text style={[s.progressPct, { color: "#833AB4" }]}>{Math.round(progress * 100)}%</Text>
            </View>
            <View style={[s.progressBarBg, { backgroundColor: isDark ? "#333" : "#e8e8e8" }]}>
              <LinearGradient
                colors={["#833AB4", "#E1306C", "#F77737"]}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 0 }}
                style={[s.progressBarFill, { width: `${Math.round(progress * 100)}%` }]}
              />
            </View>
            {allDone && (
              <View style={s.allDoneBanner}>
                <Feather name="award" size={16} color="#4CAF50" />
                <Text style={[s.allDoneText, { color: "#4CAF50" }]}>
                  You're all set! Your bonus tracking is active.
                </Text>
              </View>
            )}
          </View>

          {/* Billing notice */}
          <View style={[s.billingNotice, { backgroundColor: isDark ? "rgba(131,58,180,0.12)" : "#faf5ff", borderColor: "#833AB4" }]}>
            <Feather name="credit-card" size={15} color="#833AB4" />
            <Text style={[s.billingNoticeText, { color: c.textSecondary }]}>
              Your $6/mo subscription and $99 service fee have been activated following your approval. Questions? Contact support.
            </Text>
          </View>

          {/* Checklist items */}
          <View style={s.sectionBlock}>
            {items.map(item => (
              <Pressable
                key={item.id}
                onPress={() => toggleItem(item.id)}
                style={({ pressed }) => [
                  s.checkItem,
                  {
                    backgroundColor: item.completed
                      ? (isDark ? "rgba(76,175,80,0.12)" : "#f0faf0")
                      : c.card,
                    borderColor: item.completed ? "#4CAF50" : c.cardBorder,
                    opacity: pressed ? 0.85 : 1,
                  },
                ]}
              >
                <View style={s.checkItemLeft}>
                  <View style={[
                    s.checkBox,
                    item.completed
                      ? s.checkBoxDone
                      : { borderColor: isDark ? "#555" : "#ddd", backgroundColor: "transparent" }
                  ]}>
                    {item.completed ? (
                      <Feather name="check" size={13} color="#fff" />
                    ) : (
                      <Text style={[s.stepNumText, { color: c.textSecondary }]}>{item.step}</Text>
                    )}
                  </View>
                </View>
                <View style={s.checkItemBody}>
                  <View style={s.checkItemTitleRow}>
                    <LinearGradient
                      colors={item.completed ? ["#4CAF50", "#66BB6A"] : ["#833AB4", "#E1306C"]}
                      style={s.checkIcon}
                      start={{ x: 0, y: 0 }}
                      end={{ x: 1, y: 1 }}
                    >
                      <Feather name={item.icon} size={12} color="#fff" />
                    </LinearGradient>
                    <Text style={[
                      s.checkTitle,
                      { color: item.completed ? (isDark ? "#66BB6A" : "#2e7d32") : c.text },
                      item.completed && s.checkTitleDone,
                    ]}>
                      {item.title}
                    </Text>
                  </View>
                  <Text style={[s.checkDesc, { color: c.textSecondary }]}>{item.description}</Text>
                </View>
              </Pressable>
            ))}
          </View>

          {/* Support CTA */}
          <View style={[s.supportCard, { backgroundColor: c.card, borderColor: c.cardBorder }]}>
            <Feather name="help-circle" size={20} color="#833AB4" />
            <View style={{ flex: 1 }}>
              <Text style={[s.supportTitle, { color: c.text }]}>Need help?</Text>
              <Text style={[s.supportSub, { color: c.textSecondary }]}>
                Our team is here for you Monday–Friday.{"\n"}support@bigbankbonus.com
              </Text>
            </View>
          </View>
        </View>
      </ScrollView>
    </View>
  );
}

const s = StyleSheet.create({
  container: { flex: 1 },
  header: { paddingHorizontal: 20, paddingBottom: 28 },
  backBtn: { alignSelf: "flex-start", marginBottom: 16 },
  headerBadge: { flexDirection: "row", alignItems: "center", gap: 6, marginBottom: 8 },
  headerBadgeText: { fontSize: 10, fontFamily: "Inter_600SemiBold", color: "rgba(255,255,255,0.8)", letterSpacing: 1 },
  headerTitle: { fontSize: 30, fontFamily: "Inter_700Bold", color: "#fff", lineHeight: 36, marginBottom: 8 },
  headerSub: { fontSize: 14, fontFamily: "Inter_400Regular", color: "rgba(255,255,255,0.85)", lineHeight: 20 },
  body: { padding: 16, gap: 14 },
  progressCard: { borderRadius: 16, borderWidth: 1, padding: 16, gap: 10 },
  progressTop: { flexDirection: "row", justifyContent: "space-between", alignItems: "center" },
  progressLabel: { fontSize: 14, fontFamily: "Inter_600SemiBold" },
  progressPct: { fontSize: 18, fontFamily: "Inter_700Bold" },
  progressBarBg: { height: 8, borderRadius: 4, overflow: "hidden" },
  progressBarFill: { height: "100%", borderRadius: 4 },
  allDoneBanner: { flexDirection: "row", alignItems: "center", gap: 8, marginTop: 4 },
  allDoneText: { fontSize: 13, fontFamily: "Inter_600SemiBold" },
  billingNotice: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: 10,
    borderWidth: 1,
    borderRadius: 12,
    padding: 12,
  },
  billingNoticeText: { flex: 1, fontSize: 12, fontFamily: "Inter_400Regular", lineHeight: 17 },
  sectionBlock: { gap: 10 },
  checkItem: {
    flexDirection: "row",
    gap: 10,
    borderWidth: 1,
    borderRadius: 14,
    padding: 14,
  },
  checkItemLeft: { paddingTop: 2 },
  checkBox: {
    width: 26,
    height: 26,
    borderRadius: 13,
    borderWidth: 2,
    alignItems: "center",
    justifyContent: "center",
  },
  checkBoxDone: { backgroundColor: "#4CAF50", borderColor: "#4CAF50" },
  stepNumText: { fontSize: 11, fontFamily: "Inter_700Bold" },
  checkItemBody: { flex: 1, gap: 6 },
  checkItemTitleRow: { flexDirection: "row", alignItems: "center", gap: 8 },
  checkIcon: { width: 24, height: 24, borderRadius: 7, alignItems: "center", justifyContent: "center" },
  checkTitle: { flex: 1, fontSize: 14, fontFamily: "Inter_600SemiBold", lineHeight: 18 },
  checkTitleDone: { textDecorationLine: "line-through" },
  checkDesc: { fontSize: 12, fontFamily: "Inter_400Regular", lineHeight: 17 },
  supportCard: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: 12,
    borderWidth: 1,
    borderRadius: 14,
    padding: 14,
  },
  supportTitle: { fontSize: 14, fontFamily: "Inter_700Bold", marginBottom: 2 },
  supportSub: { fontSize: 12, fontFamily: "Inter_400Regular", lineHeight: 17 },
});
