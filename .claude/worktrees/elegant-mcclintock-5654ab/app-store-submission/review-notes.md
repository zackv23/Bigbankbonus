# BigBankBonus — App Store Review Notes

*Paste the content of this document into the "Review Notes" field in App Store Connect before submitting for review.*

---

## App Overview

BigBankBonus is a personal finance tool that helps users discover bank account bonuses (cash incentives banks offer for opening new accounts), track their progress toward meeting bonus requirements, and use an AI assistant to answer questions about bonus strategies.

The app does not connect to real bank accounts. It is an information and tracking tool — no banking credentials are collected, and no transactions are initiated on the user's behalf.

---

## Demo Login — No Credentials Required

**To access the full app without creating an account:**

1. Launch the app
2. On the authentication screen, tap **"Try Demo"** (the third button, labeled with a lightning bolt icon)
3. You will be immediately logged in as a demo user
4. All features are fully functional in demo mode — no email, password, or sign-in required

> Do NOT tap "Continue with Apple" or "Continue with Google" — these require an Apple ID or Google account and are not necessary to review the app.

---

## Features to Exercise During Review

Once logged in via the Demo button, please review the following screens:

### 1. Discover Tab (Home)
- Browse the list of available bank bonuses
- Tap any bonus card to view details: bonus amount, requirements, expiration, and estimated time to complete
- Use the search or filter controls to narrow results by bonus size or bank type

### 2. Accounts Tab
- View the dashboard of tracked bonus applications
- Tap "Add Bonus" to add a bonus to your tracking list (no real account connection required)
- Review the progress indicators showing which requirements are complete

### 3. Schedule Tab
- View the auto-generated calendar of upcoming deadlines and required actions
- Each calendar entry corresponds to a bonus requirement (e.g., "Make 10 debit transactions by April 30")

### 4. Analytics Tab
- View charts showing total bonuses earned, bonuses in progress, and projected earnings
- Charts use demo data pre-loaded for the demo account

### 5. AI Agent Tab
- Type any question about bank bonuses (e.g., "Which bonus has the lowest minimum deposit?" or "What do I need to do this week?")
- The AI Agent responds using OpenAI's API — an internet connection is required for this feature
- If an internet connection is unavailable during review, the tab will display an appropriate error message

---

## Credit Purchase Screen

The app includes an in-app credit purchase flow (for AI Agent usage). During review:
- The payment screen is accessible from the AI Agent tab if credits are depleted
- **No real payment will be processed.** The payment form accepts any card details and simulates a successful transaction locally — no network call to a payment processor is made in this build
- Enter any card number, any future expiry date, and any CVV to complete the simulated purchase
- The credit balance updates locally after the simulated transaction completes

---

## Biometric Authentication

- The app supports Face ID and Touch ID for secure login
- In the demo flow, biometric authentication is bypassed — the demo login proceeds directly without requiring biometrics
- If you wish to test biometrics, use a real device with Face ID or Touch ID enrolled; the app will prompt after the initial sign-in

---

## Network Requirements

The following features require an active internet connection:
- AI Agent responses (OpenAI API)

The following features work offline (including no network required):
- Viewing tracked bonuses (cached data)
- Calendar and schedule display
- Analytics for saved data
- Demo login
- Credit purchase screen (simulated locally in this build — no network call is made)

---

## Known Limitations in This Version

- Apple Sign-In and Google Sign-In are implemented but use stub/mock authentication flows in this build. Full OAuth integration is planned for version 1.1.
- The bank bonus database is currently seeded with demo data. Live data fetching via the backend API is functional when the API server is reachable.

---

## Contact for Review Questions

If the review team has any questions or encounters issues, please contact:
- Email: review@bigbankbonus.com
- Support URL: https://bigbankbonus.com/support
