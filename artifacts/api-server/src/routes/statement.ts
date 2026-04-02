/**
 * GET /api/autopay/statement?userId=...&month=YYYY-MM
 *
 * Returns a monthly autopay statement: per-program cycle breakdown,
 * ACH volume, estimated bonus earnings, and a flat ledger of events.
 *
 * Since we store current state (not a separate events table) we reconstruct
 * the history from createdAt, cycleCount, and the most-recent action dates.
 */

import { Router } from "express";
import { db, autopaySchedulesTable } from "@workspace/db";
import { eq } from "drizzle-orm";
import { sendEmail, monthlyStatementEmail } from "../lib/notifications";

const router = Router();

// ─── helpers ─────────────────────────────────────────────────────────────────

function fmtMonth(d: Date): string {
  return d.toLocaleDateString("en-US", { month: "long", year: "numeric" });
}

function fmtDate(d: Date): string {
  return d.toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
}

function addBizDays(from: Date, n: number): Date {
  const d = new Date(from);
  let added = 0;
  while (added < n) {
    d.setUTCDate(d.getUTCDate() + 1);
    const dow = d.getUTCDay();
    if (dow !== 0 && dow !== 6) added++;
  }
  return d;
}

// Reconstruct estimated cycle dates from enrollment start
function buildCycleDates(
  enrolledAt: Date,
  cycleCount: number,
  achAmount: number,
): { date: string; type: string; amount: number; status: string }[] {
  const events: { date: string; type: string; amount: number; status: string }[] = [];
  let cursor = enrolledAt;
  for (let i = 0; i < cycleCount; i++) {
    const pushDate = addBizDays(cursor, 1);
    const pullDate = addBizDays(pushDate, 2);
    events.push({ date: fmtDate(pushDate), type: "ACH Push",  amount: achAmount, status: "settled" });
    events.push({ date: fmtDate(pullDate), type: "ACH Pull",  amount: achAmount, status: "settled" });
    cursor = addBizDays(pullDate, 2);
  }
  return events;
}

function inMonth(dateStr: string, year: number, month: number): boolean {
  const d = new Date(dateStr);
  return d.getUTCFullYear() === year && d.getUTCMonth() + 1 === month;
}

// ─── GET /api/autopay/statement ───────────────────────────────────────────────

router.get("/autopay/statement", async (req, res) => {
  const userId = String(req.query.userId ?? "");
  const monthStr = String(req.query.month ?? ""); // YYYY-MM

  if (!userId) return res.status(400).json({ error: "userId required" });

  let year: number;
  let month: number; // 1-12

  if (monthStr && /^\d{4}-\d{2}$/.test(monthStr)) {
    [year, month] = monthStr.split("-").map(Number);
  } else {
    const now = new Date();
    year  = now.getUTCFullYear();
    month = now.getUTCMonth() + 1;
  }

  const monthStart = new Date(Date.UTC(year, month - 1, 1));
  const monthEnd   = new Date(Date.UTC(year, month,     1)); // exclusive

  const all = await db
    .select()
    .from(autopaySchedulesTable)
    .where(eq(autopaySchedulesTable.userId, userId));

  // Programs that were active at any point during this month:
  //   created before end of month AND (still active OR ended after start of month)
  const programs = all.filter(s => {
    const created = s.createdAt ? new Date(s.createdAt) : null;
    if (!created || created >= monthEnd) return false;
    const ended = s.endsAt ? new Date(s.endsAt) : null;
    const terminal = ["refunded", "cancelled"].includes(s.status ?? "");
    if (terminal && ended && ended < monthStart) return false;
    return true;
  });

  let totalAchCycles    = 0;
  let totalAchVolume    = 0;
  let completedPrograms = 0;
  let estimatedBonuses  = 0;

  const programRows = programs.map(s => {
    const achAmt      = (s.achAmount ?? 1001);
    const cycleCount  = s.cycleCount ?? 0;
    const enrolled    = s.createdAt ? new Date(s.createdAt) : new Date();
    const allEvents   = buildCycleDates(enrolled, cycleCount, achAmt);

    // Filter events that fall in the requested month
    const monthEvents = allEvents.filter(e => inMonth(e.date, year, month));
    const cyclesThisMonth = Math.floor(monthEvents.length / 2); // push+pull pairs

    totalAchCycles  += cyclesThisMonth;
    totalAchVolume  += cyclesThisMonth * achAmt * 2;

    if (s.status === "refunded") completedPrograms++;
    estimatedBonuses += s.bonusAmount ?? 0;

    // If the program started this month also add a "CC Charged" event
    const createdInMonth = inMonth(fmtDate(enrolled), year, month);
    const allMonthEvents = [
      ...(createdInMonth
        ? [{ date: fmtDate(enrolled), type: "CC Charged",  amount: s.chargeAmount ?? 0,  status: "charged" }]
        : []),
      ...monthEvents,
      // Final refund event
      ...(s.status === "refunded" && s.endsAt && inMonth(fmtDate(new Date(s.endsAt)), year, month)
        ? [{ date: fmtDate(new Date(s.endsAt)), type: "CC Refunded", amount: s.chargeAmount ?? 0, status: "refunded" }]
        : []),
    ].sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());

    return {
      id:           s.id,
      bankName:     s.bankName ?? "Bank",
      bonusAmount:  s.bonusAmount ?? 0,
      achAmount:    achAmt,
      chargeAmount: s.chargeAmount ?? 0,
      status:       s.status,
      cycleCount,
      maxCycles:    s.maxCycles ?? 18,
      cyclesThisMonth,
      achVolumeThisMonth: cyclesThisMonth * achAmt * 2,
      endsAt:       s.endsAt ? fmtDate(new Date(s.endsAt)) : null,
      demo:         s.demo ?? false,
      events:       allMonthEvents,
    };
  });

  // Flat ledger for the month (all programs combined, sorted by date)
  const flatLedger = programRows
    .flatMap(p => p.events.map(e => ({ ...e, bankName: p.bankName })))
    .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());

  res.json({
    month:       fmtMonth(new Date(Date.UTC(year, month - 1, 1))),
    monthKey:    `${year}-${String(month).padStart(2, "0")}`,
    summary: {
      achCycles:          totalAchCycles,
      achVolume:          totalAchVolume,
      activePrograms:     programs.filter(s => !["refunded","cancelled"].includes(s.status ?? "")).length,
      completedPrograms,
      estimatedBonuses,
    },
    programs:    programRows,
    ledger:      flatLedger,
  });
});

// ─── POST /api/autopay/statement/email — email statement to user ──────────────

router.post("/autopay/statement/email", async (req, res) => {
  const { userId, month: monthKey, email } = req.body as {
    userId: string;
    month:  string;  // YYYY-MM
    email:  string;
  };
  if (!userId || !email) return res.status(400).json({ error: "userId, email required" });

  // Re-fetch the statement data by calling our own logic (simplified)
  const statRes = await fetch(
    `http://localhost:${process.env.PORT}/api/autopay/statement?userId=${encodeURIComponent(userId)}&month=${encodeURIComponent(monthKey ?? "")}`,
  );
  const stat = (await statRes.json()) as Record<string, any>;

  const tmpl = monthlyStatementEmail({
    month:             stat.month as string,
    cycles:            stat.summary.achCycles as number,
    achVolume:         stat.summary.achVolume as number,
    estimatedBonuses:  stat.summary.estimatedBonuses as number,
    items:             (stat.ledger as any[]).map(e => ({
      date:   e.date,
      type:   `${e.type} — ${e.bankName}`,
      amount: e.type === "CC Charged" ? -(e.amount as number) : (e.amount as number),
      status: e.status,
    })),
  });

  const sent = await sendEmail({ to: email, subject: tmpl.subject, html: tmpl.html, text: tmpl.text });
  res.json({ success: sent, message: sent ? "Statement emailed" : "SMTP not configured — statement not sent" });
});

export default router;
