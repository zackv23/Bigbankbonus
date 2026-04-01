import { Feather } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";
import { LinearGradient } from "expo-linear-gradient";
import { router, useFocusEffect } from "expo-router";
import React, { useCallback, useEffect, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  FlatList,
  Linking,
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
import { PlaidAccount, PlaidItem, PlaidTransaction, usePlaid } from "@/context/PlaidContext";
import LiveBalances from "@/components/LiveBalances";

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
  const [accountConfirm, setAccountConfirm] = useState("");
  const [accountMismatch, setAccountMismatch] = useState(false);
  const [routingNum, setRoutingNum] = useState(account?.routingNumber || "");
  const [deposited, setDeposited] = useState(account?.deposited?.toString() || "0");
  const [notes, setNotes] = useState(account?.notes || "");
  const [saveError, setSaveError] = useState<string | null>(null);

  React.useEffect(() => {
    if (visible) {
      setAccountNum(account?.accountNumber || "");
      setAccountConfirm("");
      setAccountMismatch(false);
      setRoutingNum(account?.routingNumber || "");
      setDeposited(account?.deposited?.toString() || "0");
      setNotes(account?.notes || "");
      setSaveError(null);
    }
  }, [visible, account]);

  const routingValid = routingNum.length === 9;

  const handleSave = async () => {
    if (!account) return;
    if (accountNum && accountNum !== accountConfirm) {
      setAccountMismatch(true);
      setSaveError("Account numbers don't match — please re-enter to confirm.");
      return;
    }
    if (routingNum && routingNum.length !== 9) {
      setSaveError("Routing number must be exactly 9 digits.");
      return;
    }
    setSaveError(null);
    setAccountMismatch(false);
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
            {/* ── Account Number ── */}
            <Text style={[styles.inputLabel, { color: c.textSecondary }]}>Account Number</Text>
            <TextInput
              style={[styles.inputField, { backgroundColor: c.backgroundSecondary, color: c.text, borderColor: c.cardBorder }]}
              placeholder="Enter account number"
              placeholderTextColor={c.textTertiary}
              value={accountNum}
              onChangeText={t => { setAccountNum(t.replace(/\D/g, "")); setAccountMismatch(false); setSaveError(null); }}
              keyboardType="numeric"
              secureTextEntry
              maxLength={17}
            />

            {/* ── Confirm Account Number ── */}
            <Text style={[styles.inputLabel, { color: c.textSecondary }]}>Confirm Account Number</Text>
            <TextInput
              style={[styles.inputField, { backgroundColor: c.backgroundSecondary, color: c.text, borderColor: accountMismatch ? "#F44336" : c.cardBorder }]}
              placeholder="Re-enter account number"
              placeholderTextColor={c.textTertiary}
              value={accountConfirm}
              onChangeText={t => { setAccountConfirm(t.replace(/\D/g, "")); setAccountMismatch(false); setSaveError(null); }}
              keyboardType="numeric"
              secureTextEntry
              maxLength={17}
            />
            {accountMismatch && (
              <Text style={styles.editErrText}>Account numbers don't match</Text>
            )}

            {/* ── Routing Number ── */}
            <Text style={[styles.inputLabel, { color: c.textSecondary }]}>Routing Number</Text>
            <TextInput
              style={[styles.inputField, { backgroundColor: c.backgroundSecondary, color: c.text, borderColor: routingNum.length > 0 && !routingValid ? "#FFB300" : c.cardBorder }]}
              placeholder="9-digit routing number"
              placeholderTextColor={c.textTertiary}
              value={routingNum}
              onChangeText={t => { setRoutingNum(t.replace(/\D/g, "").slice(0, 9)); setSaveError(null); }}
              keyboardType="numeric"
              maxLength={9}
            />
            {routingNum.length > 0 && (
              <Text style={[styles.routingCountEdit, { color: routingValid ? "#4CAF50" : c.textTertiary }]}>
                {routingNum.length}/9 digits{routingValid ? " ✓" : ""}
              </Text>
            )}

            {/* ── Deposited Amount ── */}
            <Text style={[styles.inputLabel, { color: c.textSecondary }]}>Deposited Amount ($)</Text>
            <TextInput
              style={[styles.inputField, { backgroundColor: c.backgroundSecondary, color: c.text, borderColor: c.cardBorder }]}
              placeholder="0"
              placeholderTextColor={c.textTertiary}
              value={deposited}
              onChangeText={setDeposited}
              keyboardType="decimal-pad"
            />

            {/* ── Notes ── */}
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

            {saveError && <Text style={styles.editErrText}>{saveError}</Text>}

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

function PlaidItemCard({ item, isDark }: { item: PlaidItem; isDark: boolean }) {
  const c = isDark ? Colors.dark : Colors.light;
  const { unlinkBank, refreshBalance, fetchTransactions } = usePlaid();
  const [accounts, setAccounts] = useState<PlaidAccount[]>((item.accounts as PlaidAccount[]) ?? []);
  const [txs, setTxs] = useState<PlaidTransaction[]>([]);
  const [showTxs, setShowTxs] = useState(false);
  const [refreshing, setRefreshing] = useState(false);

  const totalBalance = accounts.reduce((s, a) => s + (a.balances.available ?? 0), 0);

  const handleRefresh = async () => {
    setRefreshing(true);
    const updated = await refreshBalance(item.itemId);
    if (updated.length) setAccounts(updated);
    setRefreshing(false);
  };

  const handleShowTxs = async () => {
    if (!showTxs && txs.length === 0) {
      const data = await fetchTransactions(item.itemId);
      setTxs(data);
    }
    setShowTxs(v => !v);
  };

  const handleUnlink = () => {
    Alert.alert("Unlink Bank", `Remove ${item.institutionName ?? "bank"} from Plaid?`, [
      { text: "Cancel", style: "cancel" },
      { text: "Unlink", style: "destructive", onPress: () => unlinkBank(item.itemId) },
    ]);
  };

  const directDeposits = txs.filter(t =>
    t.category?.some(c => c.toLowerCase().includes("direct deposit") || c.toLowerCase().includes("payroll")) && t.amount < 0
  );
  const bonusTxs = txs.filter(t => (t.name.toLowerCase().includes("bonus") || t.name.toLowerCase().includes("reward")) && t.amount < 0);

  return (
    <View style={[styles.plaidCard, { backgroundColor: c.card, borderColor: c.cardBorder }]}>
      <View style={styles.plaidCardTop}>
        <LinearGradient colors={["#833AB4", "#E1306C"]} style={styles.plaidBankIcon}>
          <Text style={styles.plaidBankIconText}>{(item.institutionName ?? "B").charAt(0)}</Text>
        </LinearGradient>
        <View style={{ flex: 1 }}>
          <Text style={[styles.plaidBankName, { color: c.text }]}>{item.institutionName ?? "Bank"}</Text>
          <Text style={[styles.plaidBankSub, { color: c.textSecondary }]}>{accounts.length} account{accounts.length !== 1 ? "s" : ""} linked via Plaid</Text>
        </View>
        <View style={{ alignItems: "flex-end" }}>
          <Text style={[styles.plaidBalance, { color: c.text }]}>${totalBalance.toLocaleString()}</Text>
          <Text style={[styles.plaidBalanceSub, { color: c.textSecondary }]}>total balance</Text>
        </View>
      </View>

      <View style={styles.plaidAccounts}>
        {accounts.map(a => (
          <View key={a.account_id} style={[styles.plaidAccountRow, { borderColor: c.cardBorder }]}>
            <View style={[styles.plaidAccountDot, { backgroundColor: a.subtype === "checking" ? "#2196F3" : "#4CAF50" }]} />
            <Text style={[styles.plaidAccountName, { color: c.text }]}>{a.name}</Text>
            <Text style={[styles.plaidAccountMask, { color: c.textSecondary }]}>••{a.mask}</Text>
            <Text style={[styles.plaidAccountBal, { color: c.text }]}>${(a.balances.available ?? 0).toLocaleString()}</Text>
          </View>
        ))}
      </View>

      {showTxs && txs.length > 0 && (
        <View style={[styles.txSection, { borderColor: c.cardBorder }]}>
          <View style={styles.txStats}>
            <View style={[styles.txStatBox, { backgroundColor: "#4CAF5022" }]}>
              <Feather name="arrow-down-circle" size={14} color="#4CAF50" />
              <Text style={[styles.txStatVal, { color: "#4CAF50" }]}>{directDeposits.length}</Text>
              <Text style={[styles.txStatLabel, { color: c.textSecondary }]}>Direct Deposits</Text>
            </View>
            <View style={[styles.txStatBox, { backgroundColor: "#F7773722" }]}>
              <Feather name="gift" size={14} color="#F77737" />
              <Text style={[styles.txStatVal, { color: "#F77737" }]}>{bonusTxs.length}</Text>
              <Text style={[styles.txStatLabel, { color: c.textSecondary }]}>Bonuses Detected</Text>
            </View>
          </View>
          {txs.slice(0, 5).map(tx => (
            <View key={tx.transaction_id} style={[styles.txRow, { borderColor: c.cardBorder }]}>
              <View style={{ flex: 1 }}>
                <Text style={[styles.txName, { color: c.text }]} numberOfLines={1}>{tx.name}</Text>
                <Text style={[styles.txDate, { color: c.textSecondary }]}>{tx.date}</Text>
              </View>
              <Text style={[styles.txAmount, { color: tx.amount < 0 ? "#4CAF50" : "#F44336" }]}>
                {tx.amount < 0 ? "+" : "-"}${Math.abs(tx.amount).toFixed(2)}
              </Text>
            </View>
          ))}
        </View>
      )}

      <View style={styles.plaidCardActions}>
        <Pressable style={[styles.plaidAction, { backgroundColor: c.backgroundSecondary }]} onPress={handleRefresh} disabled={refreshing}>
          {refreshing ? <ActivityIndicator size={13} color="#833AB4" /> : <Feather name="refresh-cw" size={13} color="#833AB4" />}
          <Text style={[styles.plaidActionText, { color: "#833AB4" }]}>Refresh</Text>
        </Pressable>
        <Pressable style={[styles.plaidAction, { backgroundColor: c.backgroundSecondary }]} onPress={handleShowTxs}>
          <Feather name="list" size={13} color={c.textSecondary} />
          <Text style={[styles.plaidActionText, { color: c.textSecondary }]}>{showTxs ? "Hide" : "Transactions"}</Text>
        </Pressable>
        <Pressable style={[styles.plaidAction, { backgroundColor: "#F4433611" }]} onPress={handleUnlink}>
          <Feather name="link-2" size={13} color="#F44336" />
          <Text style={[styles.plaidActionText, { color: "#F44336" }]}>Unlink</Text>
        </Pressable>
      </View>
    </View>
  );
}

export default function AccountsScreen() {
  const insets = useSafeAreaInsets();
  const colorScheme = useColorScheme();
  const isDark = colorScheme === "dark";
  const c = isDark ? Colors.dark : Colors.light;
  const { accounts, totalBonusEarned, totalBonusPending, totalDeposited } = useAccounts();
  const { availableCredits, totalCredits } = useCredits();
  const { items: plaidItems, isLoading: plaidLoading, linkBank, totalLinkedBalance, directDepositsDetected, bonusesDetected } = usePlaid();
  const [editingAccount, setEditingAccount] = useState<ManagedAccount | null>(null);
  const [screenFocused, setScreenFocused] = useState(false);

  useFocusEffect(
    useCallback(() => {
      setScreenFocused(true);
      return () => setScreenFocused(false);
    }, [])
  );

  const activeItems = plaidItems.filter(i => i.status === "active");

  const listHeader = (
    <>
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

      {/* Plaid Section */}
      <View style={[styles.plaidSection, { backgroundColor: c.background }]}>
        <View style={styles.plaidHeader}>
          <View style={styles.plaidTitleRow}>
            <Feather name="link" size={16} color="#833AB4" />
            <Text style={[styles.plaidTitle, { color: c.text }]}>Plaid Connected Banks</Text>
          </View>
          <View style={styles.plaidHeaderStats}>
            {activeItems.length > 0 && (
              <>
                <View style={styles.plaidStat}>
                  <Text style={[styles.plaidStatVal, { color: "#4CAF50" }]}>${totalLinkedBalance.toLocaleString()}</Text>
                  <Text style={[styles.plaidStatLabel, { color: c.textSecondary }]}>Linked Balance</Text>
                </View>
                <View style={styles.plaidStat}>
                  <Text style={[styles.plaidStatVal, { color: "#2196F3" }]}>{directDepositsDetected}</Text>
                  <Text style={[styles.plaidStatLabel, { color: c.textSecondary }]}>Deposits Tracked</Text>
                </View>
                <View style={styles.plaidStat}>
                  <Text style={[styles.plaidStatVal, { color: "#F77737" }]}>{bonusesDetected}</Text>
                  <Text style={[styles.plaidStatLabel, { color: c.textSecondary }]}>Bonuses Found</Text>
                </View>
              </>
            )}
          </View>
        </View>

        {activeItems.length > 0 && (
          <LiveBalances style={styles.liveBalances} isFocused={screenFocused} />
        )}

        {activeItems.map(item => (
          <PlaidItemCard key={item.itemId} item={item} isDark={isDark} />
        ))}

        <Pressable
          style={styles.linkPlaidBtn}
          onPress={linkBank}
          disabled={plaidLoading}
        >
          <LinearGradient colors={["#833AB4", "#E1306C", "#F77737"]} start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }} style={styles.linkPlaidBtnGrad}>
            {plaidLoading ? (
              <ActivityIndicator color="#fff" size={16} />
            ) : (
              <Feather name="link" size={16} color="#fff" />
            )}
            <Text style={styles.linkPlaidText}>
              {plaidLoading ? "Linking..." : `+ Link Bank Account with Plaid${activeItems.length > 0 ? " (Add Another)" : ""}`}
            </Text>
          </LinearGradient>
        </Pressable>
        <Text style={[styles.plaidDisclaimer, { color: c.textTertiary }]}>
          Plaid securely connects to 12,000+ US banks. Your credentials are never shared.
        </Text>
      </View>

      {accounts.length > 0 && (
        <View style={[styles.sectionHeader, { borderColor: c.cardBorder }]}>
          <Text style={[styles.sectionTitle, { color: c.textSecondary }]}>Tracked Bonuses</Text>
        </View>
      )}
    </>
  );

  if (accounts.length === 0 && activeItems.length === 0) {
    return (
      <View style={[styles.container, { backgroundColor: c.background }]}>
        {listHeader}
        <View style={styles.emptyState}>
          <Feather name="credit-card" size={48} color={c.textTertiary} />
          <Text style={[styles.emptyTitle, { color: c.textSecondary }]}>No tracked bonuses</Text>
          <Text style={[styles.emptySubtitle, { color: c.textTertiary }]}>Find banks in Discover and add them to start tracking bonuses</Text>
          <Pressable style={styles.emptyBtn} onPress={() => router.push("/(tabs)/")}>
            <LinearGradient colors={["#833AB4", "#E1306C"]} start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }} style={styles.emptyBtnGrad}>
              <Feather name="search" size={16} color="#fff" />
              <Text style={styles.emptyBtnText}>Discover Banks</Text>
            </LinearGradient>
          </Pressable>
        </View>
        <EditAccountModal
          account={editingAccount}
          visible={!!editingAccount}
          onClose={() => setEditingAccount(null)}
        />
      </View>
    );
  }

  return (
    <View style={[styles.container, { backgroundColor: c.background }]}>
      <FlatList
        data={accounts}
        keyExtractor={a => a.id}
        ListHeaderComponent={listHeader}
        renderItem={({ item }) => <AccountCard account={item} onEdit={setEditingAccount} />}
        contentContainerStyle={{ paddingBottom: insets.bottom + (Platform.OS === "web" ? 34 : 80) }}
        showsVerticalScrollIndicator={false}
      />
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
  sectionHeader: { paddingHorizontal: 16, paddingVertical: 10, borderBottomWidth: 1 },
  sectionTitle: { fontSize: 13, fontFamily: "Inter_600SemiBold", textTransform: "uppercase", letterSpacing: 0.5 },
  plaidSection: { padding: 16, gap: 12 },
  plaidHeader: { gap: 8 },
  plaidTitleRow: { flexDirection: "row", alignItems: "center", gap: 8 },
  plaidTitle: { fontSize: 16, fontFamily: "Inter_600SemiBold" },
  plaidHeaderStats: { flexDirection: "row", gap: 12 },
  plaidStat: { flex: 1, alignItems: "center" },
  plaidStatVal: { fontSize: 16, fontFamily: "Inter_700Bold" },
  plaidStatLabel: { fontSize: 10, fontFamily: "Inter_400Regular", marginTop: 2 },
  plaidCard: { borderRadius: 16, borderWidth: 1, padding: 14, gap: 12 },
  plaidCardTop: { flexDirection: "row", alignItems: "center", gap: 10 },
  plaidBankIcon: { width: 42, height: 42, borderRadius: 12, alignItems: "center", justifyContent: "center" },
  plaidBankIconText: { fontSize: 18, fontFamily: "Inter_700Bold", color: "#fff" },
  plaidBankName: { fontSize: 15, fontFamily: "Inter_600SemiBold" },
  plaidBankSub: { fontSize: 12, fontFamily: "Inter_400Regular", marginTop: 2 },
  plaidBalance: { fontSize: 18, fontFamily: "Inter_700Bold" },
  plaidBalanceSub: { fontSize: 11, fontFamily: "Inter_400Regular", marginTop: 1 },
  plaidAccounts: { gap: 6 },
  plaidAccountRow: { flexDirection: "row", alignItems: "center", gap: 8, paddingVertical: 6, borderTopWidth: 1 },
  plaidAccountDot: { width: 8, height: 8, borderRadius: 4 },
  plaidAccountName: { flex: 1, fontSize: 13, fontFamily: "Inter_400Regular" },
  plaidAccountMask: { fontSize: 12, fontFamily: "Inter_400Regular" },
  plaidAccountBal: { fontSize: 14, fontFamily: "Inter_600SemiBold" },
  txSection: { borderTopWidth: 1, paddingTop: 10, gap: 8 },
  txStats: { flexDirection: "row", gap: 8, marginBottom: 4 },
  txStatBox: { flex: 1, flexDirection: "row", alignItems: "center", gap: 6, padding: 8, borderRadius: 10 },
  txStatVal: { fontSize: 14, fontFamily: "Inter_700Bold" },
  txStatLabel: { fontSize: 10, fontFamily: "Inter_400Regular", flex: 1 },
  txRow: { flexDirection: "row", alignItems: "center", paddingVertical: 6, borderTopWidth: 1 },
  txName: { fontSize: 13, fontFamily: "Inter_400Regular" },
  txDate: { fontSize: 11, fontFamily: "Inter_400Regular", marginTop: 2 },
  txAmount: { fontSize: 13, fontFamily: "Inter_600SemiBold" },
  plaidCardActions: { flexDirection: "row", gap: 8 },
  plaidAction: { flex: 1, flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 5, paddingVertical: 8, borderRadius: 10 },
  plaidActionText: { fontSize: 12, fontFamily: "Inter_600SemiBold" },
  linkPlaidBtn: { overflow: "hidden", borderRadius: 14 },
  linkPlaidBtnGrad: { flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 10, paddingVertical: 14, paddingHorizontal: 20 },
  linkPlaidText: { fontSize: 15, fontFamily: "Inter_600SemiBold", color: "#fff" },
  plaidDisclaimer: { fontSize: 11, fontFamily: "Inter_400Regular", textAlign: "center", lineHeight: 16 },
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
  editErrText: { fontSize: 12, fontFamily: "Inter_400Regular", color: "#F44336", marginTop: 4 },
  routingCountEdit: { fontSize: 12, fontFamily: "Inter_400Regular", textAlign: "right", marginTop: 2 },
  liveBalances: { marginBottom: 4 },
});
