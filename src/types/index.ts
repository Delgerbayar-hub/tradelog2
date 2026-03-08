// src/types/index.ts
export interface Account {
  id: string
  name: string
  color: string
  initBalance: number
  broker?: string
  userId: string
  createdAt: number
}

export interface Trade {
  id: string
  accountId: string
  userId: string
  date: string
  session: 'Asian' | 'London' | 'New York'
  pair: string
  direction: 'Buy' | 'Sell'
  lot: string
  risk: string
  rr: number
  result: 'Win' | 'Loss' | 'BE'
  pl: number
  strategy: string
  emotion: string
  notes: string
  screenshotBase64?: string | null
  createdAt: number
}
