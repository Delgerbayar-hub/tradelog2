// src/pages/AnalyticsPage.tsx
import React, { useMemo } from 'react'
import { BarChart, Bar, Cell, XAxis, YAxis, Tooltip, ResponsiveContainer } from 'recharts'
import type { Trade } from '../types'
import clsx from 'clsx'

interface Props { trades: Trade[] }

const TT = ({ active, payload, label }: any) => active && payload?.length ? (
  <div className="bg-bg2 border border-border2 rounded-lg px-3 py-2 text-xs shadow-xl">
    <div className="text-muted mb-0.5">{label}</div>
    {payload.map((p: any, i: number) => (
      <div key={i} style={{ color: p.color || '#e4e4e7' }} className="font-mono">
        {p.name}: {typeof p.value === 'number' ? (p.name === 'P&L' ? '$' + p.value.toFixed(2) : p.value.toFixed(1) + (p.name === 'Win%' ? '%' : '')) : p.value}
      </div>
    ))}
  </div>
) : null

export default function AnalyticsPage({ trades }: Props) {
  const s = useMemo(() => {
    if (!trades.length) return null
    const wins   = trades.filter(t => t.result === 'Win')
    const losses = trades.filter(t => t.result === 'Loss')
    const avgWin  = wins.length   ? wins.reduce((s,t)=>s+t.pnl,0)/wins.length   : 0
    const avgLoss = losses.length ? Math.abs(losses.reduce((s,t)=>s+t.pnl,0)/losses.length) : 0
    const best    = Math.max(...trades.map(t=>t.pnl), 0)
    const worst   = Math.min(...trades.map(t=>t.pnl), 0)

    // Max drawdown
    let peak=0, dd=0, bal=0
    ;[...trades].sort((a,b)=>a.date.localeCompare(b.date)).forEach(t=>{
      bal+=t.pnl; if(bal>peak)peak=bal; dd=Math.max(dd,peak-bal)
    })

    // Profit factor
    const gp = wins.reduce((s,t)=>s+t.pnl,0)
    const gl = Math.abs(losses.reduce((s,t)=>s+t.pnl,0))
    const pf = gl ? (gp/gl).toFixed(2) : '∞'

    // Monthly
    const moMap: Record<string,number> = {}
    trades.forEach(t => { const k=t.date.slice(0,7); moMap[k]=(moMap[k]||0)+t.pnl })
    const monthly = Object.entries(moMap).sort(([a],[b])=>a.localeCompare(b)).map(([m,pl])=>({ m:m.slice(5)+'/'+m.slice(2,4), pl:+pl.toFixed(2) }))

    // By pair
    const pairMap: Record<string,{w:number;l:number;be:number;pl:number}> = {}
    trades.forEach(t => {
      if(!pairMap[t.pair]) pairMap[t.pair]={w:0,l:0,be:0,pl:0}
      if(t.result==='Win') pairMap[t.pair].w++
      else if(t.result==='Loss') pairMap[t.pair].l++
      else pairMap[t.pair].be++
      pairMap[t.pair].pl+=t.pnl
    })
    const pairs = Object.entries(pairMap)
      .map(([pair,d])=>({ pair, pl:+d.pl.toFixed(2), wr:+((d.w/(d.w+d.l+d.be))*100).toFixed(1), total:d.w+d.l+d.be }))
      .sort((a,b)=>b.pl-a.pl)

    // By emotion
    const emoMap: Record<string,{w:number;total:number;pl:number}> = {}
    trades.forEach(t => {
      if(!emoMap[t.psychology]) emoMap[t.psychology]={w:0,total:0,pl:0}
      emoMap[t.psychology].total++
      if(t.result==='Win') emoMap[t.psychology].w++
      emoMap[t.psychology].pl+=t.pnl
    })
    const emotions = Object.entries(emoMap)
      .map(([e,d])=>({ e, wr:+((d.w/d.total)*100).toFixed(1), total:d.total, pl:+d.pl.toFixed(2) }))
      .sort((a,b)=>b.wr-a.wr)

    return { avgWin, avgLoss, best, worst, maxDD: dd, pf, monthly, pairs, emotions }
  }, [trades])

  if (!trades.length) return (
    <div className="fade-in">
      <h1 className="text-xl font-bold text-zinc-100 tracking-tight mb-2">Analytics</h1>
      <div className="card p-16 text-center text-muted">
        <div className="text-4xl mb-3">📊</div>
        <div className="text-sm">Add trades to see analytics</div>
      </div>
    </div>
  )

  const { avgWin, avgLoss, best, worst, maxDD, pf, monthly, pairs, emotions } = s!
  const maxPairPL = Math.max(...pairs.map(p => Math.abs(p.pl)), 1)

  return (
    <div className="fade-in space-y-4">
      <div>
        <h1 className="text-xl font-bold text-zinc-100 tracking-tight">Analytics</h1>
        <p className="text-sm text-muted mt-0.5">Performance deep dive</p>
      </div>

      {/* Key metrics */}
      <div className="grid grid-cols-4 gap-3">
        {[
          { label:'Profit Factor', val: pf,                           color:'#22c55e' },
          { label:'Avg Win',       val: '+$'+avgWin.toFixed(2),       color:'#22c55e' },
          { label:'Avg Loss',      val: '-$'+avgLoss.toFixed(2),      color:'#ef4444' },
          { label:'Max Drawdown',  val: '-$'+maxDD.toFixed(2),        color:'#eab308' },
        ].map(m => (
          <div key={m.label} className="card p-4 relative overflow-hidden">
            <div className="stat-border" style={{ background: m.color }}/>
            <div className="text-[10px] font-semibold text-muted uppercase tracking-wider">{m.label}</div>
            <div className="text-xl font-bold mt-1.5 font-mono" style={{ color: m.color }}>{m.val}</div>
          </div>
        ))}
      </div>

      {/* Monthly P&L bar chart */}
      {monthly.length > 0 && (
        <div className="card p-5">
          <div className="font-semibold text-sm text-zinc-200 mb-4">Monthly P&L</div>
          <ResponsiveContainer width="100%" height={130}>
            <BarChart data={monthly} barSize={28}>
              <XAxis dataKey="m" tick={{ fill:'#52525b', fontSize:10 }} axisLine={false} tickLine={false}/>
              <YAxis hide/>
              <Tooltip content={<TT/>}/>
              <Bar dataKey="pl" name="P&L" radius={[4,4,0,0]}>
                {monthly.map((d,i) => <Cell key={i} fill={d.pl >= 0 ? '#22c55e' : '#ef4444'} fillOpacity={0.75}/>)}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>
      )}

      {/* Pair performance + Psychology side by side */}
      <div className="grid grid-cols-2 gap-4">
        {/* By Pair */}
        <div className="card p-5">
          <div className="font-semibold text-sm text-zinc-200 mb-3">Performance by Pair</div>
          <div className="space-y-3">
            {pairs.slice(0, 8).map(p => (
              <div key={p.pair}>
                <div className="flex items-center justify-between text-xs mb-1">
                  <span className="font-semibold text-zinc-300 w-16">{p.pair}</span>
                  <span className="text-muted">{p.total} trades</span>
                  <span className={clsx('font-mono font-semibold', p.pl>=0?'text-green':'text-red')}>
                    {p.pl>=0?'+':''}${p.pl.toFixed(0)}
                  </span>
                  <span className="text-muted w-10 text-right">{p.wr}%</span>
                </div>
                <div className="h-1.5 bg-bg3 rounded-full overflow-hidden">
                  <div className="h-full rounded-full" style={{
                    width: (Math.abs(p.pl)/maxPairPL*100)+'%',
                    background: p.pl>=0?'#22c55e':'#ef4444'
                  }}/>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* By Emotion */}
        <div className="card p-5">
          <div className="font-semibold text-sm text-zinc-200 mb-3">Psychology · Win Rate</div>
          <div className="space-y-2">
            {emotions.map(e => (
              <div key={e.e} className="flex items-center gap-3 bg-bg3 border border-border rounded-lg px-3 py-2">
                <span className="text-base">{e.e.split(' ')[0]}</span>
                <div className="flex-1 min-w-0">
                  <div className="text-xs font-medium text-zinc-300 truncate">{e.e.split(' ').slice(1).join(' ')}</div>
                  <div className="text-[10px] text-muted">{e.total} trades · {e.pl>=0?'+':''}${e.pl.toFixed(0)}</div>
                </div>
                <div className={clsx('font-mono text-sm font-bold', e.wr>=50?'text-green':'text-red')}>{e.wr}%</div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Best / Worst */}
      <div className="grid grid-cols-2 gap-4">
        <div className="card p-5 border-green/15">
          <div className="text-[10px] font-semibold text-muted uppercase tracking-wider mb-1">Best Single Trade</div>
          <div className="text-2xl font-bold text-green font-mono">+${best.toFixed(2)}</div>
        </div>
        <div className="card p-5 border-red/15">
          <div className="text-[10px] font-semibold text-muted uppercase tracking-wider mb-1">Worst Single Trade</div>
          <div className="text-2xl font-bold text-red font-mono">${worst.toFixed(2)}</div>
        </div>
      </div>
    </div>
  )
}
