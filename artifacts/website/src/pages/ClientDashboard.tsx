import { useState, useEffect, useCallback } from "react";
import { Link } from "wouter";
import {
  DollarSign, CheckCircle, CreditCard, ArrowRight,
  RefreshCw, Link2, Shield, Bell, ChevronRight, Wallet, Target,
  Calendar, Star, ExternalLink, LogOut, Zap, BarChart3, Building2,
} from "lucide-react";

const USER_STORAGE_KEY = "bbb_user";

function getApiUrl(path: string) {
  const base = import.meta.env.BASE_URL.replace(/\/$/, "");
  return `${base}/api${path}`;
}

interface StoredUser {
  id: string;
  email?: string;
  name?: string;
  role?: string;
}

function getStoredUser(): StoredUser | null {
  try {
    const raw = localStorage.getItem(USER_STORAGE_KEY);
    if (!raw) return null;
    const user = JSON.parse(raw) as StoredUser;
    if (!user?.id || user.id.trim() === "" || user.id === "demo-user") return null;
    return user;
  } catch {
    return null;
  }
}

interface PlaidAccount {
  account_id: string;
  name: string;
  subtype: string;
  mask?: string;
  balances: { available: number | null; current: number | null };
}

interface PlaidItem {
  itemId: string;
  institutionName: string | null;
  accounts: PlaidAccount[] | null;
  status: string;
}

interface Offer {
  id: string;
  name: string;
  bonusAmount: number;
  directDepositRequired: number;
  ewsReporting: boolean;
  noFee: boolean;
  timeToBonus: number;
  difficulty: string;
  category: string;
  approvalScore: number;
  requirements: string;
  roi: string;
  ctaUrl: string;
}

interface ScoreCard {
  label: string;
  value: number | string;
  tier: string;
  guidance: string;
}

interface OfferCategorySummary {
  key: string;
  name: string;
  headline: string;
  count: number;
}

interface Recommendations {
  subscriptionPlan: string;
  bankScore: number;
  totalPlaidBalance: number;
  scoreCards: ScoreCard[];
  offerCategories: OfferCategorySummary[];
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

// Mock data for the demo
const mockOffers = [
  { id: 1, bank: "Chase", name: "Total Checking", bonus: 300, requirement: "$500 direct deposit within 90 days", status: "in_progress", progress: 65, dueDate: "2026-06-15", category: "checking" },
  { id: 2, bank: "Citi", name: "Priority Account", bonus: 700, requirement: "$50k balance for 60 days", status: "in_progress", progress: 40, dueDate: "2026-07-01", category: "checking" },
  { id: 3, bank: "US Bank", name: "Smartly Checking", bonus: 400, requirement: "2 direct deposits of $3k+", status: "pending", progress: 0, dueDate: "2026-08-10", category: "checking" },
  { id: 4, bank: "Capital One", name: "360 Performance Savings", bonus: 200, requirement: "$10k deposit within 14 days", status: "completed", progress: 100, dueDate: "2026-04-01", category: "savings" },
  { id: 5, bank: "Wells Fargo", name: "Everyday Checking", bonus: 325, requirement: "$1k direct deposits in 90 days", status: "pending", progress: 0, dueDate: "2026-09-01", category: "checking" },
];

const mockTopBonuses = [
  { bank: "Chase", bonus: 900, type: "Business Complete", requirement: "Maintain $75k for 60 days", source: "Doctor of Credit" },
  { bank: "Citi", bonus: 2000, type: "Citi Priority", requirement: "$200k deposits in 20 days", source: "Doctor of Credit" },
  { bank: "US Bank", bonus: 500, type: "Platinum Checking", requirement: "$5k DD per month x2", source: "Doctor of Credit" },
  { bank: "HSBC", bonus: 600, type: "Premier Checking", requirement: "$100k balance for 90 days", source: "Doctor of Credit" },
  { bank: "TD Bank", bonus: 300, type: "Beyond Checking", requirement: "$2.5k DD within 60 days", source: "Doctor of Credit" },
];

const mockUpcomingPayouts = [
  { bank: "Capital One", amount: 200, expectedDate: "2026-04-20" },
  { bank: "Chase", amount: 300, expectedDate: "2026-06-25" },
  { bank: "Citi", amount: 700, expectedDate: "2026-07-15" },
];

function StatCard({ icon: Icon, label, value, sub, color }: {
  icon: any; label: string; value: string; sub?: string; color: string;
}) {
  return (
    <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-sm">
      <div className="flex items-center gap-3 mb-3">
        <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${color}`}>
          <Icon className="w-5 h-5 text-white" />
        </div>
        <span className="text-sm text-slate-500 font-medium">{label}</span>
      </div>
      <p className="text-2xl font-bold text-slate-950">{value}</p>
      {sub && <p className="text-xs text-slate-400 mt-1">{sub}</p>}
    </div>
  );
}

function OfferCard({ offer }: { offer: typeof mockOffers[0] }) {
  const statusColors: Record<string, string> = {
    in_progress: "bg-blue-50 text-blue-700 border-blue-200",
    pending: "bg-amber-50 text-amber-700 border-amber-200",
    completed: "bg-emerald-50 text-emerald-700 border-emerald-200",
  };
  const statusLabels: Record<string, string> = {
    in_progress: "In Progress",
    pending: "Not Started",
    completed: "Completed",
  };

  return (
    <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-sm hover:shadow-md transition-shadow">
      <div className="flex items-start justify-between mb-3">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-slate-950 flex items-center justify-center text-white font-bold text-sm">
            {offer.bank.charAt(0)}
          </div>
          <div>
            <p className="font-semibold text-slate-950">{offer.bank}</p>
            <p className="text-xs text-slate-500">{offer.name}</p>
          </div>
        </div>
        <span className={`text-xs font-semibold px-2.5 py-1 rounded-lg border ${statusColors[offer.status]}`}>
          {statusLabels[offer.status]}
        </span>
      </div>

      <div className="flex items-center justify-between mb-3">
        <span className="text-2xl font-bold text-emerald-600">${offer.bonus}</span>
        <span className="text-xs text-slate-400 flex items-center gap-1">
          <Calendar className="w-3 h-3" /> Due {new Date(offer.dueDate).toLocaleDateString("en-US", { month: "short", day: "numeric" })}
        </span>
      </div>

      <p className="text-sm text-slate-600 mb-3">{offer.requirement}</p>

      <div className="w-full bg-slate-100 rounded-full h-2">
        <div
          className="bg-gradient-to-r from-emerald-500 to-emerald-400 h-2 rounded-full transition-all"
          style={{ width: `${offer.progress}%` }}
        />
      </div>
      <p className="text-xs text-slate-400 mt-1.5">{offer.progress}% complete</p>
    </div>
  );
}

function PlaidLinkCard({ userId }: { userId: string }) {
  const [items, setItems] = useState<PlaidItem[]>([]);
  const [refreshing, setRefreshing] = useState(false);

  const fetchItems = useCallback(async () => {
    try {
      const res = await fetch(getApiUrl(`/plaid/items?userId=${encodeURIComponent(userId)}`));
      const data = await res.json();
      setItems((data.items ?? []).filter((i: PlaidItem) => i.status === "active"));
    } catch { setItems([]); }
  }, [userId]);

  useEffect(() => { fetchItems(); }, [fetchItems]);

  const primaryItem = items[0];
  const accounts = (primaryItem?.accounts ?? []) as PlaidAccount[];
  const totalBalance = accounts.reduce((s, a) => s + (a.balances.available ?? 0), 0);

  const handleConnect = async () => {
    try {
      const linkRes = await fetch(getApiUrl("/plaid/link-token"), {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userId }),
      });
      const linkData = await linkRes.json();
      if (linkData.sandbox || linkData.link_token === "link-sandbox-demo-token") {
        await fetch(getApiUrl("/plaid/exchange-token"), {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            publicToken: "demo-public-token", userId,
            metadata: {
              institution: { institution_id: "ins_demo", name: "Chase Bank (Demo)" },
              accounts: [
                { account_id: `demo-checking-${Date.now()}`, name: "Total Checking", type: "depository", subtype: "checking", mask: "4321", balances: { available: 5200, current: 5200, iso_currency_code: "USD" } },
                { account_id: `demo-savings-${Date.now()}`, name: "Total Savings", type: "depository", subtype: "savings", mask: "8765", balances: { available: 12000, current: 12000, iso_currency_code: "USD" } },
              ],
            },
          }),
        });
        await fetchItems();
      } else if (linkData.link_token) {
        window.location.href = `https://link.plaid.com/?token=${linkData.link_token}`;
      }
    } catch {}
  };

  return (
    <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-sm">
      <div className="flex items-center gap-3 mb-4">
        <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center">
          <Link2 className="w-5 h-5 text-white" />
        </div>
        <div>
          <h3 className="font-bold text-slate-950">Linked Bank Accounts</h3>
          <p className="text-xs text-slate-500">Plaid secure connection</p>
        </div>
      </div>

      {primaryItem ? (
        <div>
          <div className="bg-slate-50 rounded-xl p-4 flex items-center gap-3 mb-3">
            <div className="w-10 h-10 rounded-xl bg-slate-950 flex items-center justify-center text-white font-bold text-sm">
              {(primaryItem.institutionName ?? "B").charAt(0)}
            </div>
            <div className="flex-1 min-w-0">
              <p className="font-semibold text-slate-950">{primaryItem.institutionName ?? "Bank"}</p>
              <p className="text-xs text-slate-500">{accounts.length} account{accounts.length !== 1 ? "s" : ""}</p>
            </div>
            <div className="text-right">
              <p className="text-xl font-bold text-slate-950">${totalBalance.toLocaleString("en-US", { minimumFractionDigits: 2 })}</p>
              <p className="text-[10px] text-slate-400">available</p>
            </div>
          </div>
          {accounts.map(a => (
            <div key={a.account_id} className="flex items-center gap-3 py-2 border-b border-slate-100 last:border-0">
              <div className={`w-2 h-2 rounded-full ${a.subtype === "checking" ? "bg-blue-500" : "bg-emerald-500"}`} />
              <span className="flex-1 text-sm text-slate-700">{a.name}</span>
              <span className="text-xs text-slate-400">{a.mask && `..${a.mask}`}</span>
              <span className="text-sm font-semibold text-emerald-600">${(a.balances.available ?? 0).toLocaleString()}</span>
            </div>
          ))}
        </div>
      ) : (
        <button
          onClick={handleConnect}
          className="w-full py-3.5 rounded-xl bg-gradient-to-r from-indigo-500 to-purple-600 text-white font-bold flex items-center justify-center gap-2 hover:opacity-90 transition"
        >
          <Link2 className="w-4 h-4" /> Connect Your Bank
        </button>
      )}
    </div>
  );
}

export default function ClientDashboard() {
  const [user, setUser] = useState<StoredUser | null>(null);
  const [recommendations, setRecommendations] = useState<Recommendations | null>(null);
  const [loadingRecs, setLoadingRecs] = useState(false);
  const [recsError, setRecsError] = useState<string | null>(null);
  const [selectedOffer, setSelectedOffer] = useState<Offer | null>(null);
  const [modalVisible, setModalVisible] = useState(false);
  const [accountNumber, setAccountNumber] = useState("");
  const [routingNumber, setRoutingNumber] = useState("");
  const [creatingSchedule, setCreatingSchedule] = useState(false);
  const [scheduleError, setScheduleError] = useState<string | null>(null);
  const [scheduleSuccess, setScheduleSuccess] = useState<any>(null);

  useEffect(() => {
    const u = getStoredUser();
    setUser(u);
  }, []);

  useEffect(() => {
    if (!user) return;
    const fetchRecs = async () => {
      setLoadingRecs(true);
      setRecsError(null);
      try {
        const res = await fetch(getApiUrl(`/recommendations?userId=${encodeURIComponent(user.id)}`));
        const data = await res.json();
        if (!res.ok) {
          if (data.code === "NOT_SUBSCRIBED") {
            setRecsError("Pro subscription required for recommendations");
          } else if (data.code === "SCORE_TOO_LOW") {
            setRecsError(`Bank score of 700+ required (current: ${data.bankScore})`);
          } else {
            setRecsError(data.error || "Failed to load recommendations");
          }
          return;
        }
        setRecommendations(data);
      } catch (err) {
        setRecsError("Failed to load recommendations");
      } finally {
        setLoadingRecs(false);
      }
    };
    fetchRecs();
  }, [user]);

  const handleLogout = () => {
    localStorage.removeItem(USER_STORAGE_KEY);
    window.location.href = "/";
  };

  const handleSelectOffer = (offer: Offer) => {
    setSelectedOffer(offer);
    setModalVisible(true);
  };

  const handleCreateSchedule = async () => {
    if (!selectedOffer || !user) return;
    setCreatingSchedule(true);
    setScheduleError(null);
    try {
      const res = await fetch(getApiUrl("/autopay/create"), {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          userId: user.id,
          bonusGuid: selectedOffer.id,
          bankName: selectedOffer.name,
          bonusAmount: selectedOffer.bonusAmount,
          offerLink: selectedOffer.ctaUrl,
          section: selectedOffer.category,
          accountNumber,
          routingNumber,
          stripePaymentMethodId: "demo",
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to create schedule");
      setScheduleSuccess(data);
      setModalVisible(false);
      // Reset form
      setAccountNumber("");
      setRoutingNumber("");
      setSelectedOffer(null);
    } catch (err: any) {
      setScheduleError(err.message);
    } finally {
      setCreatingSchedule(false);
    }
  };

  const totalEarned = mockOffers.filter(o => o.status === "completed").reduce((s, o) => s + o.bonus, 0);
  const inProgress = mockOffers.filter(o => o.status === "in_progress");
  const totalPotential = mockOffers.reduce((s, o) => s + o.bonus, 0);

  if (!user) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <div className="text-center max-w-md px-4">
          <div className="w-16 h-16 rounded-2xl bg-slate-950 flex items-center justify-center mx-auto mb-6">
            <Wallet className="w-8 h-8 text-white" />
          </div>
          <h1 className="text-3xl font-bold text-slate-950 mb-3">Sign in to your dashboard</h1>
          <p className="text-slate-500 mb-6">Access your bonus tracking, bank connections, and earnings.</p>
          <Link href="/" className="inline-flex items-center gap-2 bg-slate-950 text-white px-6 py-3 rounded-xl font-semibold hover:opacity-90 transition">
            Go Home <ArrowRight className="w-4 h-4" />
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50">
      {/* Top Bar */}
      <header className="bg-white border-b border-slate-200 sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Link href="/" className="flex items-center gap-2">
              <img src={`${import.meta.env.BASE_URL}images/logo-icon.png`} alt="BBB" className="w-8 h-8" />
              <span className="font-bold text-lg text-slate-950 hidden sm:inline">BigBankBonus</span>
            </Link>
            <span className="text-slate-300 hidden sm:inline">|</span>
            <span className="text-sm font-medium text-emerald-600 hidden sm:inline">Client Dashboard</span>
          </div>
          <div className="flex items-center gap-4">
            <button className="relative p-2 text-slate-400 hover:text-slate-600 transition">
              <Bell className="w-5 h-5" />
              <span className="absolute top-1 right-1 w-2 h-2 bg-red-500 rounded-full" />
            </button>
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-full bg-gradient-to-br from-emerald-500 to-teal-600 flex items-center justify-center text-white text-sm font-bold">
                {(user.name ?? user.email ?? "U").charAt(0).toUpperCase()}
              </div>
              <span className="text-sm font-medium text-slate-700 hidden sm:inline">{user.name ?? user.email}</span>
            </div>
            <button onClick={handleLogout} className="p-2 text-slate-400 hover:text-red-500 transition" title="Sign out">
              <LogOut className="w-4 h-4" />
            </button>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Welcome */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-slate-950">
            Welcome back{user.name ? `, ${user.name.split(" ")[0]}` : ""}
          </h1>
          <p className="text-slate-500 mt-1">Track your bonuses, manage bank connections, and maximize earnings.</p>
        </div>

        {/* Stat Cards */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
          <StatCard icon={DollarSign} label="Total Earned" value={`$${totalEarned.toLocaleString()}`} sub="Lifetime bonus earnings" color="bg-emerald-500" />
          <StatCard icon={Target} label="Potential" value={`$${totalPotential.toLocaleString()}`} sub="Across all active offers" color="bg-blue-500" />
          <StatCard icon={Zap} label="In Progress" value={`${inProgress.length}`} sub="Active bonus offers" color="bg-amber-500" />
          <StatCard icon={CheckCircle} label="Completed" value={`${mockOffers.filter(o => o.status === "completed").length}`} sub="Bonuses earned" color="bg-purple-500" />
        </div>

        <div className="grid lg:grid-cols-3 gap-8">
          {/* Left Column - Main Content */}
          <div className="lg:col-span-2 space-y-8">
            {/* Active Offers */}
            <section>
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-xl font-bold text-slate-950">Your Active Offers</h2>
                <Link href="/hub" className="text-sm font-medium text-emerald-600 hover:text-emerald-700 flex items-center gap-1">
                  Browse All <ChevronRight className="w-4 h-4" />
                </Link>
              </div>
              <div className="grid sm:grid-cols-2 gap-4">
                {mockOffers.filter(o => o.status !== "completed").map(offer => (
                  <OfferCard key={offer.id} offer={offer} />
                ))}
              </div>
            </section>

            {/* Top Offers */}
            <section>
              <div className="flex items-center justify-between mb-4">
                <div>
                  <h2 className="text-xl font-bold text-slate-950">Top Offers</h2>
                  <p className="text-xs text-slate-400 mt-0.5 flex items-center gap-1">
                    <RefreshCw className="w-3 h-3" /> Personalized recommendations
                  </p>
                </div>
              </div>
              {loadingRecs ? (
                <div className="bg-white rounded-2xl border border-slate-200 p-8 shadow-sm text-center">
                  <RefreshCw className="w-8 h-8 text-slate-400 mx-auto mb-4 animate-spin" />
                  <p className="text-slate-500">Loading recommendations...</p>
                </div>
              ) : recsError ? (
                <div className="bg-amber-50 rounded-2xl border border-amber-200 p-6 shadow-sm">
                  <p className="text-amber-800">{recsError}</p>
                  <p className="text-sm text-amber-600 mt-2">Upgrade to Pro or complete onboarding to access personalized offers.</p>
                </div>
              ) : recommendations ? (
                <div className="space-y-4">
                  <div className="grid gap-3 sm:grid-cols-3 mb-4">
                    {recommendations.offerCategories.map(category => (
                      <div key={category.key} className="bg-slate-50 rounded-2xl border border-slate-200 p-4">
                        <p className="text-xs uppercase tracking-[0.15em] text-slate-400">{category.name}</p>
                        <p className="mt-2 font-semibold text-slate-950">{category.headline}</p>
                        <p className="text-sm text-slate-500 mt-2">{category.count} recommended offers</p>
                      </div>
                    ))}
                  </div>

                  <div className="grid gap-3 sm:grid-cols-3 mb-4">
                    {recommendations.scoreCards.map(card => (
                      <div key={card.label} className="bg-white rounded-2xl border border-slate-200 p-4 shadow-sm">
                        <p className="text-xs uppercase tracking-[0.15em] text-slate-400">{card.label}</p>
                        <p className="mt-2 text-xl font-semibold text-slate-950">{typeof card.value === "number" ? `$${card.value.toLocaleString()}` : card.value}</p>
                        <p className="text-sm text-slate-500 mt-2">{card.tier}</p>
                        <p className="text-xs text-slate-400 mt-3">{card.guidance}</p>
                      </div>
                    ))}
                  </div>

                  <div className="bg-white rounded-2xl border border-slate-200 p-4 shadow-sm">
                    <p className="text-sm text-slate-500 mb-3">Strategy summary</p>
                    <p className="text-sm text-slate-700 leading-relaxed">{recommendations.aiSummary}</p>
                  </div>

                  {[
                    { title: "Personal Banking", offers: recommendations.personalOffers },
                    { title: "Business Banking", offers: recommendations.businessOffers },
                    { title: "Rewards Cards", offers: recommendations.creditCardOffers },
                  ].map((section) => (
                    <div key={section.title} className="space-y-3">
                      <div className="flex items-center justify-between">
                        <h3 className="text-lg font-semibold text-slate-950">{section.title}</h3>
                        <span className="text-xs text-slate-400">{section.offers.length} offers</span>
                      </div>
                      <div className="grid gap-3">
                        {section.offers.map((offer) => (
                          <div key={offer.id} className="bg-white rounded-2xl border border-slate-200 p-4 shadow-sm hover:shadow-md transition">
                            <div className="flex items-center gap-4">
                              <div className="w-10 h-10 rounded-xl bg-slate-950 flex items-center justify-center text-white font-bold text-sm shrink-0">
                                {offer.name.charAt(0)}
                              </div>
                              <div className="flex-1 min-w-0">
                                <div className="flex items-center gap-2">
                                  <p className="font-semibold text-slate-950">{offer.name}</p>
                                  <span className="text-xs text-slate-400">{offer.category}</span>
                                </div>
                                <p className="text-xs text-slate-500 truncate">{offer.requirements}</p>
                              </div>
                              <div className="text-right shrink-0">
                                <p className="text-lg font-bold text-emerald-600">${offer.bonusAmount.toLocaleString()}</p>
                                <p className="text-[10px] text-slate-400">{offer.roi} ROI</p>
                              </div>
                              <button
                                onClick={() => handleSelectOffer(offer)}
                                className="px-4 py-2 bg-emerald-600 text-white rounded-lg font-semibold hover:bg-emerald-700 transition"
                              >
                                Automate
                              </button>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              ) : null}
            </section>

            {/* Upcoming Payouts */}
            <section>
              <h2 className="text-xl font-bold text-slate-950 mb-4">Upcoming Payouts</h2>
              <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-sm">
                {mockUpcomingPayouts.map((p, i) => (
                  <div key={i} className="flex items-center gap-4 py-3 border-b border-slate-100 last:border-0">
                    <div className="w-10 h-10 rounded-xl bg-emerald-50 flex items-center justify-center">
                      <DollarSign className="w-5 h-5 text-emerald-600" />
                    </div>
                    <div className="flex-1">
                      <p className="font-semibold text-slate-950">{p.bank}</p>
                      <p className="text-xs text-slate-400">Expected {new Date(p.expectedDate).toLocaleDateString("en-US", { month: "long", day: "numeric", year: "numeric" })}</p>
                    </div>
                    <span className="text-lg font-bold text-emerald-600">+${p.amount}</span>
                  </div>
                ))}
              </div>
            </section>
          </div>

          {/* Right Column - Sidebar */}
          <div className="space-y-6">
            {/* Plaid Integration */}
            <PlaidLinkCard userId={user.id} />

            {/* Subscription Status */}
                  <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-sm">
              <div className="flex items-center gap-3 mb-4">
                <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-amber-500 to-orange-600 flex items-center justify-center">
                  <CreditCard className="w-5 h-5 text-white" />
                </div>
                <div>
                  <h3 className="font-bold text-slate-950">Subscription</h3>
                  <p className="text-xs text-slate-500">
                    {recommendations?.subscriptionPlan === "onboarding"
                      ? "Onboarding access — 6 months"
                      : recommendations?.subscriptionPlan === "annual"
                      ? "Pro Annual"
                      : recommendations?.subscriptionPlan === "monthly"
                      ? "Pro Monthly"
                      : "$49 one-time onboarding"}
                  </p>
                </div>
              </div>
              <div className="bg-emerald-50 rounded-xl p-3 flex items-center gap-2 mb-3">
                <CheckCircle className="w-4 h-4 text-emerald-600" />
                <span className="text-sm font-medium text-emerald-700">Active</span>
              </div>
              <p className="text-xs text-slate-400">
                {recommendations?.subscriptionPlan === "onboarding"
                  ? "Your onboarding access expires in 6 months."
                  : "Next billing: May 12, 2026"}
              </p>
            </div>

            {/* Credit Score Monitor */}
            <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-sm">
              <div className="flex items-center gap-3 mb-4">
                <div className="w-10 h-10 rounded-xl bg-blue-600 flex items-center justify-center">
                  <BarChart3 className="w-5 h-5 text-white" />
                </div>
                <div>
                  <h3 className="font-bold text-slate-950">Credit Impact</h3>
                  <p className="text-xs text-slate-500">ChexSystems monitor</p>
                </div>
              </div>
              <div className="text-center py-4">
                <p className="text-4xl font-bold text-slate-950">742</p>
                <p className="text-sm text-emerald-600 font-medium mt-1">Good standing</p>
                <p className="text-xs text-slate-400 mt-2">No hard inquiries detected this month</p>
              </div>
              <a
                href="https://www.chexsystems.com"
                target="_blank"
                rel="noopener noreferrer"
                className="w-full py-2.5 rounded-xl bg-blue-50 text-blue-700 font-semibold text-sm flex items-center justify-center gap-2 hover:bg-blue-100 transition mt-2"
              >
                <ExternalLink className="w-3.5 h-3.5" /> View Full Report
              </a>
            </div>

            {/* Quick Actions */}
            <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-sm">
              <h3 className="font-bold text-slate-950 mb-3">Quick Actions</h3>
              <div className="space-y-2">
                <Link href="/hub" className="w-full flex items-center gap-3 p-3 rounded-xl hover:bg-slate-50 transition text-left">
                  <Building2 className="w-5 h-5 text-slate-400" />
                  <span className="text-sm font-medium text-slate-700">Command Hub</span>
                  <ChevronRight className="w-4 h-4 text-slate-300 ml-auto" />
                </Link>
                <button className="w-full flex items-center gap-3 p-3 rounded-xl hover:bg-slate-50 transition text-left">
                  <Star className="w-5 h-5 text-slate-400" />
                  <span className="text-sm font-medium text-slate-700">Recommended Offers</span>
                  <ChevronRight className="w-4 h-4 text-slate-300 ml-auto" />
                </button>
                <button className="w-full flex items-center gap-3 p-3 rounded-xl hover:bg-slate-50 transition text-left">
                  <Shield className="w-5 h-5 text-slate-400" />
                  <span className="text-sm font-medium text-slate-700">Eligibility Check</span>
                  <ChevronRight className="w-4 h-4 text-slate-300 ml-auto" />
                </button>
              </div>
            </div>

            {/* Compliance Notice */}
            <div className="bg-amber-50 rounded-2xl border border-amber-200 p-4">
              <p className="text-xs text-amber-800 leading-relaxed">
                <strong>Tax Notice:</strong> Bank bonuses are considered taxable income. You may receive a 1099-INT or 1099-MISC for bonuses over $600. Consult a tax professional for guidance.
              </p>
            </div>
          </div>
        </div>
      </main>

      {/* Autopay Checkout Modal */}
      {modalVisible && selectedOffer && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl max-w-md w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-xl font-bold text-slate-950">Automate {selectedOffer.name}</h3>
                <button onClick={() => setModalVisible(false)} className="text-slate-400 hover:text-slate-600">
                  ✕
                </button>
              </div>

              <div className="mb-4">
                <p className="text-sm text-slate-600">Bonus: <span className="font-semibold text-emerald-600">${selectedOffer.bonusAmount.toLocaleString()}</span></p>
                <p className="text-sm text-slate-600">Requirements: {selectedOffer.requirements}</p>
              </div>

              <div className="space-y-4 mb-6">
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Account Number</label>
                  <input
                    type="text"
                    value={accountNumber}
                    onChange={(e) => setAccountNumber(e.target.value.replace(/\D/g, ""))}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
                    placeholder="Enter account number"
                    maxLength={17}
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Routing Number</label>
                  <input
                    type="text"
                    value={routingNumber}
                    onChange={(e) => setRoutingNumber(e.target.value.replace(/\D/g, "").slice(0, 9))}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
                    placeholder="9-digit routing number"
                    maxLength={9}
                  />
                </div>
              </div>

              {scheduleError && (
                <div className="bg-red-50 border border-red-200 rounded-lg p-3 mb-4">
                  <p className="text-red-800 text-sm">{scheduleError}</p>
                </div>
              )}

              <button
                onClick={handleCreateSchedule}
                disabled={creatingSchedule || accountNumber.length < 4 || routingNumber.length !== 9}
                className="w-full py-3 bg-emerald-600 text-white rounded-lg font-semibold hover:bg-emerald-700 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {creatingSchedule ? "Creating Schedule..." : "Start Automation"}
              </button>

              <p className="text-xs text-slate-500 mt-3 text-center">
                Your card will be charged and refunded automatically. You keep the bonus.
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Success Modal */}
      {scheduleSuccess && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl max-w-md w-full p-6">
            <div className="text-center">
              <div className="w-16 h-16 bg-emerald-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <CheckCircle className="w-8 h-8 text-emerald-600" />
              </div>
              <h3 className="text-xl font-bold text-slate-950 mb-2">Automation Started!</h3>
              <p className="text-slate-600 mb-4">Schedule #{scheduleSuccess.schedule?.id} created for {selectedOffer?.name}</p>
              <button
                onClick={() => setScheduleSuccess(null)}
                className="w-full py-3 bg-emerald-600 text-white rounded-lg font-semibold hover:bg-emerald-700"
              >
                Done
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
