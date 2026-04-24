# Testing Guide: Plaid & Stripe Integration

Before deploying the onboarding, payment processing, and account automation features to production, follow this comprehensive testing plan.

---

## Pre-Testing Setup

### Environment Configuration

1. **Plaid Sandbox Credentials**
   ```bash
   # .env (api-server)
   PLAID_CLIENT_ID=<sandbox_client_id>
   PLAID_SECRET=<sandbox_secret>
   PLAID_ENV=sandbox
   PLAID_COUNTRY_CODES=US
   ```

2. **Stripe Test Keys**
   ```bash
   # .env (api-server)
   STRIPE_SECRET_KEY=sk_test_<your_test_key>
   STRIPE_PUBLISHABLE_KEY=pk_test_<your_test_key>
   STRIPE_PRICE_MONTHLY=price_test_monthly
   STRIPE_PRICE_ANNUAL=price_test_annual
   STRIPE_PRICE_ONBOARDING=price_test_onboarding
   ```

3. **Verify Environment**
   ```bash
   pnpm run build
   pnpm --filter @workspace/api-server run dev
   ```

---

## Testing Checklist

### Phase 1: Plaid Bank Linking

- [ ] **Link a Test Bank Account**
  - Open `/dashboard` (unauthenticated user → sign up)
  - Click "Connect Your Bank"
  - Use Plaid sandbox test credentials
    - Username: `user_good` / `user_custom_with_multiple_accounts`
    - Password: `pass_good`
  - Verify: Account appears in PlaidLinkCard with balance and institution name

- [ ] **Verify Account Data Retrieval**
  - `GET /plaid/items?userId=<test_user_id>`
  - Check response structure:
    ```json
    {
      "items": [
        {
          "itemId": "item_...",
          "institutionName": "Chase Bank",
          "accounts": [
            {
              "account_id": "...",
              "name": "Checking",
              "balances": { "available": 5200 }
            }
          ],
          "status": "active"
        }
      ]
    }
    ```

- [ ] **Multiple Bank Linking**
  - Link a second bank account
  - Verify both appear in the dashboard
  - Check total balance is sum of both

- [ ] **Refresh Token Handling**
  - Wait 5+ minutes
  - Manually refresh PlaidLinkCard
  - Verify balance data is still accessible

---

### Phase 2: Stripe Payment Setup

- [ ] **Create Setup Intent**
  - `POST /subscriptions/setup`
  - Request body:
    ```json
    { "userId": "test_user_123", "email": "test@example.com" }
    ```
  - Verify response includes:
    - `customerId` (Stripe customer ID)
    - `setupIntentClientSecret`
    - `customerEphemeralKeySecret`
    - `publishableKey`

- [ ] **Confirm Setup Intent in Mobile/Web**
  - Use Stripe test card: `4242 4242 4242 4242`
  - Expiry: any future date
  - CVC: any 3 digits
  - Verify: payment method is saved to customer

- [ ] **Retrieve Stored Payment Method**
  - Query `subscriptions` table
  - Verify `stripeDefaultPaymentMethodId` is stored
  - Verify `paymentMethodCollectedAt` timestamp

---

### Phase 3: Onboarding Checkout

- [ ] **One-Time Charge Success**
  - Call `POST /subscriptions/onboarding`
  - Request body:
    ```json
    {
      "userId": "test_user_123",
      "email": "test@example.com",
      "stripePaymentMethodId": "pm_test_..."
    }
    ```
  - Verify response:
    - `subscription.plan === "onboarding"`
    - `subscription.status === "active"`
    - `currentPeriodEnd` is 180 days from now
    - `onboardingFeeCharged === true`

- [ ] **Check Stripe Dashboard**
  - Log into Stripe test dashboard
  - Search for customer by email
  - Verify payment intent or charge of `$49.00 USD`
  - Verify status is `succeeded`

- [ ] **Duplicate Onboarding Prevention**
  - Call `/subscriptions/onboarding` again with same user
  - Verify error: `"Onboarding access is already active"`
  - Verify HTTP status: `409`

- [ ] **Failed Payment Handling**
  - Use Stripe test card: `4000 0000 0000 0002` (declined)
  - Call `/subscriptions/onboarding`
  - Verify error response with Stripe error details
  - Verify subscription is NOT created/updated

- [ ] **Missing Payment Method**
  - Create new user without calling `/subscriptions/setup` first
  - Call `/subscriptions/onboarding` without `stripePaymentMethodId`
  - Verify error: `"Payment method required for onboarding fee"`

---

### Phase 4: Recommendations Access

- [ ] **Gating for Onboarding Users**
  - `GET /recommendations?userId=<onboarding_user>`
  - Verify response includes:
    - `subscriptionPlan: "onboarding"`
    - `scoreCards` (bank score, linked balance, EWS score)
    - `offerCategories` (personal, business, credit_card)
    - `personalOffers`, `businessOffers`, `creditCardOffers`
    - `aiSummary` from GPT-4o

- [ ] **Bank Score Requirement Still Enforced**
  - Create user with `bankScore = 650` (below 700)
  - Even with active onboarding subscription
  - Verify error: `"Bank score of 700+ required"`
  - HTTP 403

- [ ] **Free User Blocked**
  - Create user with no subscription
  - `GET /recommendations`
  - Verify error: `"Pro subscription required"`
  - HTTP 403

---

### Phase 5: Dashboard UI Integration

- [ ] **Recommendations Display (Onboarding User)**
  - Sign in as onboarding user
  - Navigate to `/dashboard`
  - Verify:
    - Subscription card shows "Onboarding access — 6 months"
    - Score cards appear (Bank Score, Linked Balance, EWS Score)
    - Offer categories render with count
    - Personal/Business/Credit Card sections populate with offers
    - "Automate" buttons are clickable

- [ ] **Recommendations Display (Free User)**
  - Sign in as free user
  - Verify error message: "Pro subscription required for recommendations"
  - Verify CTA to upgrade

- [ ] **Offer Selection & Automation Modal**
  - Click "Automate" on a personal offer
  - Modal opens with offer details
  - Enter account number and routing number
  - Click "Start Automation"
  - Verify `POST /autopay/create` is called with correct payload
  - Verify success modal appears

---

### Phase 6: Account Automation (Autopay)

- [ ] **Create Autopay Schedule**
  - `POST /autopay/create`
  - Request body:
    ```json
    {
      "userId": "test_user_123",
      "bonusGuid": "sofi-checking",
      "bankName": "SoFi Checking & Savings",
      "bonusAmount": 300,
      "offerLink": "https://bigbankbonus.com/offers/sofi-checking",
      "section": "personal",
      "accountNumber": "123456789",
      "routingNumber": "021000021",
      "stripePaymentMethodId": "pm_test_..."
    }
    ```
  - Verify response includes:
    - `schedule.id` (unique schedule ID)
    - `schedule.status` (e.g., "pending_initial_deposit")
    - `charges[]` array with first charge details

- [ ] **Verify Schedule in Database**
  - Query `autopaySchedulesTable` for the user
  - Verify all fields are populated
  - Verify timestamps

- [ ] **Check Stripe Charges**
  - Stripe dashboard should show initial charge for direct deposit amount
  - Verify metadata includes user ID and offer GUID

---

### Phase 7: Error Scenarios

- [ ] **Invalid User ID**
  - `POST /subscriptions/setup` with `userId=""` or missing
  - Verify error: `400 Bad Request`

- [ ] **Stripe API Downtime Simulation** (demo mode fallback)
  - Unset `STRIPE_SECRET_KEY`
  - Call `/subscriptions/onboarding`
  - Verify: charges return demo charge ID (e.g., `demo_charge_user_1234567890`)
  - Verify: subscription is still created with demo data

- [ ] **Plaid Token Refresh Failure**
  - Use an expired Plaid item token
  - `GET /plaid/items` should gracefully degrade
  - Verify: user is notified to relink

- [ ] **Database Constraints**
  - Try to create two active onboarding subscriptions for same user (race condition)
  - Verify: unique constraint on `userId` or explicit duplicate check prevents collision

---

## Load Testing (Pre-Production)

- [ ] **Concurrent Onboarding Signups**
  - Simulate 10 concurrent users signing up and calling `/subscriptions/onboarding`
  - Verify: no race conditions, each user gets unique subscription
  - Verify: Stripe is called exactly once per user

- [ ] **Recommendation API Under Load**
  - 50 simultaneous requests to `/recommendations`
  - Verify: response time < 500ms
  - Verify: no timeout or 500 errors

- [ ] **Plaid Rate Limiting**
  - Make 20 requests to `/plaid/items` in 1 minute
  - Verify: Plaid sandbox handles gracefully or returns rate limit error

---

## Production Readiness Checklist

### Environment

- [ ] Stripe live keys configured (not test keys)
- [ ] Plaid production environment configured (not sandbox)
- [ ] Database migrations applied to production
- [ ] Error logging and monitoring enabled (e.g., Sentry)
- [ ] Alerts configured for failed Stripe charges, Plaid errors

### Security

- [ ] `STRIPE_WEBHOOK_SECRET` configured for webhook signature verification
- [ ] Rate limiting on `/subscriptions/onboarding` and `/autopay/create` enabled
- [ ] CORS origin whitelist includes production domain
- [ ] All payment method IDs are validated before use
- [ ] PCI compliance: no credit card data stored locally (Stripe handles)

### Monitoring

- [ ] Dashboard alerts for failed Stripe charges
- [ ] Plaid refresh token expiration monitoring
- [ ] Subscription creation success rate metric
- [ ] Autopay schedule creation latency baseline

### Data

- [ ] Production database backup configured
- [ ] Test data cleaned up (no real payment attempts in test)
- [ ] Audit trail for subscription changes and charges

---

## Rollback Plan

If issues are discovered in production:

1. **Disable onboarding endpoint**
   ```bash
   # Comment out router.post("/subscriptions/onboarding", ...)
   # Redeploy API server
   ```

2. **Revert to approved subscription model**
   - Users on onboarding plan can finish their 6 months
   - New signups directed to monthly/annual Pro pricing
   - No active charges are reversed

3. **Communicate status**
   - Email affected users
   - Update status page
   - Post in-app notification

---

## Sign-Off

- [ ] QA: All test cases passed
- [ ] Backend: Code review completed
- [ ] Frontend: UI/UX review completed
- [ ] DevOps: Production environment ready
- [ ] Product: Business logic confirmed
- [ ] Legal: Terms of Service and privacy policy reviewed

**Date Tested:** ___________  
**Tested By:** ___________  
**Sign-Off Date:** ___________
