import { useMemo, useState } from "react";
import { motion } from "framer-motion";
import { CheckCircle, AlertTriangle, HelpCircle, Layers, TrendingUp, ArrowRight, CreditCard, DollarSign, Briefcase, Award, Search } from "lucide-react";
import { Link } from "wouter";

type PolicyType = "allowed" | "restricted" | "unknown";
type OfferTypeKey = "personalChecking" | "personalSavings" | "businessChecking" | "businessSavings" | "creditCard";

interface BankEntry {
  name: string;
  rank: number;
  policy: PolicyType;
  color: string;
  notes: string;
  allowedCombos: OfferTypeKey[][];
  personalChecking?: number;
  personalSavings?: number;
  businessChecking?: number;
  businessSavings?: number;
  creditCard?: number;
}

function getBankBonus(bank: BankEntry, key: OfferTypeKey): number {
  return bank[key] ?? 0;
}

function bankMaxStack(bank: BankEntry): number {
  return bank.allowedCombos.reduce((best, combo) => {
    const total = combo.reduce((sum, k) => sum + getBankBonus(bank, k), 0);
    return total > best ? total : best;
  }, 0);
}

const ALL_25_BANKS: BankEntry[] = [
  {
    name: "JPMorgan Chase", rank: 1, policy: "allowed", color: "#117ACA",
    notes: "Chase allows stacking personal checking + savings + business + credit card bonuses. Each product treated independently.",
    allowedCombos: [["personalChecking","personalSavings"],["personalChecking","businessChecking"],["personalChecking","creditCard"],["personalSavings","businessChecking"]],
    personalChecking: 300, personalSavings: 200, businessChecking: 300, creditCard: 750,
  },
  {
    name: "Bank of America", rank: 2, policy: "restricted", color: "#E31837",
    notes: "Limits one checking bonus per 12 months. Credit card bonuses stack separately.",
    allowedCombos: [["personalChecking","creditCard"],["businessChecking","creditCard"]],
    personalChecking: 200, businessChecking: 200, creditCard: 500,
  },
  {
    name: "Wells Fargo", rank: 3, policy: "restricted", color: "#CC0000",
    notes: "One checking bonus per customer in a 12-month window. Credit card bonuses may stack.",
    allowedCombos: [["personalChecking","creditCard"]],
    personalChecking: 300, creditCard: 400,
  },
  {
    name: "Citibank", rank: 4, policy: "allowed", color: "#056DAE",
    notes: "Citi allows multiple product bonuses simultaneously. High-value offers for large deposits.",
    allowedCombos: [["personalChecking","personalSavings"],["personalChecking","creditCard"],["personalSavings","creditCard"]],
    personalChecking: 2000, personalSavings: 500, creditCard: 600,
  },
  {
    name: "U.S. Bank", rank: 5, policy: "allowed", color: "#0A4595",
    notes: "USB allows personal and business accounts simultaneously. Credit card bonuses are independent.",
    allowedCombos: [["personalChecking","businessChecking"],["personalChecking","creditCard"],["businessChecking","creditCard"]],
    personalChecking: 400, businessChecking: 500, creditCard: 300,
  },
  {
    name: "PNC Bank", rank: 6, policy: "allowed", color: "#F26921",
    notes: "PNC allows stacking personal and business checking. Virtual Wallet accounts qualify.",
    allowedCombos: [["personalChecking","personalSavings"],["personalChecking","businessChecking"]],
    personalChecking: 400, personalSavings: 200, businessChecking: 500,
  },
  {
    name: "Truist Bank", rank: 7, policy: "restricted", color: "#6E2E8B",
    notes: "Limits one checking promotion per household per year. Credit card bonuses separate.",
    allowedCombos: [["personalChecking","creditCard"]],
    personalChecking: 300, creditCard: 400,
  },
  {
    name: "Goldman Sachs / Marcus", rank: 8, policy: "allowed", color: "#2C3E50",
    notes: "Marcus high-yield savings can stack with Apple Card or other Goldman credit cards.",
    allowedCombos: [["personalSavings","creditCard"]],
    personalSavings: 150, creditCard: 300,
  },
  {
    name: "TD Bank", rank: 9, policy: "allowed", color: "#008A00",
    notes: "TD allows checking + savings combo offers. Business bonuses are separate promotions.",
    allowedCombos: [["personalChecking","personalSavings"],["personalChecking","businessChecking"]],
    personalChecking: 300, personalSavings: 200, businessChecking: 400,
  },
  {
    name: "Capital One", rank: 10, policy: "allowed", color: "#C01133",
    notes: "Capital One 360 checking and savings bonuses can be earned simultaneously.",
    allowedCombos: [["personalChecking","personalSavings"],["personalChecking","creditCard"],["personalSavings","creditCard"]],
    personalChecking: 250, personalSavings: 100, creditCard: 500,
  },
  {
    name: "Fifth Third Bank", rank: 11, policy: "allowed", color: "#004E97",
    notes: "Fifth Third allows personal + business checking simultaneously. Regional availability.",
    allowedCombos: [["personalChecking","personalSavings"],["personalChecking","businessChecking"]],
    personalChecking: 325, personalSavings: 150, businessChecking: 500,
  },
  {
    name: "Regions Bank", rank: 12, policy: "restricted", color: "#005DA2",
    notes: "Limits one checking bonus per customer per calendar year.",
    allowedCombos: [["personalChecking","creditCard"]],
    personalChecking: 400, creditCard: 200,
  },
  {
    name: "Citizens Bank", rank: 13, policy: "allowed", color: "#1C457D",
    notes: "Citizens allows personal + business accounts simultaneously with separate bonus timelines.",
    allowedCombos: [["personalChecking","personalSavings"],["personalChecking","businessChecking"]],
    personalChecking: 300, personalSavings: 200, businessChecking: 400,
  },
  {
    name: "Huntington Bank", rank: 14, policy: "allowed", color: "#009F4D",
    notes: "Huntington offers separate bonuses for personal and business products. Midwest-focused.",
    allowedCombos: [["personalChecking","businessChecking"],["personalChecking","personalSavings"]],
    personalChecking: 400, personalSavings: 100, businessChecking: 400,
  },
  {
    name: "KeyBank", rank: 15, policy: "restricted", color: "#CC0000",
    notes: "KeyBank restricts one checking bonus per customer per 12 months.",
    allowedCombos: [["personalChecking","creditCard"]],
    personalChecking: 300, creditCard: 200,
  },
  {
    name: "BMO Harris Bank", rank: 16, policy: "allowed", color: "#0076CF",
    notes: "BMO Harris allows personal + business account bonuses simultaneously.",
    allowedCombos: [["personalChecking","businessChecking"],["personalChecking","personalSavings"]],
    personalChecking: 350, personalSavings: 150, businessChecking: 500,
  },
  {
    name: "Synovus Bank", rank: 17, policy: "unknown", color: "#00A651",
    notes: "Stacking policy not publicly documented. Confirm with bank before applying.",
    allowedCombos: [],
    personalChecking: 200,
  },
  {
    name: "First Citizens Bank", rank: 18, policy: "unknown", color: "#003865",
    notes: "After SVB acquisition, stacking policy is unclear. Check current promotions.",
    allowedCombos: [],
    personalChecking: 300, businessChecking: 500,
  },
  {
    name: "WSFS Bank", rank: 19, policy: "allowed", color: "#002D62",
    notes: "WSFS allows checking + savings combo. Northeast regional bank.",
    allowedCombos: [["personalChecking","personalSavings"]],
    personalChecking: 250, personalSavings: 100,
  },
  {
    name: "Wintrust Financial", rank: 20, policy: "allowed", color: "#0F4C81",
    notes: "Wintrust operates many community bank brands. Personal + business bonuses stack.",
    allowedCombos: [["personalChecking","businessChecking"]],
    personalChecking: 300, businessChecking: 400,
  },
  {
    name: "Pinnacle Financial", rank: 21, policy: "unknown", color: "#1B3A6B",
    notes: "Limited public information on stacking policy. Business-focused bank.",
    allowedCombos: [],
    businessChecking: 300,
  },
  {
    name: "Commerce Bank", rank: 22, policy: "allowed", color: "#003087",
    notes: "Commerce Bank allows personal and business accounts with separate bonuses.",
    allowedCombos: [["personalChecking","personalSavings"],["personalChecking","businessChecking"]],
    personalChecking: 200, businessChecking: 300,
  },
  {
    name: "Glacier Bancorp", rank: 23, policy: "unknown", color: "#0072BC",
    notes: "Rocky Mountain regional bank. Stacking policy varies by subsidiary brand.",
    allowedCombos: [],
    personalChecking: 150,
  },
  {
    name: "South State Bank", rank: 24, policy: "allowed", color: "#006341",
    notes: "South State allows personal and business checking bonuses simultaneously.",
    allowedCombos: [["personalChecking","businessChecking"]],
    personalChecking: 250, businessChecking: 350,
  },
  {
    name: "Texas Capital Bank", rank: 25, policy: "restricted", color: "#002B5C",
    notes: "Texas Capital focuses on business banking. Personal bonuses not commonly offered.",
    allowedCombos: [["businessChecking","businessSavings"]],
    businessChecking: 500, businessSavings: 200,
  },
];

interface StackingCombo {
  bankName: string;
  color: string;
  types: OfferTypeKey[];
  typeLabels: string[];
  totalBonus: number;
}

function computeTopCombos(banks: BankEntry[]): StackingCombo[] {
  const combos: StackingCombo[] = [];
  for (const bank of banks) {
    if (bank.policy !== "allowed") continue;
    for (const combo of bank.allowedCombos) {
      const total = combo.reduce((sum, k) => sum + getBankBonus(bank, k), 0);
      if (total > 0) {
        combos.push({
          bankName: bank.name,
          color: bank.color,
          types: combo,
          typeLabels: combo.map(k => OFFER_TYPE_CONFIGS.find(c => c.key === k)?.label ?? k),
          totalBonus: total,
        });
      }
    }
  }
  return combos.sort((a, b) => b.totalBonus - a.totalBonus);
}

interface OfferTypeConfig {
  key: OfferTypeKey;
  label: string;
  shortLabel: string;
  color: string;
  Icon: React.FC<{ size?: number; className?: string }>;
}

const OFFER_TYPE_CONFIGS: OfferTypeConfig[] = [
  { key: "personalChecking", label: "Personal Checking", shortLabel: "Pers. Chk", color: "#2196F3", Icon: (p) => <CreditCard {...p} /> },
  { key: "personalSavings",  label: "Personal Savings",  shortLabel: "Pers. Sav", color: "#4CAF50", Icon: (p) => <DollarSign {...p} /> },
  { key: "businessChecking", label: "Business Checking", shortLabel: "Biz. Chk",  color: "#FF9800", Icon: (p) => <Briefcase {...p} /> },
  { key: "businessSavings",  label: "Business Savings",  shortLabel: "Biz. Sav",  color: "#9C27B0", Icon: (p) => <TrendingUp {...p} /> },
  { key: "creditCard",       label: "Credit Cards",      shortLabel: "Credit Card",color: "#E1306C", Icon: (p) => <Award {...p} /> },
];

const POLICY_CONFIG: Record<PolicyType, { label: string; color: string; bg: string; Icon: React.FC<{ size?: number; className?: string }> }> = {
  allowed:    { label: "Stacking OK",   color: "#4CAF50", bg: "#4CAF5015", Icon: (p) => <CheckCircle {...p} /> },
  restricted: { label: "Restricted",    color: "#FF9800", bg: "#FF980015", Icon: (p) => <AlertTriangle {...p} /> },
  unknown:    { label: "Unknown",        color: "#9E9E9E", bg: "#9E9E9E15", Icon: (p) => <HelpCircle {...p} /> },
};

function BankRow({ bank, index, activeCategory }: { bank: BankEntry; index: number; activeCategory: OfferTypeKey | "all" }) {
  const policy = POLICY_CONFIG[bank.policy];
  const PolicyIcon = policy.Icon;
  const maxStack = bankMaxStack(bank);

  const visibleTypes = activeCategory === "all"
    ? OFFER_TYPE_CONFIGS.filter(t => getBankBonus(bank, t.key) > 0)
    : OFFER_TYPE_CONFIGS.filter(t => t.key === activeCategory && getBankBonus(bank, t.key) > 0);

  return (
    <motion.div
      initial={{ opacity: 0, x: -12 }}
      whileInView={{ opacity: 1, x: 0 }}
      viewport={{ once: true }}
      transition={{ delay: Math.min(index * 0.025, 0.4) }}
      className="flex items-center gap-3 p-2.5 rounded-xl border border-slate-100 bg-white hover:border-slate-200 hover:shadow-sm transition-all"
    >
      <div className="w-7 h-7 rounded-lg flex items-center justify-center text-white text-xs font-bold shrink-0" style={{ backgroundColor: bank.color }}>
        {bank.name.charAt(0)}
      </div>
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-1.5 flex-wrap">
          <span className="text-sm font-semibold text-slate-900 truncate">{bank.name}</span>
          <span className="text-xs text-slate-400">#{bank.rank}</span>
        </div>
        <div className="flex gap-1 flex-wrap mt-0.5">
          {visibleTypes.map(t => (
            <span key={t.key} className="text-xs px-1.5 py-0.5 rounded font-semibold" style={{ color: t.color, backgroundColor: t.color + "18" }}>
              {t.shortLabel} ${getBankBonus(bank, t.key)}
            </span>
          ))}
          {visibleTypes.length === 0 && activeCategory !== "all" && (
            <span className="text-xs text-slate-400 italic">No {OFFER_TYPE_CONFIGS.find(t => t.key === activeCategory)?.label} bonus listed</span>
          )}
        </div>
      </div>
      <div className="flex flex-col items-end gap-1 shrink-0">
        <div className="flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-semibold" style={{ color: policy.color, backgroundColor: policy.bg }}>
          <PolicyIcon size={10} />
          <span>{policy.label}</span>
        </div>
        {maxStack > 0 && activeCategory === "all" && (
          <span className="text-xs text-slate-500">up to <span className="font-bold text-slate-700">${maxStack.toLocaleString()}</span></span>
        )}
      </div>
    </motion.div>
  );
}

export function BankStackingGuide() {
  const [activeCategory, setActiveCategory] = useState<OfferTypeKey | "all">("all");
  const [policyFilter, setPolicyFilter] = useState<PolicyType | "all">("all");
  const [bankSearch, setBankSearch] = useState("");
  const [minBonus, setMinBonus] = useState("");
  const [maxBonus, setMaxBonus] = useState("");

  const allowedCount = ALL_25_BANKS.filter(b => b.policy === "allowed").length;

  const filteredBanks = useMemo(() => {
    const minAmt = parseInt(minBonus) || 0;
    const maxAmt = parseInt(maxBonus) || 0;
    return ALL_25_BANKS.filter(b => {
      if (policyFilter !== "all" && b.policy !== policyFilter) return false;
      if (activeCategory !== "all" && getBankBonus(b, activeCategory) === 0) return false;
      if (bankSearch.trim() && !b.name.toLowerCase().includes(bankSearch.toLowerCase())) return false;
      if (minAmt > 0 || maxAmt > 0) {
        const ms = bankMaxStack(b);
        if (minAmt > 0 && ms < minAmt) return false;
        if (maxAmt > 0 && ms > maxAmt) return false;
      }
      return true;
    });
  }, [policyFilter, activeCategory, bankSearch, minBonus, maxBonus]);

  const topCombos = useMemo(() => computeTopCombos(ALL_25_BANKS).slice(0, 6), []);

  return (
    <section id="stacking" className="py-24 bg-slate-50 relative overflow-hidden">
      <div className="absolute inset-0 bg-gradient-to-br from-green-500/5 via-blue-500/5 to-purple-500/5 pointer-events-none" />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative">
        {/* Header */}
        <div className="text-center max-w-3xl mx-auto mb-12">
          <motion.div
            initial={{ opacity: 0, y: 16 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="inline-flex items-center gap-2 bg-green-500/10 text-green-700 px-4 py-2 rounded-full text-sm font-semibold mb-6"
          >
            <Layers size={16} />
            Bank Stacking Guide
          </motion.div>
          <motion.h2
            initial={{ opacity: 0, y: 16 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: 0.1 }}
            className="text-4xl md:text-5xl font-bold text-slate-900 mb-6"
          >
            Stack bonuses across{" "}
            <span className="bg-gradient-to-r from-green-500 to-blue-600 bg-clip-text text-transparent">
              multiple banks
            </span>
          </motion.h2>
          <motion.p
            initial={{ opacity: 0, y: 16 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: 0.15 }}
            className="text-lg text-slate-600"
          >
            {allowedCount} of the top 25 US banks allow you to earn bonuses simultaneously across personal checking, savings, business accounts, and credit cards.
          </motion.p>
        </div>

        {/* Category filter chips */}
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="flex flex-wrap gap-2 justify-center mb-8"
        >
          <button
            onClick={() => setActiveCategory("all")}
            className={`flex items-center gap-2 px-4 py-2 rounded-full text-sm font-semibold border transition-all ${
              activeCategory === "all"
                ? "bg-slate-900 text-white border-slate-900"
                : "bg-white text-slate-600 border-slate-200 hover:border-slate-400"
            }`}
          >
            All Categories
          </button>
          {OFFER_TYPE_CONFIGS.map(t => {
            const TypeIcon = t.Icon;
            const active = activeCategory === t.key;
            return (
              <button
                key={t.key}
                onClick={() => setActiveCategory(t.key)}
                className="flex items-center gap-2 px-4 py-2 rounded-full text-sm font-semibold border transition-all"
                style={{
                  backgroundColor: active ? t.color : "white",
                  color: active ? "white" : t.color,
                  borderColor: active ? t.color : t.color + "44",
                }}
              >
                <TypeIcon size={14} />
                {t.label}
              </button>
            );
          })}
        </motion.div>

        <div className="grid lg:grid-cols-2 gap-10 items-start">
          {/* Left — bank list */}
          <div>
            <div className="flex items-center justify-between mb-3 flex-wrap gap-2">
              <h3 className="text-base font-bold text-slate-900">Top 25 US Banks by Assets</h3>
              <div className="flex gap-1.5 flex-wrap">
                {(["all", "allowed", "restricted", "unknown"] as const).map(p => {
                  const cfg = p !== "all" ? POLICY_CONFIG[p] : null;
                  return (
                    <button
                      key={p}
                      onClick={() => setPolicyFilter(p)}
                      className="text-xs px-2.5 py-1 rounded-full font-semibold border transition-all"
                      style={
                        policyFilter === p
                          ? { backgroundColor: cfg?.color ?? "#1e293b", color: "white", borderColor: cfg?.color ?? "#1e293b" }
                          : { backgroundColor: "white", color: cfg?.color ?? "#64748b", borderColor: (cfg?.color ?? "#94a3b8") + "66" }
                      }
                    >
                      {p === "all" ? "All" : cfg?.label ?? p}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Bank search */}
            <div className="flex items-center gap-2 bg-white border border-slate-200 rounded-xl px-3 py-2 mb-2">
              <Search size={14} className="text-slate-400 shrink-0" />
              <input
                type="text"
                placeholder="Search banks..."
                value={bankSearch}
                onChange={e => setBankSearch(e.target.value)}
                className="flex-1 text-sm outline-none text-slate-700 placeholder-slate-400"
              />
              {bankSearch && (
                <button onClick={() => setBankSearch("")} className="text-slate-400 hover:text-slate-600 text-xs">✕</button>
              )}
            </div>

            {/* Min / Max bonus filter */}
            <div className="flex items-center gap-2 mb-3">
              <div className="flex-1 flex items-center gap-2 bg-white border border-slate-200 rounded-xl px-3 py-2">
                <span className="text-xs text-slate-500 font-semibold">Min $</span>
                <input
                  type="number"
                  placeholder="0"
                  value={minBonus}
                  onChange={e => setMinBonus(e.target.value)}
                  className="flex-1 text-sm outline-none text-slate-700 placeholder-slate-400 w-0"
                />
              </div>
              <div className="flex-1 flex items-center gap-2 bg-white border border-slate-200 rounded-xl px-3 py-2">
                <span className="text-xs text-slate-500 font-semibold">Max $</span>
                <input
                  type="number"
                  placeholder="Any"
                  value={maxBonus}
                  onChange={e => setMaxBonus(e.target.value)}
                  className="flex-1 text-sm outline-none text-slate-700 placeholder-slate-400 w-0"
                />
              </div>
              {(minBonus || maxBonus) && (
                <button
                  onClick={() => { setMinBonus(""); setMaxBonus(""); }}
                  className="text-xs text-slate-400 hover:text-slate-600 px-2"
                >
                  Clear
                </button>
              )}
            </div>

            <div className="space-y-1.5 max-h-[680px] overflow-y-auto pr-1">
              {filteredBanks.length === 0 ? (
                <p className="text-sm text-slate-400 text-center py-10">No banks match your filters.</p>
              ) : (
                filteredBanks.map((bank, i) => (
                  <BankRow key={bank.name} bank={bank} index={i} activeCategory={activeCategory} />
                ))
              )}
            </div>
            <p className="text-xs text-slate-400 text-center pt-3">
              Showing {filteredBanks.length} of 25 banks · stacking policies verified manually
            </p>
          </div>

          {/* Right — top stacking combos */}
          <div className="lg:sticky lg:top-8">
            <div className="flex items-center gap-2 mb-2">
              <TrendingUp size={18} className="text-green-500" />
              <h3 className="text-base font-bold text-slate-900">Top Stacking Combinations</h3>
            </div>
            <p className="text-sm text-slate-500 mb-4">Sorted by total bonus earnings — apply once, earn multiple bonuses.</p>

            <div className="space-y-3 mb-6">
              {topCombos.map((combo, i) => (
                <motion.div
                  key={`${combo.bankName}-${i}`}
                  initial={{ opacity: 0, y: 10 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ delay: i * 0.05 }}
                  className="bg-white rounded-2xl border border-slate-200 p-4 shadow-sm hover:shadow-md transition-shadow"
                >
                  <div className="flex items-center gap-3 mb-2.5">
                    <div className="w-8 h-8 rounded-xl flex items-center justify-center text-white font-bold text-sm shrink-0" style={{ backgroundColor: combo.color }}>
                      {combo.bankName.charAt(0)}
                    </div>
                    <div className="flex-1">
                      <p className="font-bold text-slate-900 text-sm">{combo.bankName}</p>
                      <p className="text-xs text-slate-500">{combo.types.length} products stacked</p>
                    </div>
                    <div className="text-right">
                      <p className="text-lg font-bold text-green-600">${combo.totalBonus.toLocaleString()}</p>
                      <p className="text-xs text-slate-400">total bonus</p>
                    </div>
                  </div>
                  <div className="flex flex-wrap gap-1.5">
                    {combo.typeLabels.map(label => {
                      const cfg = OFFER_TYPE_CONFIGS.find(c => c.label === label);
                      const color = cfg?.color ?? "#6B7280";
                      return (
                        <span key={label} className="text-xs px-2 py-0.5 rounded-full font-medium" style={{ color, backgroundColor: color + "18" }}>
                          {label}
                        </span>
                      );
                    })}
                  </div>
                </motion.div>
              ))}
            </div>

            {/* Offer type legend */}
            <div className="bg-white rounded-2xl border border-slate-200 p-4 mb-4">
              <h4 className="text-sm font-bold text-slate-700 mb-3">Offer Categories</h4>
              <div className="grid grid-cols-2 gap-2">
                {OFFER_TYPE_CONFIGS.map(t => {
                  const TypeIcon = t.Icon;
                  return (
                    <button
                      key={t.key}
                      onClick={() => setActiveCategory(activeCategory === t.key ? "all" : t.key)}
                      className="flex items-center gap-2 text-xs text-left hover:opacity-75 transition-opacity"
                    >
                      <div className="w-6 h-6 rounded-md flex items-center justify-center shrink-0" style={{ backgroundColor: t.color + "20", color: t.color }}>
                        <TypeIcon size={12} />
                      </div>
                      <span className="text-slate-600 font-medium">{t.label}</span>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* CTA */}
            <motion.div
              initial={{ opacity: 0, y: 12 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              className="bg-gradient-to-br from-slate-900 to-slate-800 rounded-2xl p-6 text-center"
            >
              <p className="text-white font-bold text-lg mb-2">Find your perfect stack</p>
              <p className="text-slate-400 text-sm mb-4">The app shows real-time offers and filters by offer type, stacking policy, and bonus amount.</p>
              <Link
                href="/"
                className="inline-flex items-center gap-2 bg-gradient-to-r from-green-500 to-blue-600 text-white px-6 py-3 rounded-xl font-bold text-sm hover:opacity-90 hover:-translate-y-0.5 transition-all duration-200"
              >
                Get the App Free
                <ArrowRight size={16} />
              </Link>
            </motion.div>
          </div>
        </div>
      </div>
    </section>
  );
}
