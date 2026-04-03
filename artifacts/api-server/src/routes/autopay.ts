import { Router } from "express";
import { db, autopaySchedulesTable, plaidItemsTable } from "@workspace/db";
import { eq, desc, and, inArray } from "drizzle-orm";
import { triggerAutopayTick } from "../lib/autopayScheduler";

const router = Router();

const STRIPE_SECRET = process.env.STRIPE_SECRET_KEY;

// ─── Business-day helpers ─────────────────────────────────────────────────────
function isWeekend(d: Date): boolean {
  return d.getDay() === 0 || d.getDay() === 6;
}

function nextBusinessDay(from: Date = new Date()): Date {
  const d = new Date(from);
  do { d.setDate(d.getDate() + 1); } while (isWeekend(d));
  return d;
}

function addBusinessDays(from: Date, days: number): Date {
  const d = new Date(from);
  let added = 0;
  while (added < days) {
    d.setDate(d.getDate() + 1);
    if (!isWeekend(d)) added++;
  }
  return d;
}

// ─── Amount calculations ───────────────────────────────────────────────────────
function calcAmounts(bonusAmount: number) {
  const ddAmount = Math.ceil(bonusAmount / 3);          // base DD amount
  const chargeAmount = Math.ceil(ddAmount * 1.03);       // +3% service fee
  const achAmount = ddAmount + 1;                        // ACH push = DD amount + $1
  return { ddAmount, chargeAmount, achAmount };
}

// ─── Stripe helpers ───────────────────────────────────────────────────────────
async function stripeRequest(path: string, body?: Record<string, any>): Promise<Record<string, any> | null> {
  if (!STRIPE_SECRET) return null;
  const params = body
    ? new URLSearchParams(Object.entries(body).map(([k, v]) => [k, String(v)]))
    : undefined;
  const res = await fetch(`https://api.stripe.com/v1${path}`, {
    method: body ? "POST" : "GET",
    headers: {
      Authorization: `Bearer ${STRIPE_SECRET}`,
      "Content-Type": "application/x-www-form-urlencoded",
    },
    body: params,
  });
  return res.json() as Promise<Record<string, any>>;
}

// ─── POST /autopay/create ─────────────────────────────────────────────────────
router.post("/autopay/create", async (req, res) => {
  const {
    userId, bonusGuid, bankName, bonusAmount, offerLink, section,
    accountNumber, routingNumber,
    stripeCustomerId, stripePaymentMethodId,
  } = req.body as {
    userId: string;
    bonusGuid?: string;
    bankName?: string;
    bonusAmount: number;
    offerLink?: string;
    section?: string;
    accountNumber: string;
    routingNumber: string;
    stripeCustomerId?: string;
    stripePaymentMethodId?: string;
  };

  if (!userId || !bonusAmount || !accountNumber || !routingNumber) {
    return res.status(400).json({ error: "userId, bonusAmount, accountNumber, routingNumber required" });
  }

  const { ddAmount, chargeAmount, achAmount } = calcAmounts(bonusAmount);
  const accountLast4 = accountNumber.slice(-4);
  const now = new Date();
  const ddOutDate = nextBusinessDay(now);
  const ddInDate = addBusinessDays(ddOutDate, 5);
  const refundDate = addBusinessDays(ddInDate, 3);

  const MAX_CYCLES    = 18;
  const PROGRAM_DAYS  = 91;
  const endsAt        = new Date(now.getTime() + PROGRAM_DAYS * 86_400_000);
  // First push fires on the next business day at 9AM ET (approx 14:00 UTC)
  const firstPushAt   = new Date(nextBusinessDay(now));
  firstPushAt.setUTCHours(14, 0, 0, 0);

  const isDemo = !STRIPE_SECRET || stripePaymentMethodId === "demo";
  let stripeChargeId: string | null = null;
  let stripeBankTokenId: string | null = null;

  if (!isDemo) {
    // Tokenize bank account with Stripe
    const bankToken = await stripeRequest("/tokens", {
      "bank_account[country]": "US",
      "bank_account[currency]": "usd",
      "bank_account[account_holder_type]": "individual",
      "bank_account[routing_number]": routingNumber,
      "bank_account[account_number]": accountNumber,
    });
    if (bankToken?.error) {
      return res.status(400).json({ error: bankToken.error.message });
    }
    stripeBankTokenId = bankToken?.id ?? null;

    // Charge CC on file
    if (stripePaymentMethodId && stripeCustomerId) {
      const charge = await stripeRequest("/payment_intents", {
        amount: chargeAmount * 100,
        currency: "usd",
        customer: stripeCustomerId,
        payment_method: stripePaymentMethodId,
        confirm: "true",
        description: `BigBankBonus autopay — ${bankName ?? "Bank"} DD cycle`,
      });
      if (charge?.error) {
        return res.status(400).json({ error: charge.error.message });
      }
      stripeChargeId = charge?.id ?? null;
    }
  } else {
    stripeChargeId = `demo_charge_${Date.now()}`;
    stripeBankTokenId = `demo_bank_${Date.now()}`;
  }

  // ── Look up user's most-recently-linked Plaid item ──────────────────────────
  let plaidAccessToken: string | null = null;
  let plaidAccountId: string | null = null;
  try {
    const plaidItems = await db
      .select()
      .from(plaidItemsTable)
      .where(and(eq(plaidItemsTable.userId, userId), eq(plaidItemsTable.status, "active")))
      .orderBy(desc(plaidItemsTable.createdAt))
      .limit(1);

    if (plaidItems.length > 0) {
      const item = plaidItems[0];
      plaidAccessToken = item.accessToken ?? null;
      // Pick the first checking account; fall back to first account of any type
      const accounts = (item.accounts ?? []) as any[];
      const checking = accounts.find((a: any) => a.subtype === "checking") ?? accounts[0];
      plaidAccountId = checking?.account_id ?? null;
    }
  } catch { /* non-fatal — fall back to demo mode */ }

  const [schedule] = await db
    .insert(autopaySchedulesTable)
    .values({
      userId,
      bonusGuid,
      bankName,
      bonusAmount,
      offerLink,
      section,
      accountLast4,
      routingNumber,
      stripeBankTokenId,
      stripeCustomerId,
      stripePaymentMethodId,
      ddAmount,
      chargeAmount,
      achAmount,
      leverageChargeAmount: 1000,
      ddOutDate,
      ddInDate,
      refundDate,
      // 91-day lifecycle fields
      endsAt,
      maxCycles:      MAX_CYCLES,
      cycleCount:     0,
      nextActionAt:   firstPushAt,
      nextActionType: "push",
      status: isDemo ? "charged" : (stripeChargeId ? "charged" : "pending_charge"),
      stripeChargeId,
      demo: isDemo,
      // Plaid link — populated if user has a linked bank
      plaidAccessToken,
      plaidAccountId,
    })
    .returning();

  res.json({
    schedule,
    ddAmount, chargeAmount, achAmount, ddOutDate, ddInDate, refundDate,
    plaidLinked: !!(plaidAccessToken && plaidAccountId),
  });
});

// ─── GET /autopay?userId=... ──────────────────────────────────────────────────
router.get("/autopay", async (req, res) => {
  const userId = String(req.query.userId ?? "");
  if (!userId) return res.status(400).json({ error: "userId required" });

  const schedules = await db
    .select()
    .from(autopaySchedulesTable)
    .where(eq(autopaySchedulesTable.userId, userId))
    .orderBy(desc(autopaySchedulesTable.createdAt));

  res.json({ schedules });
});

// ─── DELETE /autopay/:id ──────────────────────────────────────────────────────
router.delete("/autopay/:id", async (req, res) => {
  const id = parseInt(req.params.id, 10);
  const { userId } = req.body as { userId: string };

  const [schedule] = await db
    .select()
    .from(autopaySchedulesTable)
    .where(eq(autopaySchedulesTable.id, id))
    .limit(1);

  if (!schedule || schedule.userId !== userId) {
    return res.status(404).json({ error: "Schedule not found" });
  }

  if (["ach_push_sent", "ach_push_settled", "ach_pull_sent"].includes(schedule.status)) {
    return res.status(400).json({ error: "Cannot cancel — ACH already in progress" });
  }

  // Refund CC if it was charged
  if (schedule.stripeChargeId && !schedule.demo && STRIPE_SECRET) {
    await stripeRequest("/refunds", {
      payment_intent: schedule.stripeChargeId,
    });
  }

  await db
    .update(autopaySchedulesTable)
    .set({ status: "cancelled", updatedAt: new Date() })
    .where(eq(autopaySchedulesTable.id, id));

  res.json({ success: true });
});

// ─── POST /autopay/:id/execute-push — trigger ACH push (admin/webhook) ────────
router.post("/autopay/:id/execute-push", async (req, res) => {
  const id = parseInt(req.params.id, 10);
  const [schedule] = await db
    .select()
    .from(autopaySchedulesTable)
    .where(eq(autopaySchedulesTable.id, id))
    .limit(1);

  if (!schedule) return res.status(404).json({ error: "Not found" });

  let transferOutId = schedule.stripeTransferOutId;

  if (!schedule.demo && STRIPE_SECRET && schedule.stripeCustomerId && schedule.stripeBankTokenId) {
    const transfer = await stripeRequest("/transfers", {
      amount: (schedule.achAmount ?? 0) * 100,
      currency: "usd",
      destination: schedule.stripeCustomerId,
      description: `DD cycle out — ${schedule.bankName}`,
    });
    transferOutId = transfer?.id ?? `demo_transfer_out_${Date.now()}`;
  } else {
    transferOutId = `demo_transfer_out_${Date.now()}`;
  }

  await db
    .update(autopaySchedulesTable)
    .set({ status: "ach_push_sent", stripeTransferOutId: transferOutId, updatedAt: new Date() })
    .where(eq(autopaySchedulesTable.id, id));

  res.json({ success: true, transferOutId });
});

// ─── PATCH /autopay/notify-prefs — sync email/phone/pushToken to active schedules
router.patch("/autopay/notify-prefs", async (req, res) => {
  const { userId, notifyEmail, notifyPhone, pushToken } = req.body as {
    userId: string;
    notifyEmail?: string | null;
    notifyPhone?: string | null;
    pushToken?: string | null;
  };
  if (!userId) return res.status(400).json({ error: "userId required" });

  const updates: Record<string, any> = { updatedAt: new Date() };
  if (notifyEmail  !== undefined) updates.notifyEmail  = notifyEmail  ?? null;
  if (notifyPhone  !== undefined) updates.notifyPhone  = notifyPhone  ?? null;
  if (pushToken    !== undefined) updates.pushToken    = pushToken    ?? null;

  await db
    .update(autopaySchedulesTable)
    .set(updates)
    .where(
      and(
        eq(autopaySchedulesTable.userId, userId),
        inArray(autopaySchedulesTable.status, [
          "charged", "ach_push_sent", "ach_push_settled",
          "ach_pull_sent", "ach_pull_settled",
        ]),
      ),
    );

  res.json({ success: true });
});

// ─── PATCH /autopay/link-plaid — attach Plaid to all active schedules for user
router.patch("/autopay/link-plaid", async (req, res) => {
  const { userId } = req.body as { userId: string };
  if (!userId) return res.status(400).json({ error: "userId required" });

  // Look up the user's most recent active Plaid item
  const plaidItems = await db
    .select()
    .from(plaidItemsTable)
    .where(and(eq(plaidItemsTable.userId, userId), eq(plaidItemsTable.status, "active")))
    .orderBy(desc(plaidItemsTable.createdAt))
    .limit(1);

  if (plaidItems.length === 0) {
    return res.status(404).json({ error: "No linked Plaid account found" });
  }

  const item = plaidItems[0];
  const accounts = (item.accounts ?? []) as any[];
  const checking  = accounts.find((a: any) => a.subtype === "checking") ?? accounts[0];
  const plaidAccountId = checking?.account_id ?? null;

  if (!plaidAccountId) {
    return res.status(400).json({ error: "No checking account found in Plaid item" });
  }

  await db
    .update(autopaySchedulesTable)
    .set({
      plaidAccessToken: item.accessToken,
      plaidAccountId,
      // If the schedule was in demo mode solely due to missing Plaid token,
      // keep demo flag as-is — user must explicitly confirm to go live.
      updatedAt: new Date(),
    })
    .where(
      and(
        eq(autopaySchedulesTable.userId, userId),
        inArray(autopaySchedulesTable.status, [
          "charged", "ach_push_sent", "ach_push_settled",
          "ach_pull_sent", "ach_pull_settled",
        ]),
      ),
    );

  res.json({
    success: true,
    institutionName: item.institutionName,
    accountMask: checking?.mask ?? "???",
    plaidAccountId,
  });
});

// ─── POST /autopay/tick — manually trigger lifecycle tick (dev/admin) ─────────
router.post("/autopay/tick", async (_req, res) => {
  try {
    await triggerAutopayTick();
    res.json({ success: true, message: "Tick executed" });
  } catch (err) {
    res.status(500).json({ error: String(err) });
  }
});

// ─── PATCH /autopay/:id/set-action — manually set nextActionAt for testing ────
router.patch("/autopay/:id/set-action", async (req, res) => {
  const id = parseInt(req.params.id, 10);
  const { nextActionType, minutesFromNow } = req.body as {
    nextActionType: "push" | "pull" | "final_refund";
    minutesFromNow?: number;
  };
  const nextActionAt = new Date(Date.now() + ((minutesFromNow ?? 0) * 60_000));
  await db
    .update(autopaySchedulesTable)
    .set({ nextActionAt, nextActionType, updatedAt: new Date() })
    .where(eq(autopaySchedulesTable.id, id));
  res.json({ success: true, nextActionAt, nextActionType });
});

// ─── GET /autopay/amounts?bonusAmount=... — calculate amounts ─────────────────
router.get("/autopay/amounts", (req, res) => {
  const bonusAmount = parseInt(String(req.query.bonusAmount ?? "0"), 10);
  if (!bonusAmount) return res.status(400).json({ error: "bonusAmount required" });
  const amounts = calcAmounts(bonusAmount);
  const now = new Date();
  const ddOutDate = nextBusinessDay(now);
  const ddInDate = addBusinessDays(ddOutDate, 5);
  const refundDate = addBusinessDays(ddInDate, 3);
  res.json({ ...amounts, ddOutDate, ddInDate, refundDate });
});

export default router;
