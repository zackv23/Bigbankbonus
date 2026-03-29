import { Router } from "express";
import { PlaidApi, PlaidEnvironments, Configuration, Products, CountryCode } from "plaid";
import { db, plaidItemsTable } from "@workspace/db";
import { eq, desc } from "drizzle-orm";

const router = Router();

const PLAID_CLIENT_ID = process.env.PLAID_CLIENT_ID;
const PLAID_SECRET = process.env.PLAID_SECRET;
const PLAID_ENV = (process.env.PLAID_ENV ?? "sandbox") as "sandbox" | "development" | "production";

function getPlaidClient(): PlaidApi | null {
  if (!PLAID_CLIENT_ID || !PLAID_SECRET) return null;
  const config = new Configuration({
    basePath: PlaidEnvironments[PLAID_ENV],
    baseOptions: {
      headers: {
        "PLAID-CLIENT-ID": PLAID_CLIENT_ID,
        "PLAID-SECRET": PLAID_SECRET,
      },
    },
  });
  return new PlaidApi(config);
}

// POST /plaid/link-token — create a Link token for the frontend to open Plaid Link
router.post("/plaid/link-token", async (req, res) => {
  const client = getPlaidClient();
  if (!client) {
    return res.status(503).json({
      error: "Plaid not configured",
      message: "Set PLAID_CLIENT_ID, PLAID_SECRET, and PLAID_ENV environment variables.",
      sandbox: true,
      // Return mock token for sandbox demo when keys aren't set
      link_token: "link-sandbox-demo-token",
    });
  }
  const userId = (req.body as any).userId ?? "demo-user";
  try {
    const response = await client.linkTokenCreate({
      user: { client_user_id: String(userId) },
      client_name: "BigBankBonus",
      products: [Products.Auth, Products.Transactions],
      country_codes: [CountryCode.Us],
      language: "en",
      redirect_uri: undefined,
    });
    res.json({ link_token: response.data.link_token });
  } catch (err: any) {
    res.status(500).json({ error: err.message ?? "Failed to create link token" });
  }
});

// POST /plaid/exchange-token — exchange public token for access token and store
router.post("/plaid/exchange-token", async (req, res) => {
  const client = getPlaidClient();
  const { publicToken, userId, metadata } = req.body as {
    publicToken: string;
    userId: string;
    metadata?: { institution?: { institution_id: string; name: string }; accounts: any[] };
  };

  if (!client || publicToken === "demo-public-token") {
    // Sandbox / demo mode — create a fake item
    const demoItem = {
      userId: String(userId ?? "demo"),
      itemId: `demo-item-${Date.now()}`,
      accessToken: `demo-access-token-${Date.now()}`,
      institutionId: metadata?.institution?.institution_id ?? "ins_0",
      institutionName: metadata?.institution?.name ?? "Demo Bank",
      accounts: metadata?.accounts ?? [
        {
          account_id: "demo-acct-checking",
          name: "Checking",
          type: "depository",
          subtype: "checking",
          balances: { available: 2500, current: 2500, iso_currency_code: "USD" },
          mask: "0001",
        },
        {
          account_id: "demo-acct-savings",
          name: "Savings",
          type: "depository",
          subtype: "savings",
          balances: { available: 10000, current: 10000, iso_currency_code: "USD" },
          mask: "0002",
        },
      ],
      status: "active",
    };
    await db
      .insert(plaidItemsTable)
      .values(demoItem)
      .onConflictDoUpdate({
        target: plaidItemsTable.itemId,
        set: { updatedAt: new Date() },
      });
    return res.json({ success: true, item: demoItem });
  }

  try {
    const exchangeRes = await client.itemPublicTokenExchange({ public_token: publicToken });
    const { access_token, item_id } = exchangeRes.data;

    // Fetch institution info
    let institutionName = metadata?.institution?.name ?? "Unknown Bank";
    let institutionId = metadata?.institution?.institution_id ?? "";
    if (institutionId) {
      try {
        const instRes = await client.institutionsGetById({
          institution_id: institutionId,
          country_codes: [CountryCode.Us],
        });
        institutionName = instRes.data.institution.name;
      } catch {}
    }

    // Fetch accounts
    const acctsRes = await client.accountsGet({ access_token });
    const accounts = acctsRes.data.accounts;

    const item = {
      userId: String(userId),
      itemId: item_id,
      accessToken: access_token,
      institutionId,
      institutionName,
      accounts,
      status: "active",
    };

    await db
      .insert(plaidItemsTable)
      .values(item)
      .onConflictDoUpdate({
        target: plaidItemsTable.itemId,
        set: {
          accessToken: access_token,
          accounts,
          institutionName,
          updatedAt: new Date(),
        },
      });

    res.json({ success: true, item });
  } catch (err: any) {
    res.status(500).json({ error: err.message ?? "Token exchange failed" });
  }
});

// GET /plaid/items?userId=... — list linked bank items for a user
router.get("/plaid/items", async (req, res) => {
  const userId = String(req.query.userId ?? "");
  if (!userId) return res.status(400).json({ error: "userId required" });
  const items = await db
    .select()
    .from(plaidItemsTable)
    .where(eq(plaidItemsTable.userId, userId))
    .orderBy(desc(plaidItemsTable.createdAt));
  res.json({ items });
});

// GET /plaid/balance?userId=...&itemId=... — get real-time balances
router.get("/plaid/balance", async (req, res) => {
  const { userId, itemId } = req.query as { userId: string; itemId: string };
  if (!userId || !itemId) return res.status(400).json({ error: "userId and itemId required" });

  const [item] = await db
    .select()
    .from(plaidItemsTable)
    .where(eq(plaidItemsTable.itemId, itemId))
    .limit(1);

  if (!item || item.userId !== userId) return res.status(404).json({ error: "Item not found" });

  const client = getPlaidClient();
  if (!client || item.accessToken.startsWith("demo-")) {
    return res.json({
      accounts: item.accounts ?? [],
      institutionName: item.institutionName,
      demo: true,
    });
  }

  try {
    const balanceRes = await client.accountsBalanceGet({ access_token: item.accessToken });
    res.json({
      accounts: balanceRes.data.accounts,
      institutionName: item.institutionName,
    });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// GET /plaid/transactions?userId=...&itemId=... — get transactions (for bonus tracking)
router.get("/plaid/transactions", async (req, res) => {
  const { userId, itemId } = req.query as { userId: string; itemId: string };
  if (!userId || !itemId) return res.status(400).json({ error: "userId and itemId required" });

  const [item] = await db
    .select()
    .from(plaidItemsTable)
    .where(eq(plaidItemsTable.itemId, itemId))
    .limit(1);

  if (!item || item.userId !== userId) return res.status(404).json({ error: "Item not found" });

  const client = getPlaidClient();
  if (!client || item.accessToken.startsWith("demo-")) {
    const now = new Date();
    const demo: any[] = [
      {
        transaction_id: "tx-001",
        account_id: "demo-acct-checking",
        name: "Direct Deposit - Employer",
        amount: -2500,
        date: new Date(now.getTime() - 7 * 86400000).toISOString().split("T")[0],
        category: ["Payroll", "Direct Deposit"],
        payment_channel: "other",
      },
      {
        transaction_id: "tx-002",
        account_id: "demo-acct-checking",
        name: "Bank Bonus Credit",
        amount: -300,
        date: new Date(now.getTime() - 2 * 86400000).toISOString().split("T")[0],
        category: ["Transfer", "Credit"],
        payment_channel: "other",
      },
      {
        transaction_id: "tx-003",
        account_id: "demo-acct-checking",
        name: "Amazon Purchase",
        amount: 89.99,
        date: new Date(now.getTime() - 1 * 86400000).toISOString().split("T")[0],
        category: ["Shopping", "Online"],
        payment_channel: "online",
      },
    ];
    return res.json({ transactions: demo, demo: true });
  }

  try {
    const endDate = new Date().toISOString().split("T")[0];
    const startDate = new Date(Date.now() - 90 * 86400000).toISOString().split("T")[0];
    const txRes = await client.transactionsGet({
      access_token: item.accessToken,
      start_date: startDate,
      end_date: endDate,
      options: { count: 100 },
    });
    res.json({ transactions: txRes.data.transactions });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// DELETE /plaid/items/:itemId — unlink a bank
router.delete("/plaid/items/:itemId", async (req, res) => {
  const { userId } = req.body as { userId: string };
  const { itemId } = req.params;

  const [item] = await db
    .select()
    .from(plaidItemsTable)
    .where(eq(plaidItemsTable.itemId, itemId))
    .limit(1);

  if (!item || item.userId !== userId) return res.status(404).json({ error: "Item not found" });

  const client = getPlaidClient();
  if (client && !item.accessToken.startsWith("demo-")) {
    try {
      await client.itemRemove({ access_token: item.accessToken });
    } catch {}
  }

  await db
    .update(plaidItemsTable)
    .set({ status: "removed" })
    .where(eq(plaidItemsTable.itemId, itemId));

  res.json({ success: true });
});

export default router;
