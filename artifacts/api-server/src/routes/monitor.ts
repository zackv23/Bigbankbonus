import { Router } from "express";
import { db, monitorEventsTable, monitorRunsTable, sourceHealthTable, subscriptionsTable } from "@workspace/db";
import { eq, desc, gte } from "drizzle-orm";
import { getMonitorStatus, runMonitorEngine, runHealthCheck } from "../lib/monitorEngine";
import { triggerMonitorRun, triggerHealthRun } from "../lib/monitorScheduler";
import { ALL_SOURCES, SOURCE_COUNT } from "../lib/monitorSources";

const router = Router();

async function isPaidUser(userId: string | undefined): Promise<boolean> {
  if (!userId) return false;
  const [sub] = await db
    .select({ plan: subscriptionsTable.plan, status: subscriptionsTable.status })
    .from(subscriptionsTable)
    .where(eq(subscriptionsTable.userId, userId))
    .limit(1);
  if (!sub) return false;
  return (sub.plan === "monthly" || sub.plan === "annual") && sub.status === "active";
}

function getUserId(req: any): string | undefined {
  return (req.query.userId ?? req.headers["x-user-id"] ?? req.body?.userId) as string | undefined;
}

router.get("/monitor/status", async (req, res) => {
  try {
    const status = await getMonitorStatus();
    res.json({
      ok: true,
      lastRun: status.lastRun
        ? {
            id: status.lastRun.id,
            startedAt: status.lastRun.startedAt,
            completedAt: status.lastRun.completedAt,
            sourcesChecked: status.lastRun.sourcesChecked,
            eventsDetected: status.lastRun.eventsDetected,
            errorsEncountered: status.lastRun.errorsEncountered,
            status: status.lastRun.status,
          }
        : null,
      recentEvents: status.recentEvents,
      sourceHealth: status.sourceHealth,
      totalSources: SOURCE_COUNT,
      monitoredCategories: ["cfpb", "reddit", "doc", "bank_newsroom", "aggregator", "forum", "federal", "state", "news", "consumer"],
    });
  } catch (err: any) {
    res.status(500).json({ error: err.message ?? "Failed to fetch monitor status" });
  }
});

router.get("/monitor/events", async (req, res) => {
  const userId = getUserId(req);
  if (!(await isPaidUser(userId))) {
    return res.status(403).json({ error: "Pro subscription required", upgrade: true });
  }

  const limit = Math.min(parseInt(String(req.query.limit ?? "50"), 10), 200);
  const offset = parseInt(String(req.query.offset ?? "0"), 10);
  const changeType = req.query.changeType as string | undefined;
  const severity = req.query.severity as string | undefined;
  const bank = req.query.bank as string | undefined;
  const sinceHours = parseInt(String(req.query.sinceHours ?? "168"), 10);

  const since = new Date(Date.now() - sinceHours * 3600 * 1000);

  try {
    let events = await db
      .select()
      .from(monitorEventsTable)
      .where(gte(monitorEventsTable.detectedAt, since))
      .orderBy(desc(monitorEventsTable.detectedAt))
      .limit(limit)
      .offset(offset);

    if (changeType) {
      events = events.filter(e => e.changeType === changeType);
    }
    if (severity) {
      events = events.filter(e => e.severity === severity);
    }
    if (bank) {
      const bankLower = bank.toLowerCase();
      events = events.filter(e =>
        (e.affectedBanks as string[] ?? []).some(b => b.toLowerCase().includes(bankLower)) ||
        (e.summary ?? "").toLowerCase().includes(bankLower)
      );
    }

    return res.json({ events, total: events.length, limit, offset });
  } catch (err: any) {
    return res.status(500).json({ error: err.message ?? "Failed to fetch events" });
  }
});

router.get("/monitor/sources", async (req, res) => {
  const category = req.query.category as string | undefined;
  const sources = category ? ALL_SOURCES.filter(s => s.category === category) : ALL_SOURCES;
  const summary = {
    total: SOURCE_COUNT,
    byCategory: ALL_SOURCES.reduce((acc, s) => {
      acc[s.category] = (acc[s.category] ?? 0) + 1;
      return acc;
    }, {} as Record<string, number>),
    sources: sources.slice(0, 100),
  };
  res.json(summary);
});

router.get("/monitor/health", async (req, res) => {
  const userId = getUserId(req);
  if (!(await isPaidUser(userId))) {
    return res.status(403).json({ error: "Pro subscription required", upgrade: true });
  }

  const limit = Math.min(parseInt(String(req.query.limit ?? "100"), 10), 500);
  const deadOnly = req.query.deadOnly === "true";

  try {
    let rows = await db
      .select()
      .from(sourceHealthTable)
      .orderBy(desc(sourceHealthTable.lastCheckedAt))
      .limit(limit);

    if (deadOnly) {
      rows = rows.filter(r => !r.isAlive);
    }

    const alive = rows.filter(r => r.isAlive).length;
    return res.json({
      sources: rows,
      summary: { total: rows.length, alive, dead: rows.length - alive },
    });
  } catch (err: any) {
    return res.status(500).json({ error: err.message ?? "Failed to fetch health" });
  }
});

router.get("/monitor/runs", async (req, res) => {
  const userId = getUserId(req);
  if (!(await isPaidUser(userId))) {
    return res.status(403).json({ error: "Pro subscription required", upgrade: true });
  }
  const limit = Math.min(parseInt(String(req.query.limit ?? "20"), 10), 100);
  try {
    const runs = await db
      .select()
      .from(monitorRunsTable)
      .orderBy(desc(monitorRunsTable.id))
      .limit(limit);
    return res.json({ runs });
  } catch (err: any) {
    return res.status(500).json({ error: err.message ?? "Failed to fetch runs" });
  }
});

router.post("/monitor/trigger", async (req, res) => {
  const userId = getUserId(req);
  if (!(await isPaidUser(userId))) {
    return res.status(403).json({ error: "Pro subscription required", upgrade: true });
  }
  const { type = "monitor" } = req.body as { type?: "monitor" | "health" };
  return res.json({ ok: true, message: `${type} job triggered`, triggeredAt: new Date() });
  if (type === "health") {
    triggerHealthRun().catch(() => {});
  } else {
    triggerMonitorRun().catch(() => {});
  }
});

router.get("/monitor/alerts/summary", async (req, res) => {
  const userId = getUserId(req);
  const paid = await isPaidUser(userId);

  if (!paid) {
    return res.status(403).json({
      error: "Pro subscription required",
      upgrade: true,
      preview: {
        message: "Subscribe to Pro to see real-time bank policy change alerts, EWS/ChexSystems monitoring, and live bank bonus tracking.",
        sampleEvents: [
          { changeType: "policy_update", summary: "EWS/ChexSystems policy change detected at Reddit r/churning", severity: "high", affectedBanks: ["Chase"] },
          { changeType: "bank_opened", summary: "New bank bonus at Wells Fargo via DoC", severity: "medium", affectedBanks: ["Wells Fargo"] },
          { changeType: "user_report", summary: "EWS mention detected at Reddit r/personalfinance", severity: "info", affectedBanks: [] },
        ],
      },
    });
  }

  try {
    const since24h = new Date(Date.now() - 24 * 3600 * 1000);
    const since7d = new Date(Date.now() - 7 * 24 * 3600 * 1000);

    const allEvents = await db.select().from(monitorEventsTable).where(gte(monitorEventsTable.detectedAt, since7d)).orderBy(desc(monitorEventsTable.detectedAt));

    const last24h = allEvents.filter(e => e.detectedAt && e.detectedAt >= since24h);
    const highSeverity = allEvents.filter(e => e.severity === "high");

    const bankMentions: Record<string, number> = {};
    for (const e of allEvents) {
      for (const bank of (e.affectedBanks as string[] ?? [])) {
        bankMentions[bank] = (bankMentions[bank] ?? 0) + 1;
      }
    }
    const topBanks = Object.entries(bankMentions)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 10)
      .map(([bank, count]) => ({ bank, count }));

    const byType = allEvents.reduce((acc, e) => {
      acc[e.changeType] = (acc[e.changeType] ?? 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    return res.json({
      summary: {
        last24hEvents: last24h.length,
        last7dEvents: allEvents.length,
        highSeverityAlerts: highSeverity.length,
        topBanks,
        byChangeType: byType,
      },
      recentAlerts: allEvents.slice(0, 10),
    });
  } catch (err: any) {
    return res.status(500).json({ error: err.message ?? "Failed to fetch alerts summary" });
  }
});

export default router;
