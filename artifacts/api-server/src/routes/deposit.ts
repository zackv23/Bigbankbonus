import { Router } from "express";
import {
  db,
  depositOrdersTable,
  plaidItemsTable,
  subscriptionsTable,
} from "@workspace/db";
import { and, desc, eq } from "drizzle-orm";
import {
  PlaidTransferError,
  authorizePlaidTransfer,
  createPlaidTransfer,
  defaultTransferLegalName,
  formatUsdFromCents,
  getPlaidTransfer,
  inferTransferStatus,
  isPlaidTransferEnabled,
} from "../lib/plaidTransfer";

const router = Router();
const STRIPE_SECRET = process.env.STRIPE_SECRET_KEY;

// ─── State tax rates (approximate, simplified) ────────────────────────────────
const STATE_TAX_RATES: Record<string, number> = {
  AL: 0.04, AK: 0.00, AZ: 0.056, AR: 0.065, CA: 0.0725, CO: 0.029,
  CT: 0.0635, DE: 0.00, FL: 0.06, GA: 0.04, HI: 0.04, ID: 0.06,
  IL: 0.0625, IN: 0.07, IA: 0.06, KS: 0.065, KY: 0.06, LA: 0.0445,
  ME: 0.055, MD: 0.06, MA: 0.0625, MI: 0.06, MN: 0.06875, MS: 0.07,
  MO: 0.04225, MT: 0.00, NE: 0.055, NV: 0.0685, NH: 0.00, NJ: 0.06625,
  NM: 0.05125, NY: 0.04, NC: 0.0475, ND: 0.05, OH: 0.0575, OK: 0.045,
  OR: 0.00, PA: 0.06, RI: 0.07, SC: 0.06, SD: 0.045, TN: 0.07,
  TX: 0.0625, UT: 0.0485, VT: 0.06, VA: 0.053, WA: 0.065, WV: 0.06,
  WI: 0.05, WY: 0.04,
};

// ─── Fee calculator ───────────────────────────────────────────────────────────
function calcDepositFees(userState?: string) {
  const depositAmount = 50000;  // $500.00 in cents
  const serviceFee = 9900;      // $99.00 in cents

  const taxRate = userState ? (STATE_TAX_RATES[userState.toUpperCase()] ?? 0) : 0;
  // Tax is typically on the service fee portion only (not on the deposit itself)
  const taxAmount = Math.round(serviceFee * taxRate);

  const subtotal = depositAmount + serviceFee + taxAmount;
  // Stripe processing fee: 2.9% + $0.30 (30 cents)
  const stripeFee = Math.round(subtotal * 0.029) + 30;

  const totalCharged = subtotal + stripeFee;

  return {
    depositAmount,
    serviceFee,
    taxAmount,
    taxRate,
    stripeFee,
    totalCharged,
    achAmount: depositAmount, // exactly $500 sent via ACH
  };
}

// ─── Next Monday date helper ───────────────────────────────────────────────────
function nextMonday(from: Date = new Date()): Date {
  const d = new Date(from);
  // 0=Sun, 1=Mon, ... 6=Sat
  const day = d.getDay();
  const daysUntilMonday = day === 0 ? 1 : 8 - day;
  d.setDate(d.getDate() + daysUntilMonday);
  d.setHours(9, 0, 0, 0); // 9 AM for ACH processing
  return d;
}

// ─── Stripe helper ────────────────────────────────────────────────────────────
async function stripeRequest(path: string, body?: Record<string, any>): Promise<Record<string, any>> {
  if (!STRIPE_SECRET) return { demo: true };
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

// ─── GET /deposit/calculate — return itemized fee breakdown ──────────────────
router.get("/deposit/calculate", (req, res) => {
  const userState = String(req.query.state ?? "");
  const fees = calcDepositFees(userState || undefined);
  res.json({
    ...fees,
    breakdown: {
      deposit: fees.depositAmount,
      serviceFee: fees.serviceFee,
      tax: fees.taxAmount,
      stripeFee: fees.stripeFee,
      total: fees.totalCharged,
    },
    achScheduledDate: nextMonday().toISOString(),
  });
});

// ─── POST /deposit/initiate — charge CC + schedule ACH for next Monday ────────
router.post("/deposit/initiate", async (req, res) => {
  const {
    userId,
    accountNumber,
    routingNumber,
    userState,
    stripeCustomerId,
    stripePaymentMethodId,
    stackedOffersCount,
    stackedOffersTotal,
  } = req.body as {
    userId: string;
    accountNumber: string;
    routingNumber: string;
    userState?: string;
    stripeCustomerId?: string;
    stripePaymentMethodId?: string;
    stackedOffersCount?: number;
    stackedOffersTotal?: number;
  };

  if (!userId || !accountNumber || !routingNumber) {
    return res.status(400).json({ error: "userId, accountNumber, routingNumber required" });
  }

  // Validate account/routing numbers
  if (routingNumber.length !== 9) {
    return res.status(400).json({ error: "Routing number must be 9 digits" });
  }

  // Check for existing active deposit (one per approved user)
  const existingDeposits = await db
    .select()
    .from(depositOrdersTable)
    .where(eq(depositOrdersTable.userId, userId));

  const activeDeposit = existingDeposits.find(d =>
    !["failed", "cancelled"].includes(d.status ?? "")
  );

  if (activeDeposit) {
    return res.status(400).json({
      error: "You already have an active deposit. Only one deposit per account is allowed.",
      existingDepositId: activeDeposit.id,
    });
  }

  const fees = calcDepositFees(userState);
  const accountLast4 = accountNumber.slice(-4);
  const achScheduledDate = nextMonday();

  const isDemo = !STRIPE_SECRET || stripePaymentMethodId === "demo";
  let stripePaymentIntentId: string | null = null;

  if (!isDemo && stripePaymentMethodId && stripeCustomerId) {
    // Charge the credit card for the full amount
    const paymentIntent = await stripeRequest("/payment_intents", {
      amount: fees.totalCharged,
      currency: "usd",
      customer: stripeCustomerId,
      payment_method: stripePaymentMethodId,
      confirm: "true",
      description: `BigBankBonus $500 Deposit & Earn — scheduled ACH ${achScheduledDate.toDateString()}`,
      "metadata[userId]": userId,
      "metadata[deposit_type]": "deposit_and_earn",
      "metadata[ach_scheduled_date]": achScheduledDate.toISOString(),
    });

    if (paymentIntent?.error) {
      return res.status(400).json({ error: paymentIntent.error.message });
    }
    stripePaymentIntentId = paymentIntent?.id ?? null;
  } else {
    stripePaymentIntentId = `demo_pi_${Date.now()}`;
  }

  const [order] = await db
    .insert(depositOrdersTable)
    .values({
      userId,
      depositAmount: fees.depositAmount,
      serviceFee: fees.serviceFee,
      taxAmount: fees.taxAmount,
      stripeFee: fees.stripeFee,
      totalCharged: fees.totalCharged,
      userState: userState ?? null,
      accountLast4,
      routingNumber,
      stripeCustomerId: stripeCustomerId ?? null,
      stripePaymentMethodId: stripePaymentMethodId ?? null,
      stripePaymentIntentId,
      achScheduledDate,
      achAmount: fees.achAmount,
      status: isDemo ? "charged" : (stripePaymentIntentId ? "charged" : "pending_charge"),
      stackedOffersCount: stackedOffersCount ?? null,
      stackedOffersTotal: stackedOffersTotal ?? null,
      demo: isDemo,
    })
    .returning();

  return res.json({
    order,
    fees,
    achScheduledDate: achScheduledDate.toISOString(),
    message: isDemo
      ? "Demo deposit created. In production, $500 ACH will be sent on the scheduled Monday."
      : `Deposit recorded. $500 ACH transfer scheduled for ${achScheduledDate.toDateString()}.`,
  });
});

// ─── GET /deposit/:id/status — get ACH transfer status ───────────────────────
router.get("/deposit/:id/status", async (req, res) => {
  const id = parseInt(req.params.id, 10);
  if (isNaN(id)) return res.status(400).json({ error: "Invalid deposit id" });

  const [order] = await db
    .select()
    .from(depositOrdersTable)
    .where(eq(depositOrdersTable.id, id))
    .limit(1);

  if (!order) return res.status(404).json({ error: "Deposit not found" });
  const orderWithPlaid = order as typeof order & {
    plaidTransferId?: string | null;
    plaidTransferStatus?: string | null;
  };

  // If live Stripe transfer exists, refresh status
  let stripeTransferStatus: string | null = null;
  let plaidTransferStatus: string | null = orderWithPlaid.plaidTransferStatus ?? null;
  if (order.stripeTransferId && !order.demo && STRIPE_SECRET) {
    const transfer = await stripeRequest(`/transfers/${order.stripeTransferId}`);
    stripeTransferStatus = transfer?.status ?? null;

    // Update to confirmed if Stripe says so
    if (transfer?.status === "paid" && order.status === "ach_sent") {
      await db
        .update(depositOrdersTable)
        .set({ status: "ach_confirmed", updatedAt: new Date() })
        .where(eq(depositOrdersTable.id, id));
      order.status = "ach_confirmed";
    }
  }

  if (orderWithPlaid.plaidTransferId && !order.demo && isPlaidTransferEnabled()) {
    try {
      const transfer = await getPlaidTransfer(orderWithPlaid.plaidTransferId);
      plaidTransferStatus = inferTransferStatus(transfer);

      await db
        .update(depositOrdersTable)
        .set({
          plaidTransferStatus,
          status:
            plaidTransferStatus === "posted"
              ? "ach_confirmed"
              : order.status,
          updatedAt: new Date(),
        } as any)
        .where(eq(depositOrdersTable.id, id));

      if (plaidTransferStatus === "posted") {
        order.status = "ach_confirmed";
      }
    } catch {}
  }

  return res.json({
    id: order.id,
    status: order.status,
    stripeTransferStatus,
    plaidTransferStatus,
    achScheduledDate: order.achScheduledDate,
    achAmount: order.achAmount,
    depositAmount: order.depositAmount,
    serviceFee: order.serviceFee,
    taxAmount: order.taxAmount,
    stripeFee: order.stripeFee,
    totalCharged: order.totalCharged,
    accountLast4: order.accountLast4,
    createdAt: order.createdAt,
    updatedAt: order.updatedAt,
  });
});

// ─── GET /deposit?userId=... — list user's deposits ──────────────────────────
router.get("/deposit", async (req, res) => {
  const userId = String(req.query.userId ?? "");
  if (!userId) return res.status(400).json({ error: "userId required" });

  const orders = await db
    .select()
    .from(depositOrdersTable)
    .where(eq(depositOrdersTable.userId, userId));

  return res.json({ orders });
});

// ─── POST /deposit/:id/execute-ach — admin/scheduler trigger ─────────────────
router.post("/deposit/:id/execute-ach", async (req, res) => {
  const id = parseInt(req.params.id, 10);

  const [order] = await db
    .select()
    .from(depositOrdersTable)
    .where(eq(depositOrdersTable.id, id))
    .limit(1);

  if (!order) return res.status(404).json({ error: "Not found" });
  if (order.status !== "charged") {
    return res.status(400).json({ error: `Cannot execute ACH — current status: ${order.status}` });
  }

  let transferId = `demo_transfer_${Date.now()}`;

  if (!order.demo) {
    if (!isPlaidTransferEnabled()) {
      return res.status(503).json({
        error: "Plaid Transfer is not configured.",
        detail:
          "Set PLAID_CLIENT_ID, PLAID_SECRET, and PLAID_ENV, and make sure your Plaid account has Transfer product access enabled.",
      });
    }

    const plaidItems = await db
      .select()
      .from(plaidItemsTable)
      .where(and(eq(plaidItemsTable.userId, order.userId), eq(plaidItemsTable.status, "active")))
      .orderBy(desc(plaidItemsTable.createdAt));

    let matchedItem:
      | {
          accessToken: string;
          accountId: string;
        }
      | undefined;

    for (const item of plaidItems) {
      const accounts = (item.accounts ?? []) as Array<{
        account_id?: string;
        subtype?: string;
        mask?: string;
      }>;
      const account =
        accounts.find((candidate) => candidate.mask === order.accountLast4) ??
        accounts.find((candidate) => candidate.subtype === "checking" && candidate.account_id);

      if (item.accessToken && account?.account_id) {
        matchedItem = {
          accessToken: item.accessToken,
          accountId: account.account_id,
        };
        if (account.mask === order.accountLast4) break;
      }
    }

    if (!matchedItem) {
      return res.status(400).json({
        error: "No Plaid-linked destination account is available for this deposit.",
        detail:
          "Link the destination bank account with Plaid first. The linked account should match the target account's last 4 digits so ACH can be automated safely.",
      });
    }

    const [subscription] = await db
      .select()
      .from(subscriptionsTable)
      .where(eq(subscriptionsTable.userId, order.userId))
      .limit(1);

    try {
      const authorization = await authorizePlaidTransfer({
        accessToken: matchedItem.accessToken,
        accountId: matchedItem.accountId,
        amount: formatUsdFromCents(order.achAmount),
        type: "credit",
        legalName: defaultTransferLegalName(order.userId),
        emailAddress: subscription?.billingEmail ?? undefined,
        userId: order.userId,
      });

      const transfer = await createPlaidTransfer({
        accessToken: matchedItem.accessToken,
        accountId: matchedItem.accountId,
        authorizationId: authorization.id,
        amount: formatUsdFromCents(order.achAmount),
        type: "credit",
        description: `BBB deposit ${order.accountLast4}`,
        userId: order.userId,
      });

      await db
        .update(depositOrdersTable)
        .set({
          status: "ach_sent",
          plaidAuthorizationId: authorization.id,
          plaidTransferId: transfer.id,
          plaidTransferStatus: inferTransferStatus(transfer),
          updatedAt: new Date(),
        } as any)
        .where(eq(depositOrdersTable.id, id));

      return res.json({
        success: true,
        transferId: transfer.id,
        provider: "plaid_transfer",
        status: "ach_sent",
        plaidTransferStatus: inferTransferStatus(transfer),
      });
    } catch (error) {
      const message =
        error instanceof PlaidTransferError
          ? error.message
          : error instanceof Error
            ? error.message
            : "Failed to create Plaid Transfer ACH credit.";
      return res.status(error instanceof PlaidTransferError ? error.statusCode ?? 500 : 500).json({
        error: message,
      });
    }
  }

  await db
    .update(depositOrdersTable)
    .set({ status: "ach_sent", stripeTransferId: transferId, updatedAt: new Date() })
    .where(eq(depositOrdersTable.id, id));

  return res.json({ success: true, transferId, status: "ach_sent" });
});

export default router;
