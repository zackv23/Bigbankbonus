import { Feather } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";
import { LinearGradient } from "expo-linear-gradient";
import React, { useCallback, useEffect, useMemo, useState } from "react";
import {
  ActivityIndicator,
  FlatList,
  Modal,
  Platform,
  Pressable,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
  useColorScheme,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import Colors from "@/constants/colors";
import { ScheduledEvent, useScheduler } from "@/context/SchedulerContext";
import { useAccounts } from "@/context/AccountsContext";
import { useAuth } from "@/context/AuthContext";

// ─── Autopay Status lifecycle colors and labels ────────────────────────────────
const STATUS_META: Record<string, { label: string; color: string; icon: string }> = {
  pending_charge: { label: "Pending Charge", color: "#FFB300", icon: "clock" },
  charged:        { label: "CC Charged",     color: "#E1306C", icon: "credit-card" },
  ach_push_sent:  { label: "ACH Push Sent",  color: "#F77737", icon: "send" },
  ach_push_settled: { label: "DD Arrived",   color: "#2196F3", icon: "arrow-down-circle" },
  ach_pull_sent:  { label: "Pulling Back",   color: "#9C27B0", icon: "rotate-ccw" },
  ach_pull_settled: { label: "Funds Back",   color: "#4CAF50", icon: "check-circle" },
  refunded:       { label: "Refunded ✓",     color: "#00C853", icon: "check-circle" },
  cancelled:      { label: "Cancelled",      color: "#9E9E9E", icon: "x-circle" },
  failed:         { label: "Failed",         color: "#F44336", icon: "alert-circle" },
};

const LIFECYCLE_STEPS = [
  "pending_charge", "charged", "ach_push_sent", "ach_push_settled",
  "ach_pull_sent", "ach_pull_settled", "refunded",
];

interface AutopaySchedule {
  id: number;
  userId: string;
  bankName: string;
  bonusAmount: number;
  ddAmount: number;
  chargeAmount: number;
  achAmount: number;
  ddOutDate: string;
  ddInDate: string;
  refundDate: string;
  status: string;
  accountLast4: string;
  demo: boolean;
  createdAt: string;
}

// ─── Live autopay hook ─────────────────────────────────────────────────────────
function useAutopaySchedules(userId?: string) {
  const [schedules, setSchedules] = useState<AutopaySchedule[]>([]);
  const [loading, setLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);

  const fetch_ = useCallback(async (isRefresh = false) => {
    if (!userId) return;
    if (isRefresh) setRefreshing(true); else setLoading(true);
    try {
      const domain = process.env.EXPO_PUBLIC_DOMAIN;
      const url = domain
        ? `https://${domain}/api/autopay?userId=${userId}`
        : `http://localhost:8080/api/autopay?userId=${userId}`;
      const controller = new AbortController();
      const timer = setTimeout(() => controller.abort(), 10000);
      const res = await fetch(url, { signal: controller.signal });
      clearTimeout(timer);
      if (!res.ok) throw new Error("Failed");
      const data = await res.json();
      setSchedules(data.schedules ?? []);
    } catch {
      // silently fail - use local state as fallback
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [userId]);

  useEffect(() => { fetch_(); }, [fetch_]);

  const refresh = useCallback(() => fetch_(true), [fetch_]);
  return { schedules, loading, refreshing, refresh };
}

// ─── Live Schedule Card ───────────────────────────────────────────────────────
function LiveScheduleCard({ sched, isDark }: { sched: AutopaySchedule; isDark: boolean }) {
  const c = isDark ? Colors.dark : Colors.light;
  const meta = STATUS_META[sched.status] ?? { label: sched.status, color: "#9E9E9E", icon: "circle" };
  const stepIdx = LIFECYCLE_STEPS.indexOf(sched.status);
  const progress = stepIdx >= 0 ? (stepIdx + 1) / LIFECYCLE_STEPS.length : 0;

  const ddOut = sched.ddOutDate ? new Date(sched.ddOutDate).toLocaleDateString("en-US", { month: "short", day: "numeric" }) : "—";
  const ddIn = sched.ddInDate ? new Date(sched.ddInDate).toLocaleDateString("en-US", { month: "short", day: "numeric" }) : "—";
  const refund = sched.refundDate ? new Date(sched.refundDate).toLocaleDateString("en-US", { month: "short", day: "numeric" }) : "—";

  return (
    <View style={[lsStyles.card, { backgroundColor: c.card, borderColor: c.cardBorder }]}>
      <LinearGradient colors={["#833AB4", "#E1306C"]} style={lsStyles.cardAccent} start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }} />
      <View style={lsStyles.cardTop}>
        <View style={{ flex: 1 }}>
          <Text style={[lsStyles.bankName, { color: c.text }]}>{sched.bankName}</Text>
          <Text style={[lsStyles.acctNum, { color: c.textSecondary }]}>••••{sched.accountLast4}</Text>
        </View>
        <View style={{ alignItems: "flex-end", gap: 4 }}>
          <View style={[lsStyles.statusBadge, { backgroundColor: meta.color + "22" }]}>
            <Feather name={meta.icon as any} size={11} color={meta.color} />
            <Text style={[lsStyles.statusText, { color: meta.color }]}>{meta.label}</Text>
          </View>
          {sched.demo && (
            <View style={[lsStyles.demoBadge, { backgroundColor: "#9E9E9E22" }]}>
              <Text style={lsStyles.demoText}>DEMO</Text>
            </View>
          )}
        </View>
      </View>

      {/* Progress bar */}
      <View style={[lsStyles.progressTrack, { backgroundColor: isDark ? "#ffffff12" : "#0000000a" }]}>
        <LinearGradient
          colors={["#833AB4", "#E1306C", "#F77737"]}
          start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }}
          style={[lsStyles.progressFill, { width: `${Math.round(progress * 100)}%` as any }]}
        />
      </View>
      <Text style={[lsStyles.progressPct, { color: c.textTertiary }]}>{Math.round(progress * 100)}% complete</Text>

      {/* Amount grid */}
      <View style={lsStyles.amtGrid}>
        <View style={lsStyles.amtCell}>
          <Text style={[lsStyles.amtVal, { color: "#E1306C" }]}>${sched.chargeAmount}</Text>
          <Text style={[lsStyles.amtLabel, { color: c.textTertiary }]}>CC charged</Text>
        </View>
        <View style={[lsStyles.amtDivider, { backgroundColor: c.separator }]} />
        <View style={lsStyles.amtCell}>
          <Text style={[lsStyles.amtVal, { color: "#F77737" }]}>${sched.achAmount}</Text>
          <Text style={[lsStyles.amtLabel, { color: c.textTertiary }]}>ACH sent</Text>
        </View>
        <View style={[lsStyles.amtDivider, { backgroundColor: c.separator }]} />
        <View style={lsStyles.amtCell}>
          <Text style={[lsStyles.amtVal, { color: "#4CAF50" }]}>${sched.bonusAmount}</Text>
          <Text style={[lsStyles.amtLabel, { color: c.textTertiary }]}>bonus</Text>
        </View>
      </View>

      {/* Timeline row */}
      <View style={lsStyles.timeline}>
        <View style={lsStyles.tlItem}>
          <Feather name="send" size={10} color="#F77737" />
          <Text style={[lsStyles.tlDate, { color: c.textSecondary }]}>{ddOut}</Text>
          <Text style={[lsStyles.tlLabel, { color: c.textTertiary }]}>DD out</Text>
        </View>
        <View style={[lsStyles.tlArrow, { backgroundColor: c.separator }]} />
        <View style={lsStyles.tlItem}>
          <Feather name="arrow-down-circle" size={10} color="#2196F3" />
          <Text style={[lsStyles.tlDate, { color: c.textSecondary }]}>{ddIn}</Text>
          <Text style={[lsStyles.tlLabel, { color: c.textTertiary }]}>DD in</Text>
        </View>
        <View style={[lsStyles.tlArrow, { backgroundColor: c.separator }]} />
        <View style={lsStyles.tlItem}>
          <Feather name="refresh-cw" size={10} color="#833AB4" />
          <Text style={[lsStyles.tlDate, { color: c.textSecondary }]}>{refund}</Text>
          <Text style={[lsStyles.tlLabel, { color: c.textTertiary }]}>refund</Text>
        </View>
      </View>

      {/* Lifecycle dots */}
      <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={lsStyles.dots}>
        {LIFECYCLE_STEPS.map((step, i) => {
          const sm = STATUS_META[step];
          const done = i < stepIdx;
          const active = i === stepIdx;
          return (
            <View key={step} style={lsStyles.dotItem}>
              <View style={[lsStyles.dot, {
                backgroundColor: active ? sm.color : done ? sm.color + "80" : c.backgroundSecondary,
                borderColor: active ? sm.color : done ? sm.color + "40" : c.cardBorder,
                transform: [{ scale: active ? 1.2 : 1 }],
              }]}>
                {active && <View style={[lsStyles.dotInner, { backgroundColor: "#fff" }]} />}
              </View>
              {i < LIFECYCLE_STEPS.length - 1 && (
                <View style={[lsStyles.dotLine, { backgroundColor: done ? "#4CAF5060" : c.separator }]} />
              )}
            </View>
          );
        })}
      </ScrollView>
    </View>
  );
}

// ─── Calendar Grid & Event Modal (unchanged) ──────────────────────────────────
const DAYS = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
const MONTHS = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];

const EVENT_COLORS: Record<string, string> = {
  deposit: "#00C853",
  withdrawal: "#E1306C",
  direct_deposit: "#833AB4",
};

const EVENT_ICONS: Record<string, string> = {
  deposit: "arrow-down-circle",
  withdrawal: "arrow-up-circle",
  direct_deposit: "zap",
};

function CalendarGrid({ year, month, events, selectedDate, onSelectDate }: {
  year: number; month: number; events: ScheduledEvent[];
  selectedDate: string | null; onSelectDate: (date: string) => void;
}) {
  const colorScheme = useColorScheme();
  const isDark = colorScheme === "dark";
  const c = isDark ? Colors.dark : Colors.light;

  const today = new Date();
  const firstDay = new Date(year, month, 1).getDay();
  const daysInMonth = new Date(year, month + 1, 0).getDate();

  const cells: (number | null)[] = [];
  for (let i = 0; i < firstDay; i++) cells.push(null);
  for (let d = 1; d <= daysInMonth; d++) cells.push(d);
  while (cells.length % 7 !== 0) cells.push(null);

  const eventDates = new Set(events.map(e => e.date.slice(0, 10)));

  const rows = [];
  for (let i = 0; i < cells.length; i += 7) rows.push(cells.slice(i, i + 7));

  return (
    <View style={calStyles.grid}>
      <View style={calStyles.dayRow}>
        {DAYS.map(d => <Text key={d} style={[calStyles.dayLabel, { color: c.textTertiary }]}>{d}</Text>)}
      </View>
      {rows.map((row, ri) => (
        <View key={ri} style={calStyles.row}>
          {row.map((day, di) => {
            if (!day) return <View key={di} style={calStyles.cell} />;
            const dateStr = `${year}-${String(month + 1).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
            const isToday = today.getFullYear() === year && today.getMonth() === month && today.getDate() === day;
            const isSelected = selectedDate === dateStr;
            const hasEvents = eventDates.has(dateStr);
            return (
              <Pressable
                key={di}
                style={[calStyles.cell, isSelected && calStyles.selectedCell, isToday && !isSelected && [calStyles.todayCell, { borderColor: c.tintSecondary }]]}
                onPress={() => { if (Platform.OS !== "web") Haptics.selectionAsync(); onSelectDate(dateStr); }}
              >
                <Text style={[calStyles.cellText, { color: isSelected ? "#fff" : isToday ? c.tintSecondary : c.text }, { fontFamily: isToday || isSelected ? "Inter_700Bold" : "Inter_400Regular" }]}>{day}</Text>
                {hasEvents && <View style={[calStyles.eventDot, { backgroundColor: isSelected ? "#fff" : "#E1306C" }]} />}
              </Pressable>
            );
          })}
        </View>
      ))}
    </View>
  );
}

function AddEventModal({ visible, selectedDate, onClose }: { visible: boolean; selectedDate: string | null; onClose: () => void }) {
  const colorScheme = useColorScheme();
  const isDark = colorScheme === "dark";
  const c = isDark ? Colors.dark : Colors.light;
  const insets = useSafeAreaInsets();
  const { accounts } = useAccounts();
  const { addEvent } = useScheduler();

  const [type, setType] = useState<"deposit" | "withdrawal" | "direct_deposit">("deposit");
  const [amount, setAmount] = useState("");
  const [selectedAccount, setSelectedAccount] = useState<string>("");
  const [notes, setNotes] = useState("");

  const handleSave = async () => {
    if (!selectedAccount || !amount || !selectedDate) return;
    const acc = accounts.find(a => a.id === selectedAccount);
    if (!acc) return;
    await addEvent({
      accountId: selectedAccount,
      bankName: acc.bankName,
      type,
      amount: parseFloat(amount),
      date: selectedDate + "T12:00:00Z",
      status: "scheduled",
      notes,
      color: EVENT_COLORS[type],
    });
    if (Platform.OS !== "web") Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    setAmount(""); setNotes(""); onClose();
  };

  return (
    <Modal visible={visible} animationType="slide" transparent>
      <View style={calStyles.modalOverlay}>
        <View style={[calStyles.modalSheet, { backgroundColor: c.card, paddingBottom: insets.bottom + 20 }]}>
          <View style={calStyles.modalHandle} />
          <Text style={[calStyles.modalTitle, { color: c.text }]}>Schedule Transaction</Text>
          {selectedDate && <Text style={[calStyles.modalDate, { color: c.textSecondary }]}>{new Date(selectedDate).toLocaleDateString("en-US", { weekday: "long", month: "long", day: "numeric" })}</Text>}

          <Text style={[calStyles.inputLabel, { color: c.textSecondary }]}>Type</Text>
          <View style={calStyles.typeRow}>
            {(["deposit", "withdrawal", "direct_deposit"] as const).map(t => (
              <Pressable key={t} style={[calStyles.typeChip, type === t && { backgroundColor: EVENT_COLORS[t] + "22", borderColor: EVENT_COLORS[t] }]} onPress={() => setType(t)}>
                <Feather name={EVENT_ICONS[t] as any} size={14} color={type === t ? EVENT_COLORS[t] : c.textSecondary} />
                <Text style={[calStyles.typeChipText, { color: type === t ? EVENT_COLORS[t] : c.textSecondary }]}>
                  {t === "direct_deposit" ? "DD" : t.charAt(0).toUpperCase() + t.slice(1)}
                </Text>
              </Pressable>
            ))}
          </View>

          <Text style={[calStyles.inputLabel, { color: c.textSecondary }]}>Account</Text>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} style={calStyles.accountScroll}>
            {accounts.map(a => (
              <Pressable key={a.id} style={[calStyles.accountChip, selectedAccount === a.id && { backgroundColor: "#833AB422", borderColor: "#833AB4" }]} onPress={() => setSelectedAccount(a.id)}>
                <View style={[calStyles.accountChipDot, { backgroundColor: a.logoColor }]} />
                <Text style={[calStyles.accountChipText, { color: selectedAccount === a.id ? "#833AB4" : c.text }]}>{a.bankName}</Text>
              </Pressable>
            ))}
          </ScrollView>

          <Text style={[calStyles.inputLabel, { color: c.textSecondary }]}>Amount ($)</Text>
          <TextInput style={[calStyles.inputField, { backgroundColor: c.backgroundSecondary, color: c.text, borderColor: c.cardBorder }]} placeholder="0.00" placeholderTextColor={c.textTertiary} value={amount} onChangeText={setAmount} keyboardType="decimal-pad" />

          <Text style={[calStyles.inputLabel, { color: c.textSecondary }]}>Notes (optional)</Text>
          <TextInput style={[calStyles.inputField, { backgroundColor: c.backgroundSecondary, color: c.text, borderColor: c.cardBorder }]} placeholder="Add a note..." placeholderTextColor={c.textTertiary} value={notes} onChangeText={setNotes} />

          <Pressable style={[calStyles.saveBtn, { opacity: selectedAccount && amount ? 1 : 0.5 }]} onPress={handleSave} disabled={!selectedAccount || !amount}>
            <LinearGradient colors={["#833AB4", "#E1306C"]} start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }} style={calStyles.saveBtnGrad}>
              <Text style={calStyles.saveBtnText}>Schedule Transaction</Text>
            </LinearGradient>
          </Pressable>
          <Pressable style={[calStyles.cancelBtn, { borderColor: c.cardBorder }]} onPress={onClose}>
            <Text style={[calStyles.cancelText, { color: c.textSecondary }]}>Cancel</Text>
          </Pressable>
        </View>
      </View>
    </Modal>
  );
}

// ─── Main Calendar Screen ──────────────────────────────────────────────────────
export default function CalendarScreen() {
  const insets = useSafeAreaInsets();
  const colorScheme = useColorScheme();
  const isDark = colorScheme === "dark";
  const c = isDark ? Colors.dark : Colors.light;
  const { user } = useAuth() as any;
  const { events, getEventsForDate, getEventsForMonth, removeEvent } = useScheduler();
  const { schedules, loading: schedulesLoading, refreshing, refresh } = useAutopaySchedules(user?.id);

  const [today] = useState(new Date());
  const [year, setYear] = useState(today.getFullYear());
  const [month, setMonth] = useState(today.getMonth());
  const [selectedDate, setSelectedDate] = useState<string | null>(null);
  const [addModalVisible, setAddModalVisible] = useState(false);
  const [showSchedules, setShowSchedules] = useState(true);

  const monthEvents = useMemo(() => getEventsForMonth(year, month), [events, year, month]);
  const selectedEvents = useMemo(() => selectedDate ? getEventsForDate(selectedDate) : [], [events, selectedDate]);

  const activeSchedules = useMemo(() => schedules.filter(s => !["refunded", "cancelled", "failed"].includes(s.status)), [schedules]);
  const completedSchedules = useMemo(() => schedules.filter(s => ["refunded", "cancelled", "failed"].includes(s.status)), [schedules]);

  const prevMonth = () => {
    if (Platform.OS !== "web") Haptics.selectionAsync();
    if (month === 0) { setYear(y => y - 1); setMonth(11); } else setMonth(m => m - 1);
  };
  const nextMonth = () => {
    if (Platform.OS !== "web") Haptics.selectionAsync();
    if (month === 11) { setYear(y => y + 1); setMonth(0); } else setMonth(m => m + 1);
  };

  return (
    <View style={[calStyles.container, { backgroundColor: c.background }]}>
      {/* Header */}
      <View style={[calStyles.header, { paddingTop: insets.top + (Platform.OS === "web" ? 67 : 12) }]}>
        <LinearGradient colors={["#F77737", "#E1306C", "#833AB4"]} start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }} style={StyleSheet.absoluteFill} />
        <View style={calStyles.headerTop}>
          <View>
            <Text style={calStyles.headerTitle}>Schedule</Text>
            <Text style={calStyles.headerSub}>
              {activeSchedules.length > 0 ? `${activeSchedules.length} active DD${activeSchedules.length > 1 ? "s" : ""}` : "No active DDs"}
            </Text>
          </View>
          <Pressable style={calStyles.addBtn} onPress={() => { if (!selectedDate) setSelectedDate(new Date().toISOString().slice(0, 10)); setAddModalVisible(true); }}>
            <Feather name="plus" size={20} color="#fff" />
          </Pressable>
        </View>

        <View style={calStyles.monthNav}>
          <Pressable style={calStyles.navBtn} onPress={prevMonth}><Feather name="chevron-left" size={22} color="#fff" /></Pressable>
          <Text style={calStyles.monthText}>{MONTHS[month]} {year}</Text>
          <Pressable style={calStyles.navBtn} onPress={nextMonth}><Feather name="chevron-right" size={22} color="#fff" /></Pressable>
        </View>
      </View>

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingBottom: insets.bottom + (Platform.OS === "web" ? 34 : 80) }}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={refresh} tintColor="#833AB4" />}
      >
        {/* Calendar grid */}
        <View style={[calStyles.calContainer, { backgroundColor: c.card, borderColor: c.cardBorder }]}>
          <CalendarGrid year={year} month={month} events={monthEvents} selectedDate={selectedDate} onSelectDate={setSelectedDate} />
        </View>

        {/* Selected date events */}
        {selectedDate && (
          <View style={calStyles.eventsSection}>
            <View style={calStyles.eventsSectionHeader}>
              <Text style={[calStyles.eventsSectionTitle, { color: c.text }]}>
                {new Date(selectedDate).toLocaleDateString("en-US", { weekday: "long", month: "short", day: "numeric" })}
              </Text>
              <Pressable style={calStyles.addEventBtn} onPress={() => setAddModalVisible(true)}>
                <LinearGradient colors={["#833AB4", "#E1306C"]} start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }} style={calStyles.addEventBtnGrad}>
                  <Feather name="plus" size={14} color="#fff" />
                  <Text style={calStyles.addEventBtnText}>Add</Text>
                </LinearGradient>
              </Pressable>
            </View>

            {selectedEvents.length === 0 ? (
              <View style={[calStyles.noEvents, { backgroundColor: c.backgroundSecondary }]}>
                <Feather name="calendar" size={24} color={c.textTertiary} />
                <Text style={[calStyles.noEventsText, { color: c.textTertiary }]}>No transactions scheduled</Text>
              </View>
            ) : (
              selectedEvents.map(event => (
                <View key={event.id} style={[calStyles.eventItem, { backgroundColor: c.card, borderColor: c.cardBorder }]}>
                  <View style={[calStyles.eventIconBox, { backgroundColor: EVENT_COLORS[event.type] + "22" }]}>
                    <Feather name={EVENT_ICONS[event.type] as any} size={18} color={EVENT_COLORS[event.type]} />
                  </View>
                  <View style={calStyles.eventContent}>
                    <Text style={[calStyles.eventBank, { color: c.text }]}>{event.bankName}</Text>
                    <Text style={[calStyles.eventType, { color: c.textSecondary }]}>
                      {event.type === "direct_deposit" ? "Direct Deposit" : event.type.charAt(0).toUpperCase() + event.type.slice(1)}
                      {event.notes ? ` · ${event.notes}` : ""}
                    </Text>
                  </View>
                  <View style={calStyles.eventRight}>
                    <Text style={[calStyles.eventAmount, { color: EVENT_COLORS[event.type] }]}>
                      {event.type === "withdrawal" ? "-" : "+"}${event.amount.toLocaleString()}
                    </Text>
                    <View style={[calStyles.eventStatusDot, { backgroundColor: event.status === "completed" ? "#00C853" : event.status === "missed" ? "#F44336" : "#FFB300" }]} />
                  </View>
                  <Pressable style={calStyles.deleteEventBtn} onPress={() => { if (Platform.OS !== "web") Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light); removeEvent(event.id); }}>
                    <Feather name="x" size={16} color={c.textTertiary} />
                  </Pressable>
                </View>
              ))
            )}
          </View>
        )}

        {/* ─── LIVE AUTOPAY SCHEDULES ─── */}
        <View style={calStyles.liveSection}>
          <Pressable style={calStyles.liveSectionHeader} onPress={() => setShowSchedules(v => !v)}>
            <View style={calStyles.liveSectionTitleRow}>
              <LinearGradient colors={["#833AB4", "#E1306C"]} style={calStyles.liveDot} />
              <Text style={[calStyles.liveSectionTitle, { color: c.text }]}>Live Autopay Schedules</Text>
              {schedulesLoading && <ActivityIndicator size="small" color="#833AB4" style={{ marginLeft: 8 }} />}
            </View>
            <View style={{ flexDirection: "row", alignItems: "center", gap: 6 }}>
              {schedules.length > 0 && (
                <View style={[calStyles.liveBadge, { backgroundColor: "#833AB420" }]}>
                  <Text style={[calStyles.liveBadgeText, { color: "#833AB4" }]}>{schedules.length}</Text>
                </View>
              )}
              <Feather name={showSchedules ? "chevron-up" : "chevron-down"} size={16} color={c.textSecondary} />
            </View>
          </Pressable>

          {showSchedules && (
            <>
              {schedules.length === 0 && !schedulesLoading ? (
                <View style={[calStyles.liveEmpty, { backgroundColor: c.backgroundSecondary }]}>
                  <Feather name="zap" size={28} color={c.textTertiary} />
                  <Text style={[calStyles.liveEmptyTitle, { color: c.textSecondary }]}>No Autopay Schedules</Text>
                  <Text style={[calStyles.liveEmptyText, { color: c.textTertiary }]}>
                    Tap "Autopay" on any bonus in Discover to schedule a direct deposit
                  </Text>
                </View>
              ) : (
                <>
                  {activeSchedules.length > 0 && (
                    <>
                      <Text style={[calStyles.liveSubtitle, { color: c.textSecondary }]}>ACTIVE ({activeSchedules.length})</Text>
                      {activeSchedules.map(s => <LiveScheduleCard key={s.id} sched={s} isDark={isDark} />)}
                    </>
                  )}
                  {completedSchedules.length > 0 && (
                    <>
                      <Text style={[calStyles.liveSubtitle, { color: c.textTertiary, marginTop: 12 }]}>COMPLETED ({completedSchedules.length})</Text>
                      {completedSchedules.map(s => <LiveScheduleCard key={s.id} sched={s} isDark={isDark} />)}
                    </>
                  )}
                </>
              )}
            </>
          )}
        </View>

        {/* Upcoming this month */}
        <View style={calStyles.upcomingSection}>
          <Text style={[calStyles.upcomingSectionTitle, { color: c.textSecondary }]}>Upcoming This Month</Text>
          {monthEvents.length === 0 ? (
            <Text style={[calStyles.noEventsSmall, { color: c.textTertiary }]}>No transactions this month</Text>
          ) : (
            monthEvents.slice(0, 5).map(e => (
              <View key={e.id} style={[calStyles.upcomingItem, { backgroundColor: c.backgroundSecondary }]}>
                <View style={[calStyles.upcomingDot, { backgroundColor: EVENT_COLORS[e.type] }]} />
                <Text style={[calStyles.upcomingBank, { color: c.text }]}>{e.bankName}</Text>
                <Text style={[calStyles.upcomingDate, { color: c.textSecondary }]}>{new Date(e.date).toLocaleDateString()}</Text>
                <Text style={[calStyles.upcomingAmount, { color: EVENT_COLORS[e.type] }]}>${e.amount.toLocaleString()}</Text>
              </View>
            ))
          )}
        </View>
      </ScrollView>

      <AddEventModal visible={addModalVisible} selectedDate={selectedDate} onClose={() => setAddModalVisible(false)} />
    </View>
  );
}

// ─── Styles ───────────────────────────────────────────────────────────────────
const lsStyles = StyleSheet.create({
  card: { borderRadius: 14, borderWidth: 1, marginHorizontal: 16, marginBottom: 12, overflow: "hidden" },
  cardAccent: { height: 3 },
  cardTop: { flexDirection: "row", alignItems: "flex-start", padding: 12, paddingBottom: 8 },
  bankName: { fontSize: 15, fontFamily: "Inter_700Bold" },
  acctNum: { fontSize: 12, fontFamily: "Inter_400Regular", marginTop: 2 },
  statusBadge: { flexDirection: "row", alignItems: "center", gap: 4, paddingHorizontal: 8, paddingVertical: 4, borderRadius: 8 },
  statusText: { fontSize: 11, fontFamily: "Inter_600SemiBold" },
  demoBadge: { paddingHorizontal: 6, paddingVertical: 2, borderRadius: 4 },
  demoText: { fontSize: 9, fontFamily: "Inter_700Bold", color: "#9E9E9E", letterSpacing: 1 },
  progressTrack: { height: 4, marginHorizontal: 12, borderRadius: 2, overflow: "hidden" },
  progressFill: { height: 4 },
  progressPct: { fontSize: 10, fontFamily: "Inter_400Regular", textAlign: "right", paddingHorizontal: 12, marginTop: 3, marginBottom: 8 },
  amtGrid: { flexDirection: "row", alignItems: "center", paddingHorizontal: 12, marginBottom: 10 },
  amtCell: { flex: 1, alignItems: "center" },
  amtVal: { fontSize: 16, fontFamily: "Inter_700Bold" },
  amtLabel: { fontSize: 10, fontFamily: "Inter_400Regular", marginTop: 2 },
  amtDivider: { width: 1, height: 30, marginHorizontal: 4 },
  timeline: { flexDirection: "row", alignItems: "center", paddingHorizontal: 12, paddingBottom: 10 },
  tlItem: { flex: 1, alignItems: "center", gap: 2 },
  tlDate: { fontSize: 11, fontFamily: "Inter_600SemiBold" },
  tlLabel: { fontSize: 9, fontFamily: "Inter_400Regular" },
  tlArrow: { width: 20, height: 1 },
  dots: { flexDirection: "row", alignItems: "center", paddingHorizontal: 12, paddingBottom: 12 },
  dotItem: { flexDirection: "row", alignItems: "center" },
  dot: { width: 12, height: 12, borderRadius: 6, borderWidth: 1.5, alignItems: "center", justifyContent: "center" },
  dotInner: { width: 4, height: 4, borderRadius: 2 },
  dotLine: { width: 16, height: 1.5, marginHorizontal: 2 },
});

const calStyles = StyleSheet.create({
  container: { flex: 1 },
  header: { paddingHorizontal: 16, paddingBottom: 16 },
  headerTop: { flexDirection: "row", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 12 },
  headerTitle: { fontSize: 28, fontFamily: "Inter_700Bold", color: "#fff" },
  headerSub: { fontSize: 12, fontFamily: "Inter_400Regular", color: "rgba(255,255,255,0.7)", marginTop: 2 },
  addBtn: { width: 36, height: 36, alignItems: "center", justifyContent: "center" },
  monthNav: { flexDirection: "row", alignItems: "center", justifyContent: "space-between" },
  navBtn: { width: 36, height: 36, alignItems: "center", justifyContent: "center", backgroundColor: "rgba(255,255,255,0.15)", borderRadius: 10 },
  monthText: { fontSize: 18, fontFamily: "Inter_700Bold", color: "#fff" },
  calContainer: { margin: 16, borderRadius: 16, borderWidth: 1, overflow: "hidden", padding: 12 },
  grid: { gap: 4 },
  dayRow: { flexDirection: "row" },
  dayLabel: { flex: 1, textAlign: "center", fontSize: 11, fontFamily: "Inter_600SemiBold", paddingVertical: 6 },
  row: { flexDirection: "row" },
  cell: { flex: 1, aspectRatio: 1, alignItems: "center", justifyContent: "center", borderRadius: 10 },
  selectedCell: { backgroundColor: "#E1306C" },
  todayCell: { borderWidth: 1.5, borderRadius: 10 },
  cellText: { fontSize: 13 },
  eventDot: { width: 4, height: 4, borderRadius: 2, marginTop: 2 },
  eventsSection: { paddingHorizontal: 16, marginBottom: 16 },
  eventsSectionHeader: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginBottom: 10 },
  eventsSectionTitle: { fontSize: 16, fontFamily: "Inter_700Bold" },
  addEventBtn: {},
  addEventBtnGrad: { flexDirection: "row", alignItems: "center", gap: 4, paddingHorizontal: 12, paddingVertical: 6, borderRadius: 8 },
  addEventBtnText: { fontSize: 13, fontFamily: "Inter_600SemiBold", color: "#fff" },
  noEvents: { padding: 20, borderRadius: 12, alignItems: "center", gap: 8 },
  noEventsText: { fontSize: 14, fontFamily: "Inter_400Regular" },
  eventItem: { flexDirection: "row", alignItems: "center", gap: 10, padding: 12, borderRadius: 12, borderWidth: 1, marginBottom: 8 },
  eventIconBox: { width: 36, height: 36, borderRadius: 10, alignItems: "center", justifyContent: "center" },
  eventContent: { flex: 1 },
  eventBank: { fontSize: 14, fontFamily: "Inter_600SemiBold" },
  eventType: { fontSize: 12, fontFamily: "Inter_400Regular", marginTop: 2 },
  eventRight: { alignItems: "flex-end", gap: 4 },
  eventAmount: { fontSize: 14, fontFamily: "Inter_700Bold" },
  eventStatusDot: { width: 8, height: 8, borderRadius: 4 },
  deleteEventBtn: { padding: 4 },
  liveSection: { paddingHorizontal: 0, marginBottom: 8 },
  liveSectionHeader: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", paddingHorizontal: 16, marginBottom: 12 },
  liveSectionTitleRow: { flexDirection: "row", alignItems: "center", gap: 8 },
  liveDot: { width: 8, height: 8, borderRadius: 4 },
  liveSectionTitle: { fontSize: 16, fontFamily: "Inter_700Bold" },
  liveBadge: { paddingHorizontal: 8, paddingVertical: 2, borderRadius: 8 },
  liveBadgeText: { fontSize: 12, fontFamily: "Inter_700Bold" },
  liveSubtitle: { fontSize: 11, fontFamily: "Inter_600SemiBold", paddingHorizontal: 16, marginBottom: 8, textTransform: "uppercase", letterSpacing: 0.5 },
  liveEmpty: { margin: 16, borderRadius: 16, padding: 32, alignItems: "center", gap: 10 },
  liveEmptyTitle: { fontSize: 16, fontFamily: "Inter_700Bold" },
  liveEmptyText: { fontSize: 13, fontFamily: "Inter_400Regular", textAlign: "center", lineHeight: 18 },
  upcomingSection: { paddingHorizontal: 16 },
  upcomingSectionTitle: { fontSize: 13, fontFamily: "Inter_600SemiBold", marginBottom: 8, textTransform: "uppercase", letterSpacing: 1 },
  upcomingItem: { flexDirection: "row", alignItems: "center", gap: 8, padding: 10, borderRadius: 10, marginBottom: 6 },
  upcomingDot: { width: 8, height: 8, borderRadius: 4 },
  upcomingBank: { flex: 1, fontSize: 13, fontFamily: "Inter_600SemiBold" },
  upcomingDate: { fontSize: 12, fontFamily: "Inter_400Regular" },
  upcomingAmount: { fontSize: 13, fontFamily: "Inter_700Bold" },
  noEventsSmall: { fontSize: 13, fontFamily: "Inter_400Regular" },
  modalOverlay: { flex: 1, backgroundColor: "rgba(0,0,0,0.5)", justifyContent: "flex-end" },
  modalSheet: { borderTopLeftRadius: 24, borderTopRightRadius: 24, padding: 20 },
  modalHandle: { width: 36, height: 4, backgroundColor: "#ccc", borderRadius: 2, alignSelf: "center", marginBottom: 16 },
  modalTitle: { fontSize: 22, fontFamily: "Inter_700Bold", marginBottom: 4 },
  modalDate: { fontSize: 14, fontFamily: "Inter_400Regular", marginBottom: 16 },
  inputLabel: { fontSize: 13, fontFamily: "Inter_600SemiBold", marginBottom: 6, marginTop: 12 },
  inputField: { borderRadius: 12, borderWidth: 1, paddingHorizontal: 14, paddingVertical: 12, fontSize: 15, fontFamily: "Inter_400Regular" },
  typeRow: { flexDirection: "row", gap: 8 },
  typeChip: { flex: 1, flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 6, paddingVertical: 10, borderRadius: 10, borderWidth: 1, borderColor: "#ccc" },
  typeChipText: { fontSize: 13, fontFamily: "Inter_600SemiBold" },
  accountScroll: { marginBottom: 4 },
  accountChip: { flexDirection: "row", alignItems: "center", gap: 6, paddingHorizontal: 12, paddingVertical: 8, borderRadius: 10, borderWidth: 1, borderColor: "#ccc", marginRight: 8 },
  accountChipDot: { width: 10, height: 10, borderRadius: 5 },
  accountChipText: { fontSize: 13, fontFamily: "Inter_600SemiBold" },
  saveBtn: { marginTop: 20 },
  saveBtnGrad: { paddingVertical: 16, borderRadius: 14, alignItems: "center" },
  saveBtnText: { fontSize: 16, fontFamily: "Inter_600SemiBold", color: "#fff" },
  cancelBtn: { borderWidth: 1, borderRadius: 14, paddingVertical: 14, alignItems: "center", marginTop: 10 },
  cancelText: { fontSize: 15, fontFamily: "Inter_600SemiBold" },
});
