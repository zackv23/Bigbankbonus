import AsyncStorage from "@react-native-async-storage/async-storage";
import * as WebBrowser from "expo-web-browser";
import React, { createContext, useCallback, useContext, useEffect, useState } from "react";
import { Alert, Platform } from "react-native";

export interface PlaidAccount {
  account_id: string;
  name: string;
  type: string;
  subtype: string;
  mask?: string;
  balances: {
    available: number | null;
    current: number | null;
    iso_currency_code: string;
  };
}

export interface PlaidTransaction {
  transaction_id: string;
  account_id: string;
  name: string;
  amount: number;
  date: string;
  category: string[];
  payment_channel: string;
}

export interface PlaidItem {
  id: number;
  itemId: string;
  userId: string;
  institutionName: string | null;
  institutionId: string | null;
  accounts: PlaidAccount[] | null;
  status: string;
  createdAt: string;
}

interface PlaidContextValue {
  items: PlaidItem[];
  transactions: PlaidTransaction[];
  isLoading: boolean;
  isConfigured: boolean;
  linkBank: () => Promise<void>;
  unlinkBank: (itemId: string) => Promise<void>;
  refreshBalance: (itemId: string) => Promise<PlaidAccount[]>;
  fetchTransactions: (itemId: string) => Promise<PlaidTransaction[]>;
  totalLinkedBalance: number;
  directDepositsDetected: number;
  bonusesDetected: number;
}

const PlaidContext = createContext<PlaidContextValue>({
  items: [],
  transactions: [],
  isLoading: false,
  isConfigured: false,
  linkBank: async () => {},
  unlinkBank: async () => {},
  refreshBalance: async () => [],
  fetchTransactions: async () => [],
  totalLinkedBalance: 0,
  directDepositsDetected: 0,
  bonusesDetected: 0,
});

const STORAGE_KEY = "bbb_plaid_items";

export function PlaidProvider({ children }: { children: React.ReactNode }) {
  const [items, setItems] = useState<PlaidItem[]>([]);
  const [transactions, setTransactions] = useState<PlaidTransaction[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isConfigured, setIsConfigured] = useState(false);

  const getApiUrl = (path: string) => {
    const domain = process.env.EXPO_PUBLIC_DOMAIN;
    if (domain) return `https://${domain}/api${path}`;
    return `http://localhost:8080/api${path}`;
  };

  const getUserId = async () => {
    try {
      const raw = await AsyncStorage.getItem("bbb_user");
      if (!raw) return "demo-user";
      const user = JSON.parse(raw);
      return user?.id ?? user?.email ?? "demo-user";
    } catch {
      return "demo-user";
    }
  };

  useEffect(() => {
    loadCachedItems();
    checkConfiguration();
  }, []);

  const checkConfiguration = async () => {
    try {
      const res = await fetch(getApiUrl("/plaid/link-token"), {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userId: "ping" }),
        signal: AbortSignal.timeout(5000),
      });
      const data = await res.json();
      setIsConfigured(!data.sandbox && !!data.link_token);
    } catch {
      setIsConfigured(false);
    }
  };

  const loadCachedItems = async () => {
    try {
      const raw = await AsyncStorage.getItem(STORAGE_KEY);
      if (raw) setItems(JSON.parse(raw));
    } catch {}
  };

  const saveItems = async (newItems: PlaidItem[]) => {
    setItems(newItems);
    await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(newItems));
  };

  const linkBank = useCallback(async () => {
    setIsLoading(true);
    try {
      const userId = await getUserId();

      const tokenRes = await fetch(getApiUrl("/plaid/link-token"), {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userId }),
        signal: AbortSignal.timeout(10000),
      });
      const tokenData = await tokenRes.json();

      if (tokenData.sandbox || tokenData.link_token === "link-sandbox-demo-token") {
        // Demo mode — create a mock linked bank
        const exchangeRes = await fetch(getApiUrl("/plaid/exchange-token"), {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            publicToken: "demo-public-token",
            userId,
            metadata: {
              institution: { institution_id: "ins_demo", name: "Chase Bank (Demo)" },
              accounts: [
                {
                  account_id: `demo-checking-${Date.now()}`,
                  name: "Total Checking",
                  type: "depository",
                  subtype: "checking",
                  mask: "4567",
                  balances: { available: 3500, current: 3500, iso_currency_code: "USD" },
                },
                {
                  account_id: `demo-savings-${Date.now()}`,
                  name: "Total Savings",
                  type: "depository",
                  subtype: "savings",
                  mask: "8901",
                  balances: { available: 12500, current: 12500, iso_currency_code: "USD" },
                },
              ],
            },
          }),
        });
        const exchangeData = await exchangeRes.json();
        if (exchangeData.item) {
          const updated = [...items, { ...exchangeData.item, id: Date.now(), createdAt: new Date().toISOString() }];
          await saveItems(updated);
          // Backfill existing active autopay schedules with this Plaid link
          fetch(getApiUrl("/autopay/link-plaid"), {
            method: "PATCH",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ userId }),
          }).catch(() => {});
          Alert.alert(
            "Bank Linked (Demo)",
            "Chase Bank (Demo) linked successfully. In production, Plaid securely connects to your real bank.",
          );
        }
        return;
      }

      // Real Plaid Link via browser
      const linkToken = tokenData.link_token;
      const redirectUrl = `https://${process.env.EXPO_PUBLIC_DOMAIN}/plaid-callback`;

      if (Platform.OS === "web") {
        window.location.href = `https://link.plaid.com/?token=${linkToken}`;
        return;
      }

      const result = await WebBrowser.openAuthSessionAsync(
        `https://link.plaid.com/?token=${linkToken}&redirect_uri=${encodeURIComponent(redirectUrl)}`,
        redirectUrl,
      );

      if (result.type === "success" && result.url) {
        const url = new URL(result.url);
        const publicToken = url.searchParams.get("public_token") ?? url.searchParams.get("oauth_state_id");
        if (publicToken) {
          const exchangeRes = await fetch(getApiUrl("/plaid/exchange-token"), {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ publicToken, userId }),
          });
          const exchangeData = await exchangeRes.json();
          if (exchangeData.item) {
            const updated = [...items, { ...exchangeData.item, id: Date.now(), createdAt: new Date().toISOString() }];
            await saveItems(updated);
            // Backfill existing active autopay schedules with this Plaid link
            fetch(getApiUrl("/autopay/link-plaid"), {
              method: "PATCH",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({ userId }),
            }).catch(() => {});
          }
        }
      }
    } catch (err: any) {
      Alert.alert("Error", err.message ?? "Failed to link bank. Please try again.");
    } finally {
      setIsLoading(false);
    }
  }, [items]);

  const unlinkBank = useCallback(async (itemId: string) => {
    const userId = await getUserId();
    try {
      await fetch(getApiUrl(`/plaid/items/${itemId}`), {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userId }),
      });
    } catch {}
    const updated = items.filter(i => i.itemId !== itemId);
    await saveItems(updated);
  }, [items]);

  const refreshBalance = useCallback(async (itemId: string): Promise<PlaidAccount[]> => {
    const userId = await getUserId();
    try {
      const res = await fetch(getApiUrl(`/plaid/balance?userId=${encodeURIComponent(userId)}&itemId=${encodeURIComponent(itemId)}`));
      const data = await res.json();
      const accts: PlaidAccount[] = data.accounts ?? [];
      const updated = items.map(item =>
        item.itemId === itemId ? { ...item, accounts: accts } : item
      );
      await saveItems(updated);
      return accts;
    } catch {
      return [];
    }
  }, [items]);

  const fetchTransactions = useCallback(async (itemId: string): Promise<PlaidTransaction[]> => {
    const userId = await getUserId();
    try {
      const res = await fetch(getApiUrl(`/plaid/transactions?userId=${encodeURIComponent(userId)}&itemId=${encodeURIComponent(itemId)}`));
      const data = await res.json();
      const txs: PlaidTransaction[] = data.transactions ?? [];
      setTransactions(txs);
      return txs;
    } catch {
      return [];
    }
  }, []);

  const totalLinkedBalance = items
    .filter(i => i.status === "active")
    .flatMap(i => (i.accounts as PlaidAccount[] | null) ?? [])
    .reduce((sum, a) => sum + (a.balances.available ?? 0), 0);

  const directDepositsDetected = transactions.filter(
    t => t.category?.some(c => c.toLowerCase().includes("direct deposit") || c.toLowerCase().includes("payroll")) && t.amount < 0
  ).length;

  const bonusesDetected = transactions.filter(
    t => t.name.toLowerCase().includes("bonus") || t.name.toLowerCase().includes("reward") && t.amount < 0
  ).length;

  return (
    <PlaidContext.Provider value={{
      items,
      transactions,
      isLoading,
      isConfigured,
      linkBank,
      unlinkBank,
      refreshBalance,
      fetchTransactions,
      totalLinkedBalance,
      directDepositsDetected,
      bonusesDetected,
    }}>
      {children}
    </PlaidContext.Provider>
  );
}

export const usePlaid = () => useContext(PlaidContext);
