import { db, subscriptionsTable } from "@workspace/db";
import { eq } from "drizzle-orm";

const STRIPE_SECRET = process.env.STRIPE_SECRET_KEY;
const STRIPE_API_VERSION = "2026-02-25.clover";

export const PRICE_IDS = {
  monthly: process.env.STRIPE_PRICE_MONTHLY ?? "price_monthly_demo",
  annual: process.env.STRIPE_PRICE_ANNUAL ?? "price_annual_demo",
  onboarding: process.env.STRIPE_PRICE_ONBOARDING ?? "price_onboarding_demo",
} as const;

export const SERVICE_FEE = 99.0;
export const ONBOARDING_FEE = 49.0;

type StripePrimitive = string | number | boolean | null | undefined;
type StripeFormBody = Record<string, StripePrimitive>;

export class StripeApiError extends Error {
  statusCode?: number;

  constructor(message: string, statusCode?: number) {
    super(message);
    this.name = "StripeApiError";
    this.statusCode = statusCode;
  }
}

function isStripeEnabled() {
  return Boolean(STRIPE_SECRET);
}

function toStripeFormData(body: StripeFormBody = {}) {
  const params = new URLSearchParams();
  for (const [key, value] of Object.entries(body)) {
    if (value === undefined || value === null) continue;
    params.set(key, String(value));
  }
  return params;
}

async function stripeRequest<T>(
  method: "GET" | "POST",
  path: string,
  body?: StripeFormBody,
  options?: {
    idempotencyKey?: string;
    stripeVersion?: string;
  },
): Promise<T> {
  if (!STRIPE_SECRET) {
    throw new StripeApiError("Stripe is not configured for this environment.");
  }

  const headers: Record<string, string> = {
    Authorization: `Bearer ${STRIPE_SECRET}`,
  };

  if (options?.idempotencyKey) {
    headers["Idempotency-Key"] = options.idempotencyKey;
  }

  if (options?.stripeVersion) {
    headers["Stripe-Version"] = options.stripeVersion;
  }

  let url = `https://api.stripe.com/v1${path}`;
  let requestBody: URLSearchParams | undefined;

  if (method === "GET" && body) {
    const query = toStripeFormData(body).toString();
    if (query) {
      url += `?${query}`;
    }
  } else if (method === "POST") {
    headers["Content-Type"] = "application/x-www-form-urlencoded";
    requestBody = toStripeFormData(body);
  }

  const res = await fetch(url, {
    method,
    headers,
    body: requestBody,
  });

  const payload = (await res.json()) as {
    error?: {
      message?: string;
      code?: string;
    };
  } & T;

  if (!res.ok || payload.error) {
    const message =
      payload.error?.message ??
      `Stripe request failed with status ${res.status}`;
    throw new StripeApiError(message, res.status);
  }

  return payload;
}

export async function stripePost<T>(
  path: string,
  body?: StripeFormBody,
  options?: {
    idempotencyKey?: string;
    stripeVersion?: string;
  },
) {
  return stripeRequest<T>("POST", path, body, options);
}

type StripeCustomer = {
  id: string;
};

type StripeSubscription = {
  id: string;
  status: string;
  current_period_end?: number | null;
};

type StripeSetupIntent = {
  id: string;
  client_secret: string;
};

type StripeEphemeralKey = {
  secret: string;
};

type StripePaymentIntent = {
  id: string;
  status: string;
};

export async function ensureStripeCustomer(params: {
  userId: string;
  email?: string;
  existingCustomerId?: string | null;
}) {
  if (!isStripeEnabled()) {
    return {
      id: params.existingCustomerId ?? `demo_cus_${params.userId}`,
    };
  }

  if (params.existingCustomerId) {
    await stripePost<StripeCustomer>(`/customers/${params.existingCustomerId}`, {
      email: params.email,
      "metadata[userId]": params.userId,
    });

    return { id: params.existingCustomerId };
  }

  return stripePost<StripeCustomer>("/customers", {
    email: params.email,
    "metadata[userId]": params.userId,
  });
}

export async function attachAndSetDefaultPaymentMethod(
  customerId: string,
  paymentMethodId: string,
) {
  if (!isStripeEnabled()) return;

  try {
    await stripePost(`/payment_methods/${paymentMethodId}/attach`, {
      customer: customerId,
    });
  } catch (error) {
    if (
      !(error instanceof StripeApiError) ||
      !error.message.toLowerCase().includes("already attached")
    ) {
      throw error;
    }
  }

  await stripePost(`/customers/${customerId}`, {
    "invoice_settings[default_payment_method]": paymentMethodId,
  });
}

export async function createOneTimeCharge(params: {
  customerId: string;
  paymentMethodId: string;
  amountCents: number;
  currency: string;
  description: string;
  userId: string;
}) {
  if (!isStripeEnabled()) {
    return {
      id: `demo_charge_${params.userId}_${Date.now()}`,
      status: "succeeded",
    };
  }

  await attachAndSetDefaultPaymentMethod(
    params.customerId,
    params.paymentMethodId,
  );

  return stripePost<StripePaymentIntent>('/payment_intents', {
    amount: params.amountCents,
    currency: params.currency,
    customer: params.customerId,
    payment_method: params.paymentMethodId,
    off_session: 'true',
    confirm: 'true',
    description: params.description,
    'metadata[userId]': params.userId,
  });
}

export async function createSubscriptionSetupIntent(params: {
  userId: string;
  email?: string;
  existingCustomerId?: string | null;
}) {
  const customer = await ensureStripeCustomer(params);

  if (!isStripeEnabled()) {
    return {
      customerId: customer.id,
      customerEphemeralKeySecret: "demo_ephemeral_key",
      setupIntentClientSecret: "seti_demo_secret",
    };
  }

  const [ephemeralKey, setupIntent] = await Promise.all([
    stripePost<StripeEphemeralKey>(
      "/ephemeral_keys",
      { customer: customer.id },
      { stripeVersion: STRIPE_API_VERSION },
    ),
    stripePost<StripeSetupIntent>("/setup_intents", {
      customer: customer.id,
      usage: "off_session",
      "automatic_payment_methods[enabled]": true,
      "metadata[userId]": params.userId,
    }),
  ]);

  return {
    customerId: customer.id,
    customerEphemeralKeySecret: ephemeralKey.secret,
    setupIntentClientSecret: setupIntent.client_secret,
  };
}

export async function activateApprovedSubscription(params: {
  userId: string;
  plan: "monthly" | "annual";
  email?: string;
  existingCustomerId?: string | null;
  defaultPaymentMethodId?: string | null;
}) {
  const { userId, plan, email, existingCustomerId, defaultPaymentMethodId } = params;

  if (!isStripeEnabled()) {
    return {
      stripeCustomerId: existingCustomerId ?? `demo_cus_${userId}`,
      stripeSubscriptionId: `demo_sub_${Date.now()}`,
      stripePriceId: PRICE_IDS[plan],
      status: "active",
      currentPeriodEnd: new Date(
        Date.now() + (plan === "annual" ? 365 : 30) * 24 * 60 * 60 * 1000,
      ),
    };
  }

  if (!defaultPaymentMethodId) {
    throw new StripeApiError(
      "No reusable payment method is on file for this customer.",
      400,
    );
  }

  const customer = await ensureStripeCustomer({
    userId,
    email,
    existingCustomerId,
  });

  await attachAndSetDefaultPaymentMethod(customer.id, defaultPaymentMethodId);

  const subscription = await stripePost<StripeSubscription>(
    "/subscriptions",
    {
      customer: customer.id,
      default_payment_method: defaultPaymentMethodId,
      "items[0][price]": PRICE_IDS[plan],
      "payment_settings[save_default_payment_method]": "on_subscription",
      "expand[]": "latest_invoice.payment_intent",
    },
    { idempotencyKey: `bbb-subscription-${userId}-${plan}` },
  );

  await stripePost(
    "/invoiceitems",
    {
      customer: customer.id,
      amount: Math.round(SERVICE_FEE * 100),
      currency: "usd",
      description: "BigBankBonus One-Time Service Fee",
    },
    { idempotencyKey: `bbb-service-fee-item-${userId}` },
  );

  await stripePost(
    "/invoices",
    {
      customer: customer.id,
      auto_advance: true,
      collection_method: "charge_automatically",
    },
    { idempotencyKey: `bbb-service-fee-invoice-${userId}` },
  );

  return {
    stripeCustomerId: customer.id,
    stripeSubscriptionId: subscription.id,
    stripePriceId: PRICE_IDS[plan],
    status: subscription.status,
    currentPeriodEnd: subscription.current_period_end
      ? new Date(subscription.current_period_end * 1000)
      : null,
  };
}

export async function cancelStripeSubscription(subscriptionId: string) {
  if (!isStripeEnabled()) return;

  await stripePost(`/subscriptions/${subscriptionId}`, {
    cancel_at_period_end: true,
  });
}

export async function upsertStoredPaymentMethod(params: {
  userId: string;
  email?: string | null;
  stripeCustomerId?: string | null;
  stripePaymentMethodId: string;
}) {
  const [existingSub] = await db
    .select()
    .from(subscriptionsTable)
    .where(eq(subscriptionsTable.userId, params.userId))
    .limit(1);

  if (existingSub) {
    await db
      .update(subscriptionsTable)
      .set({
        stripeCustomerId: params.stripeCustomerId ?? existingSub.stripeCustomerId,
        stripeDefaultPaymentMethodId: params.stripePaymentMethodId,
        billingEmail: params.email ?? existingSub.billingEmail,
        paymentMethodCollectedAt: new Date(),
        updatedAt: new Date(),
      })
      .where(eq(subscriptionsTable.userId, params.userId));
    return;
  }

  await db.insert(subscriptionsTable).values({
    userId: params.userId,
    plan: "free",
    status: "active",
    stripeCustomerId: params.stripeCustomerId ?? null,
    stripeDefaultPaymentMethodId: params.stripePaymentMethodId,
    billingEmail: params.email ?? null,
    paymentMethodCollectedAt: new Date(),
  });
}
