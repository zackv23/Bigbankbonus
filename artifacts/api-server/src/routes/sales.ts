import { Router, type Request, type Response } from "express";
import { db, salesRepsTable, leadsTable, clientNotesTable, commissionsTable } from "@workspace/db";
import { eq, desc, and } from "drizzle-orm";


const router = Router();

function getRepUserId(req: Request): string | null {
  const auth = req.headers.authorization;
  if (!auth?.startsWith("Bearer ")) return null;
  return auth.slice(7);
}

// ─── Sales Rep Profile ───────────────────────────────────────────────────────

router.get("/sales/profile", async (req: Request, res: Response): Promise<void> => {
  const userId = getRepUserId(req);
  if (!userId) { res.status(401).json({ error: "Unauthorized" }); return; }

  try {
    const [rep] = await db.select().from(salesRepsTable).where(eq(salesRepsTable.userId, userId)).limit(1);
    if (!rep) { res.status(404).json({ error: "Sales rep not found" }); return; }
    res.json({ rep });
  } catch (e: any) {
    res.status(500).json({ error: e?.message ?? "Failed to fetch profile" });
  }
});

// ─── Leads CRUD ──────────────────────────────────────────────────────────────

router.get("/sales/leads", async (req: Request, res: Response): Promise<void> => {
  const userId = getRepUserId(req);
  if (!userId) { res.status(401).json({ error: "Unauthorized" }); return; }

  try {
    const [rep] = await db.select().from(salesRepsTable).where(eq(salesRepsTable.userId, userId)).limit(1);
    if (!rep) { res.status(403).json({ error: "Not a sales rep" }); return; }

    const leads = await db.select().from(leadsTable).where(eq(leadsTable.repId, rep.id)).orderBy(desc(leadsTable.createdAt));
    res.json({ leads });
  } catch (e: any) {
    res.status(500).json({ error: e?.message ?? "Failed to fetch leads" });
  }
});

router.post("/sales/leads", async (req: Request, res: Response): Promise<void> => {
  const userId = getRepUserId(req);
  if (!userId) { res.status(401).json({ error: "Unauthorized" }); return; }

  try {
    const [rep] = await db.select().from(salesRepsTable).where(eq(salesRepsTable.userId, userId)).limit(1);
    if (!rep) { res.status(403).json({ error: "Not a sales rep" }); return; }

    const { firstName, lastName, email, phone, source, estimatedValue, notes } = req.body;
    if (!firstName || !lastName || !email) { res.status(400).json({ error: "firstName, lastName, email required" }); return; }

    const [lead] = await db.insert(leadsTable).values({
      repId: rep.id,
      firstName,
      lastName,
      email,
      phone,
      source,
      estimatedValue,
      notes,
    }).returning();

    res.status(201).json({ lead });
  } catch (e: any) {
    res.status(500).json({ error: e?.message ?? "Failed to create lead" });
  }
});

router.patch("/sales/leads/:id", async (req: Request, res: Response): Promise<void> => {
  const userId = getRepUserId(req);
  if (!userId) { res.status(401).json({ error: "Unauthorized" }); return; }

  try {
    const [rep] = await db.select().from(salesRepsTable).where(eq(salesRepsTable.userId, userId)).limit(1);
    if (!rep) { res.status(403).json({ error: "Not a sales rep" }); return; }

    const leadId = parseInt(String(req.params.id), 10);
    const { stage, firstName, lastName, email, phone, source, estimatedValue, notes } = req.body;

    const updates: Record<string, any> = { updatedAt: new Date() };
    if (stage) updates.stage = stage;
    if (firstName) updates.firstName = firstName;
    if (lastName) updates.lastName = lastName;
    if (email) updates.email = email;
    if (phone !== undefined) updates.phone = phone;
    if (source !== undefined) updates.source = source;
    if (estimatedValue !== undefined) updates.estimatedValue = estimatedValue;
    if (notes !== undefined) updates.notes = notes;
    if (stage === "converted") updates.convertedAt = new Date();
    if (stage) updates.lastContactedAt = new Date();

    const [updated] = await db.update(leadsTable).set(updates)
      .where(and(eq(leadsTable.id, leadId), eq(leadsTable.repId, rep.id)))
      .returning();

    if (!updated) { res.status(404).json({ error: "Lead not found" }); return; }
    res.json({ lead: updated });
  } catch (e: any) {
    res.status(500).json({ error: e?.message ?? "Failed to update lead" });
  }
});

// ─── Client Notes ────────────────────────────────────────────────────────────

router.get("/sales/leads/:id/notes", async (req: Request, res: Response): Promise<void> => {
  const userId = getRepUserId(req);
  if (!userId) { res.status(401).json({ error: "Unauthorized" }); return; }

  try {
    const leadId = parseInt(String(req.params.id), 10);
    const notes = await db.select().from(clientNotesTable).where(eq(clientNotesTable.leadId, leadId)).orderBy(desc(clientNotesTable.createdAt));
    res.json({ notes });
  } catch (e: any) {
    res.status(500).json({ error: e?.message ?? "Failed to fetch notes" });
  }
});

router.post("/sales/leads/:id/notes", async (req: Request, res: Response): Promise<void> => {
  const userId = getRepUserId(req);
  if (!userId) { res.status(401).json({ error: "Unauthorized" }); return; }

  try {
    const [rep] = await db.select().from(salesRepsTable).where(eq(salesRepsTable.userId, userId)).limit(1);
    if (!rep) { res.status(403).json({ error: "Not a sales rep" }); return; }

    const leadId = parseInt(String(req.params.id), 10);
    const { content, noteType } = req.body;
    if (!content) { res.status(400).json({ error: "content required" }); return; }

    const [note] = await db.insert(clientNotesTable).values({
      leadId,
      repId: rep.id,
      content,
      noteType: noteType ?? "general",
    }).returning();

    res.status(201).json({ note });
  } catch (e: any) {
    res.status(500).json({ error: e?.message ?? "Failed to create note" });
  }
});

// ─── Commissions ─────────────────────────────────────────────────────────────

router.get("/sales/commissions", async (req: Request, res: Response): Promise<void> => {
  const userId = getRepUserId(req);
  if (!userId) { res.status(401).json({ error: "Unauthorized" }); return; }

  try {
    const [rep] = await db.select().from(salesRepsTable).where(eq(salesRepsTable.userId, userId)).limit(1);
    if (!rep) { res.status(403).json({ error: "Not a sales rep" }); return; }

    const comms = await db.select().from(commissionsTable).where(eq(commissionsTable.repId, rep.id)).orderBy(desc(commissionsTable.createdAt));
    res.json({ commissions: comms });
  } catch (e: any) {
    res.status(500).json({ error: e?.message ?? "Failed to fetch commissions" });
  }
});

// ─── Sales Rep Stats ─────────────────────────────────────────────────────────

router.get("/sales/stats", async (req: Request, res: Response): Promise<void> => {
  const userId = getRepUserId(req);
  if (!userId) { res.status(401).json({ error: "Unauthorized" }); return; }

  try {
    const [rep] = await db.select().from(salesRepsTable).where(eq(salesRepsTable.userId, userId)).limit(1);
    if (!rep) { res.status(403).json({ error: "Not a sales rep" }); return; }

    const leads = await db.select().from(leadsTable).where(eq(leadsTable.repId, rep.id));
    const comms = await db.select().from(commissionsTable).where(eq(commissionsTable.repId, rep.id));

    const totalLeads = leads.length;
    const convertedLeads = leads.filter(l => l.stage === "converted").length;
    const activeLeads = leads.filter(l => !["converted", "lost"].includes(l.stage)).length;
    const totalCommissions = comms.reduce((s, c) => s + parseFloat(c.amount), 0);
    const pendingCommissions = comms.filter(c => c.status === "pending").reduce((s, c) => s + parseFloat(c.amount), 0);
    const paidCommissions = comms.filter(c => c.status === "paid").reduce((s, c) => s + parseFloat(c.amount), 0);

    res.json({
      totalLeads,
      convertedLeads,
      activeLeads,
      conversionRate: totalLeads > 0 ? ((convertedLeads / totalLeads) * 100).toFixed(1) : "0",
      totalCommissions,
      pendingCommissions,
      paidCommissions,
    });
  } catch (e: any) {
    res.status(500).json({ error: e?.message ?? "Failed to fetch stats" });
  }
});

export default router;
