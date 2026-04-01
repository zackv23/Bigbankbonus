import { Feather } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import { router } from "expo-router";
import React, { useCallback, useEffect, useRef, useState } from "react";
import {
  ActivityIndicator,
  FlatList,
  Platform,
  Pressable,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  View,
  useColorScheme,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import Colors from "@/constants/colors";
import { useAuth } from "@/context/AuthContext";

const API_BASE = process.env.EXPO_PUBLIC_DOMAIN
  ? `https://${process.env.EXPO_PUBLIC_DOMAIN}/api`
  : "http://localhost:8080/api";

interface MonitorEvent {
  id: number;
  sourceUrl: string;
  sourceCategory: string;
  sourceName?: string;
  changeType: string;
  summary: string;
  severity: string;
  affectedBanks: string[];
  detectedAt: string;
}

interface MonitorStatus {
  ok: boolean;
  lastRun?: {
    id: number;
    startedAt: string;
    completedAt?: string;
    sourcesChecked: number;
    eventsDetected: number;
    errorsEncountered: number;
    status: string;
  };
  recentEvents: MonitorEvent[];
  sourceHealth: { total: number; alive: number; dead: number };
  totalSources: number;
}

interface AlertSummary {
  summary: {
    last24hEvents: number;
    last7dEvents: number;
    highSeverityAlerts: number;
    topBanks: { bank: string; count: number }[];
    byChangeType: Record<string, number>;
  };
  recentAlerts: MonitorEvent[];
  preview?: {
    message: string;
    sampleEvents: MonitorEvent[];
  };
  upgrade?: boolean;
}

const SEVERITY_COLORS: Record<string, string> = {
  high: "#F44336",
  medium: "#FF9800",
  info: "#2196F3",
};

const CHANGE_TYPE_LABELS: Record<string, string> = {
  policy_update: "Policy Update",
  bank_opened: "Bank Opened",
  bank_closed: "Bank Closed",
  user_report: "User Report",
};

const CHANGE_TYPE_ICONS: Record<string, string> = {
  policy_update: "alert-circle",
  bank_opened: "check-circle",
  bank_closed: "x-circle",
  user_report: "message-circle",
};

const CATEGORY_COLORS: Record<string, string> = {
  cfpb: "#1565C0",
  reddit: "#FF4500",
  doc: "#2E7D32",
  bank_newsroom: "#6A1B9A",
  aggregator: "#00838F",
  forum: "#E65100",
  federal: "#1A237E",
  state: "#004D40",
  news: "#880E4F",
  consumer: "#BF360C",
};

function EventCard({ event, isDark }: { event: MonitorEvent; isDark: boolean }) {
  const c = isDark ? Colors.dark : Colors.light;
  const severityColor = SEVERITY_COLORS[event.severity] ?? "#9E9E9E";
  const changeIcon = CHANGE_TYPE_ICONS[event.changeType] ?? "info";
  const changeLabel = CHANGE_TYPE_LABELS[event.changeType] ?? event.changeType;
  const catColor = CATEGORY_COLORS[event.sourceCategory] ?? "#555";
  const banks = Array.isArray(event.affectedBanks) ? event.affectedBanks : [];

  const dateStr = event.detectedAt
    ? new Date(event.detectedAt).toLocaleDateString("en-US", { month: "short", day: "numeric", hour: "2-digit", minute: "2-digit" })
    : "—";

  return (
    <View style={[styles.eventCard, { backgroundColor: c.card, borderColor: c.cardBorder, borderLeftColor: severityColor }]}>
      <View style={styles.eventCardTop}>
        <View style={[styles.eventIconWrap, { backgroundColor: severityColor + "22" }]}>
          <Feather name={changeIcon as any} size={16} color={severityColor} />
        </View>
        <View style={{ flex: 1, marginLeft: 10 }}>
          <View style={styles.eventBadgeRow}>
            <View style={[styles.catBadge, { backgroundColor: catColor + "22" }]}>
              <Text style={[styles.catBadgeText, { color: catColor }]}>{event.sourceCategory.toUpperCase()}</Text>
            </View>
            <View style={[styles.sevBadge, { backgroundColor: severityColor + "22" }]}>
              <Text style={[styles.sevBadgeText, { color: severityColor }]}>{event.severity.toUpperCase()}</Text>
            </View>
          </View>
          <Text style={[styles.changeTypeLabel, { color: c.textSecondary }]}>{changeLabel}</Text>
        </View>
        <Text style={[styles.eventDate, { color: c.textTertiary }]}>{dateStr}</Text>
      </View>
      <Text style={[styles.eventSummary, { color: c.text }]} numberOfLines={3}>{event.summary}</Text>
      {banks.length > 0 && (
        <View style={styles.banksRow}>
          {banks.slice(0, 4).map((b, i) => (
            <View key={i} style={[styles.bankPill, { backgroundColor: c.backgroundSecondary, borderColor: c.cardBorder }]}>
              <Text style={[styles.bankPillText, { color: c.text }]} numberOfLines={1}>{b}</Text>
            </View>
          ))}
          {banks.length > 4 && (
            <Text style={[styles.moreBanks, { color: c.textSecondary }]}>+{banks.length - 4} more</Text>
          )}
        </View>
      )}
      {event.sourceName && (
        <Text style={[styles.sourceName, { color: c.textTertiary }]} numberOfLines={1}>Source: {event.sourceName}</Text>
      )}
    </View>
  );
}

function StatBox({ label, value, icon, color }: { label: string; value: string | number; icon: string; color: string }) {
  return (
    <View style={[styles.statBox, { backgroundColor: color + "15", borderColor: color + "44" }]}>
      <Feather name={icon as any} size={16} color={color} />
      <Text style={[styles.statValue, { color }]}>{value}</Text>
      <Text style={styles.statLabel}>{label}</Text>
    </View>
  );
}

export default function MonitorScreen() {
  const insets = useSafeAreaInsets();
  const colorScheme = useColorScheme();
  const isDark = colorScheme === "dark";
  const c = isDark ? Colors.dark : Colors.light;
  const { user } = useAuth() as any;
  const userId: string | undefined = user?.id;

  const [status, setStatus] = useState<MonitorStatus | null>(null);
  const [alerts, setAlerts] = useState<AlertSummary | null>(null);
  const [events, setEvents] = useState<MonitorEvent[]>([]);
  const [filter, setFilter] = useState<"all" | "high" | "policy_update" | "bank_opened" | "bank_closed">("all");
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const fetchData = useCallback(async () => {
    try {
      const userParam = userId ? `&userId=${encodeURIComponent(userId)}` : "";
      const [statusRes, alertsRes, eventsRes] = await Promise.all([
        fetch(`${API_BASE}/monitor/status`).then(r => r.json()).catch(() => null),
        fetch(`${API_BASE}/monitor/alerts/summary?limit=10${userParam}`).then(r => r.json()).catch(() => null),
        fetch(`${API_BASE}/monitor/events?limit=100${userParam}`).then(r => r.json()).catch(() => null),
      ]);
      if (statusRes) setStatus(statusRes);
      if (alertsRes) setAlerts(alertsRes);
      if (eventsRes?.events) setEvents(eventsRes.events);
    } catch {}
  }, [userId]);

  useEffect(() => {
    setLoading(true);
    fetchData().finally(() => setLoading(false));
  }, [fetchData]);

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await fetchData();
    setRefreshing(false);
  }, [fetchData]);

  const filteredEvents = events.filter(e => {
    if (filter === "all") return true;
    if (filter === "high") return e.severity === "high";
    return e.changeType === filter;
  });

  const isPaid = !alerts?.upgrade;

  if (loading) {
    return (
      <View style={[styles.container, { backgroundColor: c.background }]}>
        <View style={[styles.header, { paddingTop: insets.top + (Platform.OS === "web" ? 67 : 12) }]}>
          <LinearGradient colors={["#1A237E", "#4A148C"]} start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }} style={StyleSheet.absoluteFill} />
          <Text style={styles.headerTitle}>Policy Monitor</Text>
        </View>
        <View style={styles.loadingWrap}>
          <ActivityIndicator size="large" color="#4A148C" />
          <Text style={[styles.loadingText, { color: c.textSecondary }]}>Loading monitor data...</Text>
        </View>
      </View>
    );
  }

  const isGated = alerts?.upgrade;

  return (
    <View style={[styles.container, { backgroundColor: c.background }]}>
      <ScrollView
        contentContainerStyle={{ paddingBottom: insets.bottom + (Platform.OS === "web" ? 34 : 90) }}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
        showsVerticalScrollIndicator={false}
      >
        <View style={[styles.header, { paddingTop: insets.top + (Platform.OS === "web" ? 67 : 12) }]}>
          <LinearGradient colors={["#1A237E", "#4A148C"]} start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }} style={StyleSheet.absoluteFill} />
          <View style={styles.headerRow}>
            <View>
              <Text style={styles.headerTitle}>Policy Monitor</Text>
              <Text style={styles.headerSub}>EWS & ChexSystems Intelligence</Text>
            </View>
            <View style={styles.liveChip}>
              <View style={styles.liveDot} />
              <Text style={styles.liveText}>Live</Text>
            </View>
          </View>

          {status && (
            <View style={styles.statusRow}>
              <View style={styles.statusChip}>
                <Feather name="database" size={12} color="rgba(255,255,255,0.8)" />
                <Text style={styles.statusChipText}>{status.totalSources.toLocaleString()} sources</Text>
              </View>
              {status.lastRun && (
                <View style={styles.statusChip}>
                  <Feather name="clock" size={12} color="rgba(255,255,255,0.8)" />
                  <Text style={styles.statusChipText}>
                    Last run: {new Date(status.lastRun.startedAt).toLocaleDateString()}
                  </Text>
                </View>
              )}
              <View style={styles.statusChip}>
                <Feather name="activity" size={12} color={status.sourceHealth.dead > 0 ? "#FFB300" : "#00C853"} />
                <Text style={styles.statusChipText}>{status.sourceHealth.alive}/{status.sourceHealth.total} alive</Text>
              </View>
            </View>
          )}
        </View>

        <View style={[styles.sectionPad, { backgroundColor: c.background }]}>
          {isGated ? (
            <View style={[styles.gateCard, { backgroundColor: c.card, borderColor: c.cardBorder }]}>
              <LinearGradient colors={["#1A237E22", "#4A148C22"]} style={StyleSheet.absoluteFill} />
              <Feather name="lock" size={32} color="#4A148C" />
              <Text style={[styles.gateTitle, { color: c.text }]}>Pro Feature</Text>
              <Text style={[styles.gateBody, { color: c.textSecondary }]}>
                {alerts?.preview?.message ?? "Subscribe to Pro to access real-time EWS/ChexSystems policy monitoring and bank bonus intelligence."}
              </Text>

              {alerts?.preview?.sampleEvents && (
                <View style={styles.sampleList}>
                  <Text style={[styles.sampleTitle, { color: c.textSecondary }]}>Sample alerts:</Text>
                  {alerts.preview.sampleEvents.map((e, i) => (
                    <View key={i} style={[styles.sampleRow, { borderColor: c.cardBorder }]}>
                      <View style={[styles.sampleDot, { backgroundColor: SEVERITY_COLORS[e.severity] ?? "#555" }]} />
                      <Text style={[styles.sampleText, { color: c.text }]} numberOfLines={2}>{e.summary}</Text>
                    </View>
                  ))}
                </View>
              )}

              <Pressable style={styles.upgradeBtn} onPress={() => router.push("/subscription")}>
                <LinearGradient colors={["#1A237E", "#4A148C"]} start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }} style={styles.upgradeBtnGrad}>
                  <Feather name="zap" size={16} color="#fff" />
                  <Text style={styles.upgradeBtnText}>Upgrade to Pro</Text>
                </LinearGradient>
              </Pressable>
            </View>
          ) : (
            <>
              {alerts?.summary && (
                <View style={styles.statsGrid}>
                  <StatBox label="Last 24h Alerts" value={alerts.summary.last24hEvents} icon="bell" color="#E91E63" />
                  <StatBox label="7-Day Events" value={alerts.summary.last7dEvents} icon="trending-up" color="#1E88E5" />
                  <StatBox label="High Severity" value={alerts.summary.highSeverityAlerts} icon="alert-triangle" color="#F44336" />
                  <StatBox label="Sources Monitored" value={(status?.totalSources ?? 0).toLocaleString()} icon="globe" color="#00897B" />
                </View>
              )}

              {alerts?.summary?.topBanks && alerts.summary.topBanks.length > 0 && (
                <View style={[styles.card, { backgroundColor: c.card, borderColor: c.cardBorder }]}>
                  <Text style={[styles.cardTitle, { color: c.text }]}>Most Mentioned Banks (7 days)</Text>
                  {alerts.summary.topBanks.slice(0, 6).map((b, i) => (
                    <View key={b.bank} style={[styles.topBankRow, { borderColor: c.cardBorder }]}>
                      <Text style={[styles.topBankRank, { color: c.textTertiary }]}>#{i + 1}</Text>
                      <Text style={[styles.topBankName, { color: c.text }]}>{b.bank}</Text>
                      <View style={[styles.topBankBar, { backgroundColor: c.backgroundSecondary }]}>
                        <LinearGradient
                          colors={["#1A237E", "#4A148C"]}
                          start={{ x: 0, y: 0 }}
                          end={{ x: 1, y: 0 }}
                          style={[styles.topBankBarFill, { width: `${Math.min((b.count / (alerts.summary.topBanks[0]?.count ?? 1)) * 100, 100)}%` as any }]}
                        />
                      </View>
                      <Text style={[styles.topBankCount, { color: c.textSecondary }]}>{b.count}</Text>
                    </View>
                  ))}
                </View>
              )}

              <View style={[styles.filtersWrap]}>
                <ScrollView horizontal showsHorizontalScrollIndicator={false}>
                  {[
                    { key: "all", label: "All" },
                    { key: "high", label: "High Severity" },
                    { key: "policy_update", label: "Policy Updates" },
                    { key: "bank_opened", label: "Opened" },
                    { key: "bank_closed", label: "Closed" },
                  ].map(f => (
                    <Pressable
                      key={f.key}
                      onPress={() => setFilter(f.key as any)}
                      style={[styles.filterChip, filter === f.key && styles.filterChipActive]}
                    >
                      <Text style={[styles.filterChipText, filter === f.key && styles.filterChipTextActive]}>{f.label}</Text>
                    </Pressable>
                  ))}
                </ScrollView>
              </View>

              {filteredEvents.length === 0 ? (
                <View style={styles.emptyState}>
                  <Feather name="shield" size={40} color={c.textTertiary} />
                  <Text style={[styles.emptyTitle, { color: c.textSecondary }]}>No events found</Text>
                  <Text style={[styles.emptyBody, { color: c.textTertiary }]}>
                    No matching monitor events in the last 7 days. The engine checks {status?.totalSources?.toLocaleString() ?? "1,000+"} sources every 6 hours.
                  </Text>
                </View>
              ) : (
                <View>
                  <Text style={[styles.eventCountLabel, { color: c.textSecondary }]}>{filteredEvents.length} event{filteredEvents.length !== 1 ? "s" : ""}</Text>
                  {filteredEvents.map(e => (
                    <EventCard key={e.id} event={e} isDark={isDark} />
                  ))}
                </View>
              )}
            </>
          )}

          <View style={[styles.infoCard, { backgroundColor: c.card, borderColor: c.cardBorder }]}>
            <Feather name="info" size={14} color={c.textSecondary} />
            <Text style={[styles.infoText, { color: c.textSecondary }]}>
              The monitor checks CFPB complaint feeds, Reddit communities, DoC deal pages, bank newsrooms, federal regulators, and 1,000+ other sources every 6 hours. Results reflect publicly available data.
            </Text>
          </View>
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: { paddingHorizontal: 20, paddingBottom: 20, overflow: "hidden" },
  headerRow: { flexDirection: "row", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 12 },
  headerTitle: { color: "#fff", fontSize: 24, fontFamily: "Inter_700Bold" },
  headerSub: { color: "rgba(255,255,255,0.7)", fontSize: 13, fontFamily: "Inter_400Regular", marginTop: 2 },
  liveChip: { flexDirection: "row", alignItems: "center", backgroundColor: "rgba(255,255,255,0.15)", borderRadius: 20, paddingHorizontal: 10, paddingVertical: 4, gap: 5 },
  liveDot: { width: 6, height: 6, borderRadius: 3, backgroundColor: "#00C853" },
  liveText: { color: "#fff", fontSize: 11, fontFamily: "Inter_600SemiBold" },
  statusRow: { flexDirection: "row", flexWrap: "wrap", gap: 8 },
  statusChip: { flexDirection: "row", alignItems: "center", gap: 4, backgroundColor: "rgba(255,255,255,0.12)", borderRadius: 12, paddingHorizontal: 8, paddingVertical: 4 },
  statusChipText: { color: "rgba(255,255,255,0.85)", fontSize: 11, fontFamily: "Inter_400Regular" },
  loadingWrap: { flex: 1, alignItems: "center", justifyContent: "center", gap: 12 },
  loadingText: { fontSize: 14, fontFamily: "Inter_400Regular" },
  sectionPad: { padding: 16 },
  gateCard: { borderRadius: 16, borderWidth: 1, padding: 28, alignItems: "center", gap: 12, overflow: "hidden" },
  gateTitle: { fontSize: 20, fontFamily: "Inter_700Bold" },
  gateBody: { fontSize: 14, fontFamily: "Inter_400Regular", textAlign: "center", lineHeight: 22 },
  sampleList: { width: "100%", gap: 8, marginTop: 4 },
  sampleTitle: { fontSize: 12, fontFamily: "Inter_600SemiBold", marginBottom: 4 },
  sampleRow: { flexDirection: "row", alignItems: "flex-start", gap: 8, paddingVertical: 6, borderTopWidth: StyleSheet.hairlineWidth },
  sampleDot: { width: 8, height: 8, borderRadius: 4, marginTop: 4 },
  sampleText: { flex: 1, fontSize: 13, fontFamily: "Inter_400Regular", lineHeight: 18 },
  upgradeBtn: { width: "100%", borderRadius: 12, overflow: "hidden", marginTop: 4 },
  upgradeBtnGrad: { flexDirection: "row", alignItems: "center", justifyContent: "center", paddingVertical: 14, gap: 8 },
  upgradeBtnText: { color: "#fff", fontSize: 16, fontFamily: "Inter_700Bold" },
  statsGrid: { flexDirection: "row", flexWrap: "wrap", gap: 10, marginBottom: 16 },
  statBox: { flex: 1, minWidth: "45%", borderRadius: 12, borderWidth: 1, padding: 14, alignItems: "center", gap: 4 },
  statValue: { fontSize: 22, fontFamily: "Inter_700Bold" },
  statLabel: { fontSize: 11, color: "#999", fontFamily: "Inter_400Regular", textAlign: "center" },
  card: { borderRadius: 16, borderWidth: 1, padding: 16, marginBottom: 16 },
  cardTitle: { fontSize: 15, fontFamily: "Inter_700Bold", marginBottom: 12 },
  topBankRow: { flexDirection: "row", alignItems: "center", paddingVertical: 8, borderTopWidth: StyleSheet.hairlineWidth, gap: 8 },
  topBankRank: { fontSize: 11, fontFamily: "Inter_600SemiBold", width: 24 },
  topBankName: { fontSize: 13, fontFamily: "Inter_600SemiBold", width: 110 },
  topBankBar: { flex: 1, height: 6, borderRadius: 3, overflow: "hidden" },
  topBankBarFill: { height: "100%", borderRadius: 3 },
  topBankCount: { fontSize: 12, fontFamily: "Inter_400Regular", width: 30, textAlign: "right" },
  filtersWrap: { marginBottom: 16 },
  filterChip: { paddingHorizontal: 14, paddingVertical: 8, borderRadius: 20, backgroundColor: "#E8EAF6", marginRight: 8 },
  filterChipActive: { backgroundColor: "#4A148C" },
  filterChipText: { fontSize: 12, fontFamily: "Inter_600SemiBold", color: "#555" },
  filterChipTextActive: { color: "#fff" },
  eventCountLabel: { fontSize: 12, fontFamily: "Inter_400Regular", marginBottom: 8 },
  eventCard: { borderRadius: 12, borderWidth: 1, borderLeftWidth: 3, padding: 14, marginBottom: 12 },
  eventCardTop: { flexDirection: "row", alignItems: "flex-start", marginBottom: 10 },
  eventIconWrap: { width: 32, height: 32, borderRadius: 16, alignItems: "center", justifyContent: "center" },
  eventBadgeRow: { flexDirection: "row", gap: 6, marginBottom: 4 },
  catBadge: { borderRadius: 6, paddingHorizontal: 6, paddingVertical: 2 },
  catBadgeText: { fontSize: 9, fontFamily: "Inter_700Bold" },
  sevBadge: { borderRadius: 6, paddingHorizontal: 6, paddingVertical: 2 },
  sevBadgeText: { fontSize: 9, fontFamily: "Inter_700Bold" },
  changeTypeLabel: { fontSize: 11, fontFamily: "Inter_600SemiBold" },
  eventDate: { fontSize: 11, fontFamily: "Inter_400Regular" },
  eventSummary: { fontSize: 14, fontFamily: "Inter_400Regular", lineHeight: 20, marginBottom: 8 },
  banksRow: { flexDirection: "row", flexWrap: "wrap", gap: 6, marginBottom: 6 },
  bankPill: { borderRadius: 8, borderWidth: 1, paddingHorizontal: 8, paddingVertical: 3 },
  bankPillText: { fontSize: 11, fontFamily: "Inter_600SemiBold" },
  moreBanks: { fontSize: 11, fontFamily: "Inter_400Regular", alignSelf: "center" },
  sourceName: { fontSize: 10, fontFamily: "Inter_400Regular" },
  emptyState: { alignItems: "center", gap: 10, paddingVertical: 40 },
  emptyTitle: { fontSize: 16, fontFamily: "Inter_600SemiBold" },
  emptyBody: { fontSize: 13, fontFamily: "Inter_400Regular", textAlign: "center", lineHeight: 20, maxWidth: 300 },
  infoCard: { flexDirection: "row", alignItems: "flex-start", gap: 8, borderRadius: 12, borderWidth: 1, padding: 14, marginTop: 8 },
  infoText: { flex: 1, fontSize: 12, fontFamily: "Inter_400Regular", lineHeight: 18 },
});
