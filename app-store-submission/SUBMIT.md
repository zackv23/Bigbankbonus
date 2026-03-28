# BigBankBonus — Submission Step-by-Step Guide

Follow these steps in order. Each step must be complete before proceeding to the next.

---

## Prerequisites

### 1. Apple Developer Account
You must have an active Apple Developer Program membership ($99/year) at https://developer.apple.com.

### 2. Install EAS CLI
```bash
npm install -g eas-cli
```
Verify installation:
```bash
eas --version
```

### 3. Log In to EAS
```bash
eas login
```
Enter your Expo account credentials. If you don't have an Expo account, create one free at https://expo.dev.

### 4. Find Your Apple Credentials

You need three values before submitting:

**Apple Team ID**
- Log in at https://developer.apple.com
- Go to **Account → Membership Details**
- Copy the **Team ID** (format: `XXXXXXXXXX`, 10 alphanumeric characters)

**Apple ID**
- The email address associated with your Apple Developer account
- Example: `you@example.com`

**ASC App ID (App Store Connect App ID)**
- First, create the app record in App Store Connect (Step 6 below)
- After creating it, go to **App Store Connect → My Apps → BigBankBonus → General → App Information**
- Copy the **Apple ID** (a numeric value, e.g., `1234567890`)

---

## Step 1: Configure eas.json

Edit `artifacts/mobile/eas.json` and fill in your actual values:

```json
{
  "submit": {
    "production": {
      "ios": {
        "appleId": "YOUR_APPLE_ID@example.com",
        "ascAppId": "YOUR_APP_STORE_CONNECT_APP_ID",
        "appleTeamId": "YOUR_APPLE_TEAM_ID"
      }
    }
  }
}
```

Replace the three placeholder values with the credentials you gathered above.

---

## Step 2: Configure app.json

Edit `artifacts/mobile/app.json` and set your EAS project ID:

```json
"extra": {
  "eas": {
    "projectId": "YOUR_EAS_PROJECT_ID"
  }
}
```

To find or create your EAS project ID:
```bash
cd artifacts/mobile
eas init
```
This will link the project to your Expo account and populate the `projectId`.

---

## Step 3: Create the App Record in App Store Connect

1. Go to https://appstoreconnect.apple.com
2. Click **My Apps → +** (top left) → **New App**
3. Fill in:
   - **Platforms:** iOS
   - **Name:** BigBankBonus
   - **Primary Language:** English (U.S.)
   - **Bundle ID:** `com.bigbankbonus.app` *(must match app.json exactly)*
   - **SKU:** `bigbankbonus-ios-1` (any unique string)
   - **User Access:** Full Access
4. Click **Create**
5. Copy the **Apple ID** (ASC App ID) from the app's General Information page
6. Paste it into `eas.json` as the `ascAppId`

---

## Step 4: Complete App Store Connect Metadata

In App Store Connect, for version 1.0 (iOS):

1. **App Information tab:** Set primary category to Finance, secondary to Productivity
2. **Pricing and Availability:** Set price to Free, select territories
3. **App Privacy:** Complete the privacy questionnaire based on `privacy-policy.md`
   - Data collected: Name, Email (from Sign-In providers)
   - Data linked to user: Yes (via Sign-In)
   - No data sold to third parties
   - No tracking
4. **Age Rating:** Complete the questionnaire per `age-rating.md` → select 4+
5. **Version Information:**
   - Paste description from `metadata.md`
   - Upload screenshots per `screenshots-guide.md`
   - Enter keywords, subtitle, promo text from `metadata.md`
   - Enter Support URL and Marketing URL
   - Enter review notes from `review-notes.md`
6. **Export Compliance:** Answer "No" per `export-compliance.md`

---

## Step 5: Build the Production Binary

From the project root (monorepo root):

```bash
cd artifacts/mobile
eas build --platform ios --profile production
```

This will:
1. Upload your source code to EAS Build servers
2. Install dependencies
3. Compile the native iOS binary
4. Sign it with your Apple Distribution certificate (EAS manages this)
5. Produce a `.ipa` file

**Build time:** approximately 15–30 minutes.

To monitor the build:
- Watch the terminal output, or
- Go to https://expo.dev/accounts/[your-account]/projects/mobile/builds

When the build completes, you will see a download link for the `.ipa` file. **You do not need to download it** — EAS Submit will pull it automatically.

---

## Step 6: Submit to App Store Connect

Once the build is complete and your App Store Connect metadata is filled in:

```bash
eas submit --platform ios --profile production
```

EAS Submit will:
1. Authenticate with App Store Connect using your credentials
2. Upload the `.ipa` from your latest production build
3. Confirm the upload was received by Apple's servers

**Alternative — Manual Submit (if eas submit fails):**
1. Download the `.ipa` from the EAS Build dashboard
2. Open **Transporter** app (free, Mac App Store)
3. Drag the `.ipa` into Transporter and click **Deliver**

---

## Step 7: Submit for Review

After the binary appears in App Store Connect (usually within a few minutes of upload):

1. Go to App Store Connect → BigBankBonus → **iOS App → 1.0 Prepare for Submission**
2. Confirm all metadata is complete (no red warnings)
3. Under **Build**, select the build you just uploaded
4. Click **Add for Review**
5. Confirm and click **Submit to App Review**

Apple's review typically takes **24–48 hours** for new apps.

---

## Step 8: After Approval

Once Apple approves the build:
- You'll receive an email from App Store Connect
- Go to App Store Connect and choose **Release Now** or a scheduled release date
- The app will appear on the App Store within a few hours of release

---

## Useful Commands Reference

| Command | Purpose |
|---|---|
| `eas login` | Log in to your Expo account |
| `eas whoami` | Confirm you are logged in |
| `eas build --platform ios --profile production` | Build production iOS binary |
| `eas build --platform ios --profile preview` | Build internal distribution build |
| `eas build --platform ios --profile simulator` | Build for local iOS Simulator testing |
| `eas submit --platform ios --profile production` | Submit latest production build to App Store |
| `eas build:list` | List all your EAS builds |

---

## App Store Connect API Key (Optional, Recommended)

For faster and more reliable submission without password prompts, create an App Store Connect API Key:

1. Go to https://appstoreconnect.apple.com → **Users and Access → Keys**
2. Click **+** to generate a new key
3. Name it "EAS Submit", role: **App Manager**
4. Download the `.p8` file (only downloadable once)
5. Note the **Key ID** and **Issuer ID**

Configure in EAS:
```bash
eas credentials
```
Select iOS → App Store Connect API Key → and enter the Key ID, Issuer ID, and path to the `.p8` file.

Once configured, `eas submit` will not prompt for your Apple ID password.
