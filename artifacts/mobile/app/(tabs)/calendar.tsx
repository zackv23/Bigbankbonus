import { Feather } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";
import { LinearGradient } from "expo-linear-gradient";
import React, { useMemo, useState } from "react";
import {
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
import { ScheduledEvent, useScheduler } from "@/context/SchedulerContext";
import { useAccounts } from "@/context/AccountsContext";

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
  year: number;
  month: number;
  events: ScheduledEvent[];
  selectedDate: string | null;
  onSelectDate: (date: string) => void;
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
  for (let i = 0; i < cells.length; i += 7) {
    rows.push(cells.slice(i, i + 7));
  }

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
                style={[
                  calStyles.cell,
                  isSelected && calStyles.selectedCell,
                  isToday && !isSelected && [calStyles.todayCell, { borderColor: c.tintSecondary }],
                ]}
                onPress={() => {
                  if (Platform.OS !== "web") Haptics.selectionAsync();
                  onSelectDate(dateStr);
                }}
              >
                <Text style={[
                  calStyles.cellText,
                  { color: isSelected ? "#fff" : isToday ? c.tintSecondary : c.text },
                  { fontFamily: isToday || isSelected ? "Inter_700Bold" : "Inter_400Regular" }
                ]}>{day}</Text>
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
    setAmount("");
    setNotes("");
    onClose();
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
              <Pressable
                key={t}
                style={[calStyles.typeChip, type === t && { backgroundColor: EVENT_COLORS[t] + "22", borderColor: EVENT_COLORS[t] }]}
                onPress={() => setType(t)}
              >
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
              <Pressable
                key={a.id}
                style={[calStyles.accountChip, selectedAccount === a.id && { backgroundColor: "#833AB422", borderColor: "#833AB4" }]}
                onPress={() => setSelectedAccount(a.id)}
              >
                <View style={[calStyles.accountChipDot, { backgroundColor: a.logoColor }]} />
                <Text style={[calStyles.accountChipText, { color: selectedAccount === a.id ? "#833AB4" : c.text }]}>{a.bankName}</Text>
              </Pressable>
            ))}
          </ScrollView>

          <Text style={[calStyles.inputLabel, { color: c.textSecondary }]}>Amount ($)</Text>
          <TextInput
            style={[calStyles.inputField, { backgroundColor: c.backgroundSecondary, color: c.text, borderColor: c.cardBorder }]}
            placeholder="0.00"
            placeholderTextColor={c.textTertiary}
            value={amount}
            onChangeText={setAmount}
            keyboardType="decimal-pad"
          />

          <Text style={[calStyles.inputLabel, { color: c.textSecondary }]}>Notes (optional)</Text>
          <TextInput
            style={[calStyles.inputField, { backgroundColor: c.backgroundSecondary, color: c.text, borderColor: c.cardBorder }]}
            placeholder="Add a note..."
            placeholderTextColor={c.textTertiary}
            value={notes}
            onChangeText={setNotes}
          />

          <Pressable
            style={[calStyles.saveBtn, { opacity: selectedAccount && amount ? 1 : 0.5 }]}
            onPress={handleSave}
            disabled={!selectedAccount || !amount}
          >
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

export default function CalendarScreen() {
  const insets = useSafeAreaInsets();
  const colorScheme = useColorScheme();
  const isDark = colorScheme === "dark";
  const c = isDark ? Colors.dark : Colors.light;
  const { events, getEventsForDate, getEventsForMonth, updateEvent, removeEvent } = useScheduler();
  const [today] = useState(new Date());
  const [year, setYear] = useState(today.getFullYear());
  const [month, setMonth] = useState(today.getMonth());
  const [selectedDate, setSelectedDate] = useState<string | null>(null);
  const [addModalVisible, setAddModalVisible] = useState(false);

  const monthEvents = useMemo(() => getEventsForMonth(year, month), [events, year, month]);
  const selectedEvents = useMemo(() => selectedDate ? getEventsForDate(selectedDate) : [], [events, selectedDate]);

  const prevMonth = () => {
    if (Platform.OS !== "web") Haptics.selectionAsync();
    if (month === 0) { setYear(y => y - 1); setMonth(11); }
    else setMonth(m => m - 1);
  };

  const nextMonth = () => {
    if (Platform.OS !== "web") Haptics.selectionAsync();
    if (month === 11) { setYear(y => y + 1); setMonth(0); }
    else setMonth(m => m + 1);
  };

  return (
    <View style={[calStyles.container, { backgroundColor: c.background }]}>
      <View style={[calStyles.header, { paddingTop: insets.top + (Platform.OS === "web" ? 67 : 12) }]}>
        <LinearGradient colors={["#F77737", "#E1306C"]} start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }} style={StyleSheet.absoluteFill} />
        <View style={calStyles.headerTop}>
          <Text style={calStyles.headerTitle}>Schedule</Text>
          <Pressable
            style={calStyles.addBtn}
            onPress={() => {
              if (!selectedDate) setSelectedDate(new Date().toISOString().slice(0, 10));
              setAddModalVisible(true);
            }}
          >
            <Feather name="plus" size={20} color="#fff" />
          </Pressable>
        </View>

        <View style={calStyles.monthNav}>
          <Pressable style={calStyles.navBtn} onPress={prevMonth}>
            <Feather name="chevron-left" size={22} color="#fff" />
          </Pressable>
          <Text style={calStyles.monthText}>{MONTHS[month]} {year}</Text>
          <Pressable style={calStyles.navBtn} onPress={nextMonth}>
            <Feather name="chevron-right" size={22} color="#fff" />
          </Pressable>
        </View>
      </View>

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingBottom: insets.bottom + (Platform.OS === "web" ? 34 : 80) }}
      >
        <View style={[calStyles.calContainer, { backgroundColor: c.card, borderColor: c.cardBorder }]}>
          <CalendarGrid
            year={year}
            month={month}
            events={monthEvents}
            selectedDate={selectedDate}
            onSelectDate={setSelectedDate}
          />
        </View>

        {selectedDate && (
          <View style={calStyles.eventsSection}>
            <View style={calStyles.eventsSectionHeader}>
              <Text style={[calStyles.eventsSectionTitle, { color: c.text }]}>
                {new Date(selectedDate).toLocaleDateString("en-US", { weekday: "long", month: "short", day: "numeric" })}
              </Text>
              <Pressable
                style={calStyles.addEventBtn}
                onPress={() => setAddModalVisible(true)}
              >
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
                  <Pressable
                    style={calStyles.deleteEventBtn}
                    onPress={() => {
                      if (Platform.OS !== "web") Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                      removeEvent(event.id);
                    }}
                  >
                    <Feather name="x" size={16} color={c.textTertiary} />
                  </Pressable>
                </View>
              ))
            )}
          </View>
        )}

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

      <AddEventModal
        visible={addModalVisible}
        selectedDate={selectedDate}
        onClose={() => setAddModalVisible(false)}
      />
    </View>
  );
}

const calStyles = StyleSheet.create({
  container: { flex: 1 },
  header: { paddingHorizontal: 16, paddingBottom: 16 },
  headerTop: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginBottom: 14 },
  headerTitle: { fontSize: 28, fontFamily: "Inter_700Bold", color: "#fff" },
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
