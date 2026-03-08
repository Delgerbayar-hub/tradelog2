// src/components/Sidebar.tsx
import React from 'react'
import { NavLink } from 'react-router-dom'
import { LayoutDashboard, BookOpen, Calendar, BarChart2, LogOut, Plus, Pencil } from 'lucide-react'
import { useAuth } from '../context/AuthContext'
import type { Account } from '../types'
import clsx from 'clsx'

export const PALETTE = ['#00e5ff','#22c55e','#ef4444','#eab308','#a855f7','#f97316','#ec4899']

interface Props {
  accounts: Account[]; activeId: string | null
  onSwitch: (id: string) => void; onAdd: () => void; onEdit: (a: Account) => void
  balance: (id: string) => number
}

export default function Sidebar({ accounts, activeId, onSwitch, onAdd, onEdit, balance }: Props) {
  const { user, logout } = useAuth()
  const active = accounts.find(a => a.id === activeId)

  const links = [
    { to: '/',          icon: LayoutDashboard, label: 'Dashboard' },
    { to: '/trades',    icon: BookOpen,         label: 'Trades'    },
    { to: '/calendar',  icon: Calendar,         label: 'Calendar'  },
    { to: '/analytics', icon: BarChart2,        label: 'Analytics' },
  ]

  return (
    <aside className="fixed left-0 top-0 bottom-0 w-[214px] bg-bg2 border-r border-border flex flex-col z-50">
      {/* Logo */}
      <div className="px-5 py-4 border-b border-border flex items-center gap-2.5">
        <div className="w-7 h-7 rounded-lg bg-accent/10 border border-accent/20 flex items-center justify-center flex-shrink-0">
          <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="#00e5ff" strokeWidth="2.2">
            <polyline points="22 7 13.5 15.5 8.5 10.5 2 17"/>
            <polyline points="16 7 22 7 22 13"/>
          </svg>
        </div>
        <span className="font-semibold text-[15px] text-zinc-100 tracking-tight">TradeLog</span>
      </div>

      {/* Accounts */}
      <div className="px-3 pt-3 pb-2 border-b border-border">
        <p className="text-[9.5px] font-semibold text-muted uppercase tracking-widest px-2 mb-1.5">Accounts</p>
        <div className="space-y-0.5">
          {accounts.map(a => {
            const bal = balance(a.id)
            const isActive = a.id === activeId
            return (
              <div key={a.id} onClick={() => onSwitch(a.id)}
                className={clsx('group flex items-center justify-between px-2.5 py-2 rounded-lg cursor-pointer transition-all border',
                  isActive ? 'bg-accent/5 border-accent/15' : 'border-transparent hover:bg-bg3')}>
                <div className="flex items-center gap-2 min-w-0">
                  <div className="w-1.5 h-1.5 rounded-full shrink-0" style={{ background: a.color }}/>
                  <div className="min-w-0">
                    <div className={clsx('text-[12.5px] font-medium truncate', isActive ? 'text-accent' : 'text-zinc-300')}>{a.name}</div>
                    <div className={clsx('font-mono text-[10px]', isActive ? 'text-accent/70' : 'text-muted')}>
                      ${bal.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                    </div>
                  </div>
                </div>
                <button onClick={e => { e.stopPropagation(); onEdit(a) }}
                  className="opacity-0 group-hover:opacity-100 text-muted hover:text-zinc-300 transition-all p-0.5">
                  <Pencil size={10}/>
                </button>
              </div>
            )
          })}
        </div>
        <button onClick={onAdd}
          className="flex items-center gap-1.5 w-full px-2.5 py-1.5 mt-1 rounded-lg text-muted hover:text-accent hover:bg-accent/5 transition-all text-xs font-medium">
          <Plus size={12}/> Add account
        </button>
      </div>

      {/* Nav */}
      <nav className="flex-1 px-3 py-3 space-y-0.5">
        {links.map(({ to, icon: Icon, label }) => (
          <NavLink key={to} to={to} end={to === '/'}
            className={({ isActive }) => clsx('nav-item', isActive && 'active')}>
            <Icon size={15} className="shrink-0"/>
            {label}
          </NavLink>
        ))}
      </nav>

      {/* Footer */}
      <div className="px-4 py-3 border-t border-border">
        <div className="flex items-center gap-2.5">
          {user?.photoURL && <img src={user.photoURL} className="w-7 h-7 rounded-full shrink-0" alt=""/>}
          <div className="flex-1 min-w-0">
            <div className="text-[12px] font-medium text-zinc-300 truncate">{user?.displayName || 'Trader'}</div>
            <div className="text-[10px] text-muted truncate" style={{ color: active?.color }}>{active?.name || '—'}</div>
          </div>
          <button onClick={logout} className="btn-icon !p-1.5" title="Sign out"><LogOut size={12}/></button>
        </div>
      </div>
    </aside>
  )
}
