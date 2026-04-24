# BigBankBonus — Export Compliance

This document records the export compliance answers for submission to the App Store. **No Bureau of Industry and Security (BIS) paperwork is required.**

---

## Apple Export Compliance Question

Apple asks during submission:

> "Does your app use, contain, or incorporate encryption beyond what is provided by Apple?"

**Answer: No**

---

## Explanation

BigBankBonus uses **only standard HTTPS/TLS encryption** provided by the iOS operating system and Apple's built-in networking stack. All network communication (to the OpenAI API, Stripe, and any backend API endpoints) uses iOS's built-in `URLSession` / `fetch` APIs over HTTPS.

The app does not:

- Implement any custom or proprietary encryption algorithms
- Include any third-party encryption libraries beyond what Apple and the Expo/React Native framework provide
- Use VPNs, custom TLS implementations, or end-to-end encryption of any kind
- Perform any encryption of user data in transit beyond standard HTTPS

### Exempt from EAR Reporting

Under U.S. Export Administration Regulations (EAR), encryption that is:
- Publicly available (open-source or standard)
- Using standard OS-provided TLS/SSL
- Not designed for non-standard encryption purposes

...is classified under **EAR99** or is otherwise **exempt from encryption export controls** under **License Exception ENC** (15 CFR § 740.17) and the **HTTPS exemption** (15 CFR § 742.15(b)).

BigBankBonus meets all criteria for this exemption. No BIS classification request (CCATS) is required.

---

## Expo SecureStore

The app uses `expo-secure-store` to store sensitive data in the iOS Keychain. This library uses iOS's built-in Keychain APIs and system-provided encryption. It does not implement custom encryption. This is covered under Apple's own encryption and does not require additional export compliance documentation.

---

## App Store Connect Answer

When prompted during submission in App Store Connect, select:

> **"No, my app does not use encryption, or my app only uses exempt encryption"**

This is the correct selection for BigBankBonus.

---

## Record Keeping

This document serves as an internal record of the export compliance determination for version 1.0.0 of BigBankBonus (bundle ID: com.bigbankbonus.app). Retain this document for your records as required by App Store Connect policies.
