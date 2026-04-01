import { Feather } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";
import { LinearGradient } from "expo-linear-gradient";
import { router, useFocusEffect } from "expo-router";
import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  ActivityIndicator,
  FlatList,
  Linking,
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
import AutopayModal, { calcAutopay } from "@/components/AutopayModal";
import ROICCalculator from "@/components/ROICCalculator";
import LiveBalances from "@/components/LiveBalances";
import { usePlaid } from "@/context/PlaidContext";

interface DoCBonus {
  id: number;
  title: string;
  link: string;
  description?: string;
  bankName?: string;
  bonusAmount?: number;
  pubDate?: string;
  offerLink?: string;
  docPostLink?: string;
  pullType?: string;
  ccFunding?: string;
  directDepositInfo?: string;
  section?: string;
  rank?: number;
  nationwide?: boolean;
  stateRestriction?: string;
}

function useDoCBonuses() {
  const [bonuses, setBonuses] = useState<DoCBonus[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const domain = process.env.EXPO_PUBLIC_DOMAIN;
    const url = domain ? `https://${domain}/api/bonuses/doc` : "http://localhost:8080/api/bonuses/doc";
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), 15000);
    setLoading(true);
    fetch(url, { signal: controller.signal })
      .then(r => r.json())
      .then(data => setBonuses(data.bonuses ?? []))
      .catch(() => {})
      .finally(() => { clearTimeout(timer); setLoading(false); });
    return () => { clearTimeout(timer); controller.abort(); };
  }, []);

  return { bonuses, loading };
}

const SECTION_LABELS: Record<string, string> = {
  checking: "Checking",
  savings: "Savings",
  business: "Business",
  state: "State-Only",
  regional: "Regional",
};

function DoCBonusCard({ bonus, isDark }: { bonus: DoCBonus; isDark: boolean }) {
  const c = isDark ? Colors.dark : Colors.light;
  const [autopayVisible, setAutopayVisible] = useState(false);
  const amount = bonus.bonusAmount;
  const isSoft = bonus.pullType === "soft";
  const needsDD = bonus.directDepositInfo && !bonus.directDepositInfo.toLowerCase().includes("not required");
  const sectionLabel = bonus.section ? SECTION_LABELS[bonus.section] : null;
  const targetUrl = bonus.offerLink ?? bonus.link;

  // ROIC/APY — only when there's a bonus amount and no hard monthly minimum
  const roic = amount && amount > 0 ? calcAutopay(amount) : null;

  const handleAutopay = () => {
    if (Platform.OS !== "web") Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    setAutopayVisible(true);
  };

  return (
    <>
      <Pressable
        style={[styles.docCard, { backgroundColor: c.card, borderColor: c.cardBorder }]}
        onPress={() => Linking.openURL(targetUrl).catch(() => {})}
      >
        <LinearGradient colors={["#833AB4", "#E1306C"]} style={styles.docCardAccentBar} start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }} />
        <View style={styles.docCardTop}>
          <View style={styles.docAmountCol}>
            {amount ? (
              <>
                <Text style={styles.docAmountVal}>${amount.toLocaleString()}</Text>
                <Text style={[styles.docAmountLabel, { color: c.textSecondary }]}>bonus</Text>
              </>
            ) : (
              <Feather name="gift" size={20} color="#833AB4" />
            )}
          </View>
          <View style={{ flex: 1, gap: 3 }}>
            <Text style={[styles.docCardTitle, { color: c.text }]} numberOfLines={2}>{bonus.bankName ?? bonus.title}</Text>
            {sectionLabel && (
              <Text style={[styles.docSectionTag, { color: "#833AB4" }]}>{sectionLabel} Account</Text>
            )}
          </View>
          {/* Autopay button — right side */}
          <View style={{ gap: 6, alignItems: "flex-end" }}>
            <Pressable
              onPress={e => { e.stopPropagation(); handleAutopay(); }}
              style={styles.autopayBtn}
              hitSlop={8}
            >
              <LinearGradient colors={["#833AB4", "#E1306C"]} style={styles.autopayBtnGrad} start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }}>
                <Feather name="zap" size={11} color="#fff" />
                <Text style={styles.autopayBtnText}>Autopay</Text>
              </LinearGradient>
            </Pressable>
            <Feather name="external-link" size={13} color={c.textTertiary} />
          </View>
        </View>

        {bonus.description ? (
          <Text style={[styles.docCardDesc, { color: c.textSecondary }]} numberOfLines={2}>{bonus.description}</Text>
        ) : null}

        {/* ROIC / APY strip — only for offers with a dollar amount */}
        {roic && (
          <View style={[styles.roicStrip, { backgroundColor: isDark ? "#ffffff08" : "#f5f0ff" }]}>
            <View style={styles.roicStat}>
              <Text style={styles.roicVal}>${roic.ddAmount}</Text>
              <Text style={[styles.roicLabel, { color: c.textTertiary }]}>DD/cycle</Text>
            </View>
            <View style={[styles.roicDivider, { backgroundColor: c.separator }]} />
            <View style={styles.roicStat}>
              <Text style={[styles.roicVal, { color: "#833AB4" }]}>{roic.apy1x.toLocaleString()}%</Text>
              <Text style={[styles.roicLabel, { color: c.textTertiary }]}>1×/mo APY</Text>
            </View>
            <View style={[styles.roicDivider, { backgroundColor: c.separator }]} />
            <View style={styles.roicStat}>
              <Text style={[styles.roicVal, { color: "#E1306C" }]}>{roic.apy3x.toLocaleString()}%</Text>
              <Text style={[styles.roicLabel, { color: c.textTertiary }]}>3×/mo APY</Text>
            </View>
            <View style={[styles.roicDivider, { backgroundColor: c.separator }]} />
            <View style={styles.roicStat}>
              <Text style={[styles.roicVal, { color: "#F77737" }]}>${roic.chargeAmount}</Text>
              <Text style={[styles.roicLabel, { color: c.textTertiary }]}>+3% fee</Text>
            </View>
          </View>
        )}

        <View style={styles.docBadgeRow}>
          {bonus.pullType && (
            <View style={[styles.docPillBadge, { backgroundColor: isSoft ? "#4CAF5020" : "#F4433620" }]}>
              <Feather name={isSoft ? "check-circle" : "alert-circle"} size={10} color={isSoft ? "#4CAF50" : "#F44336"} />
              <Text style={[styles.docPillText, { color: isSoft ? "#4CAF50" : "#F44336" }]}>{isSoft ? "Soft Pull" : "Hard Pull"}</Text>
            </View>
          )}
          {needsDD ? (
            <View style={[styles.docPillBadge, { backgroundColor: "#FF980020" }]}>
              <Feather name="arrow-down-circle" size={10} color="#FF9800" />
              <Text style={[styles.docPillText, { color: "#FF9800" }]}>DD Required</Text>
            </View>
          ) : bonus.directDepositInfo ? (
            <View style={[styles.docPillBadge, { backgroundColor: "#4CAF5015" }]}>
              <Feather name="check" size={10} color="#4CAF50" />
              <Text style={[styles.docPillText, { color: "#4CAF50" }]}>No DD</Text>
            </View>
          ) : null}
          {bonus.stateRestriction && (
            <View style={[styles.docPillBadge, { backgroundColor: "#9C27B015" }]}>
              <Feather name="map-pin" size={10} color="#9C27B0" />
              <Text style={[styles.docPillText, { color: "#9C27B0" }]} numberOfLines={1}>{bonus.stateRestriction}</Text>
            </View>
          )}
        </View>

        <View style={styles.docCardFooter}>
          <View style={[styles.docSourceBadge, { backgroundColor: "#833AB415" }]}>
            <Text style={[styles.docSourceText, { color: "#833AB4" }]}>DoctorOfCredit</Text>
          </View>
          {bonus.rank != null && (
            <Text style={[styles.docAge, { color: c.textTertiary }]}>#{bonus.rank + 1} ranked</Text>
          )}
        </View>
      </Pressable>

      {autopayVisible && (
        <AutopayModal
          visible={autopayVisible}
          onClose={() => setAutopayVisible(false)}
          bankName={bonus.bankName ?? bonus.title}
          bonusAmount={amount ?? 0}
          offerLink={bonus.offerLink ?? bonus.link}
          bonusGuid={String(bonus.id)}
          section={bonus.section}
        />
      )}
    </>
  );
}

type FilterType = "all" | "no-ews" | "no-minimum" | "no-biometrics";
type SortType = "bonus" | "percentage" | "time" | "rating";
type DocSortType = "rank" | "bonus" | "soft" | "nodd" | "apy";

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

const DOC_SORT_OPTIONS: { key: DocSortType; label: string; icon: string }[] = [
  { key: "rank",  label: "DoC Rank",   icon: "award" },
  { key: "bonus", label: "Bonus $",    icon: "dollar-sign" },
  { key: "apy",   label: "APY %",      icon: "trending-up" },
  { key: "soft",  label: "Soft Pull",  icon: "shield" },
  { key: "nodd",  label: "No DD",      icon: "check-circle" },
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
  const [docSort, setDocSort] = useState<DocSortType>("rank");
  const [calcVisible, setCalcVisible] = useState(false);
  const { bonuses: docBonuses, loading: docLoading } = useDoCBonuses();
  const { items: plaidItems } = usePlaid();
  const hasLinkedAccounts = plaidItems.some(i => i.status === "active");
  const [screenFocused, setScreenFocused] = useState(false);

  useFocusEffect(
    useCallback(() => {
      setScreenFocused(true);
      return () => setScreenFocused(false);
    }, [])
  );

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

  const sortedDocBonuses = useMemo(() => {
    const list = [...docBonuses];
    switch (docSort) {
      case "bonus":
        return list.sort((a, b) => (b.bonusAmount ?? 0) - (a.bonusAmount ?? 0));
      case "apy":
        // Sort by 1×/mo APY descending (bonus/ddAmount ratio × 365/15)
        return list.sort((a, b) => {
          const apyA = a.bonusAmount ? (a.bonusAmount / Math.ceil(a.bonusAmount / 3)) : 0;
          const apyB = b.bonusAmount ? (b.bonusAmount / Math.ceil(b.bonusAmount / 3)) : 0;
          return apyB - apyA;
        });
      case "soft":
        // Soft pull first, then hard, then unknown
        return list.sort((a, b) => {
          const order = (p?: string | null) => p === "soft" ? 0 : p === "hard" ? 1 : 2;
          return order(a.pullType) - order(b.pullType);
        });
      case "nodd":
        // No DD required first
        return list.sort((a, b) => {
          const noDD = (d?: string | null) =>
            d && !d.toLowerCase().includes("not required") ? 1 : 0;
          return noDD(a.directDepositInfo) - noDD(b.directDepositInfo);
        });
      case "rank":
      default:
        return list.sort((a, b) => (a.rank ?? 999) - (b.rank ?? 999));
    }
  }, [docBonuses, docSort]);

  const noEWSCount = BANKS.filter(b => !b.ewsReporting).length;

  return (
    <View style={[styles.container, { backgroundColor: c.background }]}>
      <ROICCalculator visible={calcVisible} onClose={() => setCalcVisible(false)} />
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
          <View style={{ flexDirection: "row", gap: 8 }}>
            <Pressable
              style={[styles.settingsBtn, { backgroundColor: "rgba(255,255,255,0.15)", borderRadius: 10 }]}
              onPress={() => setCalcVisible(true)}
            >
              <Feather name="percent" size={18} color="rgba(255,255,255,0.9)" />
            </Pressable>
            <Pressable
              style={styles.settingsBtn}
              onPress={() => router.push("/settings")}
            >
              <Feather name="settings" size={20} color="rgba(255,255,255,0.9)" />
            </Pressable>
          </View>
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
        ListHeaderComponent={docBonuses.length > 0 || docLoading || hasLinkedAccounts ? (
          <View style={[styles.docSection, { backgroundColor: c.background }]}>
            {hasLinkedAccounts && (
              <LiveBalances style={styles.hubLiveBalances} isFocused={screenFocused} />
            )}
            {(docBonuses.length > 0 || docLoading) && (
            <View style={styles.docSectionHeader}>
              <View style={styles.docSectionTitleRow}>
                <Feather name="zap" size={14} color="#E1306C" />
                <Text style={[styles.docSectionTitle, { color: c.text }]}>Live Deals — Doctor of Credit</Text>
              </View>
              <Text style={[styles.docSectionSub, { color: c.textSecondary }]}>
                {docLoading ? "Loading…" : `${sortedDocBonuses.length} offers`} · Tap to open
              </Text>
            </View>
            )}

            {/* DoC sort chips */}
            {!docLoading && docBonuses.length > 0 && (
              <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.docSortScroll}>
                {DOC_SORT_OPTIONS.map(opt => {
                  const active = docSort === opt.key;
                  return (
                    <Pressable
                      key={opt.key}
                      style={[styles.docSortChip, active && styles.docSortChipActive]}
                      onPress={() => {
                        if (Platform.OS !== "web") Haptics.selectionAsync();
                        setDocSort(opt.key);
                      }}
                    >
                      <Feather name={opt.icon as any} size={10} color={active ? "#fff" : "#833AB4"} />
                      <Text style={[styles.docSortChipText, { color: active ? "#fff" : "#833AB4" }]}>{opt.label}</Text>
                    </Pressable>
                  );
                })}
              </ScrollView>
            )}

            {docLoading ? (
              <View style={styles.docLoading}>
                <ActivityIndicator color="#833AB4" size="small" />
                <Text style={[styles.docLoadingText, { color: c.textSecondary }]}>Fetching live bonuses...</Text>
              </View>
            ) : docBonuses.length > 0 ? (
              <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.docScroll}>
                {sortedDocBonuses.map(b => (
                  <DoCBonusCard key={b.id} bonus={b} isDark={isDark} />
                ))}
              </ScrollView>
            ) : null}
            {(docBonuses.length > 0 || docLoading) && (
              <>
                <View style={[styles.docDivider, { backgroundColor: c.separator }]} />
                <Text style={[styles.allBanksLabel, { color: c.textSecondary }]}>All Banks in Database</Text>
              </>
            )}
          </View>
        ) : null}
        contentContainerStyle={[styles.list, { paddingBottom: insets.bottom + (Platform.OS === "web" ? 34 : 80) }]}
        showsVerticalScrollIndicator={false}
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
  docSection: { paddingTop: 4 },
  docSectionHeader: { paddingHorizontal: 16, paddingTop: 12, paddingBottom: 8 },
  docSectionTitleRow: { flexDirection: "row", alignItems: "center", gap: 6, marginBottom: 2 },
  docSectionTitle: { fontSize: 14, fontFamily: "Inter_600SemiBold" },
  docSectionSub: { fontSize: 11, fontFamily: "Inter_400Regular" },
  docLoading: { flexDirection: "row", alignItems: "center", gap: 10, paddingHorizontal: 16, paddingVertical: 16 },
  docLoadingText: { fontSize: 13, fontFamily: "Inter_400Regular" },
  docScroll: { paddingHorizontal: 16, paddingBottom: 12, gap: 10 },
  docCard: { width: 260, borderRadius: 16, borderWidth: 1, padding: 12, overflow: "hidden", gap: 8 },
  docCardAccentBar: { position: "absolute", top: 0, left: 0, right: 0, height: 3 },
  docCardTop: { flexDirection: "row", alignItems: "flex-start", gap: 10 },
  docAmountCol: { alignItems: "center", minWidth: 48 },
  docAmountVal: { fontSize: 18, fontFamily: "Inter_700Bold", color: "#00C853" },
  docAmountLabel: { fontSize: 9, fontFamily: "Inter_400Regular", marginTop: -2 },
  docCardTitle: { fontSize: 13, fontFamily: "Inter_600SemiBold", lineHeight: 18 },
  docSectionTag: { fontSize: 10, fontFamily: "Inter_600SemiBold" },
  docCardDesc: { fontSize: 11, fontFamily: "Inter_400Regular", lineHeight: 16 },
  docBadgeRow: { flexDirection: "row", flexWrap: "wrap", gap: 4 },
  docPillBadge: { flexDirection: "row", alignItems: "center", gap: 4, paddingHorizontal: 6, paddingVertical: 3, borderRadius: 20 },
  docPillText: { fontSize: 10, fontFamily: "Inter_600SemiBold" },
  docCardFooter: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", marginTop: 2 },
  docSourceBadge: { paddingHorizontal: 6, paddingVertical: 3, borderRadius: 6 },
  docSourceText: { fontSize: 10, fontFamily: "Inter_600SemiBold" },
  docAge: { fontSize: 10, fontFamily: "Inter_400Regular" },
  docDivider: { height: 1, marginHorizontal: 16, marginTop: 4, marginBottom: 12 },
  allBanksLabel: { fontSize: 12, fontFamily: "Inter_600SemiBold", paddingHorizontal: 16, paddingBottom: 4, textTransform: "uppercase", letterSpacing: 0.5 },

  // DoC sort chips
  docSortScroll: { paddingHorizontal: 16, paddingBottom: 6, gap: 6, flexDirection: "row" },
  docSortChip: { flexDirection: "row", alignItems: "center", gap: 4, paddingHorizontal: 10, paddingVertical: 5, borderRadius: 20, borderWidth: 1, borderColor: "#833AB4", backgroundColor: "transparent" },
  docSortChipActive: { backgroundColor: "#833AB4", borderColor: "#833AB4" },
  docSortChipText: { fontSize: 11, fontFamily: "Inter_600SemiBold" },

  // Autopay button
  autopayBtn: { borderRadius: 8, overflow: "hidden" },
  autopayBtnGrad: { flexDirection: "row", alignItems: "center", gap: 4, paddingHorizontal: 8, paddingVertical: 5 },
  autopayBtnText: { fontSize: 10, fontFamily: "Inter_600SemiBold", color: "#fff" },

  // ROIC/APY strip
  roicStrip: { flexDirection: "row", alignItems: "center", borderRadius: 10, paddingVertical: 6, paddingHorizontal: 8, marginTop: 6, marginBottom: 4, gap: 0 },
  roicStat: { flex: 1, alignItems: "center" },
  roicVal: { fontSize: 12, fontFamily: "Inter_700Bold", color: "#333" },
  roicLabel: { fontSize: 9, fontFamily: "Inter_400Regular", marginTop: 1 },
  roicDivider: { width: 1, height: 24 },
  hubLiveBalances: { marginHorizontal: 16, marginBottom: 12 },
});
