import { useState } from "react";
import { motion } from "framer-motion";
import { Target, Brain, TrendingUp, CreditCard, Briefcase, User, ArrowRight, CheckCircle, AlertCircle, Zap, Lock, Star } from "lucide-react";

interface Offer {
  id: string;
  name: string;
  bonusAmount: number;
  directDepositRequired: number;
  difficulty: "Easy" | "Medium" | "Hard";
  ewsReporting: boolean;
  noFee: boolean;
  timeToBonus: number;
  roi: string;
  requirements: string;
  approvalScore: number;
}

interface StrategyData {
  bankScore: number;
  totalPlaidBalance: number;
  aiSummary: string;
  stackingCombo: {
    personal: Offer | null;
    business: Offer | null;
    creditCard: Offer | null;
    projectedTotal: number;
    description: string;
  };
  personalOffers: Offer[];
  businessOffers: Offer[];
  creditCardOffers: Offer[];
  disclaimer: string;
  generatedAt: string;
}

const DIFFICULTY_COLOR: Record<string, string> = {
  Easy: "#4CAF50",
  Medium: "#FFB300",
  Hard: "#EF4444",
};

function OfferCard({ offer }: { offer: Offer }) {
  return (
    <div className="bg-slate-800/50 border border-slate-700 rounded-xl p-4 hover:border-brand-purple/50 transition-colors">
      <div className="flex items-start gap-3 mb-3">
        <div className="w-9 h-9 rounded-lg bg-brand-purple/20 flex items-center justify-center flex-shrink-0">
          <User className="w-4 h-4 text-brand-purple" />
        </div>
        <div className="flex-1 min-w-0">
          <p className="font-semibold text-white text-sm leading-tight mb-1 truncate">{offer.name}</p>
          <div className="flex items-center gap-1.5 flex-wrap">
            <span
              className="text-xs font-semibold px-2 py-0.5 rounded-md"
              style={{ backgroundColor: DIFFICULTY_COLOR[offer.difficulty] + "22", color: DIFFICULTY_COLOR[offer.difficulty] }}
            >
              {offer.difficulty}
            </span>
            {!offer.ewsReporting && (
              <span className="text-xs font-semibold px-2 py-0.5 rounded-md bg-green-500/20 text-green-400">No-EWS</span>
            )}
            {offer.noFee && (
              <span className="text-xs font-semibold px-2 py-0.5 rounded-md bg-blue-500/20 text-blue-400">No Fee</span>
            )}
          </div>
        </div>
        <div className="text-right flex-shrink-0">
          <p className="text-xl font-bold text-green-400">${offer.bonusAmount}</p>
          <p className="text-xs text-slate-500">bonus</p>
        </div>
      </div>

      <div className="bg-slate-700/50 rounded-lg px-3 py-2 mb-3 text-xs text-slate-400 flex items-start gap-2">
        <AlertCircle className="w-3 h-3 flex-shrink-0 mt-0.5 text-slate-500" />
        <span>{offer.requirements}</span>
      </div>

      <div className="flex items-center justify-between mb-3">
        <div className="text-center">
          <p className="text-sm font-bold text-green-400">{offer.roi}</p>
          <p className="text-xs text-slate-500">ROI</p>
        </div>
        <div className="text-center">
          <p className="text-sm font-bold text-white">{offer.timeToBonus}d</p>
          <p className="text-xs text-slate-500">Time</p>
        </div>
        <div className="text-center">
          <p className="text-sm font-bold text-brand-purple">{offer.approvalScore}</p>
          <p className="text-xs text-slate-500">Match</p>
        </div>
      </div>

      <button className="w-full bg-gradient-to-r from-brand-purple to-brand-pink text-white text-sm font-bold py-2 rounded-lg flex items-center justify-center gap-1.5 hover:opacity-90 transition-opacity">
        Start This <ArrowRight className="w-3.5 h-3.5" />
      </button>
    </div>
  );
}

const DEMO_DATA: StrategyData = {
  bankScore: 750,
  totalPlaidBalance: 15000,
  aiSummary: "With your excellent 750 bank score and $15,000 in linked funds, you're positioned to execute a high-yield stacking strategy across all three account types. Start with SoFi (no EWS, $300 bonus in 25 days), then layer in Relay Business Checking ($300 in 90 days), and the Chase Freedom Unlimited credit card ($200 after $500 spend). Your total projected earnings of $800 can be achieved in under 90 days with minimal risk given your clean banking history.",
  stackingCombo: {
    personal: { id: "sofi", name: "SoFi Checking & Savings", bonusAmount: 300, directDepositRequired: 1000, difficulty: "Easy", ewsReporting: false, noFee: true, timeToBonus: 25, roi: "30.0%", requirements: "Deposit $1,000 via direct deposit within 20 days", approvalScore: 92 },
    business: { id: "relay", name: "Relay Business Checking", bonusAmount: 300, directDepositRequired: 5000, difficulty: "Easy", ewsReporting: false, noFee: true, timeToBonus: 90, roi: "6.0%", requirements: "Deposit $5,000 via ACH within 72 days", approvalScore: 85 },
    creditCard: { id: "chase-fu", name: "Chase Freedom Unlimited", bonusAmount: 200, directDepositRequired: 500, difficulty: "Medium", ewsReporting: false, noFee: true, timeToBonus: 90, roi: "40.0%", requirements: "Spend $500 in first 3 months", approvalScore: 78 },
    projectedTotal: 800,
    description: "Best combo for your 750 score — earn up to $800 total",
  },
  personalOffers: [
    { id: "sofi", name: "SoFi Checking & Savings", bonusAmount: 300, directDepositRequired: 1000, difficulty: "Easy", ewsReporting: false, noFee: true, timeToBonus: 25, roi: "30.0%", requirements: "Deposit $1,000 via direct deposit within 20 days", approvalScore: 92 },
    { id: "axos", name: "Axos Rewards Checking", bonusAmount: 300, directDepositRequired: 1500, difficulty: "Medium", ewsReporting: false, noFee: true, timeToBonus: 75, roi: "20.0%", requirements: "Deposit $1,500 via direct deposit within 60 days", approvalScore: 87 },
    { id: "chase", name: "Chase Total Checking", bonusAmount: 300, directDepositRequired: 500, difficulty: "Medium", ewsReporting: true, noFee: false, timeToBonus: 90, roi: "60.0%", requirements: "Deposit $500 via direct deposit within 72 days", approvalScore: 75 },
  ],
  businessOffers: [
    { id: "relay", name: "Relay Business Checking", bonusAmount: 300, directDepositRequired: 5000, difficulty: "Easy", ewsReporting: false, noFee: true, timeToBonus: 90, roi: "6.0%", requirements: "Deposit $5,000 via ACH within 72 days", approvalScore: 85 },
    { id: "mercury", name: "Mercury Business Checking", bonusAmount: 500, directDepositRequired: 10000, difficulty: "Easy", ewsReporting: false, noFee: true, timeToBonus: 90, roi: "5.0%", requirements: "Deposit $10,000 in first 90 days", approvalScore: 80 },
    { id: "bluevine", name: "Bluevine Business Checking", bonusAmount: 300, directDepositRequired: 5000, difficulty: "Easy", ewsReporting: false, noFee: true, timeToBonus: 90, roi: "6.0%", requirements: "Deposit $5,000 within 90 days", approvalScore: 76 },
  ],
  creditCardOffers: [
    { id: "chase-fu", name: "Chase Freedom Unlimited", bonusAmount: 200, directDepositRequired: 500, difficulty: "Medium", ewsReporting: false, noFee: true, timeToBonus: 90, roi: "40.0%", requirements: "Spend $500 in first 3 months", approvalScore: 78 },
    { id: "discover", name: "Discover it® Cash Back", bonusAmount: 200, directDepositRequired: 1500, difficulty: "Easy", ewsReporting: false, noFee: true, timeToBonus: 90, roi: "13.3%", requirements: "Spend $1,500 in first 3 months", approvalScore: 74 },
    { id: "amex-bcp", name: "Amex Blue Cash Preferred", bonusAmount: 350, directDepositRequired: 3000, difficulty: "Medium", ewsReporting: false, noFee: false, timeToBonus: 90, roi: "11.7%", requirements: "Spend $3,000 in first 6 months", approvalScore: 70 },
  ],
  disclaimer: "Recommendations are advisory only. Approval is not guaranteed. All offers subject to bank terms.",
  generatedAt: new Date().toISOString(),
};

export function PersonalizedStrategy() {
  const [scoreInput, setScoreInput] = useState("");
  const [submitted, setSubmitted] = useState(false);
  const [viewingData, setViewingData] = useState<StrategyData | null>(null);
  const [activeCategory, setActiveCategory] = useState<"personal" | "business" | "credit">("personal");

  const handlePreview = () => {
    const score = parseInt(scoreInput, 10);
    if (isNaN(score) || score < 100 || score > 900) return;
    if (score >= 700) {
      setViewingData({ ...DEMO_DATA, bankScore: score });
      setSubmitted(true);
    } else {
      setSubmitted(true);
    }
  };

  const scoreNum = parseInt(scoreInput, 10);
  const scoreValid = !isNaN(scoreNum) && scoreNum >= 100 && scoreNum <= 900;
  const scoreUnlocks = scoreNum >= 700;

  const scoreColor = !scoreValid ? "" : scoreUnlocks ? "text-green-400" : scoreNum >= 650 ? "text-yellow-400" : "text-red-400";
  const scoreLabel = !scoreValid ? "" : scoreUnlocks ? "Excellent — Strategy unlocked!" : "Score below 700 threshold";

  const data = viewingData;

  return (
    <section className="py-24 bg-slate-900 relative overflow-hidden">
      <div className="absolute inset-0 bg-gradient-to-br from-brand-purple/10 via-transparent to-brand-pink/10 pointer-events-none" />

      <div className="max-w-6xl mx-auto px-4 relative z-10">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="text-center mb-12"
        >
          <div className="inline-flex items-center gap-2 bg-brand-purple/20 text-brand-purple border border-brand-purple/30 rounded-full px-4 py-1.5 text-sm font-semibold mb-4">
            <Brain className="w-4 h-4" />
            Pro Feature · AI-Powered
          </div>
          <h2 className="text-4xl md:text-5xl font-bold text-white mb-4">
            Your Personalized Strategy
          </h2>
          <p className="text-xl text-slate-400 max-w-2xl mx-auto">
            Enter your ChexSystems/EWS score to preview how AI analyzes your profile and recommends the best stacking combination.
          </p>
        </motion.div>

        {/* Score Input */}
        {!submitted ? (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="max-w-lg mx-auto mb-12"
          >
            <div className="bg-slate-800 border border-slate-700 rounded-2xl p-6">
              <div className="flex items-center gap-3 mb-4">
                <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-brand-purple to-brand-pink flex items-center justify-center">
                  <Target className="w-5 h-5 text-white" />
                </div>
                <div>
                  <p className="font-bold text-white">Bank Score Check</p>
                  <p className="text-sm text-slate-400">ChexSystems or EWS Score</p>
                </div>
              </div>

              <input
                type="number"
                value={scoreInput}
                onChange={e => setScoreInput(e.target.value.slice(0, 3))}
                placeholder="e.g. 720"
                min={100}
                max={900}
                className="w-full bg-slate-900 border border-slate-600 rounded-xl px-4 py-3 text-white text-2xl font-bold placeholder-slate-600 focus:outline-none focus:border-brand-purple mb-2"
              />

              {scoreInput && (
                <p className={`text-sm font-semibold mb-4 ${scoreColor}`}>
                  {scoreLabel}
                </p>
              )}

              <button
                onClick={handlePreview}
                disabled={!scoreValid}
                className="w-full bg-gradient-to-r from-brand-purple to-brand-pink text-white font-bold py-3 rounded-xl flex items-center justify-center gap-2 hover:opacity-90 transition-opacity disabled:opacity-40 disabled:cursor-not-allowed"
              >
                <Zap className="w-4 h-4" />
                Preview My Strategy
              </button>

              <p className="text-xs text-slate-500 text-center mt-3">
                This is a live preview. Full recommendations require a Pro subscription.
              </p>
            </div>
          </motion.div>
        ) : null}

        {/* Score too low message */}
        {submitted && !data && (
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="max-w-lg mx-auto mb-12"
          >
            <div className="bg-slate-800 border border-yellow-500/30 rounded-2xl p-6 text-center">
              <div className="w-16 h-16 rounded-2xl bg-yellow-500/20 flex items-center justify-center mx-auto mb-4">
                <Lock className="w-8 h-8 text-yellow-400" />
              </div>
              <h3 className="text-xl font-bold text-white mb-2">Score Below Threshold</h3>
              <p className="text-slate-400 mb-4">
                A ChexSystems/EWS score of 700+ is required to unlock AI strategy recommendations.
                Your score of {scoreInput} is close — focus on improving your banking history.
              </p>
              <button
                onClick={() => { setSubmitted(false); setScoreInput(""); }}
                className="text-brand-purple text-sm font-semibold hover:underline"
              >
                Try a different score
              </button>
            </div>
          </motion.div>
        )}

        {/* Strategy Dashboard */}
        {data && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="space-y-8"
          >
            {/* Score Bar */}
            <div className="grid grid-cols-3 gap-4">
              {[
                { label: "Bank Score", value: data.bankScore.toString(), icon: <Target className="w-4 h-4" />, color: "text-green-400" },
                { label: "Projected Earnings", value: `$${data.stackingCombo.projectedTotal.toLocaleString()}`, icon: <TrendingUp className="w-4 h-4" />, color: "text-brand-pink" },
                { label: "Linked Funds", value: `$${data.totalPlaidBalance.toLocaleString()}`, icon: <Star className="w-4 h-4" />, color: "text-brand-purple" },
              ].map(stat => (
                <div key={stat.label} className="bg-slate-800 border border-slate-700 rounded-xl p-4 text-center">
                  <div className={`flex items-center justify-center gap-1 ${stat.color} mb-1`}>
                    {stat.icon}
                  </div>
                  <p className={`text-2xl font-bold ${stat.color}`}>{stat.value}</p>
                  <p className="text-xs text-slate-500 mt-1">{stat.label}</p>
                </div>
              ))}
            </div>

            {/* AI Summary */}
            <div className="bg-slate-800/50 border border-brand-purple/30 rounded-2xl p-6">
              <div className="flex items-center gap-3 mb-4">
                <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-brand-purple to-brand-pink flex items-center justify-center">
                  <Brain className="w-4 h-4 text-white" />
                </div>
                <div>
                  <p className="font-bold text-white">Your AI Strategy</p>
                  <p className="text-xs text-slate-500">GPT-4o Powered Analysis</p>
                </div>
                <div className="ml-auto bg-green-500/20 text-green-400 text-xs font-bold px-2 py-1 rounded-lg">LIVE</div>
              </div>
              <p className="text-slate-300 leading-relaxed">{data.aiSummary}</p>
            </div>

            {/* Best Stacking Combo */}
            <div>
              <div className="flex items-center gap-2 mb-4">
                <div className="w-8 h-8 rounded-lg bg-orange-500/20 flex items-center justify-center">
                  <Zap className="w-4 h-4 text-orange-400" />
                </div>
                <h3 className="text-lg font-bold text-white">Best Stacking Combo</h3>
              </div>
              <div className="bg-slate-800/50 border-2 border-orange-500/40 rounded-2xl p-5 relative overflow-hidden">
                <div className="absolute inset-0 bg-gradient-to-br from-orange-500/5 to-brand-pink/5" />
                <div className="relative space-y-3">
                  {[
                    { label: "Personal", icon: <User className="w-4 h-4" />, offer: data.stackingCombo.personal, color: "#833AB4" },
                    { label: "Business", icon: <Briefcase className="w-4 h-4" />, offer: data.stackingCombo.business, color: "#2196F3" },
                    { label: "Credit Card", icon: <CreditCard className="w-4 h-4" />, offer: data.stackingCombo.creditCard, color: "#4CAF50" },
                  ].map(({ label, icon, offer, color }) => offer && (
                    <div key={label} className="flex items-center gap-3 py-3 border-b border-slate-700/50 last:border-0">
                      <div className="w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0" style={{ backgroundColor: color + "22", color }}>
                        {icon}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-xs text-slate-500 uppercase tracking-wide">{label}</p>
                        <p className="text-sm font-semibold text-white truncate">{offer.name}</p>
                      </div>
                      <p className="text-lg font-bold text-green-400 flex-shrink-0">${offer.bonusAmount}</p>
                    </div>
                  ))}
                  <div className="flex items-center justify-between pt-2">
                    <p className="text-sm text-slate-400 font-semibold">Total Projected Earnings</p>
                    <p className="text-2xl font-bold text-green-400">${data.stackingCombo.projectedTotal.toLocaleString()}</p>
                  </div>
                </div>
              </div>
            </div>

            {/* Category Tabs */}
            <div>
              <div className="flex gap-2 mb-4 overflow-x-auto pb-1">
                {[
                  { key: "personal" as const, label: "Personal Accounts", icon: <User className="w-4 h-4" />, color: "#833AB4" },
                  { key: "business" as const, label: "Business Accounts", icon: <Briefcase className="w-4 h-4" />, color: "#2196F3" },
                  { key: "credit" as const, label: "Credit Cards", icon: <CreditCard className="w-4 h-4" />, color: "#4CAF50" },
                ].map(tab => (
                  <button
                    key={tab.key}
                    onClick={() => setActiveCategory(tab.key)}
                    className={`flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-semibold whitespace-nowrap transition-all ${
                      activeCategory === tab.key
                        ? "text-white"
                        : "bg-slate-800 text-slate-400 hover:text-white"
                    }`}
                    style={activeCategory === tab.key ? { backgroundColor: tab.color + "33", color: tab.color, border: `1px solid ${tab.color}44` } : {}}
                  >
                    {tab.icon}
                    {tab.label}
                  </button>
                ))}
              </div>

              <div className="grid md:grid-cols-3 gap-4">
                {activeCategory === "personal" && data.personalOffers.map(o => <OfferCard key={o.id} offer={o} />)}
                {activeCategory === "business" && data.businessOffers.map(o => <OfferCard key={o.id} offer={o} />)}
                {activeCategory === "credit" && data.creditCardOffers.map(o => <OfferCard key={o.id} offer={o} />)}
              </div>
            </div>

            {/* Disclaimer */}
            <div className="flex items-start gap-2 bg-slate-800/40 border border-slate-700 rounded-xl px-4 py-3">
              <AlertCircle className="w-4 h-4 text-slate-500 flex-shrink-0 mt-0.5" />
              <p className="text-xs text-slate-500">{data.disclaimer}</p>
            </div>

            <div className="text-center">
              <p className="text-slate-500 text-sm mb-4">
                This is a preview. Upgrade to Pro for live AI analysis using your actual Plaid bank data.
              </p>
              <a
                href="#pricing"
                className="inline-flex items-center gap-2 bg-gradient-to-r from-brand-purple to-brand-pink text-white font-bold px-6 py-3 rounded-xl hover:opacity-90 transition-opacity"
              >
                <Zap className="w-4 h-4" />
                Unlock Full AI Strategy — $49 onboarding
              </a>
            </div>
          </motion.div>
        )}
      </div>
    </section>
  );
}
