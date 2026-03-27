import { Feather } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";
import { LinearGradient } from "expo-linear-gradient";
import React, { useCallback, useRef, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  FlatList,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  View,
  useColorScheme,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import Colors from "@/constants/colors";
import { useAccounts } from "@/context/AccountsContext";
import { useCredits } from "@/context/CreditsContext";
import { BANKS } from "@/constants/banks";

interface Message {
  id: string;
  role: "user" | "assistant";
  content: string;
  timestamp: Date;
}

const SUGGESTIONS = [
  "Which banks have the highest bonus percentage?",
  "Show me No-EWS banks under $1,000 direct deposit",
  "How do I maximize my bank bonus earnings?",
  "What's the fastest bonus I can get right now?",
  "Create a strategy for $5,000 available capital",
  "Which banks are easiest to open without biometrics?",
];

function MessageBubble({ message }: { message: Message }) {
  const colorScheme = useColorScheme();
  const isDark = colorScheme === "dark";
  const c = isDark ? Colors.dark : Colors.light;
  const isUser = message.role === "user";

  return (
    <View style={[bubbleStyles.row, isUser ? bubbleStyles.userRow : bubbleStyles.assistantRow]}>
      {!isUser && (
        <View style={bubbleStyles.assistantAvatar}>
          <LinearGradient colors={["#833AB4", "#E1306C"]} style={StyleSheet.absoluteFill} />
          <Feather name="zap" size={14} color="#fff" />
        </View>
      )}
      <View style={[
        bubbleStyles.bubble,
        isUser
          ? bubbleStyles.userBubble
          : [bubbleStyles.assistantBubble, { backgroundColor: c.backgroundSecondary, borderColor: c.cardBorder }]
      ]}>
        <Text style={[bubbleStyles.bubbleText, { color: isUser ? "#fff" : c.text }]}>{message.content}</Text>
        <Text style={[bubbleStyles.timestamp, { color: isUser ? "rgba(255,255,255,0.6)" : c.textTertiary }]}>
          {message.timestamp.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
        </Text>
      </View>
    </View>
  );
}

function TypingIndicator() {
  const colorScheme = useColorScheme();
  const isDark = colorScheme === "dark";
  const c = isDark ? Colors.dark : Colors.light;
  return (
    <View style={bubbleStyles.assistantRow}>
      <View style={bubbleStyles.assistantAvatar}>
        <LinearGradient colors={["#833AB4", "#E1306C"]} style={StyleSheet.absoluteFill} />
        <Feather name="zap" size={14} color="#fff" />
      </View>
      <View style={[bubbleStyles.bubble, bubbleStyles.assistantBubble, { backgroundColor: c.backgroundSecondary, borderColor: c.cardBorder }]}>
        <ActivityIndicator size="small" color="#833AB4" />
      </View>
    </View>
  );
}

const SYSTEM_PROMPT = `You are the BigBankBonus AI Agent — a financial automation assistant specializing in bank account bonus strategies. You have expertise in:

1. Bank bonus hunting (finding the best checking account bonuses)
2. EWS (Early Warning Services) — which banks don't report to EWS
3. Direct deposit requirements and strategies
4. Deposit scheduling and timing
5. Maximizing returns with minimum deposits

Available banks in database include: ${BANKS.slice(0, 5).map(b => `${b.name} ($${b.bonusAmount} bonus, ${b.ewsReporting ? "EWS" : "No-EWS"})`).join(", ")} and ${BANKS.length - 5} more.

Key facts:
- Total database: 7,000+ banks, 13,000+ fintechs
- No-EWS banks: ${BANKS.filter(b => !b.ewsReporting).length} identified
- No monthly minimum: ${BANKS.filter(b => b.noMonthlyMinimum).length} banks

You can help with strategy, scheduling, account selection, and workflow automation. Be concise, specific, and actionable.`;

export default function AgentScreen() {
  const insets = useSafeAreaInsets();
  const colorScheme = useColorScheme();
  const isDark = colorScheme === "dark";
  const c = isDark ? Colors.dark : Colors.light;
  const { accounts, totalBonusEarned } = useAccounts();
  const { availableCredits } = useCredits();

  const [messages, setMessages] = useState<Message[]>([
    {
      id: "welcome",
      role: "assistant",
      content: `Hello! I'm your BigBankBonus AI Agent. I can help you find the best bank bonuses, create deposit strategies, analyze your accounts, and automate your workflow.\n\nYou currently have ${accounts.length} tracked accounts and $${totalBonusEarned.toLocaleString()} in earned bonuses. What would you like to do today?`,
      timestamp: new Date(),
    },
  ]);
  const [input, setInput] = useState("");
  const [isStreaming, setIsStreaming] = useState(false);
  const flatListRef = useRef<FlatList>(null);
  const abortRef = useRef<AbortController | null>(null);

  const buildContext = useCallback(() => {
    const accountCtx = accounts.length > 0
      ? `\n\nUser's current accounts: ${accounts.map(a => `${a.bankName} (${a.status}, $${a.deposited}/$${a.directDepositRequired} DD, $${a.bonusAmount} bonus)`).join("; ")}`
      : "";
    const creditsCtx = `\n\nUser credits: $${availableCredits.toLocaleString()} available`;
    return accountCtx + creditsCtx;
  }, [accounts, availableCredits]);

  const sendMessage = useCallback(async (text: string) => {
    if (!text.trim() || isStreaming) return;
    if (Platform.OS !== "web") Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);

    const userMsg: Message = {
      id: Date.now().toString() + "_user",
      role: "user",
      content: text.trim(),
      timestamp: new Date(),
    };

    setMessages(prev => [userMsg, ...prev]);
    setInput("");
    setIsStreaming(true);

    const assistantId = Date.now().toString() + "_assistant";
    setMessages(prev => [{
      id: assistantId,
      role: "assistant",
      content: "",
      timestamp: new Date(),
    }, ...prev]);

    try {
      const domain = process.env.EXPO_PUBLIC_DOMAIN;
      if (!domain) throw new Error("No domain configured");

      const chatMessages = [
        ...messages.slice(0, 10).reverse().map(m => ({ role: m.role, content: m.content })),
        { role: "user" as const, content: text.trim() + buildContext() },
      ];

      abortRef.current = new AbortController();

      const response = await fetch(`https://${domain}/api/agent/chat`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          messages: chatMessages,
          systemPrompt: SYSTEM_PROMPT,
        }),
        signal: abortRef.current.signal,
      });

      if (!response.ok) throw new Error(`HTTP ${response.status}`);

      const reader = response.body?.getReader();
      if (!reader) throw new Error("No response body");

      const decoder = new TextDecoder();
      let fullContent = "";

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        const chunk = decoder.decode(value, { stream: true });
        const lines = chunk.split("\n");
        for (const line of lines) {
          if (line.startsWith("data: ")) {
            try {
              const data = JSON.parse(line.slice(6));
              if (data.content) {
                fullContent += data.content;
                setMessages(prev => prev.map(m => m.id === assistantId ? { ...m, content: fullContent } : m));
              }
              if (data.done) break;
            } catch {}
          }
        }
      }
    } catch (err: any) {
      if (err.name === "AbortError") return;
      const errMsg = "I'm having trouble connecting right now. Please check your connection and try again. In the meantime, I can tell you that SoFi, Chime, and Axos all offer great bonuses without EWS reporting.";
      setMessages(prev => prev.map(m => m.id === assistantId ? { ...m, content: errMsg } : m));
    } finally {
      setIsStreaming(false);
    }
  }, [messages, isStreaming, buildContext]);

  const handleSuggestion = (s: string) => {
    setInput(s);
    sendMessage(s);
  };

  const handleStop = () => {
    abortRef.current?.abort();
    setIsStreaming(false);
  };

  return (
    <View style={[agentStyles.container, { backgroundColor: c.background }]}>
      <View style={[agentStyles.header, { paddingTop: insets.top + (Platform.OS === "web" ? 67 : 12) }]}>
        <LinearGradient colors={["#833AB4", "#E1306C"]} start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }} style={StyleSheet.absoluteFill} />
        <View style={agentStyles.headerContent}>
          <View style={agentStyles.agentAvatar}>
            <Feather name="zap" size={20} color="#fff" />
          </View>
          <View>
            <Text style={agentStyles.headerTitle}>BBB AI Agent</Text>
            <View style={agentStyles.headerStatus}>
              <View style={[agentStyles.statusDot, { backgroundColor: isStreaming ? "#FFB300" : "#00C853" }]} />
              <Text style={agentStyles.headerStatusText}>{isStreaming ? "Thinking..." : "Online"}</Text>
            </View>
          </View>
          <Pressable style={agentStyles.clearBtn} onPress={() => setMessages(prev => [prev[prev.length - 1]])}>
            <Feather name="refresh-ccw" size={18} color="rgba(255,255,255,0.8)" />
          </Pressable>
        </View>
      </View>

      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === "ios" ? "padding" : "height"}
        keyboardVerticalOffset={0}
      >
        <FlatList
          ref={flatListRef}
          data={messages}
          keyExtractor={m => m.id}
          renderItem={({ item }) => item.content === "" && isStreaming ? <TypingIndicator /> : <MessageBubble message={item} />}
          contentContainerStyle={[agentStyles.messageList, { paddingBottom: 16 }]}
          inverted
          showsVerticalScrollIndicator={false}
          ListFooterComponent={
            messages.length <= 1 ? (
              <View style={agentStyles.suggestions}>
                <Text style={[agentStyles.suggestionsTitle, { color: c.textSecondary }]}>Suggestions</Text>
                <View style={agentStyles.suggestionChips}>
                  {SUGGESTIONS.map(s => (
                    <Pressable
                      key={s}
                      style={[agentStyles.suggestionChip, { backgroundColor: c.backgroundSecondary, borderColor: c.cardBorder }]}
                      onPress={() => handleSuggestion(s)}
                    >
                      <Text style={[agentStyles.suggestionText, { color: c.text }]}>{s}</Text>
                    </Pressable>
                  ))}
                </View>
              </View>
            ) : null
          }
        />

        <View style={[agentStyles.inputBar, { backgroundColor: c.card, borderTopColor: c.separator, paddingBottom: Math.max(insets.bottom, Platform.OS === "web" ? 34 : 0) + 8 }]}>
          <TextInput
            style={[agentStyles.input, { backgroundColor: c.backgroundSecondary, color: c.text, borderColor: c.cardBorder }]}
            placeholder="Ask me anything about bank bonuses..."
            placeholderTextColor={c.textTertiary}
            value={input}
            onChangeText={setInput}
            multiline
            maxLength={500}
            onSubmitEditing={() => sendMessage(input)}
            blurOnSubmit={false}
          />
          {isStreaming ? (
            <Pressable style={[agentStyles.sendBtn, { backgroundColor: "#F44336" }]} onPress={handleStop}>
              <Feather name="square" size={18} color="#fff" />
            </Pressable>
          ) : (
            <Pressable
              style={[agentStyles.sendBtn, { opacity: input.trim() ? 1 : 0.4 }]}
              onPress={() => sendMessage(input)}
              disabled={!input.trim()}
            >
              <LinearGradient colors={["#833AB4", "#E1306C"]} style={StyleSheet.absoluteFill} />
              <Feather name="send" size={18} color="#fff" />
            </Pressable>
          )}
        </View>
      </KeyboardAvoidingView>
    </View>
  );
}

const bubbleStyles = StyleSheet.create({
  row: { flexDirection: "row", marginBottom: 12, paddingHorizontal: 16, gap: 8 },
  userRow: { justifyContent: "flex-end" },
  assistantRow: { justifyContent: "flex-start" },
  assistantAvatar: { width: 30, height: 30, borderRadius: 10, overflow: "hidden", alignItems: "center", justifyContent: "center", alignSelf: "flex-end" },
  bubble: { maxWidth: "80%", padding: 12, borderRadius: 16, gap: 4 },
  userBubble: { backgroundColor: "#E1306C", borderBottomRightRadius: 4 },
  assistantBubble: { borderWidth: 1, borderBottomLeftRadius: 4 },
  bubbleText: { fontSize: 15, fontFamily: "Inter_400Regular", lineHeight: 22 },
  timestamp: { fontSize: 10, fontFamily: "Inter_400Regular", alignSelf: "flex-end" },
});

const agentStyles = StyleSheet.create({
  container: { flex: 1 },
  header: { paddingHorizontal: 16, paddingBottom: 14 },
  headerContent: { flexDirection: "row", alignItems: "center", gap: 12 },
  agentAvatar: { width: 40, height: 40, borderRadius: 12, backgroundColor: "rgba(255,255,255,0.2)", alignItems: "center", justifyContent: "center" },
  headerTitle: { fontSize: 18, fontFamily: "Inter_700Bold", color: "#fff" },
  headerStatus: { flexDirection: "row", alignItems: "center", gap: 5, marginTop: 2 },
  statusDot: { width: 6, height: 6, borderRadius: 3 },
  headerStatusText: { fontSize: 12, fontFamily: "Inter_400Regular", color: "rgba(255,255,255,0.8)" },
  clearBtn: { marginLeft: "auto" as any, padding: 4 },
  messageList: { padding: 16, flexGrow: 1 },
  suggestions: { marginBottom: 16 },
  suggestionsTitle: { fontSize: 13, fontFamily: "Inter_600SemiBold", marginBottom: 10, textTransform: "uppercase", letterSpacing: 1 },
  suggestionChips: { gap: 8 },
  suggestionChip: { borderWidth: 1, borderRadius: 12, padding: 12 },
  suggestionText: { fontSize: 14, fontFamily: "Inter_400Regular", lineHeight: 20 },
  inputBar: { paddingHorizontal: 12, paddingTop: 10, borderTopWidth: 1, flexDirection: "row", alignItems: "flex-end", gap: 8 },
  input: { flex: 1, borderWidth: 1, borderRadius: 20, paddingHorizontal: 16, paddingVertical: 10, fontSize: 15, fontFamily: "Inter_400Regular", maxHeight: 100 },
  sendBtn: { width: 44, height: 44, borderRadius: 22, overflow: "hidden", alignItems: "center", justifyContent: "center" },
});
