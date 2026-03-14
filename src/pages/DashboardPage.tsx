// src/pages/DashboardPage.tsx
import React, { useMemo, useState } from 'react'
import { AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer, BarChart, Bar, Cell } from 'recharts'
import { Activity, Target, TrendingUp, TrendingDown, Zap, Flame, Trophy, AlertTriangle } from 'lucide-react'
import type { Trade, UserSettings } from '../types'
import clsx from 'clsx'

interface Props { trades: Trade[]; userSettings?: UserSettings | null; onAdd?: () => void }

const TT = ({ active, payload, label }: any) => active && payload?.length ? (
  <div className="bg-bg2 border border-border2 rounded-lg px-3 py-2 text-xs shadow-xl">
    <div className="text-muted mb-0.5">{label}</div>
    <div className="font-mono font-medium text-zinc-200">${Number(payload[0].value).toFixed(2)}</div>
  </div>
) : null

export default function DashboardPage({ trades, userSettings, onAdd }: Props) {
  const accounts = userSettings?.accounts ?? []
  const [selectedAccount, setSelectedAccount] = useState<string>('All')

  const filteredTrades = useMemo(() =>
    selectedAccount === 'All' ? trades : trades.filter(t => t.account === selectedAccount)
  , [trades, selectedAccount])

  const activeAccount = accounts.find(a => a.name === selectedAccount)
  const st = useMemo(() => {
    const n = filteredTrades.length
    const wins   = filteredTrades.filter(t => t.result === 'Win').length
    const losses = filteredTrades.filter(t => t.result === 'Loss').length
    const be     = filteredTrades.filter(t => t.result === 'Breakeven').length
    const pl     = filteredTrades.reduce((s,t) => s + t.pnl, 0)
    const wr     = n ? (wins / n * 100).toFixed(1) : '0'
    const avgRR  = n ? (filteredTrades.reduce((s,t) => s + (t.gainRR||0), 0) / n).toFixed(2) : '0'
    const pf     = (() => { const gp = filteredTrades.filter(t=>t.pnl>0).reduce((s,t)=>s+t.pnl,0); const gl = Math.abs(filteredTrades.filter(t=>t.pnl<0).reduce((s,t)=>s+t.pnl,0)); return gl ? (gp/gl).toFixed(2) : '∞' })()
    const sorted = [...filteredTrades].sort((a,b) => a.date.localeCompare(b.date) || a.createdAt.getTime() - b.createdAt.getTime())
    let streak = 0
    for (let i = sorted.length - 1; i >= 0; i--) {
      if (sorted[i].result === 'Win') streak++
      else break
    }
    const best  = filteredTrades.reduce((b,t) => t.pnl > b.pnl ? t : b, filteredTrades[0] || null)
    const worst = filteredTrades.reduce((w,t) => t.pnl < w.pnl ? t : w, filteredTrades[0] || null)
    return { n, wins, losses, be, pl, wr, avgRR, pf, streak, best, worst }
  }, [filteredTrades])

  const equity = useMemo(() => {
    const init = activeAccount?.balance ?? 10000
    let bal = init
    const pts = [{ x: 'Start', v: init }]
    ;[...filteredTrades].sort((a,b)=>a.date.localeCompare(b.date)).forEach(t => { bal += t.pnl; pts.push({ x: t.date.slice(5), v: +bal.toFixed(2) }) })
    return pts
  }, [filteredTrades, activeAccount])

  const drawdown = useMemo(() => {
    let peak = activeAccount?.balance ?? 10000
    let bal  = peak
    const pts: { x: string; dd: number }[] = [{ x: 'Start', dd: 0 }]
    ;[...filteredTrades].sort((a,b)=>a.date.localeCompare(b.date)).forEach(t => {
      bal += t.pnl
      if (bal > peak) peak = bal
      pts.push({ x: t.date.slice(5), dd: +((peak - bal)).toFixed(2) })
    })
    return pts
  }, [filteredTrades, activeAccount])

  // const heatmap = useMemo(() => {
  //   const weeks: { week: string; days: { date: string; pl: number; has: boolean }[] }[] = []
  //   const today = new Date()
  //   for (let w = 11; w >= 0; w--) {
  //     const days = []
  //     for (let d = 0; d < 7; d++) {
  //       const dt = new Date(today)
  //       dt.setDate(today.getDate() - w * 7 - (6 - d))
  //       const ds = dt.toISOString().split('T')[0]
  //       const dayTrades = trades.filter(t => t.date === ds)
  //       const pl = dayTrades.reduce((s,t) => s + t.pnl, 0)
  //       days.push({ date: ds, pl: +pl.toFixed(2), has: dayTrades.length > 0 })
  //     }
  //     weeks.push({ week: `W${12-w}`, days })
  //   }
  //   return weeks
  // }, [trades])

  const sessions = useMemo(() =>
    ['Asian','London','New York'].map(s => ({
      name: s, count: filteredTrades.filter(t=>t.session===s).length,
      pl: filteredTrades.filter(t=>t.session===s).reduce((a,t)=>a+t.pnl,0),
    }))
  , [filteredTrades])

  const isUp  = st.pl >= 0
  const today = new Date().toLocaleDateString('en-US', { weekday:'long', month:'long', day:'numeric' })
  const maxDD = Math.max(...drawdown.map(d => d.dd), 0)

  const StatCard = ({ label, val, sub, color, Icon }: any) => (
    <div className="card p-4 relative overflow-hidden">
      <div className="stat-border" style={{ background: color }}/>
      <div className="flex items-start justify-between">
        <div>
          <div className="text-[10px] font-semibold text-muted uppercase tracking-wider mb-2">{label}</div>
          <div className="text-2xl font-bold tracking-tight" style={{ color }}>{val}</div>
          {sub && <div className="text-[11px] font-mono text-muted mt-1">{sub}</div>}
        </div>
        <div className="rounded-lg p-1.5" style={{ background: color + '15' }}>
          <Icon size={14} style={{ color }}/>
        </div>
      </div>
    </div>
  )

  return (
    <div className="fade-in space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold text-zinc-100 tracking-tight">Dashboard</h1>
          <p className="text-sm text-muted mt-0.5">{today}</p>
        </div>
        <div className="flex items-center gap-3">
          {accounts.length > 0 && (
            <div className="flex items-center gap-1.5 bg-bg2 border border-border2 rounded-xl px-1.5 py-1.5">
              <button
                onClick={() => setSelectedAccount('All')}
                className={`px-3 py-1 rounded-lg text-xs font-medium transition-all ${
                  selectedAccount === 'All'
                    ? 'bg-zinc-700 text-zinc-100'
                    : 'text-muted hover:text-zinc-300'
                }`}
              >
                Бүгд
              </button>
              {accounts.map(a => (
                <button
                  key={a.name}
                  onClick={() => setSelectedAccount(a.name)}
                  className={`px-3 py-1 rounded-lg text-xs font-medium transition-all ${
                    selectedAccount === a.name
                      ? 'bg-cyan-500/20 text-cyan-400 border border-cyan-500/30'
                      : 'text-muted hover:text-zinc-300'
                  }`}
                >
                  {a.name}
                </button>
              ))}
            </div>
          )}
          <button onClick={onAdd} className="btn-primary">+ Log Trade</button>
        </div>
      </div>

      <div className="grid grid-cols-4 gap-3">
        <StatCard label="Total Trades"  val={st.n}                                         sub="all time"                                   color="#00e5ff" Icon={Activity}/>
        <StatCard label="Win Rate"      val={st.wr+'%'}                                    sub={`${st.wins}W · ${st.losses}L · ${st.be}BE`} color="#22c55e" Icon={Target}/>
        <StatCard label="Net P&L"       val={(isUp?'+':'')+'$'+Math.abs(st.pl).toFixed(2)} sub="total"                                      color={isUp?'#22c55e':'#ef4444'} Icon={isUp?TrendingUp:TrendingDown}/>
        <StatCard label="Profit Factor" val={st.pf}                                        sub={'Avg R:R  1:'+st.avgRR}                     color="#a855f7" Icon={Zap}/>
      </div>

      <div className="grid grid-cols-3 gap-3">
        <div className="card p-4 flex items-center gap-4">
          <div className="w-10 h-10 rounded-xl flex items-center justify-center shrink-0" style={{ background: 'rgba(251,191,36,0.1)' }}>
            <Flame size={18} color="#fbbf24"/>
          </div>
          <div>
            <div className="text-[10px] font-semibold text-muted uppercase tracking-wider">Current Streak</div>
            <div className="text-2xl font-bold text-yellow-400">{st.streak} <span className="text-sm font-normal text-muted">wins</span></div>
          </div>
        </div>
        <div className="card p-4 flex items-center gap-4">
          <div className="w-10 h-10 rounded-xl flex items-center justify-center shrink-0" style={{ background: 'rgba(34,197,94,0.1)' }}>
            <Trophy size={18} color="#22c55e"/>
          </div>
          <div>
            <div className="text-[10px] font-semibold text-muted uppercase tracking-wider">Best Trade</div>
            <div className="text-2xl font-bold text-green">{st.best ? `+$${st.best.pnl.toFixed(2)}` : '—'}</div>
            {st.best && <div className="text-[10px] text-muted font-mono">{st.best.pair} · {st.best.date}</div>}
          </div>
        </div>
        <div className="card p-4 flex items-center gap-4">
          <div className="w-10 h-10 rounded-xl flex items-center justify-center shrink-0" style={{ background: 'rgba(239,68,68,0.1)' }}>
            <AlertTriangle size={18} color="#ef4444"/>
          </div>
          <div>
            <div className="text-[10px] font-semibold text-muted uppercase tracking-wider">Worst Trade</div>
            <div className="text-2xl font-bold text-red">{st.worst ? `$${st.worst.pnl.toFixed(2)}` : '—'}</div>
            {st.worst && <div className="text-[10px] text-muted font-mono">{st.worst.pair} · {st.worst.date}</div>}
          </div>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div className="card p-5">
          <div className="flex items-center justify-between mb-3">
            <div className="font-semibold text-sm text-zinc-200">Equity Curve</div>
            <span className="text-xs font-mono px-2 py-0.5 rounded" style={{ background: isUp ? 'rgba(34,197,94,0.1)' : 'rgba(239,68,68,0.1)', color: isUp ? '#22c55e' : '#ef4444' }}>
              {isUp?'+':''}${st.pl.toFixed(2)}
            </span>
          </div>
          <ResponsiveContainer width="100%" height={120}>
            <AreaChart data={equity}>
              <defs>
                <linearGradient id="geq" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%"   stopColor={isUp?'#22c55e':'#ef4444'} stopOpacity={0.2}/>
                  <stop offset="100%" stopColor={isUp?'#22c55e':'#ef4444'} stopOpacity={0}/>
                </linearGradient>
              </defs>
              <XAxis dataKey="x" tick={{fill:'#52525b',fontSize:9}} axisLine={false} tickLine={false}/>
              <YAxis tick={{fill:'#52525b',fontSize:9}} axisLine={false} tickLine={false} width={52} tickFormatter={v=>'$'+v.toLocaleString()}/>
              <Tooltip content={<TT/>}/>
              <Area type="monotone" dataKey="v" stroke={isUp?'#22c55e':'#ef4444'} strokeWidth={1.5} fill="url(#geq)" dot={false}/>
            </AreaChart>
          </ResponsiveContainer>
        </div>
        <div className="card p-5">
          <div className="flex items-center justify-between mb-3">
            <div className="font-semibold text-sm text-zinc-200">Drawdown</div>
            <span className="text-xs font-mono px-2 py-0.5 rounded" style={{ background: 'rgba(239,68,68,0.1)', color: '#ef4444' }}>
              Max -${maxDD.toFixed(2)}
            </span>
          </div>
          <ResponsiveContainer width="100%" height={120}>
            <AreaChart data={drawdown}>
              <defs>
                <linearGradient id="gdd" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%"   stopColor="#ef4444" stopOpacity={0.25}/>
                  <stop offset="100%" stopColor="#ef4444" stopOpacity={0}/>
                </linearGradient>
              </defs>
              <XAxis dataKey="x" tick={{fill:'#52525b',fontSize:9}} axisLine={false} tickLine={false}/>
              <YAxis tick={{fill:'#52525b',fontSize:9}} axisLine={false} tickLine={false} width={52} tickFormatter={v=>'$'+v}/>
              <Tooltip content={({ active, payload, label }: any) => active && payload?.length ? (
                <div className="bg-bg2 border border-border2 rounded-lg px-3 py-2 text-xs shadow-xl">
                  <div className="text-muted mb-0.5">{label}</div>
                  <div className="font-mono font-medium text-red">-${Number(payload[0].value).toFixed(2)}</div>
                </div>
              ) : null}/>
              <Area type="monotone" dataKey="dd" stroke="#ef4444" strokeWidth={1.5} fill="url(#gdd)" dot={false}/>
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Heatmap hidden
      <div className="card p-5">
        <div className="font-semibold text-sm text-zinc-200 mb-4">Weekly P&L Heatmap <span className="text-muted font-normal text-xs ml-1">last 12 weeks</span></div>
        <div className="flex gap-1">
          <div className="flex flex-col gap-1 mr-1 justify-around">
            {['M','T','W','T','F','S','S'].map((d,i) => (
              <div key={i} className="text-[9px] text-muted w-3 text-center">{d}</div>
            ))}
          </div>
          {heatmap.map((week, wi) => (
            <div key={wi} className="flex flex-col gap-1 flex-1">
              {week.days.map((day, di) => {
                const maxPL = Math.max(...heatmap.flatMap(w => w.days.map(d => Math.abs(d.pl))), 1)
                const intensity = day.has ? Math.min(Math.abs(day.pl) / maxPL, 1) : 0
                const bg = !day.has ? '#1c1d22' : day.pl > 0 ? `rgba(34,197,94,${0.15 + intensity * 0.7})` : day.pl < 0 ? `rgba(239,68,68,${0.15 + intensity * 0.7})` : 'rgba(234,179,8,0.3)'
                return (
                  <div key={di} title={`${day.date}: ${day.has ? (day.pl>=0?'+':'')+'$'+day.pl : 'no trades'}`}
                    className="rounded-sm cursor-default transition-transform hover:scale-125"
                    style={{ background: bg, aspectRatio: '1', minHeight: '12px' }}/>
                )
              })}
            </div>
          ))}
        </div>
        <div className="flex items-center gap-3 mt-3">
          <span className="text-[9px] text-muted">Less</span>
          {[0.15,0.35,0.55,0.75,0.9].map((o,i) => <div key={i} className="w-3 h-3 rounded-sm" style={{ background: `rgba(34,197,94,${o})` }}/>)}
          <span className="text-[9px] text-muted">More profit</span>
          <div className="w-px h-3 bg-border2 mx-1"/>
          {[0.15,0.35,0.55,0.75,0.9].map((o,i) => <div key={i} className="w-3 h-3 rounded-sm" style={{ background: `rgba(239,68,68,${o})` }}/>)}
          <span className="text-[9px] text-muted">More loss</span>
        </div>
      </div>
      */}

      <div className="grid grid-cols-2 gap-4">
        <div className="card p-5">
          <div className="font-semibold text-sm text-zinc-200 mb-4">Distribution</div>
          <div className="flex items-center gap-6">
            <Donut wins={st.wins} losses={st.losses} be={st.be}/>
            <div className="space-y-3 flex-1">
              {[{l:'Win',v:st.wins,c:'#22c55e'},{l:'Loss',v:st.losses,c:'#ef4444'},{l:'BE',v:st.be,c:'#eab308'}].map(r=>(
                <div key={r.l} className="flex items-center justify-between">
                  <div className="flex items-center gap-2"><div className="w-2 h-2 rounded-full" style={{background:r.c}}/><span className="text-xs text-muted">{r.l}</span></div>
                  <span className="text-xs font-mono" style={{color:r.c}}>{r.v}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
        <div className="card p-5">
          <div className="font-semibold text-sm text-zinc-200 mb-4">Session Breakdown</div>
          <div className="space-y-3">
            {sessions.map(s => {
              const maxAbs = Math.max(...sessions.map(x=>Math.abs(x.pl)), 1)
              return (
                <div key={s.name}>
                  <div className="flex justify-between text-xs mb-1">
                    <span className="text-muted">{s.name} <span className="text-zinc-500">({s.count})</span></span>
                    <span className="font-mono" style={{color: s.pl>=0?'#22c55e':'#ef4444'}}>{s.pl>=0?'+':''}${s.pl.toFixed(2)}</span>
                  </div>
                  <div className="h-1.5 bg-bg3 rounded-full overflow-hidden">
                    <div className="h-full rounded-full transition-all duration-500" style={{ width: (Math.abs(s.pl)/maxAbs*100)+'%', background: s.pl>=0?'#22c55e':'#ef4444' }}/>
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

function Donut({ wins, losses, be }: { wins:number; losses:number; be:number }) {
  const total = wins+losses+be||1
  const wr = ((wins/total)*100).toFixed(0)
  const r=36, cx=48, cy=48, sw=9, circ=2*Math.PI*r
  const segs=[{v:wins,c:'#22c55e'},{v:losses,c:'#ef4444'},{v:be,c:'#eab308'}]
  let off=0
  return (
    <svg width={96} height={96} className="shrink-0">
      <circle cx={cx} cy={cy} r={r} fill="none" stroke="#1c1d22" strokeWidth={sw}/>
      {segs.map((s,i)=>{if(!s.v)return null;const d=(s.v/total)*circ;const el=<circle key={i} cx={cx} cy={cy} r={r} fill="none" stroke={s.c} strokeWidth={sw} strokeDasharray={`${d} ${circ-d}`} strokeDashoffset={-(off-circ/4)} strokeLinecap="round" style={{transform:'rotate(-90deg)',transformOrigin:`${cx}px ${cy}px`}}/>;off+=d;return el})}
      <text x={cx} y={cy+4} textAnchor="middle" fill="#e4e4e7" fontSize="13" fontFamily="Inter" fontWeight="700">{wr}%</text>
    </svg>
  )
}