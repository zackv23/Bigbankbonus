import { Feather } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import { router } from "expo-router";
import React, { type ComponentProps } from "react";
import {
  Linking,
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

type FeatherIconName = ComponentProps<typeof Feather>["name"];

const MONTHLY_PRICE = 6.00;
const SERVICE_FEE = 99;

const PRO_FEATURES: { icon: FeatherIconName; label: string; sub: string }[] = [
  { icon: "zap",         label: "All Live Deals",          sub: "200+ DoC.com offers, updated daily" },
  { icon: "cpu",         label: "AI Bonus Agent",           sub: "GPT-4o strategy chat, personalized" },
  { icon: "refresh-cw",  label: "Autopay DD Scheduler",     sub: "We cycle deposits & refund your card" },
  { icon: "link",        label: "Plaid Bank Linking",        sub: "Connect any US bank in seconds" },
  { icon: "trending-up", label: "ROIC/APY Calculator",      sub: "Live return projections per offer" },
  { icon: "download",    label: "Analytics Export",         sub: "Export earnings history as CSV" },
];

const HOW_IT_WORKS = [
  { step: "1", text: "Sign up free — no credit card needed" },
  { step: "2", text: "Apply for a bank account through the app" },
  { step: "3", text: "Once your account is approved, billing starts" },
  { step: "4", text: "$99 service fee + $6/mo subscription activated" },
];

export default function SubscriptionScreen() {
  const insets = useSafeAreaInsets();
  const colorScheme = useColorScheme();
  const isDark = colorScheme === "dark";
  const c = isDark ? Colors.dark : Colors.light;

  return (
    <View style={[s.container, { backgroundColor: c.background }]}>
      <ScrollView contentContainerStyle={{ paddingBottom: insets.bottom + 40 }} showsVerticalScrollIndicator={false}>
        {/* Header */}
        <LinearGradient colors={["#833AB4", "#E1306C", "#F77737"]} start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }} style={[s.header, { paddingTop: insets.top + 16 }]}>
          <Pressable onPress={() => router.back()} style={s.backBtn} hitSlop={12}>
            <Feather name="x" size={22} color="#fff" />
          </Pressable>
          <Text style={s.headerLabel}>BigBankBonus Pro</Text>
          <Text style={s.headerTitle}>Earn More.{"\n"}Automate Everything.</Text>
          <Text style={s.headerSub}>Join thousands earning $1,800+/year from bank bonuses</Text>
        </LinearGradient>

        <View style={s.body}>
          {/* Free to sign up banner */}
          <View style={[s.freeBanner, { backgroundColor: isDark ? "#0d2b0d" : "#f0faf0", borderColor: "#4CAF50" }]}>
            <Feather name="shield" size={18} color="#4CAF50" />
            <View style={{ flex: 1 }}>
              <Text style={[s.freeBannerTitle, { color: c.text }]}>Free to Sign Up</Text>
              <Text style={[s.freeBannerSub, { color: c.textSecondary }]}>
                No credit card required. You're only charged after your bank account is approved.
              </Text>
            </View>
          </View>

          {/* Pricing breakdown */}
          <View style={[s.pricingCard, { backgroundColor: c.card, borderColor: c.cardBorder }]}>
            <Text style={[s.pricingTitle, { color: c.text }]}>Approval-Gated Pricing</Text>
            <Text style={[s.pricingSubtitle, { color: c.textSecondary }]}>Charged only after approval</Text>

            <View style={s.priceRow}>
              <LinearGradient colors={["#833AB4", "#E1306C"]} style={s.priceIcon} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }}>
                <Feather name="repeat" size={14} color="#fff" />
              </LinearGradient>
              <View style={{ flex: 1 }}>
                <Text style={[s.priceLabel, { color: c.text }]}>Monthly Subscription</Text>
                <Text style={[s.priceSub, { color: c.textSecondary }]}>Billed monthly, cancel anytime</Text>
              </View>
              <Text style={[s.priceAmount, { color: c.text }]}>$6<Text style={[s.priceInterval, { color: c.textSecondary }]}>/mo</Text></Text>
            </View>

            <View style={[s.divider, { backgroundColor: c.separator }]} />

            <View style={s.priceRow}>
              <LinearGradient colors={["#F77737", "#E1306C"]} style={s.priceIcon} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }}>
                <Feather name="dollar-sign" size={14} color="#fff" />
              </LinearGradient>
              <View style={{ flex: 1 }}>
                <Text style={[s.priceLabel, { color: c.text }]}>One-Time Service Fee</Text>
                <Text style={[s.priceSub, { color: c.textSecondary }]}>Charged once when approved</Text>
              </View>
              <Text style={[s.priceAmount, { color: c.text }]}>$99</Text>
            </View>

            <View style={[s.approvalNote, { backgroundColor: isDark ? "rgba(131,58,180,0.15)" : "#faf5ff", borderColor: "#833AB4" }]}>
              <Feather name="info" size={13} color="#833AB4" />
              <Text style={[s.approvalNoteText, { color: c.textSecondary }]}>
                Billing is triggered automatically when a BigBankBonus operator marks your account as approved.
              </Text>
            </View>
          </View>

          {/* How billing works */}
          <View style={s.sectionBlock}>
            <Text style={[s.sectionTitle, { color: c.text }]}>How Billing Works</Text>
            {HOW_IT_WORKS.map((step) => (
              <View key={step.step} style={[s.stepRow, { borderBottomColor: c.separator }]}>
                <View style={s.stepBadge}>
                  <LinearGradient colors={["#833AB4", "#E1306C"]} style={s.stepBadgeGrad} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }}>
                    <Text style={s.stepNum}>{step.step}</Text>
                  </LinearGradient>
                </View>
                <Text style={[s.stepText, { color: c.text }]}>{step.text}</Text>
              </View>
            ))}
          </View>

          {/* Pro features */}
          <View style={s.sectionBlock}>
            <Text style={[s.sectionTitle, { color: c.text }]}>Everything in Pro</Text>
            {PRO_FEATURES.map(f => (
              <View key={f.icon} style={[s.featureRow, { borderBottomColor: c.separator }]}>
                <LinearGradient colors={["#833AB4", "#E1306C"]} style={s.featureIcon} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }}>
                  <Feather name={f.icon} size={13} color="#fff" />
                </LinearGradient>
                <View style={{ flex: 1 }}>
                  <Text style={[s.featureLabel, { color: c.text }]}>{f.label}</Text>
                  <Text style={[s.featureSub, { color: c.textSecondary }]}>{f.sub}</Text>
                </View>
                <Feather name="check" size={14} color="#4CAF50" />
              </View>
            ))}
          </View>

          {/* Stats */}
          <View style={[s.statsRow, { backgroundColor: isDark ? "#ffffff08" : "#f9f5ff" }]}>
            {[
              { val: "$2.1M+", lbl: "Earned by members" },
              { val: "4.8★",   lbl: "App Store rating" },
              { val: "1,800",  lbl: "Avg $/year per user" },
            ].map(st => (
              <View key={st.val} style={s.statItem}>
                <Text style={[s.statVal, { color: "#833AB4" }]}>{st.val}</Text>
                <Text style={[s.statLbl, { color: c.textSecondary }]}>{st.lbl}</Text>
              </View>
            ))}
          </View>

          <Text style={[s.disclaimer, { color: c.textTertiary }]}>
            Free to join · Billed only after approval · Secure payments via Stripe
          </Text>

          {/* Free plan comparison */}
          <View style={[s.freeCard, { backgroundColor: c.card, borderColor: c.cardBorder }]}>
            <Text style={[s.freeTitle, { color: c.text }]}>Free Plan (current)</Text>
            {[
              "5 live deals only",
              "No AI agent",
              "No autopay",
              "No Plaid linking",
              "No ROIC calculator",
            ].map(l => (
              <View key={l} style={s.freeRow}>
                <Feather name="x" size={12} color="#F44336" />
                <Text style={[s.freeLine, { color: c.textSecondary }]}>{l}</Text>
              </View>
            ))}
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
  headerLabel: { fontSize: 11, fontFamily: "Inter_600SemiBold", color: "rgba(255,255,255,0.75)", textTransform: "uppercase", letterSpacing: 1, marginBottom: 8 },
  headerTitle: { fontSize: 32, fontFamily: "Inter_700Bold", color: "#fff", lineHeight: 38, marginBottom: 8 },
  headerSub: { fontSize: 14, fontFamily: "Inter_400Regular", color: "rgba(255,255,255,0.8)" },
  body: { padding: 16, gap: 14 },
  freeBanner: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: 12,
    borderWidth: 1,
    borderRadius: 14,
    padding: 14,
  },
  freeBannerTitle: { fontSize: 14, fontFamily: "Inter_700Bold", marginBottom: 2 },
  freeBannerSub: { fontSize: 12, fontFamily: "Inter_400Regular", lineHeight: 17 },
  pricingCard: {
    borderRadius: 16,
    borderWidth: 1,
    padding: 16,
    gap: 12,
  },
  pricingTitle: { fontSize: 15, fontFamily: "Inter_700Bold" },
  pricingSubtitle: { fontSize: 12, fontFamily: "Inter_400Regular", marginTop: -8 },
  priceRow: { flexDirection: "row", alignItems: "center", gap: 12 },
  priceIcon: { width: 32, height: 32, borderRadius: 9, alignItems: "center", justifyContent: "center" },
  priceLabel: { fontSize: 14, fontFamily: "Inter_600SemiBold" },
  priceSub: { fontSize: 11, fontFamily: "Inter_400Regular", marginTop: 1 },
  priceAmount: { fontSize: 22, fontFamily: "Inter_700Bold" },
  priceInterval: { fontSize: 14, fontFamily: "Inter_400Regular" },
  divider: { height: StyleSheet.hairlineWidth },
  approvalNote: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: 8,
    borderWidth: 1,
    borderRadius: 10,
    padding: 10,
    marginTop: 4,
  },
  approvalNoteText: { flex: 1, fontSize: 11, fontFamily: "Inter_400Regular", lineHeight: 16 },
  sectionBlock: { gap: 2 },
  sectionTitle: { fontSize: 13, fontFamily: "Inter_700Bold", textTransform: "uppercase", letterSpacing: 0.5, marginBottom: 8 },
  stepRow: { flexDirection: "row", alignItems: "center", gap: 12, paddingVertical: 10, borderBottomWidth: StyleSheet.hairlineWidth },
  stepBadge: { width: 30, height: 30 },
  stepBadgeGrad: { width: 30, height: 30, borderRadius: 15, alignItems: "center", justifyContent: "center" },
  stepNum: { fontSize: 13, fontFamily: "Inter_700Bold", color: "#fff" },
  stepText: { flex: 1, fontSize: 14, fontFamily: "Inter_400Regular", lineHeight: 20 },
  featureRow: { flexDirection: "row", alignItems: "center", gap: 12, paddingVertical: 10, borderBottomWidth: StyleSheet.hairlineWidth },
  featureIcon: { width: 30, height: 30, borderRadius: 8, alignItems: "center", justifyContent: "center" },
  featureLabel: { fontSize: 14, fontFamily: "Inter_600SemiBold" },
  featureSub: { fontSize: 11, fontFamily: "Inter_400Regular", marginTop: 1 },
  statsRow: { flexDirection: "row", borderRadius: 14, padding: 14 },
  statItem: { flex: 1, alignItems: "center" },
  statVal: { fontSize: 18, fontFamily: "Inter_700Bold" },
  statLbl: { fontSize: 10, fontFamily: "Inter_400Regular", textAlign: "center", marginTop: 2 },
  disclaimer: { fontSize: 11, fontFamily: "Inter_400Regular", textAlign: "center" },
  freeCard: { borderRadius: 14, borderWidth: 1, padding: 14, gap: 6 },
  freeTitle: { fontSize: 13, fontFamily: "Inter_600SemiBold", marginBottom: 4 },
  freeRow: { flexDirection: "row", alignItems: "center", gap: 8 },
  freeLine: { fontSize: 12, fontFamily: "Inter_400Regular" },
});
