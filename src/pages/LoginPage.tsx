// src/pages/LoginPage.tsx
import React, { useState } from 'react'
import { useAuth } from '../context/AuthContext'

export default function LoginPage() {
  const { login } = useAuth()
  const [busy, setBusy] = useState(false)
  const [err, setErr] = useState('')

  const go = async () => {
    setBusy(true); setErr('')
    try { await login() } catch (e: any) { setErr(e.message) } finally { setBusy(false) }
  }

  return (
    <div className="min-h-screen bg-bg flex items-center justify-center p-6">
      <div className="w-full max-w-sm fade-in">
        {/* Logo mark */}
        <div className="flex items-center gap-3 mb-10 justify-center">
          <div className="w-9 h-9 rounded-xl bg-accent/10 border border-accent/20 flex items-center justify-center">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#00e5ff" strokeWidth="2">
              <polyline points="22 7 13.5 15.5 8.5 10.5 2 17"/>
              <polyline points="16 7 22 7 22 13"/>
            </svg>
          </div>
          <span className="text-xl font-semibold text-zinc-100 tracking-tight">TradeLog</span>
        </div>

        <div className="card p-7">
          <h1 className="text-lg font-semibold text-zinc-100 mb-1">Welcome back</h1>
          <p className="text-sm text-muted mb-6">Sign in to access your journal</p>

          {err && <div className="text-xs text-red bg-red/8 border border-red/20 px-3 py-2 rounded-lg mb-4">{err}</div>}

          <button onClick={go} disabled={busy} className="btn-ghost w-full justify-center py-2.5 gap-3">
            {busy ? <span className="text-muted animate-pulse text-sm">Connecting…</span> : <>
              <svg width="16" height="16" viewBox="0 0 24 24">
                <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
                <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
              </svg>
              <span className="text-sm">Continue with Google</span>
            </>}
          </button>
        </div>
        <p className="text-center text-xs text-muted mt-4">Your data is private and only visible to you</p>
      </div>
    </div>
  )
}
