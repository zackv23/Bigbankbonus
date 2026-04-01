import { Feather } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import React, { useCallback, useEffect, useMemo, useState } from "react";
import {
  ActivityIndicator,
  KeyboardAvoidingView,
  Modal,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
  useColorScheme,
} from "react-native";
import Colors from "@/constants/colors";
import { useAuth } from "@/context/AuthContext";
import LeverageProjectionWidget from "./LeverageProjectionWidget";

// ─── Types ────────────────────────────────────────────────────────────────────
interface FeeBreakdown {
  depositAmount: number;    // cents
  serviceFee: number;       // cents
  taxAmount: number;        // cents
  stripeFee: number;        // cents
  totalCharged: number;     // cents
  achAmount: number;        // cents
  achScheduledDate: string;
}

interface DepositEarnModalProps {
  visible: boolean;
  onClose: () => void;
  stackedOffersCount?: number;
  stackedOffersTotal?: number;
  userState?: string;
}

type Step = "account" | "confirm_account" | "routing" | "review" | "success";

// ─── Currency helpers ─────────────────────────────────────────────────────────
function centsToDisplay(cents: number): string {
  return (cents / 100).toFixed(2);
}

function fmtDate(iso: string): string {
  return new Date(iso).toLocaleDateString("en-US", { weekday: "long", month: "short", day: "numeric" });
}

function getApiBase(): string {
  const domain = process.env.EXPO_PUBLIC_DOMAIN;
  return domain ? `https://${domain}/api` : "http://localhost:8080/api";
}

// ─── Component ────────────────────────────────────────────────────────────────
export default function DepositEarnModal({
  visible,
  onClose,
  stackedOffersCount = 5,
  stackedOffersTotal,
  userState,
}: DepositEarnModalProps) {
  const colorScheme = useColorScheme();
  const isDark = colorScheme === "dark";
  const c = isDark ? Colors.dark : Colors.light;
  const { user } = useAuth() as any;

  const [step, setStep] = useState<Step>("account");
  const [accountNumber, setAccountNumber] = useState("");
  const [accountConfirm, setAccountConfirm] = useState("");
  const [routingNumber, setRoutingNumber] = useState("");
  const [mismatch, setMismatch] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [fees, setFees] = useState<FeeBreakdown | null>(null);
  const [orderId, setOrderId] = useState<number | null>(null);
  const [feesLoading, setFeesLoading] = useState(false);

  const maskedAccount = accountNumber
    ? "••••" + accountNumber.slice(-4)
    : "••••••••";

  // Load fee calculation from server when modal opens
  useEffect(() => {
    if (!visible) return;
    setFeesLoading(true);
    const stateParam = userState ? `?state=${userState}` : "";
    fetch(`${getApiBase()}/deposit/calculate${stateParam}`)
      .then(r => r.json())
      .then(data => {
        if (data.breakdown) {
          setFees({
            depositAmount: data.breakdown.deposit,
            serviceFee: data.breakdown.serviceFee,
            taxAmount: data.breakdown.tax,
            stripeFee: data.breakdown.stripeFee,
            totalCharged: data.breakdown.total,
            achAmount: data.achAmount ?? data.breakdown.deposit,
            achScheduledDate: data.achScheduledDate,
          });
        }
      })
      .catch(() => {
        // Fallback to default values if API unavailable
        setFees({
          depositAmount: 50000,
          serviceFee: 9900,
          taxAmount: 0,
          stripeFee: Math.round((50000 + 9900) * 0.029) + 30,
          totalCharged: Math.round((50000 + 9900) * 1.029) + 30,
          achAmount: 50000,
          achScheduledDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
        });
      })
      .finally(() => setFeesLoading(false));
  }, [visible, userState]);

  const resetModal = useCallback(() => {
    setStep("account");
    setAccountNumber("");
    setAccountConfirm("");
    setRoutingNumber("");
    setMismatch(false);
    setError(null);
    setOrderId(null);
  }, []);

  const handleClose = () => { resetModal(); onClose(); };

  const handleConfirmAccount = () => {
    if (accountNumber.length < 4) return setError("Enter a valid account number");
    if (accountNumber !== accountConfirm) {
      setMismatch(true);
      return setError("Account numbers don't match — please re-enter");
    }
    setMismatch(false);
    setError(null);
    setStep("routing");
  };

  const handleRouting = () => {
    if (routingNumber.length !== 9) return setError("Routing number must be 9 digits");
    setError(null);
    setStep("review");
  };

  const handleConfirm = async () => {
    if (!fees) return;
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(`${getApiBase()}/deposit/initiate`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          userId: user?.id ?? "demo-user",
          accountNumber,
          routingNumber,
          userState: userState ?? null,
          stripePaymentMethodId: "demo",
          stackedOffersCount,
          stackedOffersTotal: stackedOffersTotal ?? null,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Failed to create deposit");
      setOrderId(data.order?.id ?? null);
      setStep("success");
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Modal visible={visible} animationType="slide" presentationStyle="pageSheet" onRequestClose={handleClose}>
      <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === "ios" ? "padding" : undefined}>
        <View style={[s.container, { backgroundColor: c.background }]}>

          {/* Header */}
          <LinearGradient
            colors={["#1a1a2e", "#16213e", "#0f3460"]}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={s.header}
          >
            <View style={s.headerRow}>
              <View>
                <View style={s.headerBadge}>
                  <Feather name="zap" size={11} color="#F77737" />
                  <Text style={s.headerBadgeText}>DEPOSIT & EARN</Text>
                </View>
                <Text style={s.headerTitle}>$500 Leverage System</Text>
                <Text style={s.headerSub}>
                  Deposit $500 · Get $500 ACH next Monday · Collect bonuses
                </Text>
              </View>
              <Pressable onPress={handleClose} style={s.closeBtn}>
                <Feather name="x" size={22} color="#fff" />
              </Pressable>
            </View>

            {/* Quick stats strip */}
            <View style={s.statsStrip}>
              {[
                { val: "$500", label: "Deposit" },
                { val: "$99", label: "Fee" },
                { val: "Monday", label: "ACH Sent" },
                { val: "10x–20x", label: "Leverage" },
              ].map((item, i, arr) => (
                <React.Fragment key={i}>
                  <View style={s.statItem}>
                    <Text style={s.statVal}>{item.val}</Text>
                    <Text style={s.statLabel}>{item.label}</Text>
                  </View>
                  {i < arr.length - 1 && <View style={s.statDivider} />}
                </React.Fragment>
              ))}
            </View>
          </LinearGradient>

          <ScrollView contentContainerStyle={s.body} keyboardShouldPersistTaps="handled">

            {/* ── STEP: Account Number ── */}
            {step === "account" && (
              <View style={s.stepCard}>
                <LeverageProjectionWidget
                  depositAmount={500}
                  stackedOffersCount={stackedOffersCount}
                  stackedOffersTotal={stackedOffersTotal}
                />

                <View style={[s.divider, { backgroundColor: c.separator ?? "#eee" }]} />

                <View style={s.stepNumRow}>
                  <View style={[s.stepNum, { backgroundColor: "#0f3460" }]}>
                    <Text style={s.stepNumText}>1</Text>
                  </View>
                  <Text style={[s.stepTitle, { color: c.text }]}>Enter Your Account Number</Text>
                </View>
                <Text style={[s.stepHint, { color: c.textSecondary }]}>
                  Enter the checking account number where you'd like the $500 ACH transfer sent.
                </Text>
                <TextInput
                  style={[s.input, { backgroundColor: c.backgroundSecondary, borderColor: c.cardBorder, color: c.text }]}
                  placeholder="Account number"
                  placeholderTextColor={c.textTertiary}
                  keyboardType="numeric"
                  secureTextEntry
                  value={accountNumber}
                  onChangeText={t => { setAccountNumber(t.replace(/\D/g, "")); setError(null); }}
                  maxLength={17}
                />
                {error && <Text style={s.errText}>{error}</Text>}
                <Pressable
                  style={[s.btn, { backgroundColor: "#0f3460" }]}
                  onPress={() => {
                    if (accountNumber.length >= 4) { setError(null); setStep("confirm_account"); }
                    else setError("Enter a valid account number");
                  }}
                >
                  <Text style={s.btnText}>Continue</Text>
                  <Feather name="arrow-right" size={16} color="#fff" />
                </Pressable>
              </View>
            )}

            {/* ── STEP: Confirm Account ── */}
            {step === "confirm_account" && (
              <View style={s.stepCard}>
                <View style={s.stepNumRow}>
                  <View style={[s.stepNum, { backgroundColor: "#833AB4" }]}>
                    <Text style={s.stepNumText}>2</Text>
                  </View>
                  <Text style={[s.stepTitle, { color: c.text }]}>Confirm Account Number</Text>
                </View>
                <Text style={[s.stepHint, { color: c.textSecondary }]}>
                  Re-enter your account number to confirm it's correct. A typo could send the $500 to the wrong account.
                </Text>
                <TextInput
                  style={[s.input, {
                    backgroundColor: c.backgroundSecondary,
                    borderColor: mismatch ? "#F44336" : c.cardBorder,
                    color: c.text,
                  }]}
                  placeholder="Confirm account number"
                  placeholderTextColor={c.textTertiary}
                  keyboardType="numeric"
                  secureTextEntry
                  value={accountConfirm}
                  onChangeText={t => { setAccountConfirm(t.replace(/\D/g, "")); setMismatch(false); setError(null); }}
                  maxLength={17}
                />
                {error && <Text style={s.errText}>{error}</Text>}
                <Pressable style={[s.btn, { backgroundColor: "#833AB4" }]} onPress={handleConfirmAccount}>
                  <Text style={s.btnText}>Verify & Continue</Text>
                  <Feather name="check" size={16} color="#fff" />
                </Pressable>
                <Pressable style={s.backBtn} onPress={() => setStep("account")}>
                  <Text style={[s.backText, { color: c.textSecondary }]}>← Back</Text>
                </Pressable>
              </View>
            )}

            {/* ── STEP: Routing Number ── */}
            {step === "routing" && (
              <View style={s.stepCard}>
                <View style={s.stepNumRow}>
                  <View style={[s.stepNum, { backgroundColor: "#E1306C" }]}>
                    <Text style={s.stepNumText}>3</Text>
                  </View>
                  <Text style={[s.stepTitle, { color: c.text }]}>Enter Routing Number</Text>
                </View>
                <Text style={[s.stepHint, { color: c.textSecondary }]}>
                  Your 9-digit ABA routing number — found on the bottom-left of a check.
                </Text>
                <TextInput
                  style={[s.input, { backgroundColor: c.backgroundSecondary, borderColor: c.cardBorder, color: c.text }]}
                  placeholder="9-digit routing number"
                  placeholderTextColor={c.textTertiary}
                  keyboardType="numeric"
                  value={routingNumber}
                  onChangeText={t => { setRoutingNumber(t.replace(/\D/g, "").slice(0, 9)); setError(null); }}
                  maxLength={9}
                />
                <Text style={[s.routingCount, { color: routingNumber.length === 9 ? "#4CAF50" : c.textTertiary }]}>
                  {routingNumber.length}/9 digits
                </Text>
                {error && <Text style={s.errText}>{error}</Text>}
                <Pressable style={[s.btn, { backgroundColor: "#E1306C" }]} onPress={handleRouting}>
                  <Text style={s.btnText}>Preview Deposit</Text>
                  <Feather name="eye" size={16} color="#fff" />
                </Pressable>
                <Pressable style={s.backBtn} onPress={() => setStep("confirm_account")}>
                  <Text style={[s.backText, { color: c.textSecondary }]}>← Back</Text>
                </Pressable>
              </View>
            )}

            {/* ── STEP: Review ── */}
            {step === "review" && (
              <View style={{ gap: 14 }}>
                {/* Account confirmation */}
                <View style={[s.reviewBox, { backgroundColor: c.card, borderColor: c.cardBorder }]}>
                  <Text style={[s.boxTitle, { color: c.textSecondary }]}>ACCOUNT ON FILE</Text>
                  <View style={s.reviewRow}>
                    <Feather name="lock" size={14} color="#0f3460" />
                    <Text style={[s.reviewVal, { color: c.text }]}>{maskedAccount}</Text>
                    <Text style={[s.reviewSub, { color: c.textSecondary }]}>Routing: ••••{routingNumber.slice(-4)}</Text>
                  </View>
                </View>

                {/* Fee breakdown */}
                {feesLoading ? (
                  <ActivityIndicator color="#0f3460" />
                ) : fees ? (
                  <View style={[s.reviewBox, { backgroundColor: c.card, borderColor: c.cardBorder }]}>
                    <Text style={[s.boxTitle, { color: c.textSecondary }]}>CHARGE BREAKDOWN</Text>

                    {[
                      { label: "$500 Deposit", val: `$${centsToDisplay(fees.depositAmount)}`, color: c.text },
                      { label: "Service Fee", val: `$${centsToDisplay(fees.serviceFee)}`, color: c.textSecondary },
                      ...(fees.taxAmount > 0
                        ? [{ label: "Sales Tax", val: `$${centsToDisplay(fees.taxAmount)}`, color: c.textSecondary }]
                        : []),
                      { label: "Stripe Processing (2.9% + $0.30)", val: `$${centsToDisplay(fees.stripeFee)}`, color: c.textSecondary },
                    ].map((row, i) => (
                      <View key={i} style={s.feeRow}>
                        <Text style={[s.feeLabel, { color: row.color }]}>{row.label}</Text>
                        <Text style={[s.feeVal, { color: row.color }]}>{row.val}</Text>
                      </View>
                    ))}

                    <View style={[s.feeDivider, { backgroundColor: c.separator ?? "#eee" }]} />

                    <View style={s.feeRow}>
                      <Text style={[s.feeTotalLabel, { color: c.text }]}>Total Charged to Card</Text>
                      <Text style={[s.feeTotalVal, { color: "#E1306C" }]}>${centsToDisplay(fees.totalCharged)}</Text>
                    </View>

                    <View style={[s.achBox, { backgroundColor: "#4CAF5015" }]}>
                      <Feather name="send" size={14} color="#4CAF50" />
                      <View style={{ flex: 1 }}>
                        <Text style={[s.achLabel, { color: "#4CAF50" }]}>
                          $500.00 ACH sent to ••••{accountNumber.slice(-4)}
                        </Text>
                        <Text style={[s.achDate, { color: c.textSecondary }]}>
                          Sent next Monday · {fmtDate(fees.achScheduledDate)}
                        </Text>
                      </View>
                    </View>
                  </View>
                ) : null}

                {/* Leverage projection */}
                <LeverageProjectionWidget
                  depositAmount={500}
                  stackedOffersCount={stackedOffersCount}
                  stackedOffersTotal={stackedOffersTotal}
                />

                {error && <Text style={s.errText}>{error}</Text>}

                <Pressable
                  style={[s.btn, { backgroundColor: loading ? "#ccc" : "#0f3460", opacity: loading ? 0.7 : 1 }]}
                  onPress={handleConfirm}
                  disabled={loading}
                >
                  {loading ? (
                    <ActivityIndicator color="#fff" size="small" />
                  ) : (
                    <>
                      <Feather name="zap" size={16} color="#fff" />
                      <Text style={s.btnText}>
                        Confirm & Pay {fees ? `$${centsToDisplay(fees.totalCharged)}` : ""}
                      </Text>
                    </>
                  )}
                </Pressable>

                <Text style={[s.legalText, { color: c.textTertiary }]}>
                  By confirming, you authorize a one-time charge of {fees ? `$${centsToDisplay(fees.totalCharged)}` : "the total amount"} to your card.
                  The $500 will be ACH transferred to your account on {fees ? fmtDate(fees.achScheduledDate) : "the following Monday"}.
                  Leverage projections represent potential earnings based on stacked bonus offers and are not guaranteed.
                </Text>

                <Pressable style={s.backBtn} onPress={() => setStep("routing")}>
                  <Text style={[s.backText, { color: c.textSecondary }]}>← Edit Bank Info</Text>
                </Pressable>
              </View>
            )}

            {/* ── STEP: Success ── */}
            {step === "success" && fees && (
              <View style={s.successCard}>
                <LinearGradient
                  colors={["#0f3460", "#833AB4", "#E1306C"]}
                  style={s.successIcon}
                >
                  <Feather name="check" size={36} color="#fff" />
                </LinearGradient>

                <Text style={[s.successTitle, { color: c.text }]}>Deposit Confirmed!</Text>
                <Text style={[s.successSub, { color: c.textSecondary }]}>
                  Order #{orderId} · $500 ACH scheduled for Monday
                </Text>

                {/* Status tracker */}
                <View style={[s.statusTracker, { backgroundColor: c.card, borderColor: c.cardBorder }]}>
                  <Text style={[s.boxTitle, { color: c.textSecondary }]}>ACH TRANSFER STATUS</Text>
                  {[
                    { label: "Card Charged", status: "done", val: `$${centsToDisplay(fees.totalCharged)}`, color: "#4CAF50" },
                    { label: "ACH Pending", status: "pending", val: `$500.00 → ••••${accountNumber.slice(-4)}`, color: "#FFB300" },
                    { label: "ACH Sent", status: "upcoming", val: fmtDate(fees.achScheduledDate), color: "#2196F3" },
                    { label: "ACH Confirmed", status: "upcoming", val: "After bank processes", color: "#9E9E9E" },
                  ].map((row, i) => (
                    <View key={i} style={s.statusRow}>
                      <View style={[s.statusDot, {
                        backgroundColor: row.status === "done" ? "#4CAF50" : row.status === "pending" ? "#FFB300" : "#E0E0E0"
                      }]}>
                        {row.status === "done" && <Feather name="check" size={9} color="#fff" />}
                        {row.status === "pending" && <View style={s.statusDotInner} />}
                      </View>
                      <View style={{ flex: 1 }}>
                        <Text style={[s.statusLabel, { color: c.text }]}>{row.label}</Text>
                        <Text style={[s.statusVal, { color: row.color }]}>{row.val}</Text>
                      </View>
                    </View>
                  ))}
                </View>

                {/* Leverage widget on success */}
                <LeverageProjectionWidget
                  depositAmount={500}
                  stackedOffersCount={stackedOffersCount}
                  stackedOffersTotal={stackedOffersTotal}
                  compact
                />

                <Pressable style={[s.btn, { backgroundColor: "#0f3460", marginTop: 8 }]} onPress={handleClose}>
                  <Feather name="check-circle" size={16} color="#fff" />
                  <Text style={s.btnText}>Done</Text>
                </Pressable>
              </View>
            )}
          </ScrollView>
        </View>
      </KeyboardAvoidingView>
    </Modal>
  );
}

const s = StyleSheet.create({
  container: { flex: 1 },
  header: { paddingTop: 20, paddingBottom: 16, paddingHorizontal: 20 },
  headerRow: { flexDirection: "row", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 14 },
  headerBadge: { flexDirection: "row", alignItems: "center", gap: 4, backgroundColor: "rgba(247,119,55,0.2)", borderRadius: 6, paddingHorizontal: 8, paddingVertical: 3, alignSelf: "flex-start", marginBottom: 6 },
  headerBadgeText: { fontSize: 10, fontFamily: "Inter_700Bold", color: "#F77737", letterSpacing: 0.5 },
  headerTitle: { fontSize: 22, fontFamily: "Inter_700Bold", color: "#fff" },
  headerSub: { fontSize: 12, fontFamily: "Inter_400Regular", color: "rgba(255,255,255,0.75)", marginTop: 4, lineHeight: 16 },
  closeBtn: { padding: 4 },
  statsStrip: { flexDirection: "row", alignItems: "center", backgroundColor: "rgba(255,255,255,0.1)", borderRadius: 12, padding: 10 },
  statItem: { flex: 1, alignItems: "center" },
  statVal: { fontSize: 14, fontFamily: "Inter_700Bold", color: "#fff" },
  statLabel: { fontSize: 9, fontFamily: "Inter_400Regular", color: "rgba(255,255,255,0.65)", marginTop: 2 },
  statDivider: { width: 1, height: 28, backgroundColor: "rgba(255,255,255,0.25)" },

  body: { padding: 16, gap: 0, paddingBottom: 50 },
  divider: { height: 1, marginVertical: 16 },

  stepCard: { gap: 14, paddingTop: 8 },
  stepNumRow: { flexDirection: "row", alignItems: "center", gap: 10 },
  stepNum: { width: 30, height: 30, borderRadius: 15, alignItems: "center", justifyContent: "center" },
  stepNumText: { fontSize: 14, fontFamily: "Inter_700Bold", color: "#fff" },
  stepTitle: { fontSize: 18, fontFamily: "Inter_600SemiBold" },
  stepHint: { fontSize: 13, fontFamily: "Inter_400Regular", lineHeight: 18 },
  input: { height: 52, borderWidth: 1.5, borderRadius: 12, paddingHorizontal: 16, fontSize: 18, fontFamily: "Inter_600SemiBold", letterSpacing: 2 },
  routingCount: { fontSize: 12, fontFamily: "Inter_400Regular", textAlign: "right" },
  errText: { fontSize: 12, fontFamily: "Inter_400Regular", color: "#F44336" },
  btn: { flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 8, paddingVertical: 14, borderRadius: 14 },
  btnText: { fontSize: 15, fontFamily: "Inter_600SemiBold", color: "#fff" },
  backBtn: { alignItems: "center", paddingVertical: 8 },
  backText: { fontSize: 13, fontFamily: "Inter_400Regular" },
  legalText: { fontSize: 11, fontFamily: "Inter_400Regular", lineHeight: 16, textAlign: "center" },

  reviewBox: { borderRadius: 14, borderWidth: 1, padding: 14, gap: 10 },
  boxTitle: { fontSize: 10, fontFamily: "Inter_600SemiBold", textTransform: "uppercase", letterSpacing: 0.5 },
  reviewRow: { flexDirection: "row", alignItems: "center", gap: 8 },
  reviewVal: { fontSize: 16, fontFamily: "Inter_600SemiBold", flex: 1 },
  reviewSub: { fontSize: 12, fontFamily: "Inter_400Regular" },

  feeRow: { flexDirection: "row", justifyContent: "space-between", alignItems: "center" },
  feeLabel: { fontSize: 13, fontFamily: "Inter_400Regular" },
  feeVal: { fontSize: 13, fontFamily: "Inter_600SemiBold" },
  feeDivider: { height: 1, marginVertical: 6 },
  feeTotalLabel: { fontSize: 15, fontFamily: "Inter_600SemiBold" },
  feeTotalVal: { fontSize: 18, fontFamily: "Inter_700Bold" },
  achBox: { flexDirection: "row", alignItems: "flex-start", gap: 10, borderRadius: 10, padding: 10, marginTop: 6 },
  achLabel: { fontSize: 13, fontFamily: "Inter_600SemiBold" },
  achDate: { fontSize: 11, fontFamily: "Inter_400Regular", marginTop: 2 },

  successCard: { alignItems: "center", gap: 16, paddingTop: 16 },
  successIcon: { width: 80, height: 80, borderRadius: 40, alignItems: "center", justifyContent: "center" },
  successTitle: { fontSize: 26, fontFamily: "Inter_700Bold", textAlign: "center" },
  successSub: { fontSize: 14, fontFamily: "Inter_400Regular", textAlign: "center" },

  statusTracker: { borderRadius: 14, borderWidth: 1, padding: 14, gap: 12, width: "100%" },
  statusRow: { flexDirection: "row", alignItems: "flex-start", gap: 10 },
  statusDot: { width: 22, height: 22, borderRadius: 11, alignItems: "center", justifyContent: "center", marginTop: 1 },
  statusDotInner: { width: 8, height: 8, borderRadius: 4, backgroundColor: "#fff" },
  statusLabel: { fontSize: 13, fontFamily: "Inter_600SemiBold" },
  statusVal: { fontSize: 12, fontFamily: "Inter_400Regular", marginTop: 2 },
});
