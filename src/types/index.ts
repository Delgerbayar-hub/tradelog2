// src/types/index.ts

export interface Trade {
  id: string;
  userId: string;
  createdAt: Date;
  updatedAt: Date;

  // === ENTRY ===
  date: string;
  account: string;
  pair: string;
  direction: 'buy' | 'sell';
  lotSize: number;
  session: 'Asia' | 'London' | 'New York' | 'London Close';
  psychology: string[];   // up to 3 items from PSYCHOLOGY list
  planExecution: 'Төлвөлгөөтэй' | 'Төлвөлгөөгүй';
  confidence: 'Дунд' | 'Өндөр' | 'Бага';
  riskPercent: number;
  rrRatio: '1:1' | '1:2' | '1:3' | '1:4' | '1:5' | '1:6' | '1:7' | '1:8' | '1:9' | '1:10';
  setup: string;
  entryDetails: string;
  screenshotBefore: string[];   // up to 2 images (base64 or URL)
  screenshotAfter: string[];    // up to 2 images (base64 or URL)

  // === EXIT ===
  result: 'Win' | 'Loss' | 'Breakeven';
  gainRR: number;               // e.g. 2.5
  gainPercent: number;          // e.g. 5.0
  closedBy: 'TP' | 'SL' | 'BE';
  pnl: number;                  // raw dollar/pip value
  review: string;

  // === DEPRECATED ===
  screenshotBase64?: string;
  screenshotBefore1?: string;
  screenshotBefore2?: string;
  screenshotAfter1?: string;
  screenshotAfter2?: string;
}

export interface Account {
  id: string;
  name: string;
  color: string;
  initBalance: number;
  broker?: string;
}

export type AccountType = 'Personal' | 'Challenge' | 'Funded' | 'Demo' | 'Contest';

export type AccountStatus = 'active' | 'inactive' | 'archived';

export interface TradingAccount {
  name: string;
  type?: AccountType;
  balance: number;   // starting balance
  goal: number;      // target balance
  active?: boolean;  // legacy — use status instead
  status?: AccountStatus;
}

export interface UserSettings {
  userId: string;
  pairs: string[];
  accounts: TradingAccount[];
  defaultRiskPercent?: number;
  displayName?: string;
  avatarBase64?: string;
  bio?: string;
  analyticsIncludeInactive?: boolean;
  monthlyReviews?: Record<string, string>; // "2026-03" → review text
  weeklyReviews?: Record<string, string>;  // "2026-03-W2" → review text
}