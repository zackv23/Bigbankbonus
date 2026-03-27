import { Feather } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";
import { LinearGradient } from "expo-linear-gradient";
import { router } from "expo-router";
import React, { useState } from "react";
import {
  Alert,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
  useColorScheme,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import Colors from "@/constants/colors";
import { useCredits } from "@/context/CreditsContext";

const CREDIT_PACKAGES = [
  { amount: 500, fee: 3.75, label: "$500", popular: false },
  { amount: 1000, fee: 7.50, label: "$1,000", popular: false },
  { amount: 2000, fee: 15.00, label: "$2,000", popular: true },
  { amount: 5000, fee: 37.50, label: "$5,000", popular: false },
  { amount: 10000, fee: 75.00, label: "$10,000", popular: false },
];

export default function PaymentScreen() {
  const insets = useSafeAreaInsets();
  const colorScheme = useColorScheme();
  const isDark = colorScheme === "dark";
  const c = isDark ? Colors.dark : Colors.light;
  const { addCreditPurchase, totalCredits, availableCredits } = useCredits();

  const [selectedPackage, setSelectedPackage] = useState(CREDIT_PACKAGES[2]);
  const [cardNumber, setCardNumber] = useState("");
  const [expiry, setExpiry] = useState("");
  const [cvv, setCvv] = useState("");
  const [name, setName] = useState("");
  const [processing, setProcessing] = useState(false);
  const [step, setStep] = useState<"select" | "card" | "success">("select");

  const formatCardNumber = (val: string) => {
    const clean = val.replace(/\D/g, "").slice(0, 16);
    return clean.replace(/(.{4})/g, "$1 ").trim();
  };

  const formatExpiry = (val: string) => {
    const clean = val.replace(/\D/g, "").slice(0, 4);
    if (clean.length >= 2) return clean.slice(0, 2) + "/" + clean.slice(2);
    return clean;
  };

  const handleProcessPayment = async () => {
    if (!cardNumber || !expiry || !cvv || !name) {
      Alert.alert("Error", "Please fill in all card details");
      return;
    }
    if (Platform.OS !== "web") Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    setProcessing(true);
    await new Promise(r => setTimeout(r, 2000));
    await addCreditPurchase(selectedPackage.amount, selectedPackage.fee, "stripe_pi_demo_" + Date.now());
    if (Platform.OS !== "web") Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    setProcessing(false);
    setStep("success");
  };

  if (step === "success") {
    return (
      <View style={[styles.container, { backgroundColor: c.background }]}>
        <View style={[styles.header, { paddingTop: insets.top + (Platform.OS === "web" ? 67 : 12) }]}>
          <LinearGradient colors={["#00C853", "#00897B"]} style={StyleSheet.absoluteFill} />
          <Pressable style={styles.closeBtn} onPress={() => router.back()}>
            <Feather name="x" size={20} color="#fff" />
          </Pressable>
        </View>
        <View style={styles.successContent}>
          <View style={styles.successIcon}>
            <LinearGradient colors={["#00C853", "#00897B"]} style={StyleSheet.absoluteFill} />
            <Feather name="check" size={40} color="#fff" />
          </View>
          <Text style={[styles.successTitle, { color: c.text }]}>Payment Successful!</Text>
          <Text style={[styles.successSub, { color: c.textSecondary }]}>
            ${selectedPackage.amount.toLocaleString()} in credits added to your account
          </Text>
          <View style={[styles.successCard, { backgroundColor: c.card, borderColor: c.cardBorder }]}>
            <View style={styles.successRow}>
              <Text style={[styles.successLabel, { color: c.textSecondary }]}>Credits Added</Text>
              <Text style={[styles.successValue, { color: "#00C853" }]}>${selectedPackage.amount.toLocaleString()}</Text>
            </View>
            <View style={styles.successRow}>
              <Text style={[styles.successLabel, { color: c.textSecondary }]}>Processing Fee (0.75%)</Text>
              <Text style={[styles.successValue, { color: c.text }]}>${selectedPackage.fee.toFixed(2)}</Text>
            </View>
            <View style={[styles.successDivider, { backgroundColor: c.separator }]} />
            <View style={styles.successRow}>
              <Text style={[styles.successLabel, { color: c.text }]}>Total Charged</Text>
              <Text style={[styles.successValue, { color: c.text }]}>${(selectedPackage.amount + selectedPackage.fee).toFixed(2)}</Text>
            </View>
            <View style={styles.successRow}>
              <Text style={[styles.successLabel, { color: c.textSecondary }]}>Available Balance</Text>
              <Text style={[styles.successValue, { color: "#833AB4" }]}>${availableCredits.toLocaleString()}</Text>
            </View>
          </View>
          <Pressable style={styles.doneBtn} onPress={() => router.back()}>
            <LinearGradient colors={["#833AB4", "#E1306C"]} start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }} style={StyleSheet.absoluteFill} />
            <Text style={styles.doneBtnText}>View Accounts</Text>
          </Pressable>
        </View>
      </View>
    );
  }

  return (
    <View style={[styles.container, { backgroundColor: c.background }]}>
      <View style={[styles.header, { paddingTop: insets.top + (Platform.OS === "web" ? 67 : 12) }]}>
        <LinearGradient colors={["#833AB4", "#E1306C"]} style={StyleSheet.absoluteFill} />
        <View style={styles.headerRow}>
          <Pressable style={styles.closeBtn} onPress={() => router.back()}>
            <Feather name="x" size={20} color="#fff" />
          </Pressable>
          <Text style={styles.headerTitle}>Purchase Credits</Text>
          <View style={{ width: 36 }} />
        </View>
        <Text style={styles.headerSub}>0.75% processing fee · Powered by Stripe</Text>

        <View style={styles.currentBalance}>
          <Feather name="credit-card" size={16} color="rgba(255,255,255,0.8)" />
          <Text style={styles.currentBalanceText}>Current Balance: ${totalCredits.toLocaleString()}</Text>
        </View>
      </View>

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ padding: 16, gap: 16, paddingBottom: insets.bottom + (Platform.OS === "web" ? 34 : 40) }}
      >
        {step === "select" && (
          <>
            <Text style={[styles.stepTitle, { color: c.text }]}>Select Amount</Text>
            <View style={styles.packages}>
              {CREDIT_PACKAGES.map(pkg => (
                <Pressable
                  key={pkg.amount}
                  style={[
                    styles.packageCard,
                    { backgroundColor: c.card, borderColor: selectedPackage.amount === pkg.amount ? "#833AB4" : c.cardBorder },
                    selectedPackage.amount === pkg.amount && styles.packageCardSelected,
                  ]}
                  onPress={() => {
                    if (Platform.OS !== "web") Haptics.selectionAsync();
                    setSelectedPackage(pkg);
                  }}
                >
                  {pkg.popular && (
                    <View style={styles.popularBadge}>
                      <LinearGradient colors={["#833AB4", "#E1306C"]} style={StyleSheet.absoluteFill} />
                      <Text style={styles.popularText}>MOST POPULAR</Text>
                    </View>
                  )}
                  <Text style={[styles.packageAmount, { color: c.text }]}>{pkg.label}</Text>
                  <Text style={[styles.packageFee, { color: c.textSecondary }]}>+${pkg.fee.toFixed(2)} fee</Text>
                  <Text style={[styles.packageTotal, { color: selectedPackage.amount === pkg.amount ? "#833AB4" : c.textTertiary }]}>
                    ${(pkg.amount + pkg.fee).toFixed(2)} total
                  </Text>
                  {selectedPackage.amount === pkg.amount && (
                    <View style={styles.checkMark}>
                      <Feather name="check-circle" size={20} color="#833AB4" />
                    </View>
                  )}
                </Pressable>
              ))}
            </View>

            <View style={[styles.infoBox, { backgroundColor: "#833AB422", borderColor: "#833AB4" }]}>
              <Feather name="info" size={16} color="#833AB4" />
              <Text style={[styles.infoText, { color: "#833AB4" }]}>
                Credits are deployed to your bank accounts and churn automatically after initial deposits settle. BigBankBonus business checking handles all fund transfers.
              </Text>
            </View>

            <Pressable style={styles.nextBtn} onPress={() => setStep("card")}>
              <LinearGradient colors={["#833AB4", "#E1306C"]} start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }} style={StyleSheet.absoluteFill} />
              <Text style={styles.nextBtnText}>Continue to Payment</Text>
              <Feather name="arrow-right" size={18} color="#fff" />
            </Pressable>
          </>
        )}

        {step === "card" && (
          <>
            <View style={styles.cardPreview}>
              <LinearGradient colors={["#833AB4", "#E1306C", "#F77737"]} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={styles.cardPreviewGrad}>
                <Text style={styles.cardPreviewLabel}>PAYING</Text>
                <Text style={styles.cardPreviewAmount}>${selectedPackage.amount.toLocaleString()}</Text>
                <Text style={styles.cardPreviewFee}>+${selectedPackage.fee.toFixed(2)} fee</Text>
                <View style={styles.cardPreviewBottom}>
                  <Text style={styles.cardPreviewName}>{name || "CARD HOLDER"}</Text>
                  <Text style={styles.cardPreviewNum}>{cardNumber ? "•••• " + cardNumber.replace(/\s/g, "").slice(-4) : "•••• ••••"}</Text>
                </View>
              </LinearGradient>
            </View>

            <Text style={[styles.inputLabel, { color: c.textSecondary }]}>Name on Card</Text>
            <TextInput
              style={[styles.inputField, { backgroundColor: c.backgroundSecondary, color: c.text, borderColor: c.cardBorder }]}
              placeholder="John Smith"
              placeholderTextColor={c.textTertiary}
              value={name}
              onChangeText={setName}
              autoCapitalize="words"
            />

            <Text style={[styles.inputLabel, { color: c.textSecondary }]}>Card Number</Text>
            <TextInput
              style={[styles.inputField, { backgroundColor: c.backgroundSecondary, color: c.text, borderColor: c.cardBorder }]}
              placeholder="1234 5678 9012 3456"
              placeholderTextColor={c.textTertiary}
              value={cardNumber}
              onChangeText={t => setCardNumber(formatCardNumber(t))}
              keyboardType="numeric"
              maxLength={19}
            />

            <View style={styles.cardRow}>
              <View style={{ flex: 1 }}>
                <Text style={[styles.inputLabel, { color: c.textSecondary }]}>Expiry</Text>
                <TextInput
                  style={[styles.inputField, { backgroundColor: c.backgroundSecondary, color: c.text, borderColor: c.cardBorder }]}
                  placeholder="MM/YY"
                  placeholderTextColor={c.textTertiary}
                  value={expiry}
                  onChangeText={t => setExpiry(formatExpiry(t))}
                  keyboardType="numeric"
                  maxLength={5}
                />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={[styles.inputLabel, { color: c.textSecondary }]}>CVV</Text>
                <TextInput
                  style={[styles.inputField, { backgroundColor: c.backgroundSecondary, color: c.text, borderColor: c.cardBorder }]}
                  placeholder="123"
                  placeholderTextColor={c.textTertiary}
                  value={cvv}
                  onChangeText={setCvv}
                  keyboardType="numeric"
                  maxLength={4}
                  secureTextEntry
                />
              </View>
            </View>

            <View style={[styles.summaryBox, { backgroundColor: c.backgroundSecondary }]}>
              <View style={styles.summaryRow}>
                <Text style={[styles.summaryLabel, { color: c.textSecondary }]}>Credits</Text>
                <Text style={[styles.summaryValue, { color: c.text }]}>${selectedPackage.amount.toLocaleString()}</Text>
              </View>
              <View style={styles.summaryRow}>
                <Text style={[styles.summaryLabel, { color: c.textSecondary }]}>Processing Fee (0.75%)</Text>
                <Text style={[styles.summaryValue, { color: c.text }]}>${selectedPackage.fee.toFixed(2)}</Text>
              </View>
              <View style={[styles.summaryDivider, { backgroundColor: c.separator }]} />
              <View style={styles.summaryRow}>
                <Text style={[styles.summaryLabel, { color: c.text, fontFamily: "Inter_700Bold" }]}>Total Charge</Text>
                <Text style={[styles.summaryValue, { color: "#833AB4", fontFamily: "Inter_700Bold", fontSize: 18 }]}>
                  ${(selectedPackage.amount + selectedPackage.fee).toFixed(2)}
                </Text>
              </View>
            </View>

            <View style={styles.cardActions}>
              <Pressable style={[styles.backBtn2, { borderColor: c.cardBorder }]} onPress={() => setStep("select")}>
                <Feather name="arrow-left" size={16} color={c.textSecondary} />
                <Text style={[styles.backBtnText, { color: c.textSecondary }]}>Back</Text>
              </Pressable>
              <Pressable
                style={[styles.payBtn, { opacity: processing ? 0.7 : 1 }]}
                onPress={handleProcessPayment}
                disabled={processing}
              >
                <LinearGradient colors={["#833AB4", "#E1306C"]} start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }} style={StyleSheet.absoluteFill} />
                <Feather name="lock" size={16} color="#fff" />
                <Text style={styles.payBtnText}>{processing ? "Processing..." : "Pay Now"}</Text>
              </Pressable>
            </View>

            <View style={styles.stripeNote}>
              <Feather name="shield" size={12} color="#666" />
              <Text style={[styles.stripeNoteText, { color: c.textTertiary }]}>Secured by Stripe · Your card data is encrypted</Text>
            </View>
          </>
        )}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: { paddingHorizontal: 16, paddingBottom: 16 },
  headerRow: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", marginBottom: 4 },
  closeBtn: { width: 36, height: 36, backgroundColor: "rgba(255,255,255,0.15)", borderRadius: 10, alignItems: "center", justifyContent: "center" },
  headerTitle: { fontSize: 18, fontFamily: "Inter_700Bold", color: "#fff" },
  headerSub: { fontSize: 12, fontFamily: "Inter_400Regular", color: "rgba(255,255,255,0.7)", textAlign: "center", marginBottom: 8 },
  currentBalance: { flexDirection: "row", alignItems: "center", gap: 6, backgroundColor: "rgba(255,255,255,0.15)", paddingHorizontal: 12, paddingVertical: 8, borderRadius: 10, alignSelf: "center" },
  currentBalanceText: { fontSize: 13, fontFamily: "Inter_600SemiBold", color: "#fff" },
  stepTitle: { fontSize: 18, fontFamily: "Inter_700Bold" },
  packages: { flexDirection: "row", flexWrap: "wrap", gap: 10 },
  packageCard: { width: "47%" as any, borderRadius: 14, borderWidth: 1.5, padding: 14, overflow: "hidden", position: "relative" },
  packageCardSelected: { borderWidth: 2 },
  popularBadge: { position: "absolute", top: 0, left: 0, right: 0, overflow: "hidden", borderRadius: 10, paddingVertical: 4, alignItems: "center" },
  popularText: { fontSize: 9, fontFamily: "Inter_700Bold", color: "#fff", letterSpacing: 1 },
  packageAmount: { fontSize: 22, fontFamily: "Inter_700Bold", marginTop: 14 },
  packageFee: { fontSize: 12, fontFamily: "Inter_400Regular", marginTop: 4 },
  packageTotal: { fontSize: 12, fontFamily: "Inter_600SemiBold", marginTop: 2 },
  checkMark: { position: "absolute", top: 10, right: 10 },
  infoBox: { flexDirection: "row", alignItems: "flex-start", gap: 10, padding: 14, borderRadius: 12, borderWidth: 1 },
  infoText: { flex: 1, fontSize: 13, fontFamily: "Inter_400Regular", lineHeight: 20 },
  nextBtn: { flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 8, paddingVertical: 16, borderRadius: 14, overflow: "hidden" },
  nextBtnText: { fontSize: 16, fontFamily: "Inter_600SemiBold", color: "#fff" },
  cardPreview: { borderRadius: 16, overflow: "hidden", height: 140 },
  cardPreviewGrad: { flex: 1, padding: 20, justifyContent: "space-between" },
  cardPreviewLabel: { fontSize: 10, fontFamily: "Inter_600SemiBold", color: "rgba(255,255,255,0.8)", letterSpacing: 2 },
  cardPreviewAmount: { fontSize: 32, fontFamily: "Inter_700Bold", color: "#fff" },
  cardPreviewFee: { fontSize: 12, fontFamily: "Inter_400Regular", color: "rgba(255,255,255,0.7)" },
  cardPreviewBottom: { flexDirection: "row", justifyContent: "space-between" },
  cardPreviewName: { fontSize: 13, fontFamily: "Inter_600SemiBold", color: "rgba(255,255,255,0.9)" },
  cardPreviewNum: { fontSize: 13, fontFamily: "Inter_600SemiBold", color: "rgba(255,255,255,0.9)" },
  inputLabel: { fontSize: 13, fontFamily: "Inter_600SemiBold", marginBottom: 6, marginTop: 4 },
  inputField: { borderRadius: 12, borderWidth: 1, paddingHorizontal: 14, paddingVertical: 12, fontSize: 15, fontFamily: "Inter_400Regular" },
  cardRow: { flexDirection: "row", gap: 12 },
  summaryBox: { borderRadius: 14, padding: 14, gap: 8 },
  summaryRow: { flexDirection: "row", justifyContent: "space-between", alignItems: "center" },
  summaryLabel: { fontSize: 14, fontFamily: "Inter_400Regular" },
  summaryValue: { fontSize: 15, fontFamily: "Inter_600SemiBold" },
  summaryDivider: { height: 1 },
  cardActions: { flexDirection: "row", gap: 10 },
  backBtn2: { flex: 1, flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 6, paddingVertical: 14, borderRadius: 12, borderWidth: 1 },
  backBtnText: { fontSize: 15, fontFamily: "Inter_600SemiBold" },
  payBtn: { flex: 2, flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 6, paddingVertical: 14, borderRadius: 12, overflow: "hidden" },
  payBtnText: { fontSize: 16, fontFamily: "Inter_600SemiBold", color: "#fff" },
  stripeNote: { flexDirection: "row", alignItems: "center", gap: 6, justifyContent: "center" },
  stripeNoteText: { fontSize: 11, fontFamily: "Inter_400Regular" },
  successContent: { flex: 1, alignItems: "center", justifyContent: "center", padding: 24, gap: 16 },
  successIcon: { width: 80, height: 80, borderRadius: 40, overflow: "hidden", alignItems: "center", justifyContent: "center" },
  successTitle: { fontSize: 28, fontFamily: "Inter_700Bold", textAlign: "center" },
  successSub: { fontSize: 15, fontFamily: "Inter_400Regular", textAlign: "center", lineHeight: 22 },
  successCard: { width: "100%", borderRadius: 16, borderWidth: 1, padding: 16, gap: 10 },
  successRow: { flexDirection: "row", justifyContent: "space-between" },
  successLabel: { fontSize: 14, fontFamily: "Inter_400Regular" },
  successValue: { fontSize: 15, fontFamily: "Inter_600SemiBold" },
  successDivider: { height: 1 },
  doneBtn: { width: "100%", paddingVertical: 16, borderRadius: 14, alignItems: "center", overflow: "hidden" },
  doneBtnText: { fontSize: 16, fontFamily: "Inter_600SemiBold", color: "#fff" },
});
