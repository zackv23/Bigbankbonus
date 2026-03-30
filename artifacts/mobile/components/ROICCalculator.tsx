import { Feather } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import React, { useMemo, useState } from "react";
import {
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
import { useSafeAreaInsets } from "react-native-safe-area-context";
import Colors from "@/constants/colors";

function calcROIC(bonusAmount: number, cycles: number, capitalDays: number) {
  const ddAmount = Math.ceil(bonusAmount / 3);
  const chargeAmount = Math.ceil(ddAmount * 1.03);
  const achAmount = ddAmount + 1;
  const serviceFee = chargeAmount - ddAmount;
  const cycleDays = 15;
  const netPerCycle = bonusAmount - serviceFee;
  const apy1x = Math.round((bonusAmount / ddAmount) * (365 / cycleDays));
  const apy3x = Math.round((bonusAmount / ddAmount) * (365 / 5));
  const totalBonus = bonusAmount * cycles;
  const totalFees = serviceFee * cycles;
  const netProfit = totalBonus - totalFees;
  const roi = ddAmount > 0 ? ((netProfit / chargeAmount) * 100).toFixed(1) : "0.0";
  const annualizedROI = ddAmount > 0 && capitalDays > 0
    ? ((netProfit / chargeAmount) * (365 / capitalDays) * 100).toFixed(1)
    : apy1x.toString();
  return { ddAmount, chargeAmount, achAmount, serviceFee, apy1x, apy3x, netPerCycle, totalBonus, totalFees, netProfit, roi, annualizedROI };
}

interface ROICCalculatorProps {
  visible: boolean;
  onClose: () => void;
  initialBonus?: number;
  bankName?: string;
}

export default function ROICCalculator({ visible, onClose, initialBonus = 0, bankName }: ROICCalculatorProps) {
  const colorScheme = useColorScheme();
  const isDark = colorScheme === "dark";
  const c = isDark ? Colors.dark : Colors.light;
  const insets = useSafeAreaInsets();

  const [bonusInput, setBonusInput] = useState(initialBonus > 0 ? String(initialBonus) : "");
  const [cyclesInput, setCyclesInput] = useState("1");
  const [capitalInput, setCapitalInput] = useState("15");
  const [activeTab, setActiveTab] = useState<"simple" | "multi">("simple");

  const bonus = parseFloat(bonusInput) || 0;
  const cycles = Math.max(1, parseInt(cyclesInput) || 1);
  const capitalDays = Math.max(1, parseInt(capitalInput) || 15);

  const result = useMemo(() => bonus > 0 ? calcROIC(bonus, cycles, capitalDays) : null, [bonus, cycles, capitalDays]);

  const PRESETS = [100, 200, 300, 500, 750, 1000];

  return (
    <Modal visible={visible} animationType="slide" presentationStyle="pageSheet" onRequestClose={onClose}>
      <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === "ios" ? "padding" : undefined}>
        <View style={[s.container, { backgroundColor: c.background }]}>
          <LinearGradient colors={["#833AB4", "#E1306C", "#F77737"]} start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }} style={s.header}>
            <View style={s.headerRow}>
              <View>
                <Text style={s.headerTitle}>ROIC Calculator</Text>
                <Text style={s.headerSub}>{bankName ? bankName + " · " : ""}Bank Bonus Return Analysis</Text>
              </View>
              <Pressable onPress={onClose} style={s.closeBtn} hitSlop={8}>
                <Feather name="x" size={22} color="#fff" />
              </Pressable>
            </View>
          </LinearGradient>

          <ScrollView contentContainerStyle={{ padding: 16, gap: 16, paddingBottom: insets.bottom + 40 }} keyboardShouldPersistTaps="handled">
            {/* Tabs */}
            <View style={[s.tabBar, { backgroundColor: c.backgroundSecondary }]}>
              {(["simple", "multi"] as const).map(tab => (
                <Pressable
                  key={tab}
                  style={[s.tab, activeTab === tab && s.tabActive]}
                  onPress={() => setActiveTab(tab)}
                >
                  {activeTab === tab ? (
                    <LinearGradient colors={["#833AB4", "#E1306C"]} start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }} style={StyleSheet.absoluteFill} />
                  ) : null}
                  <Text style={[s.tabText, { color: activeTab === tab ? "#fff" : c.textSecondary }]}>
                    {tab === "simple" ? "Single Bonus" : "Multi-Cycle"}
                  </Text>
                </Pressable>
              ))}
            </View>

            {/* Bonus Input */}
            <View style={[s.card, { backgroundColor: c.card, borderColor: c.cardBorder }]}>
              <Text style={[s.label, { color: c.textSecondary }]}>Bank Bonus Amount</Text>
              <View style={[s.inputRow, { backgroundColor: c.backgroundSecondary, borderColor: bonus > 0 ? "#833AB4" : c.cardBorder }]}>
                <Text style={[s.inputPrefix, { color: "#833AB4" }]}>$</Text>
                <TextInput
                  style={[s.input, { color: c.text }]}
                  placeholder="0"
                  placeholderTextColor={c.textTertiary}
                  keyboardType="numeric"
                  value={bonusInput}
                  onChangeText={t => setBonusInput(t.replace(/[^0-9.]/g, ""))}
                />
              </View>
              <Text style={[s.hint, { color: c.textTertiary }]}>Enter the bank's advertised bonus amount</Text>

              {/* Presets */}
              <View style={s.presets}>
                {PRESETS.map(p => (
                  <Pressable
                    key={p}
                    style={[s.preset, { backgroundColor: parseFloat(bonusInput) === p ? "#833AB420" : c.backgroundSecondary, borderColor: parseFloat(bonusInput) === p ? "#833AB4" : c.cardBorder }]}
                    onPress={() => setBonusInput(String(p))}
                  >
                    <Text style={[s.presetText, { color: parseFloat(bonusInput) === p ? "#833AB4" : c.textSecondary }]}>${p}</Text>
                  </Pressable>
                ))}
              </View>
            </View>

            {/* Multi-cycle inputs */}
            {activeTab === "multi" && (
              <View style={[s.card, { backgroundColor: c.card, borderColor: c.cardBorder }]}>
                <Text style={[s.label, { color: c.textSecondary }]}>Number of Bonus Cycles</Text>
                <View style={s.cycleRow}>
                  <Pressable style={[s.cycleBtn, { backgroundColor: c.backgroundSecondary }]} onPress={() => setCyclesInput(String(Math.max(1, cycles - 1)))}>
                    <Feather name="minus" size={16} color={c.text} />
                  </Pressable>
                  <TextInput
                    style={[s.cycleInput, { color: c.text, borderColor: c.cardBorder }]}
                    keyboardType="numeric"
                    value={cyclesInput}
                    onChangeText={setCyclesInput}
                  />
                  <Pressable style={[s.cycleBtn, { backgroundColor: c.backgroundSecondary }]} onPress={() => setCyclesInput(String(cycles + 1))}>
                    <Feather name="plus" size={16} color={c.text} />
                  </Pressable>
                </View>

                <Text style={[s.label, { color: c.textSecondary, marginTop: 12 }]}>Capital Deployment Days</Text>
                <View style={s.cycleRow}>
                  {[15, 30, 60, 90].map(d => (
                    <Pressable
                      key={d}
                      style={[s.dayChip, { backgroundColor: capitalDays === d ? "#E1306C20" : c.backgroundSecondary, borderColor: capitalDays === d ? "#E1306C" : c.cardBorder }]}
                      onPress={() => setCapitalInput(String(d))}
                    >
                      <Text style={[s.dayChipText, { color: capitalDays === d ? "#E1306C" : c.textSecondary }]}>{d}d</Text>
                    </Pressable>
                  ))}
                </View>
              </View>
            )}

            {/* Results */}
            {result && (
              <>
                {/* APY Hero */}
                <View style={[s.apyCard, { overflow: "hidden" }]}>
                  <LinearGradient colors={["#833AB4", "#E1306C", "#F77737"]} start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }} style={StyleSheet.absoluteFill} />
                  <Text style={s.apyLabel}>Annualized APY</Text>
                  <View style={s.apyRow}>
                    <View style={s.apyStat}>
                      <Text style={s.apyValue}>{result.apy1x.toLocaleString()}%</Text>
                      <Text style={s.apyStatLabel}>1× per month</Text>
                    </View>
                    <View style={s.apyDivider} />
                    <View style={s.apyStat}>
                      <Text style={s.apyValue}>{result.apy3x.toLocaleString()}%</Text>
                      <Text style={s.apyStatLabel}>3× per month</Text>
                    </View>
                  </View>
                  <Text style={s.apyNote}>Based on 15-day / 5-day cycles respectively</Text>
                </View>

                {/* Autopay Breakdown */}
                <View style={[s.card, { backgroundColor: c.card, borderColor: c.cardBorder }]}>
                  <Text style={[s.cardTitle, { color: c.text }]}>Autopay Breakdown</Text>
                  <View style={s.breakdownGrid}>
                    <View style={[s.breakdownItem, { backgroundColor: "#833AB415" }]}>
                      <Text style={[s.breakdownVal, { color: "#833AB4" }]}>${result.ddAmount}</Text>
                      <Text style={[s.breakdownLabel, { color: c.textSecondary }]}>DD Required</Text>
                      <Text style={[s.breakdownNote, { color: c.textTertiary }]}>bonus ÷ 3</Text>
                    </View>
                    <View style={[s.breakdownItem, { backgroundColor: "#E1306C15" }]}>
                      <Text style={[s.breakdownVal, { color: "#E1306C" }]}>${result.chargeAmount}</Text>
                      <Text style={[s.breakdownLabel, { color: c.textSecondary }]}>CC Charge</Text>
                      <Text style={[s.breakdownNote, { color: c.textTertiary }]}>DD + 3% fee</Text>
                    </View>
                    <View style={[s.breakdownItem, { backgroundColor: "#F7773715" }]}>
                      <Text style={[s.breakdownVal, { color: "#F77737" }]}>${result.achAmount}</Text>
                      <Text style={[s.breakdownLabel, { color: c.textSecondary }]}>ACH Push</Text>
                      <Text style={[s.breakdownNote, { color: c.textTertiary }]}>DD + $1</Text>
                    </View>
                    <View style={[s.breakdownItem, { backgroundColor: "#4CAF5015" }]}>
                      <Text style={[s.breakdownVal, { color: "#4CAF50" }]}>${result.netPerCycle}</Text>
                      <Text style={[s.breakdownLabel, { color: c.textSecondary }]}>Net/Cycle</Text>
                      <Text style={[s.breakdownNote, { color: c.textTertiary }]}>after fee</Text>
                    </View>
                  </View>
                </View>

                {/* Multi-cycle summary */}
                {activeTab === "multi" && cycles > 1 && (
                  <View style={[s.card, { backgroundColor: c.card, borderColor: c.cardBorder }]}>
                    <Text style={[s.cardTitle, { color: c.text }]}>{cycles}-Cycle Summary</Text>
                    <View style={s.summaryRows}>
                      {[
                        { label: "Total Bonuses", value: `$${result.totalBonus.toLocaleString()}`, color: "#4CAF50" },
                        { label: "Total Service Fees", value: `-$${result.totalFees.toLocaleString()}`, color: "#F44336" },
                        { label: "Net Profit", value: `$${result.netProfit.toLocaleString()}`, color: "#833AB4" },
                        { label: `ROI on $${result.chargeAmount} Capital`, value: `${result.roi}%`, color: "#E1306C" },
                        { label: `Annualized (${capitalDays}d)`, value: `${result.annualizedROI}%`, color: "#F77737" },
                      ].map(row => (
                        <View key={row.label} style={[s.summaryRow, { borderBottomColor: c.separator }]}>
                          <Text style={[s.summaryLabel, { color: c.textSecondary }]}>{row.label}</Text>
                          <Text style={[s.summaryValue, { color: row.color }]}>{row.value}</Text>
                        </View>
                      ))}
                    </View>
                  </View>
                )}

                {/* Timeline */}
                <View style={[s.card, { backgroundColor: c.card, borderColor: c.cardBorder }]}>
                  <Text style={[s.cardTitle, { color: c.text }]}>Autopay Timeline</Text>
                  {[
                    { day: 0, event: "CC charged + ACH push sent", amount: `$${result.chargeAmount} out`, color: "#F77737" },
                    { day: 1, event: "ACH credit arrives at bank", amount: `$${result.achAmount}`, color: "#2196F3" },
                    { day: 5, event: "DD requirement met", amount: "✓ Satisfied", color: "#4CAF50" },
                    { day: 8, event: "ACH pull-back sent", amount: `$${result.achAmount} back`, color: "#E1306C" },
                    { day: 10, event: "Full CC refund", amount: `$${result.chargeAmount} refunded`, color: "#833AB4" },
                    { day: "30-90", event: "Bank pays bonus", amount: `$${bonus} earned!`, color: "#FFB300" },
                  ].map((row, i) => (
                    <View key={i} style={s.timelineRow}>
                      <View style={[s.timelineDot, { backgroundColor: row.color }]} />
                      {i < 5 && <View style={[s.timelineLine, { backgroundColor: c.separator }]} />}
                      <View style={{ flex: 1 }}>
                        <Text style={[s.timelineDay, { color: c.textTertiary }]}>Day {row.day}</Text>
                        <Text style={[s.timelineEvent, { color: c.text }]}>{row.event}</Text>
                      </View>
                      <View style={[s.timelineAmt, { backgroundColor: row.color + "18" }]}>
                        <Text style={[s.timelineAmtText, { color: row.color }]}>{row.amount}</Text>
                      </View>
                    </View>
                  ))}
                </View>

                {/* Risk/reward */}
                <View style={[s.disclaimerBox, { backgroundColor: c.backgroundSecondary, borderColor: c.cardBorder }]}>
                  <Feather name="info" size={14} color={c.textTertiary} />
                  <Text style={[s.disclaimerText, { color: c.textTertiary }]}>
                    APY assumes capital is redeployed every cycle. Net profit excludes opportunity cost. Bank bonus timelines vary (30-90+ days). All bonuses are taxable income.
                  </Text>
                </View>
              </>
            )}

            {!result && (
              <View style={[s.emptyState, { backgroundColor: c.backgroundSecondary }]}>
                <Feather name="trending-up" size={32} color={c.textTertiary} />
                <Text style={[s.emptyText, { color: c.textTertiary }]}>Enter a bonus amount above to see your ROIC analysis</Text>
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
  header: { paddingTop: 20, paddingBottom: 18, paddingHorizontal: 20 },
  headerRow: { flexDirection: "row", justifyContent: "space-between", alignItems: "flex-start" },
  headerTitle: { fontSize: 22, fontFamily: "Inter_700Bold", color: "#fff" },
  headerSub: { fontSize: 13, fontFamily: "Inter_400Regular", color: "rgba(255,255,255,0.75)", marginTop: 3 },
  closeBtn: { padding: 4 },
  tabBar: { flexDirection: "row", borderRadius: 12, padding: 3, overflow: "hidden" },
  tab: { flex: 1, paddingVertical: 10, alignItems: "center", borderRadius: 10, overflow: "hidden" },
  tabActive: {},
  tabText: { fontSize: 14, fontFamily: "Inter_600SemiBold" },
  card: { borderRadius: 16, borderWidth: 1, padding: 16 },
  label: { fontSize: 12, fontFamily: "Inter_600SemiBold", textTransform: "uppercase", letterSpacing: 0.5, marginBottom: 8 },
  inputRow: { flexDirection: "row", alignItems: "center", borderWidth: 1.5, borderRadius: 12, paddingHorizontal: 14, paddingVertical: 12 },
  inputPrefix: { fontSize: 22, fontFamily: "Inter_700Bold", marginRight: 4 },
  input: { flex: 1, fontSize: 22, fontFamily: "Inter_700Bold" },
  hint: { fontSize: 11, fontFamily: "Inter_400Regular", marginTop: 6 },
  presets: { flexDirection: "row", flexWrap: "wrap", gap: 8, marginTop: 12 },
  preset: { paddingHorizontal: 14, paddingVertical: 7, borderRadius: 8, borderWidth: 1 },
  presetText: { fontSize: 13, fontFamily: "Inter_600SemiBold" },
  cycleRow: { flexDirection: "row", alignItems: "center", gap: 10 },
  cycleBtn: { width: 40, height: 40, borderRadius: 10, alignItems: "center", justifyContent: "center" },
  cycleInput: { flex: 1, borderWidth: 1, borderRadius: 10, textAlign: "center", paddingVertical: 10, fontSize: 18, fontFamily: "Inter_700Bold" },
  dayChip: { flex: 1, alignItems: "center", paddingVertical: 10, borderRadius: 10, borderWidth: 1 },
  dayChipText: { fontSize: 13, fontFamily: "Inter_600SemiBold" },
  apyCard: { borderRadius: 16, padding: 20, alignItems: "center" },
  apyLabel: { fontSize: 12, fontFamily: "Inter_600SemiBold", color: "rgba(255,255,255,0.7)", textTransform: "uppercase", letterSpacing: 1, marginBottom: 12 },
  apyRow: { flexDirection: "row", alignItems: "center", gap: 20, marginBottom: 8 },
  apyStat: { alignItems: "center" },
  apyValue: { fontSize: 38, fontFamily: "Inter_700Bold", color: "#fff" },
  apyStatLabel: { fontSize: 12, fontFamily: "Inter_400Regular", color: "rgba(255,255,255,0.75)", marginTop: 2 },
  apyDivider: { width: 1, height: 50, backgroundColor: "rgba(255,255,255,0.25)" },
  apyNote: { fontSize: 11, fontFamily: "Inter_400Regular", color: "rgba(255,255,255,0.6)", textAlign: "center" },
  cardTitle: { fontSize: 16, fontFamily: "Inter_700Bold", marginBottom: 14 },
  breakdownGrid: { flexDirection: "row", flexWrap: "wrap", gap: 8 },
  breakdownItem: { flex: 1, minWidth: "45%", borderRadius: 12, padding: 12, alignItems: "center" },
  breakdownVal: { fontSize: 20, fontFamily: "Inter_700Bold" },
  breakdownLabel: { fontSize: 11, fontFamily: "Inter_600SemiBold", marginTop: 2 },
  breakdownNote: { fontSize: 10, fontFamily: "Inter_400Regular", marginTop: 1 },
  summaryRows: { gap: 0 },
  summaryRow: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", paddingVertical: 10, borderBottomWidth: StyleSheet.hairlineWidth },
  summaryLabel: { fontSize: 14, fontFamily: "Inter_400Regular" },
  summaryValue: { fontSize: 16, fontFamily: "Inter_700Bold" },
  timelineRow: { flexDirection: "row", alignItems: "flex-start", gap: 12, marginBottom: 14 },
  timelineDot: { width: 10, height: 10, borderRadius: 5, marginTop: 5 },
  timelineLine: { position: "absolute", left: 4, top: 14, width: 2, height: 30 },
  timelineDay: { fontSize: 10, fontFamily: "Inter_400Regular" },
  timelineEvent: { fontSize: 13, fontFamily: "Inter_600SemiBold" },
  timelineAmt: { paddingHorizontal: 8, paddingVertical: 4, borderRadius: 6 },
  timelineAmtText: { fontSize: 11, fontFamily: "Inter_600SemiBold" },
  disclaimerBox: { flexDirection: "row", gap: 8, borderWidth: 1, borderRadius: 12, padding: 12 },
  disclaimerText: { flex: 1, fontSize: 11, fontFamily: "Inter_400Regular", lineHeight: 16 },
  emptyState: { padding: 40, borderRadius: 16, alignItems: "center", gap: 12 },
  emptyText: { fontSize: 14, fontFamily: "Inter_400Regular", textAlign: "center", lineHeight: 20 },
});
