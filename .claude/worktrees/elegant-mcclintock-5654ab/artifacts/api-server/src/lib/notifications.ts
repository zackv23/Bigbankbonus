/**
 * Notification service — email via SMTP (Nodemailer) + SMS via Twilio.
 * All credentials are optional; falls back silently if not configured.
 *
 * Required env vars:
 *   Email:  SMTP_HOST, SMTP_PORT, SMTP_USER, SMTP_PASS, SMTP_FROM
 *   SMS:    TWILIO_ACCOUNT_SID, TWILIO_AUTH_TOKEN, TWILIO_FROM_NUMBER
 *   Push:   EXPO_PUSH_ACCESS_TOKEN (optional, for server-sent Expo push)
 */

import nodemailer from "nodemailer";

const SMTP_HOST = process.env.SMTP_HOST;
const SMTP_USER = process.env.SMTP_USER;
const SMTP_PASS = process.env.SMTP_PASS;
const SMTP_FROM = process.env.SMTP_FROM ?? "noreply@bigbankbonus.com";
const SMTP_PORT = parseInt(process.env.SMTP_PORT ?? "587", 10);

const TWILIO_SID    = process.env.TWILIO_ACCOUNT_SID;
const TWILIO_TOKEN  = process.env.TWILIO_AUTH_TOKEN;
const TWILIO_FROM   = process.env.TWILIO_FROM_NUMBER;

const EXPO_PUSH_URL = "https://exp.host/--/api/v2/push/send";

// ─── Email ─────────────────────────────────────────────────────────────────────

let _mailer: nodemailer.Transporter | null = null;
function getMailer(): nodemailer.Transporter | null {
  if (!SMTP_HOST || !SMTP_USER || !SMTP_PASS) return null;
  if (!_mailer) {
    _mailer = nodemailer.createTransport({
      host: SMTP_HOST,
      port: SMTP_PORT,
      secure: SMTP_PORT === 465,
      auth: { user: SMTP_USER, pass: SMTP_PASS },
    });
  }
  return _mailer;
}

export async function sendEmail(opts: {
  to: string;
  subject: string;
  html: string;
  text?: string;
}): Promise<boolean> {
  const mailer = getMailer();
  if (!mailer) return false;
  try {
    await mailer.sendMail({ from: SMTP_FROM, ...opts });
    return true;
  } catch (err) {
    console.error("[notifications] email failed:", err);
    return false;
  }
}

// ─── SMS ───────────────────────────────────────────────────────────────────────

async function twilioRequest(path: string, body: Record<string, string>): Promise<boolean> {
  if (!TWILIO_SID || !TWILIO_TOKEN || !TWILIO_FROM) return false;
  try {
    const res = await fetch(`https://api.twilio.com/2010-04-01/Accounts/${TWILIO_SID}${path}`, {
      method: "POST",
      headers: {
        Authorization: `Basic ${Buffer.from(`${TWILIO_SID}:${TWILIO_TOKEN}`).toString("base64")}`,
        "Content-Type": "application/x-www-form-urlencoded",
      },
      body: new URLSearchParams(body).toString(),
    });
    return res.ok;
  } catch (err) {
    console.error("[notifications] SMS failed:", err);
    return false;
  }
}

export async function sendSMS(to: string, body: string): Promise<boolean> {
  return twilioRequest(`/Messages.json`, { From: TWILIO_FROM!, To: to, Body: body });
}

// ─── Expo Push ─────────────────────────────────────────────────────────────────

export async function sendPushNotification(opts: {
  to: string | string[];       // Expo push token(s)
  title: string;
  body: string;
  data?: Record<string, unknown>;
  badge?: number;
}): Promise<boolean> {
  try {
    const tokens = Array.isArray(opts.to) ? opts.to : [opts.to];
    const messages = tokens.map(token => ({
      to: token,
      title: opts.title,
      body: opts.body,
      data: opts.data ?? {},
      badge: opts.badge ?? 1,
      sound: "default",
    }));
    const res = await fetch(EXPO_PUSH_URL, {
      method: "POST",
      headers: { "Content-Type": "application/json", Accept: "application/json" },
      body: JSON.stringify(messages),
    });
    return res.ok;
  } catch (err) {
    console.error("[notifications] push failed:", err);
    return false;
  }
}

// ─── Template helpers ──────────────────────────────────────────────────────────

export function autopayChargedEmail(opts: {
  bankName: string;
  chargeAmount: number;
  achAmount: number;
  ddOutDate: string;
  ddInDate: string;
  cycleCount: number;
  endsAt: string;
}): { subject: string; html: string; text: string } {
  return {
    subject: `BigBankBonus: Cycle ${opts.cycleCount} started — ${opts.bankName}`,
    html: `
      <div style="font-family:sans-serif;max-width:540px;margin:auto">
        <div style="background:linear-gradient(135deg,#833AB4,#E1306C,#F77737);padding:24px;border-radius:12px 12px 0 0">
          <h1 style="color:#fff;margin:0;font-size:22px">💸 Autopay Cycle ${opts.cycleCount} Started</h1>
          <p style="color:rgba(255,255,255,0.8);margin:6px 0 0">${opts.bankName}</p>
        </div>
        <div style="padding:24px;background:#fff;border:1px solid #eee;border-top:none">
          <table style="width:100%;border-collapse:collapse">
            <tr><td style="padding:8px 0;color:#666">CC Charged</td><td style="text-align:right;font-weight:bold;color:#E1306C">$${opts.chargeAmount}</td></tr>
            <tr><td style="padding:8px 0;color:#666">ACH Push Amount</td><td style="text-align:right;font-weight:bold;color:#F77737">$${opts.achAmount}</td></tr>
            <tr><td style="padding:8px 0;color:#666">ACH Push Date</td><td style="text-align:right;font-weight:bold">${opts.ddOutDate}</td></tr>
            <tr><td style="padding:8px 0;color:#666">ACH Pull Date</td><td style="text-align:right;font-weight:bold">${opts.ddInDate}</td></tr>
            <tr><td style="padding:8px 0;color:#666;border-top:1px solid #eee">Program Ends</td><td style="text-align:right;color:#833AB4;border-top:1px solid #eee">${opts.endsAt}</td></tr>
          </table>
          <p style="font-size:12px;color:#999;margin-top:24px">Track your progress at <a href="https://bigbankbonus.com">bigbankbonus.com</a></p>
        </div>
      </div>`,
    text: `BigBankBonus Cycle ${opts.cycleCount}: CC charged $${opts.chargeAmount}. ACH push $${opts.achAmount} on ${opts.ddOutDate}. Pull on ${opts.ddInDate}. Program ends ${opts.endsAt}.`,
  };
}

export function autopayRefundedEmail(opts: {
  bankName: string;
  chargeAmount: number;
  totalCycles: number;
  totalAchVolume: number;
}): { subject: string; html: string; text: string } {
  return {
    subject: `BigBankBonus: 91-day program complete — $${opts.chargeAmount} refunded`,
    html: `
      <div style="font-family:sans-serif;max-width:540px;margin:auto">
        <div style="background:linear-gradient(135deg,#833AB4,#E1306C,#F77737);padding:24px;border-radius:12px 12px 0 0">
          <h1 style="color:#fff;margin:0;font-size:22px">✅ 91-Day Program Complete!</h1>
          <p style="color:rgba(255,255,255,0.8);margin:6px 0 0">${opts.bankName}</p>
        </div>
        <div style="padding:24px;background:#fff;border:1px solid #eee;border-top:none">
          <p style="font-size:18px;font-weight:bold;color:#4CAF50">Your $${opts.chargeAmount} has been refunded to your credit card.</p>
          <table style="width:100%;border-collapse:collapse;margin-top:16px">
            <tr><td style="padding:8px 0;color:#666">Total Cycles Completed</td><td style="text-align:right;font-weight:bold">${opts.totalCycles}</td></tr>
            <tr><td style="padding:8px 0;color:#666">Total ACH Volume</td><td style="text-align:right;font-weight:bold;color:#833AB4">$${opts.totalAchVolume.toLocaleString()}</td></tr>
          </table>
          <p style="font-size:13px;color:#666;margin-top:16px">Your bank bonuses will continue to post over the next 30-90 days per the bank's terms.</p>
        </div>
      </div>`,
    text: `BigBankBonus 91-day program complete! $${opts.chargeAmount} refunded. ${opts.totalCycles} cycles, $${opts.totalAchVolume.toLocaleString()} total ACH volume.`,
  };
}

export function monthlyStatementEmail(opts: {
  month: string;
  cycles: number;
  achVolume: number;
  estimatedBonuses: number;
  items: { date: string; type: string; amount: number; status: string }[];
}): { subject: string; html: string; text: string } {
  const rows = opts.items.map(i =>
    `<tr><td style="padding:6px 8px;color:#666">${i.date}</td><td style="padding:6px 8px">${i.type}</td><td style="padding:6px 8px;text-align:right;color:${i.amount > 0 ? "#4CAF50" : "#E1306C"}">$${Math.abs(i.amount)}</td><td style="padding:6px 8px;color:#999">${i.status}</td></tr>`
  ).join("");
  return {
    subject: `BigBankBonus Monthly Statement — ${opts.month}`,
    html: `
      <div style="font-family:sans-serif;max-width:580px;margin:auto">
        <div style="background:linear-gradient(135deg,#833AB4,#E1306C,#F77737);padding:24px;border-radius:12px 12px 0 0">
          <h1 style="color:#fff;margin:0;font-size:20px">📊 Monthly Statement — ${opts.month}</h1>
        </div>
        <div style="padding:24px;background:#fff;border:1px solid #eee;border-top:none">
          <div style="display:flex;gap:16px;flex-wrap:wrap;margin-bottom:20px">
            <div style="flex:1;background:#f5f5f5;padding:14px;border-radius:10px"><div style="color:#666;font-size:12px">ACH Cycles</div><div style="font-size:24px;font-weight:bold;color:#833AB4">${opts.cycles}</div></div>
            <div style="flex:1;background:#f5f5f5;padding:14px;border-radius:10px"><div style="color:#666;font-size:12px">ACH Volume</div><div style="font-size:24px;font-weight:bold;color:#F77737">$${opts.achVolume.toLocaleString()}</div></div>
            <div style="flex:1;background:#f5f5f5;padding:14px;border-radius:10px"><div style="color:#666;font-size:12px">Est. Bonuses</div><div style="font-size:24px;font-weight:bold;color:#4CAF50">$${opts.estimatedBonuses.toLocaleString()}</div></div>
          </div>
          <table style="width:100%;border-collapse:collapse">
            <thead><tr style="background:#f5f5f5"><th style="padding:8px;text-align:left;font-size:12px;color:#666">Date</th><th style="padding:8px;text-align:left;font-size:12px;color:#666">Type</th><th style="padding:8px;text-align:right;font-size:12px;color:#666">Amount</th><th style="padding:8px;text-align:left;font-size:12px;color:#666">Status</th></tr></thead>
            <tbody>${rows}</tbody>
          </table>
        </div>
      </div>`,
    text: `BigBankBonus ${opts.month}: ${opts.cycles} cycles, $${opts.achVolume} ACH volume, ~$${opts.estimatedBonuses} bonuses.`,
  };
}
