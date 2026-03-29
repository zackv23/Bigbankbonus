import { Router } from "express";
import { db, docBonusesTable, type DocBonus } from "@workspace/db";
import { desc, eq, asc, isNull, or } from "drizzle-orm";
import cron from "node-cron";

const router = Router();

const DOC_PAGE_URL = "https://www.doctorofcredit.com/best-bank-account-bonuses/";

// ─── Pinned (featured) offers — always shown at the top regardless of scrape ──
const PINNED_OFFERS: Array<Omit<typeof docBonusesTable.$inferInsert, "id" | "fetchedAt">> = [
  {
    guid: "pinned-chase-checking-savings",
    title: "Chase Total Checking® — Up to $300 Bonus",
    link: "https://account.chase.com/consumer/banking/checkingandsavingsoffer",
    offerLink: "https://account.chase.com/consumer/banking/checkingandsavingsoffer",
    docPostLink: "https://www.doctorofcredit.com/chase-300-checking-bonus/",
    bankName: "Chase",
    bonusAmount: 300,
    description: "Earn a $300 bonus when you open a Chase Total Checking® account and set up direct deposit. No minimum balance required after bonus is earned.",
    pullType: "soft",
    section: "checking",
    rank: -1,
    source: "pinned",
    nationwide: true,
    stateRestriction: null,
    category: "bank",
    ccFunding: null,
    directDepositInfo: "Direct deposit required",
    pinned: true,
    pubDate: new Date(),
  },
];

// ─── HTML helpers ─────────────────────────────────────────────────────────────
function stripHtml(html: string): string {
  return html
    .replace(/<[^>]+>/g, "")
    .replace(/&#([0-9]+);/g, (_, code) => String.fromCharCode(parseInt(code, 10)))
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&nbsp;/g, " ")
    .replace(/&#038;/g, "&")
    .replace(/&quot;/g, '"')
    .trim();
}

function extractAmount(text: string): number | null {
  const m =
    text.match(/\$([0-9][0-9,]*(?:\.[0-9]+)?)\s*(?:–|-|to|up to|or|\/|$|\s)/i) ??
    text.match(/\$([0-9][0-9,]*)/);
  if (!m) return null;
  const n = parseFloat(m[1].replace(/,/g, ""));
  return isNaN(n) ? null : Math.round(n);
}

function extractStateRestriction(title: string): string | null {
  const m = title.match(/^\[([^\]]+)\]/);
  if (!m) return null;
  if (m[1].toLowerCase().includes("expired")) return null;
  if (m[1].toLowerCase().includes("targeted")) return m[1].replace(/Targeted,?\s*/i, "").trim();
  return m[1].trim();
}

function parseSectionName(h2Text: string): string {
  const t = h2Text.toLowerCase();
  if (t.includes("checking")) return "checking";
  if (t.includes("saving")) return "savings";
  if (t.includes("business")) return "business";
  if (t.includes("state")) return "state";
  if (t.includes("region") || t.includes("branch")) return "regional";
  return "other";
}

function parseUlDetails(ulHtml: string): {
  pullType: string | null;
  ccFunding: string | null;
  directDepositInfo: string | null;
  docPostLink: string | null;
} {
  const liItems = [...ulHtml.matchAll(/<li[^>]*>([\s\S]*?)<\/li>/gi)].map(m => ({
    text: stripHtml(m[1]),
    raw: m[1],
  }));

  let pullType: string | null = null;
  let ccFunding: string | null = null;
  let directDepositInfo: string | null = null;
  let docPostLink: string | null = null;

  for (const { text, raw } of liItems) {
    const lower = text.toLowerCase();
    if (lower.includes("read our") || lower.includes("our post") || lower.includes("our full post")) {
      const linkMatch = raw.match(/href="(https?:\/\/[^"]+)"/i);
      if (linkMatch) docPostLink = linkMatch[1];
      continue;
    }
    if (lower.includes("soft pull")) pullType = "soft";
    else if (lower.includes("hard pull")) pullType = "hard";
    else if (lower.includes("credit card fund") || lower.includes("debit card fund") || lower.includes("no credit card") || lower.includes("can fund")) {
      ccFunding = text;
    } else if (lower.includes("direct deposit") || lower.includes("no direct")) {
      directDepositInfo = text;
    }
  }
  return { pullType, ccFunding, directDepositInfo, docPostLink };
}

function parseDocPage(html: string): Array<typeof docBonusesTable.$inferInsert> {
  const results: Array<typeof docBonusesTable.$inferInsert> = [];
  const contentMatch = html.match(/<div class="entry-content">([\s\S]*?)(?=<\/article>|<div class="post-footer|<section class="related)/i);
  const content = contentMatch ? contentMatch[1] : html;

  const sectionParts = content.split(/<h2[^>]*>/i);
  let globalRank = 0;

  for (const sectionPart of sectionParts.slice(1)) {
    const h2TextMatch = sectionPart.match(/^([\s\S]*?)<\/h2>/i);
    if (!h2TextMatch) continue;
    const sectionName = parseSectionName(stripHtml(h2TextMatch[1]));
    if (["other"].includes(sectionName) && stripHtml(h2TextMatch[1]).toLowerCase().includes("recent")) break;

    const h3Parts = sectionPart.split(/<h3[^>]*>/i);
    for (const h3Part of h3Parts.slice(1)) {
      const titleMatch = h3Part.match(/^([\s\S]*?)<\/h3>/i);
      if (!titleMatch) continue;
      const rawTitle = stripHtml(titleMatch[1]);
      if (!rawTitle || rawTitle.length < 3) continue;
      if (rawTitle.toLowerCase().includes("expired")) continue;

      const bankName = rawTitle.replace(/^\[[^\]]+\]\s*/, "").split(/\s*\$|\s+–\s+[A-Z]|\s+-\s+[A-Z]/)[0].trim();
      const bonusAmount = extractAmount(rawTitle);
      const stateRestriction = extractStateRestriction(rawTitle);
      const isNationwide = !stateRestriction && sectionName !== "state" && sectionName !== "regional";

      const offerLinkMatch = h3Part.match(/<p[^>]*>\s*<a[^>]+href="([^"]+)"[^>]*>\s*(?:Direct link|Direct&nbsp;\s*link|Direct\s+link)/i);
      const offerLink = offerLinkMatch ? offerLinkMatch[1] : null;

      const allParas = [...h3Part.matchAll(/<p[^>]*>([\s\S]*?)<\/p>/gi)];
      let description: string | null = null;
      for (const para of allParas) {
        const text = stripHtml(para[1]);
        if (text && !text.toLowerCase().startsWith("direct link") && !text.toLowerCase().startsWith("direct &nbsp") && text.length > 10) {
          description = text.slice(0, 500);
          break;
        }
      }

      const ulMatch = h3Part.match(/<ul[^>]*>([\s\S]*?)<\/ul>/i);
      const { pullType, ccFunding, directDepositInfo, docPostLink } = ulMatch
        ? parseUlDetails(ulMatch[0])
        : { pullType: null, ccFunding: null, directDepositInfo: null, docPostLink: null };

      const link = docPostLink ?? offerLink ?? DOC_PAGE_URL;
      const guid = `doc-page-${rawTitle.replace(/[^a-z0-9]/gi, "-").toLowerCase().slice(0, 80)}`;

      results.push({
        guid,
        title: rawTitle,
        link,
        description,
        bankName: bankName || null,
        bonusAmount,
        offerLink,
        docPostLink,
        pullType,
        ccFunding,
        directDepositInfo,
        section: sectionName,
        rank: globalRank++,
        source: "page",
        stateRestriction,
        nationwide: isNationwide,
        category: "bank",
        pinned: false,
        pubDate: new Date(),
        fetchedAt: new Date(),
      });
    }
  }
  return results;
}

// ─── Core scrape function ─────────────────────────────────────────────────────
async function scrapeDocPage(): Promise<void> {
  console.log("[DoC] Starting scheduled scrape of", DOC_PAGE_URL);
  const res = await fetch(DOC_PAGE_URL, {
    headers: {
      "User-Agent": "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
      "Accept": "text/html",
    },
    signal: AbortSignal.timeout(20000),
  });
  if (!res.ok) throw new Error(`DoC page responded ${res.status}`);
  const html = await res.text();
  const bonuses = parseDocPage(html);
  if (bonuses.length === 0) throw new Error("Parsed 0 bonuses — page structure may have changed");

  for (const bonus of bonuses) {
    try {
      await db
        .insert(docBonusesTable)
        .values(bonus)
        .onConflictDoUpdate({
          target: docBonusesTable.guid,
          set: {
            title: bonus.title,
            description: bonus.description,
            bonusAmount: bonus.bonusAmount,
            offerLink: bonus.offerLink,
            docPostLink: bonus.docPostLink,
            pullType: bonus.pullType,
            ccFunding: bonus.ccFunding,
            directDepositInfo: bonus.directDepositInfo,
            section: bonus.section,
            rank: bonus.rank,
            nationwide: bonus.nationwide,
            stateRestriction: bonus.stateRestriction,
            fetchedAt: new Date(),
          },
        });
    } catch (err) {
      console.warn("[DoC] Failed to upsert bonus:", bonus.guid, err);
    }
  }
  console.log(`[DoC] Scrape complete — ${bonuses.length} bonuses upserted`);
}

// ─── Seed pinned offers on startup ───────────────────────────────────────────
async function seedPinnedOffers(): Promise<void> {
  for (const offer of PINNED_OFFERS) {
    await db
      .insert(docBonusesTable)
      .values({ ...offer, fetchedAt: new Date() })
      .onConflictDoUpdate({
        target: docBonusesTable.guid,
        set: {
          title: offer.title,
          description: offer.description,
          bonusAmount: offer.bonusAmount,
          offerLink: offer.offerLink,
          docPostLink: offer.docPostLink,
          pullType: offer.pullType,
          ccFunding: offer.ccFunding,
          directDepositInfo: offer.directDepositInfo,
          section: offer.section,
          rank: offer.rank,
          nationwide: offer.nationwide,
          pinned: true,
          fetchedAt: new Date(),
        },
      });
  }
}

// ─── Initial seed: scrape once if DB has no page data ────────────────────────
async function initIfEmpty(): Promise<void> {
  const [existing] = await db
    .select()
    .from(docBonusesTable)
    .where(eq(docBonusesTable.source, "page"))
    .limit(1);
  if (!existing) {
    console.log("[DoC] No page data in DB — running initial scrape");
    await scrapeDocPage().catch(err => console.error("[DoC] Initial scrape failed:", err.message));
  }
}

// ─── Schedule: Mon–Thu at 4 AM Eastern ───────────────────────────────────────
// Cron: "0 4 * * 1-4" with timezone America/New_York covers both EST and EDT
cron.schedule("0 4 * * 1-4", () => {
  scrapeDocPage().catch(err => console.error("[DoC] Scheduled scrape failed:", err.message));
}, { timezone: "America/New_York" });

// Run init after a short delay to let the DB connection settle
setTimeout(() => {
  seedPinnedOffers().catch(err => console.error("[DoC] Seed pinned failed:", err.message));
  initIfEmpty().catch(err => console.error("[DoC] Init check failed:", err.message));
}, 2000);

// ─── API routes ───────────────────────────────────────────────────────────────
router.get("/bonuses/doc", async (req, res) => {
  try {
    const sectionFilter = req.query.section as string | undefined;
    const nationwideOnly = req.query.nationwide === "true";

    let bonuses = await db
      .select()
      .from(docBonusesTable)
      .orderBy(
        desc(docBonusesTable.pinned),   // pinned entries first
        asc(docBonusesTable.rank),       // then by rank
        desc(docBonusesTable.bonusAmount)
      );

    if (sectionFilter) bonuses = bonuses.filter(b => b.section === sectionFilter);
    if (nationwideOnly) bonuses = bonuses.filter(b => b.nationwide);

    const lastScrape = bonuses.find(b => b.source === "page")?.fetchedAt ?? null;

    res.json({
      bonuses,
      count: bonuses.length,
      source: "doctorofcredit.com/best-bank-account-bonuses",
      lastScrape,
      schedule: "Mon–Thu 4 AM ET",
    });
  } catch (err: any) {
    console.error("[DoC] API error:", err.message);
    res.status(500).json({ error: "Failed to fetch bonuses" });
  }
});

// Manually trigger a scrape (admin use)
router.post("/bonuses/doc/refresh", async (_req, res) => {
  try {
    await scrapeDocPage();
    res.json({ success: true, message: "Scrape completed" });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

export default router;
