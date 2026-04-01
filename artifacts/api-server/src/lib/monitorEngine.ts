import { db, monitorEventsTable, monitorRunsTable, sourceHealthTable } from "@workspace/db";
import { eq, desc, sql } from "drizzle-orm";
import { ALL_SOURCES, type MonitorSource } from "./monitorSources";

const EWS_CHEX_KEYWORDS = [
  "chexsystems", "chex systems", "early warning services", "ews",
  "second chance", "no chexsystems", "chex inquiry", "consumer report",
];

const POLICY_KEYWORDS = [
  "policy change", "policy update", "new policy", "updated terms",
  "terms change", "fee change", "new fee", "account closure", "minimum balance",
  "direct deposit requirement", "changed requirements", "no longer accepting",
  "now accepting", "opened to", "closed to",
];

const BONUS_KEYWORDS = [
  "bank bonus", "checking bonus", "savings bonus", "new bonus",
  "bonus offer", "promotion", "limited time", "sign-up bonus",
  "welcome bonus", "introductory offer", "offer expired", "offer ended",
  "bonus increased", "bonus decreased", "bonus extended",
];

const BANK_NAMES = [
  "chase", "bank of america", "wells fargo", "citibank", "us bank", "pnc",
  "truist", "td bank", "capital one", "fifth third", "regions", "huntington",
  "citizens", "keycorp", "m&t bank", "comerica", "ally", "sofi", "chime",
  "discover", "american express", "charles schwab", "fidelity", "vanguard",
  "bmo", "hsbc", "barclays", "synchrony", "marcus", "navy federal",
  "usaa", "boeing employees", "becu", "penfed",
];

function detectChanges(text: string, sourceUrl: string, sourceName: string): Array<{
  changeType: string;
  summary: string;
  severity: string;
  affectedBanks: string[];
}> {
  const lower = text.toLowerCase();
  const results: Array<{ changeType: string; summary: string; severity: string; affectedBanks: string[] }> = [];

  const hasEWS = EWS_CHEX_KEYWORDS.some(k => lower.includes(k));
  const hasPolicy = POLICY_KEYWORDS.some(k => lower.includes(k));
  const hasBonus = BONUS_KEYWORDS.some(k => lower.includes(k));

  const affectedBanks = BANK_NAMES.filter(b => lower.includes(b)).map(b =>
    b.replace(/\b\w/g, c => c.toUpperCase())
  );

  if (hasEWS && hasPolicy) {
    results.push({
      changeType: "policy_update",
      summary: `EWS/ChexSystems policy change detected at ${sourceName}`,
      severity: "high",
      affectedBanks,
    });
  }

  if (hasEWS && !hasPolicy) {
    results.push({
      changeType: "user_report",
      summary: `EWS/ChexSystems mention detected at ${sourceName}`,
      severity: "info",
      affectedBanks,
    });
  }

  if (hasBonus && affectedBanks.length > 0) {
    const opened = lower.includes("new") || lower.includes("launched") || lower.includes("now available");
    const closed = lower.includes("expired") || lower.includes("ended") || lower.includes("closed");
    results.push({
      changeType: opened ? "bank_opened" : closed ? "bank_closed" : "user_report",
      summary: `Bank bonus ${opened ? "opened" : closed ? "closed" : "update"} at ${affectedBanks.join(", ")} via ${sourceName}`,
      severity: opened || closed ? "medium" : "info",
      affectedBanks,
    });
  }

  if (hasPolicy && affectedBanks.length > 0 && !hasEWS) {
    results.push({
      changeType: "policy_update",
      summary: `Policy update at ${affectedBanks.join(", ")} detected via ${sourceName}`,
      severity: "medium",
      affectedBanks,
    });
  }

  return results;
}

async function fetchSourceContent(source: MonitorSource, timeoutMs: number = 8000): Promise<{ text: string; statusCode: number; responseTimeMs: number }> {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);
  const start = Date.now();

  try {
    const res = await fetch(source.url, {
      signal: controller.signal,
      headers: {
        "User-Agent": "BigBankBonus Monitor/1.0 (bank-bonus-research; contact@bigbankbonus.com)",
        "Accept": "application/rss+xml, application/xml, application/json, text/html, */*",
      },
    });
    clearTimeout(timer);
    const responseTimeMs = Date.now() - start;
    const text = await res.text();
    return { text, statusCode: res.status, responseTimeMs };
  } catch (err: any) {
    clearTimeout(timer);
    const responseTimeMs = Date.now() - start;
    return { text: "", statusCode: 0, responseTimeMs };
  }
}

export async function runMonitorEngine(options: { maxSources?: number; dryRun?: boolean } = {}): Promise<{
  runId: number;
  sourcesChecked: number;
  eventsDetected: number;
  errorsEncountered: number;
  durationMs: number;
}> {
  const start = Date.now();
  const sources = options.maxSources ? ALL_SOURCES.slice(0, options.maxSources) : ALL_SOURCES;

  const [run] = await db.insert(monitorRunsTable).values({
    status: "running",
    sourcesChecked: 0,
    eventsDetected: 0,
    errorsEncountered: 0,
  }).returning();

  let sourcesChecked = 0;
  let eventsDetected = 0;
  let errorsEncountered = 0;

  const BATCH_SIZE = 20;
  for (let i = 0; i < sources.length; i += BATCH_SIZE) {
    const batch = sources.slice(i, i + BATCH_SIZE);
    await Promise.all(batch.map(async (source) => {
      try {
        const { text, statusCode, responseTimeMs } = await fetchSourceContent(source);
        const isAlive = statusCode >= 200 && statusCode < 400;

        await db.insert(sourceHealthTable).values({
          sourceUrl: source.url,
          sourceCategory: source.category,
          sourceName: source.name,
          isAlive,
          lastStatusCode: statusCode,
          responseTimeMs,
          errorMessage: isAlive ? null : `HTTP ${statusCode}`,
          consecutiveFailures: isAlive ? 0 : 1,
          lastCheckedAt: new Date(),
          updatedAt: new Date(),
        }).onConflictDoUpdate({
          target: sourceHealthTable.sourceUrl,
          set: {
            isAlive,
            lastStatusCode: statusCode,
            responseTimeMs,
            errorMessage: isAlive ? null : `HTTP ${statusCode}`,
            consecutiveFailures: isAlive ? 0 : sql`${sourceHealthTable.consecutiveFailures} + 1`,
            lastCheckedAt: new Date(),
            updatedAt: new Date(),
          },
        });

        if (!options.dryRun && isAlive && text.length > 0) {
          const changes = detectChanges(text, source.url, source.name);
          for (const change of changes) {
            await db.insert(monitorEventsTable).values({
              sourceUrl: source.url,
              sourceCategory: source.category,
              sourceName: source.name,
              changeType: change.changeType,
              summary: change.summary,
              severity: change.severity,
              affectedBanks: change.affectedBanks,
              rawSnippet: text.slice(0, 500),
              detectedAt: new Date(),
            });
            eventsDetected++;
          }
        }

        if (!isAlive) errorsEncountered++;
        sourcesChecked++;
      } catch (err) {
        errorsEncountered++;
        sourcesChecked++;
      }
    }));
  }

  const durationMs = Date.now() - start;

  await db.update(monitorRunsTable).set({
    completedAt: new Date(),
    sourcesChecked,
    eventsDetected,
    errorsEncountered,
    status: "completed",
    notes: `Completed in ${Math.round(durationMs / 1000)}s. Checked ${sourcesChecked} sources, found ${eventsDetected} events.`,
  }).where(eq(monitorRunsTable.id, run.id));

  return { runId: run.id, sourcesChecked, eventsDetected, errorsEncountered, durationMs };
}

export async function runHealthCheck(options: { maxSources?: number } = {}): Promise<{
  totalChecked: number;
  alive: number;
  dead: number;
  durationMs: number;
}> {
  const start = Date.now();
  const sources = options.maxSources ? ALL_SOURCES.slice(0, options.maxSources) : ALL_SOURCES;

  let alive = 0;
  let dead = 0;

  const BATCH_SIZE = 30;
  for (let i = 0; i < sources.length; i += BATCH_SIZE) {
    const batch = sources.slice(i, i + BATCH_SIZE);
    await Promise.all(batch.map(async (source) => {
      const controller = new AbortController();
      const timer = setTimeout(() => controller.abort(), 5000);
      const reqStart = Date.now();
      let statusCode = 0;
      let errorMessage: string | null = null;

      try {
        const res = await fetch(source.url, {
          method: "HEAD",
          signal: controller.signal,
          headers: { "User-Agent": "BigBankBonus HealthCheck/1.0" },
        });
        clearTimeout(timer);
        statusCode = res.status;
        if (statusCode >= 200 && statusCode < 400) alive++;
        else dead++;
      } catch (err: any) {
        clearTimeout(timer);
        dead++;
        errorMessage = err.message ?? "Connection failed";
      }

      const responseTimeMs = Date.now() - reqStart;
      const isAlive = statusCode >= 200 && statusCode < 400;

      await db.insert(sourceHealthTable).values({
        sourceUrl: source.url,
        sourceCategory: source.category,
        sourceName: source.name,
        isAlive,
        lastStatusCode: statusCode,
        responseTimeMs,
        errorMessage,
        consecutiveFailures: isAlive ? 0 : 1,
        lastCheckedAt: new Date(),
        updatedAt: new Date(),
      }).onConflictDoUpdate({
        target: sourceHealthTable.sourceUrl,
        set: {
          isAlive,
          lastStatusCode: statusCode,
          responseTimeMs,
          errorMessage,
          consecutiveFailures: isAlive ? 0 : sql`${sourceHealthTable.consecutiveFailures} + 1`,
          lastCheckedAt: new Date(),
          updatedAt: new Date(),
        },
      });
    }));
  }

  return { totalChecked: sources.length, alive, dead, durationMs: Date.now() - start };
}

export async function getMonitorStatus(): Promise<{
  lastRun: any;
  recentEvents: any[];
  sourceHealth: { total: number; alive: number; dead: number };
  totalSources: number;
}> {
  const [lastRun] = await db
    .select()
    .from(monitorRunsTable)
    .orderBy(desc(monitorRunsTable.id))
    .limit(1);

  const recentEvents = await db
    .select()
    .from(monitorEventsTable)
    .orderBy(desc(monitorEventsTable.detectedAt))
    .limit(20);

  const healthRows = await db.select().from(sourceHealthTable);
  const aliveCount = healthRows.filter(r => r.isAlive).length;

  return {
    lastRun: lastRun ?? null,
    recentEvents,
    sourceHealth: {
      total: healthRows.length,
      alive: aliveCount,
      dead: healthRows.length - aliveCount,
    },
    totalSources: ALL_SOURCES.length,
  };
}
