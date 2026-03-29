import { Feather } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import { router } from "expo-router";
import React, { useState } from "react";
import {
  ActivityIndicator,
  Linking,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Switch,
  Text,
  View,
  useColorScheme,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import Colors from "@/constants/colors";
import { useAuth } from "@/context/AuthContext";

const MONTHLY_PRICE = 9.99;
const ANNUAL_PRICE = 83.88;
const ANNUAL_MONTHLY_EQUIV = 6.99;
const DISCOUNT_PCT = 30;

const PRO_FEATURES = [
  { icon: "zap",         label: "All Live Deals",          sub: "200+ DoC.com offers, updated daily" },
  { icon: "cpu",         label: "AI Bonus Agent",           sub: "GPT-4o strategy chat, personalized" },
  { icon: "refresh-cw",  label: "Autopay DD Scheduler",     sub: "We cycle deposits & refund your card" },
  { icon: "link",        label: "Plaid Bank Linking",        sub: "Connect any US bank in seconds" },
  { icon: "trending-up", label: "ROIC/APY Calculator",      sub: "Live return projections per offer" },
  { icon: "download",    label: "Analytics Export",         sub: "Export earnings history as CSV" },
];

const ANNUAL_ONLY = [
  { icon: "star",   label: "Early Access",          sub: "New features before public release" },
  { icon: "shield", label: "Dedicated Account Mgr", sub: "Priority email + chat support" },
];

type Plan = "monthly" | "annual";

export default function SubscriptionScreen() {
  const insets = useSafeAreaInsets();
  const colorScheme = useColorScheme();
  const isDark = colorScheme === "dark";
  const c = isDark ? Colors.dark : Colors.light;
  const { user } = useAuth() as any;

  const [billingAnnual, setBillingAnnual] = useState(true);
  const [loading, setLoading] = useState(false);
  const [subscribed, setSubscribed] = useState(false);

  const selectedPlan: Plan = billingAnnual ? "annual" : "monthly";
  const displayPrice = billingAnnual ? ANNUAL_MONTHLY_EQUIV : MONTHLY_PRICE;
  const billingNote = billingAnnual
    ? `$${ANNUAL_PRICE.toFixed(2)} billed annually`
    : "billed monthly, cancel anytime";

  const handleSubscribe = async () => {
    setLoading(true);
    try {
      const domain = process.env.EXPO_PUBLIC_DOMAIN;
      const url = domain
        ? `https://${domain}/api/subscriptions/subscribe`
        : "http://localhost:8080/api/subscriptions/subscribe";
      const res = await fetch(url, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          userId: user?.id ?? "demo-user",
          plan: selectedPlan,
          stripePaymentMethodId: "demo",
          email: user?.email ?? "demo@bigbankbonus.com",
        }),
      });
      const data = await res.json();
      if (res.ok) {
        setSubscribed(true);
      }
    } catch {
    } finally {
      setLoading(false);
    }
  };

  if (subscribed) {
    return (
      <View style={[s.container, { backgroundColor: c.background, paddingTop: insets.top }]}>
        <View style={s.successWrap}>
          <LinearGradient colors={["#833AB4", "#E1306C", "#F77737"]} style={s.successIcon}>
            <Feather name="check" size={36} color="#fff" />
          </LinearGradient>
          <Text style={[s.successTitle, { color: c.text }]}>Welcome to Pro!</Text>
          <Text style={[s.successSub, { color: c.textSecondary }]}>
            Your {billingAnnual ? "annual" : "monthly"} subscription is active.{"\n"}
            All Pro features are now unlocked.
          </Text>
          <Pressable style={s.successBtn} onPress={() => router.back()}>
            <LinearGradient colors={["#833AB4", "#E1306C", "#F77737"]} style={s.successBtnGrad} start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }}>
              <Text style={s.successBtnText}>Start Exploring</Text>
              <Feather name="arrow-right" size={16} color="#fff" />
            </LinearGradient>
          </Pressable>
        </View>
      </View>
    );
  }

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
          {/* Billing toggle */}
          <View style={[s.toggleCard, { backgroundColor: c.card, borderColor: c.cardBorder }]}>
            <View style={s.toggleRow}>
              <Text style={[s.toggleLabel, { color: billingAnnual ? c.textSecondary : c.text }]}>Monthly</Text>
              <Switch
                value={billingAnnual}
                onValueChange={setBillingAnnual}
                trackColor={{ false: "#ccc", true: "#833AB4" }}
                thumbColor="#fff"
              />
              <View style={s.annualLabelRow}>
                <Text style={[s.toggleLabel, { color: billingAnnual ? c.text : c.textSecondary }]}>Annual</Text>
                <View style={s.saveBadge}>
                  <Text style={s.saveBadgeText}>SAVE {DISCOUNT_PCT}%</Text>
                </View>
              </View>
            </View>
          </View>

          {/* Price card */}
          <LinearGradient colors={["#833AB4cc", "#E1306Ccc"]} style={s.priceCard} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }}>
            {billingAnnual && (
              <View style={s.bestValueBadge}>
                <Text style={s.bestValueText}>BEST VALUE</Text>
              </View>
            )}
            <View style={s.priceRow}>
              <Text style={s.priceCurrency}>$</Text>
              <Text style={s.priceAmount}>{displayPrice.toFixed(2)}</Text>
              <Text style={s.priceInterval}>/mo</Text>
            </View>
            <Text style={s.billingNote}>{billingNote}</Text>
            {billingAnnual && (
              <Text style={s.savingsNote}>You save ${(MONTHLY_PRICE * 12 - ANNUAL_PRICE).toFixed(2)}/year</Text>
            )}
          </LinearGradient>

          {/* Pro features */}
          <View style={s.sectionBlock}>
            <Text style={[s.sectionTitle, { color: c.text }]}>Everything in Pro</Text>
            {PRO_FEATURES.map(f => (
              <View key={f.icon} style={[s.featureRow, { borderBottomColor: c.separator }]}>
                <LinearGradient colors={["#833AB4", "#E1306C"]} style={s.featureIcon} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }}>
                  <Feather name={f.icon as any} size={13} color="#fff" />
                </LinearGradient>
                <View style={{ flex: 1 }}>
                  <Text style={[s.featureLabel, { color: c.text }]}>{f.label}</Text>
                  <Text style={[s.featureSub, { color: c.textSecondary }]}>{f.sub}</Text>
                </View>
                <Feather name="check" size={14} color="#4CAF50" />
              </View>
            ))}
          </View>

          {/* Annual-only perks */}
          {billingAnnual && (
            <View style={[s.sectionBlock, { borderTopWidth: 1, borderTopColor: c.separator, paddingTop: 12 }]}>
              <Text style={[s.sectionTitle, { color: "#833AB4" }]}>Annual Exclusive</Text>
              {ANNUAL_ONLY.map(f => (
                <View key={f.icon} style={[s.featureRow, { borderBottomColor: c.separator }]}>
                  <LinearGradient colors={["#F77737", "#E1306C"]} style={s.featureIcon} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }}>
                    <Feather name={f.icon as any} size={13} color="#fff" />
                  </LinearGradient>
                  <View style={{ flex: 1 }}>
                    <Text style={[s.featureLabel, { color: c.text }]}>{f.label}</Text>
                    <Text style={[s.featureSub, { color: c.textSecondary }]}>{f.sub}</Text>
                  </View>
                  <Feather name="check" size={14} color="#F77737" />
                </View>
              ))}
            </View>
          )}

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

          {/* CTA */}
          <Pressable onPress={handleSubscribe} disabled={loading} style={{ marginTop: 8 }}>
            <LinearGradient colors={["#833AB4", "#E1306C", "#F77737"]} style={[s.cta, loading && { opacity: 0.7 }]} start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }}>
              {loading ? (
                <ActivityIndicator color="#fff" />
              ) : (
                <>
                  <Feather name="zap" size={18} color="#fff" />
                  <Text style={s.ctaText}>
                    Start Pro — ${displayPrice.toFixed(2)}/mo
                  </Text>
                </>
              )}
            </LinearGradient>
          </Pressable>

          <Text style={[s.disclaimer, { color: c.textTertiary }]}>
            Cancel anytime · No hidden fees · Secure payments via Stripe
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
  toggleCard: { borderRadius: 16, borderWidth: 1, padding: 14 },
  toggleRow: { flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 12 },
  toggleLabel: { fontSize: 15, fontFamily: "Inter_600SemiBold" },
  annualLabelRow: { flexDirection: "row", alignItems: "center", gap: 6 },
  saveBadge: { backgroundColor: "#4CAF50", borderRadius: 6, paddingHorizontal: 6, paddingVertical: 2 },
  saveBadgeText: { fontSize: 9, fontFamily: "Inter_700Bold", color: "#fff" },
  priceCard: { borderRadius: 20, padding: 22, alignItems: "center", gap: 4, overflow: "hidden" },
  bestValueBadge: { position: "absolute", top: 12, right: 12, backgroundColor: "#F77737", borderRadius: 8, paddingHorizontal: 8, paddingVertical: 3 },
  bestValueText: { fontSize: 9, fontFamily: "Inter_700Bold", color: "#fff" },
  priceRow: { flexDirection: "row", alignItems: "flex-start" },
  priceCurrency: { fontSize: 22, fontFamily: "Inter_700Bold", color: "#fff", marginTop: 6 },
  priceAmount: { fontSize: 56, fontFamily: "Inter_700Bold", color: "#fff", lineHeight: 64 },
  priceInterval: { fontSize: 18, fontFamily: "Inter_400Regular", color: "rgba(255,255,255,0.8)", alignSelf: "flex-end", marginBottom: 8 },
  billingNote: { fontSize: 13, fontFamily: "Inter_400Regular", color: "rgba(255,255,255,0.8)" },
  savingsNote: { fontSize: 12, fontFamily: "Inter_600SemiBold", color: "#fff", backgroundColor: "rgba(255,255,255,0.2)", paddingHorizontal: 10, paddingVertical: 4, borderRadius: 8, marginTop: 4 },
  sectionBlock: { gap: 2 },
  sectionTitle: { fontSize: 13, fontFamily: "Inter_700Bold", textTransform: "uppercase", letterSpacing: 0.5, marginBottom: 8 },
  featureRow: { flexDirection: "row", alignItems: "center", gap: 12, paddingVertical: 10, borderBottomWidth: StyleSheet.hairlineWidth },
  featureIcon: { width: 30, height: 30, borderRadius: 8, alignItems: "center", justifyContent: "center" },
  featureLabel: { fontSize: 14, fontFamily: "Inter_600SemiBold" },
  featureSub: { fontSize: 11, fontFamily: "Inter_400Regular", marginTop: 1 },
  statsRow: { flexDirection: "row", borderRadius: 14, padding: 14 },
  statItem: { flex: 1, alignItems: "center" },
  statVal: { fontSize: 18, fontFamily: "Inter_700Bold" },
  statLbl: { fontSize: 10, fontFamily: "Inter_400Regular", textAlign: "center", marginTop: 2 },
  cta: { borderRadius: 16, flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 10, paddingVertical: 16 },
  ctaText: { fontSize: 17, fontFamily: "Inter_700Bold", color: "#fff" },
  disclaimer: { fontSize: 11, fontFamily: "Inter_400Regular", textAlign: "center" },
  freeCard: { borderRadius: 14, borderWidth: 1, padding: 14, gap: 6 },
  freeTitle: { fontSize: 13, fontFamily: "Inter_600SemiBold", marginBottom: 4 },
  freeRow: { flexDirection: "row", alignItems: "center", gap: 8 },
  freeLine: { fontSize: 12, fontFamily: "Inter_400Regular" },
  successWrap: { flex: 1, alignItems: "center", justifyContent: "center", padding: 32, gap: 16 },
  successIcon: { width: 80, height: 80, borderRadius: 40, alignItems: "center", justifyContent: "center" },
  successTitle: { fontSize: 28, fontFamily: "Inter_700Bold" },
  successSub: { fontSize: 15, fontFamily: "Inter_400Regular", textAlign: "center", lineHeight: 22 },
  successBtn: { borderRadius: 14, overflow: "hidden", width: "100%", marginTop: 8 },
  successBtnGrad: { flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 8, paddingVertical: 16 },
  successBtnText: { fontSize: 16, fontFamily: "Inter_700Bold", color: "#fff" },
});
