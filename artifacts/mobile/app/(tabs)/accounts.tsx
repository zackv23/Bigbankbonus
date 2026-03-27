import { Feather } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";
import { LinearGradient } from "expo-linear-gradient";
import { router } from "expo-router";
import React, { useState } from "react";
import {
  Alert,
  FlatList,
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
import { ManagedAccount, useAccounts } from "@/context/AccountsContext";
import { useCredits } from "@/context/CreditsContext";

const STATUS_COLORS: Record<string, string> = {
  pending: "#FFB300",
  active: "#2196F3",
  bonus_received: "#00C853",
  closed: "#9E9E9E",
};

const STATUS_LABELS: Record<string, string> = {
  pending: "Pending",
  active: "Active",
  bonus_received: "Bonus Received",
  closed: "Closed",
};

function AccountCard({ account, onEdit }: { account: ManagedAccount; onEdit: (acc: ManagedAccount) => void }) {
  const colorScheme = useColorScheme();
  const isDark = colorScheme === "dark";
  const c = isDark ? Colors.dark : Colors.light;
  const { updateAccount, removeAccount } = useAccounts();

  const handleStatusCycle = () => {
    const statuses: ManagedAccount["status"][] = ["pending", "active", "bonus_received", "closed"];
    const idx = statuses.indexOf(account.status);
    const next = statuses[(idx + 1) % statuses.length];
    if (Platform.OS !== "web") Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    updateAccount(account.id, { status: next });
  };

  const handleDelete = () => {
    Alert.alert("Remove Account", `Remove ${account.bankName} from tracking?`, [
      { text: "Cancel", style: "cancel" },
      {
        text: "Remove",
        style: "destructive",
        onPress: () => removeAccount(account.id),
      },
    ]);
  };

  const depositProgress = Math.min(account.deposited / account.directDepositRequired, 1);

  return (
    <View style={[styles.accountCard, { backgroundColor: c.card, borderColor: c.cardBorder }]}>
      <View style={styles.accountCardTop}>
        <View style={[styles.bankLogoSm, { backgroundColor: account.logoColor }]}>
          <Text style={styles.bankLogoSmText}>{account.bankName.charAt(0)}</Text>
        </View>
        <View style={styles.accountInfo}>
          <Text style={[styles.accountBankName, { color: c.text }]}>{account.bankName}</Text>
          <Text style={[styles.accountDate, { color: c.textSecondary }]}>
            Opened {new Date(account.openedDate).toLocaleDateString()}
          </Text>
        </View>
        <Pressable onPress={handleStatusCycle} style={[styles.statusBadge, { backgroundColor: STATUS_COLORS[account.status] + "22" }]}>
          <View style={[styles.statusDot, { backgroundColor: STATUS_COLORS[account.status] }]} />
          <Text style={[styles.statusText, { color: STATUS_COLORS[account.status] }]}>{STATUS_LABELS[account.status]}</Text>
        </Pressable>
      </View>

      <View style={styles.accountNumbers}>
        <View style={styles.numberField}>
          <Feather name="lock" size={12} color="#666" />
          <Text style={[styles.numberLabel, { color: c.textSecondary }]}>Account #</Text>
          <Text style={[styles.numberValue, { color: c.text }]}>
            {account.accountNumber ? `••••${account.accountNumber.slice(-4)}` : "Not set"}
          </Text>
        </View>
        <View style={styles.numberField}>
          <Feather name="hash" size={12} color="#666" />
          <Text style={[styles.numberLabel, { color: c.textSecondary }]}>Routing #</Text>
          <Text style={[styles.numberValue, { color: c.text }]}>
            {account.routingNumber ? account.routingNumber : "Not set"}
          </Text>
        </View>
      </View>

      <View style={styles.progressSection}>
        <View style={styles.progressHeader}>
          <Text style={[styles.progressLabel, { color: c.textSecondary }]}>Direct Deposit Progress</Text>
          <Text style={[styles.progressValue, { color: c.text }]}>
            ${account.deposited.toLocaleString()} / ${account.directDepositRequired.toLocaleString()}
          </Text>
        </View>
        <View style={[styles.progressBar, { backgroundColor: c.backgroundTertiary }]}>
          <LinearGradient
            colors={["#833AB4", "#E1306C"]}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 0 }}
            style={[styles.progressFill, { width: `${depositProgress * 100}%` as any }]}
          />
        </View>
        <View style={styles.bonusRow}>
          <Text style={[styles.bonusTarget, { color: c.textSecondary }]}>Bonus target: </Text>
          <Text style={[styles.bonusTargetAmount, { color: "#00C853" }]}>${account.bonusAmount}</Text>
        </View>
      </View>

      <View style={styles.cardActions}>
        <Pressable style={[styles.cardActionBtn, { backgroundColor: c.backgroundSecondary }]} onPress={() => onEdit(account)}>
          <Feather name="edit-2" size={14} color={c.textSecondary} />
          <Text style={[styles.cardActionText, { color: c.textSecondary }]}>Edit</Text>
        </Pressable>
        <Pressable
          style={[styles.cardActionBtn, { backgroundColor: "#833AB422" }]}
          onPress={() => router.push({ pathname: "/bank/[id]", params: { id: account.bankId } })}
        >
          <Feather name="external-link" size={14} color="#833AB4" />
          <Text style={[styles.cardActionText, { color: "#833AB4" }]}>View Bank</Text>
        </Pressable>
        <Pressable style={[styles.cardActionBtn, { backgroundColor: "#F4433622" }]} onPress={handleDelete}>
          <Feather name="trash-2" size={14} color="#F44336" />
        </Pressable>
      </View>
    </View>
  );
}

function EditAccountModal({ account, visible, onClose }: { account: ManagedAccount | null; visible: boolean; onClose: () => void }) {
  const colorScheme = useColorScheme();
  const isDark = colorScheme === "dark";
  const c = isDark ? Colors.dark : Colors.light;
  const { updateAccount } = useAccounts();
  const insets = useSafeAreaInsets();

  const [accountNum, setAccountNum] = useState(account?.accountNumber || "");
  const [routingNum, setRoutingNum] = useState(account?.routingNumber || "");
  const [deposited, setDeposited] = useState(account?.deposited?.toString() || "0");
  const [notes, setNotes] = useState(account?.notes || "");

  const handleSave = async () => {
    if (!account) return;
    await updateAccount(account.id, {
      accountNumber: accountNum,
      routingNumber: routingNum,
      deposited: parseFloat(deposited) || 0,
      notes,
    });
    if (Platform.OS !== "web") Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    onClose();
  };

  return (
    <Modal visible={visible} animationType="slide" transparent>
      <View style={styles.modalOverlay}>
        <View style={[styles.modalSheet, { backgroundColor: c.card, paddingBottom: insets.bottom + 20 }]}>
          <View style={styles.modalHandle} />
          <Text style={[styles.modalTitle, { color: c.text }]}>Edit Account</Text>
          <Text style={[styles.modalSubtitle, { color: c.textSecondary }]}>{account?.bankName}</Text>

          <ScrollView showsVerticalScrollIndicator={false}>
            <Text style={[styles.inputLabel, { color: c.textSecondary }]}>Account Number</Text>
            <TextInput
              style={[styles.inputField, { backgroundColor: c.backgroundSecondary, color: c.text, borderColor: c.cardBorder }]}
              placeholder="Enter account number"
              placeholderTextColor={c.textTertiary}
              value={accountNum}
              onChangeText={setAccountNum}
              keyboardType="numeric"
              secureTextEntry
            />

            <Text style={[styles.inputLabel, { color: c.textSecondary }]}>Routing Number</Text>
            <TextInput
              style={[styles.inputField, { backgroundColor: c.backgroundSecondary, color: c.text, borderColor: c.cardBorder }]}
              placeholder="Enter routing number"
              placeholderTextColor={c.textTertiary}
              value={routingNum}
              onChangeText={setRoutingNum}
              keyboardType="numeric"
            />

            <Text style={[styles.inputLabel, { color: c.textSecondary }]}>Deposited Amount ($)</Text>
            <TextInput
              style={[styles.inputField, { backgroundColor: c.backgroundSecondary, color: c.text, borderColor: c.cardBorder }]}
              placeholder="0"
              placeholderTextColor={c.textTertiary}
              value={deposited}
              onChangeText={setDeposited}
              keyboardType="decimal-pad"
            />

            <Text style={[styles.inputLabel, { color: c.textSecondary }]}>Notes</Text>
            <TextInput
              style={[styles.inputField, styles.notesField, { backgroundColor: c.backgroundSecondary, color: c.text, borderColor: c.cardBorder }]}
              placeholder="Add notes..."
              placeholderTextColor={c.textTertiary}
              value={notes}
              onChangeText={setNotes}
              multiline
              numberOfLines={3}
            />

            <Pressable style={styles.saveBtn} onPress={handleSave}>
              <LinearGradient colors={["#833AB4", "#E1306C"]} start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }} style={styles.saveBtnGrad}>
                <Text style={styles.saveBtnText}>Save Changes</Text>
              </LinearGradient>
            </Pressable>

            <Pressable style={[styles.cancelBtn, { borderColor: c.cardBorder }]} onPress={onClose}>
              <Text style={[styles.cancelBtnText, { color: c.textSecondary }]}>Cancel</Text>
            </Pressable>
          </ScrollView>
        </View>
      </View>
    </Modal>
  );
}

export default function AccountsScreen() {
  const insets = useSafeAreaInsets();
  const colorScheme = useColorScheme();
  const isDark = colorScheme === "dark";
  const c = isDark ? Colors.dark : Colors.light;
  const { accounts, totalBonusEarned, totalBonusPending, totalDeposited } = useAccounts();
  const { availableCredits, totalCredits } = useCredits();
  const [editingAccount, setEditingAccount] = useState<ManagedAccount | null>(null);

  return (
    <View style={[styles.container, { backgroundColor: c.background }]}>
      <View style={[styles.header, { paddingTop: insets.top + (Platform.OS === "web" ? 67 : 12) }]}>
        <LinearGradient colors={["#E1306C", "#F77737"]} start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }} style={StyleSheet.absoluteFill} />
        <View style={styles.headerRow}>
          <Text style={styles.headerTitle}>My Accounts</Text>
          <Pressable style={styles.headerBtn} onPress={() => router.push("/payment")}>
            <Feather name="plus-circle" size={20} color="rgba(255,255,255,0.9)" />
          </Pressable>
        </View>

        <View style={styles.creditCard}>
          <View style={styles.creditInfo}>
            <Text style={styles.creditLabel}>Available Credits</Text>
            <Text style={styles.creditAmount}>${availableCredits.toLocaleString()}</Text>
            <Text style={styles.creditSub}>of ${totalCredits.toLocaleString()} total</Text>
          </View>
          <Pressable style={styles.buyCreditsBtn} onPress={() => router.push("/payment")}>
            <Feather name="plus" size={14} color="#fff" />
            <Text style={styles.buyCreditsText}>Buy Credits</Text>
          </Pressable>
        </View>

        <View style={styles.statsRow}>
          <View style={styles.statBox}>
            <Text style={styles.statBoxValue}>${totalBonusEarned.toLocaleString()}</Text>
            <Text style={styles.statBoxLabel}>Earned</Text>
          </View>
          <View style={styles.statBox}>
            <Text style={styles.statBoxValue}>${totalBonusPending.toLocaleString()}</Text>
            <Text style={styles.statBoxLabel}>Pending</Text>
          </View>
          <View style={styles.statBox}>
            <Text style={styles.statBoxValue}>{accounts.length}</Text>
            <Text style={styles.statBoxLabel}>Accounts</Text>
          </View>
          <View style={styles.statBox}>
            <Text style={styles.statBoxValue}>${totalDeposited.toLocaleString()}</Text>
            <Text style={styles.statBoxLabel}>Deployed</Text>
          </View>
        </View>
      </View>

      {accounts.length === 0 ? (
        <View style={styles.emptyState}>
          <Feather name="credit-card" size={48} color={c.textTertiary} />
          <Text style={[styles.emptyTitle, { color: c.textSecondary }]}>No accounts yet</Text>
          <Text style={[styles.emptySubtitle, { color: c.textTertiary }]}>Find banks in Discover and add them to start tracking</Text>
          <Pressable style={styles.emptyBtn} onPress={() => router.push("/(tabs)/")}>
            <LinearGradient colors={["#833AB4", "#E1306C"]} start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }} style={styles.emptyBtnGrad}>
              <Feather name="search" size={16} color="#fff" />
              <Text style={styles.emptyBtnText}>Discover Banks</Text>
            </LinearGradient>
          </Pressable>
        </View>
      ) : (
        <FlatList
          data={accounts}
          keyExtractor={a => a.id}
          renderItem={({ item }) => <AccountCard account={item} onEdit={setEditingAccount} />}
          contentContainerStyle={[styles.list, { paddingBottom: insets.bottom + (Platform.OS === "web" ? 34 : 80) }]}
          showsVerticalScrollIndicator={false}
        />
      )}

      <EditAccountModal
        account={editingAccount}
        visible={!!editingAccount}
        onClose={() => setEditingAccount(null)}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: { paddingHorizontal: 16, paddingBottom: 16 },
  headerRow: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginBottom: 14 },
  headerTitle: { fontSize: 28, fontFamily: "Inter_700Bold", color: "#fff" },
  headerBtn: { width: 36, height: 36, alignItems: "center", justifyContent: "center" },
  creditCard: { backgroundColor: "rgba(255,255,255,0.15)", borderRadius: 16, padding: 16, flexDirection: "row", alignItems: "center", marginBottom: 14, borderWidth: 1, borderColor: "rgba(255,255,255,0.2)" },
  creditInfo: { flex: 1 },
  creditLabel: { fontSize: 12, fontFamily: "Inter_400Regular", color: "rgba(255,255,255,0.7)", marginBottom: 2 },
  creditAmount: { fontSize: 28, fontFamily: "Inter_700Bold", color: "#fff" },
  creditSub: { fontSize: 12, fontFamily: "Inter_400Regular", color: "rgba(255,255,255,0.6)" },
  buyCreditsBtn: { flexDirection: "row", alignItems: "center", gap: 6, backgroundColor: "rgba(255,255,255,0.2)", paddingHorizontal: 14, paddingVertical: 10, borderRadius: 10, borderWidth: 1, borderColor: "rgba(255,255,255,0.3)" },
  buyCreditsText: { fontSize: 13, fontFamily: "Inter_600SemiBold", color: "#fff" },
  statsRow: { flexDirection: "row", gap: 8 },
  statBox: { flex: 1, backgroundColor: "rgba(255,255,255,0.12)", borderRadius: 12, padding: 10, alignItems: "center" },
  statBoxValue: { fontSize: 16, fontFamily: "Inter_700Bold", color: "#fff" },
  statBoxLabel: { fontSize: 10, fontFamily: "Inter_400Regular", color: "rgba(255,255,255,0.7)", marginTop: 2 },
  emptyState: { flex: 1, alignItems: "center", justifyContent: "center", padding: 32, gap: 12 },
  emptyTitle: { fontSize: 20, fontFamily: "Inter_600SemiBold" },
  emptySubtitle: { fontSize: 14, fontFamily: "Inter_400Regular", textAlign: "center", lineHeight: 20 },
  emptyBtn: { marginTop: 8 },
  emptyBtnGrad: { flexDirection: "row", alignItems: "center", gap: 8, paddingHorizontal: 20, paddingVertical: 12, borderRadius: 12 },
  emptyBtnText: { fontSize: 15, fontFamily: "Inter_600SemiBold", color: "#fff" },
  list: { padding: 16, gap: 12 },
  accountCard: { borderRadius: 16, borderWidth: 1, overflow: "hidden", padding: 14 },
  accountCardTop: { flexDirection: "row", alignItems: "center", gap: 10, marginBottom: 12 },
  bankLogoSm: { width: 38, height: 38, borderRadius: 10, alignItems: "center", justifyContent: "center" },
  bankLogoSmText: { fontSize: 15, fontFamily: "Inter_700Bold", color: "#fff" },
  accountInfo: { flex: 1 },
  accountBankName: { fontSize: 15, fontFamily: "Inter_600SemiBold" },
  accountDate: { fontSize: 12, fontFamily: "Inter_400Regular", marginTop: 2 },
  statusBadge: { flexDirection: "row", alignItems: "center", gap: 5, paddingHorizontal: 8, paddingVertical: 4, borderRadius: 8 },
  statusDot: { width: 6, height: 6, borderRadius: 3 },
  statusText: { fontSize: 11, fontFamily: "Inter_600SemiBold" },
  accountNumbers: { flexDirection: "row", gap: 12, marginBottom: 12 },
  numberField: { flex: 1, flexDirection: "row", alignItems: "center", gap: 4 },
  numberLabel: { fontSize: 11, fontFamily: "Inter_400Regular" },
  numberValue: { fontSize: 11, fontFamily: "Inter_600SemiBold", flex: 1 },
  progressSection: { marginBottom: 12 },
  progressHeader: { flexDirection: "row", justifyContent: "space-between", marginBottom: 6 },
  progressLabel: { fontSize: 12, fontFamily: "Inter_400Regular" },
  progressValue: { fontSize: 12, fontFamily: "Inter_600SemiBold" },
  progressBar: { height: 6, borderRadius: 3, overflow: "hidden" },
  progressFill: { height: 6, borderRadius: 3 },
  bonusRow: { flexDirection: "row", marginTop: 4 },
  bonusTarget: { fontSize: 12, fontFamily: "Inter_400Regular" },
  bonusTargetAmount: { fontSize: 12, fontFamily: "Inter_600SemiBold" },
  cardActions: { flexDirection: "row", gap: 8 },
  cardActionBtn: { flex: 1, flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 6, paddingVertical: 8, borderRadius: 10 },
  cardActionText: { fontSize: 13, fontFamily: "Inter_600SemiBold" },
  modalOverlay: { flex: 1, backgroundColor: "rgba(0,0,0,0.5)", justifyContent: "flex-end" },
  modalSheet: { borderTopLeftRadius: 24, borderTopRightRadius: 24, padding: 20, maxHeight: "90%" },
  modalHandle: { width: 36, height: 4, backgroundColor: "#ccc", borderRadius: 2, alignSelf: "center", marginBottom: 16 },
  modalTitle: { fontSize: 22, fontFamily: "Inter_700Bold", marginBottom: 4 },
  modalSubtitle: { fontSize: 14, fontFamily: "Inter_400Regular", marginBottom: 16 },
  inputLabel: { fontSize: 13, fontFamily: "Inter_600SemiBold", marginBottom: 6, marginTop: 12 },
  inputField: { borderRadius: 12, borderWidth: 1, paddingHorizontal: 14, paddingVertical: 12, fontSize: 15, fontFamily: "Inter_400Regular" },
  notesField: { height: 80, textAlignVertical: "top" },
  saveBtn: { marginTop: 20 },
  saveBtnGrad: { paddingVertical: 16, borderRadius: 14, alignItems: "center", justifyContent: "center" },
  saveBtnText: { fontSize: 16, fontFamily: "Inter_600SemiBold", color: "#fff" },
  cancelBtn: { borderWidth: 1, borderRadius: 14, paddingVertical: 14, alignItems: "center", marginTop: 10 },
  cancelBtnText: { fontSize: 15, fontFamily: "Inter_600SemiBold" },
});
