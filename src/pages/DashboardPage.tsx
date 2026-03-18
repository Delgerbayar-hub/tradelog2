// src/pages/DashboardPage.tsx
import { useMemo, useState } from 'react'
import { AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer } from 'recharts'
import { Activity, Target, TrendingUp, TrendingDown, Zap, Flame, Trophy, AlertTriangle } from 'lucide-react'
import type { Trade, UserSettings } from '../types'
import { fmtPnl } from '../lib/format'
import { getActiveAccounts, getArchivedNames } from '../lib/accounts'

interface Props { trades: Trade[]; userSettings?: UserSettings | null; onAdd?: () => void }

const ChartTooltip = ({ active, payload, label }: any) => active && payload?.length ? (
  <div className="bg-bg2 border border-border2 rounded-lg px-3 py-2 text-xs shadow-xl">
    <div className="text-muted mb-0.5">{label}</div>
    <div className="font-mono font-medium text-zinc-200">${Number(payload[0].value).toFixed(2)}</div>
  </div>
) : null

export default function DashboardPage({ trades, userSettings, onAdd }: Props) {
  const allAccounts = userSettings?.accounts ?? []
  const accounts    = getActiveAccounts(allAccounts)
  const archived    = getArchivedNames(allAccounts)
  const [selectedAccount, setSelectedAccount] = useState<string>('All')

  // Archived account trades hidden everywhere in Dashboard
  const visibleTrades = useMemo(() =>
    trades.filter(t => !archived.has(t.account))
  , [trades, archived])

  const filteredTrades = useMemo(() =>
    selectedAccount === 'All' ? visibleTrades : visibleTrades.filter(t => t.account === selectedAccount)
  , [visibleTrades, selectedAccount])

  const activeAccount = accounts.find(a => a.name === selectedAccount)

  const st = useMemo(() => {
    const n      = filteredTrades.length
    const wins   = filteredTrades.filter(t => t.result === 'Win').length
    const losses = filteredTrades.filter(t => t.result === 'Loss').length
    const be     = filteredTrades.filter(t => t.result === 'Breakeven').length
    const pl     = filteredTrades.reduce((s, t) => s + t.pnl, 0)
    const wr     = n ? (wins / n * 100).toFixed(1) : '0'
    const avgRR  = n ? (filteredTrades.reduce((s, t) => s + (t.gainRR || 0), 0) / n).toFixed(2) : '0'
    const gp     = filteredTrades.filter(t => t.pnl > 0).reduce((s, t) => s + t.pnl, 0)
    const gl     = Math.abs(filteredTrades.filter(t => t.pnl < 0).reduce((s, t) => s + t.pnl, 0))
    const pf     = gl ? (gp / gl).toFixed(2) : '∞'
    const sorted = [...filteredTrades].sort((a, b) => a.date.localeCompare(b.date) || a.createdAt.getTime() - b.createdAt.getTime())
    let streak = 0
    for (let i = sorted.length - 1; i >= 0; i--) {
      if (sorted[i].result === 'Win') streak++
      else break
    }
    const best  = filteredTrades.reduce((b, t) => t.pnl > b.pnl ? t : b, filteredTrades[0] || null)
    const worst = filteredTrades.reduce((w, t) => t.pnl < w.pnl ? t : w, filteredTrades[0] || null)
    return { n, wins, losses, be, pl, wr, avgRR, pf, streak, best, worst }
  }, [filteredTrades])

  const equity = useMemo(() => {
    const init = activeAccount
      ? activeAccount.balance
      : accounts.reduce((s, a) => s + (a.balance ?? 0), 0)
    let bal = init
    const pts = [{ x: 'Start', v: init }]
    ;[...filteredTrades].sort((a, b) => a.date.localeCompare(b.date))
      .forEach(t => { bal += t.pnl; pts.push({ x: t.date.slice(5), v: +bal.toFixed(2) }) })
    return pts
  }, [filteredTrades, activeAccount, accounts])

  const drawdown = useMemo(() => {
    let peak = activeAccount
      ? activeAccount.balance
      : accounts.reduce((s, a) => s + (a.balance ?? 0), 0)
    let bal  = peak
    const pts: { x: string; dd: number }[] = [{ x: 'Start', dd: 0 }]
    ;[...filteredTrades].sort((a, b) => a.date.localeCompare(b.date)).forEach(t => {
      bal += t.pnl
      if (bal > peak) peak = bal
      pts.push({ x: t.date.slice(5), dd: +((peak - bal)).toFixed(2) })
    })
    return pts
  }, [filteredTrades, activeAccount])

  const sessions = useMemo(() =>
    ['Asia', 'London', 'New York', 'London Close'].map(s => ({
      name: s,
      count: filteredTrades.filter(t => t.session === s).length,
      pl: filteredTrades.filter(t => t.session === s).reduce((a, t) => a + t.pnl, 0),
    }))
  , [filteredTrades])

  const isUp  = st.pl >= 0
  const maxDD = Math.max(...drawdown.map(d => d.dd), 0)
  const today = new Date().toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' })

  return (
    <div className="p-6 space-y-5 fade-in">

      {/* ── Header ── */}
      <div className="flex items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-zinc-100 tracking-tight">Dashboard</h1>
          <p className="text-sm text-muted mt-0.5">{today}</p>
        </div>
        <div className="flex items-center gap-3">
          {accounts.length > 0 && (
            <div className="flex items-center gap-1 bg-bg2 border border-border rounded-xl p-1">
              <button
                onClick={() => setSelectedAccount('All')}
                className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
                  selectedAccount === 'All' ? 'bg-bg3 text-zinc-100 border border-border2' : 'text-muted hover:text-zinc-300'
                }`}
              >
                Бүгд
              </button>
              {accounts.map(a => (
                <button
                  key={a.name}
                  onClick={() => setSelectedAccount(a.name)}
                  className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
                    selectedAccount === a.name
                      ? 'bg-accent/15 text-accent border border-accent/30'
                      : 'text-muted hover:text-zinc-300'
                  }`}
                >
                  {a.name}
                </button>
              ))}
            </div>
          )}
          <button onClick={onAdd} className="btn-primary">Арилжаа бүртгэх+</button>
        </div>
      </div>

      {/* ── Stat cards row ── */}
      <div className="grid grid-cols-4 gap-4">
        {[
          { label: 'Total Trades',  val: String(st.n),                                            sub: 'all time',                             color: '#00e5ff', Icon: Activity    },
          { label: 'Win Rate',      val: st.wr + '%',                                             sub: `${st.wins}W · ${st.losses}L · ${st.be}BE`, color: '#22c55e', Icon: Target  },
          { label: 'Net P&L',       val: fmtPnl(st.pl),                                           sub: 'realized',                             color: isUp ? '#22c55e' : '#ef4444', Icon: isUp ? TrendingUp : TrendingDown },
          { label: 'Profit Factor', val: st.pf,                                                   sub: 'Avg R:R  1:' + st.avgRR,              color: '#a855f7', Icon: Zap         },
        ].map(({ label, val, sub, color, Icon }) => (
          <div key={label} className="card p-5 relative overflow-hidden">
            <div className="stat-border" style={{ background: color }} />
            <div className="flex items-start justify-between">
              <div className="flex-1 min-w-0">
                <div className="text-[11px] font-semibold text-muted uppercase tracking-wider mb-2">{label}</div>
                <div className="text-2xl font-bold tracking-tight font-mono" style={{ color }}>{val}</div>
                <div className="text-xs text-muted mt-1.5 font-mono">{sub}</div>
              </div>
              <div className="rounded-xl p-2 shrink-0 ml-2" style={{ background: color + '18' }}>
                <Icon size={16} style={{ color }} />
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* ── Streak / Best / Worst ── */}
      <div className="grid grid-cols-3 gap-4">
        {[
          {
            label: 'Current Streak', icon: Flame, iconColor: '#fbbf24', bg: 'rgba(251,191,36,0.1)',
            val: <span className="text-2xl font-bold text-yellow">{st.streak} <span className="text-sm font-normal text-muted">wins</span></span>,
            sub: null,
          },
          {
            label: 'Best Trade', icon: Trophy, iconColor: '#22c55e', bg: 'rgba(34,197,94,0.1)',
            val: <span className="text-2xl font-bold text-green">{st.best && st.best.pnl > 0 ? fmtPnl(st.best.pnl) : '—'}</span>,
            sub: st.best && st.best.pnl > 0 ? `${st.best.pair} · ${st.best.date}` : null,
          },
          {
            label: 'Worst Trade', icon: AlertTriangle, iconColor: '#ef4444', bg: 'rgba(239,68,68,0.1)',
            val: <span className="text-2xl font-bold text-red">{st.worst && st.worst.pnl < 0 ? fmtPnl(st.worst.pnl) : '—'}</span>,
            sub: st.worst && st.worst.pnl < 0 ? `${st.worst.pair} · ${st.worst.date}` : null,
          },
        ].map(({ label, icon: Icon, iconColor, bg, val, sub }) => (
          <div key={label} className="card p-5 flex items-center gap-4">
            <div className="w-12 h-12 rounded-xl flex items-center justify-center shrink-0" style={{ background: bg }}>
              <Icon size={20} color={iconColor} />
            </div>
            <div className="min-w-0">
              <div className="text-[11px] font-semibold text-muted uppercase tracking-wider mb-1">{label}</div>
              {val}
              {sub && <div className="text-[11px] text-muted font-mono mt-0.5 truncate">{sub}</div>}
            </div>
          </div>
        ))}
      </div>

      {/* ── Charts ── */}
      <div className="grid grid-cols-2 gap-4">
        <div className="card p-5">
          <div className="flex items-center justify-between mb-4">
            <div className="font-semibold text-sm text-zinc-200">Equity Curve</div>
            <span className="text-xs font-mono px-2.5 py-1 rounded-lg" style={{ background: isUp ? 'rgba(34,197,94,0.12)' : 'rgba(239,68,68,0.12)', color: isUp ? '#22c55e' : '#ef4444' }}>
              {fmtPnl(st.pl)}
            </span>
          </div>
          <ResponsiveContainer width="100%" height={160}>
            <AreaChart data={equity} margin={{ top: 4, right: 4, left: 0, bottom: 0 }}>
              <defs>
                <linearGradient id="geq" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%"   stopColor={isUp ? '#22c55e' : '#ef4444'} stopOpacity={0.25} />
                  <stop offset="100%" stopColor={isUp ? '#22c55e' : '#ef4444'} stopOpacity={0} />
                </linearGradient>
              </defs>
              <XAxis dataKey="x" tick={{ fill: '#52525b', fontSize: 10 }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fill: '#52525b', fontSize: 10 }} axisLine={false} tickLine={false} width={56} tickFormatter={v => '$' + v.toLocaleString()} />
              <Tooltip content={<ChartTooltip />} />
              <Area type="monotone" dataKey="v" stroke={isUp ? '#22c55e' : '#ef4444'} strokeWidth={2} fill="url(#geq)" dot={false} />
            </AreaChart>
          </ResponsiveContainer>
        </div>

        <div className="card p-5">
          <div className="flex items-center justify-between mb-4">
            <div className="font-semibold text-sm text-zinc-200">Drawdown</div>
            <span className="text-xs font-mono px-2.5 py-1 rounded-lg" style={{ background: 'rgba(239,68,68,0.12)', color: '#ef4444' }}>
              Max −${maxDD.toFixed(2)}
            </span>
          </div>
          <ResponsiveContainer width="100%" height={160}>
            <AreaChart data={drawdown} margin={{ top: 4, right: 4, left: 0, bottom: 0 }}>
              <defs>
                <linearGradient id="gdd" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%"   stopColor="#ef4444" stopOpacity={0.25} />
                  <stop offset="100%" stopColor="#ef4444" stopOpacity={0} />
                </linearGradient>
              </defs>
              <XAxis dataKey="x" tick={{ fill: '#52525b', fontSize: 10 }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fill: '#52525b', fontSize: 10 }} axisLine={false} tickLine={false} width={56} tickFormatter={v => '$' + v} />
              <Tooltip content={({ active, payload, label }: any) => active && payload?.length ? (
                <div className="bg-bg2 border border-border2 rounded-lg px-3 py-2 text-xs shadow-xl">
                  <div className="text-muted mb-0.5">{label}</div>
                  <div className="font-mono font-medium text-red">−${Number(payload[0].value).toFixed(2)}</div>
                </div>
              ) : null} />
              <Area type="monotone" dataKey="dd" stroke="#ef4444" strokeWidth={2} fill="url(#gdd)" dot={false} />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* ── Distribution + Session ── */}
      <div className="grid grid-cols-2 gap-4">
        <div className="card p-5">
          <div className="font-semibold text-sm text-zinc-200 mb-5">Distribution</div>
          <div className="flex items-center gap-6">
            <Donut wins={st.wins} losses={st.losses} be={st.be} />
            <div className="space-y-4 flex-1">
              {[
                { l: 'Win',       v: st.wins,   c: '#22c55e' },
                { l: 'Loss',      v: st.losses, c: '#ef4444' },
                { l: 'Breakeven', v: st.be,     c: '#eab308' },
              ].map(r => (
                <div key={r.l} className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <div className="w-2 h-2 rounded-full shrink-0" style={{ background: r.c }} />
                    <span className="text-sm text-muted">{r.l}</span>
                  </div>
                  <span className="text-sm font-mono font-semibold" style={{ color: r.c }}>{r.v}</span>
                </div>
              ))}
            </div>
          </div>
        </div>

        <div className="card p-5">
          <div className="font-semibold text-sm text-zinc-200 mb-5">Session Breakdown</div>
          <div className="space-y-4">
            {sessions.map(s => {
              const maxAbs = Math.max(...sessions.map(x => Math.abs(x.pl)), 1)
              return (
                <div key={s.name}>
                  <div className="flex justify-between text-xs mb-1.5">
                    <span className="text-muted">{s.name} <span className="text-border2">({s.count})</span></span>
                    <span className="font-mono font-medium" style={{ color: s.pl >= 0 ? '#22c55e' : '#ef4444' }}>
                      {s.pl >= 0 ? '+' : ''}${s.pl.toFixed(2)}
                    </span>
                  </div>
                  <div className="h-1.5 bg-bg3 rounded-full overflow-hidden">
                    <div
                      className="h-full rounded-full transition-all duration-500"
                      style={{ width: (Math.abs(s.pl) / maxAbs * 100) + '%', background: s.pl >= 0 ? '#22c55e' : '#ef4444' }}
                    />
                  </div>
                </div>
              )
            })}
          </div>
        </div>
      </div>
    </div>
  )
}

function Donut({ wins, losses, be }: { wins: number; losses: number; be: number }) {
  const total = wins + losses + be || 1
  const wr    = ((wins / total) * 100).toFixed(0)
  const r = 40, cx = 52, cy = 52, sw = 10, circ = 2 * Math.PI * r
  const segs = [{ v: wins, c: '#22c55e' }, { v: losses, c: '#ef4444' }, { v: be, c: '#eab308' }]
  let off = 0
  return (
    <svg width={104} height={104} className="shrink-0">
      <circle cx={cx} cy={cy} r={r} fill="none" stroke="#1c1d22" strokeWidth={sw} />
      {segs.map((s, i) => {
        if (!s.v) return null
        const d = (s.v / total) * circ
        const el = (
          <circle key={i} cx={cx} cy={cy} r={r} fill="none" stroke={s.c} strokeWidth={sw}
            strokeDasharray={`${d} ${circ - d}`}
            strokeDashoffset={-(off - circ / 4)}
            strokeLinecap="round"
            style={{ transform: 'rotate(-90deg)', transformOrigin: `${cx}px ${cy}px` }}
          />
        )
        off += d
        return el
      })}
      <text x={cx} y={cy - 4} textAnchor="middle" fill="#e4e4e7" fontSize="15" fontFamily="Inter" fontWeight="700">{wr}%</text>
      <text x={cx} y={cy + 13} textAnchor="middle" fill="#52525b" fontSize="10" fontFamily="Inter">WR</text>
    </svg>
  )
}
