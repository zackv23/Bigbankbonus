import { Router, type Request, type Response } from "express";
import { db, leadsTable } from "@workspace/db";
import { eq } from "drizzle-orm";

const router = Router();
const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

router.post("/waitlist", async (req: Request, res: Response): Promise<void> => {
  const email = typeof req.body?.email === "string" ? req.body.email.trim().toLowerCase() : "";

  if (!email) {
    res.status(400).json({ error: "Email is required." });
    return;
  }

  if (!emailRegex.test(email)) {
    res.status(400).json({ error: "Please enter a valid email address." });
    return;
  }

  try {
    const existing = await db
      .select()
      .from(leadsTable)
      .where(eq(leadsTable.email, email))
      .limit(1);

    if (existing.length > 0) {
      res.status(409).json({ error: "This email is already on the waitlist." });
      return;
    }

    await db.insert(leadsTable).values({
      repId: 0,
      firstName: "",
      lastName: "",
      email,
      source: "waitlist",
      stage: "new",
    });

    const waitlistRows = await db
      .select()
      .from(leadsTable)
      .where(eq(leadsTable.source, "waitlist"));

    res.status(201).json({ success: true, waitlistCount: waitlistRows.length });
  } catch (error) {
    res.status(500).json({ error: "Unable to join the waitlist." });
  }
});

export default router;
