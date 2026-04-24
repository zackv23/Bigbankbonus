# BigBankBonus — iOS App Store Pre-Submission Checklist

Work through each section in order. Check every item before triggering `eas submit`.

---

## 1. App Icon & Visual Assets

- [ ] App icon is 1024×1024 px, PNG, no alpha channel, no rounded corners (Apple applies rounding)
- [ ] Icon has no text overlaid (Apple guidelines discourage text in icons)
- [ ] Splash/launch image is present in `assets/images/splash-icon.png`
- [ ] All icon sizes are generated (EAS Build handles this automatically from the 1024px source)

---

## 2. Screenshots

- [ ] iPhone 6.7″ screenshots captured (1290×2796 px) — minimum 3, maximum 10
- [ ] iPhone 6.5″ screenshots captured (1242×2688 px) — required for older devices
- [ ] iPhone 5.5″ screenshots captured (1242×2208 px) — required if supporting older devices
- [ ] Each screenshot shows a real in-app state (no placeholder mockups)
- [ ] Screenshots include captions/annotations if needed for clarity
- [ ] See `screenshots-guide.md` for suggested content per screen

---

## 3. App Store Connect Metadata

- [ ] App name set: **BigBankBonus** (≤30 chars)
- [ ] Subtitle set (≤30 chars) — see `metadata.md`
- [ ] Full description written (≤4000 chars) — see `metadata.md`
- [ ] Keywords entered (≤100 chars, comma-separated) — see `metadata.md`
- [ ] Promotional text added (≤170 chars) — see `metadata.md`
- [ ] Support URL is live and accessible
- [ ] Marketing URL is live (optional but recommended)
- [ ] Primary category: **Finance**
- [ ] Secondary category: **Productivity**

---

## 4. Privacy & Legal

- [ ] Privacy Policy URL is publicly accessible (host `privacy-policy.md` as a static page)
- [ ] Privacy questionnaire completed in App Store Connect (data collection, tracking)
- [ ] `PrivacyInfo.xcprivacy` is included in the iOS build (file present at `artifacts/mobile/PrivacyInfo.xcprivacy`)
- [ ] No third-party ad/analytics SDKs that require ATT prompt
- [ ] Export compliance declaration completed — see `export-compliance.md`

---

## 5. App Configuration

- [ ] Bundle identifier set to `com.bigbankbonus.app` in `app.json`
- [ ] Version set to `1.0.0`, build number `1` in `app.json`
- [ ] Minimum iOS version set to `16.0`
- [ ] `usesAppleSignIn: true` declared in `app.json`
- [ ] All `NSUsageDescription` strings are present and descriptive (see `app.json` `infoPlist`)
- [ ] EAS project ID set in `app.json` `extra.eas.projectId`

---

## 6. EAS Build & Submit Configuration

- [ ] `eas.json` present with `production`, `preview`, and `simulator` profiles
- [ ] Apple ID, ASC App ID, and Apple Team ID filled in `eas.json` submit profile
- [ ] EAS CLI installed: `npm install -g eas-cli`
- [ ] Logged into EAS: `eas login`
- [ ] App record created in App Store Connect before submitting
- [ ] App Store Connect API key configured (optional, speeds up submission)

---

## 7. App Review Notes

- [ ] Review notes written — see `review-notes.md`
- [ ] Demo account credentials documented in review notes (Demo login requires no credentials)
- [ ] All in-app purchase items (if any) configured in App Store Connect
- [ ] No features that require special reviewer capabilities (physical hardware, VPN, etc.)

---

## 8. Age Rating

- [ ] Age rating questionnaire answered in App Store Connect — see `age-rating.md`
- [ ] Final rating: **4+** (no objectionable content)

---

## 9. Final Binary Check

- [ ] `eas build --platform ios --profile production` completed successfully
- [ ] Build artifact downloaded and tested on a physical iPhone (iOS 16+)
- [ ] No crash on launch
- [ ] Demo login flow works end-to-end
- [ ] Stripe payment screen renders (test mode OK for review)
- [ ] All tab screens load: Discover, Accounts, Schedule, Analytics, AI Agent
- [ ] Face ID/Touch ID prompt appears when configured

---

## 10. Submission

- [ ] Binary uploaded via `eas submit --platform ios --profile production`
- [ ] "Ready for Review" status confirmed in App Store Connect
- [ ] Review notes submitted in App Store Connect reviewer instructions field
- [ ] Phased release or immediate release selected
