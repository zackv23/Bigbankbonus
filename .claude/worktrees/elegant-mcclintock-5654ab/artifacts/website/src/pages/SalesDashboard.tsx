import { useState, useEffect, useCallback } from "react";
import { Link } from "wouter";
import {
  Users, DollarSign, TrendingUp, Target, Phone, Mail, Plus,
  ChevronRight, Clock, CheckCircle, XCircle, ArrowRight, Bell,
  LogOut, Search, Filter, MessageSquare, BarChart3, Star,
  UserPlus, Briefcase, Calendar, Edit3, Send, FileText,
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
    return JSON.parse(raw) as StoredUser;
  } catch { return null; }
}

type LeadStage = "new" | "contacted" | "qualified" | "proposal" | "converted" | "lost";

interface Lead {
  id: number;
  firstName: string;
  lastName: string;
  email: string;
  phone?: string;
  source?: string;
  stage: LeadStage;
  estimatedValue?: string;
  notes?: string;
  lastContactedAt?: string;
  createdAt: string;
}

interface Commission {
  id: number;
  type: string;
  amount: string;
  description?: string;
  status: string;
  paidAt?: string;
  createdAt: string;
}

interface Note {
  id: number;
  content: string;
  noteType: string;
  createdAt: string;
}

// Demo data
const demoLeads: Lead[] = [
  { id: 1, firstName: "Marcus", lastName: "Johnson", email: "marcus@example.com", phone: "(555) 123-4567", source: "Referral", stage: "qualified", estimatedValue: "1200", lastContactedAt: "2026-04-10T14:30:00Z", createdAt: "2026-03-15T10:00:00Z" },
  { id: 2, firstName: "Sarah", lastName: "Chen", email: "sarah.chen@example.com", phone: "(555) 234-5678", source: "Website", stage: "new", estimatedValue: "800", createdAt: "2026-04-11T09:00:00Z" },
  { id: 3, firstName: "David", lastName: "Williams", email: "dwilliams@example.com", phone: "(555) 345-6789", source: "LinkedIn", stage: "proposal", estimatedValue: "2500", lastContactedAt: "2026-04-09T16:00:00Z", createdAt: "2026-02-20T11:00:00Z" },
  { id: 4, firstName: "Emily", lastName: "Rodriguez", email: "emily.r@example.com", source: "Cold Call", stage: "contacted", estimatedValue: "600", lastContactedAt: "2026-04-08T10:00:00Z", createdAt: "2026-04-01T15:00:00Z" },
  { id: 5, firstName: "James", lastName: "Kim", email: "jkim@example.com", phone: "(555) 456-7890", source: "Referral", stage: "converted", estimatedValue: "1500", lastContactedAt: "2026-04-05T12:00:00Z", createdAt: "2026-01-10T08:00:00Z" },
  { id: 6, firstName: "Lisa", lastName: "Thompson", email: "lisa.t@example.com", source: "Website", stage: "lost", estimatedValue: "900", lastContactedAt: "2026-03-28T14:00:00Z", createdAt: "2026-03-01T09:00:00Z" },
  { id: 7, firstName: "Robert", lastName: "Garcia", email: "rgarcia@example.com", phone: "(555) 567-8901", source: "Event", stage: "new", estimatedValue: "1100", createdAt: "2026-04-12T07:00:00Z" },
];

const demoCommissions: Commission[] = [
  { id: 1, type: "signup", amount: "150.00", description: "James Kim - Pro subscription signup", status: "paid", paidAt: "2026-04-01T00:00:00Z", createdAt: "2026-03-20T00:00:00Z" },
  { id: 2, type: "signup", amount: "150.00", description: "David Williams - Pro subscription signup", status: "pending", createdAt: "2026-04-05T00:00:00Z" },
  { id: 3, type: "deposit", amount: "50.00", description: "James Kim - First deposit bonus", status: "paid", paidAt: "2026-04-05T00:00:00Z", createdAt: "2026-03-25T00:00:00Z" },
  { id: 4, type: "renewal", amount: "25.00", description: "James Kim - Monthly renewal", status: "pending", createdAt: "2026-04-10T00:00:00Z" },
];

const stageConfig: Record<LeadStage, { label: string; color: string; bgColor: string; icon: any }> = {
  new: { label: "New", color: "text-blue-700", bgColor: "bg-blue-50 border-blue-200", icon: Star },
  contacted: { label: "Contacted", color: "text-amber-700", bgColor: "bg-amber-50 border-amber-200", icon: Phone },
  qualified: { label: "Qualified", color: "text-purple-700", bgColor: "bg-purple-50 border-purple-200", icon: CheckCircle },
  proposal: { label: "Proposal", color: "text-indigo-700", bgColor: "bg-indigo-50 border-indigo-200", icon: FileText },
  converted: { label: "Converted", color: "text-emerald-700", bgColor: "bg-emerald-50 border-emerald-200", icon: DollarSign },
  lost: { label: "Lost", color: "text-red-700", bgColor: "bg-red-50 border-red-200", icon: XCircle },
};

const stages: LeadStage[] = ["new", "contacted", "qualified", "proposal", "converted", "lost"];

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

function AddLeadModal({ onClose, onAdd }: { onClose: () => void; onAdd: (lead: Partial<Lead>) => void }) {
  const [form, setForm] = useState({ firstName: "", lastName: "", email: "", phone: "", source: "", estimatedValue: "", notes: "" });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.firstName || !form.lastName || !form.email) return;
    onAdd({
      ...form,
      stage: "new" as LeadStage,
      id: Date.now(),
      createdAt: new Date().toISOString(),
    });
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-4" onClick={onClose}>
      <div className="bg-white rounded-2xl max-w-lg w-full p-6 shadow-2xl" onClick={e => e.stopPropagation()}>
        <h2 className="text-xl font-bold text-slate-950 mb-4">Add New Lead</h2>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">First Name *</label>
              <input type="text" value={form.firstName} onChange={e => setForm(p => ({ ...p, firstName: e.target.value }))}
                className="w-full px-3 py-2.5 rounded-xl border border-slate-300 text-sm focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 outline-none" required />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Last Name *</label>
              <input type="text" value={form.lastName} onChange={e => setForm(p => ({ ...p, lastName: e.target.value }))}
                className="w-full px-3 py-2.5 rounded-xl border border-slate-300 text-sm focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 outline-none" required />
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Email *</label>
            <input type="email" value={form.email} onChange={e => setForm(p => ({ ...p, email: e.target.value }))}
              className="w-full px-3 py-2.5 rounded-xl border border-slate-300 text-sm focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 outline-none" required />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Phone</label>
              <input type="tel" value={form.phone} onChange={e => setForm(p => ({ ...p, phone: e.target.value }))}
                className="w-full px-3 py-2.5 rounded-xl border border-slate-300 text-sm focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 outline-none" />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Source</label>
              <select value={form.source} onChange={e => setForm(p => ({ ...p, source: e.target.value }))}
                className="w-full px-3 py-2.5 rounded-xl border border-slate-300 text-sm focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 outline-none bg-white">
                <option value="">Select...</option>
                <option>Website</option>
                <option>Referral</option>
                <option>LinkedIn</option>
                <option>Cold Call</option>
                <option>Event</option>
                <option>Other</option>
              </select>
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Estimated Value ($)</label>
            <input type="number" value={form.estimatedValue} onChange={e => setForm(p => ({ ...p, estimatedValue: e.target.value }))}
              className="w-full px-3 py-2.5 rounded-xl border border-slate-300 text-sm focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 outline-none" />
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Notes</label>
            <textarea rows={3} value={form.notes} onChange={e => setForm(p => ({ ...p, notes: e.target.value }))}
              className="w-full px-3 py-2.5 rounded-xl border border-slate-300 text-sm focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 outline-none resize-none" />
          </div>
          <div className="flex gap-3 pt-2">
            <button type="button" onClick={onClose} className="flex-1 py-2.5 rounded-xl border border-slate-300 text-sm font-semibold text-slate-700 hover:bg-slate-50 transition">
              Cancel
            </button>
            <button type="submit" className="flex-1 py-2.5 rounded-xl bg-slate-950 text-white text-sm font-semibold hover:opacity-90 transition">
              Add Lead
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

function LeadDetailPanel({ lead, onClose, onStageChange }: {
  lead: Lead; onClose: () => void; onStageChange: (id: number, stage: LeadStage) => void;
}) {
  const [notes, setNotes] = useState<Note[]>([
    { id: 1, content: "Initial outreach via email. Interested in bank bonus automation.", noteType: "outreach", createdAt: "2026-04-05T10:00:00Z" },
    { id: 2, content: "Follow-up call. Discussed pricing and service features.", noteType: "call", createdAt: "2026-04-08T14:00:00Z" },
  ]);
  const [newNote, setNewNote] = useState("");

  const addNote = () => {
    if (!newNote.trim()) return;
    setNotes(prev => [{ id: Date.now(), content: newNote, noteType: "general", createdAt: new Date().toISOString() }, ...prev]);
    setNewNote("");
  };

  const cfg = stageConfig[lead.stage];

  return (
    <div className="fixed inset-0 z-50 bg-black/50 flex items-end sm:items-center justify-center" onClick={onClose}>
      <div className="bg-white rounded-t-2xl sm:rounded-2xl w-full sm:max-w-xl max-h-[90vh] overflow-y-auto shadow-2xl" onClick={e => e.stopPropagation()}>
        <div className="sticky top-0 bg-white border-b border-slate-200 p-5 rounded-t-2xl z-10">
          <div className="flex items-center justify-between mb-3">
            <h2 className="text-xl font-bold text-slate-950">{lead.firstName} {lead.lastName}</h2>
            <button onClick={onClose} className="p-1.5 hover:bg-slate-100 rounded-lg transition text-slate-400">
              <XCircle className="w-5 h-5" />
            </button>
          </div>
          <div className="flex items-center gap-3 flex-wrap">
            <span className={`text-xs font-semibold px-2.5 py-1 rounded-lg border ${cfg.bgColor} ${cfg.color}`}>{cfg.label}</span>
            {lead.estimatedValue && <span className="text-sm font-semibold text-emerald-600">${parseFloat(lead.estimatedValue).toLocaleString()}</span>}
            {lead.source && <span className="text-xs text-slate-400">{lead.source}</span>}
          </div>
        </div>

        <div className="p-5 space-y-5">
          {/* Contact Info */}
          <div className="grid grid-cols-2 gap-3">
            <a href={`mailto:${lead.email}`} className="flex items-center gap-2 p-3 rounded-xl bg-slate-50 hover:bg-slate-100 transition">
              <Mail className="w-4 h-4 text-slate-400" />
              <span className="text-sm text-slate-700 truncate">{lead.email}</span>
            </a>
            {lead.phone && (
              <a href={`tel:${lead.phone}`} className="flex items-center gap-2 p-3 rounded-xl bg-slate-50 hover:bg-slate-100 transition">
                <Phone className="w-4 h-4 text-slate-400" />
                <span className="text-sm text-slate-700">{lead.phone}</span>
              </a>
            )}
          </div>

          {/* Stage Pipeline */}
          <div>
            <p className="text-sm font-semibold text-slate-700 mb-2">Move to Stage</p>
            <div className="flex flex-wrap gap-2">
              {stages.filter(s => s !== "lost").map(s => {
                const sc = stageConfig[s];
                const active = s === lead.stage;
                return (
                  <button key={s} onClick={() => onStageChange(lead.id, s)}
                    className={`text-xs font-semibold px-3 py-1.5 rounded-lg border transition ${active ? `${sc.bgColor} ${sc.color}` : "border-slate-200 text-slate-500 hover:bg-slate-50"}`}>
                    {sc.label}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Notes */}
          <div>
            <p className="text-sm font-semibold text-slate-700 mb-2">Notes</p>
            <div className="flex gap-2 mb-3">
              <input type="text" value={newNote} onChange={e => setNewNote(e.target.value)}
                onKeyDown={e => e.key === "Enter" && addNote()}
                placeholder="Add a note..."
                className="flex-1 px-3 py-2.5 rounded-xl border border-slate-300 text-sm focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 outline-none" />
              <button onClick={addNote} className="px-4 py-2.5 rounded-xl bg-slate-950 text-white text-sm font-semibold hover:opacity-90 transition">
                <Send className="w-4 h-4" />
              </button>
            </div>
            <div className="space-y-2 max-h-60 overflow-y-auto">
              {notes.map(n => (
                <div key={n.id} className="p-3 rounded-xl bg-slate-50 border border-slate-100">
                  <p className="text-sm text-slate-700">{n.content}</p>
                  <p className="text-[10px] text-slate-400 mt-1">{new Date(n.createdAt).toLocaleDateString("en-US", { month: "short", day: "numeric", hour: "numeric", minute: "2-digit" })}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function SalesDashboard() {
  const [user, setUser] = useState<StoredUser | null>(null);
  const [leads, setLeads] = useState<Lead[]>(demoLeads);
  const [commissions] = useState<Commission[]>(demoCommissions);
  const [selectedLead, setSelectedLead] = useState<Lead | null>(null);
  const [showAddLead, setShowAddLead] = useState(false);
  const [search, setSearch] = useState("");
  const [stageFilter, setStageFilter] = useState<LeadStage | "all">("all");
  const [view, setView] = useState<"pipeline" | "list" | "commissions">("pipeline");

  useEffect(() => { setUser(getStoredUser()); }, []);

  const handleLogout = () => {
    localStorage.removeItem(USER_STORAGE_KEY);
    window.location.href = "/";
  };

  const filteredLeads = leads.filter(l => {
    const matchSearch = `${l.firstName} ${l.lastName} ${l.email}`.toLowerCase().includes(search.toLowerCase());
    const matchStage = stageFilter === "all" || l.stage === stageFilter;
    return matchSearch && matchStage;
  });

  const handleStageChange = (leadId: number, newStage: LeadStage) => {
    setLeads(prev => prev.map(l => l.id === leadId ? { ...l, stage: newStage, lastContactedAt: new Date().toISOString() } : l));
    if (selectedLead?.id === leadId) setSelectedLead(prev => prev ? { ...prev, stage: newStage } : null);
  };

  const handleAddLead = (lead: Partial<Lead>) => {
    setLeads(prev => [lead as Lead, ...prev]);
  };

  const totalLeads = leads.length;
  const converted = leads.filter(l => l.stage === "converted").length;
  const activeLeads = leads.filter(l => !["converted", "lost"].includes(l.stage)).length;
  const totalCommissions = commissions.reduce((s, c) => s + parseFloat(c.amount), 0);
  const pendingCommissions = commissions.filter(c => c.status === "pending").reduce((s, c) => s + parseFloat(c.amount), 0);

  if (!user) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <div className="text-center max-w-md px-4">
          <div className="w-16 h-16 rounded-2xl bg-indigo-600 flex items-center justify-center mx-auto mb-6">
            <Briefcase className="w-8 h-8 text-white" />
          </div>
          <h1 className="text-3xl font-bold text-slate-950 mb-3">Sales Rep Portal</h1>
          <p className="text-slate-500 mb-6">Sign in to access your leads, CRM, and commissions.</p>
          <Link href="/" className="inline-flex items-center gap-2 bg-slate-950 text-white px-6 py-3 rounded-xl font-semibold">
            Go Home <ArrowRight className="w-4 h-4" />
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50">
      {/* Top Bar */}
      <header className="bg-white border-b border-slate-200 sticky top-0 z-40">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Link href="/" className="flex items-center gap-2">
              <img src={`${import.meta.env.BASE_URL}images/logo-icon.png`} alt="BBB" className="w-8 h-8" />
              <span className="font-bold text-lg text-slate-950 hidden sm:inline">BigBankBonus</span>
            </Link>
            <span className="text-slate-300 hidden sm:inline">|</span>
            <span className="text-sm font-medium text-indigo-600 hidden sm:inline">Sales Portal</span>
          </div>
          <div className="flex items-center gap-4">
            <button className="relative p-2 text-slate-400 hover:text-slate-600 transition">
              <Bell className="w-5 h-5" />
              <span className="absolute top-1 right-1 w-2 h-2 bg-red-500 rounded-full" />
            </button>
            <div className="w-8 h-8 rounded-full bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center text-white text-sm font-bold">
              {(user.name ?? "R").charAt(0)}
            </div>
            <button onClick={handleLogout} className="p-2 text-slate-400 hover:text-red-500 transition" title="Sign out">
              <LogOut className="w-4 h-4" />
            </button>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Stats */}
        <div className="grid grid-cols-2 lg:grid-cols-5 gap-4 mb-8">
          <StatCard icon={Users} label="Total Leads" value={`${totalLeads}`} color="bg-blue-500" />
          <StatCard icon={Target} label="Active" value={`${activeLeads}`} color="bg-amber-500" />
          <StatCard icon={CheckCircle} label="Converted" value={`${converted}`} sub={totalLeads > 0 ? `${((converted / totalLeads) * 100).toFixed(0)}% rate` : "0%"} color="bg-emerald-500" />
          <StatCard icon={DollarSign} label="Total Earned" value={`$${totalCommissions.toLocaleString()}`} color="bg-purple-500" />
          <StatCard icon={Clock} label="Pending" value={`$${pendingCommissions.toLocaleString()}`} sub="Awaiting payout" color="bg-indigo-500" />
        </div>

        {/* View Tabs + Actions */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-6">
          <div className="flex gap-2">
            {(["pipeline", "list", "commissions"] as const).map(v => (
              <button key={v} onClick={() => setView(v)}
                className={`px-4 py-2 rounded-xl text-sm font-semibold transition ${view === v ? "bg-slate-950 text-white" : "bg-white border border-slate-200 text-slate-600 hover:bg-slate-50"}`}>
                {v === "pipeline" ? "Pipeline" : v === "list" ? "All Leads" : "Commissions"}
              </button>
            ))}
          </div>
          <div className="flex gap-2 w-full sm:w-auto">
            <div className="relative flex-1 sm:flex-initial">
              <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
              <input type="text" placeholder="Search leads..." value={search} onChange={e => setSearch(e.target.value)}
                className="w-full sm:w-60 pl-10 pr-3 py-2.5 rounded-xl border border-slate-300 text-sm focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none" />
            </div>
            <button onClick={() => setShowAddLead(true)}
              className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-slate-950 text-white text-sm font-semibold hover:opacity-90 transition shrink-0">
              <Plus className="w-4 h-4" /> Add Lead
            </button>
          </div>
        </div>

        {/* Pipeline View */}
        {view === "pipeline" && (
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 overflow-x-auto">
            {(["new", "contacted", "qualified", "proposal"] as LeadStage[]).map(stage => {
              const cfg = stageConfig[stage];
              const Icon = cfg.icon;
              const stageLeads = filteredLeads.filter(l => l.stage === stage);
              return (
                <div key={stage} className="min-w-[250px]">
                  <div className="flex items-center gap-2 mb-3">
                    <Icon className={`w-4 h-4 ${cfg.color}`} />
                    <span className={`text-sm font-bold ${cfg.color}`}>{cfg.label}</span>
                    <span className="text-xs text-slate-400 bg-slate-100 px-2 py-0.5 rounded-full">{stageLeads.length}</span>
                  </div>
                  <div className="space-y-3">
                    {stageLeads.map(lead => (
                      <div key={lead.id} onClick={() => setSelectedLead(lead)}
                        className="bg-white rounded-xl border border-slate-200 p-4 shadow-sm hover:shadow-md transition cursor-pointer">
                        <div className="flex items-center justify-between mb-2">
                          <p className="font-semibold text-slate-950 text-sm">{lead.firstName} {lead.lastName}</p>
                          {lead.estimatedValue && <span className="text-xs font-bold text-emerald-600">${parseFloat(lead.estimatedValue).toLocaleString()}</span>}
                        </div>
                        <p className="text-xs text-slate-500 truncate mb-2">{lead.email}</p>
                        <div className="flex items-center justify-between">
                          {lead.source && <span className="text-[10px] font-medium text-slate-400 bg-slate-50 px-2 py-0.5 rounded">{lead.source}</span>}
                          {lead.lastContactedAt && (
                            <span className="text-[10px] text-slate-400 flex items-center gap-1">
                              <Clock className="w-3 h-3" />
                              {new Date(lead.lastContactedAt).toLocaleDateString("en-US", { month: "short", day: "numeric" })}
                            </span>
                          )}
                        </div>
                      </div>
                    ))}
                    {stageLeads.length === 0 && (
                      <div className="bg-slate-50 rounded-xl border border-dashed border-slate-200 p-4 text-center">
                        <p className="text-xs text-slate-400">No leads</p>
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {/* List View */}
        {view === "list" && (
          <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-sm">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-slate-200 bg-slate-50">
                    <th className="text-left text-xs font-semibold text-slate-500 px-5 py-3">Name</th>
                    <th className="text-left text-xs font-semibold text-slate-500 px-5 py-3">Email</th>
                    <th className="text-left text-xs font-semibold text-slate-500 px-5 py-3">Stage</th>
                    <th className="text-left text-xs font-semibold text-slate-500 px-5 py-3">Value</th>
                    <th className="text-left text-xs font-semibold text-slate-500 px-5 py-3">Source</th>
                    <th className="text-left text-xs font-semibold text-slate-500 px-5 py-3">Last Contact</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredLeads.map(lead => {
                    const cfg = stageConfig[lead.stage];
                    return (
                      <tr key={lead.id} onClick={() => setSelectedLead(lead)}
                        className="border-b border-slate-100 hover:bg-slate-50 cursor-pointer transition">
                        <td className="px-5 py-3.5">
                          <p className="font-semibold text-sm text-slate-950">{lead.firstName} {lead.lastName}</p>
                        </td>
                        <td className="px-5 py-3.5 text-sm text-slate-600">{lead.email}</td>
                        <td className="px-5 py-3.5">
                          <span className={`text-xs font-semibold px-2.5 py-1 rounded-lg border ${cfg.bgColor} ${cfg.color}`}>{cfg.label}</span>
                        </td>
                        <td className="px-5 py-3.5 text-sm font-semibold text-emerald-600">{lead.estimatedValue ? `$${parseFloat(lead.estimatedValue).toLocaleString()}` : "—"}</td>
                        <td className="px-5 py-3.5 text-sm text-slate-500">{lead.source ?? "—"}</td>
                        <td className="px-5 py-3.5 text-sm text-slate-400">
                          {lead.lastContactedAt ? new Date(lead.lastContactedAt).toLocaleDateString("en-US", { month: "short", day: "numeric" }) : "Never"}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* Commissions View */}
        {view === "commissions" && (
          <div className="space-y-4">
            <div className="grid sm:grid-cols-3 gap-4">
              <div className="bg-white rounded-2xl border border-slate-200 p-5">
                <p className="text-sm text-slate-500 mb-1">Total Earned</p>
                <p className="text-3xl font-bold text-slate-950">${totalCommissions.toLocaleString()}</p>
              </div>
              <div className="bg-white rounded-2xl border border-slate-200 p-5">
                <p className="text-sm text-slate-500 mb-1">Pending Payout</p>
                <p className="text-3xl font-bold text-amber-600">${pendingCommissions.toLocaleString()}</p>
              </div>
              <div className="bg-white rounded-2xl border border-slate-200 p-5">
                <p className="text-sm text-slate-500 mb-1">Paid Out</p>
                <p className="text-3xl font-bold text-emerald-600">${commissions.filter(c => c.status === "paid").reduce((s, c) => s + parseFloat(c.amount), 0).toLocaleString()}</p>
              </div>
            </div>

            <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-sm">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-slate-200 bg-slate-50">
                    <th className="text-left text-xs font-semibold text-slate-500 px-5 py-3">Type</th>
                    <th className="text-left text-xs font-semibold text-slate-500 px-5 py-3">Description</th>
                    <th className="text-left text-xs font-semibold text-slate-500 px-5 py-3">Amount</th>
                    <th className="text-left text-xs font-semibold text-slate-500 px-5 py-3">Status</th>
                    <th className="text-left text-xs font-semibold text-slate-500 px-5 py-3">Date</th>
                  </tr>
                </thead>
                <tbody>
                  {commissions.map(c => (
                    <tr key={c.id} className="border-b border-slate-100">
                      <td className="px-5 py-3.5">
                        <span className="text-xs font-semibold px-2.5 py-1 rounded-lg bg-slate-100 text-slate-600 capitalize">{c.type}</span>
                      </td>
                      <td className="px-5 py-3.5 text-sm text-slate-700">{c.description ?? "—"}</td>
                      <td className="px-5 py-3.5 text-sm font-bold text-emerald-600">${parseFloat(c.amount).toLocaleString()}</td>
                      <td className="px-5 py-3.5">
                        <span className={`text-xs font-semibold px-2.5 py-1 rounded-lg border ${c.status === "paid" ? "bg-emerald-50 text-emerald-700 border-emerald-200" : "bg-amber-50 text-amber-700 border-amber-200"}`}>
                          {c.status === "paid" ? "Paid" : "Pending"}
                        </span>
                      </td>
                      <td className="px-5 py-3.5 text-sm text-slate-400">{new Date(c.createdAt).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </main>

      {/* Modals */}
      {showAddLead && <AddLeadModal onClose={() => setShowAddLead(false)} onAdd={handleAddLead} />}
      {selectedLead && <LeadDetailPanel lead={selectedLead} onClose={() => setSelectedLead(null)} onStageChange={handleStageChange} />}
    </div>
  );
}
