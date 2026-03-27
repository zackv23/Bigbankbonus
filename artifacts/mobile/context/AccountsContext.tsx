import AsyncStorage from "@react-native-async-storage/async-storage";
import React, { createContext, useCallback, useContext, useEffect, useState } from "react";

export interface ManagedAccount {
  id: string;
  bankId: string;
  bankName: string;
  bonusAmount: number;
  directDepositRequired: number;
  accountNumber?: string;
  routingNumber?: string;
  status: "pending" | "active" | "bonus_received" | "closed";
  openedDate: string;
  bonusReceivedDate?: string;
  deposited: number;
  notes: string;
  logoColor: string;
}

interface AccountsContextType {
  accounts: ManagedAccount[];
  addAccount: (account: Omit<ManagedAccount, "id">) => Promise<void>;
  updateAccount: (id: string, updates: Partial<ManagedAccount>) => Promise<void>;
  removeAccount: (id: string) => Promise<void>;
  totalBonusEarned: number;
  totalBonusPending: number;
  totalDeposited: number;
}

const AccountsContext = createContext<AccountsContextType | null>(null);

export function AccountsProvider({ children }: { children: React.ReactNode }) {
  const [accounts, setAccounts] = useState<ManagedAccount[]>([]);

  useEffect(() => {
    AsyncStorage.getItem("bbb_accounts").then(stored => {
      if (stored) setAccounts(JSON.parse(stored));
    });
  }, []);

  const save = async (accs: ManagedAccount[]) => {
    setAccounts(accs);
    await AsyncStorage.setItem("bbb_accounts", JSON.stringify(accs));
  };

  const addAccount = useCallback(async (account: Omit<ManagedAccount, "id">) => {
    const id = Date.now().toString() + Math.random().toString(36).substr(2, 9);
    const next = [...accounts, { ...account, id }];
    await save(next);
  }, [accounts]);

  const updateAccount = useCallback(async (id: string, updates: Partial<ManagedAccount>) => {
    const next = accounts.map(a => a.id === id ? { ...a, ...updates } : a);
    await save(next);
  }, [accounts]);

  const removeAccount = useCallback(async (id: string) => {
    const next = accounts.filter(a => a.id !== id);
    await save(next);
  }, [accounts]);

  const totalBonusEarned = accounts
    .filter(a => a.status === "bonus_received")
    .reduce((sum, a) => sum + a.bonusAmount, 0);

  const totalBonusPending = accounts
    .filter(a => a.status !== "bonus_received" && a.status !== "closed")
    .reduce((sum, a) => sum + a.bonusAmount, 0);

  const totalDeposited = accounts.reduce((sum, a) => sum + a.deposited, 0);

  return (
    <AccountsContext.Provider value={{ accounts, addAccount, updateAccount, removeAccount, totalBonusEarned, totalBonusPending, totalDeposited }}>
      {children}
    </AccountsContext.Provider>
  );
}

export function useAccounts() {
  const ctx = useContext(AccountsContext);
  if (!ctx) throw new Error("useAccounts must be used within AccountsProvider");
  return ctx;
}
