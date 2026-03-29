import { Router } from "express";
import { db, docBonusesTable, type DocBonus } from "@workspace/db";
import { desc, eq } from "drizzle-orm";

const router = Router();

const DOC_PAGE_URL = "https://www.doctorofcredit.com/best-bank-account-bonuses/";
const CACHE_TTL_MS = 60 * 60 * 1000; // 1 hour

function stripHtml(html: string): string {
  return html.replace(/<[^>]+>/g, "").replace(/&#[0-9]+;/g, c => {
    const code = parseInt(c.slice(2, -1), 10);
    return String.fromCharCode(code);
  }).replace(/&amp;/g, "&").replace(/&lt;/g, "<").replace(/&gt;/g, ">").replace(/&nbsp;/g, " ").replace(/&#038;/g, "&").replace(/&quot;/g, '"').trim();
}

function extractAmount(text: string): number | null {
  const m = text.match(/\$([0-9][0-9,]*(?:\.[0-9]+)?)\s*(?:–|-|to|up to|or|\/|$|\s)/i)
    ?? text.match(/\$([0-9][0-9,]*)/);
  if (!m) return null;
  const n = parseFloat(m[1].replace(/,/g, ""));
  return isNaN(n) ? null : Math.round(n);
}

function extractStateRestriction(title: string): string | null {
  const m = title.match(/^\[([^\]]+)\]/);
  if (!m) return null;
  const t = m[1].toLowerCase();
  if (t.includes("only") || t.includes(",") || /\b[A-Z]{2}\b/.test(m[1])) return m[1];
  return null;
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
  const liItems = [...ulHtml.matchAll(/<li[^>]*>(.*?)<\/li>/gis)].map(m => stripHtml(m[1]));
  let pullType: string | null = null;
  let ccFunding: string | null = null;
  let directDepositInfo: string | null = null;
  let docPostLink: string | null = null;

  for (const li of liItems) {
    const lower = li.toLowerCase();
    if (lower.includes("read our") || lower.includes("read the full") || lower.includes("our post") || lower.includes("our full post")) {
      const linkMatch = ulHtml.match(/href="(https:\/\/www\.doctorofcredit\.com[^"]+)"/i);
      if (linkMatch) docPostLink = linkMatch[1];
      continue;
    }
    if (lower.includes("soft pull") || lower.includes("hard pull")) {
      pullType = lower.includes("hard pull") ? "hard" : "soft";
    } else if (lower.includes("credit card") || lower.includes("cc funding") || lower.includes("debit card fund")) {
      ccFunding = li;
    } else if (lower.includes("direct deposit") || lower.includes("no direct")) {
      directDepositInfo = li;
    }
  }
  return { pullType, ccFunding, directDepositInfo, docPostLink };
}

function parseDocPage(html: string): Array<{
  guid: string;
  title: string;
  link: string;
  description: string | null;
  bankName: string | null;
  bonusAmount: number | null;
  offerLink: string | null;
  docPostLink: string | null;
  pullType: string | null;
  ccFunding: string | null;
  directDepositInfo: string | null;
  section: string;
  rank: number;
  source: string;
  stateRestriction: string | null;
  nationwide: boolean;
  category: string;
}> {
  const results: ReturnType<typeof parseDocPage> = [];

  // Extract main content div
  const contentMatch = html.match(/<div class="entry-content">([\s\S]*?)<\/div>\s*(?:<aside|<div class="post-footer|<section)/i);
  const content = contentMatch ? contentMatch[1] : html;

  // Split by h2 to get sections
  const sectionParts = content.split(/<h2[^>]*>/i);
  let globalRank = 0;

  for (const sectionPart of sectionParts.slice(1)) {
    // Get section name from h2 text
    const h2TextMatch = sectionPart.match(/^(.*?)<\/h2>/is);
    if (!h2TextMatch) continue;
    const sectionName = parseSectionName(stripHtml(h2TextMatch[1]));

    // Stop at Recent Changes section
    if (sectionName === "other" && stripHtml(h2TextMatch[1]).toLowerCase().includes("recent")) break;

    // Split by h3 to get individual bonuses
    const h3Parts = sectionPart.split(/<h3[^>]*>/i);

    for (const h3Part of h3Parts.slice(1)) {
      // Extract h3 title
      const titleMatch = h3Part.match(/^(.*?)<\/h3>/is);
      if (!titleMatch) continue;
      const rawTitle = stripHtml(titleMatch[1]);
      if (!rawTitle || rawTitle.length < 3) continue;

      const bankName = rawTitle.replace(/^\[[^\]]+\]\s*/, "").split(/\s*\$|\s*–|\s*-\s*[A-Z]/)[0].trim();
      const bonusAmount = extractAmount(rawTitle);
      const stateRestriction = extractStateRestriction(rawTitle);
      const isNationwide = !stateRestriction && sectionName !== "state" && sectionName !== "regional";

      // Extract offer direct link (first <p> after h3)
      const firstParaMatch = h3Part.match(/<p[^>]*>\s*<a[^>]+href="([^"]+)"[^>]*>(?:Direct link|Direct&nbsp;|Direct  link)[^<]*<\/a>/i);
      const offerLink = firstParaMatch ? firstParaMatch[1] : null;

      // Extract description (second paragraph)
      const allParas = [...h3Part.matchAll(/<p[^>]*>([\s\S]*?)<\/p>/gi)];
      let description: string | null = null;
      for (const para of allParas) {
        const text = stripHtml(para[1]);
        if (text && !text.toLowerCase().startsWith("direct link") && text.length > 10) {
          description = text.slice(0, 500);
          break;
        }
      }

      // Extract ul details
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
      });
    }
  }

  return results;
}

async function fetchAndCacheDocBonuses(): Promise<DocBonus[]> {
  // Check cache freshness
  const latest = await db
    .select()
    .from(docBonusesTable)
    .orderBy(desc(docBonusesTable.fetchedAt))
    .limit(1);

  const now = Date.now();
  if (latest.length > 0 && latest[0].fetchedAt) {
    const age = now - new Date(latest[0].fetchedAt).getTime();
    if (age < CACHE_TTL_MS) {
      return db.select().from(docBonusesTable).orderBy(docBonusesTable.rank, desc(docBonusesTable.bonusAmount));
    }
  }

  // Fetch and parse the DoC best bank bonuses page
  const res = await fetch(DOC_PAGE_URL, {
    headers: {
      "User-Agent": "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
      "Accept": "text/html",
    },
    signal: AbortSignal.timeout(15000),
  });
  if (!res.ok) throw new Error(`DoC page error: ${res.status}`);
  const html = await res.text();

  const bonuses = parseDocPage(html);
  if (bonuses.length === 0) throw new Error("No bonuses parsed from DoC page");

  // Clear old page-sourced entries and re-insert fresh ones
  for (const bonus of bonuses) {
    try {
      await db
        .insert(docBonusesTable)
        .values({ ...bonus, fetchedAt: new Date() })
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
      console.warn("Error upserting bonus:", bonus.guid, err);
    }
  }

  return db.select().from(docBonusesTable).orderBy(docBonusesTable.rank, desc(docBonusesTable.bonusAmount));
}

router.get("/bonuses/doc", async (req, res) => {
  try {
    const section = req.query.section as string | undefined;
    const nationwide = req.query.nationwide === "true";

    let bonuses = await fetchAndCacheDocBonuses();

    if (section) bonuses = bonuses.filter(b => b.section === section);
    if (req.query.nationwide === "true") bonuses = bonuses.filter(b => b.nationwide);

    res.json({ bonuses, count: bonuses.length, source: "doctorofcredit.com/best-bank-account-bonuses" });
  } catch (err: any) {
    console.error("DoC page scrape error:", err.message);
    try {
      const cached = await db.select().from(docBonusesTable).orderBy(docBonusesTable.rank, desc(docBonusesTable.bonusAmount));
      res.json({ bonuses: cached, count: cached.length, stale: true, source: "cache" });
    } catch {
      res.status(500).json({ error: "Failed to fetch bonuses" });
    }
  }
});

export default router;
