# Stripe and Plaid Setup

This project already contains partial Stripe and Plaid wiring. The remaining work is mostly environment configuration plus a few platform dashboard steps.

## What is already wired

- Stripe subscription setup endpoint: `POST /api/subscriptions/setup`
- Stripe approval-gated subscription activation: `POST /api/subscriptions/subscribe`
- Stripe webhook handler: `POST /api/webhooks/stripe`
- Plaid link token endpoint: `POST /api/plaid/link-token`
- Plaid public-token exchange endpoint: `POST /api/plaid/exchange-token`
- Plaid balance and transaction reads

## Important limitation

The `POST /api/deposit/:id/execute-ach` route now uses Plaid Transfer for live ACH automation when a matching Plaid-linked destination account exists.

Important constraints:
- The destination account must be linked through Plaid.
- The linked Plaid account should match the target account's last 4 digits.
- Your Plaid account must have `Transfer` product access enabled.

If you want to send ACH to completely unlinked third-party bank accounts, you will still need a different payout rail such as:
- Dwolla
- Modern Treasury
- Another provider that supports outbound ACH credits to non-Plaid-linked accounts

## Stripe setup steps

1. Create or open your Stripe account.
2. In Stripe Dashboard, get:
   - `STRIPE_SECRET_KEY`
   - `STRIPE_PUBLISHABLE_KEY`
3. Create the recurring prices you want to bill against.
   - Monthly plan price
   - Annual plan price
4. Copy those price IDs into:
   - `STRIPE_PRICE_MONTHLY`
   - `STRIPE_PRICE_ANNUAL`
5. Add the same publishable key to:
   - `EXPO_PUBLIC_STRIPE_PUBLISHABLE_KEY`
6. For iOS native payments, set:
   - `EXPO_PUBLIC_STRIPE_MERCHANT_IDENTIFIER`
7. In Stripe Dashboard, create a webhook endpoint pointing to:
   - `https://<your-domain>/api/webhooks/stripe`
8. Subscribe that webhook to at least:
   - `setup_intent.succeeded`
   - `customer.subscription.updated`
   - `customer.subscription.deleted`
   - `invoice.payment_failed`
   - `invoice.paid`
   - `payment_intent.succeeded`
   - `payment_intent.payment_failed`
9. Copy the webhook signing secret into:
   - `STRIPE_WEBHOOK_SECRET`
10. Restart the API server after updating env vars.

## Plaid setup steps

1. Create or open your Plaid account.
2. In Plaid Dashboard, get:
   - `PLAID_CLIENT_ID`
   - `PLAID_SECRET`
3. Set the environment:
   - `PLAID_ENV=sandbox` for testing
   - `PLAID_ENV=development` or `production` when ready
4. Make sure your Plaid account has access to the `Transfer` product.
5. Configure an allowed redirect URI in Plaid Dashboard.
6. Set that same URI in:
   - `PLAID_REDIRECT_URI`
7. If you use the mobile app browser flow, make sure:
   - `EXPO_PUBLIC_DOMAIN` is set
   - `https://<your-domain>/plaid-callback` is reachable
8. Restart the API server after updating env vars.

## Minimum env vars to fill in first

- `DATABASE_URL`
- `ADMIN_SECRET`
- `EXPO_PUBLIC_DOMAIN`
- `STRIPE_SECRET_KEY`
- `STRIPE_PUBLISHABLE_KEY`
- `EXPO_PUBLIC_STRIPE_PUBLISHABLE_KEY`
- `STRIPE_WEBHOOK_SECRET`
- `STRIPE_PRICE_MONTHLY`
- `STRIPE_PRICE_ANNUAL`
- `PLAID_CLIENT_ID`
- `PLAID_SECRET`
- `PLAID_ENV`
- `PLAID_REDIRECT_URI`

## Recommended bring-up order

1. Fill out `.env` from `.env.example`.
2. Verify database connectivity.
3. Verify Stripe `/api/subscriptions/setup` returns a real customer and setup intent.
4. Verify Stripe webhook delivery.
5. Verify Plaid `/api/plaid/link-token` returns a real token instead of sandbox fallback.
6. Verify Plaid token exchange and linked-account storage.
7. Verify your Plaid account can successfully create `/transfer/authorization/create` and `/transfer/create` calls.
8. Link the destination bank account with Plaid so the ACH target exists as a real Plaid-linked account.
