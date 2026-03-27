import { Feather } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import React, { useMemo } from "react";
import {
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
  useColorScheme,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import Colors from "@/constants/colors";
import { useAccounts } from "@/context/AccountsContext";
import { useScheduler } from "@/context/SchedulerContext";
import { useCredits } from "@/context/CreditsContext";
import { BANKS } from "@/constants/banks";

function MetricCard({ title, value, sub, icon, gradient, trend }: {
  title: string; value: string; sub: string; icon: string;
  gradient: readonly [string, string]; trend?: number;
}) {
  return (
    <View style={aStyles.metricCard}>
      <LinearGradient colors={gradient as any} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={StyleSheet.absoluteFill} />
      <View style={aStyles.metricIcon}>
        <Feather name={icon as any} size={20} color="rgba(255,255,255,0.9)" />
      </View>
      <Text style={aStyles.metricValue}>{value}</Text>
      <Text style={aStyles.metricTitle}>{title}</Text>
      <View style={aStyles.metricBottom}>
        <Text style={aStyles.metricSub}>{sub}</Text>
        {trend !== undefined && (
          <View style={aStyles.trendBadge}>
            <Feather name={trend >= 0 ? "trending-up" : "trending-down"} size={11} color={trend >= 0 ? "#00C853" : "#F44336"} />
            <Text style={[aStyles.trendText, { color: trend >= 0 ? "#00C853" : "#F44336" }]}>{Math.abs(trend)}%</Text>
          </View>
        )}
      </View>
    </View>
  );
}

function BarChart({ data, maxVal, label }: { data: { name: string; value: number; color: string }[]; maxVal: number; label: string }) {
  const colorScheme = useColorScheme();
  const isDark = colorScheme === "dark";
  const c = isDark ? Colors.dark : Colors.light;

  return (
    <View style={aStyles.barChart}>
      <Text style={[aStyles.chartLabel, { color: c.textSecondary }]}>{label}</Text>
      {data.map(item => (
        <View key={item.name} style={aStyles.barRow}>
          <Text style={[aStyles.barName, { color: c.textSecondary }]} numberOfLines={1}>{item.name}</Text>
          <View style={[aStyles.barTrack, { backgroundColor: c.backgroundTertiary }]}>
            <View style={[aStyles.barFill, { width: `${(item.value / maxVal) * 100}%` as any, backgroundColor: item.color }]} />
          </View>
          <Text style={[aStyles.barValue, { color: c.text }]}>${item.value}</Text>
        </View>
      ))}
    </View>
  );
}

export default function AnalyticsScreen() {
  const insets = useSafeAreaInsets();
  const colorScheme = useColorScheme();
  const isDark = colorScheme === "dark";
  const c = isDark ? Colors.dark : Colors.light;
  const { accounts, totalBonusEarned, totalBonusPending, totalDeposited } = useAccounts();
  const { events } = useScheduler();
  const { totalCredits, usedCredits, availableCredits, transactions } = useCredits();

  const roi = totalDeposited > 0 ? ((totalBonusEarned / totalDeposited) * 100).toFixed(1) : "0.0";

  const statusBreakdown = useMemo(() => {
    const pending = accounts.filter(a => a.status === "pending").length;
    const active = accounts.filter(a => a.status === "active").length;
    const received = accounts.filter(a => a.status === "bonus_received").length;
    const closed = accounts.filter(a => a.status === "closed").length;
    return { pending, active, received, closed };
  }, [accounts]);

  const topAccounts = useMemo(() => {
    return [...accounts]
      .sort((a, b) => b.bonusAmount - a.bonusAmount)
      .slice(0, 5)
      .map(a => ({ name: a.bankName, value: a.bonusAmount, color: a.logoColor }));
  }, [accounts]);

  const maxBonus = topAccounts.length > 0 ? Math.max(...topAccounts.map(a => a.value)) : 1;

  const scheduledThisMonth = useMemo(() => {
    const now = new Date();
    const prefix = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}`;
    return events.filter(e => e.date.startsWith(prefix)).length;
  }, [events]);

  const totalScheduledAmount = useMemo(() => {
    return events.filter(e => e.status === "scheduled").reduce((sum, e) => sum + e.amount, 0);
  }, [events]);

  const ewsFreeCount = BANKS.filter(b => !b.ewsReporting).length;
  const noMinCount = BANKS.filter(b => b.noMonthlyMinimum).length;

  return (
    <View style={[aStyles.container, { backgroundColor: c.background }]}>
      <View style={[aStyles.header, { paddingTop: insets.top + (Platform.OS === "web" ? 67 : 12) }]}>
        <LinearGradient colors={["#833AB4", "#E1306C", "#F77737"]} start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }} style={StyleSheet.absoluteFill} />
        <Text style={aStyles.headerTitle}>Analytics</Text>
        <Text style={aStyles.headerSub}>Performance overview</Text>
      </View>

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ padding: 16, gap: 16, paddingBottom: insets.bottom + (Platform.OS === "web" ? 34 : 80) }}
      >
        <View style={aStyles.metricsGrid}>
          <MetricCard title="Earned" value={`$${totalBonusEarned.toLocaleString()}`} sub="Bonus received" icon="dollar-sign" gradient={["#00C853", "#00897B"]} trend={12} />
          <MetricCard title="Pending" value={`$${totalBonusPending.toLocaleString()}`} sub="In progress" icon="clock" gradient={["#833AB4", "#9C27B0"]} />
          <MetricCard title="ROI" value={`${roi}%`} sub="Return on deposit" icon="trending-up" gradient={["#E1306C", "#F77737"]} trend={parseFloat(roi)} />
          <MetricCard title="Deployed" value={`$${totalDeposited.toLocaleString()}`} sub="Total deposited" icon="send" gradient={["#2196F3", "#0D47A1"]} />
        </View>

        <View style={[aStyles.section, { backgroundColor: c.card, borderColor: c.cardBorder }]}>
          <Text style={[aStyles.sectionTitle, { color: c.text }]}>Account Status</Text>
          <View style={aStyles.statusGrid}>
            {[
              { label: "Pending", value: statusBreakdown.pending, color: "#FFB300" },
              { label: "Active", value: statusBreakdown.active, color: "#2196F3" },
              { label: "Received", value: statusBreakdown.received, color: "#00C853" },
              { label: "Closed", value: statusBreakdown.closed, color: "#9E9E9E" },
            ].map(s => (
              <View key={s.label} style={[aStyles.statusItem, { backgroundColor: s.color + "18" }]}>
                <Text style={[aStyles.statusCount, { color: s.color }]}>{s.value}</Text>
                <Text style={[aStyles.statusLabel, { color: c.textSecondary }]}>{s.label}</Text>
              </View>
            ))}
          </View>
        </View>

        <View style={[aStyles.section, { backgroundColor: c.card, borderColor: c.cardBorder }]}>
          <Text style={[aStyles.sectionTitle, { color: c.text }]}>Credits Balance</Text>
          <View style={aStyles.creditsRow}>
            <View style={aStyles.creditStat}>
              <Text style={[aStyles.creditStatValue, { color: "#00C853" }]}>${availableCredits.toLocaleString()}</Text>
              <Text style={[aStyles.creditStatLabel, { color: c.textSecondary }]}>Available</Text>
            </View>
            <View style={[aStyles.creditDivider, { backgroundColor: c.separator }]} />
            <View style={aStyles.creditStat}>
              <Text style={[aStyles.creditStatValue, { color: "#E1306C" }]}>${usedCredits.toLocaleString()}</Text>
              <Text style={[aStyles.creditStatLabel, { color: c.textSecondary }]}>Deployed</Text>
            </View>
            <View style={[aStyles.creditDivider, { backgroundColor: c.separator }]} />
            <View style={aStyles.creditStat}>
              <Text style={[aStyles.creditStatValue, { color: "#833AB4" }]}>${totalCredits.toLocaleString()}</Text>
              <Text style={[aStyles.creditStatLabel, { color: c.textSecondary }]}>Total</Text>
            </View>
          </View>
          <View style={[aStyles.creditBar, { backgroundColor: c.backgroundTertiary }]}>
            <LinearGradient
              colors={["#833AB4", "#E1306C"]}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 0 }}
              style={[aStyles.creditBarFill, { width: totalCredits > 0 ? `${(usedCredits / totalCredits) * 100}%` as any : "0%" }]}
            />
          </View>
          <Text style={[aStyles.creditBarLabel, { color: c.textTertiary }]}>
            {totalCredits > 0 ? `${((usedCredits / totalCredits) * 100).toFixed(0)}%` : "0%"} deployed
          </Text>
        </View>

        {topAccounts.length > 0 && (
          <View style={[aStyles.section, { backgroundColor: c.card, borderColor: c.cardBorder }]}>
            <BarChart data={topAccounts} maxVal={maxBonus} label="Top Bonuses by Account" />
          </View>
        )}

        <View style={[aStyles.section, { backgroundColor: c.card, borderColor: c.cardBorder }]}>
          <Text style={[aStyles.sectionTitle, { color: c.text }]}>Scheduler Overview</Text>
          <View style={aStyles.schedulerStats}>
            <View style={aStyles.schedulerStat}>
              <Feather name="calendar" size={20} color="#F77737" />
              <Text style={[aStyles.schedulerStatValue, { color: c.text }]}>{scheduledThisMonth}</Text>
              <Text style={[aStyles.schedulerStatLabel, { color: c.textSecondary }]}>This Month</Text>
            </View>
            <View style={aStyles.schedulerStat}>
              <Feather name="activity" size={20} color="#833AB4" />
              <Text style={[aStyles.schedulerStatValue, { color: c.text }]}>{events.length}</Text>
              <Text style={[aStyles.schedulerStatLabel, { color: c.textSecondary }]}>Total Events</Text>
            </View>
            <View style={aStyles.schedulerStat}>
              <Feather name="dollar-sign" size={20} color="#00C853" />
              <Text style={[aStyles.schedulerStatValue, { color: c.text }]}>${totalScheduledAmount.toLocaleString()}</Text>
              <Text style={[aStyles.schedulerStatLabel, { color: c.textSecondary }]}>Scheduled $</Text>
            </View>
          </View>
        </View>

        <View style={[aStyles.section, { backgroundColor: c.card, borderColor: c.cardBorder }]}>
          <Text style={[aStyles.sectionTitle, { color: c.text }]}>Database Stats</Text>
          <View style={aStyles.dbStats}>
            {[
              { label: "Total Banks", value: "7,000+", icon: "database", color: "#2196F3" },
              { label: "Fintechs", value: "13,000+", icon: "zap", color: "#9C27B0" },
              { label: "No-EWS Banks", value: `${ewsFreeCount}`, icon: "shield", color: "#00C853" },
              { label: "No Minimum", value: `${noMinCount}`, icon: "check-circle", color: "#F77737" },
            ].map(s => (
              <View key={s.label} style={[aStyles.dbStat, { backgroundColor: s.color + "14" }]}>
                <Feather name={s.icon as any} size={16} color={s.color} />
                <Text style={[aStyles.dbStatValue, { color: s.color }]}>{s.value}</Text>
                <Text style={[aStyles.dbStatLabel, { color: c.textSecondary }]}>{s.label}</Text>
              </View>
            ))}
          </View>
        </View>

        {transactions.length > 0 && (
          <View style={[aStyles.section, { backgroundColor: c.card, borderColor: c.cardBorder }]}>
            <Text style={[aStyles.sectionTitle, { color: c.text }]}>Recent Transactions</Text>
            {transactions.slice(0, 5).map(tx => (
              <View key={tx.id} style={[aStyles.txRow, { borderBottomColor: c.separator }]}>
                <View style={[aStyles.txIcon, { backgroundColor: tx.type === "purchase" ? "#833AB422" : "#E1306C22" }]}>
                  <Feather name={tx.type === "purchase" ? "credit-card" : "send"} size={14} color={tx.type === "purchase" ? "#833AB4" : "#E1306C"} />
                </View>
                <View style={aStyles.txInfo}>
                  <Text style={[aStyles.txType, { color: c.text }]}>{tx.type === "purchase" ? "Credit Purchase" : `Deployed to ${tx.bankName}`}</Text>
                  <Text style={[aStyles.txDate, { color: c.textSecondary }]}>{new Date(tx.date).toLocaleDateString()}</Text>
                </View>
                <Text style={[aStyles.txAmount, { color: tx.type === "purchase" ? "#00C853" : "#E1306C" }]}>
                  {tx.type === "purchase" ? "+" : "-"}${tx.amount.toLocaleString()}
                </Text>
              </View>
            ))}
          </View>
        )}
      </ScrollView>
    </View>
  );
}

const aStyles = StyleSheet.create({
  container: { flex: 1 },
  header: { paddingHorizontal: 16, paddingBottom: 16 },
  headerTitle: { fontSize: 28, fontFamily: "Inter_700Bold", color: "#fff" },
  headerSub: { fontSize: 13, fontFamily: "Inter_400Regular", color: "rgba(255,255,255,0.7)", marginTop: 2 },
  metricsGrid: { flexDirection: "row", flexWrap: "wrap", gap: 10 },
  metricCard: { width: "47%" as any, borderRadius: 16, overflow: "hidden", padding: 14, minHeight: 110 },
  metricIcon: { marginBottom: 8 },
  metricValue: { fontSize: 24, fontFamily: "Inter_700Bold", color: "#fff" },
  metricTitle: { fontSize: 12, fontFamily: "Inter_400Regular", color: "rgba(255,255,255,0.8)", marginTop: 2 },
  metricBottom: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", marginTop: 4 },
  metricSub: { fontSize: 11, fontFamily: "Inter_400Regular", color: "rgba(255,255,255,0.6)" },
  trendBadge: { flexDirection: "row", alignItems: "center", gap: 2, backgroundColor: "rgba(255,255,255,0.15)", paddingHorizontal: 5, paddingVertical: 2, borderRadius: 6 },
  trendText: { fontSize: 10, fontFamily: "Inter_700Bold" },
  section: { borderRadius: 16, borderWidth: 1, padding: 16 },
  sectionTitle: { fontSize: 16, fontFamily: "Inter_700Bold", marginBottom: 14 },
  statusGrid: { flexDirection: "row", gap: 8 },
  statusItem: { flex: 1, borderRadius: 12, padding: 10, alignItems: "center" },
  statusCount: { fontSize: 22, fontFamily: "Inter_700Bold" },
  statusLabel: { fontSize: 10, fontFamily: "Inter_400Regular", marginTop: 2 },
  creditsRow: { flexDirection: "row", marginBottom: 12 },
  creditStat: { flex: 1, alignItems: "center" },
  creditStatValue: { fontSize: 18, fontFamily: "Inter_700Bold" },
  creditStatLabel: { fontSize: 11, fontFamily: "Inter_400Regular", marginTop: 2 },
  creditDivider: { width: 1, marginVertical: 4 },
  creditBar: { height: 8, borderRadius: 4, overflow: "hidden" },
  creditBarFill: { height: 8, borderRadius: 4 },
  creditBarLabel: { fontSize: 11, fontFamily: "Inter_400Regular", marginTop: 4, textAlign: "right" },
  barChart: { gap: 10 },
  chartLabel: { fontSize: 13, fontFamily: "Inter_600SemiBold", marginBottom: 4 },
  barRow: { flexDirection: "row", alignItems: "center", gap: 8 },
  barName: { width: 80, fontSize: 11, fontFamily: "Inter_400Regular" },
  barTrack: { flex: 1, height: 8, borderRadius: 4, overflow: "hidden" },
  barFill: { height: 8, borderRadius: 4 },
  barValue: { width: 50, fontSize: 11, fontFamily: "Inter_600SemiBold", textAlign: "right" },
  schedulerStats: { flexDirection: "row", justifyContent: "space-around" },
  schedulerStat: { alignItems: "center", gap: 4 },
  schedulerStatValue: { fontSize: 20, fontFamily: "Inter_700Bold" },
  schedulerStatLabel: { fontSize: 11, fontFamily: "Inter_400Regular" },
  dbStats: { flexDirection: "row", flexWrap: "wrap", gap: 8 },
  dbStat: { width: "47%" as any, borderRadius: 12, padding: 12, alignItems: "center", gap: 4 },
  dbStatValue: { fontSize: 18, fontFamily: "Inter_700Bold" },
  dbStatLabel: { fontSize: 11, fontFamily: "Inter_400Regular" },
  txRow: { flexDirection: "row", alignItems: "center", gap: 10, paddingVertical: 10, borderBottomWidth: 1 },
  txIcon: { width: 32, height: 32, borderRadius: 8, alignItems: "center", justifyContent: "center" },
  txInfo: { flex: 1 },
  txType: { fontSize: 13, fontFamily: "Inter_600SemiBold" },
  txDate: { fontSize: 11, fontFamily: "Inter_400Regular", marginTop: 2 },
  txAmount: { fontSize: 14, fontFamily: "Inter_700Bold" },
});
