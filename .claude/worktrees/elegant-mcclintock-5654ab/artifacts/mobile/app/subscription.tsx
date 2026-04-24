import { Feather } from "@expo/vector-icons";
import {
  initPaymentSheet,
  initStripe,
  presentPaymentSheet,
} from "@stripe/stripe-react-native";
import { LinearGradient } from "expo-linear-gradient";
import { router } from "expo-router";
import React, {
  type ComponentProps,
  useCallback,
  useEffect,
  useMemo,
  useState,
} from "react";
import {
  ActivityIndicator,
  Alert,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
  useColorScheme,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useAuth } from "@/context/AuthContext";
import Colors from "@/constants/colors";

type FeatherIconName = ComponentProps<typeof Feather>["name"];

type SetupResponse = {
  customerId: string;
  customerEphemeralKeySecret: string;
  setupIntentClientSecret: string;
  publishableKey: string | null;
  error?: string;
};

const MONTHLY_PRICE = 6.0;
const SERVICE_FEE = 99;

const PRO_FEATURES: { icon: FeatherIconName; label: string; sub: string }[] = [
  { icon: "zap", label: "All Live Deals", sub: "200+ DoC.com offers, updated daily" },
  { icon: "cpu", label: "AI Bonus Agent", sub: "GPT-4o strategy chat, personalized" },
  { icon: "refresh-cw", label: "Autopay DD Scheduler", sub: "We cycle deposits & refund your card" },
  { icon: "link", label: "Plaid Bank Linking", sub: "Connect any US bank in seconds" },
  { icon: "trending-up", label: "ROIC/APY Calculator", sub: "Live return projections per offer" },
  { icon: "download", label: "Analytics Export", sub: "Export earnings history as CSV" },
];

const HOW_IT_WORKS = [
  { step: "1", text: "Sign up free and add your preferred payment method" },
  { step: "2", text: "Apply for a bank account through the app" },
  { step: "3", text: "Once your account is approved, billing starts automatically" },
  { step: "4", text: "$99 service fee + $6/mo subscription activate off-session" },
];

function getApiBase(): string {
  const domain = process.env.EXPO_PUBLIC_DOMAIN;
  return domain ? `https://${domain}/api` : "http://localhost:8080/api";
}

export default function SubscriptionScreen() {
  const { user } = useAuth();
  const insets = useSafeAreaInsets();
  const colorScheme = useColorScheme();
  const isDark = colorScheme === "dark";
  const c = isDark ? Colors.dark : Colors.light;
  const [isPreparing, setIsPreparing] = useState(false);
  const [isPresenting, setIsPresenting] = useState(false);
  const [sheetReady, setSheetReady] = useState(false);
  const [setupComplete, setSetupComplete] = useState(false);
  const [statusMessage, setStatusMessage] = useState<string | null>(null);

  const configWarning = useMemo(() => {
    if (Platform.OS === "web") {
      return "Stripe PaymentSheet setup is only available in the native iOS and Android apps.";
    }

    if (!user) {
      return "Sign in to add a payment method for approval-gated billing.";
    }

    return null;
  }, [user]);

  const preparePaymentSheet = useCallback(async () => {
    if (!user || Platform.OS === "web") return false;

    setIsPreparing(true);
    setStatusMessage(null);

    try {
      const response = await fetch(`${getApiBase()}/subscriptions/setup`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          userId: user.id,
          email: user.email,
        }),
      });

      const body = (await response.json()) as SetupResponse;

      if (!response.ok) {
        throw new Error(body.error ?? "Failed to prepare Stripe setup.");
      }

      const publishableKey =
        body.publishableKey ?? process.env.EXPO_PUBLIC_STRIPE_PUBLISHABLE_KEY ?? "";

      if (!publishableKey) {
        throw new Error(
          "Stripe publishable key is not configured. Set STRIPE_PUBLISHABLE_KEY on the API and EXPO_PUBLIC_STRIPE_PUBLISHABLE_KEY in the mobile app.",
        );
      }

      await initStripe({
        publishableKey,
        urlScheme: "mobile",
        merchantIdentifier: process.env.EXPO_PUBLIC_STRIPE_MERCHANT_IDENTIFIER,
      });

      const { error } = await initPaymentSheet({
        merchantDisplayName: "BigBankBonus",
        customerId: body.customerId,
        customerEphemeralKeySecret: body.customerEphemeralKeySecret,
        setupIntentClientSecret: body.setupIntentClientSecret,
        returnURL: "mobile://stripe-redirect",
        defaultBillingDetails: {
          email: user.email,
          name: user.name,
        },
        primaryButtonLabel: "Save payment method",
      });

      if (error) {
        throw new Error(error.message);
      }

      setSheetReady(true);
      setStatusMessage("Payment method is ready to save. We’ll only charge after approval.");
      return true;
    } catch (error) {
      const message = error instanceof Error ? error.message : "Failed to prepare Stripe.";
      setSheetReady(false);
      setStatusMessage(message);
      return false;
    } finally {
      setIsPreparing(false);
    }
  }, [user]);

  useEffect(() => {
    if (!configWarning) {
      void preparePaymentSheet();
    }
  }, [configWarning, preparePaymentSheet]);

  const handleSavePaymentMethod = useCallback(async () => {
    if (!user) {
      Alert.alert("Sign in required", "Sign in before adding a payment method.");
      return;
    }

    let ready = sheetReady;
    if (!ready) {
      ready = await preparePaymentSheet();
    }

    if (!ready) {
      return;
    }

    setIsPresenting(true);
    try {
      const { error } = await presentPaymentSheet();

      if (error) {
        if (error.code === "Canceled") {
          setStatusMessage("Payment method setup was canceled.");
          return;
        }

        throw new Error(error.message);
      }

      setSetupComplete(true);
      setStatusMessage(
        "Payment method saved. Billing will start automatically if your account is approved.",
      );
      Alert.alert(
        "Payment method saved",
        "We’ll only charge your card after your bank account is approved.",
      );
    } catch (error) {
      const message = error instanceof Error ? error.message : "Payment method setup failed.";
      setStatusMessage(message);
      Alert.alert("Stripe setup failed", message);
    } finally {
      setIsPresenting(false);
    }
  }, [preparePaymentSheet, sheetReady, user]);

  const primaryButtonLabel = isPresenting
    ? "Opening Stripe..."
    : isPreparing
      ? "Preparing payment sheet..."
      : setupComplete
        ? "Payment method saved"
        : "Save payment method";

  return (
    <View style={[s.container, { backgroundColor: c.background }]}>
      <ScrollView
        contentContainerStyle={{ paddingBottom: insets.bottom + 40 }}
        showsVerticalScrollIndicator={false}
      >
        <LinearGradient
          colors={["#833AB4", "#E1306C", "#F77737"]}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 0 }}
          style={[s.header, { paddingTop: insets.top + 16 }]}
        >
          <Pressable onPress={() => router.back()} style={s.backBtn} hitSlop={12}>
            <Feather name="x" size={22} color="#fff" />
          </Pressable>
          <Text style={s.headerLabel}>BigBankBonus Pro</Text>
          <Text style={s.headerTitle}>Earn More.{"\n"}Automate Everything.</Text>
          <Text style={s.headerSub}>Join thousands earning $1,800+/year from bank bonuses</Text>
        </LinearGradient>

        <View style={s.body}>
          <View
            style={[
              s.freeBanner,
              {
                backgroundColor: isDark ? "#0d2b0d" : "#f0faf0",
                borderColor: "#4CAF50",
              },
            ]}
          >
            <Feather name="shield" size={18} color="#4CAF50" />
            <View style={{ flex: 1 }}>
              <Text style={[s.freeBannerTitle, { color: c.text }]}>Free to Sign Up</Text>
              <Text style={[s.freeBannerSub, { color: c.textSecondary }]}> 
                Save a card now, but we only bill after your bank account is approved.
              </Text>
            </View>
          </View>

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
              <Text style={[s.priceAmount, { color: c.text }]}>${MONTHLY_PRICE}<Text style={[s.priceInterval, { color: c.textSecondary }]}>/mo</Text></Text>
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
              <Text style={[s.priceAmount, { color: c.text }]}>${SERVICE_FEE}</Text>
            </View>

            <View style={[s.approvalNote, { backgroundColor: isDark ? "rgba(131,58,180,0.15)" : "#faf5ff", borderColor: "#833AB4" }]}> 
              <Feather name="info" size={13} color="#833AB4" />
              <Text style={[s.approvalNoteText, { color: c.textSecondary }]}> 
                By saving your payment method, you authorize BigBankBonus to charge the monthly subscription and one-time service fee only after approval.
              </Text>
            </View>
          </View>

          <View style={[s.actionCard, { backgroundColor: c.card, borderColor: c.cardBorder }]}> 
            <Text style={[s.sectionTitle, { color: c.text }]}>Save Your Payment Method</Text>
            <Text style={[s.actionSub, { color: c.textSecondary }]}> 
              We use Stripe PaymentSheet to securely save a card for future off-session billing.
            </Text>

            {configWarning ? (
              <View style={[s.statusPill, { backgroundColor: isDark ? "#2a1f08" : "#fff5dd", borderColor: "#E7A931" }]}> 
                <Feather name="alert-triangle" size={14} color="#E7A931" />
                <Text style={[s.statusText, { color: c.text }]}>{configWarning}</Text>
              </View>
            ) : null}

            {!configWarning && statusMessage ? (
              <View style={[s.statusPill, { backgroundColor: setupComplete ? (isDark ? "#0d2b0d" : "#eef9ef") : (isDark ? "#101826" : "#eef4ff"), borderColor: setupComplete ? "#4CAF50" : "#2B6EF2" }]}> 
                {isPreparing ? (
                  <ActivityIndicator size="small" color="#2B6EF2" />
                ) : (
                  <Feather name={setupComplete ? "check-circle" : "credit-card"} size={14} color={setupComplete ? "#4CAF50" : "#2B6EF2"} />
                )}
                <Text style={[s.statusText, { color: c.text }]}>{statusMessage}</Text>
              </View>
            ) : null}

            <Pressable
              onPress={() => void handleSavePaymentMethod()}
              disabled={Boolean(configWarning) || isPreparing || isPresenting || setupComplete}
              style={({ pressed }) => [
                s.primaryButton,
                {
                  opacity:
                    Boolean(configWarning) || isPreparing || isPresenting || setupComplete
                      ? 0.55
                      : pressed
                        ? 0.86
                        : 1,
                },
              ]}
            >
              <LinearGradient
                colors={setupComplete ? ["#2F9E44", "#4CAF50"] : ["#833AB4", "#E1306C"]}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 0 }}
                style={s.primaryButtonGradient}
              >
                {isPreparing || isPresenting ? (
                  <ActivityIndicator size="small" color="#fff" />
                ) : (
                  <Feather name={setupComplete ? "check" : "credit-card"} size={16} color="#fff" />
                )}
                <Text style={s.primaryButtonText}>{primaryButtonLabel}</Text>
              </LinearGradient>
            </Pressable>

            <Text style={[s.smallPrint, { color: c.textTertiary }]}> 
              Stripe handles your card details. BigBankBonus stores only the Stripe payment method reference.
            </Text>
          </View>

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

          <View style={s.sectionBlock}>
            <Text style={[s.sectionTitle, { color: c.text }]}>Everything in Pro</Text>
            {PRO_FEATURES.map((f) => (
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

          <View style={[s.statsRow, { backgroundColor: isDark ? "#ffffff08" : "#f9f5ff" }]}> 
            {[
              { val: "$2.1M+", lbl: "Earned by members" },
              { val: "4.8★", lbl: "App Store rating" },
              { val: "1,800", lbl: "Avg $/year per user" },
            ].map((st) => (
              <View key={st.val} style={s.statItem}>
                <Text style={[s.statVal, { color: "#833AB4" }]}>{st.val}</Text>
                <Text style={[s.statLbl, { color: c.textSecondary }]}>{st.lbl}</Text>
              </View>
            ))}
          </View>

          <Text style={[s.disclaimer, { color: c.textTertiary }]}> 
            Free to join · Billed only after approval · Secure setup via Stripe PaymentSheet
          </Text>
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
  actionCard: {
    borderRadius: 16,
    borderWidth: 1,
    padding: 16,
    gap: 12,
  },
  actionSub: { fontSize: 12, fontFamily: "Inter_400Regular", lineHeight: 18 },
  statusPill: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    borderWidth: 1,
    borderRadius: 12,
    paddingHorizontal: 12,
    paddingVertical: 10,
  },
  statusText: { flex: 1, fontSize: 12, fontFamily: "Inter_400Regular", lineHeight: 18 },
  primaryButton: { borderRadius: 14, overflow: "hidden" },
  primaryButtonGradient: {
    minHeight: 52,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 10,
    paddingHorizontal: 18,
  },
  primaryButtonText: { color: "#fff", fontSize: 15, fontFamily: "Inter_700Bold" },
  smallPrint: { fontSize: 11, fontFamily: "Inter_400Regular", lineHeight: 16 },
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
});
