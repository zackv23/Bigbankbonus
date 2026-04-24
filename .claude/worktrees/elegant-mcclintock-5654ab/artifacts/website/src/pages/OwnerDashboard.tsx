import { useState, useEffect } from "react";
import { Link } from "wouter";
import {
  Users, DollarSign, TrendingUp, BarChart3, CreditCard, CheckCircle,
  Clock, ArrowRight, Bell, LogOut, ChevronRight, Building2, Target,
  Activity, Wallet, Shield, UserPlus, Settings, XCircle, Search,
  RefreshCw, Eye, Ban, ArrowUpRight, ArrowDownRight,
} from "lucide-react";

const USER_STORAGE_KEY = "bbb_user";

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
    return JSON.parse(raw) as StoredUser;
  } catch { return null; }
}

// Demo data for owner dashboard
const demoReps = [
  { id: 1, name: "Alex Rivera", email: "alex@bigbankbonus.com", status: "active", leadCount: 24, convertedCount: 8, totalCommissions: 3200, pendingCommissions: 450, commissionRate: "10.00" },
  { id: 2, name: "Jordan Lee", email: "jordan@bigbankbonus.com", status: "active", leadCount: 18, convertedCount: 5, totalCommissions: 2100, pendingCommissions: 300, commissionRate: "10.00" },
  { id: 3, name: "Casey Morgan", email: "casey@bigbankbonus.com", status: "active", leadCount: 31, convertedCount: 12, totalCommissions: 4800, pendingCommissions: 600, commissionRate: "12.00" },
  { id: 4, name: "Taylor Brooks", email: "taylor@bigbankbonus.com", status: "inactive", leadCount: 9, convertedCount: 2, totalCommissions: 800, pendingCommissions: 0, commissionRate: "10.00" },
];

const demoSubscriptions = [
  { id: 1, userId: "user_001", billingEmail: "marcus@example.com", plan: "monthly", status: "active", stripeCustomerId: "cus_xxx1", currentPeriodEnd: "2026-05-12" },
  { id: 2, userId: "user_002", billingEmail: "sarah@example.com", plan: "monthly", status: "active", stripeCustomerId: "cus_xxx2", currentPeriodEnd: "2026-05-15" },
  { id: 3, userId: "user_003", billingEmail: "david@example.com", plan: "annual", status: "active", stripeCustomerId: "cus_xxx3", currentPeriodEnd: "2027-02-20" },
  { id: 4, userId: "user_004", billingEmail: "emily@example.com", plan: "monthly", status: "past_due", stripeCustomerId: "cus_xxx4", currentPeriodEnd: "2026-04-08" },
  { id: 5, userId: "user_005", billingEmail: "james@example.com", plan: "monthly", status: "active", stripeCustomerId: "cus_xxx5", currentPeriodEnd: "2026-05-05" },
  { id: 6, userId: "user_006", billingEmail: "lisa@example.com", plan: "free", status: "active", stripeCustomerId: null, currentPeriodEnd: null },
  { id: 7, userId: "user_007", billingEmail: "robert@example.com", plan: "monthly", status: "cancelled", stripeCustomerId: "cus_xxx7", currentPeriodEnd: "2026-04-25" },
];

const demoDeposits = [
  { id: 1, userId: "user_001", accountLast4: "4321", status: "ach_confirmed", totalCharged: 60900, achAmount: 50000, createdAt: "2026-04-10" },
  { id: 2, userId: "user_002", accountLast4: "8765", status: "ach_pending", totalCharged: 60900, achAmount: 50000, createdAt: "2026-04-11" },
  { id: 3, userId: "user_003", accountLast4: "1234", status: "charged", totalCharged: 60900, achAmount: 50000, createdAt: "2026-04-12" },
  { id: 4, userId: "user_005", accountLast4: "5678", status: "ach_confirmed", totalCharged: 60900, achAmount: 50000, createdAt: "2026-04-08" },
  { id: 5, userId: "user_001", accountLast4: "4321", status: "ach_confirmed", totalCharged: 60900, achAmount: 50000, createdAt: "2026-03-15" },
];

const demoAccounts = [
  { id: 1, userId: "user_008", bankName: "Chase", approvalStatus: "pending", bonusAmount: 300, createdAt: "2026-04-12" },
  { id: 2, userId: "user_009", bankName: "Citi", approvalStatus: "pending", bonusAmount: 700, createdAt: "2026-04-11" },
  { id: 3, userId: "user_001", bankName: "US Bank", approvalStatus: "approved", bonusAmount: 400, createdAt: "2026-04-05" },
];

const demoCommissions = [
  { id: 1, repName: "Casey Morgan", type: "signup", amount: 150, status: "pending", clientEmail: "david@example.com", createdAt: "2026-04-10" },
  { id: 2, repName: "Alex Rivera", type: "signup", amount: 150, status: "pending", clientEmail: "sarah@example.com", createdAt: "2026-04-09" },
  { id: 3, repName: "Jordan Lee", type: "deposit", amount: 50, status: "pending", clientEmail: "emily@example.com", createdAt: "2026-04-08" },
  { id: 4, repName: "Casey Morgan", type: "renewal", amount: 25, status: "paid", clientEmail: "james@example.com", createdAt: "2026-04-05" },
  { id: 5, repName: "Alex Rivera", type: "signup", amount: 150, status: "paid", clientEmail: "marcus@example.com", createdAt: "2026-04-01" },
];

type Tab = "overview" | "reps" | "subscriptions" | "deposits" | "accounting";

function KPICard({ icon: Icon, label, value, change, changeDirection, color }: {
  icon: any; label: string; value: string; change?: string; changeDirection?: "up" | "down"; color: string;
}) {
  return (
    <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-sm">
      <div className="flex items-center justify-between mb-3">
        <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${color}`}>
          <Icon className="w-5 h-5 text-white" />
        </div>
        {change && (
          <div className={`flex items-center gap-1 text-xs font-semibold ${changeDirection === "up" ? "text-emerald-600" : "text-red-500"}`}>
            {changeDirection === "up" ? <ArrowUpRight className="w-3.5 h-3.5" /> : <ArrowDownRight className="w-3.5 h-3.5" />}
            {change}
          </div>
        )}
      </div>
      <p className="text-2xl font-bold text-slate-950">{value}</p>
      <p className="text-xs text-slate-400 mt-1">{label}</p>
    </div>
  );
}

export default function OwnerDashboard() {
  const [user, setUser] = useState<StoredUser | null>(null);
  const [tab, setTab] = useState<Tab>("overview");

  useEffect(() => { setUser(getStoredUser()); }, []);

  const handleLogout = () => {
    localStorage.removeItem(USER_STORAGE_KEY);
    window.location.href = "/";
  };

  const activeSubs = demoSubscriptions.filter(s => s.status === "active" && s.plan !== "free");
  const monthlyCount = activeSubs.filter(s => s.plan === "monthly").length;
  const annualCount = activeSubs.filter(s => s.plan === "annual").length;
  const mrr = (monthlyCount * 49) + (annualCount * 49);
  const totalRevenue = mrr;
  const totalDepositVolume = demoDeposits.reduce((s, d) => s + d.totalCharged, 0) / 100;
  const pendingApprovals = demoAccounts.filter(a => a.approvalStatus === "pending").length;
  const totalReps = demoReps.length;
  const activeReps = demoReps.filter(r => r.status === "active").length;
  const totalLeads = demoReps.reduce((s, r) => s + r.leadCount, 0);
  const totalConverted = demoReps.reduce((s, r) => s + r.convertedCount, 0);
  const allPendingCommissions = demoCommissions.filter(c => c.status === "pending").reduce((s, c) => s + c.amount, 0);

  if (!user) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <div className="text-center max-w-md px-4">
          <div className="w-16 h-16 rounded-2xl bg-slate-950 flex items-center justify-center mx-auto mb-6">
            <Settings className="w-8 h-8 text-white" />
          </div>
          <h1 className="text-3xl font-bold text-slate-950 mb-3">Owner Portal</h1>
          <p className="text-slate-500 mb-6">Admin access required. Sign in with your owner credentials.</p>
          <Link href="/" className="inline-flex items-center gap-2 bg-slate-950 text-white px-6 py-3 rounded-xl font-semibold">
            Go Home <ArrowRight className="w-4 h-4" />
          </Link>
        </div>
      </div>
    );
  }

  const tabs: { key: Tab; label: string; icon: any }[] = [
    { key: "overview", label: "Overview", icon: BarChart3 },
    { key: "reps", label: "Sales Reps", icon: Users },
    { key: "subscriptions", label: "Subscriptions", icon: CreditCard },
    { key: "deposits", label: "Deposits", icon: Wallet },
    { key: "accounting", label: "Accounting", icon: DollarSign },
  ];

  return (
    <div className="min-h-screen bg-slate-50">
      {/* Top Bar */}
      <header className="bg-slate-950 text-white sticky top-0 z-40">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Link href="/" className="flex items-center gap-2">
              <img src={`${import.meta.env.BASE_URL}images/logo-icon.png`} alt="BBB" className="w-8 h-8" />
              <span className="font-bold text-lg hidden sm:inline">BigBankBonus</span>
            </Link>
            <span className="text-white/30 hidden sm:inline">|</span>
            <span className="text-sm font-medium text-emerald-400 hidden sm:inline">Owner Dashboard</span>
          </div>
          <div className="flex items-center gap-4">
            <button className="relative p-2 text-white/60 hover:text-white transition">
              <Bell className="w-5 h-5" />
              {pendingApprovals > 0 && <span className="absolute top-0.5 right-0.5 w-4 h-4 bg-red-500 rounded-full text-[10px] font-bold flex items-center justify-center">{pendingApprovals}</span>}
            </button>
            <div className="w-8 h-8 rounded-full bg-gradient-to-br from-emerald-400 to-teal-500 flex items-center justify-center text-slate-950 text-sm font-bold">
              {(user.name ?? "O").charAt(0)}
            </div>
            <button onClick={handleLogout} className="p-2 text-white/40 hover:text-red-400 transition" title="Sign out">
              <LogOut className="w-4 h-4" />
            </button>
          </div>
        </div>
        {/* Tab Nav */}
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex gap-1 overflow-x-auto pb-0">
            {tabs.map(t => (
              <button key={t.key} onClick={() => setTab(t.key)}
                className={`flex items-center gap-2 px-4 py-3 text-sm font-medium border-b-2 transition whitespace-nowrap ${
                  tab === t.key ? "border-emerald-400 text-emerald-400" : "border-transparent text-white/50 hover:text-white/80"
                }`}>
                <t.icon className="w-4 h-4" /> {t.label}
              </button>
            ))}
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* ── Overview Tab ── */}
        {tab === "overview" && (
          <div className="space-y-8">
            {/* KPIs */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
              <KPICard icon={DollarSign} label="Monthly Recurring Revenue" value={`$${mrr.toLocaleString()}`} change="+12.5%" changeDirection="up" color="bg-emerald-500" />
              <KPICard icon={Users} label="Active Subscribers" value={`${activeSubs.length}`} change="+3" changeDirection="up" color="bg-blue-500" />
              <KPICard icon={Target} label="Total Leads" value={`${totalLeads}`} change="+15%" changeDirection="up" color="bg-purple-500" />
              <KPICard icon={Activity} label="Conversion Rate" value={totalLeads > 0 ? `${((totalConverted / totalLeads) * 100).toFixed(1)}%` : "0%"} change="+2.3%" changeDirection="up" color="bg-amber-500" />
            </div>

            <div className="grid lg:grid-cols-3 gap-6">
              {/* Pending Approvals */}
              <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-sm">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="font-bold text-slate-950">Pending Approvals</h3>
                  <span className="text-xs font-bold text-red-500 bg-red-50 px-2.5 py-1 rounded-lg">{pendingApprovals}</span>
                </div>
                {demoAccounts.filter(a => a.approvalStatus === "pending").map(acct => (
                  <div key={acct.id} className="flex items-center gap-3 py-3 border-b border-slate-100 last:border-0">
                    <div className="w-10 h-10 rounded-xl bg-amber-50 flex items-center justify-center">
                      <Clock className="w-5 h-5 text-amber-600" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-semibold text-slate-950">{acct.bankName}</p>
                      <p className="text-xs text-slate-400">User: {acct.userId}</p>
                    </div>
                    <div className="flex gap-1.5">
                      <button className="p-1.5 rounded-lg bg-emerald-50 text-emerald-600 hover:bg-emerald-100 transition">
                        <CheckCircle className="w-4 h-4" />
                      </button>
                      <button className="p-1.5 rounded-lg bg-red-50 text-red-500 hover:bg-red-100 transition">
                        <Ban className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                ))}
                {pendingApprovals === 0 && <p className="text-sm text-slate-400 py-4 text-center">No pending approvals</p>}
              </div>

              {/* Top Reps */}
              <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-sm">
                <h3 className="font-bold text-slate-950 mb-4">Top Sales Reps</h3>
                {[...demoReps].sort((a, b) => b.convertedCount - a.convertedCount).slice(0, 3).map((rep, i) => (
                  <div key={rep.id} className="flex items-center gap-3 py-3 border-b border-slate-100 last:border-0">
                    <div className={`w-8 h-8 rounded-full flex items-center justify-center text-white text-sm font-bold ${
                      i === 0 ? "bg-amber-500" : i === 1 ? "bg-slate-400" : "bg-orange-400"
                    }`}>
                      {i + 1}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-semibold text-slate-950">{rep.name}</p>
                      <p className="text-xs text-slate-400">{rep.convertedCount} converted / {rep.leadCount} leads</p>
                    </div>
                    <span className="text-sm font-bold text-emerald-600">${rep.totalCommissions.toLocaleString()}</span>
                  </div>
                ))}
              </div>

              {/* Revenue Breakdown */}
              <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-sm">
                <h3 className="font-bold text-slate-950 mb-4">Revenue Breakdown</h3>
                <div className="space-y-4">
                  <div>
                    <div className="flex justify-between text-sm mb-1">
                      <span className="text-slate-600">Monthly Subscriptions</span>
                      <span className="font-semibold text-slate-950">${(monthlyCount * 49).toLocaleString()}/mo</span>
                    </div>
                    <div className="w-full bg-slate-100 rounded-full h-2">
                      <div className="bg-blue-500 h-2 rounded-full" style={{ width: `${activeSubs.length > 0 ? (monthlyCount / activeSubs.length) * 100 : 0}%` }} />
                    </div>
                    <p className="text-xs text-slate-400 mt-1">{monthlyCount} subscribers</p>
                  </div>
                  <div>
                    <div className="flex justify-between text-sm mb-1">
                      <span className="text-slate-600">Annual Subscriptions</span>
                      <span className="font-semibold text-slate-950">${(annualCount * 49).toLocaleString()}/mo</span>
                    </div>
                    <div className="w-full bg-slate-100 rounded-full h-2">
                      <div className="bg-emerald-500 h-2 rounded-full" style={{ width: `${activeSubs.length > 0 ? (annualCount / activeSubs.length) * 100 : 0}%` }} />
                    </div>
                    <p className="text-xs text-slate-400 mt-1">{annualCount} subscribers</p>
                  </div>
                  <div>
                    <div className="flex justify-between text-sm mb-1">
                      <span className="text-slate-600">Service Fees ($99)</span>
                      <span className="font-semibold text-slate-950">${(demoAccounts.filter(a => a.approvalStatus === "approved").length * 99).toLocaleString()}</span>
                    </div>
                    <div className="w-full bg-slate-100 rounded-full h-2">
                      <div className="bg-purple-500 h-2 rounded-full" style={{ width: "30%" }} />
                    </div>
                    <p className="text-xs text-slate-400 mt-1">{demoAccounts.filter(a => a.approvalStatus === "approved").length} accounts</p>
                  </div>
                  <div>
                    <div className="flex justify-between text-sm mb-1">
                      <span className="text-slate-600">Deposit Volume</span>
                      <span className="font-semibold text-slate-950">${totalDepositVolume.toLocaleString()}</span>
                    </div>
                    <div className="w-full bg-slate-100 rounded-full h-2">
                      <div className="bg-amber-500 h-2 rounded-full" style={{ width: "65%" }} />
                    </div>
                    <p className="text-xs text-slate-400 mt-1">{demoDeposits.length} orders</p>
                  </div>
                </div>
              </div>
            </div>

            {/* Recent Commissions to Approve */}
            <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-sm">
              <div className="flex items-center justify-between mb-4">
                <h3 className="font-bold text-slate-950">Pending Commission Payouts</h3>
                <span className="text-sm font-semibold text-amber-600">${allPendingCommissions.toLocaleString()} pending</span>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b border-slate-200">
                      <th className="text-left text-xs font-semibold text-slate-500 px-4 py-2">Rep</th>
                      <th className="text-left text-xs font-semibold text-slate-500 px-4 py-2">Type</th>
                      <th className="text-left text-xs font-semibold text-slate-500 px-4 py-2">Client</th>
                      <th className="text-left text-xs font-semibold text-slate-500 px-4 py-2">Amount</th>
                      <th className="text-left text-xs font-semibold text-slate-500 px-4 py-2">Status</th>
                      <th className="text-left text-xs font-semibold text-slate-500 px-4 py-2">Action</th>
                    </tr>
                  </thead>
                  <tbody>
                    {demoCommissions.map(c => (
                      <tr key={c.id} className="border-b border-slate-100">
                        <td className="px-4 py-3 text-sm font-medium text-slate-950">{c.repName}</td>
                        <td className="px-4 py-3"><span className="text-xs font-semibold px-2 py-0.5 rounded bg-slate-100 text-slate-600 capitalize">{c.type}</span></td>
                        <td className="px-4 py-3 text-sm text-slate-600">{c.clientEmail}</td>
                        <td className="px-4 py-3 text-sm font-bold text-emerald-600">${c.amount}</td>
                        <td className="px-4 py-3">
                          <span className={`text-xs font-semibold px-2.5 py-1 rounded-lg border ${
                            c.status === "paid" ? "bg-emerald-50 text-emerald-700 border-emerald-200" : "bg-amber-50 text-amber-700 border-amber-200"
                          }`}>{c.status === "paid" ? "Paid" : "Pending"}</span>
                        </td>
                        <td className="px-4 py-3">
                          {c.status === "pending" && (
                            <button className="text-xs font-semibold text-emerald-600 hover:text-emerald-700 flex items-center gap-1">
                              <CheckCircle className="w-3.5 h-3.5" /> Approve
                            </button>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {/* ── Sales Reps Tab ── */}
        {tab === "reps" && (
          <div className="space-y-6">
            <div className="flex items-center justify-between">
              <h2 className="text-2xl font-bold text-slate-950">Sales Representatives</h2>
              <button className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-slate-950 text-white text-sm font-semibold hover:opacity-90 transition">
                <UserPlus className="w-4 h-4" /> Add Rep
              </button>
            </div>

            <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
              <KPICard icon={Users} label="Total Reps" value={`${totalReps}`} color="bg-blue-500" />
              <KPICard icon={CheckCircle} label="Active" value={`${activeReps}`} color="bg-emerald-500" />
              <KPICard icon={Target} label="Total Leads" value={`${totalLeads}`} color="bg-purple-500" />
              <KPICard icon={DollarSign} label="Total Commissions" value={`$${demoReps.reduce((s, r) => s + r.totalCommissions, 0).toLocaleString()}`} color="bg-amber-500" />
            </div>

            <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-sm">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-slate-200 bg-slate-50">
                    <th className="text-left text-xs font-semibold text-slate-500 px-5 py-3">Rep</th>
                    <th className="text-left text-xs font-semibold text-slate-500 px-5 py-3">Status</th>
                    <th className="text-left text-xs font-semibold text-slate-500 px-5 py-3">Leads</th>
                    <th className="text-left text-xs font-semibold text-slate-500 px-5 py-3">Converted</th>
                    <th className="text-left text-xs font-semibold text-slate-500 px-5 py-3">Rate</th>
                    <th className="text-left text-xs font-semibold text-slate-500 px-5 py-3">Commissions</th>
                    <th className="text-left text-xs font-semibold text-slate-500 px-5 py-3">Pending</th>
                  </tr>
                </thead>
                <tbody>
                  {demoReps.map(rep => (
                    <tr key={rep.id} className="border-b border-slate-100 hover:bg-slate-50 transition">
                      <td className="px-5 py-4">
                        <div className="flex items-center gap-3">
                          <div className="w-9 h-9 rounded-full bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center text-white text-sm font-bold">
                            {rep.name.charAt(0)}
                          </div>
                          <div>
                            <p className="font-semibold text-sm text-slate-950">{rep.name}</p>
                            <p className="text-xs text-slate-400">{rep.email}</p>
                          </div>
                        </div>
                      </td>
                      <td className="px-5 py-4">
                        <span className={`text-xs font-semibold px-2.5 py-1 rounded-lg border ${
                          rep.status === "active" ? "bg-emerald-50 text-emerald-700 border-emerald-200" : "bg-slate-50 text-slate-500 border-slate-200"
                        }`}>{rep.status}</span>
                      </td>
                      <td className="px-5 py-4 text-sm font-medium text-slate-700">{rep.leadCount}</td>
                      <td className="px-5 py-4 text-sm font-medium text-slate-700">{rep.convertedCount} <span className="text-xs text-slate-400">({rep.leadCount > 0 ? ((rep.convertedCount / rep.leadCount) * 100).toFixed(0) : 0}%)</span></td>
                      <td className="px-5 py-4 text-sm text-slate-600">{rep.commissionRate}%</td>
                      <td className="px-5 py-4 text-sm font-bold text-emerald-600">${rep.totalCommissions.toLocaleString()}</td>
                      <td className="px-5 py-4 text-sm font-medium text-amber-600">${rep.pendingCommissions.toLocaleString()}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* ── Subscriptions Tab ── */}
        {tab === "subscriptions" && (
          <div className="space-y-6">
            <h2 className="text-2xl font-bold text-slate-950">Subscription Management</h2>

            <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
              <KPICard icon={CreditCard} label="Active Paid" value={`${activeSubs.length}`} color="bg-emerald-500" />
              <KPICard icon={DollarSign} label="MRR" value={`$${mrr.toLocaleString()}`} color="bg-blue-500" />
              <KPICard icon={Clock} label="Past Due" value={`${demoSubscriptions.filter(s => s.status === "past_due").length}`} color="bg-red-500" />
              <KPICard icon={XCircle} label="Cancelled" value={`${demoSubscriptions.filter(s => s.status === "cancelled").length}`} color="bg-slate-400" />
            </div>

            <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-sm">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-slate-200 bg-slate-50">
                    <th className="text-left text-xs font-semibold text-slate-500 px-5 py-3">User</th>
                    <th className="text-left text-xs font-semibold text-slate-500 px-5 py-3">Plan</th>
                    <th className="text-left text-xs font-semibold text-slate-500 px-5 py-3">Status</th>
                    <th className="text-left text-xs font-semibold text-slate-500 px-5 py-3">Period End</th>
                    <th className="text-left text-xs font-semibold text-slate-500 px-5 py-3">Stripe ID</th>
                  </tr>
                </thead>
                <tbody>
                  {demoSubscriptions.map(sub => (
                    <tr key={sub.id} className="border-b border-slate-100 hover:bg-slate-50 transition">
                      <td className="px-5 py-3.5 text-sm text-slate-950">{sub.billingEmail}</td>
                      <td className="px-5 py-3.5">
                        <span className={`text-xs font-semibold px-2.5 py-1 rounded-lg ${
                          sub.plan === "annual" ? "bg-purple-50 text-purple-700" : sub.plan === "monthly" ? "bg-blue-50 text-blue-700" : "bg-slate-50 text-slate-500"
                        }`}>{sub.plan}</span>
                      </td>
                      <td className="px-5 py-3.5">
                        <span className={`text-xs font-semibold px-2.5 py-1 rounded-lg border ${
                          sub.status === "active" ? "bg-emerald-50 text-emerald-700 border-emerald-200" :
                          sub.status === "past_due" ? "bg-red-50 text-red-700 border-red-200" :
                          "bg-slate-50 text-slate-500 border-slate-200"
                        }`}>{sub.status}</span>
                      </td>
                      <td className="px-5 py-3.5 text-sm text-slate-500">
                        {sub.currentPeriodEnd ? new Date(sub.currentPeriodEnd).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" }) : "—"}
                      </td>
                      <td className="px-5 py-3.5 text-xs font-mono text-slate-400">{sub.stripeCustomerId ?? "—"}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* ── Deposits Tab ── */}
        {tab === "deposits" && (
          <div className="space-y-6">
            <h2 className="text-2xl font-bold text-slate-950">Deposit Orders</h2>

            <div className="grid sm:grid-cols-3 gap-4">
              <KPICard icon={Wallet} label="Total Volume" value={`$${totalDepositVolume.toLocaleString()}`} color="bg-emerald-500" />
              <KPICard icon={CheckCircle} label="Confirmed" value={`${demoDeposits.filter(d => d.status === "ach_confirmed").length}`} color="bg-blue-500" />
              <KPICard icon={Clock} label="Pending" value={`${demoDeposits.filter(d => ["ach_pending", "charged"].includes(d.status)).length}`} color="bg-amber-500" />
            </div>

            <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-sm">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-slate-200 bg-slate-50">
                    <th className="text-left text-xs font-semibold text-slate-500 px-5 py-3">User</th>
                    <th className="text-left text-xs font-semibold text-slate-500 px-5 py-3">Account</th>
                    <th className="text-left text-xs font-semibold text-slate-500 px-5 py-3">Total Charged</th>
                    <th className="text-left text-xs font-semibold text-slate-500 px-5 py-3">ACH Amount</th>
                    <th className="text-left text-xs font-semibold text-slate-500 px-5 py-3">Status</th>
                    <th className="text-left text-xs font-semibold text-slate-500 px-5 py-3">Date</th>
                  </tr>
                </thead>
                <tbody>
                  {demoDeposits.map(d => (
                    <tr key={d.id} className="border-b border-slate-100 hover:bg-slate-50 transition">
                      <td className="px-5 py-3.5 text-sm text-slate-950">{d.userId}</td>
                      <td className="px-5 py-3.5 text-sm text-slate-600">{d.accountLast4 && `..${d.accountLast4}`}</td>
                      <td className="px-5 py-3.5 text-sm font-semibold text-slate-950">${(d.totalCharged / 100).toLocaleString()}</td>
                      <td className="px-5 py-3.5 text-sm text-slate-600">${(d.achAmount / 100).toLocaleString()}</td>
                      <td className="px-5 py-3.5">
                        <span className={`text-xs font-semibold px-2.5 py-1 rounded-lg border ${
                          d.status === "ach_confirmed" ? "bg-emerald-50 text-emerald-700 border-emerald-200" :
                          d.status === "ach_pending" ? "bg-blue-50 text-blue-700 border-blue-200" :
                          "bg-amber-50 text-amber-700 border-amber-200"
                        }`}>{d.status.replace(/_/g, " ")}</span>
                      </td>
                      <td className="px-5 py-3.5 text-sm text-slate-400">{new Date(d.createdAt).toLocaleDateString("en-US", { month: "short", day: "numeric" })}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* ── Accounting Tab ── */}
        {tab === "accounting" && (
          <div className="space-y-6">
            <h2 className="text-2xl font-bold text-slate-950">Accounting Overview</h2>

            <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
              <KPICard icon={DollarSign} label="Monthly Revenue" value={`$${mrr.toLocaleString()}`} change="+12%" changeDirection="up" color="bg-emerald-500" />
              <KPICard icon={CreditCard} label="Service Fees Collected" value={`$${(demoAccounts.filter(a => a.approvalStatus === "approved").length * 99).toLocaleString()}`} color="bg-blue-500" />
              <KPICard icon={Wallet} label="Deposit Volume" value={`$${totalDepositVolume.toLocaleString()}`} color="bg-purple-500" />
              <KPICard icon={TrendingUp} label="Commissions Owed" value={`$${allPendingCommissions.toLocaleString()}`} color="bg-red-500" />
            </div>

            <div className="grid lg:grid-cols-2 gap-6">
              {/* Revenue Summary */}
              <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-sm">
                <h3 className="font-bold text-slate-950 mb-4">Revenue Summary</h3>
                <div className="space-y-3">
                  {[
                    { label: "Subscription Revenue (MRR)", value: mrr, color: "bg-emerald-500" },
                    { label: "Service Fees ($99 one-time)", value: demoAccounts.filter(a => a.approvalStatus === "approved").length * 99, color: "bg-blue-500" },
                    { label: "Stripe Processing Fees", value: -Math.round(totalDepositVolume * 0.029 + demoDeposits.length * 0.30), color: "bg-red-400" },
                    { label: "Commission Payouts", value: -allPendingCommissions, color: "bg-amber-500" },
                  ].map((item, i) => (
                    <div key={i} className="flex items-center justify-between py-2 border-b border-slate-100 last:border-0">
                      <div className="flex items-center gap-3">
                        <div className={`w-3 h-3 rounded-full ${item.color}`} />
                        <span className="text-sm text-slate-700">{item.label}</span>
                      </div>
                      <span className={`text-sm font-bold ${item.value >= 0 ? "text-emerald-600" : "text-red-500"}`}>
                        {item.value >= 0 ? "+" : ""}${Math.abs(item.value).toLocaleString()}
                      </span>
                    </div>
                  ))}
                  <div className="flex items-center justify-between pt-3 border-t-2 border-slate-200">
                    <span className="text-sm font-bold text-slate-950">Net Revenue</span>
                    <span className="text-lg font-bold text-emerald-600">
                      ${(mrr + (demoAccounts.filter(a => a.approvalStatus === "approved").length * 99) - Math.round(totalDepositVolume * 0.029 + demoDeposits.length * 0.30) - allPendingCommissions).toLocaleString()}
                    </span>
                  </div>
                </div>
              </div>

              {/* Trust Account Notice */}
              <div className="space-y-4">
                <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-sm">
                  <h3 className="font-bold text-slate-950 mb-4">Deposit Trust Accounting</h3>
                  <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 mb-4">
                    <div className="flex items-start gap-3">
                      <Shield className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
                      <div>
                        <p className="text-sm font-semibold text-amber-800">Client Trust Account Required</p>
                        <p className="text-xs text-amber-700 mt-1">Client deposits must be held in a separate Client Trust Account. Never commingled with operating funds until legally earned.</p>
                      </div>
                    </div>
                  </div>
                  <div className="space-y-3">
                    <div className="flex justify-between text-sm">
                      <span className="text-slate-600">Total Client Deposits Held</span>
                      <span className="font-bold text-slate-950">${(demoDeposits.filter(d => ["charged", "ach_pending"].includes(d.status)).reduce((s, d) => s + d.achAmount, 0) / 100).toLocaleString()}</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-slate-600">Deposits Disbursed (ACH)</span>
                      <span className="font-bold text-emerald-600">${(demoDeposits.filter(d => d.status === "ach_confirmed").reduce((s, d) => s + d.achAmount, 0) / 100).toLocaleString()}</span>
                    </div>
                  </div>
                </div>

                {/* ACH Permission */}
                <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-sm">
                  <h3 className="font-bold text-slate-950 mb-2">ACH Authorization</h3>
                  <p className="text-sm text-slate-500 mb-3">All push/pull ACH transfers require signed client authorization per NACHA rules.</p>
                  <div className="flex items-center gap-2 text-xs">
                    <CheckCircle className="w-4 h-4 text-emerald-500" />
                    <span className="text-slate-600">{demoDeposits.length} active ACH authorizations on file</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
