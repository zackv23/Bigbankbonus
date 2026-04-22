import { Router, type Request, type Response } from "express";
import { db, salesRepsTable, leadsTable, commissionsTable, subscriptionsTable, userAccountsTable, depositOrdersTable } from "@workspace/db";
import { eq, desc } from "drizzle-orm";

const router = Router();

function requireAdmin(req: Request, res: Response): boolean {
  const adminSecret = req.headers["x-admin-secret"];
  if (!process.env.ADMIN_SECRET) {
    res.status(403).json({ error: "Admin access not configured" });
    return false;
  }
  if (adminSecret !== process.env.ADMIN_SECRET) {
    res.status(403).json({ error: "Forbidden" });
    return false;
  }
  return true;
}

// ─── Owner Dashboard Stats ───────────────────────────────────────────────────

router.get("/owner/stats", async (req: Request, res: Response): Promise<void> => {
  if (!requireAdmin(req, res)) return;

  try {
    const allReps = await db.select().from(salesRepsTable);
    const allLeads = await db.select().from(leadsTable);
    const allCommissions = await db.select().from(commissionsTable);
    const allSubs = await db.select().from(subscriptionsTable);
    const allAccounts = await db.select().from(userAccountsTable);

    const activeReps = allReps.filter(r => r.status === "active").length;
    const totalLeads = allLeads.length;
    const convertedLeads = allLeads.filter(l => l.stage === "converted").length;
    const totalCommissions = allCommissions.reduce((s, c) => s + parseFloat(c.amount), 0);
    const pendingCommissions = allCommissions.filter(c => c.status === "pending").reduce((s, c) => s + parseFloat(c.amount), 0);

    const activeSubs = allSubs.filter(s => s.status === "active" && s.plan !== "free").length;
    const monthlyRevenue = allSubs.filter(s => s.status === "active" && s.plan === "monthly").length * 6;
    const annualRevenue = allSubs.filter(s => s.status === "active" && s.plan === "annual").length * 72;
    const mrr = monthlyRevenue + (annualRevenue / 12);

    const pendingApprovals = allAccounts.filter(a => a.approvalStatus === "pending").length;
    const approvedAccounts = allAccounts.filter(a => a.approvalStatus === "approved").length;

    res.json({
      reps: { total: allReps.length, active: activeReps },
      leads: { total: totalLeads, converted: convertedLeads, conversionRate: totalLeads > 0 ? ((convertedLeads / totalLeads) * 100).toFixed(1) : "0" },
      commissions: { total: totalCommissions, pending: pendingCommissions },
      revenue: { activeSubs, mrr: parseFloat(mrr.toFixed(2)), monthlyRevenue, annualRevenue },
      accounts: { pendingApprovals, approved: approvedAccounts, total: allAccounts.length },
    });
  } catch (e: any) {
    res.status(500).json({ error: e?.message ?? "Failed to fetch stats" });
  }
});

// ─── All Sales Reps ──────────────────────────────────────────────────────────

router.get("/owner/reps", async (req: Request, res: Response): Promise<void> => {
  if (!requireAdmin(req, res)) return;

  try {
    const reps = await db.select().from(salesRepsTable).orderBy(desc(salesRepsTable.createdAt));

    const repsWithStats = await Promise.all(reps.map(async (rep) => {
      const leads = await db.select().from(leadsTable).where(eq(leadsTable.repId, rep.id));
      const comms = await db.select().from(commissionsTable).where(eq(commissionsTable.repId, rep.id));
      return {
        ...rep,
        leadCount: leads.length,
        convertedCount: leads.filter(l => l.stage === "converted").length,
        totalCommissions: comms.reduce((s, c) => s + parseFloat(c.amount), 0),
        pendingCommissions: comms.filter(c => c.status === "pending").reduce((s, c) => s + parseFloat(c.amount), 0),
      };
    }));

    res.json({ reps: repsWithStats });
  } catch (e: any) {
    res.status(500).json({ error: e?.message ?? "Failed to fetch reps" });
  }
});

// ─── All Subscriptions ───────────────────────────────────────────────────────

router.get("/owner/subscriptions", async (req: Request, res: Response): Promise<void> => {
  if (!requireAdmin(req, res)) return;

  try {
    const subs = await db.select().from(subscriptionsTable).orderBy(desc(subscriptionsTable.createdAt));
    res.json({ subscriptions: subs });
  } catch (e: any) {
    res.status(500).json({ error: e?.message ?? "Failed to fetch subscriptions" });
  }
});

// ─── All Deposit Orders ──────────────────────────────────────────────────────

router.get("/owner/deposits", async (req: Request, res: Response): Promise<void> => {
  if (!requireAdmin(req, res)) return;

  try {
    const deposits = await db.select().from(depositOrdersTable).orderBy(desc(depositOrdersTable.createdAt));
    res.json({ deposits });
  } catch (e: any) {
    res.status(500).json({ error: e?.message ?? "Failed to fetch deposits" });
  }
});

// ─── Commission Management ───────────────────────────────────────────────────

router.get("/owner/commissions", async (req: Request, res: Response): Promise<void> => {
  if (!requireAdmin(req, res)) return;

  try {
    const comms = await db.select().from(commissionsTable).orderBy(desc(commissionsTable.createdAt));
    res.json({ commissions: comms });
  } catch (e: any) {
    res.status(500).json({ error: e?.message ?? "Failed to fetch commissions" });
  }
});

router.patch("/owner/commissions/:id", async (req: Request, res: Response): Promise<void> => {
  if (!requireAdmin(req, res)) return;

  try {
    const commId = parseInt(String(req.params.id), 10);
    const { status } = req.body;
    if (!["pending", "paid", "cancelled"].includes(status)) {
      res.status(400).json({ error: "status must be pending, paid, or cancelled" });
      return;
    }

    const updates: Record<string, any> = { status };
    if (status === "paid") updates.paidAt = new Date();

    const [updated] = await db.update(commissionsTable).set(updates)
      .where(eq(commissionsTable.id, commId))
      .returning();

    if (!updated) { res.status(404).json({ error: "Commission not found" }); return; }
    res.json({ commission: updated });
  } catch (e: any) {
    res.status(500).json({ error: e?.message ?? "Failed to update commission" });
  }
});

// ─── Create Sales Rep ────────────────────────────────────────────────────────

router.post("/owner/reps", async (req: Request, res: Response): Promise<void> => {
  if (!requireAdmin(req, res)) return;

  try {
    const { userId, name, email, phone, commissionRate } = req.body;
    if (!userId || !name || !email) { res.status(400).json({ error: "userId, name, email required" }); return; }

    const [rep] = await db.insert(salesRepsTable).values({
      userId, name, email, phone,
      commissionRate: commissionRate ?? "10.00",
    }).returning();

    res.status(201).json({ rep });
  } catch (e: any) {
    res.status(500).json({ error: e?.message ?? "Failed to create rep" });
  }
});

export default router;
