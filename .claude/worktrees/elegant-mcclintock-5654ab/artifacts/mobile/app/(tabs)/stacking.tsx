import { Feather } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";
import { LinearGradient } from "expo-linear-gradient";
import React, { useMemo, useState } from "react";
import {
  FlatList,
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
import {
  OFFER_CATEGORIES,
  OfferType,
  StackingPolicy,
  TOP_25_BANKS,
  TopBank,
  getStackingCombos,
} from "@/constants/stacking";

const POLICY_CONFIG: Record<StackingPolicy, { label: string; color: string; icon: string }> = {
  allowed:    { label: "Stacking Allowed",    color: "#4CAF50", icon: "check-circle" },
  restricted: { label: "Restricted",          color: "#FF9800", icon: "alert-triangle" },
  unknown:    { label: "Policy Unknown",       color: "#9E9E9E", icon: "help-circle" },
};

const TYPE_FILTERS: { key: OfferType | "all"; label: string; icon: string }[] = [
  { key: "all",               label: "All Types",          icon: "grid" },
  { key: "personal_checking", label: "Personal Checking",  icon: "credit-card" },
  { key: "personal_savings",  label: "Personal Savings",   icon: "dollar-sign" },
  { key: "business_checking", label: "Business Checking",  icon: "briefcase" },
  { key: "business_savings",  label: "Business Savings",   icon: "trending-up" },
  { key: "credit_card",       label: "Credit Cards",       icon: "award" },
];

const STACKING_FILTER: { key: StackingPolicy | "all"; label: string }[] = [
  { key: "all",        label: "All Banks" },
  { key: "allowed",    label: "Stacking OK" },
  { key: "restricted", label: "Restricted" },
  { key: "unknown",    label: "Unknown" },
];

function offerTypeLabel(type: OfferType): string {
  switch (type) {
    case "personal_checking": return "Personal Chk";
    case "personal_savings":  return "Personal Sav";
    case "business_checking": return "Business Chk";
    case "business_savings":  return "Business Sav";
    case "credit_card":       return "Credit Card";
  }
}

function offerTypeColor(type: OfferType): string {
  switch (type) {
    case "personal_checking": return "#2196F3";
    case "personal_savings":  return "#4CAF50";
    case "business_checking": return "#FF9800";
    case "business_savings":  return "#9C27B0";
    case "credit_card":       return "#E1306C";
  }
}

function BankStackCard({ bank, isDark }: { bank: TopBank; isDark: boolean }) {
  const c = isDark ? Colors.dark : Colors.light;
  const policy = POLICY_CONFIG[bank.stackingPolicy];
  const [expanded, setExpanded] = useState(false);

  const bonuses = [
    { type: "personal_checking" as OfferType, amount: bank.personalCheckingBonus },
    { type: "personal_savings"  as OfferType, amount: bank.personalSavingsBonus },
    { type: "business_checking" as OfferType, amount: bank.businessCheckingBonus },
    { type: "business_savings"  as OfferType, amount: bank.businessSavingsBonus },
    { type: "credit_card"       as OfferType, amount: bank.creditCardBonus },
  ].filter(b => b.amount && b.amount > 0);

  const maxStack = bank.allowedCombinations.reduce((best, combo) => {
    const total = combo.reduce((sum, t) => {
      const bonus = bonuses.find(b => b.type === t);
      return sum + (bonus?.amount ?? 0);
    }, 0);
    return total > best ? total : best;
  }, 0);

  return (
    <Pressable
      style={[styles.bankCard, { backgroundColor: c.card, borderColor: c.cardBorder }]}
      onPress={() => {
        if (Platform.OS !== "web") Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
        setExpanded(v => !v);
      }}
    >
      <View style={styles.bankCardHeader}>
        <View style={[styles.bankLogo, { backgroundColor: bank.logoColor }]}>
          <Text style={styles.bankLogoText}>{bank.name.charAt(0)}</Text>
        </View>
        <View style={{ flex: 1, gap: 3 }}>
          <Text style={[styles.bankName, { color: c.text }]} numberOfLines={1}>{bank.name}</Text>
          <View style={styles.policyRow}>
            <Feather name={policy.icon as any} size={11} color={policy.color} />
            <Text style={[styles.policyLabel, { color: policy.color }]}>{policy.label}</Text>
            <Text style={[styles.rankLabel, { color: c.textTertiary }]}>#{bank.assetsRankApprox} by assets</Text>
          </View>
        </View>
        {maxStack > 0 && (
          <View style={styles.maxStackBadge}>
            <Text style={styles.maxStackLabel}>Up to</Text>
            <Text style={styles.maxStackValue}>${maxStack}</Text>
          </View>
        )}
      </View>

      <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginTop: 10 }}>
        <View style={styles.bonusPillRow}>
          {bonuses.map(b => (
            <View key={b.type} style={[styles.bonusPill, { backgroundColor: offerTypeColor(b.type) + "22" }]}>
              <Text style={[styles.bonusPillType, { color: offerTypeColor(b.type) }]}>{offerTypeLabel(b.type)}</Text>
              <Text style={[styles.bonusPillAmt, { color: offerTypeColor(b.type) }]}>${b.amount}</Text>
            </View>
          ))}
        </View>
      </ScrollView>

      {expanded && (
        <View style={[styles.expandedSection, { borderColor: c.separator }]}>
          {bank.allowedCombinations.length > 0 ? (
            <>
              <Text style={[styles.combosTitle, { color: c.textSecondary }]}>Stackable Combos:</Text>
              {bank.allowedCombinations.map((combo, i) => {
                const total = combo.reduce((sum, t) => {
                  const bonus = bonuses.find(b => b.type === t);
                  return sum + (bonus?.amount ?? 0);
                }, 0);
                return (
                  <View key={i} style={[styles.comboRow, { backgroundColor: isDark ? "#ffffff08" : "#f8f9fa" }]}>
                    <View style={{ flexDirection: "row", flexWrap: "wrap", gap: 4, flex: 1 }}>
                      {combo.map(t => (
                        <View key={t} style={[styles.comboTypePill, { backgroundColor: offerTypeColor(t) + "22" }]}>
                          <Text style={[styles.comboTypePillText, { color: offerTypeColor(t) }]}>{offerTypeLabel(t)}</Text>
                        </View>
                      ))}
                    </View>
                    <Text style={[styles.comboTotal, { color: "#4CAF50" }]}>${total}</Text>
                  </View>
                );
              })}
            </>
          ) : (
            <Text style={[styles.noComboText, { color: c.textSecondary }]}>No confirmed stackable combinations for this bank.</Text>
          )}
          <Text style={[styles.bankNotes, { color: c.textTertiary }]}>{bank.notes}</Text>
        </View>
      )}

      <View style={[styles.expandHint, { borderColor: c.separator }]}>
        <Feather name={expanded ? "chevron-up" : "chevron-down"} size={14} color={c.textTertiary} />
        <Text style={[styles.expandHintText, { color: c.textTertiary }]}>{expanded ? "Collapse" : "View combos & details"}</Text>
      </View>
    </Pressable>
  );
}

function ComboCard({ combo, isDark }: { combo: ReturnType<typeof getStackingCombos>[number]; isDark: boolean }) {
  const c = isDark ? Colors.dark : Colors.light;
  return (
    <View style={[styles.comboCard, { backgroundColor: c.card, borderColor: c.cardBorder }]}>
      <LinearGradient colors={["#4CAF50", "#2196F3"]} style={styles.comboAccentBar} start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }} />
      <View style={styles.comboCardTop}>
        <View style={[styles.comboCardLogo, { backgroundColor: combo.logoColor }]}>
          <Text style={styles.comboCardLogoText}>{combo.bankName.charAt(0)}</Text>
        </View>
        <View style={{ flex: 1, gap: 2 }}>
          <Text style={[styles.comboCardBank, { color: c.text }]} numberOfLines={1}>{combo.bankName}</Text>
          <View style={{ flexDirection: "row", flexWrap: "wrap", gap: 3 }}>
            {combo.types.map(t => (
              <Text key={t} style={[styles.comboCardType, { color: offerTypeColor(t) }]}>{offerTypeLabel(t)}</Text>
            ))}
          </View>
        </View>
        <View style={styles.comboCardAmt}>
          <Text style={styles.comboCardAmtVal}>${combo.totalBonus.toLocaleString()}</Text>
          <Text style={[styles.comboCardAmtLabel, { color: c.textTertiary }]}>stacked</Text>
        </View>
      </View>
    </View>
  );
}

type ViewMode = "banks" | "combos";

export default function StackingScreen() {
  const insets = useSafeAreaInsets();
  const colorScheme = useColorScheme();
  const isDark = colorScheme === "dark";
  const c = isDark ? Colors.dark : Colors.light;

  const [viewMode, setViewMode] = useState<ViewMode>("banks");
  const [stackFilter, setStackFilter] = useState<StackingPolicy | "all">("all");
  const [typeFilter, setTypeFilter]   = useState<OfferType | "all">("all");
  const [bankSearch, setBankSearch]   = useState("");
  const [minBonus, setMinBonus]       = useState(0);
  const [maxBonus, setMaxBonus]       = useState(0);

  const allCombos = useMemo(() => getStackingCombos(), []);

  function bankMaxStack(b: typeof TOP_25_BANKS[number]): number {
    return b.allowedCombinations.reduce((best, combo) => {
      const total = combo.reduce((sum, t) => {
        const bonus =
          t === "personal_checking" ? (b.personalCheckingBonus ?? 0) :
          t === "personal_savings"  ? (b.personalSavingsBonus  ?? 0) :
          t === "business_checking" ? (b.businessCheckingBonus ?? 0) :
          t === "business_savings"  ? (b.businessSavingsBonus  ?? 0) :
          (b.creditCardBonus ?? 0);
        return sum + bonus;
      }, 0);
      return total > best ? total : best;
    }, 0);
  }

  const filteredBanks = useMemo(() => {
    let result = [...TOP_25_BANKS];
    if (stackFilter !== "all") result = result.filter(b => b.stackingPolicy === stackFilter);
    if (typeFilter !== "all") {
      result = result.filter(b =>
        b.allowedCombinations.some(combo => combo.includes(typeFilter)) ||
        (typeFilter === "personal_checking" && b.personalCheckingBonus) ||
        (typeFilter === "personal_savings"  && b.personalSavingsBonus) ||
        (typeFilter === "business_checking" && b.businessCheckingBonus) ||
        (typeFilter === "business_savings"  && b.businessSavingsBonus) ||
        (typeFilter === "credit_card"       && b.creditCardBonus)
      );
    }
    if (bankSearch.trim()) {
      const q = bankSearch.toLowerCase();
      result = result.filter(b => b.name.toLowerCase().includes(q));
    }
    if (minBonus > 0) {
      result = result.filter(b => bankMaxStack(b) >= minBonus);
    }
    if (maxBonus > 0) {
      result = result.filter(b => {
        const ms = bankMaxStack(b);
        return ms === 0 || ms <= maxBonus;
      });
    }
    return result;
  }, [stackFilter, typeFilter, bankSearch, minBonus, maxBonus]);

  const filteredCombos = useMemo(() => {
    let result = [...allCombos];
    if (typeFilter !== "all") result = result.filter(c => c.types.includes(typeFilter));
    if (bankSearch.trim()) {
      const q = bankSearch.toLowerCase();
      result = result.filter(c => c.bankName.toLowerCase().includes(q));
    }
    if (minBonus > 0) result = result.filter(c => c.totalBonus >= minBonus);
    if (maxBonus > 0) result = result.filter(c => c.totalBonus <= maxBonus);
    return result;
  }, [allCombos, typeFilter, bankSearch, minBonus, maxBonus]);

  const allowedCount = TOP_25_BANKS.filter(b => b.stackingPolicy === "allowed").length;
  const restrictedCount = TOP_25_BANKS.filter(b => b.stackingPolicy === "restricted").length;

  const listHeader = (
    <>
      <View style={[styles.header, { paddingTop: insets.top + (Platform.OS === "web" ? 67 : 12) }]}>
        <LinearGradient
          colors={["#4CAF50", "#2196F3", "#9C27B0"]}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 0 }}
          style={StyleSheet.absoluteFill}
        />
        <View style={styles.headerContent}>
          <View>
            <Text style={styles.headerTitle}>Bank Stacking</Text>
            <Text style={styles.headerSub}>Top 25 US banks · stack multiple bonuses</Text>
          </View>
        </View>

        <View style={styles.headerStats}>
          <View style={styles.headerStat}>
            <Text style={styles.headerStatVal}>{allowedCount}</Text>
            <Text style={styles.headerStatLabel}>Stack Allowed</Text>
          </View>
          <View style={[styles.headerStatDivider]} />
          <View style={styles.headerStat}>
            <Text style={styles.headerStatVal}>{restrictedCount}</Text>
            <Text style={styles.headerStatLabel}>Restricted</Text>
          </View>
          <View style={[styles.headerStatDivider]} />
          <View style={styles.headerStat}>
            <Text style={styles.headerStatVal}>{allCombos.length}</Text>
            <Text style={styles.headerStatLabel}>Combos Found</Text>
          </View>
        </View>

        {/* Bank search */}
        <View style={[styles.searchBar, { backgroundColor: "rgba(255,255,255,0.15)" }]}>
          <Feather name="search" size={14} color="rgba(255,255,255,0.7)" />
          <TextInput
            style={[styles.searchInput, { color: "#fff" }]}
            placeholder="Search banks..."
            placeholderTextColor="rgba(255,255,255,0.5)"
            value={bankSearch}
            onChangeText={setBankSearch}
          />
          {bankSearch.length > 0 && (
            <Pressable onPress={() => setBankSearch("")}>
              <Feather name="x-circle" size={14} color="rgba(255,255,255,0.7)" />
            </Pressable>
          )}
        </View>

        {/* Min / Max bonus row */}
        <View style={styles.bonusRangeRow}>
          <Feather name="filter" size={13} color="rgba(255,255,255,0.7)" />
          <Text style={styles.bonusRangeLabel}>Min $</Text>
          <TextInput
            style={styles.bonusRangeInput}
            placeholder="0"
            placeholderTextColor="rgba(255,255,255,0.5)"
            value={minBonus > 0 ? String(minBonus) : ""}
            onChangeText={t => setMinBonus(parseInt(t.replace(/\D/g, "")) || 0)}
            keyboardType="numeric"
          />
          <Text style={styles.bonusRangeLabel}>Max $</Text>
          <TextInput
            style={styles.bonusRangeInput}
            placeholder="Any"
            placeholderTextColor="rgba(255,255,255,0.5)"
            value={maxBonus > 0 ? String(maxBonus) : ""}
            onChangeText={t => setMaxBonus(parseInt(t.replace(/\D/g, "")) || 0)}
            keyboardType="numeric"
          />
        </View>
      </View>

      {/* View mode toggle */}
      <View style={[styles.modeToggle, { backgroundColor: c.backgroundSecondary, borderColor: c.cardBorder }]}>
        {(["banks", "combos"] as ViewMode[]).map(mode => (
          <Pressable
            key={mode}
            style={[styles.modeBtn, viewMode === mode && styles.modeBtnActive]}
            onPress={() => {
              if (Platform.OS !== "web") Haptics.selectionAsync();
              setViewMode(mode);
            }}
          >
            <Feather
              name={mode === "banks" ? "list" : "layers"}
              size={14}
              color={viewMode === mode ? "#fff" : c.textSecondary}
            />
            <Text style={[styles.modeBtnText, { color: viewMode === mode ? "#fff" : c.textSecondary }]}>
              {mode === "banks" ? "Banks" : "Top Combos"}
            </Text>
          </Pressable>
        ))}
      </View>

      {/* Stacking policy filter (banks mode only) */}
      {viewMode === "banks" && (
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.filterScroll}>
          {STACKING_FILTER.map(f => (
            <Pressable
              key={f.key}
              style={[
                styles.filterChip,
                stackFilter === f.key
                  ? { backgroundColor: "#4CAF50" }
                  : { backgroundColor: c.backgroundSecondary, borderColor: c.cardBorder, borderWidth: 1 },
              ]}
              onPress={() => {
                if (Platform.OS !== "web") Haptics.selectionAsync();
                setStackFilter(f.key);
              }}
            >
              <Text style={[styles.filterChipText, { color: stackFilter === f.key ? "#fff" : c.textSecondary }]}>{f.label}</Text>
            </Pressable>
          ))}
        </ScrollView>
      )}

      {/* Offer type filter */}
      <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.filterScroll}>
        {TYPE_FILTERS.map(f => (
          <Pressable
            key={f.key}
            style={[
              styles.filterChip,
              typeFilter === f.key
                ? { backgroundColor: "#E1306C" }
                : { backgroundColor: c.backgroundSecondary, borderColor: c.cardBorder, borderWidth: 1 },
            ]}
            onPress={() => {
              if (Platform.OS !== "web") Haptics.selectionAsync();
              setTypeFilter(f.key);
            }}
          >
            <Feather name={f.icon as any} size={12} color={typeFilter === f.key ? "#fff" : c.textSecondary} />
            <Text style={[styles.filterChipText, { color: typeFilter === f.key ? "#fff" : c.textSecondary }]}>{f.label}</Text>
          </Pressable>
        ))}
      </ScrollView>

      {/* Min bonus quick filter */}
      <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.filterScroll}>
        {[0, 200, 400, 600, 1000].map(amt => (
          <Pressable
            key={amt}
            style={[
              styles.filterChip,
              minBonus === amt
                ? { backgroundColor: "#9C27B0" }
                : { backgroundColor: c.backgroundSecondary, borderColor: c.cardBorder, borderWidth: 1 },
            ]}
            onPress={() => {
              if (Platform.OS !== "web") Haptics.selectionAsync();
              setMinBonus(amt);
            }}
          >
            <Text style={[styles.filterChipText, { color: minBonus === amt ? "#fff" : c.textSecondary }]}>
              {amt === 0 ? "Any Bonus" : `$${amt}+`}
            </Text>
          </Pressable>
        ))}
      </ScrollView>

      <View style={[styles.resultsRow, { borderColor: c.separator }]}>
        <Text style={[styles.resultsText, { color: c.textTertiary }]}>
          {viewMode === "banks"
            ? `${filteredBanks.length} bank${filteredBanks.length !== 1 ? "s" : ""}`
            : `${filteredCombos.length} combo${filteredCombos.length !== 1 ? "s" : ""} · sorted by total earnings`}
        </Text>
      </View>
    </>
  );

  if (viewMode === "banks") {
    return (
      <View style={[styles.container, { backgroundColor: c.background }]}>
        <FlatList
          data={filteredBanks}
          keyExtractor={b => b.id}
          ListHeaderComponent={listHeader}
          renderItem={({ item }) => <BankStackCard bank={item} isDark={isDark} />}
          contentContainerStyle={{ paddingBottom: insets.bottom + (Platform.OS === "web" ? 34 : 80) }}
          showsVerticalScrollIndicator={false}
        />
      </View>
    );
  }

  return (
    <View style={[styles.container, { backgroundColor: c.background }]}>
      <FlatList
        data={filteredCombos}
        keyExtractor={(_, i) => String(i)}
        ListHeaderComponent={listHeader}
        renderItem={({ item }) => <ComboCard combo={item} isDark={isDark} />}
        contentContainerStyle={{ paddingBottom: insets.bottom + (Platform.OS === "web" ? 34 : 80) }}
        showsVerticalScrollIndicator={false}
        ListEmptyComponent={
          <View style={styles.emptyState}>
            <Feather name="layers" size={40} color={c.textTertiary} />
            <Text style={[styles.emptyText, { color: c.textSecondary }]}>No stacking combos match your filters</Text>
          </View>
        }
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },

  header: {
    paddingHorizontal: 20,
    paddingBottom: 20,
    position: "relative",
  },
  headerContent: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
    marginBottom: 16,
  },
  headerTitle: { fontSize: 26, fontFamily: "Inter_700Bold", color: "#fff" },
  headerSub: { fontSize: 13, color: "rgba(255,255,255,0.75)", marginTop: 2, fontFamily: "Inter_400Regular" },

  headerStats: {
    flexDirection: "row",
    backgroundColor: "rgba(0,0,0,0.15)",
    borderRadius: 14,
    padding: 14,
    gap: 0,
  },
  headerStat: { flex: 1, alignItems: "center" },
  headerStatVal: { fontSize: 20, fontFamily: "Inter_700Bold", color: "#fff" },
  headerStatLabel: { fontSize: 11, color: "rgba(255,255,255,0.7)", marginTop: 2, fontFamily: "Inter_400Regular" },
  headerStatDivider: { width: 1, backgroundColor: "rgba(255,255,255,0.2)", marginHorizontal: 8 },

  modeToggle: {
    flexDirection: "row",
    margin: 16,
    borderRadius: 12,
    borderWidth: 1,
    overflow: "hidden",
  },
  modeBtn: { flex: 1, flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 6, paddingVertical: 10 },
  modeBtnActive: { backgroundColor: "#4CAF50" },
  modeBtnText: { fontSize: 13, fontFamily: "Inter_600SemiBold" },

  searchBar: { flexDirection: "row", alignItems: "center", gap: 8, paddingHorizontal: 12, paddingVertical: 9, borderRadius: 12, marginTop: 12 },
  searchInput: { flex: 1, fontSize: 14, fontFamily: "Inter_400Regular" },
  bonusRangeRow: { flexDirection: "row", alignItems: "center", gap: 8, marginTop: 8 },
  bonusRangeLabel: { fontSize: 12, fontFamily: "Inter_600SemiBold", color: "rgba(255,255,255,0.8)" },
  bonusRangeInput: { fontSize: 13, fontFamily: "Inter_600SemiBold", color: "#fff", minWidth: 54, borderBottomWidth: 1, borderBottomColor: "rgba(255,255,255,0.4)", paddingBottom: 2 },
  filterScroll: { paddingHorizontal: 16, paddingBottom: 8, gap: 8 },
  filterChip: {
    flexDirection: "row",
    alignItems: "center",
    gap: 5,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
  },
  filterChipText: { fontSize: 12, fontFamily: "Inter_600SemiBold" },

  resultsRow: { paddingHorizontal: 16, paddingVertical: 8, borderBottomWidth: StyleSheet.hairlineWidth },
  resultsText: { fontSize: 12, fontFamily: "Inter_400Regular" },

  bankCard: {
    marginHorizontal: 16,
    marginBottom: 12,
    borderRadius: 16,
    borderWidth: 1,
    padding: 14,
    overflow: "hidden",
  },
  bankCardHeader: { flexDirection: "row", alignItems: "center", gap: 10 },
  bankLogo: {
    width: 40,
    height: 40,
    borderRadius: 10,
    alignItems: "center",
    justifyContent: "center",
  },
  bankLogoText: { color: "#fff", fontFamily: "Inter_700Bold", fontSize: 16 },
  bankName: { fontSize: 14, fontFamily: "Inter_700Bold" },
  policyRow: { flexDirection: "row", alignItems: "center", gap: 4 },
  policyLabel: { fontSize: 11, fontFamily: "Inter_600SemiBold" },
  rankLabel: { fontSize: 10, fontFamily: "Inter_400Regular", marginLeft: 6 },

  maxStackBadge: { alignItems: "flex-end" },
  maxStackLabel: { fontSize: 9, color: "#4CAF50", fontFamily: "Inter_400Regular" },
  maxStackValue: { fontSize: 18, fontFamily: "Inter_700Bold", color: "#4CAF50" },

  bonusPillRow: { flexDirection: "row", gap: 6 },
  bonusPill: { borderRadius: 8, paddingHorizontal: 8, paddingVertical: 4, alignItems: "center" },
  bonusPillType: { fontSize: 9, fontFamily: "Inter_600SemiBold" },
  bonusPillAmt: { fontSize: 12, fontFamily: "Inter_700Bold", marginTop: 1 },

  expandedSection: { marginTop: 12, borderTopWidth: StyleSheet.hairlineWidth, paddingTop: 12 },
  combosTitle: { fontSize: 12, fontFamily: "Inter_600SemiBold", marginBottom: 8 },
  comboRow: { flexDirection: "row", alignItems: "center", borderRadius: 10, padding: 8, marginBottom: 6 },
  comboTypePill: { borderRadius: 6, paddingHorizontal: 6, paddingVertical: 2 },
  comboTypePillText: { fontSize: 10, fontFamily: "Inter_600SemiBold" },
  comboTotal: { fontSize: 14, fontFamily: "Inter_700Bold", marginLeft: 8 },
  noComboText: { fontSize: 12, fontFamily: "Inter_400Regular", fontStyle: "italic" },
  bankNotes: { fontSize: 11, fontFamily: "Inter_400Regular", marginTop: 8, lineHeight: 16 },

  expandHint: { flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 4, paddingTop: 10, marginTop: 10, borderTopWidth: StyleSheet.hairlineWidth },
  expandHintText: { fontSize: 11, fontFamily: "Inter_400Regular" },

  comboCard: {
    marginHorizontal: 16,
    marginBottom: 10,
    borderRadius: 14,
    borderWidth: 1,
    padding: 12,
    overflow: "hidden",
  },
  comboAccentBar: { position: "absolute", top: 0, left: 0, right: 0, height: 3 },
  comboCardTop: { flexDirection: "row", alignItems: "center", gap: 10, marginTop: 4 },
  comboCardLogo: { width: 36, height: 36, borderRadius: 9, alignItems: "center", justifyContent: "center" },
  comboCardLogoText: { color: "#fff", fontFamily: "Inter_700Bold", fontSize: 14 },
  comboCardBank: { fontSize: 13, fontFamily: "Inter_700Bold" },
  comboCardType: { fontSize: 10, fontFamily: "Inter_600SemiBold" },
  comboCardAmt: { alignItems: "flex-end" },
  comboCardAmtVal: { fontSize: 18, fontFamily: "Inter_700Bold", color: "#4CAF50" },
  comboCardAmtLabel: { fontSize: 10, fontFamily: "Inter_400Regular" },

  emptyState: { alignItems: "center", justifyContent: "center", paddingVertical: 60, gap: 12 },
  emptyText: { fontSize: 14, fontFamily: "Inter_400Regular" },
});
