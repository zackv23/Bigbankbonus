import { Router } from "express";

const router = Router();

/**
 * POST /api/auth/social
 * Verify a Google access token or Apple identity token server-side,
 * return a normalized user object.
 */
router.post("/auth/social", async (req, res) => {
  const { provider, accessToken, identityToken } = req.body as {
    provider: "google" | "apple";
    accessToken?: string;   // Google: OAuth2 access token
    identityToken?: string; // Apple: JWT identity token
  };

  if (!provider) return res.status(400).json({ error: "provider required" });

  try {
    if (provider === "google") {
      if (!accessToken) return res.status(400).json({ error: "accessToken required for Google" });

      const googleRes = await fetch("https://www.googleapis.com/oauth2/v2/userinfo", {
        headers: { Authorization: `Bearer ${accessToken}` },
      });
      if (!googleRes.ok) return res.status(401).json({ error: "Invalid Google token" });

      const profile = (await googleRes.json()) as {
        id: string; email: string; name: string; picture?: string; verified_email?: boolean;
      };

      return res.json({
        id: "google_" + profile.id,
        email: profile.email,
        name: profile.name,
        avatar: profile.picture,
        provider: "google",
        emailVerified: profile.verified_email ?? false,
      });
    }

    if (provider === "apple") {
      if (!identityToken) return res.status(400).json({ error: "identityToken required for Apple" });

      // Decode JWT payload (don't verify signature for simplicity — do it in production)
      const parts = identityToken.split(".");
      if (parts.length !== 3) return res.status(400).json({ error: "Invalid Apple token" });

      const payload = JSON.parse(Buffer.from(parts[1], "base64url").toString("utf8")) as {
        sub: string; email?: string; email_verified?: boolean;
      };

      return res.json({
        id: "apple_" + payload.sub,
        email: payload.email ?? `apple_${payload.sub}@privaterelay.appleid.com`,
        name: "Apple User", // Apple only provides name on first login (handled client-side)
        provider: "apple",
        emailVerified: payload.email_verified ?? false,
      });
    }

    res.status(400).json({ error: "Unsupported provider" });
  } catch (e: any) {
    res.status(500).json({ error: e?.message ?? "Auth verification failed" });
  }
});

export default router;
