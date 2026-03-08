# TradeLog — Forex / CFD Trading Journal

React 18 + TypeScript · Firebase (Firestore + Google Auth) · Recharts

---

## Quick Start

```bash
npm install
npm run dev     # → http://localhost:5173
```

---

## Firebase Setup (5 minutes)

### 1. Create project
→ https://console.firebase.google.com → Add project

### 2. Enable Google Auth
Build → Authentication → Sign-in method → **Google** → Enable

### 3. Create Firestore
Build → Firestore Database → Create database → **Production mode**

### 4. Paste your config
Open `src/lib/firebase.ts` — replace the placeholder values with your
Web App config from:
**Project Settings → Your apps → (add web app) → SDK snippet**

### 5. Composite index
The app needs one composite index on the `trades` collection.

**Easiest way:** just run the app. The console will show an error with a
direct Firebase link to create it in one click.

**Manual:** Firestore → Indexes → Add composite index:
- Collection: `trades`
- Fields: `userId ASC · accountId ASC · date ASC · createdAt ASC`

---

## Features

| Page | What it shows |
|---|---|
| **Dashboard** | Equity curve, win rate donut, stats, session breakdown |
| **Trades** | Full journal table with expandable rows, screenshot lightbox |
| **Calendar** | Monthly P&L grid, click any day for trade details |
| **Analytics** | Profit factor, drawdown, pair performance, psychology breakdown |

## Trade Fields
`date · session · pair · direction · lot · risk% · R:R · result · P&L · strategy · emotion · notes · screenshot`

Screenshots are stored as base64 strings in Firestore. For accounts with many trades + large screenshots, consider Firebase Storage instead (swap `b64()` in `useFirestore.ts` for an upload call).

---

## Project Structure

```
src/
├── lib/firebase.ts           ← paste your config here
├── context/AuthContext.tsx   ← Google auth
├── hooks/useFirestore.ts     ← realtime Firestore hooks
├── types/index.ts
├── pages/
│   ├── LoginPage.tsx
│   ├── DashboardPage.tsx
│   ├── TradesPage.tsx
│   ├── CalendarPage.tsx
│   └── AnalyticsPage.tsx
└── components/
    ├── Sidebar.tsx
    ├── AccountModal.tsx
    └── TradeModal.tsx
```
