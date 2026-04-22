import { Feather } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import { router } from "expo-router";
import React, { useState } from "react";
import {
  Linking,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
  useColorScheme,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import Colors from "@/constants/colors";

type Tab = "privacy" | "terms";

const LAST_UPDATED = "March 29, 2026";
const PRIVACY_EMAIL = "privacy@bigbankbonus.com";
const LEGAL_EMAIL = "legal@bigbankbonus.com";

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  const colorScheme = useColorScheme();
  const c = colorScheme === "dark" ? Colors.dark : Colors.light;
  return (
    <View style={{ marginBottom: 24 }}>
      <Text style={{ fontSize: 16, fontFamily: "Inter_700Bold", color: c.text, marginBottom: 8 }}>{title}</Text>
      <View>{children}</View>
    </View>
  );
}

function P({ children, style }: { children: React.ReactNode; style?: import("react-native").TextStyle }) {
  const colorScheme = useColorScheme();
  const c = colorScheme === "dark" ? Colors.dark : Colors.light;
  return (
    <Text style={[{ fontSize: 13, fontFamily: "Inter_400Regular", color: c.textSecondary, lineHeight: 20, marginBottom: 8 }, style]}>
      {children}
    </Text>
  );
}

function B({ children }: { children: React.ReactNode }) {
  const colorScheme = useColorScheme();
  const c = colorScheme === "dark" ? Colors.dark : Colors.light;
  return <Text style={{ fontFamily: "Inter_600SemiBold", color: c.text }}>{children}</Text>;
}

function Li({ children }: { children: React.ReactNode }) {
  const colorScheme = useColorScheme();
  const c = colorScheme === "dark" ? Colors.dark : Colors.light;
  return (
    <View style={{ flexDirection: "row", gap: 8, marginBottom: 4 }}>
      <Text style={{ color: "#E1306C", fontSize: 13, marginTop: 3 }}>•</Text>
      <Text style={{ flex: 1, fontSize: 13, fontFamily: "Inter_400Regular", color: c.textSecondary, lineHeight: 20 }}>{children}</Text>
    </View>
  );
}

function Warning({ children }: { children: React.ReactNode }) {
  return (
    <View style={{ backgroundColor: "rgba(245,158,11,0.1)", borderWidth: 1, borderColor: "rgba(245,158,11,0.3)", borderRadius: 10, padding: 12, marginBottom: 10 }}>
      <Text style={{ fontSize: 12, fontFamily: "Inter_400Regular", color: "#fbbf24", lineHeight: 18 }}>{children}</Text>
    </View>
  );
}

function PrivacyContent() {
  return (
    <>
      <Section title="1. Introduction">
        <P>BigBankBonus, Inc. ("we," "us," or "our") operates the BigBankBonus app and website. This Privacy Policy explains how we collect, use, disclose, and protect your information.</P>
      </Section>

      <Section title="2. Information We Collect">
        <P><B>Account Information:</B> Name, email, and a unique ID from Google or Apple when you sign in. We never store your Google or Apple passwords.</P>
        <P><B>Bank Account Data (via Plaid):</B> If you link a bank account, Plaid provides read-only access to your balances and transactions. We do not collect your bank username or password. See <Text style={{ color: "#E1306C" }} onPress={() => Linking.openURL("https://plaid.com/legal/privacy-policy/")}>plaid.com/legal</Text>.</P>
        <P><B>Payment Data (via Stripe):</B> Card and ACH data is tokenized by Stripe. We never store raw card numbers or routing numbers. See <Text style={{ color: "#E1306C" }} onPress={() => Linking.openURL("https://stripe.com/privacy")}>stripe.com/privacy</Text>.</P>
        <P><B>AI Conversations:</B> Your messages to the AI Bonus Agent are processed by OpenAI. We do not permanently store conversation content. See <Text style={{ color: "#E1306C" }} onPress={() => Linking.openURL("https://openai.com/policies/privacy-policy")}>openai.com/policies</Text>.</P>
        <P><B>Usage Data:</B> How you interact with the app (pages, taps, crashes) to help us improve the Service.</P>
      </Section>

      <Section title="3. How We Use Your Information">
        <Li>Provide and improve the Service</Li>
        <Li>Process subscriptions and ACH deposit cycles</Li>
        <Li>Send transactional emails (receipts, schedule alerts)</Li>
        <Li>Detect and prevent fraud</Li>
        <Li>Comply with legal obligations</Li>
        <P style={{ marginTop: 6 }}>We do <B>not</B> sell your personal data or use it for targeted advertising.</P>
      </Section>

      <Section title="4. Data Sharing">
        <Li><B>Plaid</B> — bank linking and verification</Li>
        <Li><B>Stripe</B> — payment processing and ACH transfers</Li>
        <Li><B>OpenAI</B> — AI query processing</Li>
        <Li><B>Google / Apple</B> — identity verification only</Li>
        <Li>Law enforcement when required by law</Li>
      </Section>

      <Section title="5. Data Retention">
        <P>Account data is retained while your account is active. Upon deletion, personal data is removed within 90 days unless legally required to retain.</P>
      </Section>

      <Section title="6. Security">
        <P>We use TLS encryption in transit, AES-256 at rest, and store PINs in your device's secure enclave (iOS Keychain / Android Keystore). No plaintext credentials are transmitted to our servers.</P>
      </Section>

      <Section title="7. Your Rights">
        <Li>Access a copy of your personal data</Li>
        <Li>Correct inaccurate data</Li>
        <Li>Request deletion of your account and data</Li>
        <Li>Data portability in machine-readable format</Li>
        <Li>California (CCPA) and EU (GDPR) residents have additional rights</Li>
        <P>To exercise any right, email <Text style={{ color: "#E1306C" }} onPress={() => Linking.openURL(`mailto:${PRIVACY_EMAIL}`)}>{PRIVACY_EMAIL}</Text>.</P>
      </Section>

      <Section title="8. Children's Privacy">
        <P>The Service is not directed to children under 18. If you believe a child has provided us personal data, contact us immediately.</P>
      </Section>

      <Section title="9. Contact">
        <P>Questions about privacy? Email us at <Text style={{ color: "#E1306C" }} onPress={() => Linking.openURL(`mailto:${PRIVACY_EMAIL}`)}>{PRIVACY_EMAIL}</Text>.</P>
      </Section>
    </>
  );
}

function TermsContent() {
  return (
    <>
      <Warning>
        IMPORTANT: BigBankBonus is a financial tools platform, not a financial advisor. Bank bonuses are subject to each bank's terms and may change at any time. All bonuses are generally taxable income. We do not guarantee bonus eligibility or payment.
      </Warning>

      <Section title="1. Acceptance of Terms">
        <P>By using BigBankBonus, you agree to these Terms. You must be 18+ and a US resident to use the Service.</P>
      </Section>

      <Section title="2. What BigBankBonus Provides">
        <Li>A database of 200+ bank bonus offers from public sources</Li>
        <Li>Bonus tracking and direct deposit requirement management</Li>
        <Li>AI-powered bonus strategy assistant</Li>
        <Li>Automated direct deposit cycling (Autopay DD Scheduler)</Li>
        <Li>Plaid bank account linking for balance/transaction visibility</Li>
        <Li>ROIC/APY calculations based on bonus amounts</Li>
      </Section>

      <Section title="3. Subscription Plans &amp; Fees">
        <P><B>Free Plan:</B> Access to 5 bonus offers and basic tracking. No cost.</P>
        <P><B>Pro Monthly:</B> $9.99/month. All 200+ deals, AI Agent, Autopay, Plaid, ROIC Calculator.</P>
        <P><B>Pro Annual:</B> $83.88/year ($6.99/month equivalent, 30% savings). Includes Early Access and Dedicated Support.</P>
        <P><B>Autopay Service Fee:</B> 3% of each direct deposit amount processed. This fee is charged to your card upfront and is non-refundable once the ACH transfer is initiated.</P>
        <P>Subscriptions are non-refundable. Cancel anytime; access continues through end of billing period.</P>
      </Section>

      <Section title="4. Autopay DD Scheduler">
        <P>By using Autopay, you authorize us to: (1) charge your card for the deposit amount + 3% fee; (2) ACH push funds to your bank; (3) ACH pull the funds back after the holding period; (4) refund your card minus the 3% fee.</P>
        <Warning>
          ACH transfers may be rejected or delayed by your bank. BigBankBonus is not responsible for bank fees, penalties, or bonus disqualification resulting from Autopay use. Review your bank's terms before using this feature.
        </Warning>
      </Section>

      <Section title="5. Prohibited Use">
        <Li>Using the Service for unlawful purposes</Li>
        <Li>Circumventing bank fraud detection systems</Li>
        <Li>Creating multiple accounts to abuse trials or bonuses</Li>
        <Li>Reverse engineering or scraping the Service</Li>
        <Li>Facilitating money laundering or financial crimes</Li>
        <Li>Providing false account information</Li>
      </Section>

      <Section title="6. Bank Bonus Disclaimer">
        <P>Offers come from public sources including Doctor of Credit. Terms are controlled by individual banks and <B>may change or expire without notice</B>. We make no guarantees that any bonus will be honored.</P>
        <P>Bank bonuses are generally <B>taxable income</B> per IRS guidelines. Consult a tax advisor regarding your obligations.</P>
      </Section>

      <Section title="7. Limitation of Liability">
        <P>The Service is provided "AS IS" without warranties. To the maximum extent permitted by law, BigBankBonus's total liability shall not exceed the greater of $100 or amounts you paid us in the prior 12 months.</P>
      </Section>

      <Section title="8. Governing Law">
        <P>These Terms are governed by Delaware law. Disputes shall be resolved by binding arbitration. Class action lawsuits are waived.</P>
      </Section>

      <Section title="9. Contact">
        <P>Legal questions? Email <Text style={{ color: "#E1306C" }} onPress={() => Linking.openURL(`mailto:${LEGAL_EMAIL}`)}>{LEGAL_EMAIL}</Text>.</P>
      </Section>
    </>
  );
}

export default function LegalScreen() {
  const insets = useSafeAreaInsets();
  const colorScheme = useColorScheme();
  const isDark = colorScheme === "dark";
  const c = isDark ? Colors.dark : Colors.light;
  const [tab, setTab] = useState<Tab>("privacy");

  return (
    <View style={[s.container, { backgroundColor: c.background }]}>
      {/* Header */}
      <LinearGradient colors={["#833AB4", "#E1306C"]} style={[s.header, { paddingTop: insets.top + (Platform.OS === "web" ? 67 : 12) }]}>
        <View style={s.headerRow}>
          <Pressable style={s.backBtn} onPress={() => router.back()} hitSlop={12}>
            <Feather name="arrow-left" size={20} color="#fff" />
          </Pressable>
          <Text style={s.headerTitle}>Legal</Text>
          <View style={{ width: 36 }} />
        </View>
        <Text style={s.headerSub}>Last updated: {LAST_UPDATED}</Text>

        {/* Tab switcher */}
        <View style={s.tabs}>
          {([["privacy", "Privacy Policy"], ["terms", "Terms of Service"]] as [Tab, string][]).map(([key, label]) => (
            <Pressable
              key={key}
              style={[s.tab, tab === key && s.tabActive]}
              onPress={() => setTab(key)}
            >
              <Text style={[s.tabText, tab === key && s.tabTextActive]}>{label}</Text>
            </Pressable>
          ))}
        </View>
      </LinearGradient>

      <ScrollView contentContainerStyle={[s.body, { paddingBottom: insets.bottom + 40 }]} showsVerticalScrollIndicator={false}>
        {tab === "privacy" ? <PrivacyContent /> : <TermsContent />}
      </ScrollView>
    </View>
  );
}

const s = StyleSheet.create({
  container: { flex: 1 },
  header: { paddingHorizontal: 20, paddingBottom: 0 },
  headerRow: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", marginBottom: 4 },
  backBtn: { width: 36, height: 36, alignItems: "center", justifyContent: "center" },
  headerTitle: { fontSize: 18, fontFamily: "Inter_700Bold", color: "#fff" },
  headerSub: { fontSize: 11, fontFamily: "Inter_400Regular", color: "rgba(255,255,255,0.65)", textAlign: "center", marginBottom: 12 },
  tabs: { flexDirection: "row", backgroundColor: "rgba(0,0,0,0.25)", borderRadius: 12, padding: 3, marginBottom: 0 },
  tab: { flex: 1, paddingVertical: 8, borderRadius: 10, alignItems: "center" },
  tabActive: { backgroundColor: "#fff" },
  tabText: { fontSize: 13, fontFamily: "Inter_600SemiBold", color: "rgba(255,255,255,0.7)" },
  tabTextActive: { color: "#833AB4" },
  body: { padding: 20 },
});
