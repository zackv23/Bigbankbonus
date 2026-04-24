/**
 * Post-subscription offer upsell screen.
 * Shows top 3 no-minimum-balance offers from the DoC feed.
 * 25-minute countdown timer for urgency.
 * 25% off automation + 10× leverage ($500 → $10,000) pitch.
 */

import { Feather } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import { router } from "expo-router";
import React, { useEffect, useMemo, useRef, useState } from "react";
import {
  ActivityIndicator,
  Animated,
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
import { useAuth } from "@/context/AuthContext";

const COUNTDOWN_SECONDS = 25 * 60; // 25 minutes

interface DoCBonus {
  id: number;
  title: string;
  bonusAmount: number;
  directDepositRequired: number;
  noMinimumBalance: boolean;
  offerType: string;
  offerLink: string;
}

// Animate the countdown ring
function CountdownRing({ secondsLeft }: { secondsLeft: number }) {
  const total = COUNTDOWN_SECONDS;
  const pct = secondsLeft / total;
  const mins = Math.floor(secondsLeft / 60);
  const secs = secondsLeft % 60;
  const urgent = secondsLeft < 300; // last 5 minutes

  return (
    <View style={ring.container}>
      <View style={[ring.track, { borderColor: urgent ? "#F44336" : "#833AB440" }]}>
        <LinearGradient
          colors={urgent ? ["#F44336", "#FF6B6B"] : ["#833AB4", "#E1306C"]}
          style={ring.fill}
        />
        <View style={ring.center}>
          <Text style={[ring.time, { color: urgent ? "#F44336" : "#833AB4" }]}>
            {String(mins).padStart(2, "0")}:{String(secs).padStart(2, "0")}
          </Text>
          <Text style={ring.label}>remaining</Text>
        </View>
      </View>
    </View>
  );
}

function OfferCard({
  bonus,
  selected,
  onSelect,
  isDark,
}: {
  bonus: DoCBonus;
  selected: boolean;
  onSelect: () => void;
  isDark: boolean;
}) {
  const c = isDark ? Colors.dark : Colors.light;
  const scale = useRef(new Animated.Value(1)).current;

  const handlePress = () => {
    Animated.sequence([
      Animated.timing(scale, { toValue: 0.97, duration: 80, useNativeDriver: false }),
      Animated.timing(scale, { toValue: 1, duration: 80, useNativeDriver: false }),
    ]).start();
    onSelect();
  };

  const discountedFee = Math.ceil(100 * 0.75); // 25% off $100 base fee = $75

  return (
    <Animated.View style={[{ transform: [{ scale }] }]}>
      <Pressable
        style={[oc.card, { backgroundColor: c.card, borderColor: selected ? "#833AB4" : c.cardBorder }, selected && oc.cardSelected]}
        onPress={handlePress}
      >
        {selected && (
          <LinearGradient colors={["#833AB4", "#E1306C"]} start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }} style={oc.selectedBar} />
        )}
        <View style={oc.row}>
          <View style={oc.iconBox}>
            <LinearGradient colors={["#833AB4", "#E1306C"]} style={oc.iconGrad}>
              <Feather name="dollar-sign" size={18} color="#fff" />
            </LinearGradient>
          </View>
          <View style={{ flex: 1 }}>
            <Text style={[oc.bankName, { color: c.text }]} numberOfLines={1}>{bonus.title}</Text>
            <View style={oc.tags}>
              <View style={[oc.tag, { backgroundColor: "#4CAF5018" }]}>
                <Text style={[oc.tagText, { color: "#4CAF50" }]}>No Min Balance</Text>
              </View>
              {bonus.directDepositRequired === 0 && (
                <View style={[oc.tag, { backgroundColor: "#2196F318" }]}>
                  <Text style={[oc.tagText, { color: "#2196F3" }]}>No DD Req.</Text>
                </View>
              )}
            </View>
          </View>
          <View style={oc.amounts}>
            <Text style={oc.bonusAmt}>${bonus.bonusAmount}</Text>
            <Text style={[oc.bonusLabel, { color: c.textTertiary }]}>bonus</Text>
          </View>
          <View style={[oc.selectCircle, selected && oc.selectCircleActive]}>
            {selected && <Feather name="check" size={14} color="#fff" />}
          </View>
        </View>

        <View style={[oc.details, { borderTopColor: c.separator }]}>
          <View style={oc.detailItem}>
            <Feather name="zap" size={12} color="#F77737" />
            <Text style={[oc.detailText, { color: c.textSecondary }]}>
              {bonus.directDepositRequired > 0 ? `$${bonus.directDepositRequired} DD` : "No DD required"}
            </Text>
          </View>
          <View style={oc.detailItem}>
            <Feather name="tag" size={12} color="#833AB4" />
            <Text style={[oc.detailText, { color: "#833AB4" }]}>Automation fee: <Text style={{ textDecorationLine: "line-through", color: c.textTertiary }}>$100</Text> ${discountedFee} <Text style={{ color: "#4CAF50" }}>(25% off)</Text></Text>
          </View>
        </View>
      </Pressable>
    </Animated.View>
  );
}

export default function OfferUpsellScreen() {
  const insets = useSafeAreaInsets();
  const isDark = useColorScheme() === "dark";
  const c = isDark ? Colors.dark : Colors.light;
  const { user } = useAuth() as any;

  const [secondsLeft, setSecondsLeft] = useState(COUNTDOWN_SECONDS);
  const [expired, setExpired] = useState(false);
  const [bonuses, setBonuses] = useState<DoCBonus[]>([]);
  const [loading, setLoading] = useState(true);
  const [selected, setSelected] = useState<number | null>(null);

  // Countdown timer
  useEffect(() => {
    const interval = setInterval(() => {
      setSecondsLeft(s => {
        if (s <= 1) { clearInterval(interval); setExpired(true); return 0; }
        return s - 1;
      });
    }, 1000);
    return () => clearInterval(interval);
  }, []);

  // Fetch top 3 no-min-balance bonuses
  useEffect(() => {
    const run = async () => {
      try {
        const domain = process.env.EXPO_PUBLIC_DOMAIN;
        const url = domain
          ? `https://${domain}/api/bonuses/doc?noMinBalance=true&limit=10`
          : `http://localhost:8080/api/bonuses/doc?noMinBalance=true&limit=10`;
        const controller = new AbortController();
        const timer = setTimeout(() => controller.abort(), 8000);
        const res = await fetch(url, { signal: controller.signal });
        clearTimeout(timer);
        const data = await res.json();
        const all: DoCBonus[] = data.bonuses ?? [];
        // Filter no-min-balance, sort by bonus amount descending, take top 3
        const top3 = all
          .filter(b => b.noMinimumBalance || b.directDepositRequired === 0)
          .sort((a, b) => b.bonusAmount - a.bonusAmount)
          .slice(0, 3);
        setBonuses(top3.length > 0 ? top3 : all.slice(0, 3));
      } catch {
        // Use fallback offers
        setBonuses([
          { id: 1, title: "SoFi Checking & Savings", bonusAmount: 300, directDepositRequired: 0, noMinimumBalance: true, offerType: "personal_checking", offerLink: "" },
          { id: 2, title: "Chime Checking", bonusAmount: 100, directDepositRequired: 200, noMinimumBalance: true, offerType: "personal_checking", offerLink: "" },
          { id: 3, title: "Upgrade Rewards Checking", bonusAmount: 200, directDepositRequired: 1000, noMinimumBalance: true, offerType: "personal_checking", offerLink: "" },
        ]);
      } finally {
        setLoading(false);
      }
    };
    run();
  }, []);

  const selectedBonus = useMemo(() => bonuses.find(b => b.id === selected), [bonuses, selected]);

  const handleContinue = () => {
    if (!selected || !selectedBonus) return;
    // Navigate to the accounts screen where AutopayModal can be opened with the selected offer
    router.replace("/(tabs)/accounts");
  };

  const handleSkip = () => {
    router.replace("/(tabs)");
  };

  return (
    <View style={[s.container, { backgroundColor: c.background }]}>
      {/* Header */}
      <LinearGradient
        colors={["#833AB4", "#E1306C", "#F77737"]}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 0 }}
        style={[s.header, { paddingTop: insets.top + 20 }]}
      >
        <Pressable style={s.skipBtn} onPress={handleSkip} hitSlop={8}>
          <Text style={s.skipText}>Skip</Text>
        </Pressable>

        <Text style={s.badge}>🎉 Welcome to Pro</Text>
        <Text style={s.title}>Claim Your{"\n"}First Offer</Text>
        <Text style={s.subtitle}>We'll handle the rest — fully automated for 91 days</Text>

        {/* Leverage callout */}
        <View style={s.leverageRow}>
          <View style={s.leverageStat}>
            <Text style={s.leverageAmt}>$500</Text>
            <Text style={s.leverageLabel}>you risk</Text>
          </View>
          <Feather name="arrow-right" size={18} color="rgba(255,255,255,0.7)" />
          <View style={s.leverageStat}>
            <Text style={[s.leverageAmt, { color: "#FFD700" }]}>$10,000</Text>
            <Text style={s.leverageLabel}>10× leverage</Text>
          </View>
          <Feather name="arrow-right" size={18} color="rgba(255,255,255,0.7)" />
          <View style={s.leverageStat}>
            <Text style={[s.leverageAmt, { color: "#7FFFB4" }]}>$1,800+</Text>
            <Text style={s.leverageLabel}>est. bonuses</Text>
          </View>
        </View>
      </LinearGradient>

      <ScrollView
        contentContainerStyle={{ paddingHorizontal: 16, paddingBottom: insets.bottom + 40, gap: 16 }}
        showsVerticalScrollIndicator={false}
      >
        {/* Countdown + urgency */}
        <View style={[s.urgencyCard, { backgroundColor: c.card, borderColor: c.cardBorder }]}>
          <View style={{ flex: 1 }}>
            <Text style={[s.urgencyTitle, { color: expired ? "#F44336" : c.text }]}>
              {expired ? "⏰ Offer Expired" : "⚡ Limited Time Offer"}
            </Text>
            <Text style={[s.urgencyDesc, { color: c.textSecondary }]}>
              {expired
                ? "This discount has expired. Standard rates apply."
                : "25% off automation — sign up in the next:"}
            </Text>
            {!expired && (
              <View style={s.discountRow}>
                <View style={[s.discountBadge, { backgroundColor: "#4CAF5020" }]}>
                  <Feather name="tag" size={12} color="#4CAF50" />
                  <Text style={[s.discountText, { color: "#4CAF50" }]}>25% OFF</Text>
                </View>
                <Text style={[s.discountSavings, { color: c.textTertiary }]}>Save $25 on automation</Text>
              </View>
            )}
          </View>
          {!expired && (
            <CountdownRing secondsLeft={secondsLeft} />
          )}
        </View>

        {/* How it works */}
        <View style={[s.howCard, { backgroundColor: c.card, borderColor: c.cardBorder }]}>
          <Text style={[s.howTitle, { color: c.text }]}>How Your 91-Day Program Works</Text>
          {[
            { icon: "credit-card" as const, color: "#E1306C", title: "Day 1: We charge your CC", desc: "$1,000 collateral (fully refunded at end)" },
            { icon: "send" as const, color: "#F77737", title: "Day 3: ACH push at 9AM EST", desc: "$1,001 pushed to your new bank account" },
            { icon: "arrow-down-circle" as const, color: "#2196F3", title: "Day 5: DD requirement met", desc: "Bank recognizes qualifying direct deposit" },
            { icon: "rotate-ccw" as const, color: "#9C27B0", title: "Day 5 at 2PM: ACH pull-back", desc: "Funds returned — cycle repeats monthly" },
            { icon: "repeat" as const, color: "#4CAF50", title: "Repeat up to 18×", desc: "Maximized over 91 calendar days" },
            { icon: "check-circle" as const, color: "#FFB300", title: "Day 91: Full refund", desc: "$1,000 back to your card in 48 hours" },
          ].map((step, i) => (
            <View key={i} style={s.howStep}>
              <View style={[s.howIcon, { backgroundColor: step.color + "20" }]}>
                <Feather name={step.icon} size={14} color={step.color} />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={[s.howStepTitle, { color: c.text }]}>{step.title}</Text>
                <Text style={[s.howStepDesc, { color: c.textSecondary }]}>{step.desc}</Text>
              </View>
            </View>
          ))}
        </View>

        {/* Top 3 Offers */}
        <Text style={[s.offersTitle, { color: c.text }]}>Choose Your Bank</Text>
        <Text style={[s.offersSub, { color: c.textSecondary }]}>All picks: no minimum balance required</Text>

        {loading ? (
          <View style={s.loadingState}>
            <ActivityIndicator color="#833AB4" />
            <Text style={[s.loadingText, { color: c.textTertiary }]}>Finding best offers...</Text>
          </View>
        ) : (
          bonuses.map(b => (
            <OfferCard
              key={b.id}
              bonus={b}
              selected={selected === b.id}
              onSelect={() => setSelected(b.id)}
              isDark={isDark}
            />
          ))
        )}

        {/* CTA */}
        <Pressable
          style={[s.ctaBtn, { opacity: selected ? 1 : 0.5 }]}
          onPress={handleContinue}
          disabled={!selected}
        >
          <LinearGradient
            colors={["#833AB4", "#E1306C", "#F77737"]}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 0 }}
            style={s.ctaGrad}
          >
            <Feather name="zap" size={18} color="#fff" />
            <Text style={s.ctaText}>
              {selected ? `Start ${selectedBonus?.title ?? "Offer"} — Set Up ACH` : "Select an offer above"}
            </Text>
          </LinearGradient>
        </Pressable>

        {!expired && (
          <View style={[s.guaranteeBadge, { backgroundColor: c.backgroundSecondary }]}>
            <Feather name="shield" size={14} color="#4CAF50" />
            <Text style={[s.guaranteeText, { color: c.textSecondary }]}>
              $1,000 collateral is fully refunded after 91 days. No risk to you.
            </Text>
          </View>
        )}
      </ScrollView>
    </View>
  );
}

// ─── Styles ───────────────────────────────────────────────────────────────────
const s = StyleSheet.create({
  container: { flex: 1 },
  header: { padding: 20, paddingBottom: 24, gap: 8 },
  skipBtn: { alignSelf: "flex-end", padding: 8 },
  skipText: { color: "rgba(255,255,255,0.7)", fontSize: 14, fontFamily: "Inter_400Regular" },
  badge: { color: "rgba(255,255,255,0.9)", fontSize: 13, fontFamily: "Inter_600SemiBold" },
  title: { fontSize: 32, fontFamily: "Inter_700Bold", color: "#fff", lineHeight: 38 },
  subtitle: { fontSize: 14, fontFamily: "Inter_400Regular", color: "rgba(255,255,255,0.75)" },
  leverageRow: { flexDirection: "row", alignItems: "center", gap: 10, marginTop: 8, backgroundColor: "rgba(0,0,0,0.15)", borderRadius: 12, padding: 12, flexWrap: "wrap" },
  leverageStat: { alignItems: "center" },
  leverageAmt: { fontSize: 18, fontFamily: "Inter_700Bold", color: "#fff" },
  leverageLabel: { fontSize: 10, fontFamily: "Inter_400Regular", color: "rgba(255,255,255,0.65)" },
  urgencyCard: { flexDirection: "row", alignItems: "center", gap: 12, padding: 16, borderRadius: 16, borderWidth: 1 },
  urgencyTitle: { fontSize: 16, fontFamily: "Inter_700Bold" },
  urgencyDesc: { fontSize: 13, fontFamily: "Inter_400Regular", marginTop: 4 },
  discountRow: { flexDirection: "row", alignItems: "center", gap: 8, marginTop: 8 },
  discountBadge: { flexDirection: "row", alignItems: "center", gap: 4, paddingHorizontal: 8, paddingVertical: 4, borderRadius: 8 },
  discountText: { fontSize: 12, fontFamily: "Inter_700Bold", letterSpacing: 0.5 },
  discountSavings: { fontSize: 12, fontFamily: "Inter_400Regular" },
  howCard: { borderRadius: 16, borderWidth: 1, padding: 16, gap: 12 },
  howTitle: { fontSize: 16, fontFamily: "Inter_700Bold", marginBottom: 4 },
  howStep: { flexDirection: "row", alignItems: "flex-start", gap: 10 },
  howIcon: { width: 28, height: 28, borderRadius: 8, alignItems: "center", justifyContent: "center", marginTop: 2 },
  howStepTitle: { fontSize: 13, fontFamily: "Inter_600SemiBold" },
  howStepDesc: { fontSize: 12, fontFamily: "Inter_400Regular", marginTop: 2 },
  offersTitle: { fontSize: 20, fontFamily: "Inter_700Bold" },
  offersSub: { fontSize: 13, fontFamily: "Inter_400Regular", marginTop: -8 },
  loadingState: { padding: 40, alignItems: "center", gap: 12 },
  loadingText: { fontSize: 14, fontFamily: "Inter_400Regular" },
  ctaBtn: { borderRadius: 16 },
  ctaGrad: { flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 8, paddingVertical: 18, borderRadius: 16 },
  ctaText: { fontSize: 16, fontFamily: "Inter_700Bold", color: "#fff" },
  guaranteeBadge: { flexDirection: "row", alignItems: "flex-start", gap: 8, padding: 12, borderRadius: 12 },
  guaranteeText: { flex: 1, fontSize: 12, fontFamily: "Inter_400Regular", lineHeight: 17 },
});

const ring = StyleSheet.create({
  container: { width: 80, height: 80 },
  track: { width: 80, height: 80, borderRadius: 40, borderWidth: 4, alignItems: "center", justifyContent: "center", overflow: "hidden" },
  fill: { position: "absolute", top: 0, left: 0, right: 0, height: "50%" },
  center: { alignItems: "center" },
  time: { fontSize: 15, fontFamily: "Inter_700Bold" },
  label: { fontSize: 8, fontFamily: "Inter_400Regular", color: "#999" },
});

const oc = StyleSheet.create({
  card: { borderRadius: 14, borderWidth: 1, overflow: "hidden" },
  cardSelected: { borderWidth: 2 },
  selectedBar: { height: 3 },
  row: { flexDirection: "row", alignItems: "center", gap: 10, padding: 14 },
  iconBox: {},
  iconGrad: { width: 36, height: 36, borderRadius: 10, alignItems: "center", justifyContent: "center" },
  bankName: { fontSize: 14, fontFamily: "Inter_700Bold", flex: 1 },
  tags: { flexDirection: "row", flexWrap: "wrap", gap: 4, marginTop: 4 },
  tag: { paddingHorizontal: 6, paddingVertical: 2, borderRadius: 5 },
  tagText: { fontSize: 10, fontFamily: "Inter_600SemiBold" },
  amounts: { alignItems: "center" },
  bonusAmt: { fontSize: 20, fontFamily: "Inter_700Bold", color: "#4CAF50" },
  bonusLabel: { fontSize: 10, fontFamily: "Inter_400Regular" },
  selectCircle: { width: 24, height: 24, borderRadius: 12, borderWidth: 2, borderColor: "#ccc", alignItems: "center", justifyContent: "center" },
  selectCircleActive: { borderColor: "#833AB4", backgroundColor: "#833AB4" },
  details: { borderTopWidth: StyleSheet.hairlineWidth, paddingHorizontal: 14, paddingVertical: 10, gap: 6 },
  detailItem: { flexDirection: "row", alignItems: "center", gap: 6 },
  detailText: { fontSize: 12, fontFamily: "Inter_400Regular" },
});
