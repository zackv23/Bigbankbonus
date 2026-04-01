import { Feather } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import React, { useState } from "react";
import {
  Pressable,
  StyleSheet,
  Text,
  View,
  useColorScheme,
} from "react-native";
import Colors from "@/constants/colors";

interface LeverageProjectionWidgetProps {
  depositAmount?: number;
  stackedOffersCount?: number;
  stackedOffersTotal?: number;
  compact?: boolean;
}

export default function LeverageProjectionWidget({
  depositAmount = 500,
  stackedOffersCount = 5,
  stackedOffersTotal,
  compact = false,
}: LeverageProjectionWidgetProps) {
  const colorScheme = useColorScheme();
  const isDark = colorScheme === "dark";
  const c = isDark ? Colors.dark : Colors.light;
  const [showDisclaimer, setShowDisclaimer] = useState(false);

  // Leverage projection: 10x–20x based on stacked bonus potential
  const minLeverage = 10;
  const maxLeverage = 20;
  const minEarnings = depositAmount * minLeverage;
  const maxEarnings = depositAmount * maxLeverage;

  // If we have real stacked offers total, use that for a realistic projection
  const realisticMin = stackedOffersTotal
    ? Math.min(stackedOffersTotal / 100, minEarnings)  // convert cents to dollars
    : minEarnings;
  const realisticMax = stackedOffersTotal
    ? Math.min((stackedOffersTotal / 100) * 1.5, maxEarnings)
    : maxEarnings;

  const roiMin = Math.round((realisticMin / depositAmount) * 100);
  const roiMax = Math.round((realisticMax / depositAmount) * 100);

  if (compact) {
    return (
      <View style={[s.compactWidget, { backgroundColor: "#833AB410", borderColor: "#833AB430" }]}>
        <LinearGradient colors={["#833AB4", "#E1306C"]} style={s.compactIcon}>
          <Feather name="trending-up" size={14} color="#fff" />
        </LinearGradient>
        <View style={s.compactContent}>
          <Text style={[s.compactTitle, { color: c.text }]}>
            ${depositAmount.toLocaleString()} → ${realisticMin.toLocaleString()}–${realisticMax.toLocaleString()}
          </Text>
          <Text style={[s.compactSub, { color: c.textSecondary }]}>
            {minLeverage}x–{maxLeverage}x leverage potential · {stackedOffersCount} offers stacked
          </Text>
        </View>
      </View>
    );
  }

  return (
    <View style={[s.widget, { backgroundColor: c.card, borderColor: c.cardBorder }]}>
      <LinearGradient
        colors={["#833AB4", "#E1306C", "#F77737"]}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 0 }}
        style={s.header}
      >
        <View style={s.headerRow}>
          <Feather name="trending-up" size={20} color="#fff" />
          <Text style={s.headerTitle}>Leverage Projection</Text>
        </View>
        <Text style={s.headerSub}>
          Your ${depositAmount.toLocaleString()} deposit unlocks stacked bonus potential
        </Text>
      </LinearGradient>

      <View style={s.body}>
        {/* Main projection numbers */}
        <View style={s.projectionRow}>
          <View style={s.projectionLeft}>
            <Text style={[s.depositLabel, { color: c.textSecondary }]}>You Deposit</Text>
            <Text style={[s.depositAmount, { color: c.text }]}>${depositAmount.toLocaleString()}</Text>
          </View>

          <View style={s.arrowContainer}>
            <Feather name="arrow-right" size={18} color="#833AB4" />
          </View>

          <View style={s.projectionRight}>
            <Text style={[s.earningsLabel, { color: c.textSecondary }]}>Potential Earnings</Text>
            <Text style={s.earningsRange}>
              ${realisticMin.toLocaleString()}–${realisticMax.toLocaleString()}
            </Text>
            <Text style={[s.earningsSub, { color: "#4CAF50" }]}>
              {minLeverage}x–{maxLeverage}x leverage
            </Text>
          </View>
        </View>

        {/* Leverage bar visualization */}
        <View style={s.leverageBarContainer}>
          <View style={[s.leverageBarBg, { backgroundColor: c.backgroundTertiary ?? "#f5f5f5" }]}>
            <LinearGradient
              colors={["#833AB4", "#E1306C", "#F77737", "#4CAF50"]}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 0 }}
              style={s.leverageBarFill}
            />
          </View>
          <View style={s.leverageLabels}>
            <Text style={[s.leverageLabelMin, { color: c.textSecondary }]}>1x</Text>
            <Text style={[s.leverageLabelMid, { color: "#833AB4" }]}>{minLeverage}x</Text>
            <Text style={[s.leverageLabelMax, { color: "#4CAF50" }]}>{maxLeverage}x</Text>
          </View>
        </View>

        {/* Offer stack breakdown */}
        <View style={[s.offersBox, { backgroundColor: c.backgroundSecondary ?? "#f9f9f9", borderColor: c.cardBorder }]}>
          <View style={s.offersRow}>
            <View style={s.offerStat}>
              <Text style={[s.offerStatVal, { color: "#833AB4" }]}>{stackedOffersCount}</Text>
              <Text style={[s.offerStatLabel, { color: c.textSecondary }]}>Offers Stacked</Text>
            </View>
            <View style={s.offerDivider} />
            <View style={s.offerStat}>
              <Text style={[s.offerStatVal, { color: "#E1306C" }]}>{roiMin}%–{roiMax}%</Text>
              <Text style={[s.offerStatLabel, { color: c.textSecondary }]}>Potential ROI</Text>
            </View>
            <View style={s.offerDivider} />
            <View style={s.offerStat}>
              <Text style={[s.offerStatVal, { color: "#4CAF50" }]}>Monday</Text>
              <Text style={[s.offerStatLabel, { color: c.textSecondary }]}>ACH Sent</Text>
            </View>
          </View>
        </View>

        {/* How it works */}
        <View style={s.howItWorks}>
          <Text style={[s.howTitle, { color: c.textSecondary }]}>HOW THE LEVERAGE WORKS</Text>
          {[
            { icon: "credit-card", color: "#833AB4", text: `$${depositAmount} charged to your card today` },
            { icon: "send", color: "#E1306C", text: `$${depositAmount} ACH sent to your new bank account next Monday` },
            { icon: "check-circle", color: "#4CAF50", text: "ACH counts as a qualifying direct deposit" },
            { icon: "gift", color: "#F77737", text: `Collect ${stackedOffersCount} stacked bonuses totaling $${realisticMin.toLocaleString()}–$${realisticMax.toLocaleString()}` },
          ].map((item, i) => (
            <View key={i} style={s.howStep}>
              <View style={[s.howDot, { backgroundColor: item.color + "22" }]}>
                <Feather name={item.icon as any} size={13} color={item.color} />
              </View>
              <Text style={[s.howText, { color: c.text }]}>{item.text}</Text>
            </View>
          ))}
        </View>

        {/* Disclaimer toggle */}
        <Pressable style={s.disclaimerToggle} onPress={() => setShowDisclaimer(v => !v)}>
          <Feather name="info" size={13} color={c.textTertiary ?? "#999"} />
          <Text style={[s.disclaimerToggleText, { color: c.textTertiary ?? "#999" }]}>
            {showDisclaimer ? "Hide" : "Show"} Important Disclaimer
          </Text>
        </Pressable>

        {showDisclaimer && (
          <View style={[s.disclaimerBox, { backgroundColor: "#FF980010", borderColor: "#FF980030" }]}>
            <Text style={[s.disclaimerText, { color: c.textSecondary }]}>
              Leverage projections are estimates based on stacked bank bonus offers and are labeled "potential" earnings. 
              Actual bonus payouts depend on individual bank terms, direct deposit qualification rules, and account eligibility. 
              BigBankBonus does not guarantee any specific return or bonus amount. Bank bonuses are subject to change. 
              This is not financial advice. The $99 service fee is non-refundable if the bank bonus is successfully received.
            </Text>
          </View>
        )}
      </View>
    </View>
  );
}

const s = StyleSheet.create({
  widget: { borderRadius: 16, borderWidth: 1, overflow: "hidden" },
  header: { paddingHorizontal: 16, paddingVertical: 14 },
  headerRow: { flexDirection: "row", alignItems: "center", gap: 8, marginBottom: 4 },
  headerTitle: { fontSize: 16, fontFamily: "Inter_700Bold", color: "#fff" },
  headerSub: { fontSize: 12, fontFamily: "Inter_400Regular", color: "rgba(255,255,255,0.8)" },
  body: { padding: 16, gap: 14 },

  projectionRow: { flexDirection: "row", alignItems: "center", gap: 8 },
  projectionLeft: { flex: 1, alignItems: "center" },
  projectionRight: { flex: 2, alignItems: "flex-end" },
  arrowContainer: { padding: 8 },
  depositLabel: { fontSize: 11, fontFamily: "Inter_400Regular", marginBottom: 2 },
  depositAmount: { fontSize: 28, fontFamily: "Inter_700Bold" },
  earningsLabel: { fontSize: 11, fontFamily: "Inter_400Regular", marginBottom: 2 },
  earningsRange: { fontSize: 22, fontFamily: "Inter_700Bold", color: "#4CAF50" },
  earningsSub: { fontSize: 12, fontFamily: "Inter_600SemiBold", marginTop: 2 },

  leverageBarContainer: { gap: 4 },
  leverageBarBg: { height: 8, borderRadius: 4, overflow: "hidden" },
  leverageBarFill: { height: 8, width: "75%", borderRadius: 4 },
  leverageLabels: { flexDirection: "row", justifyContent: "space-between" },
  leverageLabelMin: { fontSize: 10, fontFamily: "Inter_400Regular" },
  leverageLabelMid: { fontSize: 10, fontFamily: "Inter_600SemiBold" },
  leverageLabelMax: { fontSize: 10, fontFamily: "Inter_600SemiBold" },

  offersBox: { borderRadius: 12, borderWidth: 1, padding: 12 },
  offersRow: { flexDirection: "row", alignItems: "center" },
  offerStat: { flex: 1, alignItems: "center" },
  offerStatVal: { fontSize: 16, fontFamily: "Inter_700Bold" },
  offerStatLabel: { fontSize: 10, fontFamily: "Inter_400Regular", marginTop: 2 },
  offerDivider: { width: 1, height: 30, backgroundColor: "#ddd" },

  howItWorks: { gap: 8 },
  howTitle: { fontSize: 10, fontFamily: "Inter_600SemiBold", textTransform: "uppercase", letterSpacing: 0.5, marginBottom: 2 },
  howStep: { flexDirection: "row", alignItems: "flex-start", gap: 10 },
  howDot: { width: 26, height: 26, borderRadius: 13, alignItems: "center", justifyContent: "center" },
  howText: { flex: 1, fontSize: 13, fontFamily: "Inter_400Regular", lineHeight: 18, paddingTop: 4 },

  disclaimerToggle: { flexDirection: "row", alignItems: "center", gap: 5 },
  disclaimerToggleText: { fontSize: 11, fontFamily: "Inter_400Regular" },
  disclaimerBox: { borderRadius: 10, borderWidth: 1, padding: 12 },
  disclaimerText: { fontSize: 11, fontFamily: "Inter_400Regular", lineHeight: 16 },

  compactWidget: { flexDirection: "row", alignItems: "center", gap: 10, borderRadius: 12, borderWidth: 1, padding: 12 },
  compactIcon: { width: 32, height: 32, borderRadius: 10, alignItems: "center", justifyContent: "center" },
  compactContent: { flex: 1 },
  compactTitle: { fontSize: 13, fontFamily: "Inter_600SemiBold" },
  compactSub: { fontSize: 11, fontFamily: "Inter_400Regular", marginTop: 2 },
});
