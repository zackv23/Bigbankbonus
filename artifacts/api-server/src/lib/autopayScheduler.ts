/**
 * Autopay Lifecycle Scheduler
 *
 * Polls every minute for due autopay actions and advances each schedule
 * through the 91-day program:
 *
 *   charged
 *     → (push at 9AM ET, next biz day) → ach_push_sent
 *     → (pull at 2PM ET, +2 biz days)  → ach_pull_settled
 *     → (repeat up to maxCycles OR endsAt)
 *     → (final refund, +48 h after last pull) → refunded
 *
 * ACH execution: uses Plaid Transfer API if PLAID_CLIENT_ID + plaidAccessToken
 * are present; otherwise operates in demo mode (status advances, no real money).
 *
 * Stripe is used ONLY for the initial collateral charge and final refund.
 * The CC→ACH cycle itself uses Plaid Transfer to avoid Stripe ToS issues.
 */

import { db, autopaySchedulesTable } from "@workspace/db";
import { and, lte, inArray, isNotNull, eq } from "drizzle-orm";
import {
  sendEmail,
  sendSMS,
  sendPushNotification,
  autopayChargedEmail,
  autopayRefundedEmail,
} from "./notifications";

const PLAID_CLIENT_ID = process.env.PLAID_CLIENT_ID;
const PLAID_SECRET    = process.env.PLAID_SECRET;
const PLAID_ENV       = (process.env.PLAID_ENV ?? "sandbox") as "sandbox" | "development" | "production";
const STRIPE_SECRET   = process.env.STRIPE_SECRET_KEY;

const PLAID_BASE = {
  sandbox:     "https://sandbox.plaid.com",
  development: "https://development.plaid.com",
  production:  "https://production.plaid.com",
} as const;

const TICK_MS      = 60_000;       // poll every 60 s
const ACTIVE_STATUSES = ["charged", "ach_push_sent", "ach_pull_sent", "ach_pull_settled"] as const;

let tickTimer: ReturnType<typeof setInterval> | null = null;
let ticking = false;

// ─── Date helpers ─────────────────────────────────────────────────────────────

function isWeekend(d: Date): boolean {
  const dow = d.getUTCDay(); // use UTC to stay consistent
  return dow === 0 || dow === 6;
}

function addBizDays(from: Date, n: number): Date {
  const d = new Date(from);
  let added = 0;
  while (added < n) {
    d.setUTCDate(d.getUTCDate() + 1);
    if (!isWeekend(d)) added++;
  }
  return d;
}

/**
 * Returns a UTC Date for the given business day at the specified Eastern hour.
 * Uses UTC offsets:  EST = UTC-5,  EDT = UTC-4.
 * Intl handles the DST boundary correctly.
 */
function bizDayAtEasternHour(bizDate: Date, etHour: number, etMinute = 0): Date {
  // Get the ISO date string in Eastern time (YYYY-MM-DD)
  const etDateStr = bizDate.toLocaleDateString("en-CA", { timeZone: "America/New_York" });
  const [year, month, day] = etDateStr.split("-").map(Number);

  // Build a candidate UTC timestamp (assume UTC-5 first, close enough for offset detection)
  const guess = new Date(Date.UTC(year, month - 1, day, etHour + 5, etMinute, 0, 0));

  // Determine the actual Eastern offset (minutes) at that moment via Intl
  const etParts = new Intl.DateTimeFormat("en-US", {
    timeZone: "America/New_York",
    hour: "2-digit", minute: "2-digit", hour12: false,
  }).formatToParts(guess);
  const pp = Object.fromEntries(etParts.map(p => [p.type, p.value]));
  const actualEtHour   = parseInt(pp.hour ?? "0", 10);
  const actualEtMinute = parseInt(pp.minute ?? "0", 10);

  // Shift by the difference
  const hourDiff   = etHour   - actualEtHour;
  const minuteDiff = etMinute - actualEtMinute;
  return new Date(guess.getTime() + (hourDiff * 60 + minuteDiff) * 60_000);
}

function nextBizDayAt9Am(from: Date): Date {
  let d = new Date(from);
  do { d.setUTCDate(d.getUTCDate() + 1); } while (isWeekend(d));
  return bizDayAtEasternHour(d, 9, 0);
}

function in2BizDaysAt2Pm(from: Date): Date {
  const d = addBizDays(from, 2);
  return bizDayAtEasternHour(d, 14, 0);
}

function in48Hours(from: Date): Date {
  return new Date(from.getTime() + 48 * 3600_000);
}

function fmtDate(d: Date | null | undefined): string {
  if (!d) return "—";
  return d.toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
}

// ─── Plaid Transfer helpers ───────────────────────────────────────────────────

async function plaidRequest(
  path: string,
  body: Record<string, unknown>,
): Promise<Record<string, unknown> | null> {
  if (!PLAID_CLIENT_ID || !PLAID_SECRET) return null;
  try {
    const res = await fetch(`${PLAID_BASE[PLAID_ENV]}${path}`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "PLAID-CLIENT-ID": PLAID_CLIENT_ID,
        "PLAID-SECRET": PLAID_SECRET,
      },
      body: JSON.stringify({ client_id: PLAID_CLIENT_ID, secret: PLAID_SECRET, ...body }),
    });
    return (await res.json()) as Record<string, unknown>;
  } catch (err) {
    console.error("[autopay] Plaid request failed:", err);
    return null;
  }
}

/**
 * Push funds TO the target bank account (ACH credit / DD-in simulation).
 * Returns a transfer_id or null on failure.
 */
async function plaidAchPush(opts: {
  accessToken: string;
  accountId: string;
  amountDollars: number;
  description: string;
}): Promise<string | null> {
  // 1. Authorization
  const auth = await plaidRequest("/transfer/authorization/create", {
    access_token: opts.accessToken,
    account_id:   opts.accountId,
    type:         "credit",
    network:      "ach",
    amount:       opts.amountDollars.toFixed(2),
    ach_class:    "ppd",
    user:         { legal_name: "BigBankBonus Automation" },
  });
  const authId = (auth as any)?.authorization?.id;
  if (!authId) {
    console.error("[autopay] ACH push auth failed:", auth);
    return null;
  }

  // 2. Transfer
  const transfer = await plaidRequest("/transfer/create", {
    access_token:       opts.accessToken,
    account_id:         opts.accountId,
    authorization_id:   authId,
    type:               "credit",
    network:            "ach",
    amount:             opts.amountDollars.toFixed(2),
    description:        opts.description.slice(0, 15),
    ach_class:          "ppd",
  });
  return (transfer as any)?.transfer?.id ?? null;
}

/**
 * Pull funds FROM the target bank account (ACH debit / DD-out simulation).
 * Returns a transfer_id or null on failure.
 */
async function plaidAchPull(opts: {
  accessToken: string;
  accountId: string;
  amountDollars: number;
  description: string;
}): Promise<string | null> {
  const auth = await plaidRequest("/transfer/authorization/create", {
    access_token: opts.accessToken,
    account_id:   opts.accountId,
    type:         "debit",
    network:      "ach",
    amount:       opts.amountDollars.toFixed(2),
    ach_class:    "ppd",
    user:         { legal_name: "BigBankBonus Automation" },
  });
  const authId = (auth as any)?.authorization?.id;
  if (!authId) {
    console.error("[autopay] ACH pull auth failed:", auth);
    return null;
  }
  const transfer = await plaidRequest("/transfer/create", {
    access_token:       opts.accessToken,
    account_id:         opts.accountId,
    authorization_id:   authId,
    type:               "debit",
    network:            "ach",
    amount:             opts.amountDollars.toFixed(2),
    description:        opts.description.slice(0, 15),
    ach_class:          "ppd",
  });
  return (transfer as any)?.transfer?.id ?? null;
}

// ─── Stripe refund helper ────────────────────────────────────────────────────

async function stripeRefund(paymentIntentId: string): Promise<string | null> {
  if (!STRIPE_SECRET) return null;
  try {
    const params = new URLSearchParams({ payment_intent: paymentIntentId });
    const res = await fetch("https://api.stripe.com/v1/refunds", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${STRIPE_SECRET}`,
        "Content-Type": "application/x-www-form-urlencoded",
      },
      body: params.toString(),
    });
    const data = (await res.json()) as Record<string, unknown>;
    return (data.id as string) ?? null;
  } catch (err) {
    console.error("[autopay] Stripe refund failed:", err);
    return null;
  }
}

// ─── Notification helpers ────────────────────────────────────────────────────

async function notify(schedule: Record<string, any>, subject: string, html: string, text: string) {
  const email = schedule.notifyEmail as string | null;
  const phone = schedule.notifyPhone as string | null;
  const push  = schedule.pushToken   as string | null;

  if (email) await sendEmail({ to: email, subject, html, text });
  if (phone) await sendSMS(phone, text);
  if (push)  await sendPushNotification({ to: push, title: subject, body: text, data: { type: "autopay_update" } });
}

// ─── Core tick ───────────────────────────────────────────────────────────────

async function runTick() {
  const now = new Date();

  const due = await db
    .select()
    .from(autopaySchedulesTable)
    .where(
      and(
        lte(autopaySchedulesTable.nextActionAt, now),
        isNotNull(autopaySchedulesTable.nextActionType),
        inArray(autopaySchedulesTable.status, [...ACTIVE_STATUSES]),
      ),
    );

  if (due.length === 0) return;
  console.log(`[autopay] Tick: ${due.length} schedule(s) due`);

  for (const s of due) {
    try {
      await processSchedule(s, now);
    } catch (err) {
      console.error(`[autopay] Error processing schedule #${s.id}:`, err);
      await db
        .update(autopaySchedulesTable)
        .set({ status: "failed", notes: String(err), updatedAt: now })
        .where(eq(autopaySchedulesTable.id, s.id as number));
    }
  }
}

async function processSchedule(s: Record<string, any>, now: Date) {
  const action = s.nextActionType as string;
  const isDemo = s.demo as boolean ?? true;
  const achAmt = (s.achAmount as number) ?? (s.leverageChargeAmount as number) ?? 1001;
  const bankName = (s.bankName as string) ?? "Bank";

  // ── PUSH ────────────────────────────────────────────────────────────────────
  if (action === "push") {
    console.log(`[autopay] #${s.id} PUSH $${achAmt} → ${bankName}`);

    let transferId: string | null = null;
    if (!isDemo && s.plaidAccessToken && s.plaidAccountId) {
      transferId = await plaidAchPush({
        accessToken:    s.plaidAccessToken as string,
        accountId:      s.plaidAccountId as string,
        amountDollars:  achAmt,
        description:    `BigBankBonus DD`,
      });
    } else {
      transferId = `demo_push_${Date.now()}`;
    }

    const nextAt       = in2BizDaysAt2Pm(now);
    const newCycleCount = (s.cycleCount as number) ?? 0;

    await db
      .update(autopaySchedulesTable)
      .set({
        status:              "ach_push_sent",
        stripeTransferOutId: transferId,
        ddOutDate:           now,
        ddInDate:            nextAt,
        nextActionAt:        nextAt,
        nextActionType:      "pull",
        updatedAt:           now,
      })
      .where(eq(autopaySchedulesTable.id, s.id));

    const tmpl = autopayChargedEmail({
      bankName,
      chargeAmount:  (s.chargeAmount as number) ?? 0,
      achAmount:     achAmt,
      ddOutDate:     fmtDate(now),
      ddInDate:      fmtDate(nextAt),
      cycleCount:    newCycleCount + 1,
      endsAt:        fmtDate(s.endsAt as Date),
    });
    await notify(s, `ACH push sent — ${bankName} cycle ${newCycleCount + 1}`, tmpl.html, tmpl.text);
    return;
  }

  // ── PULL ────────────────────────────────────────────────────────────────────
  if (action === "pull") {
    console.log(`[autopay] #${s.id} PULL $${achAmt} ← ${bankName}`);

    let transferId: string | null = null;
    if (!isDemo && s.plaidAccessToken && s.plaidAccountId) {
      transferId = await plaidAchPull({
        accessToken:   s.plaidAccessToken as string,
        accountId:     s.plaidAccountId  as string,
        amountDollars: achAmt,
        description:   `BigBankBonus Pull`,
      });
    } else {
      transferId = `demo_pull_${Date.now()}`;
    }

    const newCycleCount = ((s.cycleCount as number) ?? 0) + 1;
    const maxCycles     = (s.maxCycles as number) ?? 18;
    const endsAt        = s.endsAt ? new Date(s.endsAt as string) : new Date(now.getTime() + 91 * 86_400_000);
    const programDone   = newCycleCount >= maxCycles || now >= endsAt;

    if (programDone) {
      // Schedule final refund in 48 h
      await db
        .update(autopaySchedulesTable)
        .set({
          status:             "ach_pull_settled",
          stripeTransferInId: transferId,
          cycleCount:         newCycleCount,
          nextActionAt:       in48Hours(now),
          nextActionType:     "final_refund",
          updatedAt:          now,
        })
        .where(eq(autopaySchedulesTable.id, s.id));

      await notify(
        s,
        `Last ACH pull sent — ${bankName}`,
        `Your final ACH pull of $${achAmt} has been sent. CC refund scheduled in 48 hours.`,
        `BigBankBonus: Last ACH pull $${achAmt} sent. Refund in 48 hours.`,
      );
    } else {
      // Schedule next push on next business day at 9AM ET
      const nextPushAt = nextBizDayAt9Am(now);
      await db
        .update(autopaySchedulesTable)
        .set({
          status:             "ach_pull_settled",
          stripeTransferInId: transferId,
          cycleCount:         newCycleCount,
          nextActionAt:       nextPushAt,
          nextActionType:     "push",
          updatedAt:          now,
        })
        .where(eq(autopaySchedulesTable.id, s.id));

      await notify(
        s,
        `Cycle ${newCycleCount} complete — ${bankName}`,
        `ACH pull $${achAmt} returned. Next push scheduled ${fmtDate(nextPushAt)}.`,
        `BigBankBonus cycle ${newCycleCount} complete. Next push ${fmtDate(nextPushAt)}.`,
      );
    }
    return;
  }

  // ── FINAL REFUND ────────────────────────────────────────────────────────────
  if (action === "final_refund") {
    console.log(`[autopay] #${s.id} FINAL_REFUND — ${bankName}`);

    let refundId: string | null = null;
    if (!isDemo && s.stripeChargeId && STRIPE_SECRET) {
      refundId = await stripeRefund(s.stripeChargeId as string);
    } else {
      refundId = `demo_refund_${Date.now()}`;
    }

    await db
      .update(autopaySchedulesTable)
      .set({
        status:         "refunded",
        stripeRefundId: refundId,
        nextActionAt:   null,
        nextActionType: null,
        updatedAt:      now,
      })
      .where(eq(autopaySchedulesTable.id, s.id));

    const cycleCount   = (s.cycleCount as number) ?? 0;
    const achAmt2      = (s.achAmount as number) ?? 1001;
    const totalVolume  = cycleCount * achAmt2 * 2; // push + pull per cycle
    const tmpl = autopayRefundedEmail({
      bankName,
      chargeAmount:    (s.chargeAmount as number) ?? 0,
      totalCycles:     cycleCount,
      totalAchVolume:  totalVolume,
    });
    await notify(s, `91-day program complete — ${bankName} 🎉`, tmpl.html, tmpl.text);
    return;
  }

  console.warn(`[autopay] #${s.id} unknown nextActionType: ${action}`);
}

// ─── Public API ───────────────────────────────────────────────────────────────

export function startAutopayScheduler(): void {
  if (tickTimer) return;
  console.log("[autopay] Lifecycle scheduler started — tick every 60 s");
  tickTimer = setInterval(async () => {
    if (ticking) return;
    ticking = true;
    try { await runTick(); }
    catch (err) { console.error("[autopay] Tick error:", err); }
    finally { ticking = false; }
  }, TICK_MS);

  // Run once immediately (5 s after start to let DB settle)
  const controller = new AbortController();
  const handle = setTimeout(async () => {
    if (!controller.signal.aborted) {
      ticking = true;
      try { await runTick(); }
      catch { /* ignore startup errors */ }
      finally { ticking = false; }
    }
  }, 5_000);
  // Store handle for cleanup
  (tickTimer as any)._initHandle = handle;
}

export function stopAutopayScheduler(): void {
  if (tickTimer) {
    clearInterval(tickTimer);
    const h = (tickTimer as any)._initHandle;
    if (h) clearTimeout(h);
    tickTimer = null;
    console.log("[autopay] Lifecycle scheduler stopped");
  }
}

/** Manually trigger a tick (useful for testing / admin endpoints) */
export async function triggerAutopayTick(): Promise<void> {
  if (ticking) return;
  ticking = true;
  try { await runTick(); }
  finally { ticking = false; }
}
