import { Feather } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import React, { useCallback, useMemo, useState } from "react";
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

// ─── Business-day helpers ─────────────────────────────────────────────────────
function isWeekend(d: Date) { return d.getDay() === 0 || d.getDay() === 6; }

function nextBizDay(from: Date = new Date()): Date {
  const d = new Date(from);
  do { d.setDate(d.getDate() + 1); } while (isWeekend(d));
  return d;
}

function addBizDays(from: Date, n: number): Date {
  const d = new Date(from);
  let added = 0;
  while (added < n) { d.setDate(d.getDate() + 1); if (!isWeekend(d)) added++; }
  return d;
}

function fmtDate(d: Date): string {
  return d.toLocaleDateString("en-US", { weekday: "short", month: "short", day: "numeric" });
}

// ─── ROIC/APY calculator (shared) ────────────────────────────────────────────
export function calcAutopay(bonusAmount: number) {
  const ddAmount = Math.ceil(bonusAmount / 3);
  const chargeAmount = Math.ceil(ddAmount * 1.03);
  const achAmount = ddAmount + 1;
  const serviceFee = chargeAmount - ddAmount;
  // APY: (bonus / ddAmount) × (365 / 15 days) — 15 business-day cycle window
  const apy1x = Math.round((bonusAmount / ddAmount) * (365 / 15));
  // 3x/month: same capital but 3× DDs each 5-day window → 3× faster
  const apy3x = Math.round((bonusAmount / ddAmount) * (365 / 5));
  return { ddAmount, chargeAmount, achAmount, serviceFee, apy1x, apy3x };
}

interface AutopayModalProps {
  visible: boolean;
  onClose: () => void;
  bankName: string;
  bonusAmount: number;
  offerLink?: string;
  bonusGuid?: string;
  section?: string;
}

type Step = "account" | "confirm_account" | "routing" | "review" | "success";

export default function AutopayModal({
  visible, onClose, bankName, bonusAmount, offerLink, bonusGuid, section,
}: AutopayModalProps) {
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
  const [scheduleId, setScheduleId] = useState<number | null>(null);

  const { ddAmount, chargeAmount, achAmount, serviceFee, apy1x, apy3x } = useMemo(
    () => calcAutopay(bonusAmount),
    [bonusAmount]
  );

  const ddOutDate = useMemo(() => nextBizDay(), []);
  const ddInDate = useMemo(() => addBizDays(ddOutDate, 5), [ddOutDate]);
  const refundDate = useMemo(() => addBizDays(ddInDate, 3), [ddInDate]);

  const resetModal = useCallback(() => {
    setStep("account");
    setAccountNumber("");
    setAccountConfirm("");
    setRoutingNumber("");
    setMismatch(false);
    setError(null);
    setScheduleId(null);
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

  const handleSubmit = async () => {
    if (routingNumber.length !== 9) return setError("Routing number must be 9 digits");
    setError(null);
    setStep("review");
  };

  const handleConfirm = async () => {
    setLoading(true);
    setError(null);
    try {
      const domain = process.env.EXPO_PUBLIC_DOMAIN;
      const apiUrl = domain ? `https://${domain}/api/autopay/create` : "http://localhost:8080/api/autopay/create";
      const res = await fetch(apiUrl, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          userId: user?.id ?? "demo-user",
          bonusGuid,
          bankName,
          bonusAmount,
          offerLink,
          section,
          accountNumber,
          routingNumber,
          stripePaymentMethodId: "demo",
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Failed to create schedule");
      setScheduleId(data.schedule?.id ?? null);
      setStep("success");
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const maskedAccount = accountNumber
    ? "****" + accountNumber.slice(-4)
    : "••••••••";

  return (
    <Modal visible={visible} animationType="slide" presentationStyle="pageSheet" onRequestClose={handleClose}>
      <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === "ios" ? "padding" : undefined}>
        <View style={[s.container, { backgroundColor: c.background }]}>

          {/* Header */}
          <LinearGradient colors={["#833AB4", "#E1306C", "#F77737"]} start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }} style={s.header}>
            <View style={s.headerRow}>
              <View>
                <Text style={s.headerTitle}>Autopay Setup</Text>
                <Text style={s.headerSub}>{bankName} · ${bonusAmount.toLocaleString()} bonus</Text>
              </View>
              <Pressable onPress={handleClose} style={s.closeBtn}>
                <Feather name="x" size={22} color="#fff" />
              </Pressable>
            </View>

            {/* APY preview strip */}
            <View style={s.apyStrip}>
              <View style={s.apyStat}>
                <Text style={s.apyVal}>{apy1x.toLocaleString()}%</Text>
                <Text style={s.apyLabel}>1× APY</Text>
              </View>
              <View style={s.apyDivider} />
              <View style={s.apyStat}>
                <Text style={s.apyVal}>{apy3x.toLocaleString()}%</Text>
                <Text style={s.apyLabel}>3× APY</Text>
              </View>
              <View style={s.apyDivider} />
              <View style={s.apyStat}>
                <Text style={s.apyVal}>${ddAmount}</Text>
                <Text style={s.apyLabel}>DD/cycle</Text>
              </View>
              <View style={s.apyDivider} />
              <View style={s.apyStat}>
                <Text style={s.apyVal}>${chargeAmount}</Text>
                <Text style={s.apyLabel}>+3% fee</Text>
              </View>
            </View>
          </LinearGradient>

          <ScrollView contentContainerStyle={s.body} keyboardShouldPersistTaps="handled">

            {/* ── STEP: Account Number ── */}
            {step === "account" && (
              <View style={s.stepCard}>
                <View style={s.stepNumRow}>
                  <View style={[s.stepNum, { backgroundColor: "#833AB4" }]}><Text style={s.stepNumText}>1</Text></View>
                  <Text style={[s.stepTitle, { color: c.text }]}>Enter Account Number</Text>
                </View>
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
                  style={[s.btn, { backgroundColor: "#833AB4" }]}
                  onPress={() => { if (accountNumber.length >= 4) { setError(null); setStep("confirm_account"); } else setError("Enter a valid account number"); }}
                >
                  <Text style={s.btnText}>Continue</Text>
                  <Feather name="arrow-right" size={16} color="#fff" />
                </Pressable>
              </View>
            )}

            {/* ── STEP: Confirm Account Number ── */}
            {step === "confirm_account" && (
              <View style={s.stepCard}>
                <View style={s.stepNumRow}>
                  <View style={[s.stepNum, { backgroundColor: "#E1306C" }]}><Text style={s.stepNumText}>2</Text></View>
                  <Text style={[s.stepTitle, { color: c.text }]}>Re-enter Account Number</Text>
                </View>
                <Text style={[s.stepHint, { color: c.textSecondary }]}>Enter your account number again to confirm it's correct.</Text>
                <TextInput
                  style={[s.input, { backgroundColor: c.backgroundSecondary, borderColor: mismatch ? "#F44336" : c.cardBorder, color: c.text }]}
                  placeholder="Confirm account number"
                  placeholderTextColor={c.textTertiary}
                  keyboardType="numeric"
                  secureTextEntry
                  value={accountConfirm}
                  onChangeText={t => { setAccountConfirm(t.replace(/\D/g, "")); setMismatch(false); setError(null); }}
                  maxLength={17}
                />
                {error && <Text style={s.errText}>{error}</Text>}
                <Pressable style={[s.btn, { backgroundColor: "#E1306C" }]} onPress={handleConfirmAccount}>
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
                  <View style={[s.stepNum, { backgroundColor: "#F77737" }]}><Text style={s.stepNumText}>3</Text></View>
                  <Text style={[s.stepTitle, { color: c.text }]}>Enter Routing Number</Text>
                </View>
                <Text style={[s.stepHint, { color: c.textSecondary }]}>Your 9-digit ABA routing number (found on the bottom-left of a check).</Text>
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
                <Pressable style={[s.btn, { backgroundColor: "#F77737" }]} onPress={handleSubmit}>
                  <Text style={s.btnText}>Preview Schedule</Text>
                  <Feather name="calendar" size={16} color="#fff" />
                </Pressable>
                <Pressable style={s.backBtn} onPress={() => setStep("confirm_account")}>
                  <Text style={[s.backText, { color: c.textSecondary }]}>← Back</Text>
                </Pressable>
              </View>
            )}

            {/* ── STEP: Review Schedule ── */}
            {step === "review" && (
              <View style={{ gap: 14 }}>
                {/* Account summary */}
                <View style={[s.reviewBox, { backgroundColor: c.card, borderColor: c.cardBorder }]}>
                  <Text style={[s.reviewBoxTitle, { color: c.textSecondary }]}>ACCOUNT ON FILE</Text>
                  <View style={s.reviewRow}>
                    <Feather name="credit-card" size={14} color="#833AB4" />
                    <Text style={[s.reviewLabel, { color: c.text }]}>{maskedAccount}</Text>
                    <Text style={[s.reviewSub, { color: c.textSecondary }]}>Routing: {routingNumber}</Text>
                  </View>
                  <Text style={[s.reviewDate, { color: c.textTertiary }]}>Added {new Date().toLocaleDateString()}</Text>
                </View>

                {/* DD Schedule */}
                <View style={[s.scheduleBox, { backgroundColor: c.card, borderColor: c.cardBorder }]}>
                  <Text style={[s.reviewBoxTitle, { color: c.textSecondary }]}>DD SCHEDULE</Text>

                  {/* DD Out row */}
                  <View style={s.scheduleRow}>
                    <View style={s.scheduleLeft}>
                      <View style={[s.scheduleDot, { backgroundColor: "#F77737" }]} />
                      <View>
                        <Text style={[s.scheduleEvent, { color: c.text }]}>DD Out (ACH push)</Text>
                        <Text style={[s.scheduleDay, { color: c.textSecondary }]}>{fmtDate(ddOutDate)} · next business day</Text>
                      </View>
                    </View>
                    <View style={[s.amountBox, { backgroundColor: "#F7773720" }]}>
                      <Text style={[s.amountBoxVal, { color: "#F77737" }]}>${achAmount}</Text>
                    </View>
                  </View>

                  <View style={[s.scheduleLine, { backgroundColor: c.separator }]} />

                  {/* DD In row */}
                  <View style={s.scheduleRow}>
                    <View style={s.scheduleLeft}>
                      <View style={[s.scheduleDot, { backgroundColor: "#4CAF50" }]} />
                      <View>
                        <Text style={[s.scheduleEvent, { color: c.text }]}>DD In (ACH pull-back)</Text>
                        <Text style={[s.scheduleDay, { color: c.textSecondary }]}>{fmtDate(ddInDate)} · 5 business days later</Text>
                      </View>
                    </View>
                    <View style={[s.amountBox, { backgroundColor: "#4CAF5020" }]}>
                      <Text style={[s.amountBoxVal, { color: "#4CAF50" }]}>${achAmount}</Text>
                    </View>
                  </View>

                  <View style={[s.scheduleLine, { backgroundColor: c.separator }]} />

                  {/* Refund row */}
                  <View style={s.scheduleRow}>
                    <View style={s.scheduleLeft}>
                      <View style={[s.scheduleDot, { backgroundColor: "#833AB4" }]} />
                      <View>
                        <Text style={[s.scheduleEvent, { color: c.text }]}>CC Refund</Text>
                        <Text style={[s.scheduleDay, { color: c.textSecondary }]}>{fmtDate(refundDate)} · 3 days after pull</Text>
                      </View>
                    </View>
                    <View style={[s.amountBox, { backgroundColor: "#833AB420" }]}>
                      <Text style={[s.amountBoxVal, { color: "#833AB4" }]}>${chargeAmount}</Text>
                    </View>
                  </View>
                </View>

                {/* Charge breakdown */}
                <View style={[s.chargeBox, { backgroundColor: c.card, borderColor: c.cardBorder }]}>
                  <Text style={[s.reviewBoxTitle, { color: c.textSecondary }]}>CHARGE BREAKDOWN</Text>
                  <View style={s.chargeRow}>
                    <Text style={[s.chargeLabel, { color: c.text }]}>DD Amount (bonus ÷ 3)</Text>
                    <Text style={[s.chargeVal, { color: c.text }]}>${ddAmount}</Text>
                  </View>
                  <View style={s.chargeRow}>
                    <Text style={[s.chargeLabel, { color: c.textSecondary }]}>Service fee (3%)</Text>
                    <Text style={[s.chargeVal, { color: c.textSecondary }]}>${serviceFee}</Text>
                  </View>
                  <View style={[s.chargeDivider, { backgroundColor: c.separator }]} />
                  <View style={s.chargeRow}>
                    <Text style={[s.chargeTotalLabel, { color: c.text }]}>CC charge today</Text>
                    <Text style={[s.chargeTotalVal, { color: "#E1306C" }]}>${chargeAmount}</Text>
                  </View>
                  <View style={s.chargeRow}>
                    <Text style={[s.chargeLabel, { color: c.textSecondary }]}>ACH sent to account</Text>
                    <Text style={[s.chargeVal, { color: "#4CAF50" }]}>${achAmount} (DD + $1)</Text>
                  </View>
                  <View style={s.chargeRow}>
                    <Text style={[s.chargeLabel, { color: "#833AB4" }]}>Full CC refund on {fmtDate(refundDate)}</Text>
                    <Text style={[s.chargeVal, { color: "#833AB4" }]}>-${chargeAmount}</Text>
                  </View>
                  <View style={[s.netBox, { backgroundColor: "#4CAF5015" }]}>
                    <Text style={[s.netLabel, { color: c.text }]}>Your expected bank bonus</Text>
                    <Text style={[s.netVal, { color: "#4CAF50" }]}>${bonusAmount}</Text>
                  </View>
                </View>

                {error && <Text style={s.errText}>{error}</Text>}

                <Pressable
                  style={[s.btn, { backgroundColor: loading ? "#ccc" : "#833AB4", opacity: loading ? 0.7 : 1 }]}
                  onPress={handleConfirm}
                  disabled={loading}
                >
                  {loading ? (
                    <ActivityIndicator color="#fff" size="small" />
                  ) : (
                    <>
                      <Feather name="zap" size={16} color="#fff" />
                      <Text style={s.btnText}>Confirm & Charge ${chargeAmount}</Text>
                    </>
                  )}
                </Pressable>

                <Text style={[s.disclaimer, { color: c.textTertiary }]}>
                  Your CC will be charged ${chargeAmount} today and fully refunded on {fmtDate(refundDate)} after the DD cycle completes. You keep the bank bonus.
                </Text>

                <Pressable style={s.backBtn} onPress={() => setStep("routing")}>
                  <Text style={[s.backText, { color: c.textSecondary }]}>← Edit</Text>
                </Pressable>
              </View>
            )}

            {/* ── STEP: Success ── */}
            {step === "success" && (
              <View style={s.successCard}>
                <LinearGradient colors={["#833AB4", "#E1306C", "#F77737"]} style={s.successIcon}>
                  <Feather name="check" size={32} color="#fff" />
                </LinearGradient>
                <Text style={[s.successTitle, { color: c.text }]}>Autopay Scheduled!</Text>
                <Text style={[s.successSub, { color: c.textSecondary }]}>
                  Schedule #{scheduleId} created for {bankName}.
                </Text>

                <View style={[s.successSchedule, { backgroundColor: c.card, borderColor: c.cardBorder }]}>
                  <View style={s.successRow}>
                    <Text style={[s.successLabel, { color: c.textSecondary }]}>Account</Text>
                    <Text style={[s.successVal, { color: c.text }]}>{maskedAccount}</Text>
                  </View>
                  <View style={s.successRow}>
                    <Text style={[s.successLabel, { color: c.textSecondary }]}>CC charged</Text>
                    <Text style={[s.successVal, { color: "#E1306C" }]}>${chargeAmount}</Text>
                  </View>
                  <View style={s.successRow}>
                    <Text style={[s.successLabel, { color: c.textSecondary }]}>DD out</Text>
                    <Text style={[s.successVal, { color: "#F77737" }]}>{fmtDate(ddOutDate)} · ${achAmount}</Text>
                  </View>
                  <View style={s.successRow}>
                    <Text style={[s.successLabel, { color: c.textSecondary }]}>DD in</Text>
                    <Text style={[s.successVal, { color: "#4CAF50" }]}>{fmtDate(ddInDate)} · ${achAmount}</Text>
                  </View>
                  <View style={s.successRow}>
                    <Text style={[s.successLabel, { color: c.textSecondary }]}>CC refund</Text>
                    <Text style={[s.successVal, { color: "#833AB4" }]}>{fmtDate(refundDate)} · ${chargeAmount}</Text>
                  </View>
                </View>

                <Pressable style={[s.btn, { backgroundColor: "#833AB4", marginTop: 8 }]} onPress={handleClose}>
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
  headerTitle: { fontSize: 22, fontFamily: "Inter_700Bold", color: "#fff" },
  headerSub: { fontSize: 13, fontFamily: "Inter_400Regular", color: "rgba(255,255,255,0.8)", marginTop: 2 },
  closeBtn: { padding: 4 },
  apyStrip: { flexDirection: "row", alignItems: "center", backgroundColor: "rgba(255,255,255,0.15)", borderRadius: 12, padding: 10, gap: 2 },
  apyStat: { flex: 1, alignItems: "center" },
  apyVal: { fontSize: 15, fontFamily: "Inter_700Bold", color: "#fff" },
  apyLabel: { fontSize: 9, fontFamily: "Inter_400Regular", color: "rgba(255,255,255,0.75)", marginTop: 2 },
  apyDivider: { width: 1, height: 28, backgroundColor: "rgba(255,255,255,0.3)" },
  body: { padding: 16, gap: 0, paddingBottom: 40 },
  stepCard: { gap: 14, paddingTop: 8 },
  stepNumRow: { flexDirection: "row", alignItems: "center", gap: 10 },
  stepNum: { width: 28, height: 28, borderRadius: 14, alignItems: "center", justifyContent: "center" },
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
  reviewBox: { borderRadius: 14, borderWidth: 1, padding: 14, gap: 8 },
  reviewBoxTitle: { fontSize: 10, fontFamily: "Inter_600SemiBold", textTransform: "uppercase", letterSpacing: 0.5, marginBottom: 4 },
  reviewRow: { flexDirection: "row", alignItems: "center", gap: 8 },
  reviewLabel: { fontSize: 15, fontFamily: "Inter_600SemiBold", flex: 1 },
  reviewSub: { fontSize: 12, fontFamily: "Inter_400Regular" },
  reviewDate: { fontSize: 11, fontFamily: "Inter_400Regular" },
  scheduleBox: { borderRadius: 14, borderWidth: 1, padding: 14, gap: 10 },
  scheduleRow: { flexDirection: "row", alignItems: "center", justifyContent: "space-between" },
  scheduleLeft: { flexDirection: "row", alignItems: "center", gap: 10, flex: 1 },
  scheduleDot: { width: 10, height: 10, borderRadius: 5 },
  scheduleEvent: { fontSize: 13, fontFamily: "Inter_600SemiBold" },
  scheduleDay: { fontSize: 11, fontFamily: "Inter_400Regular", marginTop: 2 },
  scheduleLine: { height: 1, marginLeft: 20 },
  amountBox: { paddingHorizontal: 10, paddingVertical: 6, borderRadius: 10, minWidth: 60, alignItems: "center" },
  amountBoxVal: { fontSize: 14, fontFamily: "Inter_700Bold" },
  chargeBox: { borderRadius: 14, borderWidth: 1, padding: 14, gap: 8 },
  chargeRow: { flexDirection: "row", justifyContent: "space-between", alignItems: "center" },
  chargeLabel: { fontSize: 13, fontFamily: "Inter_400Regular", flex: 1 },
  chargeVal: { fontSize: 13, fontFamily: "Inter_600SemiBold" },
  chargeDivider: { height: 1 },
  chargeTotalLabel: { fontSize: 14, fontFamily: "Inter_600SemiBold", flex: 1 },
  chargeTotalVal: { fontSize: 16, fontFamily: "Inter_700Bold" },
  netBox: { borderRadius: 10, padding: 10, flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginTop: 4 },
  netLabel: { fontSize: 13, fontFamily: "Inter_600SemiBold" },
  netVal: { fontSize: 18, fontFamily: "Inter_700Bold" },
  disclaimer: { fontSize: 11, fontFamily: "Inter_400Regular", textAlign: "center", lineHeight: 16 },
  successCard: { alignItems: "center", gap: 14, paddingTop: 20 },
  successIcon: { width: 72, height: 72, borderRadius: 36, alignItems: "center", justifyContent: "center" },
  successTitle: { fontSize: 24, fontFamily: "Inter_700Bold" },
  successSub: { fontSize: 14, fontFamily: "Inter_400Regular", textAlign: "center" },
  successSchedule: { width: "100%", borderRadius: 14, borderWidth: 1, padding: 14, gap: 10 },
  successRow: { flexDirection: "row", justifyContent: "space-between" },
  successLabel: { fontSize: 12, fontFamily: "Inter_400Regular" },
  successVal: { fontSize: 13, fontFamily: "Inter_600SemiBold" },
});
