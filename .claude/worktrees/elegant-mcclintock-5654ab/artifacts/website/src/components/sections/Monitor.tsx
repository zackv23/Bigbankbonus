import { motion } from "framer-motion";
import { useEffect, useState } from "react";
import { Shield, Activity, AlertTriangle, TrendingUp, Globe, Bell, Lock } from "lucide-react";

const API_BASE = import.meta.env.BASE_URL
  ? `${import.meta.env.BASE_URL}api`
  : "/api";

interface MonitorStatus {
  ok: boolean;
  lastRun?: {
    sourcesChecked: number;
    eventsDetected: number;
    completedAt?: string;
    status: string;
  };
  sourceHealth?: { total: number; alive: number; dead: number };
  totalSources?: number;
}

interface AlertPreview {
  upgrade?: boolean;
  summary?: {
    last24hEvents: number;
    last7dEvents: number;
    highSeverityAlerts: number;
    topBanks: { bank: string; count: number }[];
    byChangeType: Record<string, number>;
  };
  recentAlerts?: Array<{
    id: number;
    changeType: string;
    summary: string;
    severity: string;
    affectedBanks: string[];
    detectedAt: string;
    sourceCategory: string;
  }>;
  preview?: {
    message: string;
    sampleEvents: Array<{ changeType: string; summary: string; severity: string; affectedBanks: string[] }>;
  };
}

const SEVERITY_COLORS: Record<string, string> = {
  high: "text-red-500 bg-red-50 border-red-200",
  medium: "text-orange-500 bg-orange-50 border-orange-200",
  info: "text-blue-500 bg-blue-50 border-blue-200",
};

const CATEGORY_LABELS: Record<string, string> = {
  cfpb: "CFPB",
  reddit: "Reddit",
  doc: "DoC",
  bank_newsroom: "Bank News",
  aggregator: "Aggregator",
  forum: "Forum",
  federal: "Federal",
  state: "State",
  news: "News",
  consumer: "Consumer",
};

const CHANGE_TYPE_LABELS: Record<string, string> = {
  policy_update: "Policy Update",
  bank_opened: "Bank Opened",
  bank_closed: "Bank Closed",
  user_report: "User Report",
};

function StatPill({ label, value, icon: Icon, color }: { label: string; value: string | number; icon: any; color: string }) {
  return (
    <div className={`flex flex-col items-center p-4 rounded-2xl border ${color} gap-1`}>
      <Icon size={18} className="mb-1 opacity-70" />
      <span className="text-2xl font-bold">{value}</span>
      <span className="text-xs opacity-70 text-center leading-tight">{label}</span>
    </div>
  );
}

export function Monitor() {
  const [status, setStatus] = useState<MonitorStatus | null>(null);
  const [alerts, setAlerts] = useState<AlertPreview | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([
      fetch(`${API_BASE}/monitor/status`).then(r => r.json()).catch(() => null),
      fetch(`${API_BASE}/monitor/alerts/summary`).then(r => r.json()).catch(() => null),
    ]).then(([s, a]) => {
      if (s) setStatus(s);
      if (a) setAlerts(a);
    }).finally(() => setLoading(false));
  }, []);

  const isGated = !loading && (alerts?.upgrade ?? true);
  const sampleEvents = alerts?.preview?.sampleEvents ?? [
    { changeType: "policy_update", summary: "EWS/ChexSystems policy change detected at Reddit r/churning", severity: "high", affectedBanks: ["Chase"] },
    { changeType: "bank_opened", summary: "New bank bonus opened at Wells Fargo via DoC", severity: "medium", affectedBanks: ["Wells Fargo"] },
    { changeType: "user_report", summary: "ChexSystems mention detected at Reddit r/personalfinance", severity: "info", affectedBanks: [] },
  ];

  return (
    <section id="monitor" className="py-24 bg-gradient-to-br from-slate-900 via-indigo-950 to-purple-950 relative overflow-hidden">
      <div className="absolute inset-0 bg-gradient-to-tr from-indigo-900/30 via-purple-800/20 to-slate-900/30 blur-[120px] pointer-events-none" />
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">

        <div className="text-center max-w-3xl mx-auto mb-16">
          <motion.span
            initial={{ opacity: 0 }}
            whileInView={{ opacity: 1 }}
            viewport={{ once: true }}
            className="text-indigo-400 font-bold tracking-wider uppercase text-sm mb-4 block"
          >
            Pro Feature
          </motion.span>
          <motion.h2
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-4xl md:text-5xl font-bold text-white mb-6"
          >
            EWS & ChexSystems{" "}
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-indigo-400 to-purple-400">
              Policy Monitor
            </span>
          </motion.h2>
          <motion.p
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: 0.1 }}
            className="text-lg text-slate-300 leading-relaxed"
          >
            Our backend engine continuously scans 1,000+ public endpoints — CFPB complaint feeds, Reddit communities, DoC deal pages, bank newsrooms, and federal regulators — so you always know which banks are open and what policies just changed.
          </motion.p>
        </div>

        {status && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-12"
          >
            <StatPill
              label="Sources Monitored"
              value={(status.totalSources ?? 1000).toLocaleString() + "+"}
              icon={Globe}
              color="text-indigo-400 bg-indigo-950/60 border-indigo-800/50"
            />
            <StatPill
              label="Sources Online"
              value={status.sourceHealth ? `${status.sourceHealth.alive}/${status.sourceHealth.total}` : "—"}
              icon={Activity}
              color="text-green-400 bg-green-950/60 border-green-800/50"
            />
            <StatPill
              label="Events Detected"
              value={status.lastRun?.eventsDetected ?? "—"}
              icon={Bell}
              color="text-purple-400 bg-purple-950/60 border-purple-800/50"
            />
            <StatPill
              label="Monitor Interval"
              value="Every 6h"
              icon={TrendingUp}
              color="text-orange-400 bg-orange-950/60 border-orange-800/50"
            />
          </motion.div>
        )}

        <div className="grid lg:grid-cols-2 gap-10 items-start">
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            className="space-y-6"
          >
            <h3 className="text-2xl font-bold text-white">What We Track</h3>

            {[
              { icon: Shield, color: "text-indigo-400", title: "CFPB Complaint Feeds", desc: "Real-time EWS & ChexSystems complaint data from the Consumer Financial Protection Bureau." },
              { icon: Activity, color: "text-purple-400", title: "Reddit Communities", desc: "r/churning, r/personalfinance, r/banking — data points from thousands of users sharing open/denied outcomes." },
              { icon: TrendingUp, color: "text-pink-400", title: "DoC Deal Pages & Newsrooms", desc: "Doctor of Credit deal pages, bank press rooms, and 1,000+ aggregator feeds for policy changes." },
              { icon: Globe, color: "text-orange-400", title: "Federal & State Regulators", desc: "OCC, FDIC, Federal Reserve, NCUA, FTC, and all 50 state banking departments." },
              { icon: AlertTriangle, color: "text-yellow-400", title: "Consumer Review Sites", desc: "BBB, Trustpilot, ConsumerAffairs — early signals when bank acceptance windows shift." },
            ].map((item, i) => (
              <motion.div
                key={item.title}
                initial={{ opacity: 0, x: -20 }}
                whileInView={{ opacity: 1, x: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.07 }}
                className="flex gap-4 items-start"
              >
                <div className="w-10 h-10 rounded-xl bg-white/5 border border-white/10 flex items-center justify-center shrink-0">
                  <item.icon size={18} className={item.color} />
                </div>
                <div>
                  <div className="font-semibold text-white mb-1">{item.title}</div>
                  <div className="text-slate-400 text-sm leading-relaxed">{item.desc}</div>
                </div>
              </motion.div>
            ))}
          </motion.div>

          <motion.div
            initial={{ opacity: 0, x: 20 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            className="bg-white/5 border border-white/10 rounded-2xl overflow-hidden"
          >
            <div className="bg-gradient-to-r from-indigo-600/50 to-purple-600/50 px-6 py-4 flex items-center justify-between">
              <div>
                <div className="text-white font-bold text-sm">Recent Alerts</div>
                <div className="text-white/60 text-xs">Live monitor events</div>
              </div>
              {isGated && (
                <div className="flex items-center gap-2 bg-white/10 rounded-full px-3 py-1">
                  <Lock size={12} className="text-white/70" />
                  <span className="text-white/70 text-xs font-semibold">Pro Only</span>
                </div>
              )}
              {!isGated && (
                <div className="flex items-center gap-2 bg-green-500/20 rounded-full px-3 py-1">
                  <span className="w-2 h-2 rounded-full bg-green-400 animate-pulse" />
                  <span className="text-green-300 text-xs font-semibold">Live</span>
                </div>
              )}
            </div>

            <div className="divide-y divide-white/5">
              {(isGated ? sampleEvents : (alerts?.recentAlerts ?? sampleEvents)).slice(0, 6).map((event, i) => {
                const isSample = isGated;
                const severity = event.severity ?? "info";
                const banks = event.affectedBanks ?? [];
                const dateStr = !isSample && (event as any).detectedAt
                  ? new Date((event as any).detectedAt).toLocaleDateString("en-US", { month: "short", day: "numeric" })
                  : null;

                return (
                  <div key={i} className={`px-6 py-4 ${isSample ? "filter blur-[2px] select-none" : ""}`}>
                    <div className="flex items-start justify-between gap-3 mb-2">
                      <span className={`text-xs font-bold px-2 py-0.5 rounded-full border ${SEVERITY_COLORS[severity] ?? SEVERITY_COLORS.info}`}>
                        {severity.toUpperCase()}
                      </span>
                      <div className="flex items-center gap-2">
                        {(event as any).sourceCategory && (
                          <span className="text-xs text-slate-500">{CATEGORY_LABELS[(event as any).sourceCategory] ?? (event as any).sourceCategory}</span>
                        )}
                        {dateStr && <span className="text-xs text-slate-500">{dateStr}</span>}
                      </div>
                    </div>
                    <p className="text-white/85 text-sm leading-relaxed">{event.summary}</p>
                    {banks.length > 0 && (
                      <div className="flex flex-wrap gap-1 mt-2">
                        {banks.slice(0, 3).map((b, j) => (
                          <span key={j} className="text-xs bg-white/10 text-white/60 rounded px-2 py-0.5">{b}</span>
                        ))}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>

            {isGated && (
              <div className="px-6 py-6 bg-gradient-to-t from-slate-900/80 text-center border-t border-white/10">
                <Lock size={20} className="text-indigo-400 mx-auto mb-2" />
                <p className="text-white/70 text-sm mb-4 leading-relaxed">
                  {alerts?.preview?.message ?? "Subscribe to Pro to see live policy alerts, bank opening/closing events, and EWS/ChexSystems intelligence."}
                </p>
                <a
                  href="/#pricing"
                  className="inline-flex items-center gap-2 bg-gradient-to-r from-indigo-600 to-purple-600 text-white px-6 py-3 rounded-xl font-semibold text-sm hover:from-indigo-500 hover:to-purple-500 transition-all"
                >
                  <Shield size={16} />
                  Unlock Monitor — Upgrade to Pro
                </a>
              </div>
            )}
          </motion.div>
        </div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="mt-16 grid sm:grid-cols-3 gap-6"
        >
          {[
            { title: "Monitor-the-Monitors", desc: "A secondary health-check job pings every source hourly and flags dead endpoints before they cause data gaps.", icon: Activity },
            { title: "6-Hour Auto-Refresh", desc: "The engine runs on a configurable schedule (default every 6 hours), ensuring you always see the freshest policy data.", icon: TrendingUp },
            { title: "Severity Classification", desc: "Each alert is classified as High (policy changed), Medium (bonus opened/closed), or Info (user report) so you know what to act on.", icon: AlertTriangle },
          ].map((item, i) => (
            <motion.div
              key={item.title}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: i * 0.1 }}
              className="bg-white/5 border border-white/10 rounded-2xl p-6"
            >
              <item.icon size={20} className="text-indigo-400 mb-3" />
              <h4 className="text-white font-bold mb-2">{item.title}</h4>
              <p className="text-slate-400 text-sm leading-relaxed">{item.desc}</p>
            </motion.div>
          ))}
        </motion.div>
      </div>
    </section>
  );
}
