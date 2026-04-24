import { useState } from "react";
import { motion } from "framer-motion";

const steps = [
  {
    icon: "💳",
    label: "You Pay",
    amount: "$500",
    sub: "+ $99 fee + processing",
    color: "from-blue-900 to-indigo-900",
    accent: "#6366f1",
    desc: "Charged to your credit card today. Transparent breakdown shown before you confirm.",
  },
  {
    icon: "🏦",
    label: "ACH Sent",
    amount: "$500",
    sub: "Next Monday via ACH",
    color: "from-brand-purple to-brand-pink",
    accent: "#e1306c",
    desc: "Exactly $500 transferred to your new checking account — counts as a qualifying direct deposit.",
  },
  {
    icon: "🎁",
    label: "Bonuses Earned",
    amount: "$5k–$10k",
    sub: "Potential from stacked offers",
    color: "from-brand-pink to-brand-orange",
    accent: "#f77737",
    desc: "Your $500 unlocks 10x–20x in stacked bank bonuses across your recommended offer stack.",
  },
];

const faqItems = [
  {
    q: "Is the $500 deposit safe?",
    a: "Yes. The $500 is transferred via ACH to the checking account you provide. It counts as a qualifying direct deposit for the bank's bonus requirements. Stripe securely handles all payment processing.",
  },
  {
    q: "When exactly does the ACH transfer happen?",
    a: "The ACH transfer is scheduled for the following Monday after your deposit is confirmed. This timing is designed to meet most banks' direct deposit qualification windows.",
  },
  {
    q: "What is the $99 service fee for?",
    a: "The $99 service fee covers our AI-powered matching, the managed ACH transfer process, our compliance review, and ongoing status tracking until your bonuses are received.",
  },
  {
    q: "How does 10x–20x leverage work?",
    a: "By using your $500 as a qualifying direct deposit across multiple new checking accounts simultaneously (stacked strategy), you unlock bonus offers totaling $5,000–$10,000 in potential earnings — all from a single $500 deployment.",
  },
  {
    q: "Are the bonus earnings guaranteed?",
    a: "No. Bonus projections are labeled 'potential' and are based on each bank's current advertised bonus. Actual payouts depend on meeting the bank's terms. We show every requirement transparently before you apply.",
  },
  {
    q: "What if my ACH transfer fails?",
    a: "If the ACH transfer fails for any reason, your deposit order status will update to 'failed' and our support team will contact you within 24 hours to resolve or refund.",
  },
];

interface LineItem {
  label: string;
  amount: string;
  note?: string;
  highlight?: boolean;
  color?: string;
}

function FeeCalculator() {
  const [state, setState] = useState("");

  const STATE_TAX_RATES: Record<string, number> = {
    CA: 0.0725, NY: 0.04, TX: 0.0625, FL: 0.06, WA: 0.065,
    OR: 0.00, MT: 0.00, DE: 0.00, NH: 0.00, AK: 0.00,
  };

  const deposit = 500_00;
  const fee = 99_00;
  const taxRate = STATE_TAX_RATES[state.toUpperCase()] ?? 0;
  const tax = Math.round(fee * taxRate);
  const subtotal = deposit + fee + tax;
  const stripeFee = Math.round(subtotal * 0.029) + 30;
  const total = subtotal + stripeFee;

  const fmt = (cents: number) => `$${(cents / 100).toFixed(2)}`;

  const lineItems: LineItem[] = [
    { label: "$500 Deposit", amount: fmt(deposit), note: "Sent via ACH next Monday" },
    { label: "Service Fee", amount: fmt(fee), note: "One-time, non-refundable" },
    ...(tax > 0 ? [{ label: `Sales Tax (${(taxRate * 100).toFixed(2)}%)`, amount: fmt(tax) }] : []),
    { label: "Stripe Processing (2.9% + $0.30)", amount: fmt(stripeFee), note: "Stripe charges this to cover card processing" },
  ];

  return (
    <div className="bg-slate-900/80 border border-slate-700/50 rounded-2xl p-6 lg:p-8 max-w-md mx-auto">
      <h3 className="text-xl font-bold text-white mb-2">Live Fee Calculator</h3>
      <p className="text-slate-400 text-sm mb-5">
        Enter your state to see the exact breakdown before you commit.
      </p>

      <div className="mb-5">
        <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">
          Your State (for tax)
        </label>
        <input
          type="text"
          maxLength={2}
          placeholder="e.g. CA, TX, NY"
          value={state}
          onChange={e => setState(e.target.value.toUpperCase())}
          className="w-full bg-slate-800 border border-slate-600 rounded-xl px-4 py-3 text-white placeholder-slate-500 font-mono text-sm focus:outline-none focus:ring-2 focus:ring-brand-purple/50 transition-all"
        />
        {state.length === 2 && taxRate === 0 && (
          <p className="text-xs text-slate-500 mt-1">
            {["OR", "MT", "DE", "NH", "AK"].includes(state) ? "✓ No sales tax in your state" : "State not found — using 0% tax"}
          </p>
        )}
      </div>

      <div className="space-y-3">
        {lineItems.map((item, i) => (
          <div key={i} className="flex items-start justify-between gap-4">
            <div>
              <span className="text-slate-300 text-sm">{item.label}</span>
              {item.note && <p className="text-slate-500 text-xs mt-0.5">{item.note}</p>}
            </div>
            <span className={`text-sm font-semibold whitespace-nowrap ${item.highlight ? "text-red-400" : "text-white"}`}>
              {item.amount}
            </span>
          </div>
        ))}

        <div className="border-t border-slate-700 pt-3 mt-3">
          <div className="flex items-center justify-between">
            <div>
              <span className="text-white font-semibold">Total Charged to Card</span>
              <p className="text-slate-500 text-xs mt-0.5">One-time charge today</p>
            </div>
            <span className="text-xl font-bold text-red-400">{fmt(total)}</span>
          </div>
        </div>

        <div className="bg-green-900/30 border border-green-700/40 rounded-xl p-3 mt-3">
          <div className="flex items-center justify-between">
            <div>
              <span className="text-green-400 font-semibold text-sm">ACH Sent to Your Bank</span>
              <p className="text-green-600 text-xs mt-0.5">Next Monday · Counts as direct deposit</p>
            </div>
            <span className="text-xl font-bold text-green-400">$500.00</span>
          </div>
        </div>
      </div>
    </div>
  );
}

export function DepositEarn() {
  const [openFaq, setOpenFaq] = useState<number | null>(null);

  return (
    <section id="deposit-earn" className="py-24 bg-slate-950 relative overflow-hidden">
      {/* Background effects */}
      <div className="absolute inset-0 pointer-events-none">
        <div className="absolute top-0 left-1/4 w-96 h-96 bg-brand-purple/10 blur-[120px] rounded-full" />
        <div className="absolute bottom-0 right-1/4 w-96 h-96 bg-brand-orange/10 blur-[120px] rounded-full" />
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">

        {/* Header */}
        <div className="text-center mb-16">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="inline-flex items-center gap-2 bg-brand-orange/10 border border-brand-orange/30 rounded-full px-4 py-1.5 text-brand-orange text-sm font-semibold mb-6"
          >
            <span>⚡</span>
            <span>PRO FEATURE · DEPOSIT & EARN</span>
          </motion.div>

          <motion.h2
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: 0.1 }}
            className="text-4xl md:text-6xl font-bold text-white mb-6"
          >
            Turn{" "}
            <span className="bg-gradient-to-r from-brand-purple via-brand-pink to-brand-orange bg-clip-text text-transparent">
              $500
            </span>{" "}
            into{" "}
            <span className="text-green-400">$5,000–$10,000</span>
          </motion.h2>

          <motion.p
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: 0.2 }}
            className="text-lg md:text-xl text-slate-400 max-w-3xl mx-auto leading-relaxed"
          >
            Deposit $500 on your credit card. We send it via ACH to your new checking account next Monday —
            meeting the direct deposit requirement and unlocking your entire stacked bonus strategy.
            That's 10x–20x leverage on a single $500 deployment.
          </motion.p>
        </div>

        {/* 3-step flow */}
        <div className="grid md:grid-cols-3 gap-6 mb-20">
          {steps.map((step, i) => (
            <motion.div
              key={i}
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: i * 0.15 }}
              className="relative bg-slate-900/60 border border-slate-700/50 rounded-2xl p-6 text-center"
            >
              <div className={`w-16 h-16 mx-auto mb-4 rounded-2xl bg-gradient-to-br ${step.color} flex items-center justify-center text-3xl shadow-xl`}>
                {step.icon}
              </div>

              <div className="text-xs font-bold uppercase tracking-widest mb-1" style={{ color: step.accent }}>
                {step.label}
              </div>
              <div className="text-4xl font-bold text-white mb-1">{step.amount}</div>
              <div className="text-sm text-slate-400 mb-4">{step.sub}</div>

              <p className="text-slate-400 text-sm leading-relaxed">{step.desc}</p>

              {i < steps.length - 1 && (
                <div className="hidden md:block absolute -right-3 top-1/2 -translate-y-1/2 text-slate-600 text-2xl font-bold">
                  →
                </div>
              )}
            </motion.div>
          ))}
        </div>

        {/* Leverage projection widget */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="bg-gradient-to-br from-slate-900 to-slate-800 border border-slate-700/50 rounded-3xl p-8 lg:p-12 mb-20"
        >
          <div className="grid lg:grid-cols-2 gap-12 items-center">
            <div>
              <div className="inline-flex items-center gap-2 bg-green-900/30 border border-green-700/30 rounded-full px-3 py-1 text-green-400 text-xs font-bold uppercase tracking-wider mb-4">
                📈 Leverage Projection
              </div>
              <h3 className="text-3xl md:text-4xl font-bold text-white mb-4">
                Potential Earnings Breakdown
              </h3>
              <p className="text-slate-400 leading-relaxed mb-6">
                When you stack 5–10 bank bonus offers and use your $500 as a qualifying direct deposit,
                the total potential bonus earnings range from{" "}
                <span className="text-green-400 font-semibold">$5,000 to $10,000</span>.
              </p>

              {/* Range visual */}
              <div className="space-y-4">
                {[
                  { label: "Conservative (5 offers × avg $500)", amount: "$2,500", pct: 40, color: "#f77737" },
                  { label: "Moderate (8 offers × avg $625)", amount: "$5,000", pct: 65, color: "#e1306c" },
                  { label: "Aggressive (10+ offers × avg $800)", amount: "$8,000+", pct: 85, color: "#4caf50" },
                ].map((row, i) => (
                  <div key={i}>
                    <div className="flex justify-between text-sm mb-1">
                      <span className="text-slate-400">{row.label}</span>
                      <span className="font-bold" style={{ color: row.color }}>{row.amount}</span>
                    </div>
                    <div className="h-2 bg-slate-700 rounded-full overflow-hidden">
                      <motion.div
                        initial={{ width: 0 }}
                        whileInView={{ width: `${row.pct}%` }}
                        viewport={{ once: true }}
                        transition={{ delay: i * 0.1 + 0.3, duration: 0.7 }}
                        className="h-full rounded-full"
                        style={{ background: row.color }}
                      />
                    </div>
                  </div>
                ))}
              </div>

              <p className="text-xs text-slate-500 mt-4">
                * Projections are potential earnings based on current advertised bank bonus offers.
                Actual results vary. Not financial advice.
              </p>
            </div>

            <FeeCalculator />
          </div>
        </motion.div>

        {/* ACH Status diagram */}
        <div className="mb-20">
          <h3 className="text-2xl font-bold text-white text-center mb-8">ACH Transfer Status Tracking</h3>
          <div className="flex flex-col sm:flex-row items-stretch justify-center gap-0">
            {[
              { label: "Card Charged", icon: "💳", color: "#6366f1", sub: "Today" },
              { label: "ACH Pending", icon: "⏳", color: "#f59e0b", sub: "Processing" },
              { label: "ACH Sent", icon: "📤", color: "#e1306c", sub: "Next Monday" },
              { label: "ACH Confirmed", icon: "✅", color: "#4caf50", sub: "1–2 biz days" },
            ].map((step, i, arr) => (
              <div key={i} className="flex sm:flex-col items-center">
                <div className="flex flex-col sm:flex-row items-center">
                  <div className="bg-slate-900 border border-slate-700 rounded-xl p-4 text-center min-w-[130px]">
                    <div className="text-2xl mb-1">{step.icon}</div>
                    <div className="text-sm font-semibold text-white">{step.label}</div>
                    <div className="text-xs text-slate-500 mt-0.5">{step.sub}</div>
                  </div>
                  {i < arr.length - 1 && (
                    <div className="text-slate-600 font-bold text-xl px-3 sm:px-2 sm:py-3 sm:rotate-90">→</div>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* FAQ */}
        <div className="max-w-3xl mx-auto">
          <h3 className="text-3xl font-bold text-white text-center mb-10">Deposit & Earn FAQ</h3>
          <div className="space-y-3">
            {faqItems.map((item, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0 }}
                whileInView={{ opacity: 1 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.05 }}
                className="bg-slate-900/60 border border-slate-700/50 rounded-xl overflow-hidden"
              >
                <button
                  className="w-full text-left px-5 py-4 flex items-center justify-between gap-4 text-white font-semibold hover:bg-slate-800/50 transition-colors"
                  onClick={() => setOpenFaq(openFaq === i ? null : i)}
                >
                  <span>{item.q}</span>
                  <span className="text-slate-400 flex-shrink-0 text-lg">{openFaq === i ? "−" : "+"}</span>
                </button>
                {openFaq === i && (
                  <div className="px-5 pb-4 text-slate-400 text-sm leading-relaxed border-t border-slate-700/50 pt-3">
                    {item.a}
                  </div>
                )}
              </motion.div>
            ))}
          </div>
        </div>

        {/* CTA */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="text-center mt-16"
        >
          <a
            href="#"
            className="inline-flex items-center gap-3 bg-gradient-to-r from-brand-purple via-brand-pink to-brand-orange text-white px-10 py-5 rounded-2xl text-lg font-bold shadow-[0_0_40px_-10px_rgba(225,48,108,0.5)] hover:shadow-[0_0_60px_-10px_rgba(225,48,108,0.7)] hover:-translate-y-1 transition-all duration-300"
          >
            <span>⚡</span>
            <span>Start with Deposit & Earn</span>
          </a>
          <p className="text-slate-500 text-sm mt-3">Available to Pro subscribers · Requires approved account</p>
        </motion.div>
      </div>
    </section>
  );
}
