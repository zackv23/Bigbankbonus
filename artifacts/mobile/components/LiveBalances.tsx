import { Feather } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import React, { useCallback, useEffect, useRef, useState } from "react";
import {
  ActivityIndicator,
  AppState,
  Pressable,
  StyleSheet,
  Text,
  View,
  useColorScheme,
} from "react-native";
import Colors from "@/constants/colors";
import { PlaidAccount, usePlaid } from "@/context/PlaidContext";

interface LiveBalancesProps {
  style?: object;
  isFocused?: boolean;
}

export default function LiveBalances({ style, isFocused }: LiveBalancesProps) {
  const colorScheme = useColorScheme();
  const isDark = colorScheme === "dark";
  const c = isDark ? Colors.dark : Colors.light;
  const { items, refreshBalance } = usePlaid();
  const [refreshing, setRefreshing] = useState(false);
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);
  const appStateRef = useRef(AppState.currentState);
  const refreshingRef = useRef(false);

  const activeItems = items.filter(i => i.status === "active");

  const allAccounts = activeItems.flatMap(i =>
    ((i.accounts as PlaidAccount[] | null) ?? []).map(a => ({ ...a, institution: i.institutionName }))
  );

  const bankAccounts = allAccounts.filter(a => a.type === "depository");
  const creditCards = allAccounts.filter(a => a.type === "credit");

  const bankTotal = bankAccounts.reduce((s, a) => s + (a.balances.available ?? 0), 0);
  const creditTotal = creditCards.reduce((s, a) => s + (a.balances.current ?? 0), 0);

  const doRefresh = useCallback(async () => {
    if (refreshingRef.current || activeItems.length === 0) return;
    refreshingRef.current = true;
    setRefreshing(true);
    await Promise.all(activeItems.map(item => refreshBalance(item.itemId)));
    setLastUpdated(new Date());
    refreshingRef.current = false;
    setRefreshing(false);
  }, [activeItems, refreshBalance]);

  useEffect(() => {
    if (activeItems.length > 0) {
      doRefresh();
    }
  }, [activeItems.length]);

  useEffect(() => {
    if (isFocused && activeItems.length > 0) {
      doRefresh();
    }
  }, [isFocused, activeItems.length]);

  useEffect(() => {
    const sub = AppState.addEventListener("change", nextState => {
      if (appStateRef.current.match(/inactive|background/) && nextState === "active") {
        doRefresh();
      }
      appStateRef.current = nextState;
    });
    return () => sub.remove();
  }, [doRefresh]);

  if (activeItems.length === 0) return null;

  const fmt = (n: number) =>
    n.toLocaleString("en-US", { style: "currency", currency: "USD", maximumFractionDigits: 0 });

  const timeAgo = lastUpdated
    ? `Updated ${lastUpdated.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}`
    : "Tap Refresh to update";

  return (
    <View style={[ls.wrapper, style]}>
      <View style={ls.titleRow}>
        <View style={ls.titleLeft}>
          <Feather name="activity" size={15} color="#833AB4" />
          <Text style={[ls.title, { color: c.text }]}>Live Balances</Text>
        </View>
        <Pressable
          style={[ls.refreshBtn, { backgroundColor: c.backgroundSecondary }]}
          onPress={doRefresh}
          disabled={refreshing}
        >
          {refreshing ? (
            <ActivityIndicator size={13} color="#833AB4" />
          ) : (
            <Feather name="refresh-cw" size={13} color="#833AB4" />
          )}
          <Text style={[ls.refreshText, { color: "#833AB4" }]}>Refresh</Text>
        </Pressable>
      </View>

      <View style={ls.cardsRow}>
        {/* Bank/Checking/Savings card */}
        <View style={[ls.balCard, { backgroundColor: c.card, borderColor: c.cardBorder }]}>
          <LinearGradient colors={["#2196F3", "#00BCD4"]} style={ls.cardIconBg}>
            <Feather name="trending-up" size={14} color="#fff" />
          </LinearGradient>
          <Text style={[ls.cardLabel, { color: c.textSecondary }]}>Bank Accounts</Text>
          <Text style={[ls.cardAmount, { color: c.text }]}>{fmt(bankTotal)}</Text>
          {bankAccounts.length > 0 && (
            <View style={ls.subList}>
              {bankAccounts.map((a, i) => (
                <View key={a.account_id ?? i} style={ls.subRow}>
                  <View style={[ls.subDot, { backgroundColor: a.subtype === "checking" ? "#2196F3" : "#4CAF50" }]} />
                  <Text style={[ls.subName, { color: c.textSecondary }]} numberOfLines={1}>
                    {a.name}
                  </Text>
                  <Text style={[ls.subAmt, { color: c.text }]}>
                    {fmt(a.balances.available ?? 0)}
                  </Text>
                </View>
              ))}
            </View>
          )}
        </View>

        {/* Credit card card */}
        <View style={[ls.balCard, { backgroundColor: c.card, borderColor: c.cardBorder }]}>
          <LinearGradient colors={["#E1306C", "#F77737"]} style={ls.cardIconBg}>
            <Feather name="credit-card" size={14} color="#fff" />
          </LinearGradient>
          <Text style={[ls.cardLabel, { color: c.textSecondary }]}>Credit Cards</Text>
          <Text style={[ls.cardAmount, { color: c.text }]}>
            {creditCards.length > 0 ? fmt(creditTotal) : "—"}
          </Text>
          {creditCards.length > 0 ? (
            <View style={ls.subList}>
              {creditCards.map((a, i) => (
                <View key={a.account_id ?? i} style={ls.subRow}>
                  <View style={[ls.subDot, { backgroundColor: "#E1306C" }]} />
                  <Text style={[ls.subName, { color: c.textSecondary }]} numberOfLines={1}>
                    {a.name}
                  </Text>
                  <Text style={[ls.subAmt, { color: c.text }]}>
                    {fmt(a.balances.current ?? 0)}
                  </Text>
                </View>
              ))}
            </View>
          ) : (
            <Text style={[ls.noCC, { color: c.textTertiary }]}>No credit cards linked</Text>
          )}
        </View>
      </View>

      <Text style={[ls.updated, { color: c.textTertiary }]}>{timeAgo}</Text>
    </View>
  );
}

const ls = StyleSheet.create({
  wrapper: { gap: 10 },
  titleRow: { flexDirection: "row", alignItems: "center", justifyContent: "space-between" },
  titleLeft: { flexDirection: "row", alignItems: "center", gap: 6 },
  title: { fontSize: 15, fontFamily: "Inter_600SemiBold" },
  refreshBtn: { flexDirection: "row", alignItems: "center", gap: 5, paddingHorizontal: 10, paddingVertical: 6, borderRadius: 8 },
  refreshText: { fontSize: 12, fontFamily: "Inter_600SemiBold" },
  cardsRow: { flexDirection: "row", gap: 10 },
  balCard: { flex: 1, borderRadius: 14, borderWidth: 1, padding: 12, gap: 6 },
  cardIconBg: { width: 30, height: 30, borderRadius: 8, alignItems: "center", justifyContent: "center", marginBottom: 4 },
  cardLabel: { fontSize: 11, fontFamily: "Inter_600SemiBold", textTransform: "uppercase", letterSpacing: 0.3 },
  cardAmount: { fontSize: 20, fontFamily: "Inter_700Bold" },
  subList: { gap: 4, marginTop: 4 },
  subRow: { flexDirection: "row", alignItems: "center", gap: 5 },
  subDot: { width: 6, height: 6, borderRadius: 3 },
  subName: { flex: 1, fontSize: 11, fontFamily: "Inter_400Regular" },
  subAmt: { fontSize: 11, fontFamily: "Inter_600SemiBold" },
  noCC: { fontSize: 12, fontFamily: "Inter_400Regular", marginTop: 4 },
  updated: { fontSize: 10, fontFamily: "Inter_400Regular", textAlign: "right" },
});
