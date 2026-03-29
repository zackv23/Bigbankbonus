import { Router } from "express";
import { XMLParser } from "fast-xml-parser";
import { db, docBonusesTable, type DocBonus } from "@workspace/db";
import { eq, desc } from "drizzle-orm";

const router = Router();
const parser = new XMLParser({ ignoreAttributes: false, attributeNamePrefix: "@_" });

const DOC_FEED_URL = "https://www.doctorofcredit.com/feed/";
const CACHE_TTL_MS = 60 * 60 * 1000; // 1 hour

const BANK_KEYWORDS = [
  "checking", "savings", "bonus", "bank", "credit union", "direct deposit",
  "chime", "sofi", "ally", "chase", "wells fargo", "bank of america", "citi",
  "discover", "capital one", "marcus", "wealthfront", "betterment", "acorns",
  "varo", "current", "dave", "cash app", "venmo", "paypal", "green dot",
  "netspend", "go2bank", "one finance", "upgrade", "lending club",
];

function extractBonusAmount(title: string): number | null {
  const patterns = [
    /\$(\d[\d,]*)\s*(?:checking|savings|bonus|cash|reward)/i,
    /\$(\d[\d,]*)\s*(?:for|when|after|with)/i,
    /\$(\d[\d,]*)\b/,
  ];
  for (const re of patterns) {
    const m = title.match(re);
    if (m) return parseInt(m[1].replace(/,/g, ""), 10);
  }
  return null;
}

function extractBankName(title: string): string | null {
  const cleaned = title.replace(/\[.*?\]/g, "").trim();
  const nameMatch = cleaned.match(/^([^:$]+?)(?:\s*:\s*|\s*-\s*|\s*\$)/);
  if (nameMatch) return nameMatch[1].trim();
  return null;
}

function isBankBonus(item: { title: string; categories?: string[] }): boolean {
  const titleLower = item.title.toLowerCase();
  if (item.categories?.some(c => c.toLowerCase().includes("bank"))) return true;
  return BANK_KEYWORDS.some(kw => titleLower.includes(kw));
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
      return db.select().from(docBonusesTable).orderBy(desc(docBonusesTable.pubDate)).limit(30);
    }
  }

  // Fetch fresh data
  const res = await fetch(DOC_FEED_URL, {
    headers: { "User-Agent": "BigBankBonus/1.0 RSS Reader" },
    signal: AbortSignal.timeout(10000),
  });
  if (!res.ok) throw new Error(`DoC feed error: ${res.status}`);
  const xml = await res.text();
  const parsed = parser.parse(xml);
  const items: any[] = parsed?.rss?.channel?.item ?? [];

  const bankItems = items
    .filter((item: any) => {
      const cats = Array.isArray(item.category)
        ? item.category
        : item.category
        ? [item.category]
        : [];
      return isBankBonus({ title: item.title ?? "", categories: cats });
    })
    .slice(0, 30);

  // Upsert into DB
  for (const item of bankItems) {
    const guid = String(item.guid?.["#text"] ?? item.guid ?? item.link ?? "").slice(0, 500);
    if (!guid) continue;
    try {
      await db
        .insert(docBonusesTable)
        .values({
          guid,
          title: String(item.title ?? "").slice(0, 500),
          link: String(item.link ?? "").slice(0, 500),
          description: String(item.description ?? "").replace(/<[^>]+>/g, "").trim().slice(0, 1000),
          bankName: extractBankName(String(item.title ?? "")),
          bonusAmount: extractBonusAmount(String(item.title ?? "")),
          category: "bank",
          pubDate: item.pubDate ? new Date(item.pubDate) : new Date(),
          fetchedAt: new Date(),
        })
        .onConflictDoUpdate({
          target: docBonusesTable.guid,
          set: {
            title: String(item.title ?? "").slice(0, 500),
            description: String(item.description ?? "").replace(/<[^>]+>/g, "").trim().slice(0, 1000),
            bonusAmount: extractBonusAmount(String(item.title ?? "")),
            fetchedAt: new Date(),
          },
        });
    } catch (_) {}
  }

  return db.select().from(docBonusesTable).orderBy(desc(docBonusesTable.pubDate)).limit(30);
}

router.get("/bonuses/doc", async (_req, res) => {
  try {
    const bonuses = await fetchAndCacheDocBonuses();
    res.json({ bonuses });
  } catch (err: any) {
    console.error("DoC feed error:", err);
    // Return cached data even if stale
    try {
      const cached = await db.select().from(docBonusesTable).orderBy(desc(docBonusesTable.pubDate)).limit(30);
      res.json({ bonuses: cached, stale: true });
    } catch {
      res.status(500).json({ error: "Failed to fetch bonuses" });
    }
  }
});

export default router;
