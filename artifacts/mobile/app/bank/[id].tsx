import { Feather } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";
import * as WebBrowser from "expo-web-browser";
import { LinearGradient } from "expo-linear-gradient";
import { router, useLocalSearchParams } from "expo-router";
import React, { useState } from "react";
import {
  Alert,
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
import { BANKS } from "@/constants/banks";
import { useAccounts } from "@/context/AccountsContext";
import { useScheduler } from "@/context/SchedulerContext";
import { useCredits } from "@/context/CreditsContext";

export default function BankDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const insets = useSafeAreaInsets();
  const colorScheme = useColorScheme();
  const isDark = colorScheme === "dark";
  const c = isDark ? Colors.dark : Colors.light;
  const { accounts, addAccount } = useAccounts();
  const { addEvent } = useScheduler();
  const { availableCredits, deployCredit } = useCredits();

  const bank = BANKS.find(b => b.id === id);
  const isAdded = accounts.some(a => a.bankId === id);
  const [showAddModal, setShowAddModal] = useState(false);
  const [deployAmount, setDeployAmount] = useState(bank?.directDepositRequired?.toString() || "");
  const [openDate, setOpenDate] = useState(new Date().toISOString().slice(0, 10));

  if (!bank) {
    return (
      <View style={{ flex: 1, alignItems: "center", justifyContent: "center" }}>
        <Text>Bank not found</Text>
      </View>
    );
  }

  const handleAddAccount = async () => {
    if (Platform.OS !== "web") Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    await addAccount({
      bankId: bank.id,
      bankName: bank.name,
      bonusAmount: bank.bonusAmount,
      directDepositRequired: bank.directDepositRequired,
      status: "pending",
      openedDate: openDate,
      deposited: 0,
      notes: "",
      logoColor: bank.logoColor,
    });

    const amount = parseFloat(deployAmount) || bank.directDepositRequired;
    if (availableCredits >= amount) {
      await deployCredit(amount, bank.name);
      const dates = [];
      const start = new Date(openDate);
      for (let i = 0; i < bank.minDirectDeposits; i++) {
        const d = new Date(start);
        d.setDate(d.getDate() + Math.round((bank.directDepositPeriodDays / bank.minDirectDeposits) * i));
        dates.push(d.toISOString().slice(0, 10));
      }
      for (const date of dates) {
        await addEvent({
          accountId: bank.id + "_" + Date.now(),
          bankName: bank.name,
          type: "direct_deposit",
          amount: Math.round(amount / bank.minDirectDeposits),
          date: date + "T10:00:00Z",
          status: "scheduled",
          notes: "Auto-scheduled",
          color: "#833AB4",
        });
      }
    }

    setShowAddModal(false);
    Alert.alert("Account Added!", `${bank.name} has been added to your accounts. Deposits have been auto-scheduled on your calendar.`, [
      { text: "View Accounts", onPress: () => router.push("/(tabs)/accounts") },
      { text: "Stay Here" },
    ]);
  };

  const handleOpenSignup = async () => {
    if (Platform.OS !== "web") Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    await WebBrowser.openBrowserAsync(bank.signupUrl);
  };

  const categoryColors: Record<string, string> = {
    "no-ews": "#00C853",
    "no-fee": "#2196F3",
    "fintech": "#9C27B0",
    "credit-union": "#FF5722",
    "neobank": "#00BCD4",
    "military": "#795548",
    "business": "#607D8B",
    "high-bonus": "#FFB300",
    "online-bank": "#3F51B5",
  };

  return (
    <View style={[styles.container, { backgroundColor: c.background }]}>
      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingBottom: insets.bottom + (Platform.OS === "web" ? 34 : 100) }}
      >
        <View style={styles.hero}>
          <LinearGradient
            colors={[bank.logoColor, bank.logoColor + "88"]}
            style={StyleSheet.absoluteFill}
          />
          <View style={[styles.heroOverlay, { paddingTop: insets.top + (Platform.OS === "web" ? 67 : 12) }]}>
            <Pressable style={styles.backBtn} onPress={() => router.back()}>
              <Feather name="arrow-left" size={22} color="#fff" />
            </Pressable>
            <View style={styles.heroContent}>
              <View style={[styles.bankLogo, { backgroundColor: "rgba(255,255,255,0.2)" }]}>
                <Text style={styles.bankLogoText}>{bank.name.charAt(0)}</Text>
              </View>
              <Text style={styles.heroName}>{bank.name}</Text>
              <Text style={styles.heroType}>{bank.type.replace("_", " ").toUpperCase()} · {bank.state}</Text>
              <View style={styles.heroCategories}>
                {bank.category.slice(0, 3).map(cat => (
                  <View key={cat} style={[styles.catChip, { backgroundColor: "rgba(255,255,255,0.2)" }]}>
                    <Text style={styles.catChipText}>{cat}</Text>
                  </View>
                ))}
              </View>
            </View>
          </View>
        </View>

        <View style={styles.bonusHero}>
          <LinearGradient colors={["#00C853", "#00897B"]} style={styles.bonusHeroGrad}>
            <Text style={styles.bonusHeroLabel}>CASH BONUS</Text>
            <Text style={styles.bonusHeroAmount}>${bank.bonusAmount}</Text>
            <Text style={styles.bonusHeroReturn}>{bank.bonusPercentage.toFixed(1)}% return on DD</Text>
          </LinearGradient>
          <View style={[styles.bonusDetails, { backgroundColor: c.card }]}>
            <View style={styles.bonusDetail}>
              <Feather name="dollar-sign" size={16} color="#833AB4" />
              <View>
                <Text style={[styles.bdValue, { color: c.text }]}>${bank.directDepositRequired.toLocaleString()}</Text>
                <Text style={[styles.bdLabel, { color: c.textSecondary }]}>DD Required</Text>
              </View>
            </View>
            <View style={styles.bonusDetail}>
              <Feather name="clock" size={16} color="#F77737" />
              <View>
                <Text style={[styles.bdValue, { color: c.text }]}>{bank.timeToBonus} days</Text>
                <Text style={[styles.bdLabel, { color: c.textSecondary }]}>To Bonus</Text>
              </View>
            </View>
            <View style={styles.bonusDetail}>
              <Feather name="repeat" size={16} color="#2196F3" />
              <View>
                <Text style={[styles.bdValue, { color: c.text }]}>{bank.minDirectDeposits}× in {bank.directDepositPeriodDays}d</Text>
                <Text style={[styles.bdLabel, { color: c.textSecondary }]}>DD Schedule</Text>
              </View>
            </View>
          </View>
        </View>

        <View style={[styles.section, { backgroundColor: c.card, borderColor: c.cardBorder }]}>
          <Text style={[styles.sectionTitle, { color: c.text }]}>Key Features</Text>
          {[
            { key: "ewsReporting", label: "No EWS Reporting", icon: "shield", good: !bank.ewsReporting, goodText: "Does not report to EWS", badText: "Reports to EWS" },
            { key: "noMonthlyMinimum", label: "Monthly Minimum", icon: "check-circle", good: bank.noMonthlyMinimum, goodText: "No monthly minimum balance", badText: "Monthly minimum required" },
            { key: "requiresBiometrics", label: "Biometrics", icon: "eye", good: !bank.requiresBiometrics, goodText: "No biometrics required", badText: "Biometrics required" },
            { key: "accountFee", label: "Monthly Fee", icon: "tag", good: bank.accountFee === 0, goodText: "No monthly fee", badText: `$${bank.accountFee}/month fee` },
          ].map(feature => (
            <View key={feature.key} style={[styles.featureRow, { borderBottomColor: c.separator }]}>
              <View style={[styles.featureIcon, { backgroundColor: feature.good ? "#00C85322" : "#F4433622" }]}>
                <Feather name={feature.icon as any} size={16} color={feature.good ? "#00C853" : "#F44336"} />
              </View>
              <View style={styles.featureContent}>
                <Text style={[styles.featureLabel, { color: c.text }]}>{feature.label}</Text>
                <Text style={[styles.featureValue, { color: feature.good ? "#00C853" : "#F44336" }]}>
                  {feature.good ? feature.goodText : feature.badText}
                </Text>
              </View>
              <Feather name={feature.good ? "check" : "x"} size={18} color={feature.good ? "#00C853" : "#F44336"} />
            </View>
          ))}
        </View>

        <View style={[styles.section, { backgroundColor: c.card, borderColor: c.cardBorder }]}>
          <Text style={[styles.sectionTitle, { color: c.text }]}>Signup Questions</Text>
          <Text style={[styles.sectionSub, { color: c.textSecondary }]}>Fields required during account opening</Text>
          {bank.signupQuestions.map(q => (
            <View key={q.field} style={[styles.qRow, { borderBottomColor: c.separator }]}>
              <View style={[styles.qIcon, { backgroundColor: c.backgroundSecondary }]}>
                <Feather name={q.type === "email" ? "mail" : q.type === "phone" ? "phone" : q.type === "ssn" ? "lock" : "user"} size={14} color={c.textSecondary} />
              </View>
              <Text style={[styles.qLabel, { color: c.text }]}>{q.label}</Text>
              <View style={[styles.qRequired, { backgroundColor: q.required ? "#E1306C22" : "#00C85322" }]}>
                <Text style={[styles.qRequiredText, { color: q.required ? "#E1306C" : "#00C853" }]}>{q.required ? "Required" : "Optional"}</Text>
              </View>
            </View>
          ))}
        </View>

        {bank.notes && (
          <View style={[styles.section, { backgroundColor: c.card, borderColor: c.cardBorder }]}>
            <View style={styles.notesBox}>
              <Feather name="info" size={16} color="#2196F3" />
              <Text style={[styles.notesText, { color: c.textSecondary }]}>{bank.notes}</Text>
            </View>
          </View>
        )}
      </ScrollView>

      <View style={[styles.actionBar, { backgroundColor: c.card, borderTopColor: c.separator, paddingBottom: insets.bottom + (Platform.OS === "web" ? 34 : 12) }]}>
        <Pressable style={[styles.secondaryBtn, { borderColor: c.cardBorder }]} onPress={handleOpenSignup}>
          <Feather name="external-link" size={16} color={c.text} />
          <Text style={[styles.secondaryBtnText, { color: c.text }]}>Apply Now</Text>
        </Pressable>
        {isAdded ? (
          <View style={[styles.addedIndicator, { backgroundColor: "#00C85322" }]}>
            <Feather name="check-circle" size={18} color="#00C853" />
            <Text style={{ color: "#00C853", fontFamily: "Inter_600SemiBold", fontSize: 15 }}>Tracking</Text>
          </View>
        ) : (
          <Pressable style={styles.primaryBtn} onPress={() => setShowAddModal(true)}>
            <LinearGradient colors={["#833AB4", "#E1306C"]} start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }} style={StyleSheet.absoluteFill} />
            <Feather name="plus" size={16} color="#fff" />
            <Text style={styles.primaryBtnText}>Track This Bank</Text>
          </Pressable>
        )}
      </View>

      <Modal visible={showAddModal} animationType="slide" transparent>
        <View style={styles.modalOverlay}>
          <View style={[styles.modalSheet, { backgroundColor: c.card, paddingBottom: insets.bottom + 20 }]}>
            <View style={styles.modalHandle} />
            <Text style={[styles.modalTitle, { color: c.text }]}>Add to Tracker</Text>
            <Text style={[styles.modalSub, { color: c.textSecondary }]}>{bank.name}</Text>

            <Text style={[styles.inputLabel, { color: c.textSecondary }]}>Deploy Amount (credits)</Text>
            <View style={[styles.inputRow, { backgroundColor: c.backgroundSecondary, borderColor: c.cardBorder }]}>
              <Text style={{ color: c.textSecondary, fontFamily: "Inter_400Regular" }}>$</Text>
              <TextInput
                style={[styles.modalInput, { color: c.text }]}
                value={deployAmount}
                onChangeText={setDeployAmount}
                keyboardType="numeric"
                placeholder={bank.directDepositRequired.toString()}
                placeholderTextColor={c.textTertiary}
              />
            </View>
            <Text style={[styles.inputHint, { color: c.textTertiary }]}>Available: ${availableCredits.toLocaleString()} · Min required: ${bank.directDepositRequired.toLocaleString()}</Text>

            <Text style={[styles.inputLabel, { color: c.textSecondary }]}>Account Open Date</Text>
            <TextInput
              style={[styles.inputField, { backgroundColor: c.backgroundSecondary, color: c.text, borderColor: c.cardBorder }]}
              value={openDate}
              onChangeText={setOpenDate}
              placeholder="YYYY-MM-DD"
              placeholderTextColor={c.textTertiary}
            />

            <View style={[styles.autoScheduleNote, { backgroundColor: "#833AB422" }]}>
              <Feather name="calendar" size={14} color="#833AB4" />
              <Text style={[styles.autoScheduleText, { color: "#833AB4" }]}>
                {bank.minDirectDeposits} deposit(s) will be auto-scheduled over {bank.directDepositPeriodDays} days
              </Text>
            </View>

            <Pressable style={styles.confirmBtn} onPress={handleAddAccount}>
              <LinearGradient colors={["#833AB4", "#E1306C"]} start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }} style={StyleSheet.absoluteFill} />
              <Text style={styles.confirmBtnText}>Confirm & Schedule</Text>
            </Pressable>

            <Pressable style={[styles.cancelBtn, { borderColor: c.cardBorder }]} onPress={() => setShowAddModal(false)}>
              <Text style={[styles.cancelText, { color: c.textSecondary }]}>Cancel</Text>
            </Pressable>
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  hero: { minHeight: 220, justifyContent: "flex-end" },
  heroOverlay: { paddingHorizontal: 16, paddingBottom: 20 },
  backBtn: { width: 38, height: 38, backgroundColor: "rgba(0,0,0,0.3)", borderRadius: 12, alignItems: "center", justifyContent: "center", marginBottom: 16 },
  heroContent: { alignItems: "center", gap: 8 },
  bankLogo: { width: 64, height: 64, borderRadius: 18, alignItems: "center", justifyContent: "center" },
  bankLogoText: { fontSize: 28, fontFamily: "Inter_700Bold", color: "#fff" },
  heroName: { fontSize: 24, fontFamily: "Inter_700Bold", color: "#fff", textAlign: "center" },
  heroType: { fontSize: 13, fontFamily: "Inter_400Regular", color: "rgba(255,255,255,0.8)" },
  heroCategories: { flexDirection: "row", gap: 6, flexWrap: "wrap", justifyContent: "center" },
  catChip: { paddingHorizontal: 10, paddingVertical: 4, borderRadius: 8 },
  catChipText: { fontSize: 11, fontFamily: "Inter_600SemiBold", color: "#fff" },
  bonusHero: { flexDirection: "row", margin: 16, gap: 0, borderRadius: 16, overflow: "hidden" },
  bonusHeroGrad: { flex: 1, padding: 16, alignItems: "center" },
  bonusHeroLabel: { fontSize: 10, fontFamily: "Inter_600SemiBold", color: "rgba(255,255,255,0.8)", letterSpacing: 2 },
  bonusHeroAmount: { fontSize: 36, fontFamily: "Inter_700Bold", color: "#fff" },
  bonusHeroReturn: { fontSize: 12, fontFamily: "Inter_400Regular", color: "rgba(255,255,255,0.8)" },
  bonusDetails: { flex: 1.2, padding: 12, gap: 8 },
  bonusDetail: { flexDirection: "row", alignItems: "center", gap: 8 },
  bdValue: { fontSize: 13, fontFamily: "Inter_600SemiBold" },
  bdLabel: { fontSize: 10, fontFamily: "Inter_400Regular" },
  section: { margin: 16, marginTop: 0, borderRadius: 16, borderWidth: 1, padding: 16 },
  sectionTitle: { fontSize: 16, fontFamily: "Inter_700Bold", marginBottom: 4 },
  sectionSub: { fontSize: 12, fontFamily: "Inter_400Regular", marginBottom: 12 },
  featureRow: { flexDirection: "row", alignItems: "center", gap: 12, paddingVertical: 10, borderBottomWidth: 1 },
  featureIcon: { width: 32, height: 32, borderRadius: 8, alignItems: "center", justifyContent: "center" },
  featureContent: { flex: 1 },
  featureLabel: { fontSize: 14, fontFamily: "Inter_600SemiBold" },
  featureValue: { fontSize: 12, fontFamily: "Inter_400Regular", marginTop: 2 },
  qRow: { flexDirection: "row", alignItems: "center", gap: 10, paddingVertical: 8, borderBottomWidth: 1 },
  qIcon: { width: 28, height: 28, borderRadius: 7, alignItems: "center", justifyContent: "center" },
  qLabel: { flex: 1, fontSize: 13, fontFamily: "Inter_400Regular" },
  qRequired: { paddingHorizontal: 8, paddingVertical: 3, borderRadius: 6 },
  qRequiredText: { fontSize: 10, fontFamily: "Inter_600SemiBold" },
  notesBox: { flexDirection: "row", gap: 10 },
  notesText: { flex: 1, fontSize: 13, fontFamily: "Inter_400Regular", lineHeight: 20 },
  actionBar: { position: "absolute", bottom: 0, left: 0, right: 0, flexDirection: "row", padding: 12, gap: 10, borderTopWidth: 1 },
  secondaryBtn: { flex: 1, flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 6, paddingVertical: 14, borderRadius: 12, borderWidth: 1 },
  secondaryBtnText: { fontSize: 15, fontFamily: "Inter_600SemiBold" },
  primaryBtn: { flex: 2, flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 6, paddingVertical: 14, borderRadius: 12, overflow: "hidden" },
  primaryBtnText: { fontSize: 15, fontFamily: "Inter_600SemiBold", color: "#fff" },
  addedIndicator: { flex: 2, flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 6, paddingVertical: 14, borderRadius: 12 },
  modalOverlay: { flex: 1, backgroundColor: "rgba(0,0,0,0.5)", justifyContent: "flex-end" },
  modalSheet: { borderTopLeftRadius: 24, borderTopRightRadius: 24, padding: 20 },
  modalHandle: { width: 36, height: 4, backgroundColor: "#ccc", borderRadius: 2, alignSelf: "center", marginBottom: 16 },
  modalTitle: { fontSize: 22, fontFamily: "Inter_700Bold", marginBottom: 4 },
  modalSub: { fontSize: 14, fontFamily: "Inter_400Regular", marginBottom: 16 },
  inputLabel: { fontSize: 13, fontFamily: "Inter_600SemiBold", marginBottom: 6, marginTop: 10 },
  inputRow: { flexDirection: "row", alignItems: "center", paddingHorizontal: 14, paddingVertical: 12, borderRadius: 12, borderWidth: 1, gap: 4 },
  modalInput: { flex: 1, fontSize: 16, fontFamily: "Inter_600SemiBold" },
  inputHint: { fontSize: 11, fontFamily: "Inter_400Regular", marginTop: 4 },
  inputField: { borderRadius: 12, borderWidth: 1, paddingHorizontal: 14, paddingVertical: 12, fontSize: 15, fontFamily: "Inter_400Regular" },
  autoScheduleNote: { flexDirection: "row", alignItems: "center", gap: 8, padding: 12, borderRadius: 10, marginTop: 12 },
  autoScheduleText: { flex: 1, fontSize: 13, fontFamily: "Inter_400Regular" },
  confirmBtn: { marginTop: 16, paddingVertical: 16, borderRadius: 14, alignItems: "center", overflow: "hidden" },
  confirmBtnText: { fontSize: 16, fontFamily: "Inter_600SemiBold", color: "#fff" },
  cancelBtn: { borderWidth: 1, borderRadius: 14, paddingVertical: 14, alignItems: "center", marginTop: 10 },
  cancelText: { fontSize: 15, fontFamily: "Inter_600SemiBold" },
});
