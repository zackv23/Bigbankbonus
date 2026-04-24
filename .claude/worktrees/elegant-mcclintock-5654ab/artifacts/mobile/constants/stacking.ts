export type OfferType =
  | "personal_checking"
  | "personal_savings"
  | "business_checking"
  | "business_savings"
  | "credit_card";

export interface OfferCategory {
  key: OfferType;
  label: string;
  icon: string;
  color: string;
  bg: string;
}

export const OFFER_CATEGORIES: OfferCategory[] = [
  { key: "personal_checking", label: "Personal Checking", icon: "credit-card", color: "#2196F3", bg: "#2196F322" },
  { key: "personal_savings",  label: "Personal Savings",  icon: "dollar-sign",  color: "#4CAF50", bg: "#4CAF5022" },
  { key: "business_checking", label: "Business Checking", icon: "briefcase",    color: "#FF9800", bg: "#FF980022" },
  { key: "business_savings",  label: "Business Savings",  icon: "trending-up",  color: "#9C27B0", bg: "#9C27B022" },
  { key: "credit_card",       label: "Credit Cards",      icon: "award",        color: "#E1306C", bg: "#E1306C22" },
];

export type StackingPolicy = "allowed" | "restricted" | "unknown";

export interface TopBank {
  id: string;
  name: string;
  logoColor: string;
  assetsRankApprox: number;
  stackingPolicy: StackingPolicy;
  allowedCombinations: OfferType[][];
  notes: string;
  personalCheckingBonus?: number;
  personalSavingsBonus?: number;
  businessCheckingBonus?: number;
  businessSavingsBonus?: number;
  creditCardBonus?: number;
}

export const TOP_25_BANKS: TopBank[] = [
  {
    id: "jpmorgan-chase",
    name: "JPMorgan Chase",
    logoColor: "#117ACA",
    assetsRankApprox: 1,
    stackingPolicy: "allowed",
    allowedCombinations: [
      ["personal_checking", "personal_savings"],
      ["personal_checking", "business_checking"],
      ["personal_checking", "credit_card"],
      ["personal_savings", "business_checking"],
    ],
    notes: "Chase allows stacking personal checking + savings + business + credit card bonuses. Each product treated independently.",
    personalCheckingBonus: 300,
    personalSavingsBonus: 200,
    businessCheckingBonus: 300,
    creditCardBonus: 750,
  },
  {
    id: "bank-of-america",
    name: "Bank of America",
    logoColor: "#E31837",
    assetsRankApprox: 2,
    stackingPolicy: "restricted",
    allowedCombinations: [
      ["personal_checking", "credit_card"],
      ["business_checking", "credit_card"],
    ],
    notes: "BofA limits one checking bonus per 12 months. Credit card bonuses stack separately.",
    personalCheckingBonus: 200,
    businessCheckingBonus: 200,
    creditCardBonus: 500,
  },
  {
    id: "wells-fargo",
    name: "Wells Fargo",
    logoColor: "#CC0000",
    assetsRankApprox: 3,
    stackingPolicy: "restricted",
    allowedCombinations: [
      ["personal_checking", "credit_card"],
    ],
    notes: "One checking bonus per customer in a 12-month window. Savings and credit card bonuses may stack.",
    personalCheckingBonus: 300,
    creditCardBonus: 400,
  },
  {
    id: "citibank",
    name: "Citibank",
    logoColor: "#056DAE",
    assetsRankApprox: 4,
    stackingPolicy: "allowed",
    allowedCombinations: [
      ["personal_checking", "personal_savings"],
      ["personal_checking", "credit_card"],
      ["personal_savings", "credit_card"],
    ],
    notes: "Citi allows multiple product bonuses simultaneously. High-value offers for large deposits.",
    personalCheckingBonus: 2000,
    personalSavingsBonus: 500,
    creditCardBonus: 600,
  },
  {
    id: "us-bank",
    name: "U.S. Bank",
    logoColor: "#0A4595",
    assetsRankApprox: 5,
    stackingPolicy: "allowed",
    allowedCombinations: [
      ["personal_checking", "business_checking"],
      ["personal_checking", "credit_card"],
      ["business_checking", "credit_card"],
    ],
    notes: "USB allows personal and business accounts simultaneously. Credit card bonuses are independent.",
    personalCheckingBonus: 400,
    businessCheckingBonus: 500,
    creditCardBonus: 300,
  },
  {
    id: "pnc-bank",
    name: "PNC Bank",
    logoColor: "#F26921",
    assetsRankApprox: 6,
    stackingPolicy: "allowed",
    allowedCombinations: [
      ["personal_checking", "personal_savings"],
      ["personal_checking", "business_checking"],
    ],
    notes: "PNC allows stacking personal and business checking. Virtual Wallet accounts qualify.",
    personalCheckingBonus: 400,
    personalSavingsBonus: 200,
    businessCheckingBonus: 500,
  },
  {
    id: "truist",
    name: "Truist Bank",
    logoColor: "#6E2E8B",
    assetsRankApprox: 7,
    stackingPolicy: "restricted",
    allowedCombinations: [
      ["personal_checking", "credit_card"],
    ],
    notes: "Truist limits one checking promotion per household per year. Credit card bonuses separate.",
    personalCheckingBonus: 300,
    creditCardBonus: 400,
  },
  {
    id: "goldman-sachs-marcus",
    name: "Goldman Sachs / Marcus",
    logoColor: "#2C3E50",
    assetsRankApprox: 8,
    stackingPolicy: "allowed",
    allowedCombinations: [
      ["personal_savings", "credit_card"],
    ],
    notes: "Marcus high-yield savings can stack with Apple Card or other Goldman credit cards.",
    personalSavingsBonus: 150,
    creditCardBonus: 300,
  },
  {
    id: "td-bank",
    name: "TD Bank",
    logoColor: "#008A00",
    assetsRankApprox: 9,
    stackingPolicy: "allowed",
    allowedCombinations: [
      ["personal_checking", "personal_savings"],
      ["personal_checking", "business_checking"],
    ],
    notes: "TD allows checking + savings combo offers. Business bonuses are separate promotions.",
    personalCheckingBonus: 300,
    personalSavingsBonus: 200,
    businessCheckingBonus: 400,
  },
  {
    id: "capital-one",
    name: "Capital One",
    logoColor: "#C01133",
    assetsRankApprox: 10,
    stackingPolicy: "allowed",
    allowedCombinations: [
      ["personal_checking", "personal_savings"],
      ["personal_checking", "credit_card"],
      ["personal_savings", "credit_card"],
    ],
    notes: "Capital One 360 checking and savings bonuses can be earned simultaneously. Credit cards are fully separate.",
    personalCheckingBonus: 250,
    personalSavingsBonus: 100,
    creditCardBonus: 500,
  },
  {
    id: "fifth-third",
    name: "Fifth Third Bank",
    logoColor: "#004E97",
    assetsRankApprox: 11,
    stackingPolicy: "allowed",
    allowedCombinations: [
      ["personal_checking", "personal_savings"],
      ["personal_checking", "business_checking"],
    ],
    notes: "Fifth Third allows personal + business checking simultaneously. Regional availability.",
    personalCheckingBonus: 325,
    personalSavingsBonus: 150,
    businessCheckingBonus: 500,
  },
  {
    id: "regions-bank",
    name: "Regions Bank",
    logoColor: "#005DA2",
    assetsRankApprox: 12,
    stackingPolicy: "restricted",
    allowedCombinations: [
      ["personal_checking", "credit_card"],
    ],
    notes: "Regions limits one checking bonus per customer per calendar year.",
    personalCheckingBonus: 400,
    creditCardBonus: 200,
  },
  {
    id: "citizens-bank",
    name: "Citizens Bank",
    logoColor: "#1C457D",
    assetsRankApprox: 13,
    stackingPolicy: "allowed",
    allowedCombinations: [
      ["personal_checking", "personal_savings"],
      ["personal_checking", "business_checking"],
    ],
    notes: "Citizens allows personal + business accounts simultaneously with separate bonus timelines.",
    personalCheckingBonus: 300,
    personalSavingsBonus: 200,
    businessCheckingBonus: 400,
  },
  {
    id: "huntington",
    name: "Huntington Bank",
    logoColor: "#009F4D",
    assetsRankApprox: 14,
    stackingPolicy: "allowed",
    allowedCombinations: [
      ["personal_checking", "business_checking"],
      ["personal_checking", "personal_savings"],
    ],
    notes: "Huntington offers separate bonuses for personal and business products. Midwest-focused.",
    personalCheckingBonus: 400,
    personalSavingsBonus: 100,
    businessCheckingBonus: 400,
  },
  {
    id: "keybank",
    name: "KeyBank",
    logoColor: "#CC0000",
    assetsRankApprox: 15,
    stackingPolicy: "restricted",
    allowedCombinations: [
      ["personal_checking", "credit_card"],
    ],
    notes: "KeyBank restricts one checking bonus per customer per 12 months.",
    personalCheckingBonus: 300,
    creditCardBonus: 200,
  },
  {
    id: "bmo-harris",
    name: "BMO Harris Bank",
    logoColor: "#0076CF",
    assetsRankApprox: 16,
    stackingPolicy: "allowed",
    allowedCombinations: [
      ["personal_checking", "business_checking"],
      ["personal_checking", "personal_savings"],
    ],
    notes: "BMO Harris allows personal + business account bonuses simultaneously.",
    personalCheckingBonus: 350,
    personalSavingsBonus: 150,
    businessCheckingBonus: 500,
  },
  {
    id: "synovus",
    name: "Synovus Bank",
    logoColor: "#00A651",
    assetsRankApprox: 17,
    stackingPolicy: "unknown",
    allowedCombinations: [],
    notes: "Stacking policy not publicly documented. Confirm with bank before applying.",
    personalCheckingBonus: 200,
  },
  {
    id: "first-citizens",
    name: "First Citizens Bank",
    logoColor: "#003865",
    assetsRankApprox: 18,
    stackingPolicy: "unknown",
    allowedCombinations: [],
    notes: "After SVB acquisition, stacking policy is unclear. Check current promotions.",
    personalCheckingBonus: 300,
    businessCheckingBonus: 500,
  },
  {
    id: "wsfs-bank",
    name: "WSFS Bank",
    logoColor: "#002D62",
    assetsRankApprox: 19,
    stackingPolicy: "allowed",
    allowedCombinations: [
      ["personal_checking", "personal_savings"],
    ],
    notes: "WSFS allows checking + savings combo. Northeast regional bank.",
    personalCheckingBonus: 250,
    personalSavingsBonus: 100,
  },
  {
    id: "wintrust",
    name: "Wintrust Financial",
    logoColor: "#0F4C81",
    assetsRankApprox: 20,
    stackingPolicy: "allowed",
    allowedCombinations: [
      ["personal_checking", "business_checking"],
    ],
    notes: "Wintrust operates many community bank brands. Personal + business bonuses stack.",
    personalCheckingBonus: 300,
    businessCheckingBonus: 400,
  },
  {
    id: "pinnacle-financial",
    name: "Pinnacle Financial",
    logoColor: "#1B3A6B",
    assetsRankApprox: 21,
    stackingPolicy: "unknown",
    allowedCombinations: [],
    notes: "Limited public information on stacking policy. Business-focused bank.",
    businessCheckingBonus: 300,
  },
  {
    id: "commerce-bank",
    name: "Commerce Bank",
    logoColor: "#003087",
    assetsRankApprox: 22,
    stackingPolicy: "allowed",
    allowedCombinations: [
      ["personal_checking", "personal_savings"],
      ["personal_checking", "business_checking"],
    ],
    notes: "Commerce Bank allows personal and business accounts with separate bonuses.",
    personalCheckingBonus: 200,
    businessCheckingBonus: 300,
  },
  {
    id: "glacier-bancorp",
    name: "Glacier Bancorp",
    logoColor: "#0072BC",
    assetsRankApprox: 23,
    stackingPolicy: "unknown",
    allowedCombinations: [],
    notes: "Rocky Mountain regional bank. Stacking policy varies by subsidiary brand.",
    personalCheckingBonus: 150,
  },
  {
    id: "south-state",
    name: "South State Bank",
    logoColor: "#006341",
    assetsRankApprox: 24,
    stackingPolicy: "allowed",
    allowedCombinations: [
      ["personal_checking", "business_checking"],
    ],
    notes: "South State allows personal and business checking bonuses simultaneously. Southeast regional.",
    personalCheckingBonus: 250,
    businessCheckingBonus: 350,
  },
  {
    id: "texas-capital",
    name: "Texas Capital Bank",
    logoColor: "#002B5C",
    assetsRankApprox: 25,
    stackingPolicy: "restricted",
    allowedCombinations: [
      ["business_checking", "business_savings"],
    ],
    notes: "Texas Capital focuses on business banking. Personal bonuses not commonly offered.",
    businessCheckingBonus: 500,
    businessSavingsBonus: 200,
  },
];

export interface StackingCombo {
  bankId: string;
  bankName: string;
  logoColor: string;
  types: OfferType[];
  totalBonus: number;
  notes: string;
}

function bonusForType(bank: TopBank, type: OfferType): number {
  switch (type) {
    case "personal_checking": return bank.personalCheckingBonus ?? 0;
    case "personal_savings":  return bank.personalSavingsBonus ?? 0;
    case "business_checking": return bank.businessCheckingBonus ?? 0;
    case "business_savings":  return bank.businessSavingsBonus ?? 0;
    case "credit_card":       return bank.creditCardBonus ?? 0;
  }
}

export function getStackingCombos(): StackingCombo[] {
  const combos: StackingCombo[] = [];
  for (const bank of TOP_25_BANKS) {
    if (bank.stackingPolicy === "allowed" && bank.allowedCombinations.length > 0) {
      for (const combo of bank.allowedCombinations) {
        const total = combo.reduce((sum, t) => sum + bonusForType(bank, t), 0);
        if (total > 0) {
          combos.push({
            bankId: bank.id,
            bankName: bank.name,
            logoColor: bank.logoColor,
            types: combo,
            totalBonus: total,
            notes: bank.notes,
          });
        }
      }
    }
  }
  return combos.sort((a, b) => b.totalBonus - a.totalBonus);
}
