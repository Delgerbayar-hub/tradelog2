// src/App.tsx
import React, { useState, useEffect } from 'react'
import { Routes, Route, Navigate } from 'react-router-dom'
import { useAuth } from './context/AuthContext'
import { useAccounts, useTrades } from './hooks/useFirestore'
import Sidebar from './components/Sidebar'
import AccountModal from './components/AccountModal'
import TradeModal from './components/TradeModal'
import LoginPage from './pages/LoginPage'
import DashboardPage from './pages/DashboardPage'
import TradesPage from './pages/TradesPage'
import CalendarPage from './pages/CalendarPage'
import AnalyticsPage from './pages/AnalyticsPage'
import type { Account, Trade } from './types'

function Spinner() {
  return (
    <div className="min-h-screen bg-bg flex items-center justify-center">
      <div className="flex items-center gap-3">
        <div className="w-7 h-7 rounded-lg bg-accent/10 border border-accent/20 flex items-center justify-center">
          <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="#00e5ff" strokeWidth="2.2">
            <polyline points="22 7 13.5 15.5 8.5 10.5 2 17"/>
            <polyline points="16 7 22 7 22 13"/>
          </svg>
        </div>
        <span className="font-semibold text-zinc-300 animate-pulse">TradeLog</span>
      </div>
    </div>
  )
}

function Shell() {
  const { accounts, loading: aL, addAccount, updateAccount, deleteAccount } = useAccounts()
  const [activeId,   setActiveId]   = useState<string | null>(null)
  const [accModal,   setAccModal]   = useState<{ open: boolean; editing: Account | null }>({ open: false, editing: null })
  const [tradeModal, setTradeModal] = useState(false)

  useEffect(() => {
    if (!aL && accounts.length && !activeId) setActiveId(accounts[0].id)
  }, [accounts, aL, activeId])

  const { trades, loading: tL, addTrade, deleteTrade } = useTrades(activeId)
  const activeAccount = accounts.find(a => a.id === activeId) ?? null

  const getBalance = (id: string) => {
    const acc = accounts.find(a => a.id === id)
    const pl  = id === activeId ? trades.reduce((s,t) => s + t.pl, 0) : 0
    return (acc?.initBalance ?? 0) + pl
  }

  const handleSaveAccount = async (d: { name: string; color: string; initBalance: number; broker: string }) => {
    if (accModal.editing) await updateAccount(accModal.editing.id, d)
    else                  await addAccount(d)
    setAccModal({ open: false, editing: null })
  }

  const handleDeleteAccount = async () => {
    if (!accModal.editing) return
    if (!confirm(`Delete "${accModal.editing.name}"? This cannot be undone.`)) return
    const remaining = accounts.filter(a => a.id !== accModal.editing!.id)
    await deleteAccount(accModal.editing.id)
    setActiveId(remaining[0]?.id ?? null)
    setAccModal({ open: false, editing: null })
  }

  const handleSaveTrade = async (
    data: Omit<Trade, 'id' | 'userId' | 'createdAt' | 'screenshotBase64'>,
    screenshot?: File
  ) => addTrade(data, screenshot)

  if (aL || tL) return <Spinner/>

  return (
    <div className="flex min-h-screen">
      <Sidebar
        accounts={accounts}
        activeId={activeId}
        onSwitch={setActiveId}
        onAdd={() => setAccModal({ open: true, editing: null })}
        onEdit={a => setAccModal({ open: true, editing: a })}
        balance={getBalance}
      />

      <main className="ml-[214px] flex-1 p-7">
        {!activeId ? (
          <div className="flex flex-col items-center justify-center min-h-[65vh] gap-4 text-center">
            <div className="text-5xl">💼</div>
            <div className="text-zinc-400 text-sm">No accounts yet</div>
            <button onClick={() => setAccModal({ open: true, editing: null })} className="btn-primary">
              Create first account
            </button>
          </div>
        ) : (
          <Routes>
            <Route path="/"          element={<DashboardPage trades={trades} account={activeAccount} onAdd={() => setTradeModal(true)}/>}/>
            <Route path="/trades"    element={<TradesPage    trades={trades} onAdd={() => setTradeModal(true)} onDelete={deleteTrade}/>}/>
            <Route path="/calendar"  element={<CalendarPage  trades={trades} onAdd={() => setTradeModal(true)}/>}/>
            <Route path="/analytics" element={<AnalyticsPage trades={trades}/>}/>
            <Route path="*"          element={<Navigate to="/" replace/>}/>
          </Routes>
        )}
      </main>

      <AccountModal
        open={accModal.open}
        editing={accModal.editing}
        onClose={() => setAccModal({ open: false, editing: null })}
        onSave={handleSaveAccount}
        onDelete={accModal.editing ? handleDeleteAccount : undefined}
      />

      {activeId && (
        <TradeModal
          open={tradeModal}
          accountId={activeId}
          onClose={() => setTradeModal(false)}
          onSave={handleSaveTrade}
        />
      )}
    </div>
  )
}

export default function App() {
  const { user, loading } = useAuth()
  if (loading) return <Spinner/>
  return user ? <Shell/> : <LoginPage/>
}
