import { Feather } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";
import { LinearGradient } from "expo-linear-gradient";
import { router } from "expo-router";
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
import { BANKS, Bank, getEWSFreebanks, getNoMinimumBanks, sortByBonusAmount, sortByBonusPercentage, sortByTimeToBonus } from "@/constants/banks";
import { useAccounts } from "@/context/AccountsContext";

type FilterType = "all" | "no-ews" | "no-minimum" | "no-biometrics";
type SortType = "bonus" | "percentage" | "time" | "rating";

const FILTER_CHIPS: { key: FilterType; label: string; icon: string }[] = [
  { key: "all", label: "All Banks", icon: "grid" },
  { key: "no-ews", label: "No EWS", icon: "shield" },
  { key: "no-minimum", label: "No Minimum", icon: "dollar-sign" },
  { key: "no-biometrics", label: "No Biometrics", icon: "eye-off" },
];

const SORT_OPTIONS: { key: SortType; label: string }[] = [
  { key: "bonus", label: "Bonus $" },
  { key: "percentage", label: "Bonus %" },
  { key: "time", label: "Fastest" },
  { key: "rating", label: "Top Rated" },
];

function BankCard({ bank }: { bank: Bank }) {
  const colorScheme = useColorScheme();
  const isDark = colorScheme === "dark";
  const c = isDark ? Colors.dark : Colors.light;
  const { accounts } = useAccounts();
  const isAdded = accounts.some(a => a.bankId === bank.id);

  const handlePress = () => {
    if (Platform.OS !== "web") Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    router.push({ pathname: "/bank/[id]", params: { id: bank.id } });
  };

  return (
    <Pressable
      style={({ pressed }) => [
        styles.card,
        { backgroundColor: c.card, borderColor: c.cardBorder, opacity: pressed ? 0.92 : 1, transform: [{ scale: pressed ? 0.98 : 1 }] }
      ]}
      onPress={handlePress}
    >
      <View style={styles.cardHeader}>
        <View style={[styles.bankLogo, { backgroundColor: bank.logoColor }]}>
          <Text style={styles.bankLogoText}>{bank.name.charAt(0)}</Text>
        </View>
        <View style={styles.cardTitleArea}>
          <Text style={[styles.bankName, { color: c.text }]} numberOfLines={1}>{bank.name}</Text>
          <View style={styles.cardTags}>
            {!bank.ewsReporting && (
              <View style={[styles.tag, { backgroundColor: "#00C85322" }]}>
                <Feather name="shield" size={10} color="#00C853" />
                <Text style={[styles.tagText, { color: "#00C853" }]}>No EWS</Text>
              </View>
            )}
            {bank.noMonthlyMinimum && (
              <View style={[styles.tag, { backgroundColor: "#833AB422" }]}>
                <Feather name="check-circle" size={10} color="#833AB4" />
                <Text style={[styles.tagText, { color: "#833AB4" }]}>No Min</Text>
              </View>
            )}
            {isAdded && (
              <View style={[styles.tag, { backgroundColor: "#E1306C22" }]}>
                <Feather name="check" size={10} color="#E1306C" />
                <Text style={[styles.tagText, { color: "#E1306C" }]}>Added</Text>
              </View>
            )}
          </View>
        </View>
        <View style={styles.bonusAmount}>
          <Text style={styles.bonusValue}>${bank.bonusAmount}</Text>
          <Text style={[styles.bonusLabel, { color: c.textSecondary }]}>bonus</Text>
        </View>
      </View>

      <View style={[styles.cardDivider, { backgroundColor: c.separator }]} />

      <View style={styles.cardStats}>
        <View style={styles.stat}>
          <Text style={[styles.statValue, { color: c.text }]}>${bank.directDepositRequired.toLocaleString()}</Text>
          <Text style={[styles.statLabel, { color: c.textSecondary }]}>DD Required</Text>
        </View>
        <View style={[styles.statDivider, { backgroundColor: c.separator }]} />
        <View style={styles.stat}>
          <Text style={[styles.statValue, { color: c.tintSecondary }]}>{bank.bonusPercentage.toFixed(1)}%</Text>
          <Text style={[styles.statLabel, { color: c.textSecondary }]}>Return</Text>
        </View>
        <View style={[styles.statDivider, { backgroundColor: c.separator }]} />
        <View style={styles.stat}>
          <Text style={[styles.statValue, { color: c.text }]}>{bank.timeToBonus}d</Text>
          <Text style={[styles.statLabel, { color: c.textSecondary }]}>To Bonus</Text>
        </View>
        <View style={[styles.statDivider, { backgroundColor: c.separator }]} />
        <View style={styles.stat}>
          <Text style={[styles.statValue, { color: "#FFB300" }]}>★ {bank.rating}</Text>
          <Text style={[styles.statLabel, { color: c.textSecondary }]}>Rating</Text>
        </View>
      </View>
    </Pressable>
  );
}

export default function DiscoverScreen() {
  const insets = useSafeAreaInsets();
  const colorScheme = useColorScheme();
  const isDark = colorScheme === "dark";
  const c = isDark ? Colors.dark : Colors.light;

  const [search, setSearch] = useState("");
  const [filter, setFilter] = useState<FilterType>("all");
  const [sort, setSort] = useState<SortType>("bonus");
  const [minBonus, setMinBonus] = useState("");

  const banks = useMemo(() => {
    let result = [...BANKS];
    if (filter === "no-ews") result = result.filter(b => !b.ewsReporting);
    else if (filter === "no-minimum") result = result.filter(b => b.noMonthlyMinimum);
    else if (filter === "no-biometrics") result = result.filter(b => !b.requiresBiometrics);

    if (minBonus) result = result.filter(b => b.bonusAmount >= parseInt(minBonus));
    if (search) result = result.filter(b => b.name.toLowerCase().includes(search.toLowerCase()) || b.type.includes(search.toLowerCase()));

    if (sort === "bonus") return sortByBonusAmount(result);
    if (sort === "percentage") return sortByBonusPercentage(result);
    if (sort === "time") return sortByTimeToBonus(result);
    return [...result].sort((a, b) => b.rating - a.rating);
  }, [filter, sort, search, minBonus]);

  const noEWSCount = BANKS.filter(b => !b.ewsReporting).length;

  return (
    <View style={[styles.container, { backgroundColor: c.background }]}>
      <View style={[styles.header, { paddingTop: insets.top + (Platform.OS === "web" ? 67 : 12) }]}>
        <LinearGradient
          colors={["#833AB4", "#E1306C", "#F77737"]}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 0 }}
          style={StyleSheet.absoluteFill}
        />
        <View style={styles.headerContent}>
          <View>
            <Text style={styles.headerTitle}>Discover</Text>
            <Text style={styles.headerSub}>{BANKS.length} banks · {noEWSCount} No-EWS</Text>
          </View>
          <Pressable
            style={styles.settingsBtn}
            onPress={() => router.push("/settings")}
          >
            <Feather name="settings" size={20} color="rgba(255,255,255,0.9)" />
          </Pressable>
        </View>

        <View style={[styles.searchBar, { backgroundColor: "rgba(255,255,255,0.15)" }]}>
          <Feather name="search" size={16} color="rgba(255,255,255,0.7)" />
          <TextInput
            style={[styles.searchInput, { color: "#fff" }]}
            placeholder="Search banks, fintechs..."
            placeholderTextColor="rgba(255,255,255,0.5)"
            value={search}
            onChangeText={setSearch}
          />
          {search.length > 0 && (
            <Pressable onPress={() => setSearch("")}>
              <Feather name="x-circle" size={16} color="rgba(255,255,255,0.7)" />
            </Pressable>
          )}
        </View>

        <View style={styles.minBonusRow}>
          <Feather name="filter" size={14} color="rgba(255,255,255,0.7)" />
          <Text style={styles.minBonusLabel}>Min Bonus:</Text>
          <TextInput
            style={styles.minBonusInput}
            placeholder="$0"
            placeholderTextColor="rgba(255,255,255,0.5)"
            value={minBonus ? `$${minBonus}` : ""}
            onChangeText={t => setMinBonus(t.replace(/\D/g, ""))}
            keyboardType="numeric"
          />
        </View>
      </View>

      <View style={[styles.filterRow]}>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.filterScroll}>
          {FILTER_CHIPS.map(chip => (
            <Pressable
              key={chip.key}
              style={[
                styles.filterChip,
                filter === chip.key
                  ? { backgroundColor: c.tintSecondary }
                  : { backgroundColor: c.backgroundSecondary, borderColor: c.cardBorder, borderWidth: 1 }
              ]}
              onPress={() => {
                if (Platform.OS !== "web") Haptics.selectionAsync();
                setFilter(chip.key);
              }}
            >
              <Feather name={chip.icon as any} size={12} color={filter === chip.key ? "#fff" : c.textSecondary} />
              <Text style={[styles.filterChipText, { color: filter === chip.key ? "#fff" : c.textSecondary }]}>{chip.label}</Text>
            </Pressable>
          ))}
        </ScrollView>
      </View>

      <View style={styles.sortRow}>
        <Text style={[styles.sortLabel, { color: c.textSecondary }]}>Sort:</Text>
        <ScrollView horizontal showsHorizontalScrollIndicator={false}>
          <View style={styles.sortChips}>
            {SORT_OPTIONS.map(opt => (
              <Pressable
                key={opt.key}
                style={[styles.sortChip, sort === opt.key && styles.sortChipActive]}
                onPress={() => setSort(opt.key)}
              >
                <Text style={[styles.sortChipText, { color: sort === opt.key ? "#E1306C" : c.textSecondary }]}>{opt.label}</Text>
              </Pressable>
            ))}
          </View>
        </ScrollView>
        <Text style={[styles.resultCount, { color: c.textTertiary }]}>{banks.length} results</Text>
      </View>

      <FlatList
        data={banks}
        keyExtractor={b => b.id}
        renderItem={({ item }) => <BankCard bank={item} />}
        contentContainerStyle={[styles.list, { paddingBottom: insets.bottom + (Platform.OS === "web" ? 34 : 80) }]}
        showsVerticalScrollIndicator={false}
        scrollEnabled={!!banks.length}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: { paddingHorizontal: 16, paddingBottom: 16 },
  headerContent: { flexDirection: "row", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 12 },
  headerTitle: { fontSize: 28, fontFamily: "Inter_700Bold", color: "#FFFFFF" },
  headerSub: { fontSize: 13, fontFamily: "Inter_400Regular", color: "rgba(255,255,255,0.7)", marginTop: 2 },
  settingsBtn: { width: 36, height: 36, alignItems: "center", justifyContent: "center" },
  searchBar: { flexDirection: "row", alignItems: "center", gap: 8, paddingHorizontal: 14, paddingVertical: 10, borderRadius: 12, marginBottom: 8 },
  searchInput: { flex: 1, fontSize: 15, fontFamily: "Inter_400Regular" },
  minBonusRow: { flexDirection: "row", alignItems: "center", gap: 6 },
  minBonusLabel: { fontSize: 13, fontFamily: "Inter_400Regular", color: "rgba(255,255,255,0.7)" },
  minBonusInput: { fontSize: 13, fontFamily: "Inter_600SemiBold", color: "#fff", minWidth: 60 },
  filterRow: { paddingVertical: 8 },
  filterScroll: { paddingHorizontal: 16, gap: 8 },
  filterChip: { flexDirection: "row", alignItems: "center", gap: 5, paddingHorizontal: 12, paddingVertical: 7, borderRadius: 20 },
  filterChipText: { fontSize: 13, fontFamily: "Inter_600SemiBold" },
  sortRow: { flexDirection: "row", alignItems: "center", paddingHorizontal: 16, paddingBottom: 8 },
  sortLabel: { fontSize: 13, fontFamily: "Inter_400Regular", marginRight: 8 },
  sortChips: { flexDirection: "row", gap: 4 },
  sortChip: { paddingHorizontal: 10, paddingVertical: 4, borderRadius: 8 },
  sortChipActive: { backgroundColor: "#E1306C18" },
  sortChipText: { fontSize: 13, fontFamily: "Inter_600SemiBold" },
  resultCount: { marginLeft: "auto" as any, fontSize: 12, fontFamily: "Inter_400Regular" },
  list: { paddingHorizontal: 16, gap: 12 },
  card: { borderRadius: 16, borderWidth: 1, overflow: "hidden" },
  cardHeader: { flexDirection: "row", alignItems: "center", padding: 14, gap: 12 },
  bankLogo: { width: 44, height: 44, borderRadius: 12, alignItems: "center", justifyContent: "center" },
  bankLogoText: { fontSize: 18, fontFamily: "Inter_700Bold", color: "#fff" },
  cardTitleArea: { flex: 1, gap: 4 },
  bankName: { fontSize: 15, fontFamily: "Inter_600SemiBold" },
  cardTags: { flexDirection: "row", gap: 4, flexWrap: "wrap" },
  tag: { flexDirection: "row", alignItems: "center", gap: 3, paddingHorizontal: 6, paddingVertical: 2, borderRadius: 6 },
  tagText: { fontSize: 10, fontFamily: "Inter_600SemiBold" },
  bonusAmount: { alignItems: "flex-end" },
  bonusValue: { fontSize: 20, fontFamily: "Inter_700Bold", color: "#00C853" },
  bonusLabel: { fontSize: 11, fontFamily: "Inter_400Regular" },
  cardDivider: { height: 1, marginHorizontal: 14 },
  cardStats: { flexDirection: "row", paddingHorizontal: 14, paddingVertical: 10 },
  stat: { flex: 1, alignItems: "center" },
  statValue: { fontSize: 13, fontFamily: "Inter_600SemiBold" },
  statLabel: { fontSize: 10, fontFamily: "Inter_400Regular", marginTop: 2 },
  statDivider: { width: 1, marginVertical: 2 },
});
