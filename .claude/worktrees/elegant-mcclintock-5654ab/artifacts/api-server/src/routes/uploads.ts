import { Router, type Request, type Response } from "express";
import { db, fileUploadsTable } from "@workspace/db";
import { eq, and, desc } from "drizzle-orm";
import { ObjectStorageService } from "../lib/objectStorage";

const router = Router();
const objectStorageService = new ObjectStorageService();

const ALLOWED_CONTENT_TYPES = [
  "application/pdf",
  "image/jpeg",
  "image/jpg",
  "image/png",
  "image/gif",
  "image/webp",
];

const MAX_FILE_SIZE_BYTES = 10 * 1024 * 1024;

function extractUserId(req: Request): string | null {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith("Bearer ")) return null;
  const token = authHeader.slice("Bearer ".length).trim();
  if (!token || token.length < 3) return null;
  return token;
}

router.post("/uploads/files", async (req: Request, res: Response) => {
  const userId = extractUserId(req);
  if (!userId) {
    res.status(401).json({ error: "Authorization required. Provide a valid Bearer token." });
    return;
  }

  const { fileName, fileSize, contentType, objectPath, category } = req.body as {
    fileName: string;
    fileSize: number;
    contentType: string;
    objectPath: string;
    category?: string;
  };

  if (!fileName || !fileSize || !contentType || !objectPath) {
    res.status(400).json({ error: "Missing required fields" });
    return;
  }

  if (!ALLOWED_CONTENT_TYPES.includes(contentType.toLowerCase())) {
    res.status(400).json({ error: "File type not allowed. Only PDF and images are accepted." });
    return;
  }

  if (fileSize > MAX_FILE_SIZE_BYTES) {
    res.status(400).json({ error: "File exceeds 10MB limit." });
    return;
  }

  if (!objectPath.startsWith("/objects/")) {
    res.status(400).json({ error: "Invalid object path." });
    return;
  }

  try {
    const [record] = await db
      .insert(fileUploadsTable)
      .values({
        userId,
        fileName,
        fileSize,
        contentType,
        objectPath,
        category: category ?? "other",
      })
      .returning();
    res.json({ success: true, file: record });
  } catch (err: any) {
    res.status(500).json({ error: err.message ?? "Failed to save file record" });
  }
});

router.get("/uploads/files", async (req: Request, res: Response) => {
  const userId = extractUserId(req);
  if (!userId) {
    res.status(401).json({ error: "Authorization required. Provide a valid Bearer token." });
    return;
  }

  try {
    const files = await db
      .select()
      .from(fileUploadsTable)
      .where(eq(fileUploadsTable.userId, userId))
      .orderBy(desc(fileUploadsTable.createdAt));
    res.json({ files });
  } catch (err: any) {
    res.status(500).json({ error: err.message ?? "Failed to fetch files" });
  }
});

router.delete("/uploads/files/:id", async (req: Request, res: Response) => {
  const userId = extractUserId(req);
  if (!userId) {
    res.status(401).json({ error: "Authorization required. Provide a valid Bearer token." });
    return;
  }

  const id = parseInt(String(req.params.id));
  if (isNaN(id)) {
    res.status(400).json({ error: "Invalid file id" });
    return;
  }

  try {
    const [deleted] = await db
      .delete(fileUploadsTable)
      .where(and(eq(fileUploadsTable.id, id), eq(fileUploadsTable.userId, userId)))
      .returning();

    if (!deleted) {
      res.status(404).json({ error: "File not found" });
      return;
    }

    try {
      await objectStorageService.deleteObjectEntity(deleted.objectPath);
    } catch (storageErr: any) {
      req.log.warn({ err: storageErr, objectPath: deleted.objectPath }, "Storage object deletion failed (DB row already removed)");
    }

    res.json({ success: true });
  } catch (err: any) {
    res.status(500).json({ error: err.message ?? "Failed to delete file" });
  }
});

export default router;
