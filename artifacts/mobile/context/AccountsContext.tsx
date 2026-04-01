import AsyncStorage from "@react-native-async-storage/async-storage";
import React, { createContext, useCallback, useContext, useEffect, useState } from "react";

export interface ManagedAccount {
  id: string;
  serverId?: number;
  bankId: string;
  bankName: string;
  bonusAmount: number;
  directDepositRequired: number;
  accountNumber?: string;
  routingNumber?: string;
  status: "pending" | "active" | "bonus_received" | "closed";
  approvalStatus: "pending" | "approved" | "denied";
  approvedAt?: string;
  openedDate: string;
  bonusReceivedDate?: string;
  deposited: number;
  notes: string;
  logoColor: string;
}

interface AccountsContextType {
  accounts: ManagedAccount[];
  addAccount: (account: Omit<ManagedAccount, "id" | "serverId">) => Promise<{ success: boolean; error?: string }>;
  updateAccount: (id: string, updates: Partial<ManagedAccount>) => Promise<void>;
  removeAccount: (id: string) => Promise<void>;
  approveAccount: (id: string) => Promise<void>;
  refreshApprovalStatus: (userId: string) => Promise<void>;
  totalBonusEarned: number;
  totalBonusPending: number;
  totalDeposited: number;
  freeAccountExists: boolean;
}

const AccountsContext = createContext<AccountsContextType | null>(null);

function getApiBase(): string {
  const domain = process.env.EXPO_PUBLIC_DOMAIN;
  return domain ? `https://${domain}/api` : "http://localhost:8080/api";
}

export function AccountsProvider({ children }: { children: React.ReactNode }) {
  const [accounts, setAccounts] = useState<ManagedAccount[]>([]);

  useEffect(() => {
    AsyncStorage.getItem("bbb_accounts").then(stored => {
      if (stored) {
        const parsed: ManagedAccount[] = JSON.parse(stored);
        const migrated = parsed.map(a => ({
          ...a,
          approvalStatus: (a.approvalStatus ?? "pending") as ManagedAccount["approvalStatus"],
        }));
        setAccounts(migrated);
      }
    });
  }, []);

  const save = async (accs: ManagedAccount[]) => {
    setAccounts(accs);
    await AsyncStorage.setItem("bbb_accounts", JSON.stringify(accs));
  };

  const freeAccountExists = accounts.some(a => a.status !== "closed");

  const addAccount = useCallback(async (account: Omit<ManagedAccount, "id" | "serverId">): Promise<{ success: boolean; error?: string }> => {
    const activeAccounts = accounts.filter(a => a.status !== "closed");
    if (activeAccounts.length >= 1) {
      return {
        success: false,
        error: "Only one free account is allowed. Your current account must be closed before opening a new one.",
      };
    }

    const localId = Date.now().toString() + Math.random().toString(36).slice(2, 9);
    let serverId: number | undefined;

    // Sync with backend — register the account so admin can approve it
    try {
      const userId = await AsyncStorage.getItem("bbb_user").then(u => u ? JSON.parse(u).id : null);
      if (userId) {
        const res = await fetch(`${getApiBase()}/accounts`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            userId,
            bankName: account.bankName,
            bonusAmount: account.bonusAmount,
            directDepositRequired: account.directDepositRequired,
          }),
        });
        if (res.status === 409) {
          const body = await res.json() as { code?: string; error?: string };
          if (body.code === "ONE_FREE_ACCOUNT_LIMIT") {
            return { success: false, error: body.error ?? "Only one free account is allowed per user." };
          }
        }
        if (res.ok) {
          const body = await res.json() as { account?: { id?: number } };
          serverId = body.account?.id;
        }
      }
    } catch {
      // Backend unreachable — continue with local tracking only
    }

    const newAccount: ManagedAccount = {
      ...account,
      id: localId,
      serverId,
      approvalStatus: account.approvalStatus ?? "pending",
    };

    await save([...accounts, newAccount]);
    return { success: true };
  }, [accounts]);

  const updateAccount = useCallback(async (id: string, updates: Partial<ManagedAccount>) => {
    const next = accounts.map(a => a.id === id ? { ...a, ...updates } : a);
    await save(next);
  }, [accounts]);

  const removeAccount = useCallback(async (id: string) => {
    await save(accounts.filter(a => a.id !== id));
  }, [accounts]);

  const approveAccount = useCallback(async (id: string) => {
    const now = new Date().toISOString();
    const next = accounts.map(a =>
      a.id === id
        ? { ...a, approvalStatus: "approved" as const, approvedAt: now }
        : a
    );
    await save(next);
  }, [accounts]);

  /**
   * Pull approval status from the server for all user accounts and reconcile
   * with local state. Called after sign-in or on app resume.
   */
  const refreshApprovalStatus = useCallback(async (userId: string) => {
    try {
      const res = await fetch(`${getApiBase()}/admin/accounts`, {
        headers: { "x-admin-secret": process.env.EXPO_PUBLIC_ADMIN_SECRET ?? "" },
      });
      if (!res.ok) return;
      const body = await res.json() as { accounts?: Array<{ id: number; userId: string; approvalStatus: string; approvedAt: string | null }> };
      const serverAccounts = (body.accounts ?? []).filter(a => a.userId === userId);
      if (serverAccounts.length === 0) return;

      const updated = accounts.map(a => {
        if (!a.serverId) return a;
        const match = serverAccounts.find(s => s.id === a.serverId);
        if (!match) return a;
        return {
          ...a,
          approvalStatus: match.approvalStatus as ManagedAccount["approvalStatus"],
          approvedAt: match.approvedAt ?? a.approvedAt,
        };
      });
      await save(updated);
    } catch {
      // Silently fail — local state remains the source of truth
    }
  }, [accounts]);

  const totalBonusEarned = accounts
    .filter(a => a.status === "bonus_received")
    .reduce((sum, a) => sum + a.bonusAmount, 0);

  const totalBonusPending = accounts
    .filter(a => a.status !== "bonus_received" && a.status !== "closed")
    .reduce((sum, a) => sum + a.bonusAmount, 0);

  const totalDeposited = accounts.reduce((sum, a) => sum + a.deposited, 0);

  return (
    <AccountsContext.Provider value={{
      accounts,
      addAccount,
      updateAccount,
      removeAccount,
      approveAccount,
      refreshApprovalStatus,
      totalBonusEarned,
      totalBonusPending,
      totalDeposited,
      freeAccountExists,
    }}>
      {children}
    </AccountsContext.Provider>
  );
}

export function useAccounts() {
  const ctx = useContext(AccountsContext);
  if (!ctx) throw new Error("useAccounts must be used within AccountsProvider");
  return ctx;
}
