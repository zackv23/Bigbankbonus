import express, { type Express } from "express";
import cors from "cors";
import helmet from "helmet";
import { rateLimit } from "express-rate-limit";
import pinoHttp from "pino-http";
import router from "./routes";
import { logger } from "./lib/logger";
import { startMonitorScheduler } from "./lib/monitorScheduler";
import { startAutopayScheduler } from "./lib/autopayScheduler";

const isProd = process.env.NODE_ENV === "production";

// Allowed origins: production domains + localhost for dev
const ALLOWED_ORIGINS = [
  "https://bigbankbonus.com",
  "https://www.bigbankbonus.com",
  // Mobile app uses a custom scheme — allow null origin for native WebView
  ...(isProd ? [] : ["http://localhost:3000", "http://localhost:5173", "http://localhost:8081"]),
];

const app: Express = express();

// Trust the first reverse proxy hop so req.ip resolves to the real client IP.
// Required for rate limiting to key per-user instead of per-proxy.
app.set("trust proxy", 1);

const captureRawBody = (
  req: express.Request & { rawBody?: Buffer },
  _res: express.Response,
  buf: Buffer,
) => {
  req.rawBody = Buffer.from(buf);
};

// ── Security headers ─────────────────────────────────────────────────────────
app.use(helmet({
  crossOriginEmbedderPolicy: false, // required for Stripe.js iframes
  contentSecurityPolicy: isProd ? undefined : false,
}));

// ── CORS ─────────────────────────────────────────────────────────────────────
app.use(cors({
  origin: (origin, cb) => {
    // Allow requests with no origin (mobile apps, curl, server-to-server)
    if (!origin) return cb(null, true);
    if (ALLOWED_ORIGINS.includes(origin)) return cb(null, true);
    cb(new Error(`CORS: origin '${origin}' not allowed`));
  },
  credentials: true,
  methods: ["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
  allowedHeaders: ["Content-Type", "Authorization", "X-Admin-Secret", "Stripe-Signature"],
}));

// ── Rate limiting ─────────────────────────────────────────────────────────────
// Global: 200 req/min per IP
const globalLimiter = rateLimit({
  windowMs: 60 * 1000,
  max: 200,
  standardHeaders: "draft-7",
  legacyHeaders: false,
  message: { error: "Too many requests, please try again later." },
  skip: () => !isProd, // only enforce in production
});

// Strict: auth + payment endpoints — 10 req/min per IP (independent per path)
function createStrictLimiter() {
  return rateLimit({
    windowMs: 60 * 1000,
    max: 10,
    standardHeaders: "draft-7",
    legacyHeaders: false,
    message: { error: "Too many requests on this endpoint, please try again later." },
    skip: () => !isProd,
  });
}

app.use(globalLimiter);
app.use(
  pinoHttp({
    logger,
    serializers: {
      req(req) {
        return {
          id: req.id,
          method: req.method,
          url: req.url?.split("?")[0],
        };
      },
      res(res) {
        return {
          statusCode: res.statusCode,
        };
      },
    },
  }),
);
app.use(express.json({ verify: captureRawBody }));
app.use(express.urlencoded({ extended: true }));

// Apply strict rate limit to sensitive endpoints (each gets its own instance)
app.use("/api/auth", createStrictLimiter());
app.use("/api/subscriptions/subscribe", createStrictLimiter());
app.use("/api/deposit/initiate", createStrictLimiter());
app.use("/api/autopay/create", createStrictLimiter());

app.use("/api", router);

startMonitorScheduler();
startAutopayScheduler();

export default app;
