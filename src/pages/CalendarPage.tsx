// src/pages/CalendarPage.tsx
import { useState, useMemo } from 'react'
import { ChevronLeft, ChevronRight } from 'lucide-react'
import type { Trade } from '../types'
import clsx from 'clsx'

const MONTHS = ['January','February','March','April','May','June','July','August','September','October','November','December']
const DAYS   = ['Да','Мя','Лх','Пү','Ба','Бя','Ня']

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
  const mPL      = mTrades.reduce((s,t) => s + t.pnl, 0)
  const mDays    = [...new Set(mTrades.map(t => t.date))]
  const winDays  = mDays.filter(d => (dayMap[d]||[]).reduce((s,t) => s+t.pnl,0) > 0).length
  const lossDays = mDays.filter(d => (dayMap[d]||[]).reduce((s,t) => s+t.pnl,0) < 0).length

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

  const fmtDate = (ds: string) => {
    const d = new Date(ds + 'T00:00:00')
    return d.toLocaleDateString('mn-MN', { month: 'long', day: 'numeric', weekday: 'long' })
  }

  return (
    <>
      {popup && (
        <div className="fixed inset-0 bg-black/80 z-[500] flex items-center justify-center backdrop-blur-sm p-4" onClick={() => setPopup(null)}>
          <div className="bg-bg2 border border-border rounded-2xl w-full max-w-[420px] max-h-[80vh] overflow-y-auto shadow-2xl" onClick={e => e.stopPropagation()}>
            {/* Popup header */}
            <div className="flex justify-between items-start p-5 border-b border-border">
              <div>
                <div className="text-xs text-muted mb-0.5">Арилжааны жагсаалт</div>
                <div className="font-semibold text-zinc-100">{fmtDate(popup.date)}</div>
              </div>
              <button onClick={() => setPopup(null)} className="w-7 h-7 rounded-full bg-bg3 flex items-center justify-center text-muted hover:text-zinc-200 transition-colors text-base">×</button>
            </div>
            {/* Day summary */}
            {(() => {
              const pl  = popup.trades.reduce((s,t) => s+t.pnl, 0)
              const wins = popup.trades.filter(t=>t.result==='Win').length
              const wr  = Math.round((wins / popup.trades.length) * 100)
              return (
                <div className="grid grid-cols-3 divide-x divide-border border-b border-border">
                  {[
                    { l: 'Нийт PNL',  v: (pl>=0?'+':'')+'$'+pl.toFixed(2), c: pl>=0 ? 'text-green' : 'text-red' },
                    { l: 'Арилжаа',   v: String(popup.trades.length),        c: 'text-zinc-100' },
                    { l: 'Win Rate',  v: wr+'%',                             c: 'text-green' },
                  ].map(s => (
                    <div key={s.l} className="py-3 text-center">
                      <div className={`text-base font-bold font-mono ${s.c}`}>{s.v}</div>
                      <div className="text-[10px] text-muted mt-0.5">{s.l}</div>
                    </div>
                  ))}
                </div>
              )
            })()}
            {/* Trade list */}
            <div className="p-4 space-y-2">
              {popup.trades.map(t => (
                <div key={t.id} className={clsx(
                  'rounded-xl border p-3.5',
                  t.result==='Win'  ? 'border-green/30 bg-green/5'  :
                  t.result==='Loss' ? 'border-red/30   bg-red/5'    :
                                      'border-yellow/30 bg-yellow/5'
                )}>
                  <div className="flex justify-between items-start mb-2">
                    <div>
                      <span className="font-bold text-sm text-zinc-100">{t.pair}</span>
                      {t.account && <span className="ml-2 text-[10px] text-muted">{t.account}</span>}
                    </div>
                    <span className={clsx('font-mono font-bold text-sm', t.pnl>=0?'text-green':'text-red')}>
                      {t.pnl>=0?'+':''}${t.pnl.toFixed(2)}
                    </span>
                  </div>
                  <div className="flex gap-1.5 flex-wrap">
                    <span className={t.direction==='buy'?'badge-buy':'badge-sell'}>{t.direction}</span>
                    <span className={t.result==='Win'?'badge-win':t.result==='Loss'?'badge-loss':'badge-be'}>{t.result}</span>
                    {t.rrRatio && <span className="text-[10px] bg-bg3 text-muted px-1.5 py-0.5 rounded">{t.rrRatio}</span>}
                    <span className="text-[10px] text-muted self-center">{t.session}</span>
                  </div>
                  {t.screenshotBefore?.[0] && (
                    <img src={t.screenshotBefore[0]} className="w-full rounded-lg mt-2.5 max-h-32 object-cover" alt="chart"/>
                  )}
                  {t.review && <p className="text-[11px] text-muted mt-2 leading-relaxed">{t.review}</p>}
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      <div className="p-6 fade-in">
        {/* Page header */}
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-xl font-bold text-zinc-100 tracking-tight">Calendar</h1>
            <p className="text-sm text-muted mt-0.5">Өдөр бүрийн PNL</p>
          </div>
          <button onClick={onAdd} className="btn-primary">Арилжаа бүртгэх+</button>
        </div>

        {/* Month stats */}
        <div className="grid grid-cols-4 gap-3 mb-5">
          {[
            { label: 'Нийт арилжаа', val: mTrades.length,                                    color: '#00e5ff' },
            { label: 'Ногоон өдөр',  val: winDays,                                           color: '#22c55e' },
            { label: 'Улаан өдөр',   val: lossDays,                                          color: '#ef4444' },
            { label: 'Сарын PNL',    val: (mPL>=0?'+':'')+'$'+Math.abs(mPL).toFixed(0),     color: mPL>=0?'#22c55e':'#ef4444' },
          ].map(s => (
            <div key={s.label} className="card p-4 relative overflow-hidden">
              <div className="stat-border" style={{ background: s.color }}/>
              <div className="text-[10px] font-semibold text-muted uppercase tracking-wider">{s.label}</div>
              <div className="text-2xl font-bold mt-1.5" style={{ color: s.color }}>{s.val}</div>
            </div>
          ))}
        </div>

        {/* Calendar card */}
        <div className="card p-5">
          {/* Month nav */}
          <div className="flex items-center justify-between mb-5">
            <div className="text-base font-semibold text-zinc-100">{MONTHS[mo]} {yr}</div>
            <div className="flex items-center gap-1.5">
              <button onClick={() => nav(-1)} className="btn-icon"><ChevronLeft size={14}/></button>
              <button onClick={() => { setYr(now.getFullYear()); setMo(now.getMonth()) }} className="btn-ghost px-3 py-1.5 text-xs">Өнөөдөр</button>
              <button onClick={() => nav(1)}  className="btn-icon"><ChevronRight size={14}/></button>
            </div>
          </div>

          {/* Day headers */}
          <div className="grid grid-cols-7 gap-1.5 mb-1.5">
            {DAYS.map(d => (
              <div key={d} className="text-center text-[10px] font-semibold text-muted uppercase tracking-widest py-1">{d}</div>
            ))}
          </div>

          {/* Cells */}
          <div className="grid grid-cols-7 gap-1.5">
            {cells.map((c, i) => {
              if (!c.cur) return (
                <div key={i} className="h-[88px] rounded-xl bg-bg3/30 border border-border/30 opacity-25 p-2">
                  <div className="text-[11px] text-muted">{c.day}</div>
                </div>
              )

              const dt  = dayMap[c.date] || []
              const pl  = dt.reduce((s,t) => s + t.pnl, 0)
              const isT = c.date === today
              const hasT = dt.length > 0

              return (
                <div key={i}
                  onClick={() => hasT && setPopup({ date: c.date, trades: dt })}
                  className={clsx(
                    'h-[88px] rounded-xl border p-2 flex flex-col transition-all duration-150',
                    hasT && pl > 0  ? 'border-green/30 bg-green/8  hover:bg-green/14  cursor-pointer' : '',
                    hasT && pl < 0  ? 'border-red/30   bg-red/8    hover:bg-red/14    cursor-pointer' : '',
                    hasT && pl === 0 ? 'border-yellow/30 bg-yellow/8 hover:bg-yellow/14 cursor-pointer' : '',
                    !hasT           ? 'border-border/50 bg-bg/40' : '',
                    isT             ? 'ring-1 ring-accent/50' : '',
                  )}>
                  {/* Day number */}
                  <div className={clsx(
                    'text-[11px] font-semibold w-5 h-5 flex items-center justify-center rounded-full mb-1',
                    isT ? 'bg-accent text-black' : 'text-muted'
                  )}>{c.day}</div>

                  {/* PNL */}
                  {hasT ? (
                    <div className="flex-1 flex flex-col items-center justify-center">
                      <div className={clsx(
                        'text-[15px] font-bold font-mono leading-none',
                        pl > 0 ? 'text-green' : pl < 0 ? 'text-red' : 'text-yellow'
                      )}>
                        {pl >= 0 ? '+' : ''}${Math.abs(pl) >= 1000 ? (pl/1000).toFixed(1)+'k' : pl.toFixed(0)}
                      </div>
                      <div className="text-[9px] text-muted mt-1">{dt.length} арилжаа</div>
                    </div>
                  ) : (
                    <div className="flex-1" />
                  )}
                </div>
              )
            })}
          </div>
        </div>
      </div>
    </>
  )
}
