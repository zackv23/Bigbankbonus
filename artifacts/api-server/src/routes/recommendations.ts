import { Router } from "express";
import { db, userProfilesTable, subscriptionsTable, docBonusesTable, plaidItemsTable } from "@workspace/db";
import { eq, desc } from "drizzle-orm";
import { openai } from "@workspace/integrations-openai-ai-server";

const router = Router();

const BANKS_DATA = [
  { id: "sofi-checking", name: "SoFi Checking & Savings", type: "personal", bonusAmount: 300, directDepositRequired: 1000, ewsReporting: false, noFee: true, timeToBonus: 25, difficulty: "Easy", category: "personal" },
  { id: "chime-checking", name: "Chime Checking", type: "personal", bonusAmount: 100, directDepositRequired: 200, ewsReporting: false, noFee: true, timeToBonus: 60, difficulty: "Easy", category: "personal" },
  { id: "upgrade-checking", name: "Upgrade Rewards Checking", type: "personal", bonusAmount: 200, directDepositRequired: 1000, ewsReporting: false, noFee: true, timeToBonus: 120, difficulty: "Medium", category: "personal" },
  { id: "axos-rewards", name: "Axos Rewards Checking", type: "personal", bonusAmount: 300, directDepositRequired: 1500, ewsReporting: false, noFee: true, timeToBonus: 75, difficulty: "Medium", category: "personal" },
  { id: "chase-total", name: "Chase Total Checking", type: "personal", bonusAmount: 300, directDepositRequired: 500, ewsReporting: true, noFee: false, timeToBonus: 90, difficulty: "Medium", category: "personal" },
  { id: "citi-checking", name: "Citi Priority Checking", type: "personal", bonusAmount: 2000, directDepositRequired: 30000, ewsReporting: true, noFee: false, timeToBonus: 90, difficulty: "Hard", category: "personal" },
  { id: "us-bank-checking", name: "U.S. Bank Smartly Checking", type: "personal", bonusAmount: 400, directDepositRequired: 3000, ewsReporting: true, noFee: false, timeToBonus: 90, difficulty: "Medium", category: "personal" },
  { id: "td-bank-beyond", name: "TD Bank Beyond Checking", type: "personal", bonusAmount: 300, directDepositRequired: 2500, ewsReporting: true, noFee: false, timeToBonus: 95, difficulty: "Medium", category: "personal" },
  { id: "relay-business", name: "Relay Business Checking", type: "business", bonusAmount: 300, directDepositRequired: 5000, ewsReporting: false, noFee: true, timeToBonus: 90, difficulty: "Easy", category: "business" },
  { id: "mercury-business", name: "Mercury Business Checking", type: "business", bonusAmount: 500, directDepositRequired: 10000, ewsReporting: false, noFee: true, timeToBonus: 90, difficulty: "Easy", category: "business" },
  { id: "chase-business", name: "Chase Business Complete", type: "business", bonusAmount: 500, directDepositRequired: 2000, ewsReporting: true, noFee: false, timeToBonus: 90, difficulty: "Medium", category: "business" },
  { id: "bank-of-america-biz", name: "Bank of America Business Advantage", type: "business", bonusAmount: 300, directDepositRequired: 5000, ewsReporting: true, noFee: false, timeToBonus: 90, difficulty: "Medium", category: "business" },
  { id: "bluevine-business", name: "Bluevine Business Checking", type: "business", bonusAmount: 300, directDepositRequired: 5000, ewsReporting: false, noFee: true, timeToBonus: 90, difficulty: "Easy", category: "business" },
  { id: "discover-it-cashback", name: "Discover it® Cash Back", type: "credit_card", bonusAmount: 200, directDepositRequired: 1500, ewsReporting: false, noFee: true, timeToBonus: 90, difficulty: "Easy", category: "credit_card" },
  { id: "chase-freedom-unlimited", name: "Chase Freedom Unlimited", type: "credit_card", bonusAmount: 200, directDepositRequired: 500, ewsReporting: false, noFee: true, timeToBonus: 90, difficulty: "Medium", category: "credit_card" },
  { id: "amex-blue-cash", name: "Amex Blue Cash Preferred", type: "credit_card", bonusAmount: 350, directDepositRequired: 3000, ewsReporting: false, noFee: false, timeToBonus: 90, difficulty: "Medium", category: "credit_card" },
  { id: "capital-one-venture", name: "Capital One Venture Rewards", type: "credit_card", bonusAmount: 500, directDepositRequired: 4000, ewsReporting: false, noFee: false, timeToBonus: 90, difficulty: "Medium", category: "credit_card" },
  { id: "wells-fargo-active", name: "Wells Fargo Active Cash Card", type: "credit_card", bonusAmount: 200, directDepositRequired: 1000, ewsReporting: false, noFee: true, timeToBonus: 90, difficulty: "Easy", category: "credit_card" },
];

function scoreOffer(offer: typeof BANKS_DATA[0], bankScore: number, plaidBalance: number): number {
  let score = 0;

  if (!offer.ewsReporting) score += 30;

  if (bankScore >= 750) {
    score += 30;
  } else if (bankScore >= 700) {
    score += offer.ewsReporting ? 10 : 25;
  }

  const difficultyScore = { Easy: 20, Medium: 10, Hard: 0 }[offer.difficulty] ?? 10;
  score += difficultyScore;

  const roiRaw = offer.bonusAmount / (offer.directDepositRequired || 1);
  score += Math.min(roiRaw * 100, 20);

  if (offer.noFee) score += 10;

  const canAfford = plaidBalance >= offer.directDepositRequired;
  if (canAfford) score += 15;

  score -= offer.timeToBonus / 30;

  return Math.round(score);
}

function buildStackingCombo(personal: typeof BANKS_DATA[0][], business: typeof BANKS_DATA[0][], creditCard: typeof BANKS_DATA[0][]) {
  const bestPersonal = personal[0];
  const bestBusiness = business[0];
  const bestCard = creditCard[0];

  const total = (bestPersonal?.bonusAmount ?? 0) + (bestBusiness?.bonusAmount ?? 0) + (bestCard?.bonusAmount ?? 0);

  return {
    personal: bestPersonal,
    business: bestBusiness,
    creditCard: bestCard,
    projectedTotal: total,
  };
}

router.get("/profile/score", async (req, res) => {
  const userId = String(req.query.userId ?? "");
  if (!userId) return res.status(400).json({ error: "userId required" });

  const [profile] = await db.select().from(userProfilesTable).where(eq(userProfilesTable.userId, userId)).limit(1);
  return res.json({ bankScore: profile?.bankScore ?? null, ewsScore: profile?.ewsScore ?? null });
});

router.post("/profile/score", async (req, res) => {
  const { userId, bankScore, ewsScore } = req.body as { userId: string; bankScore?: number; ewsScore?: number };
  if (!userId) return res.status(400).json({ error: "userId required" });

  const existing = await db.select().from(userProfilesTable).where(eq(userProfilesTable.userId, userId)).limit(1);

  let profile;
  if (existing.length > 0) {
    [profile] = await db.update(userProfilesTable).set({
      ...(bankScore !== undefined ? { bankScore } : {}),
      ...(ewsScore !== undefined ? { ewsScore } : {}),
      updatedAt: new Date(),
    }).where(eq(userProfilesTable.userId, userId)).returning();
  } else {
    [profile] = await db.insert(userProfilesTable).values({
      userId,
      bankScore: bankScore ?? null,
      ewsScore: ewsScore ?? null,
    }).returning();
  }

  return res.json({ profile });
});

router.get("/recommendations", async (req, res) => {
  const userId = String(req.query.userId ?? "");
  if (!userId) return res.status(400).json({ error: "userId required" });

  const [sub] = await db.select().from(subscriptionsTable).where(eq(subscriptionsTable.userId, userId)).limit(1);
  const isPaid = sub && (sub.plan === "monthly" || sub.plan === "annual") && sub.status === "active";

  if (!isPaid) {
    return res.status(403).json({ error: "Pro subscription required", code: "NOT_SUBSCRIBED" });
  }

  const [profile] = await db.select().from(userProfilesTable).where(eq(userProfilesTable.userId, userId)).limit(1);
  const bankScore = profile?.bankScore ?? 0;

  if (bankScore < 700) {
    return res.status(403).json({ error: "Bank score of 700+ required", code: "SCORE_TOO_LOW", bankScore });
  }

  const plaidItems = await db.select().from(plaidItemsTable).where(eq(plaidItemsTable.userId, userId));
  const totalPlaidBalance = plaidItems.reduce((sum: number, item: any) => {
    const accounts: any[] = Array.isArray(item.accounts) ? item.accounts : [];
    return sum + accounts.reduce((s: number, a: any) => s + (a?.balances?.available ?? 0), 0);
  }, 0);

  let liveOffers: any[] = [];
  try {
    liveOffers = await db.select().from(docBonusesTable).orderBy(desc(docBonusesTable.bonusAmount)).limit(50);
  } catch {}

  const allBanks = [...BANKS_DATA];

  const scored = allBanks.map(b => ({
    ...b,
    approvalScore: scoreOffer(b, bankScore, totalPlaidBalance),
    requirements: `Deposit $${b.directDepositRequired.toLocaleString()} via direct deposit within ${Math.round(b.timeToBonus * 0.8)} days`,
    roi: b.directDepositRequired > 0 ? ((b.bonusAmount / b.directDepositRequired) * 100).toFixed(1) + "%" : "N/A",
    ctaUrl: `https://bigbankbonus.com/offers/${b.id}`,
  })).sort((a, b) => b.approvalScore - a.approvalScore);

  const personalOffers = scored.filter(b => b.category === "personal").slice(0, 3);
  const businessOffers = scored.filter(b => b.category === "business").slice(0, 3);
  const creditCardOffers = scored.filter(b => b.category === "credit_card").slice(0, 3);

  const stackingCombo = buildStackingCombo(
    scored.filter(b => b.category === "personal"),
    scored.filter(b => b.category === "business"),
    scored.filter(b => b.category === "credit_card")
  );

  let aiSummary = "";
  try {
    const prompt = `You are BigBankBonus AI. Analyze this user's profile and generate a concise, actionable bank bonus stacking strategy (3-4 sentences max).

User Profile:
- ChexSystems/EWS Score: ${bankScore}
- Linked Bank Balance: $${totalPlaidBalance.toLocaleString()}
- Score Tier: ${bankScore >= 750 ? "Excellent" : bankScore >= 700 ? "Good" : "Fair"}

Best Stacking Combination:
- Personal: ${stackingCombo.personal?.name} ($${stackingCombo.personal?.bonusAmount} bonus)
- Business: ${stackingCombo.business?.name} ($${stackingCombo.business?.bonusAmount} bonus)
- Credit Card: ${stackingCombo.creditCard?.name} ($${stackingCombo.creditCard?.bonusAmount} bonus)
- Total Projected: $${stackingCombo.projectedTotal}

Write a personalized strategy summary explaining why this combination is ideal for this user, how to execute it efficiently, and what to watch out for. Be specific and encouraging.`;

    const completion = await openai.chat.completions.create({
      model: "gpt-4o-mini",
      messages: [{ role: "user", content: prompt }],
      max_tokens: 300,
      temperature: 0.7,
    });
    aiSummary = completion.choices[0]?.message?.content ?? "";
  } catch (err) {
    aiSummary = `With a ${bankScore} bank score and $${totalPlaidBalance.toLocaleString()} in linked funds, you're well-positioned to stack bonuses across personal, business, and credit card accounts. Start with ${stackingCombo.personal?.name ?? "a no-EWS personal account"} to build your history, then layer in the business account and credit card for maximum total earnings of $${stackingCombo.projectedTotal.toLocaleString()}.`;
  }

  return res.json({
    bankScore,
    totalPlaidBalance,
    aiSummary,
    stackingCombo: {
      ...stackingCombo,
      description: `Best combo for your ${bankScore} score — earn up to $${stackingCombo.projectedTotal.toLocaleString()} total`,
    },
    personalOffers,
    businessOffers,
    creditCardOffers,
    disclaimer: "Recommendations are advisory only. Approval is not guaranteed. All offers subject to bank terms.",
    generatedAt: new Date().toISOString(),
  });
});

export default router;
