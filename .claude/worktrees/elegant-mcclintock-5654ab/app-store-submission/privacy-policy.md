# Privacy Policy — BigBankBonus

**Effective Date:** March 28, 2026
**Last Updated:** March 28, 2026

BigBankBonus ("we," "our," or "us") is committed to protecting your privacy. This Privacy Policy explains what information we collect, how we use it, and your rights with respect to your personal data when you use the BigBankBonus mobile application ("App").

---

## 1. Information We Collect

### 1.1 Information You Provide

- **Account Information:** When you create an account using Apple Sign-In or Google Sign-In, we receive your name, email address, and a unique identifier from the authentication provider. This information is stored locally on your device.
- **Demo Account:** If you use the Demo login, no personal information is collected or transmitted. A temporary local session is created on your device only.
- **Bank Bonus Records:** Information you enter about bank bonuses you are tracking (bank names, bonus amounts, requirement notes, account status) is stored locally on your device.

### 1.2 Information Collected Automatically

- **Device Storage:** We use AsyncStorage and Expo SecureStore (iOS Keychain) to persist your app state, authentication tokens, and PIN/biometric preferences entirely on your device. This data never leaves your device except as described below.
- **App Usage Data:** We do not use any third-party analytics or crash-reporting SDKs. We do not collect behavioral analytics, session recordings, or usage heatmaps.

### 1.3 Information Shared with Third Parties

- **OpenAI (AI Agent):** When you interact with the AI Agent feature, the text of your queries is transmitted to OpenAI's API to generate responses. OpenAI's data retention and privacy practices are described at https://openai.com/privacy. We do not send personally identifiable information (such as your name or email) to OpenAI as part of AI queries.
- **Stripe (Payments):** The App includes a credit purchase screen for AI Agent usage. In the current release (1.0.0), payment processing is simulated locally on your device — no card data is transmitted to Stripe or any payment processor. A future release will integrate live Stripe payment processing. When live Stripe integration is active, your payment will be processed by Stripe, Inc., and their privacy policy will apply: https://stripe.com/privacy. We will not store your card number or payment credentials on our servers or your device.
- **Apple Sign-In / Google Sign-In:** Authentication is handled by Apple and Google respectively. We receive only the information those providers share with us (name, email, unique ID). We do not receive or store passwords.

---

## 2. How We Use Your Information

We use the information described above to:

- Authenticate you and maintain your session
- Display your bank bonus tracking data within the App
- Generate AI-powered responses to your queries (via OpenAI)
- Process credit purchases (via Stripe)
- Provide Face ID / Touch ID authentication for secure app access

We do **not** use your information to:

- Serve targeted advertisements
- Sell or rent your data to third parties
- Profile you across apps or websites
- Build marketing databases

---

## 3. Data Storage and Security

- **On-Device Storage:** Your user profile, bonus records, and preferences are stored locally using AsyncStorage (for non-sensitive data) and Expo SecureStore backed by the iOS Keychain (for sensitive data such as PINs).
- **Biometric Data:** We do not access or store your biometric data (fingerprints, Face ID templates). Biometric authentication is handled entirely by Apple's LocalAuthentication framework. We receive only a pass/fail result.
- **No Server-Side Storage:** BigBankBonus does not operate a backend database that stores your personal data. All data is stored on your device.
- **Transmission Security:** All network requests (to OpenAI and Stripe) are made over HTTPS/TLS.

---

## 4. Data Retention

Your data is stored on your device for as long as you have the App installed. Uninstalling the App removes all locally stored data. If you use Apple Sign-In or Google Sign-In, the authentication session may persist in your device's Keychain until you explicitly sign out or revoke access through your Apple/Google account settings.

---

## 5. Children's Privacy

BigBankBonus is not directed at children under the age of 13. We do not knowingly collect personal information from children under 13. If you believe a child under 13 has provided us with personal information, please contact us at the address below and we will take steps to delete such information.

---

## 6. Your Rights

### California Residents (CCPA)
If you are a California resident, you have the right to:
- **Know** what personal information we collect, use, disclose, or sell
- **Delete** your personal information (note: most data is stored only on your device and can be deleted by uninstalling the App)
- **Opt out of sale** of your personal information — we do not sell personal information
- **Non-discrimination** for exercising your CCPA rights

To exercise these rights, contact us at privacy@bigbankbonus.com.

### European Residents (GDPR)
If you are located in the European Economic Area, you have the right to:
- **Access** the personal data we hold about you
- **Rectification** of inaccurate personal data
- **Erasure** ("right to be forgotten") of your personal data
- **Restriction** of processing
- **Data portability**
- **Object** to processing based on legitimate interests
- **Lodge a complaint** with your local supervisory authority

Because BigBankBonus stores data primarily on your device, most of these rights can be exercised directly by managing your App data and account settings. For requests involving data transmitted to OpenAI or Stripe, please contact us.

---

## 7. Third-Party Links

The App may display information about external bank websites and offers. We are not responsible for the privacy practices of those external sites. We encourage you to review the privacy policy of any bank or financial institution whose bonus you pursue.

---

## 8. Changes to This Policy

We may update this Privacy Policy from time to time. When we do, we will update the "Last Updated" date at the top of this document. If changes are material, we will notify you through the App or by email. Continued use of the App after changes become effective constitutes your acceptance of the revised policy.

---

## 9. Contact Us

If you have questions or concerns about this Privacy Policy, please contact us:

**BigBankBonus**
Email: privacy@bigbankbonus.com
Website: https://bigbankbonus.com/privacy

---

*This privacy policy is intended to satisfy the requirements of the Apple App Store Review Guidelines (§5.1), the California Consumer Privacy Act (CCPA), and the General Data Protection Regulation (GDPR). Host this document at a publicly accessible URL before submitting to the App Store.*
