import { Feather } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";
import { LinearGradient } from "expo-linear-gradient";
import { router } from "expo-router";
import React, { useCallback, useEffect, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  Platform,
  Pressable,
  RefreshControl,
  ScrollView,
  Share,
  StyleSheet,
  Text,
  TextInput,
  View,
  useColorScheme,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import AsyncStorage from "@react-native-async-storage/async-storage";

import Colors from "@/constants/colors";
import { useAuth } from "@/context/AuthContext";

const BASE_URL = process.env.EXPO_PUBLIC_DOMAIN
  ? `https://${process.env.EXPO_PUBLIC_DOMAIN}`
  : "http://localhost:8080";

// ─── Types ────────────────────────────────────────────────────────────────────

interface LedgerItem {
  date: string;
  type: string;
  amount: number;
  status: string;
  bankName: string;
}

interface ProgramRow {
  id: number;
  bankName: string;
  bonusAmount: number;
  achAmount: number;
  chargeAmount: number;
  status: string;
  cycleCount: number;
  maxCycles: number;
  cyclesThisMonth: number;
  achVolumeThisMonth: number;
  endsAt: string | null;
  demo: boolean;
  events: { date: string; type: string; amount: number; status: string }[];
}

interface Statement {
  month: string;
  monthKey: string;
  summary: {
    achCycles: number;
    achVolume: number;
    activePrograms: number;
    completedPrograms: number;
    estimatedBonuses: number;
  };
  programs: ProgramRow[];
  ledger: LedgerItem[];
}

// ─── Helpers ─────────────────────────────────────────────────────────────────

function prevMonth(key: string): string {
  const [y, m] = key.split("-").map(Number);
  if (m === 1) return `${y - 1}-12`;
  return `${y}-${String(m - 1).padStart(2, "0")}`;
}
function nextMonth(key: string): string {
  const [y, m] = key.split("-").map(Number);
  if (m === 12) return `${y + 1}-01`;
  return `${y}-${String(m + 1).padStart(2, "0")}`;
}
function currentMonthKey(): string {
  const now = new Date();
  return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}`;
}

// ─── Sub-components ───────────────────────────────────────────────────────────

function HeroStat({ label, value, color }: { label: string; value: string; color: string }) {
  return (
    <View style={hS.stat}>
      <Text style={[hS.value, { color }]}>{value}</Text>
      <Text style={hS.label}>{label}</Text>
    </View>
  );
}

function LedgerRow({ item, isLast, c }: { item: LedgerItem; isLast: boolean; c: typeof Colors.light }) {
  const isCredit = item.type.startsWith("ACH Push") || item.type.startsWith("CC Refunded");
  const isDebit  = item.type.startsWith("ACH Pull");
  const isCharge = item.type.startsWith("CC Charged");

  const amtColor = isCredit ? "#4CAF50" : isDebit ? "#F77737" : isCharge ? "#E1306C" : c.text;
  const prefix   = isCredit ? "+" : "-";
  const iconName = isCredit ? "arrow-down-circle" : isDebit ? "arrow-up-circle" : isCharge ? "credit-card" : "check-circle";
  const iconBg   = isCredit ? "#4CAF5022" : isDebit ? "#F7773722" : isCharge ? "#E1306C22" : "#9C27B022";
  const iconColor= isCredit ? "#4CAF50"   : isDebit ? "#F77737"   : isCharge ? "#E1306C"   : "#9C27B0";

  return (
    <View style={[lS.row, { borderBottomColor: isLast ? "transparent" : c.separator }]}>
      <View style={[lS.icon, { backgroundColor: iconBg }]}>
        <Feather name={iconName as any} size={16} color={iconColor} />
      </View>
      <View style={lS.info}>
        <Text style={[lS.type, { color: c.text }]} numberOfLines={1}>{item.type}</Text>
        <Text style={[lS.bank, { color: c.textSecondary }]}>{item.bankName}</Text>
        <Text style={[lS.date, { color: c.textTertiary }]}>{item.date}</Text>
      </View>
      <View style={lS.right}>
        <Text style={[lS.amount, { color: amtColor }]}>{prefix}${item.amount.toLocaleString()}</Text>
        <View style={[lS.badge, { backgroundColor: amtColor + "22" }]}>
          <Text style={[lS.badgeText, { color: amtColor }]}>{item.status}</Text>
        </View>
      </View>
    </View>
  );
}

function ProgramCard({ p, c }: { p: ProgramRow; c: typeof Colors.light }) {
  const [expanded, setExpanded] = useState(false);
  const pct = p.maxCycles > 0 ? (p.cycleCount / p.maxCycles) * 100 : 0;

  const statusColor: Record<string, string> = {
    charged: "#E1306C", ach_push_sent: "#F77737", ach_pull_settled: "#4CAF50",
    refunded: "#00C853", cancelled: "#9E9E9E", failed: "#F44336",
  };
  const sc = statusColor[p.status] ?? "#9C27B0";

  return (
    <View style={[pcS.card, { backgroundColor: c.card, borderColor: c.cardBorder }]}>
      <Pressable style={pcS.header} onPress={() => setExpanded(e => !e)}>
        <View style={pcS.headerLeft}>
          <Text style={[pcS.name, { color: c.text }]}>{p.bankName}</Text>
          <View style={[pcS.statusPill, { backgroundColor: sc + "22" }]}>
            <Text style={[pcS.statusText, { color: sc }]}>{p.status.replace(/_/g, " ")}</Text>
          </View>
        </View>
        <View style={pcS.headerRight}>
          <Text style={[pcS.cycleNum, { color: "#833AB4" }]}>{p.cyclesThisMonth}× this mo.</Text>
          <Feather name={expanded ? "chevron-up" : "chevron-down"} size={16} color={c.textTertiary} />
        </View>
      </Pressable>

      {/* Progress bar */}
      <View style={[pcS.barTrack, { backgroundColor: c.backgroundTertiary }]}>
        <LinearGradient
          colors={["#833AB4", "#E1306C", "#F77737"]}
          start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }}
          style={[pcS.barFill, { width: `${Math.min(pct, 100)}%` as any }]}
        />
      </View>
      <Text style={[pcS.barLabel, { color: c.textTertiary }]}>{p.cycleCount}/{p.maxCycles} total cycles · ${p.achVolumeThisMonth.toLocaleString()} moved this month</Text>

      {expanded && (
        <View style={pcS.events}>
          {p.events.length === 0 ? (
            <Text style={[pcS.noEvents, { color: c.textTertiary }]}>No events this month.</Text>
          ) : (
            p.events.map((e, i) => {
              const isPos = e.type === "ACH Push" || e.type === "CC Refunded";
              const isNeg = e.type === "ACH Pull" || e.type === "CC Charged";
              const eColor = isPos ? "#4CAF50" : isNeg ? "#E1306C" : c.textSecondary;
              return (
                <View key={i} style={[pcS.eventRow, { borderTopColor: c.separator }]}>
                  <Text style={[pcS.eventDate, { color: c.textTertiary }]}>{e.date}</Text>
                  <Text style={[pcS.eventType, { color: c.text }]}>{e.type}</Text>
                  <Text style={[pcS.eventAmt, { color: eColor }]}>${e.amount.toLocaleString()}</Text>
                </View>
              );
            })
          )}
        </View>
      )}
    </View>
  );
}

// ─── Main screen ─────────────────────────────────────────────────────────────

export default function StatementScreen() {
  const insets      = useSafeAreaInsets();
  const colorScheme = useColorScheme();
  const isDark      = colorScheme === "dark";
  const c           = isDark ? Colors.dark : Colors.light;
  const { user }    = useAuth();

  const [monthKey, setMonthKey] = useState(currentMonthKey);
  const [data, setData]         = useState<Statement | null>(null);
  const [loading, setLoading]   = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [emailAddr, setEmailAddr]   = useState("");
  const [sendingEmail, setSendingEmail] = useState(false);
  const [showEmail, setShowEmail]       = useState(false);

  const userId = user?.id ?? "demo-user";

  const fetchStatement = useCallback(async (key: string, isRefresh = false) => {
    if (!isRefresh) setLoading(true);
    try {
      const res = await fetch(`${BASE_URL}/api/autopay/statement?userId=${encodeURIComponent(userId)}&month=${key}`);
      if (res.ok) setData(await res.json());
    } catch (err) {
      console.warn("[statement]", err);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [userId]);

  useEffect(() => { fetchStatement(monthKey); }, [monthKey, fetchStatement]);

  useEffect(() => {
    AsyncStorage.getItem("bbb_notify_email_addr").then(v => { if (v) setEmailAddr(v); });
  }, []);

  const handleRefresh = () => { setRefreshing(true); fetchStatement(monthKey, true); };

  const handlePrev = () => { if (Platform.OS !== "web") Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light); setMonthKey(k => prevMonth(k)); };
  const handleNext = () => {
    const nk = nextMonth(monthKey);
    if (nk > currentMonthKey()) return;
    if (Platform.OS !== "web") Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setMonthKey(nk);
  };

  const handleShare = async () => {
    if (!data) return;
    const s = data.summary;
    const text = `BigBankBonus Monthly Statement — ${data.month}\n\nACH Cycles: ${s.achCycles}\nACH Volume: $${s.achVolume.toLocaleString()}\nActive Programs: ${s.activePrograms}\nEst. Bonuses: $${s.estimatedBonuses.toLocaleString()}\n\nGenerated by BigBankBonus.com`;
    Share.share({ message: text, title: `Statement — ${data.month}` });
  };

  const handleEmailStatement = async () => {
    if (!emailAddr.includes("@")) {
      Alert.alert("Invalid Email", "Enter a valid email address."); return;
    }
    setSendingEmail(true);
    try {
      const res = await fetch(`${BASE_URL}/api/autopay/statement/email`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userId, month: monthKey, email: emailAddr }),
      });
      const json = await res.json();
      if (Platform.OS !== "web") Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      Alert.alert(json.success ? "Statement Sent!" : "Note", json.message ?? "Check your inbox.");
      setShowEmail(false);
    } catch {
      Alert.alert("Error", "Could not send statement. Try again.");
    }
    setSendingEmail(false);
  };

  const canGoNext = nextMonth(monthKey) <= currentMonthKey();

  return (
    <View style={[ss.container, { backgroundColor: c.background }]}>
      {/* ── Header ── */}
      <View style={[ss.header, { paddingTop: insets.top + (Platform.OS === "web" ? 67 : 12) }]}>
        <LinearGradient colors={["#833AB4", "#E1306C", "#F77737"]} start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }} style={StyleSheet.absoluteFill} />
        <View style={ss.headerRow}>
          <Pressable style={ss.backBtn} onPress={() => router.back()}>
            <Feather name="x" size={20} color="#fff" />
          </Pressable>
          <View style={ss.headerCenter}>
            <Text style={ss.headerTitle}>Monthly Statement</Text>
            <Text style={ss.headerSub}>{data?.month ?? "Loading…"}</Text>
          </View>
          <Pressable style={ss.backBtn} onPress={handleShare}>
            <Feather name="share" size={18} color="#fff" />
          </Pressable>
        </View>

        {/* Month picker */}
        <View style={ss.picker}>
          <Pressable style={[ss.pickerBtn, { opacity: 1 }]} onPress={handlePrev}>
            <Feather name="chevron-left" size={20} color="#fff" />
          </Pressable>
          <Text style={ss.pickerLabel}>{data?.month ?? monthKey}</Text>
          <Pressable style={[ss.pickerBtn, { opacity: canGoNext ? 1 : 0.35 }]} onPress={handleNext}>
            <Feather name="chevron-right" size={20} color="#fff" />
          </Pressable>
        </View>

        {/* Hero stats row */}
        {data && (
          <View style={ss.heroRow}>
            <HeroStat label="ACH Cycles"   value={String(data.summary.achCycles)}                  color="#fff" />
            <View style={ss.heroDivider} />
            <HeroStat label="ACH Volume"   value={`$${data.summary.achVolume.toLocaleString()}`}   color="#fff" />
            <View style={ss.heroDivider} />
            <HeroStat label="Est. Bonuses" value={`$${data.summary.estimatedBonuses.toLocaleString()}`} color="#fff" />
            <View style={ss.heroDivider} />
            <HeroStat label="Programs"     value={String(data.summary.activePrograms)}              color="#fff" />
          </View>
        )}
      </View>

      {loading ? (
        <View style={ss.loadingWrap}>
          <ActivityIndicator size="large" color="#833AB4" />
          <Text style={[ss.loadingText, { color: c.textSecondary }]}>Loading statement…</Text>
        </View>
      ) : (
        <ScrollView
          showsVerticalScrollIndicator={false}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={handleRefresh} tintColor="#833AB4" />}
          contentContainerStyle={{ padding: 16, gap: 16, paddingBottom: insets.bottom + 60 }}
        >
          {/* ── Summary cards ── */}
          <View style={[ss.summaryCard, { backgroundColor: c.card, borderColor: c.cardBorder }]}>
            <Text style={[ss.sectionTitle, { color: c.text }]}>Summary</Text>
            {[
              { label: "ACH Cycles this month",    value: data?.summary.achCycles ?? 0,          format: (v: number) => String(v),                  color: "#833AB4" },
              { label: "Total ACH volume",          value: data?.summary.achVolume ?? 0,           format: (v: number) => `$${v.toLocaleString()}`,    color: "#E1306C" },
              { label: "Active autopay programs",   value: data?.summary.activePrograms ?? 0,     format: (v: number) => String(v),                  color: "#F77737" },
              { label: "Completed programs",        value: data?.summary.completedPrograms ?? 0,  format: (v: number) => String(v),                  color: "#00C853" },
              { label: "Est. total bonuses earned", value: data?.summary.estimatedBonuses ?? 0,   format: (v: number) => `$${v.toLocaleString()}`,    color: "#2196F3" },
            ].map((row, i, arr) => (
              <View key={row.label} style={[ss.summaryRow, { borderBottomColor: i < arr.length - 1 ? c.separator : "transparent" }]}>
                <Text style={[ss.summaryLabel, { color: c.textSecondary }]}>{row.label}</Text>
                <Text style={[ss.summaryValue, { color: row.color }]}>{row.format(row.value)}</Text>
              </View>
            ))}
          </View>

          {/* ── Programs ── */}
          {(data?.programs.length ?? 0) > 0 && (
            <View style={{ gap: 10 }}>
              <Text style={[ss.sectionTitle, { color: c.text }]}>Programs</Text>
              {data!.programs.map(p => <ProgramCard key={p.id} p={p} c={c} />)}
            </View>
          )}

          {/* ── Ledger ── */}
          {(data?.ledger.length ?? 0) > 0 ? (
            <View style={[ss.ledgerCard, { backgroundColor: c.card, borderColor: c.cardBorder }]}>
              <Text style={[ss.sectionTitle, { color: c.text }]}>Transaction Ledger</Text>
              {data!.ledger.map((item, i) => (
                <LedgerRow key={i} item={item} isLast={i === data!.ledger.length - 1} c={c} />
              ))}
            </View>
          ) : (
            <View style={[ss.emptyCard, { backgroundColor: c.card, borderColor: c.cardBorder }]}>
              <Feather name="inbox" size={36} color={c.textTertiary} />
              <Text style={[ss.emptyTitle, { color: c.text }]}>No activity this month</Text>
              <Text style={[ss.emptySubtitle, { color: c.textSecondary }]}>
                Start an autopay program from the Calendar tab to begin generating ACH cycles.
              </Text>
            </View>
          )}

          {/* ── Email statement ── */}
          <View style={[ss.emailCard, { backgroundColor: c.card, borderColor: c.cardBorder }]}>
            <Pressable style={ss.emailToggle} onPress={() => setShowEmail(s => !s)}>
              <View style={[ss.emailIcon, { backgroundColor: "#E1306C22" }]}>
                <Feather name="mail" size={18} color="#E1306C" />
              </View>
              <Text style={[ss.emailToggleText, { color: c.text }]}>Email This Statement</Text>
              <Feather name={showEmail ? "chevron-up" : "chevron-right"} size={16} color={c.textTertiary} />
            </Pressable>
            {showEmail && (
              <View style={ss.emailForm}>
                <TextInput
                  style={[ss.emailInput, { backgroundColor: c.backgroundSecondary, color: c.text, borderColor: c.cardBorder }]}
                  value={emailAddr}
                  onChangeText={setEmailAddr}
                  placeholder="you@example.com"
                  placeholderTextColor={c.textTertiary}
                  keyboardType="email-address"
                  autoCapitalize="none"
                  autoCorrect={false}
                />
                <Pressable onPress={handleEmailStatement} disabled={sendingEmail} style={ss.emailBtn}>
                  <LinearGradient
                    colors={["#833AB4", "#E1306C"]}
                    start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }}
                    style={ss.emailBtnGrad}
                  >
                    {sendingEmail
                      ? <ActivityIndicator color="#fff" size="small" />
                      : <><Feather name="send" size={15} color="#fff" /><Text style={ss.emailBtnText}>Send Statement</Text></>}
                  </LinearGradient>
                </Pressable>
              </View>
            )}
          </View>
        </ScrollView>
      )}
    </View>
  );
}

// ─── Styles ──────────────────────────────────────────────────────────────────

const ss = StyleSheet.create({
  container:    { flex: 1 },
  header:       { paddingHorizontal: 16, paddingBottom: 20 },
  headerRow:    { flexDirection: "row", alignItems: "center", justifyContent: "space-between", marginBottom: 12 },
  backBtn:      { width: 36, height: 36, backgroundColor: "rgba(255,255,255,0.18)", borderRadius: 10, alignItems: "center", justifyContent: "center" },
  headerCenter: { flex: 1, alignItems: "center" },
  headerTitle:  { fontSize: 17, fontFamily: "Inter_700Bold", color: "#fff" },
  headerSub:    { fontSize: 12, fontFamily: "Inter_400Regular", color: "rgba(255,255,255,0.75)", marginTop: 1 },
  picker:       { flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 20, marginBottom: 14 },
  pickerBtn:    { width: 32, height: 32, backgroundColor: "rgba(255,255,255,0.18)", borderRadius: 8, alignItems: "center", justifyContent: "center" },
  pickerLabel:  { fontSize: 17, fontFamily: "Inter_700Bold", color: "#fff", minWidth: 140, textAlign: "center" },
  heroRow:      { flexDirection: "row", alignItems: "center", justifyContent: "space-around" },
  heroDivider:  { width: 1, height: 32, backgroundColor: "rgba(255,255,255,0.25)" },
  loadingWrap:  { flex: 1, alignItems: "center", justifyContent: "center", gap: 12 },
  loadingText:  { fontSize: 14, fontFamily: "Inter_400Regular" },
  sectionTitle: { fontSize: 16, fontFamily: "Inter_700Bold", marginBottom: 12 },
  summaryCard:  { borderRadius: 16, borderWidth: 1, padding: 16 },
  summaryRow:   { flexDirection: "row", alignItems: "center", justifyContent: "space-between", paddingVertical: 10, borderBottomWidth: 1 },
  summaryLabel: { fontSize: 13, fontFamily: "Inter_400Regular", flex: 1 },
  summaryValue: { fontSize: 15, fontFamily: "Inter_700Bold" },
  ledgerCard:   { borderRadius: 16, borderWidth: 1, padding: 16 },
  emptyCard:    { borderRadius: 16, borderWidth: 1, padding: 40, alignItems: "center", gap: 12 },
  emptyTitle:   { fontSize: 17, fontFamily: "Inter_700Bold", textAlign: "center" },
  emptySubtitle:{ fontSize: 13, fontFamily: "Inter_400Regular", textAlign: "center", lineHeight: 20 },
  emailCard:    { borderRadius: 16, borderWidth: 1, overflow: "hidden" },
  emailToggle:  { flexDirection: "row", alignItems: "center", gap: 12, padding: 16 },
  emailIcon:    { width: 36, height: 36, borderRadius: 10, alignItems: "center", justifyContent: "center" },
  emailToggleText: { flex: 1, fontSize: 15, fontFamily: "Inter_600SemiBold" },
  emailForm:    { paddingHorizontal: 16, paddingBottom: 16, gap: 10 },
  emailInput:   { borderWidth: 1, borderRadius: 12, paddingHorizontal: 14, paddingVertical: 12, fontSize: 15, fontFamily: "Inter_400Regular" },
  emailBtn:     { borderRadius: 12, overflow: "hidden" },
  emailBtnGrad: { flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 8, paddingVertical: 13 },
  emailBtnText: { fontSize: 15, fontFamily: "Inter_700Bold", color: "#fff" },
});

const hS = StyleSheet.create({
  stat:  { alignItems: "center", paddingVertical: 4 },
  value: { fontSize: 18, fontFamily: "Inter_700Bold" },
  label: { fontSize: 10, fontFamily: "Inter_400Regular", color: "rgba(255,255,255,0.7)", marginTop: 2 },
});

const lS = StyleSheet.create({
  row:       { flexDirection: "row", alignItems: "flex-start", gap: 10, paddingVertical: 12, borderBottomWidth: 1 },
  icon:      { width: 36, height: 36, borderRadius: 10, alignItems: "center", justifyContent: "center", marginTop: 2 },
  info:      { flex: 1 },
  type:      { fontSize: 13, fontFamily: "Inter_600SemiBold" },
  bank:      { fontSize: 11, fontFamily: "Inter_400Regular", marginTop: 2 },
  date:      { fontSize: 11, fontFamily: "Inter_400Regular", marginTop: 1 },
  right:     { alignItems: "flex-end", gap: 4 },
  amount:    { fontSize: 15, fontFamily: "Inter_700Bold" },
  badge:     { paddingHorizontal: 7, paddingVertical: 2, borderRadius: 6 },
  badgeText: { fontSize: 10, fontFamily: "Inter_600SemiBold" },
});

const pcS = StyleSheet.create({
  card:       { borderRadius: 14, borderWidth: 1, overflow: "hidden" },
  header:     { flexDirection: "row", alignItems: "center", padding: 14, gap: 10 },
  headerLeft: { flex: 1, gap: 4 },
  headerRight:{ alignItems: "flex-end", gap: 4 },
  name:       { fontSize: 14, fontFamily: "Inter_600SemiBold" },
  statusPill: { alignSelf: "flex-start", paddingHorizontal: 8, paddingVertical: 3, borderRadius: 6 },
  statusText: { fontSize: 10, fontFamily: "Inter_600SemiBold", textTransform: "capitalize" },
  cycleNum:   { fontSize: 13, fontFamily: "Inter_700Bold" },
  barTrack:   { height: 5, marginHorizontal: 14, borderRadius: 3, overflow: "hidden" },
  barFill:    { height: 5, borderRadius: 3 },
  barLabel:   { fontSize: 10, fontFamily: "Inter_400Regular", marginHorizontal: 14, marginTop: 4, marginBottom: 10 },
  events:     { borderTopWidth: 1, borderTopColor: "rgba(0,0,0,0.06)" },
  noEvents:   { padding: 14, fontSize: 12, fontFamily: "Inter_400Regular", textAlign: "center" },
  eventRow:   { flexDirection: "row", alignItems: "center", paddingHorizontal: 14, paddingVertical: 10, borderTopWidth: 1, gap: 8 },
  eventDate:  { fontSize: 11, fontFamily: "Inter_400Regular", width: 80 },
  eventType:  { flex: 1, fontSize: 12, fontFamily: "Inter_600SemiBold" },
  eventAmt:   { fontSize: 13, fontFamily: "Inter_700Bold" },
});
