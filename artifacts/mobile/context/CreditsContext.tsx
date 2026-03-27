import AsyncStorage from "@react-native-async-storage/async-storage";
import React, { createContext, useCallback, useContext, useEffect, useState } from "react";

interface CreditTransaction {
  id: string;
  type: "purchase" | "deployment" | "return";
  amount: number;
  fee?: number;
  bankName?: string;
  date: string;
  stripePaymentId?: string;
}

interface CreditsContextType {
  totalCredits: number;
  usedCredits: number;
  availableCredits: number;
  transactions: CreditTransaction[];
  addCreditPurchase: (amount: number, fee: number, stripePaymentId?: string) => Promise<void>;
  deployCredit: (amount: number, bankName: string) => Promise<void>;
}

const CreditsContext = createContext<CreditsContextType | null>(null);

export function CreditsProvider({ children }: { children: React.ReactNode }) {
  const [totalCredits, setTotalCredits] = useState(0);
  const [usedCredits, setUsedCredits] = useState(0);
  const [transactions, setTransactions] = useState<CreditTransaction[]>([]);

  useEffect(() => {
    AsyncStorage.getItem("bbb_credits").then(stored => {
      if (stored) {
        const data = JSON.parse(stored);
        setTotalCredits(data.totalCredits || 0);
        setUsedCredits(data.usedCredits || 0);
        setTransactions(data.transactions || []);
      }
    });
  }, []);

  const save = async (total: number, used: number, txns: CreditTransaction[]) => {
    setTotalCredits(total);
    setUsedCredits(used);
    setTransactions(txns);
    await AsyncStorage.setItem("bbb_credits", JSON.stringify({ totalCredits: total, usedCredits: used, transactions: txns }));
  };

  const addCreditPurchase = useCallback(async (amount: number, fee: number, stripePaymentId?: string) => {
    const id = Date.now().toString() + Math.random().toString(36).substr(2, 9);
    const tx: CreditTransaction = {
      id,
      type: "purchase",
      amount,
      fee,
      date: new Date().toISOString(),
      stripePaymentId,
    };
    await save(totalCredits + amount, usedCredits, [tx, ...transactions]);
  }, [totalCredits, usedCredits, transactions]);

  const deployCredit = useCallback(async (amount: number, bankName: string) => {
    const id = Date.now().toString() + Math.random().toString(36).substr(2, 9);
    const tx: CreditTransaction = {
      id,
      type: "deployment",
      amount,
      bankName,
      date: new Date().toISOString(),
    };
    await save(totalCredits, usedCredits + amount, [tx, ...transactions]);
  }, [totalCredits, usedCredits, transactions]);

  return (
    <CreditsContext.Provider value={{
      totalCredits,
      usedCredits,
      availableCredits: totalCredits - usedCredits,
      transactions,
      addCreditPurchase,
      deployCredit,
    }}>
      {children}
    </CreditsContext.Provider>
  );
}

export function useCredits() {
  const ctx = useContext(CreditsContext);
  if (!ctx) throw new Error("useCredits must be used within CreditsProvider");
  return ctx;
}
