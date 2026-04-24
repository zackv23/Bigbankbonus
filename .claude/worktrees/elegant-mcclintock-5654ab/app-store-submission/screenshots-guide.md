# BigBankBonus — Screenshots Guide

This document specifies the exact dimensions Apple requires, the suggested content for each screenshot, and tooling recommendations for capturing them.

---

## Required Dimensions

Apple requires screenshots for specific device classes. All screenshots must be in PNG or JPEG format.

| Device Class | Resolution | Status |
|---|---|---|
| iPhone 6.7″ (iPhone 15 Pro Max, 16 Pro Max) | **1290 × 2796 px** | **Required** |
| iPhone 6.5″ (iPhone 11 Pro Max, XS Max) | **1242 × 2688 px** | **Required** |
| iPhone 5.5″ (iPhone 8 Plus) | **1242 × 2208 px** | **Required** |
| iPad Pro 12.9″ (6th gen) | 2048 × 2732 px | Optional (not needed if supportsTablet: false) |

> BigBankBonus sets `supportsTablet: false`, so iPad screenshots are not required.

You must provide **3–10 screenshots** per device class.

---

## Capturing Screenshots

### Option A: Xcode Simulator (Recommended)

1. Build the app for simulator: `eas build --platform ios --profile simulator`
2. Open the `.app` file in Xcode Simulator
3. Select the correct simulator device (e.g., "iPhone 16 Pro Max" for 6.7″)
4. Navigate to the desired screen
5. Press **Cmd+S** in Simulator to capture a screenshot (saves to Desktop)
6. Verify the dimensions match the table above

### Option B: Physical Device via Xcode Instruments
1. Connect a physical iPhone
2. Run the app via Xcode
3. Take a screenshot on the device (Side button + Volume Up)
4. Export from Photos app at full resolution

### Option C: Design Tools (Mockup Frames)
If using Figma or Sketch device frames:
- Use the **iPhone 15 Pro Max** frame for 6.7″ (1290×2796 artboard)
- Use the **iPhone 11 Pro Max** frame for 6.5″ (1242×2688 artboard)
- Export at **1x** (the artboard IS the pixel dimensions)
- Do not add device chrome if submitting screenshots with Apple's own frame overlay tool

---

## Suggested Screenshot Content (3–6 Recommended)

### Screenshot 1 — Discover Screen (Hero)
**Screen:** Discover tab (home screen)
**Content:** Show the bonus list with several high-value bonuses visible (e.g., "$300 Chase Checking Bonus", "$200 Citi Checking Bonus"). Use dark mode for a premium look.
**Caption suggestion:** "Discover hundreds of bank bonuses"

### Screenshot 2 — Bonus Detail
**Screen:** A tapped bonus detail card
**Content:** Full bonus detail view showing bonus amount, requirements checklist, deadline, and estimated completion time. Highlight the requirement progress bar.
**Caption suggestion:** "Track every requirement, step by step"

### Screenshot 3 — AI Agent
**Screen:** AI Agent tab with a conversation visible
**Content:** Show a sample exchange: user asks "Which bonuses expire this month?" and the AI responds with a clean, helpful list.
**Caption suggestion:** "Your AI bonus coach, always on"

### Screenshot 4 — Schedule Tab
**Screen:** Calendar/Schedule tab
**Content:** A weekly calendar view showing upcoming bonus deadlines color-coded by bank. Show at least 3–4 upcoming events.
**Caption suggestion:** "Never miss a bonus deadline"

### Screenshot 5 — Accounts Dashboard
**Screen:** Accounts tab
**Content:** Dashboard view showing 2–3 tracked bonuses with progress bars, total earned counter at the top (e.g., "$850 earned"), and status badges.
**Caption suggestion:** "Your bonus pipeline at a glance"

### Screenshot 6 — Analytics
**Screen:** Analytics tab
**Content:** Bar chart showing monthly earnings, a total earned counter, and a breakdown by bank category. Use sample data showing steady growth.
**Caption suggestion:** "See your earnings grow over time"

---

## Figma Frame Recommendations

If creating designed mockups in Figma:
- Create an artboard named **"iPhone 6.7 — [Screen Name]"** at 1290×2796 px
- Use Figma's built-in **"iPhone 15 Pro Max"** frame (Community → iOS UI Kits)
- Export each artboard as **PNG at 1x**
- For status bar, use a light/dark system status bar component (time: 9:41, full battery, full signal)
- Apply the BigBankBonus gradient (`#833AB4 → #E1306C → #F77737`) to splash/auth screens for visual consistency

---

## App Store Connect Upload

1. In App Store Connect, navigate to your app → **iOS App** → **App Screenshots**
2. Select the device class tab (6.7″, 6.5″, 5.5″)
3. Drag and drop your PNG files into the appropriate slot
4. Drag to reorder — the first screenshot is the most prominent in search results
5. Add optional caption text (displayed below screenshot in product page; localized per language)
