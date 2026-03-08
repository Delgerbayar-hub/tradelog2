// src/pages/CalendarPage.tsx
import React, { useState, useMemo } from 'react'
import { ChevronLeft, ChevronRight } from 'lucide-react'
import type { Trade } from '../types'
import clsx from 'clsx'

const MONTHS = ['January','February','March','April','May','June','July','August','September','October','November','December']
const DAYS   = ['Mon','Tue','Wed','Thu','Fri','Sat','Sun']

interface Props { trades: Trade[]; onAdd: () => void }

export default function CalendarPage({ trades, onAdd }: Props) {
  const now = new Date()
  const [yr, setYr] = useState(now.getFullYear())
  const [mo, setMo] = useState(now.getMonth())
  const [popup, setPopup] = useState<{ date: string; trades: Trade[] } | null>(null)

  const dayMap = useMemo(() => {
    const m: Record<string, Trade[]> = {}
    trades.forEach(t => { if (!m[t.date]) m[t.date] = []; m[t.date].push(t) })
    return m
  }, [trades])

  const prefix   = `${yr}-${String(mo + 1).padStart(2,'0')}`
  const mTrades  = trades.filter(t => t.date.startsWith(prefix))
  const mPL      = mTrades.reduce((s,t) => s + t.pl, 0)
  const mDays    = [...new Set(mTrades.map(t => t.date))]
  const winDays  = mDays.filter(d => (dayMap[d]||[]).reduce((s,t) => s+t.pl,0) > 0).length
  const lossDays = mDays.filter(d => (dayMap[d]||[]).reduce((s,t) => s+t.pl,0) < 0).length

  const nav = (dir: number) => {
    let m = mo + dir, y = yr
    if (m > 11) { m = 0; y++ }
    if (m < 0)  { m = 11; y-- }
    setMo(m); setYr(y)
  }

  const offset  = (new Date(yr, mo, 1).getDay() + 6) % 7
  const daysIn  = new Date(yr, mo + 1, 0).getDate()
  const prevDim = new Date(yr, mo, 0).getDate()
  const today   = now.toISOString().split('T')[0]

  const cells: { day: number; date: string; cur: boolean }[] = []
  for (let i = offset - 1; i >= 0; i--) cells.push({ day: prevDim - i, date: '', cur: false })
  for (let d = 1; d <= daysIn; d++) {
    const ds = `${yr}-${String(mo+1).padStart(2,'0')}-${String(d).padStart(2,'0')}`
    cells.push({ day: d, date: ds, cur: true })
  }
  const rem = (7 - cells.length % 7) % 7
  for (let d = 1; d <= rem; d++) cells.push({ day: d, date: '', cur: false })

  return (
    <div className="fade-in">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-xl font-bold text-zinc-100 tracking-tight">Calendar</h1>
          <p className="text-sm text-muted mt-0.5">Daily P&L view</p>
        </div>
        <button onClick={onAdd} className="btn-primary">+ Log Trade</button>
      </div>

      {/* Month stats */}
      <div className="grid grid-cols-4 gap-3 mb-5">
        {[
          { label:'Trades',        val: mTrades.length,                                                color:'#00e5ff' },
          { label:'Green days',    val: winDays,                                                       color:'#22c55e' },
          { label:'Red days',      val: lossDays,                                                      color:'#ef4444' },
          { label:'Month P&L',     val: (mPL>=0?'+':'')+'$'+Math.abs(mPL).toFixed(0),                 color: mPL>=0?'#22c55e':'#ef4444' },
        ].map(s => (
          <div key={s.label} className="card p-4 relative overflow-hidden">
            <div className="stat-border" style={{ background: s.color }}/>
            <div className="text-[10px] font-semibold text-muted uppercase tracking-wider">{s.label}</div>
            <div className="text-2xl font-bold mt-1.5" style={{ color: s.color }}>{s.val}</div>
          </div>
        ))}
      </div>

      {/* Calendar grid */}
      <div className="card p-5">
        <div className="flex items-center justify-between mb-5">
          <div className="font-semibold text-zinc-200">{MONTHS[mo]} {yr}</div>
          <div className="flex items-center gap-1.5">
            <button onClick={() => nav(-1)} className="btn-icon"><ChevronLeft size={13}/></button>
            <button onClick={() => { setYr(now.getFullYear()); setMo(now.getMonth()) }} className="btn-ghost px-3 py-1.5 text-xs">Today</button>
            <button onClick={() => nav(1)}  className="btn-icon"><ChevronRight size={13}/></button>
          </div>
        </div>

        {/* Day headers */}
        <div className="grid grid-cols-7 gap-1 mb-1">
          {DAYS.map(d => <div key={d} className="text-center text-[9.5px] font-semibold text-muted uppercase tracking-wider py-1">{d}</div>)}
        </div>

        {/* Cells */}
        <div className="grid grid-cols-7 gap-1">
          {cells.map((c, i) => {
            if (!c.cur) return (
              <div key={i} className="min-h-[72px] rounded-lg bg-bg3/40 border border-border/50 opacity-30 p-1.5">
                <div className="text-[10px] text-muted">{c.day}</div>
              </div>
            )

            const dt  = dayMap[c.date] || []
            const pl  = dt.reduce((s,t) => s + t.pl, 0)
            const isT = c.date === today

            return (
              <div key={i}
                onClick={() => dt.length && setPopup({ date: c.date, trades: dt })}
                className={clsx(
                  'min-h-[72px] rounded-lg border p-1.5 transition-all',
                  dt.length && pl > 0  ? 'border-green/25 bg-green/3'  : '',
                  dt.length && pl < 0  ? 'border-red/25  bg-red/3'     : '',
                  dt.length && pl === 0 && dt.length ? 'border-yellow/25 bg-yellow/3' : '',
                  !dt.length           ? 'border-border bg-bg/50'      : '',
                  dt.length            ? 'cursor-pointer hover:brightness-110' : '',
                  isT                  ? 'ring-1 ring-accent/40'       : '',
                )}>
                <div className={clsx('text-[10px] font-semibold mb-1', isT ? 'text-accent' : 'text-muted')}>{c.day}</div>
                {dt.slice(0, 2).map((t, j) => (
                  <div key={j} className={clsx('text-[9px] font-mono px-1 py-0.5 rounded mb-0.5 truncate',
                    t.result==='Win'?'bg-green/10 text-green':t.result==='Loss'?'bg-red/10 text-red':'bg-yellow/10 text-yellow')}>
                    {t.pair} {t.pl>=0?'+':''}${t.pl.toFixed(0)}
                  </div>
                ))}
                {dt.length > 2 && <div className="text-[8.5px] text-muted">+{dt.length - 2} more</div>}
                {dt.length > 0 && (
                  <div className="mt-1 pt-1 border-t border-white/5">
                    <div className={clsx('text-[9px] font-mono font-semibold', pl>=0?'text-green':'text-red')}>{pl>=0?'+':''}${pl.toFixed(2)}</div>
                  </div>
                )}
              </div>
            )
          })}
        </div>
      </div>

      {/* Day popup */}
      {popup && (
        <div className="fixed inset-0 bg-black/75 z-[500] flex items-center justify-center backdrop-blur-sm" onClick={() => setPopup(null)}>
          <div className="card w-[360px] max-h-[75vh] overflow-y-auto p-5 fade-in" onClick={e => e.stopPropagation()}>
            <div className="flex justify-between items-center mb-4">
              <div className="font-semibold text-zinc-100">{popup.date}</div>
              <button onClick={() => setPopup(null)} className="text-muted hover:text-zinc-300 text-xl transition-colors">×</button>
            </div>
            {/* Summary bar */}
            <div className="flex gap-3 pb-3 mb-3 border-b border-border">
              {(() => {
                const pl  = popup.trades.reduce((s,t) => s+t.pl, 0)
                const wr  = ((popup.trades.filter(t=>t.result==='Win').length / popup.trades.length)*100).toFixed(0)
                return [
                  { l:'P&L',    v:(pl>=0?'+':'')+'$'+pl.toFixed(2), c:pl>=0?'text-green':'text-red' },
                  { l:'Trades', v:String(popup.trades.length),       c:'text-zinc-200' },
                  { l:'Win %',  v:wr+'%',                            c:'text-green' },
                ].map(s => (
                  <div key={s.l} className="flex-1 text-center">
                    <div className={`font-mono text-sm font-semibold ${s.c}`}>{s.v}</div>
                    <div className="text-[9.5px] text-muted mt-0.5">{s.l}</div>
                  </div>
                ))
              })()}
            </div>
            {/* Trades */}
            {popup.trades.map(t => (
              <div key={t.id} className={clsx('bg-bg3 border-l-2 rounded-lg p-3 mb-2',
                t.result==='Win'?'border-green':t.result==='Loss'?'border-red':'border-yellow')}>
                <div className="flex justify-between mb-1">
                  <span className="font-semibold text-sm text-zinc-100">{t.pair}</span>
                  <span className={clsx('font-mono text-sm font-semibold', t.pl>=0?'text-green':'text-red')}>{t.pl>=0?'+':''}${t.pl.toFixed(2)}</span>
                </div>
                <div className="flex gap-1.5 flex-wrap">
                  <span className={t.direction==='Buy'?'badge-buy':'badge-sell'}>{t.direction}</span>
                  <span className={`badge-${t.result.toLowerCase() as 'win'|'loss'|'be'}`}>{t.result}</span>
                  <span className="text-[10px] text-muted self-center">{t.session}</span>
                  <span className="text-[10px] text-muted self-center">{t.emotion}</span>
                </div>
                {t.screenshotBase64 && <img src={t.screenshotBase64} className="w-full rounded mt-2 max-h-28 object-cover" alt="chart"/>}
                {t.notes && <p className="text-[11px] text-muted mt-1.5 leading-relaxed">{t.notes}</p>}
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
