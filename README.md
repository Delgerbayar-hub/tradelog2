# TradeLog — Forex / CFD Trading Journal

A personal trading journal built with React 18 + TypeScript, Firebase (Firestore + Email Auth), and Recharts.

---

## Quick Start

```bash
npm install
npm run dev     # → http://localhost:5173
```

---

## Firebase Setup

### 1. Create a project
Go to https://console.firebase.google.com → Add project

### 2. Enable Email/Password Auth
Build → Authentication → Sign-in method → **Email/Password** → Enable

### 3. Create Firestore
Build → Firestore Database → Create database → **Production mode**

### 4. Add your config
Open `src/lib/firebase.ts` and replace the placeholder values with your Web App config:
**Project Settings → Your apps → (add web app) → SDK snippet**

### 5. Composite index
The app requires one composite index on the `trades` collection.

**Easiest:** run the app and click the Firebase link printed in the console.

**Manual:** Firestore → Indexes → Add composite index:
- Collection: `trades`
- Fields: `userId ASC · date ASC · createdAt ASC`

---

## Features

| Page | Description |
|---|---|
| **Dashboard** | Equity curve, win rate, net P&L, best/worst trade, session breakdown — filterable by account |
| **Trades** | Full journal table with expandable detail rows and screenshot lightbox |
| **Calendar** | Monthly P&L grid with daily PNL color coding, click any day to view trades |
| **Profile** | Manage trading accounts (Personal / Challenge / Funded / Demo / Contest), pairs, avatar, and bio |

---

## Account Status System

Each trading account has one of three statuses:

| Status | Trade form | Dashboard / Calendar / Trades | Analytics |
|--------|-----------|-------------------------------|-----------|
| **Active** | Shown | Included | Included |
| **Inactive** | Hidden | Included | Configurable |
| **Archived** | Hidden | Hidden | Excluded |

Archived accounts preserve all trade data — they are simply hidden from the main views.

---

## Trade Fields

`date · account · pair · direction · lot size · session · risk% · R:R ratio · setup · entry details · psychology · plan execution · confidence · result · gain R:R · gain% · P&L · closed by · review · screenshots (before/after)`

> Screenshots are stored as base64 strings in Firestore. For high-volume accounts with large images, consider migrating to Firebase Storage.

---

## Project Structure

```
src/
├── lib/
│   ├── firebase.ts           ← paste your Firebase config here
│   ├── format.ts             ← number formatters (fmtPnl, fmtBalance)
│   └── accounts.ts           ← account status helpers
├── context/AuthContext.tsx   ← auth state
├── hooks/useFirestore.ts     ← Firestore realtime data
├── types/index.ts            ← Trade, TradingAccount, UserSettings types
├── pages/
│   ├── LoginPage.tsx
│   ├── DashboardPage.tsx
│   ├── TradesPage.tsx
│   ├── CalendarPage.tsx
│   └── ProfilePage.tsx
└── components/
    └── TradeModal.tsx
```
