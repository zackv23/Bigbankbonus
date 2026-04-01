import { Feather } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import { router } from "expo-router";
import React, { useCallback, useEffect, useState } from "react";
import {
  ActivityIndicator,
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

interface Offer {
  id: string;
  name: string;
  bonusAmount: number;
  directDepositRequired: number;
  difficulty: "Easy" | "Medium" | "Hard";
  ewsReporting: boolean;
  noFee: boolean;
  timeToBonus: number;
  roi: string;
  requirements: string;
  approvalScore: number;
}

interface StackingCombo {
  personal: Offer | null;
  business: Offer | null;
  creditCard: Offer | null;
  projectedTotal: number;
  description: string;
}

interface RecommendationData {
  bankScore: number;
  totalPlaidBalance: number;
  aiSummary: string;
  stackingCombo: StackingCombo;
  personalOffers: Offer[];
  businessOffers: Offer[];
  creditCardOffers: Offer[];
  disclaimer: string;
  generatedAt: string;
}

const DIFFICULTY_COLOR: Record<string, string> = {
  Easy: "#4CAF50",
  Medium: "#FFB300",
  Hard: "#F44336",
};

function OfferCard({ offer, onStart }: { offer: Offer; onStart: () => void }) {
  const colorScheme = useColorScheme();
  const isDark = colorScheme === "dark";
  const c = isDark ? Colors.dark : Colors.light;

  return (
    <View style={[cardS.card, { backgroundColor: c.card, borderColor: c.cardBorder }]}>
      <View style={cardS.topRow}>
        <View style={[cardS.logoBadge, { backgroundColor: "#833AB422" }]}>
          <Feather name="home" size={16} color="#833AB4" />
        </View>
        <View style={{ flex: 1 }}>
          <Text style={[cardS.bankName, { color: c.text }]} numberOfLines={1}>{offer.name}</Text>
          <View style={cardS.badgeRow}>
            <View style={[cardS.diffBadge, { backgroundColor: DIFFICULTY_COLOR[offer.difficulty] + "22" }]}>
              <Text style={[cardS.diffText, { color: DIFFICULTY_COLOR[offer.difficulty] }]}>{offer.difficulty}</Text>
            </View>
            {!offer.ewsReporting && (
              <View style={[cardS.diffBadge, { backgroundColor: "#4CAF5022" }]}>
                <Text style={[cardS.diffText, { color: "#4CAF50" }]}>No-EWS</Text>
              </View>
            )}
            {offer.noFee && (
              <View style={[cardS.diffBadge, { backgroundColor: "#2196F322" }]}>
                <Text style={[cardS.diffText, { color: "#2196F3" }]}>No Fee</Text>
              </View>
            )}
          </View>
        </View>
        <View style={cardS.bonusBox}>
          <Text style={cardS.bonusAmount}>${offer.bonusAmount}</Text>
          <Text style={[cardS.bonusLabel, { color: c.textSecondary }]}>bonus</Text>
        </View>
      </View>

      <View style={[cardS.reqRow, { backgroundColor: c.backgroundSecondary }]}>
        <Feather name="info" size={12} color={c.textSecondary} />
        <Text style={[cardS.reqText, { color: c.textSecondary }]} numberOfLines={2}>{offer.requirements}</Text>
      </View>

      <View style={cardS.statsRow}>
        <View style={cardS.stat}>
          <Text style={[cardS.statVal, { color: "#4CAF50" }]}>{offer.roi}</Text>
          <Text style={[cardS.statLabel, { color: c.textTertiary }]}>ROI</Text>
        </View>
        <View style={cardS.stat}>
          <Text style={[cardS.statVal, { color: c.text }]}>{offer.timeToBonus}d</Text>
          <Text style={[cardS.statLabel, { color: c.textTertiary }]}>Time</Text>
        </View>
        <View style={cardS.stat}>
          <Text style={[cardS.statVal, { color: "#833AB4" }]}>{offer.approvalScore}</Text>
          <Text style={[cardS.statLabel, { color: c.textTertiary }]}>Score</Text>
        </View>
      </View>

      <Pressable onPress={onStart} style={cardS.ctaBtn}>
        <LinearGradient colors={["#833AB4", "#E1306C"]} start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }} style={cardS.ctaBtnGrad}>
          <Text style={cardS.ctaText}>Start This</Text>
          <Feather name="arrow-right" size={14} color="#fff" />
        </LinearGradient>
      </Pressable>
    </View>
  );
}

function CategorySection({ title, icon, color, offers }: { title: string; icon: string; color: string; offers: Offer[] }) {
  const colorScheme = useColorScheme();
  const isDark = colorScheme === "dark";
  const c = isDark ? Colors.dark : Colors.light;

  return (
    <View style={{ marginBottom: 20 }}>
      <View style={stratS.sectionHeader}>
        <View style={[stratS.sectionIcon, { backgroundColor: color + "22" }]}>
          <Feather name={icon as any} size={16} color={color} />
        </View>
        <Text style={[stratS.sectionTitle, { color: c.text }]}>{title}</Text>
        <Text style={[stratS.sectionCount, { color: c.textSecondary }]}>Top 3</Text>
      </View>
      {offers.map(offer => (
        <OfferCard key={offer.id} offer={offer} onStart={() => router.push({ pathname: "/bank/[id]", params: { id: offer.id } })} />
      ))}
    </View>
  );
}

export default function StrategyScreen() {
  const insets = useSafeAreaInsets();
  const colorScheme = useColorScheme();
  const isDark = colorScheme === "dark";
  const c = isDark ? Colors.dark : Colors.light;
  const { user } = useAuth() as any;

  const [data, setData] = useState<RecommendationData | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [errorCode, setErrorCode] = useState<string | null>(null);

  const fetchRecommendations = useCallback(async (isRefresh = false) => {
    if (!isRefresh) setLoading(true);
    setError(null);

    try {
      const domain = process.env.EXPO_PUBLIC_DOMAIN;
      const baseUrl = domain ? `https://${domain}` : "http://localhost:8080";
      const userId = user?.id ?? "demo-user";

      const res = await fetch(`${baseUrl}/api/recommendations?userId=${encodeURIComponent(userId)}`);
      const json = await res.json();

      if (!res.ok) {
        setErrorCode(json.code ?? null);
        setError(json.error ?? "Failed to load recommendations");
        return;
      }

      setData(json);
    } catch (e: any) {
      setError("Network error — please check your connection");
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [user?.id]);

  useEffect(() => {
    fetchRecommendations();
  }, [fetchRecommendations]);

  const handleRefresh = () => {
    setRefreshing(true);
    fetchRecommendations(true);
  };

  const renderGated = (message: string, subtitle: string, action?: { label: string; onPress: () => void }) => (
    <View style={stratS.gatedWrap}>
      <View style={[stratS.gatedCard, { backgroundColor: c.card, borderColor: c.cardBorder }]}>
        <LinearGradient colors={["#833AB4", "#E1306C"]} style={stratS.gatedIcon}>
          <Feather name="lock" size={28} color="#fff" />
        </LinearGradient>
        <Text style={[stratS.gatedTitle, { color: c.text }]}>{message}</Text>
        <Text style={[stratS.gatedSub, { color: c.textSecondary }]}>{subtitle}</Text>
        {action && (
          <Pressable onPress={action.onPress} style={stratS.gatedBtn}>
            <LinearGradient colors={["#833AB4", "#E1306C"]} start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }} style={stratS.gatedBtnGrad}>
              <Text style={stratS.gatedBtnText}>{action.label}</Text>
              <Feather name="arrow-right" size={16} color="#fff" />
            </LinearGradient>
          </Pressable>
        )}
      </View>
    </View>
  );

  if (loading) {
    return (
      <View style={[stratS.container, { backgroundColor: c.background, paddingTop: insets.top }]}>
        <View style={stratS.loadingWrap}>
          <LinearGradient colors={["#833AB4", "#E1306C"]} style={stratS.loadingIcon}>
            <Feather name="cpu" size={24} color="#fff" />
          </LinearGradient>
          <Text style={[stratS.loadingText, { color: c.text }]}>AI is analyzing your profile...</Text>
          <ActivityIndicator color="#833AB4" size="large" style={{ marginTop: 16 }} />
        </View>
      </View>
    );
  }

  if (errorCode === "NOT_SUBSCRIBED") {
    return (
      <View style={[stratS.container, { backgroundColor: c.background }]}>
        <View style={[stratS.header, { paddingTop: insets.top + (Platform.OS === "web" ? 67 : 12) }]}>
          <LinearGradient colors={["#833AB4", "#E1306C"]} start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }} style={StyleSheet.absoluteFill} />
          <Text style={stratS.headerTitle}>My Strategy</Text>
          <Text style={stratS.headerSub}>AI-Powered Recommendations</Text>
        </View>
        {renderGated(
          "Pro Subscription Required",
          "Upgrade to Pro to unlock personalized AI strategy recommendations, bank score analysis, and stacking optimization.",
          { label: "Upgrade to Pro", onPress: () => router.push("/subscription") }
        )}
      </View>
    );
  }

  if (errorCode === "SCORE_TOO_LOW") {
    return (
      <View style={[stratS.container, { backgroundColor: c.background }]}>
        <View style={[stratS.header, { paddingTop: insets.top + (Platform.OS === "web" ? 67 : 12) }]}>
          <LinearGradient colors={["#833AB4", "#E1306C"]} start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }} style={StyleSheet.absoluteFill} />
          <Text style={stratS.headerTitle}>My Strategy</Text>
          <Text style={stratS.headerSub}>AI-Powered Recommendations</Text>
        </View>
        {renderGated(
          "Bank Score 700+ Required",
          "Enter your ChexSystems/EWS score in your profile. A score of 700 or above unlocks personalized AI recommendations.",
          { label: "Update My Score", onPress: () => router.push("/settings") }
        )}
      </View>
    );
  }

  if (error || !data) {
    return (
      <View style={[stratS.container, { backgroundColor: c.background }]}>
        <View style={[stratS.header, { paddingTop: insets.top + (Platform.OS === "web" ? 67 : 12) }]}>
          <LinearGradient colors={["#833AB4", "#E1306C"]} start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }} style={StyleSheet.absoluteFill} />
          <Text style={stratS.headerTitle}>My Strategy</Text>
          <Text style={stratS.headerSub}>AI-Powered Recommendations</Text>
        </View>
        <View style={stratS.gatedWrap}>
          <View style={[stratS.gatedCard, { backgroundColor: c.card, borderColor: c.cardBorder }]}>
            <Feather name="alert-circle" size={40} color="#F44336" />
            <Text style={[stratS.gatedTitle, { color: c.text }]}>Unable to Load</Text>
            <Text style={[stratS.gatedSub, { color: c.textSecondary }]}>{error}</Text>
            <Pressable onPress={() => fetchRecommendations()} style={stratS.gatedBtn}>
              <LinearGradient colors={["#833AB4", "#E1306C"]} start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }} style={stratS.gatedBtnGrad}>
                <Text style={stratS.gatedBtnText}>Try Again</Text>
              </LinearGradient>
            </Pressable>
          </View>
        </View>
      </View>
    );
  }

  const combo = data.stackingCombo;

  return (
    <View style={[stratS.container, { backgroundColor: c.background }]}>
      <View style={[stratS.header, { paddingTop: insets.top + (Platform.OS === "web" ? 67 : 12) }]}>
        <LinearGradient colors={["#833AB4", "#E1306C"]} start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }} style={StyleSheet.absoluteFill} />
        <Text style={stratS.headerTitle}>My Strategy</Text>
        <Text style={stratS.headerSub}>Score {data.bankScore} · AI-Powered</Text>
        <View style={stratS.headerStats}>
          <View style={stratS.headerStat}>
            <Text style={stratS.headerStatVal}>${combo.projectedTotal.toLocaleString()}</Text>
            <Text style={stratS.headerStatLabel}>Projected Total</Text>
          </View>
          <View style={stratS.headerDivider} />
          <View style={stratS.headerStat}>
            <Text style={stratS.headerStatVal}>{data.bankScore}</Text>
            <Text style={stratS.headerStatLabel}>Bank Score</Text>
          </View>
          <View style={stratS.headerDivider} />
          <View style={stratS.headerStat}>
            <Text style={stratS.headerStatVal}>${data.totalPlaidBalance.toLocaleString()}</Text>
            <Text style={stratS.headerStatLabel}>Linked Funds</Text>
          </View>
        </View>
      </View>

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={[stratS.scrollContent, { paddingBottom: insets.bottom + 100 }]}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={handleRefresh} tintColor="#833AB4" />}
      >
        {/* AI Strategy Summary */}
        <View style={[stratS.summaryCard, { backgroundColor: c.card, borderColor: c.cardBorder }]}>
          <View style={stratS.summaryHeader}>
            <LinearGradient colors={["#833AB4", "#E1306C"]} style={stratS.summaryAiIcon}>
              <Feather name="cpu" size={14} color="#fff" />
            </LinearGradient>
            <Text style={[stratS.summaryTitle, { color: c.text }]}>Your AI Strategy</Text>
          </View>
          <Text style={[stratS.summaryText, { color: c.textSecondary }]}>{data.aiSummary}</Text>
        </View>

        {/* Best Stacking Combo */}
        <View style={{ marginBottom: 20 }}>
          <View style={stratS.sectionHeader}>
            <View style={[stratS.sectionIcon, { backgroundColor: "#F7773722" }]}>
              <Feather name="layers" size={16} color="#F77737" />
            </View>
            <Text style={[stratS.sectionTitle, { color: c.text }]}>Best Stacking Combo</Text>
          </View>

          <View style={[stratS.comboCard, { backgroundColor: c.card, borderColor: "#F77737" }]}>
            <LinearGradient colors={["#F7773711", "#E1306C11"]} style={StyleSheet.absoluteFill} />

            {[
              { label: "Personal", icon: "user", offer: combo.personal, color: "#833AB4" },
              { label: "Business", icon: "briefcase", offer: combo.business, color: "#2196F3" },
              { label: "Credit Card", icon: "credit-card", offer: combo.creditCard, color: "#4CAF50" },
            ].map(({ label, icon, offer, color }) => (
              offer && (
                <View key={label} style={[stratS.comboRow, { borderBottomColor: c.separator }]}>
                  <View style={[stratS.comboIcon, { backgroundColor: color + "22" }]}>
                    <Feather name={icon as any} size={14} color={color} />
                  </View>
                  <View style={{ flex: 1 }}>
                    <Text style={[stratS.comboLabel, { color: c.textSecondary }]}>{label}</Text>
                    <Text style={[stratS.comboName, { color: c.text }]} numberOfLines={1}>{offer.name}</Text>
                  </View>
                  <Text style={stratS.comboBonus}>${offer.bonusAmount}</Text>
                </View>
              )
            ))}

            <View style={stratS.comboTotal}>
              <Text style={[stratS.comboTotalLabel, { color: c.textSecondary }]}>Total Projected Earnings</Text>
              <Text style={stratS.comboTotalVal}>${combo.projectedTotal.toLocaleString()}</Text>
            </View>
          </View>
        </View>

        {/* Category Sections */}
        <CategorySection title="Top Personal Accounts" icon="user" color="#833AB4" offers={data.personalOffers} />
        <CategorySection title="Top Business Accounts" icon="briefcase" color="#2196F3" offers={data.businessOffers} />
        <CategorySection title="Top Credit Cards" icon="credit-card" color="#4CAF50" offers={data.creditCardOffers} />

        {/* Disclaimer */}
        <View style={[stratS.disclaimer, { backgroundColor: c.backgroundSecondary, borderColor: c.cardBorder }]}>
          <Feather name="alert-circle" size={13} color={c.textTertiary} />
          <Text style={[stratS.disclaimerText, { color: c.textTertiary }]}>{data.disclaimer}</Text>
        </View>

        <Text style={[stratS.refreshNote, { color: c.textTertiary }]}>
          Last updated: {new Date(data.generatedAt).toLocaleDateString()} · Pull to refresh
        </Text>
      </ScrollView>
    </View>
  );
}

const cardS = StyleSheet.create({
  card: { borderRadius: 14, borderWidth: 1, padding: 14, marginBottom: 10, overflow: "hidden" },
  topRow: { flexDirection: "row", alignItems: "flex-start", gap: 10, marginBottom: 10 },
  logoBadge: { width: 40, height: 40, borderRadius: 12, alignItems: "center", justifyContent: "center" },
  bankName: { fontSize: 14, fontFamily: "Inter_600SemiBold", marginBottom: 4 },
  badgeRow: { flexDirection: "row", gap: 5, flexWrap: "wrap" },
  diffBadge: { paddingHorizontal: 6, paddingVertical: 2, borderRadius: 6 },
  diffText: { fontSize: 10, fontFamily: "Inter_600SemiBold" },
  bonusBox: { alignItems: "flex-end" },
  bonusAmount: { fontSize: 20, fontFamily: "Inter_700Bold", color: "#4CAF50" },
  bonusLabel: { fontSize: 10, fontFamily: "Inter_400Regular" },
  reqRow: { flexDirection: "row", alignItems: "flex-start", gap: 6, padding: 8, borderRadius: 8, marginBottom: 10 },
  reqText: { fontSize: 12, fontFamily: "Inter_400Regular", flex: 1, lineHeight: 17 },
  statsRow: { flexDirection: "row", marginBottom: 12 },
  stat: { flex: 1, alignItems: "center" },
  statVal: { fontSize: 15, fontFamily: "Inter_700Bold" },
  statLabel: { fontSize: 10, fontFamily: "Inter_400Regular", marginTop: 1 },
  ctaBtn: { borderRadius: 10, overflow: "hidden" },
  ctaBtnGrad: { flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 6, paddingVertical: 10 },
  ctaText: { fontSize: 13, fontFamily: "Inter_700Bold", color: "#fff" },
});

const stratS = StyleSheet.create({
  container: { flex: 1 },
  header: { paddingHorizontal: 16, paddingBottom: 16 },
  headerTitle: { fontSize: 22, fontFamily: "Inter_700Bold", color: "#fff", marginBottom: 2 },
  headerSub: { fontSize: 12, fontFamily: "Inter_400Regular", color: "rgba(255,255,255,0.8)", marginBottom: 12 },
  headerStats: { flexDirection: "row", backgroundColor: "rgba(255,255,255,0.15)", borderRadius: 12, padding: 12 },
  headerStat: { flex: 1, alignItems: "center" },
  headerStatVal: { fontSize: 16, fontFamily: "Inter_700Bold", color: "#fff" },
  headerStatLabel: { fontSize: 10, fontFamily: "Inter_400Regular", color: "rgba(255,255,255,0.8)", marginTop: 2 },
  headerDivider: { width: 1, backgroundColor: "rgba(255,255,255,0.3)" },
  scrollContent: { padding: 16, paddingTop: 16 },
  loadingWrap: { flex: 1, alignItems: "center", justifyContent: "center", gap: 12 },
  loadingIcon: { width: 60, height: 60, borderRadius: 20, alignItems: "center", justifyContent: "center" },
  loadingText: { fontSize: 16, fontFamily: "Inter_600SemiBold" },
  summaryCard: { borderRadius: 14, borderWidth: 1, padding: 14, marginBottom: 20 },
  summaryHeader: { flexDirection: "row", alignItems: "center", gap: 8, marginBottom: 10 },
  summaryAiIcon: { width: 28, height: 28, borderRadius: 8, alignItems: "center", justifyContent: "center" },
  summaryTitle: { fontSize: 14, fontFamily: "Inter_700Bold" },
  summaryText: { fontSize: 14, fontFamily: "Inter_400Regular", lineHeight: 22 },
  sectionHeader: { flexDirection: "row", alignItems: "center", gap: 8, marginBottom: 10 },
  sectionIcon: { width: 28, height: 28, borderRadius: 8, alignItems: "center", justifyContent: "center" },
  sectionTitle: { fontSize: 15, fontFamily: "Inter_700Bold", flex: 1 },
  sectionCount: { fontSize: 12, fontFamily: "Inter_400Regular" },
  comboCard: { borderRadius: 14, borderWidth: 1.5, padding: 14, overflow: "hidden", marginBottom: 4 },
  comboRow: { flexDirection: "row", alignItems: "center", gap: 10, paddingVertical: 10, borderBottomWidth: StyleSheet.hairlineWidth },
  comboIcon: { width: 30, height: 30, borderRadius: 8, alignItems: "center", justifyContent: "center" },
  comboLabel: { fontSize: 10, fontFamily: "Inter_400Regular", textTransform: "uppercase", letterSpacing: 0.5 },
  comboName: { fontSize: 13, fontFamily: "Inter_600SemiBold", marginTop: 1 },
  comboBonus: { fontSize: 17, fontFamily: "Inter_700Bold", color: "#4CAF50" },
  comboTotal: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", paddingTop: 10 },
  comboTotalLabel: { fontSize: 12, fontFamily: "Inter_600SemiBold" },
  comboTotalVal: { fontSize: 22, fontFamily: "Inter_700Bold", color: "#4CAF50" },
  gatedWrap: { flex: 1, padding: 20, justifyContent: "center" },
  gatedCard: { borderRadius: 20, borderWidth: 1, padding: 28, alignItems: "center", gap: 12 },
  gatedIcon: { width: 70, height: 70, borderRadius: 22, alignItems: "center", justifyContent: "center" },
  gatedTitle: { fontSize: 20, fontFamily: "Inter_700Bold", textAlign: "center" },
  gatedSub: { fontSize: 14, fontFamily: "Inter_400Regular", textAlign: "center", lineHeight: 21 },
  gatedBtn: { borderRadius: 14, overflow: "hidden", width: "100%", marginTop: 4 },
  gatedBtnGrad: { flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 8, paddingVertical: 14 },
  gatedBtnText: { fontSize: 15, fontFamily: "Inter_700Bold", color: "#fff" },
  disclaimer: { borderRadius: 10, borderWidth: 1, padding: 10, flexDirection: "row", gap: 6, alignItems: "flex-start", marginBottom: 8 },
  disclaimerText: { fontSize: 11, fontFamily: "Inter_400Regular", flex: 1, lineHeight: 16 },
  refreshNote: { fontSize: 11, fontFamily: "Inter_400Regular", textAlign: "center", marginBottom: 8 },
});
