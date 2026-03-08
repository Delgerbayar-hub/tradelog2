// src/pages/DashboardPage.tsx
import React, { useMemo } from 'react'
import { AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer } from 'recharts'
import { Activity, Target, TrendingUp, TrendingDown, Zap } from 'lucide-react'
import type { Trade, Account } from '../types'
import clsx from 'clsx'

interface Props { trades: Trade[]; account: Account | null; onAdd: () => void }

const TT = ({ active, payload, label }: any) => active && payload?.length ? (
  <div className="bg-bg2 border border-border2 rounded-lg px-3 py-2 text-xs shadow-xl">
    <div className="text-muted mb-0.5">{label}</div>
    <div className="font-mono font-medium text-zinc-200">${Number(payload[0].value).toFixed(2)}</div>
  </div>
) : null

export default function DashboardPage({ trades, account, onAdd }: Props) {
  const st = useMemo(() => {
    const n = trades.length
    const wins   = trades.filter(t => t.result === 'Win').length
    const losses = trades.filter(t => t.result === 'Loss').length
    const be     = trades.filter(t => t.result === 'BE').length
    const pl     = trades.reduce((s,t) => s + t.pl, 0)
    const wr     = n ? (wins / n * 100).toFixed(1) : '0'
    const avgRR  = n ? (trades.reduce((s,t) => s + (t.rr||0), 0) / n).toFixed(2) : '0'
    const pf     = (() => { const gp = trades.filter(t=>t.pl>0).reduce((s,t)=>s+t.pl,0); const gl = Math.abs(trades.filter(t=>t.pl<0).reduce((s,t)=>s+t.pl,0)); return gl ? (gp/gl).toFixed(2) : '∞' })()
    return { n, wins, losses, be, pl, wr, avgRR, pf }
  }, [trades])

  const equity = useMemo(() => {
    const init = account?.initBalance ?? 10000
    let bal = init
    const pts = [{ x: 'Start', v: init }]
    ;[...trades].sort((a,b)=>a.date.localeCompare(b.date)).forEach(t => { bal += t.pl; pts.push({ x: t.date.slice(5), v: +bal.toFixed(2) }) })
    return pts
  }, [trades, account])

  const sessions = useMemo(() =>
    ['Asian','London','New York'].map(s => ({
      name: s, count: trades.filter(t=>t.session===s).length,
      pl: trades.filter(t=>t.session===s).reduce((s,t)=>s+t.pl,0),
    }))
  , [trades])

  const isUp = st.pl >= 0
  const today = new Date().toLocaleDateString('en-US', { weekday:'long', month:'long', day:'numeric' })

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
    <div className="fade-in">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-xl font-bold text-zinc-100 tracking-tight">Dashboard</h1>
          <p className="text-sm text-muted mt-0.5">{today}</p>
        </div>
        <button onClick={onAdd} className="btn-primary">+ Log Trade</button>
      </div>

      {/* Stats row */}
      <div className="grid grid-cols-4 gap-3 mb-5">
        <StatCard label="Total Trades"  val={st.n}                                                    sub="all time"                        color="#00e5ff" Icon={Activity}/>
        <StatCard label="Win Rate"      val={st.wr+'%'}                                               sub={`${st.wins}W · ${st.losses}L · ${st.be}BE`} color="#22c55e" Icon={Target}/>
        <StatCard label="Net P&L"       val={(isUp?'+':'')+'$'+Math.abs(st.pl).toFixed(2)}            sub="total"                           color={isUp?'#22c55e':'#ef4444'} Icon={isUp?TrendingUp:TrendingDown}/>
        <StatCard label="Profit Factor" val={st.pf}                                                   sub={'Avg R:R  1:'+st.avgRR}          color="#a855f7" Icon={Zap}/>
      </div>

      {/* Equity curve */}
      <div className="card p-5 mb-4">
        <div className="flex items-center justify-between mb-4">
          <div className="font-semibold text-sm text-zinc-200">Equity Curve</div>
          <span className={clsx('text-xs font-mono px-2 py-0.5 rounded', isUp ? 'bg-green/10 text-green' : 'bg-red/10 text-red')}>
            {isUp?'+':''}${st.pl.toFixed(2)}
          </span>
        </div>
        <ResponsiveContainer width="100%" height={150}>
          <AreaChart data={equity}>
            <defs>
              <linearGradient id="g" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%"   stopColor={isUp?'#22c55e':'#ef4444'} stopOpacity={0.2}/>
                <stop offset="100%" stopColor={isUp?'#22c55e':'#ef4444'} stopOpacity={0}/>
              </linearGradient>
            </defs>
            <XAxis dataKey="x" tick={{fill:'#52525b',fontSize:10}} axisLine={false} tickLine={false}/>
            <YAxis tick={{fill:'#52525b',fontSize:10}} axisLine={false} tickLine={false} width={58} tickFormatter={v=>'$'+v.toLocaleString()}/>
            <Tooltip content={<TT/>}/>
            <Area type="monotone" dataKey="v" stroke={isUp?'#22c55e':'#ef4444'} strokeWidth={1.5} fill="url(#g)" dot={false}/>
          </AreaChart>
        </ResponsiveContainer>
      </div>

      {/* Bottom row */}
      <div className="grid grid-cols-2 gap-4">
        {/* Donut */}
        <div className="card p-5">
          <div className="font-semibold text-sm text-zinc-200 mb-4">Distribution</div>
          <div className="flex items-center gap-6">
            <Donut wins={st.wins} losses={st.losses} be={st.be}/>
            <div className="space-y-3">
              {[{l:'Win',v:st.wins,c:'#22c55e'},{l:'Loss',v:st.losses,c:'#ef4444'},{l:'BE',v:st.be,c:'#eab308'}].map(r=>(
                <div key={r.l} className="flex items-center justify-between gap-4">
                  <div className="flex items-center gap-2"><div className="w-2 h-2 rounded-full" style={{background:r.c}}/><span className="text-xs text-muted">{r.l}</span></div>
                  <span className="text-xs font-mono" style={{color:r.c}}>{r.v}</span>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Sessions */}
        <div className="card p-5">
          <div className="font-semibold text-sm text-zinc-200 mb-4">Session Breakdown</div>
          <div className="space-y-3">
            {sessions.map(s => {
              const maxAbs = Math.max(...sessions.map(x=>Math.abs(x.pl)), 1)
              return (
                <div key={s.name}>
                  <div className="flex justify-between text-xs mb-1">
                    <span className="text-muted">{s.name} <span className="text-zinc-500">({s.count})</span></span>
                    <span className={clsx('font-mono', s.pl>=0?'text-green':'text-red')}>{s.pl>=0?'+':''}${s.pl.toFixed(2)}</span>
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
