import AsyncStorage from "@react-native-async-storage/async-storage";
import React, { createContext, useCallback, useContext, useEffect, useState } from "react";

export interface ScheduledEvent {
  id: string;
  accountId: string;
  bankName: string;
  type: "deposit" | "withdrawal" | "direct_deposit";
  amount: number;
  date: string;
  status: "scheduled" | "completed" | "missed";
  notes: string;
  color: string;
}

interface SchedulerContextType {
  events: ScheduledEvent[];
  addEvent: (event: Omit<ScheduledEvent, "id">) => Promise<void>;
  updateEvent: (id: string, updates: Partial<ScheduledEvent>) => Promise<void>;
  removeEvent: (id: string) => Promise<void>;
  getEventsForDate: (date: string) => ScheduledEvent[];
  getEventsForMonth: (year: number, month: number) => ScheduledEvent[];
}

const SchedulerContext = createContext<SchedulerContextType | null>(null);

export function SchedulerProvider({ children }: { children: React.ReactNode }) {
  const [events, setEvents] = useState<ScheduledEvent[]>([]);

  useEffect(() => {
    AsyncStorage.getItem("bbb_events").then(stored => {
      if (stored) setEvents(JSON.parse(stored));
    });
  }, []);

  const save = async (evts: ScheduledEvent[]) => {
    setEvents(evts);
    await AsyncStorage.setItem("bbb_events", JSON.stringify(evts));
  };

  const addEvent = useCallback(async (event: Omit<ScheduledEvent, "id">) => {
    const id = Date.now().toString() + Math.random().toString(36).substr(2, 9);
    const next = [...events, { ...event, id }];
    await save(next);
  }, [events]);

  const updateEvent = useCallback(async (id: string, updates: Partial<ScheduledEvent>) => {
    const next = events.map(e => e.id === id ? { ...e, ...updates } : e);
    await save(next);
  }, [events]);

  const removeEvent = useCallback(async (id: string) => {
    const next = events.filter(e => e.id !== id);
    await save(next);
  }, [events]);

  const getEventsForDate = useCallback((date: string) => {
    return events.filter(e => e.date.startsWith(date));
  }, [events]);

  const getEventsForMonth = useCallback((year: number, month: number) => {
    const prefix = `${year}-${String(month + 1).padStart(2, "0")}`;
    return events.filter(e => e.date.startsWith(prefix));
  }, [events]);

  return (
    <SchedulerContext.Provider value={{ events, addEvent, updateEvent, removeEvent, getEventsForDate, getEventsForMonth }}>
      {children}
    </SchedulerContext.Provider>
  );
}

export function useScheduler() {
  const ctx = useContext(SchedulerContext);
  if (!ctx) throw new Error("useScheduler must be used within SchedulerProvider");
  return ctx;
}
