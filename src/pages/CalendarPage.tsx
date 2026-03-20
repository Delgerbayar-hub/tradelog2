// src/pages/CalendarPage.tsx
import { useState, useMemo, useCallback } from 'react'
import { ChevronLeft, ChevronRight, NotebookPen, X } from 'lucide-react'
import type { Trade, UserSettings } from '../types'
import { fmtPnl } from '../lib/format'
import { getActiveAccounts, getArchivedNames } from '../lib/accounts'
import clsx from 'clsx'

const MONTHS = ['January','February','March','April','May','June','July','August','September','October','November','December']
const DAYS   = ['Sun','Mon','Tue','Wed','Thu','Fri','Sat']

interface Props {
  trades: Trade[]
  onAdd: () => void
  userSettings?: UserSettings | null
  onUpdateSettings?: (p: Partial<UserSettings>) => void
}

export default function CalendarPage({ trades, onAdd, userSettings, onUpdateSettings }: Props) {
  const allAccounts = userSettings?.accounts ?? []
  const accounts    = getActiveAccounts(allAccounts)
  const archived    = getArchivedNames(allAccounts)
  const now = new Date()
  const [yr, setYr]   = useState(now.getFullYear())
  const [mo, setMo]   = useState(now.getMonth())
  const [popup, setPopup]       = useState<{ date: string; trades: Trade[] } | null>(null)
  const [weekReview, setWeekReview] = useState<{ key: string; label: string } | null>(null)
  const [weekDraft, setWeekDraft]   = useState('')
  const [selectedAccount, setSelectedAccount] = useState('All')

  const visibleTrades = useMemo(() =>
    trades.filter(t => !archived.has(t.account))
  , [trades, archived])

  const filtered = useMemo(() =>
    selectedAccount === 'All' ? visibleTrades : visibleTrades.filter(t => t.account === selectedAccount)
  , [visibleTrades, selectedAccount])

  const dayMap = useMemo(() => {
    const m: Record<string, Trade[]> = {}
    filtered.forEach(t => { if (!m[t.date]) m[t.date] = []; m[t.date].push(t) })
    return m
  }, [filtered])

  const prefix  = `${yr}-${String(mo + 1).padStart(2,'0')}`
  const mTrades = filtered.filter(t => t.date.startsWith(prefix))
  const mPL     = mTrades.reduce((s,t) => s + t.pnl, 0)
  const mDays   = [...new Set(mTrades.map(t => t.date))]
  const winDays = mDays.filter(d => (dayMap[d]||[]).reduce((s,t)=>s+t.pnl,0) > 0).length
  const lossDays= mDays.filter(d => (dayMap[d]||[]).reduce((s,t)=>s+t.pnl,0) < 0).length

  const nav = (dir: number) => {
    let m = mo + dir, y = yr
    if (m > 11) { m = 0; y++ }
    if (m < 0)  { m = 11; y-- }
    setMo(m); setYr(y)
  }

  const offset  = new Date(yr, mo, 1).getDay()
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

  const weeks: typeof cells[] = []
  for (let i = 0; i < cells.length; i += 7) weeks.push(cells.slice(i, i + 7))

  const fmtDate = (ds: string) =>
    new Date(ds + 'T00:00:00').toLocaleDateString('mn-MN', { month: 'long', day: 'numeric', weekday: 'long' })

  const pnlStr = (pl: number) => fmtPnl(pl)

  const monthKey    = `${yr}-${String(mo + 1).padStart(2, '0')}`
  const monthReview = userSettings?.monthlyReviews?.[monthKey] ?? ''

  const saveMonthReview = useCallback((text: string) => {
    onUpdateSettings?.({
      monthlyReviews: { ...(userSettings?.monthlyReviews ?? {}), [monthKey]: text },
    })
  }, [monthKey, onUpdateSettings, userSettings?.monthlyReviews])

  const openWeekReview = (wi: number) => {
    const key   = `${monthKey}-W${wi + 1}`
    const label = `Week ${wi + 1} — ${MONTHS[mo]} ${yr}`
    setWeekDraft(userSettings?.weeklyReviews?.[key] ?? '')
    setWeekReview({ key, label })
  }

  const saveWeekReview = () => {
    if (!weekReview) return
    onUpdateSettings?.({
      weeklyReviews: { ...(userSettings?.weeklyReviews ?? {}), [weekReview.key]: weekDraft },
    })
    setWeekReview(null)
  }

  return (
    <>
      {/* ── Popup ── */}
      {popup && (
        <div className="fixed inset-0 bg-black/80 z-[500] flex items-center justify-center backdrop-blur-sm p-4"
          onClick={() => setPopup(null)}>
          <div className="bg-bg2 border border-border rounded-2xl w-full max-w-[420px] max-h-[80vh] overflow-y-auto shadow-2xl"
            onClick={e => e.stopPropagation()}>
            <div className="flex justify-between items-start p-5 border-b border-border">
              <div>
                <div className="text-xs text-muted mb-0.5">Арилжааны жагсаалт</div>
                <div className="font-semibold text-primary">{fmtDate(popup.date)}</div>
              </div>
              <button onClick={() => setPopup(null)}
                className="w-7 h-7 rounded-full bg-bg3 flex items-center justify-center text-muted hover:text-primary transition-colors">×</button>
            </div>
            {(() => {
              const pl   = popup.trades.reduce((s,t) => s+t.pnl, 0)
              const wins = popup.trades.filter(t=>t.result==='Win').length
              const wr   = Math.round((wins / popup.trades.length) * 100)
              return (
                <div className="grid grid-cols-3 divide-x divide-border border-b border-border">
                  {[
                    { l:'Нийт PNL', v: pnlStr(pl), c: pl>=0 ? 'text-profit' : 'text-loss' },
                    { l:'Арилжаа',  v: String(popup.trades.length), c:'text-primary' },
                    { l:'Win Rate', v: wr+'%', c: wr>=50?'text-profit':'text-loss' },
                  ].map(s => (
                    <div key={s.l} className="py-4 text-center">
                      <div className={`text-base font-bold font-mono ${s.c}`}>{s.v}</div>
                      <div className="text-[10px] text-muted mt-0.5">{s.l}</div>
                    </div>
                  ))}
                </div>
              )
            })()}
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
                      <span className="font-bold text-sm text-primary">{t.pair}</span>
                      {t.account && <span className="ml-2 text-[10px] text-muted bg-bg3 px-1.5 py-0.5 rounded">{t.account}</span>}
                    </div>
                    <span className={clsx('font-mono font-bold text-sm', t.pnl>=0?'text-profit':'text-loss')}>
                      {pnlStr(t.pnl)}
                    </span>
                  </div>
                  <div className="flex gap-1.5 flex-wrap">
                    <span className={t.direction==='buy'?'badge-buy':'badge-sell'}>{t.direction}</span>
                    <span className={t.result==='Win'?'badge-win':t.result==='Loss'?'badge-loss':'badge-be'}>{t.result}</span>
                    {t.rrRatio && <span className="text-[10px] bg-bg3 text-muted px-1.5 py-0.5 rounded">{t.rrRatio}</span>}
                    {t.session && <span className="text-[10px] text-muted self-center">{t.session}</span>}
                  </div>
                  {t.screenshotBefore?.[0]?.trim() && (
                    <img src={t.screenshotBefore[0]} className="w-full rounded-lg mt-2.5 max-h-32 object-cover" alt="chart"/>
                  )}
                  {t.review && <p className="text-[11px] text-muted mt-2 leading-relaxed">{t.review}</p>}
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* ── Week Review Modal ── */}
      {weekReview && (
        <div className="fixed inset-0 bg-black/80 z-[500] flex items-center justify-center backdrop-blur-sm p-4"
          onClick={() => setWeekReview(null)}>
          <div className="bg-bg2 border border-border rounded-2xl w-full max-w-md shadow-2xl"
            onClick={e => e.stopPropagation()}>
            <div className="flex items-center justify-between px-5 py-4 border-b border-border">
              <div className="flex items-center gap-2">
                <NotebookPen size={15} className="text-accent" />
                <span className="font-semibold text-primary text-sm">{weekReview.label}</span>
              </div>
              <button onClick={() => setWeekReview(null)}
                className="w-7 h-7 rounded-full bg-bg3 flex items-center justify-center text-muted hover:text-primary transition-colors">
                <X size={13} />
              </button>
            </div>
            <div className="p-5">
              <textarea
                autoFocus
                value={weekDraft}
                onChange={e => setWeekDraft(e.target.value.slice(0, 696))}
                placeholder="Write your weekly review — what went well, what to improve..."
                rows={6}
                className="w-full bg-bg3 border border-border rounded-xl px-4 py-3 text-sm text-primary placeholder-zinc-600 resize-none focus:outline-none focus:border-accent/50 transition-colors"
              />
              <div className="flex items-center justify-between mt-2">
                <span className={clsx('text-[11px]', weekDraft.length >= 696 ? 'text-loss' : 'text-muted')}>
                  {weekDraft.length} / 696
                </span>
                <div className="flex gap-2">
                  <button onClick={() => setWeekReview(null)}
                    className="px-4 py-2 text-sm text-muted hover:text-primary transition-colors">
                    Cancel
                  </button>
                  <button onClick={saveWeekReview}
                    className="px-5 py-2 text-sm bg-accent text-black font-semibold rounded-xl hover:bg-accent/90 transition-colors">
                    Save
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      <div className="py-10 px-12 pt-16 fade-in space-y-4">

        {/* ── Header: Monthly P/L + stats ── */}
        <div className="text-center">
          <span className="text-xl font-bold font-mono text-primary">Monthly P/L: </span>
          <span className={`text-xl font-bold font-mono ${mPL >= 0 ? 'text-profit' : 'text-loss'}`}>
            {fmtPnl(mPL)}
          </span>
        </div>

        {/* ── Controls ── */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-1">
            <button onClick={() => nav(-1)} className="btn-icon w-8 h-8"><ChevronLeft size={14}/></button>
            <span className="text-sm font-semibold text-primary px-3 py-1.5 rounded-lg bg-bg2 border border-border min-w-[130px] text-center">
              {MONTHS[mo]} {yr}
            </span>
            <button onClick={() => nav(1)} className="btn-icon w-8 h-8"><ChevronRight size={14}/></button>
          </div>

          <div className="flex items-center gap-2">
            {accounts.length > 0 && (
              <div className="flex items-center gap-1 bg-bg2 border border-border rounded-xl p-1">
                <button onClick={() => setSelectedAccount('All')}
                  className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${selectedAccount==='All' ? 'bg-bg3 text-primary' : 'text-muted hover:text-secondary'}`}>
                  Бүгд
                </button>
                {accounts.map(a => (
                  <button key={a.name} onClick={() => setSelectedAccount(a.name)}
                    className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${selectedAccount===a.name ? 'bg-accent/15 text-accent' : 'text-muted hover:text-secondary'}`}>
                    {a.name}
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* ── Calendar ── */}
        <div className="border border-border rounded-2xl overflow-hidden bg-bg2">

          {/* Day headers */}
          <div className="grid grid-cols-7 bg-bg3/40 border-b border-border">
            {DAYS.map((d, i) => (
              <div key={d} className={clsx(
                'text-center text-[11px] font-semibold tracking-wide py-3',
                i < 6 && 'border-r border-border',
                i === 6 ? 'text-muted' : 'text-muted'
              )}>{d}</div>
            ))}
          </div>

          {/* Weeks */}
          {weeks.map((week, wi) => {
            const weekTrades = week.flatMap(c => c.cur ? (dayMap[c.date] || []) : [])
            const weekPL     = weekTrades.reduce((s,t) => s + t.pnl, 0)
            const weekCount  = weekTrades.length
            const isLast     = wi === weeks.length - 1

            return (
              <div key={wi} className="grid grid-cols-7" style={{ minHeight: 120 }}>
                {week.map((c, ci) => {
                  const isSat = ci === 6
                  const dt    = c.cur ? (dayMap[c.date] || []) : []
                  const pl    = dt.reduce((s,t) => s + t.pnl, 0)
                  const isT   = c.date === today
                  const hasT  = dt.length > 0

                  /* Saturday = week summary */
                  if (isSat) {
                    const wKey    = `${monthKey}-W${wi + 1}`
                    const hasNote = !!(userSettings?.weeklyReviews?.[wKey])
                    return (
                      <div key={ci}
                        onClick={() => openWeekReview(wi)}
                        title="Write weekly review"
                        className={clsx(
                          'border-l flex flex-col items-center justify-center gap-1.5 px-2 py-4 cursor-pointer group',
                          'border-border bg-bg3/20 hover:bg-bg3/40 transition-colors',
                          !isLast && 'border-b',
                        )}>
                        <span className="text-[12px] font-medium text-muted tracking-wide">Week{wi + 1}</span>
                        <span className={clsx(
                          'text-[26px] font-bold font-mono leading-none',
                          weekPL > 0 ? 'text-profit' : weekPL < 0 ? 'text-loss' : 'text-muted'
                        )}>
                          {weekCount > 0 ? fmtPnl(weekPL) : '—'}
                        </span>
                        {weekCount > 0 && (
                          <span className="text-[12px] text-muted">{weekCount} trades</span>
                        )}
                        <div className={clsx(
                          'flex items-center gap-1 px-2 py-0.5 rounded-md text-[11px] font-medium transition-all',
                          hasNote
                            ? 'bg-accent/15 text-accent'
                            : 'bg-bg3 text-muted group-hover:text-secondary group-hover:bg-bg3/80'
                        )}>
                          <NotebookPen size={10} />
                          {hasNote ? 'Note' : '+ Note'}
                        </div>
                      </div>
                    )
                  }

                  /* Regular day */
                  return (
                    <div key={ci}
                      onClick={() => hasT && setPopup({ date: c.date, trades: dt })}
                      className={clsx(
                        'flex flex-col p-2.5 transition-colors duration-150',
                        ci > 0 && 'border-l border-border2',
                        !isLast && 'border-b border-border2',
                        !c.cur && 'opacity-25',
                        hasT && pl > 0   && 'bg-green/20  hover:bg-green/30  cursor-pointer',
                        hasT && pl < 0   && 'bg-red/20    hover:bg-red/30    cursor-pointer',
                        hasT && pl === 0 && 'bg-yellow/20 hover:bg-yellow/30 cursor-pointer',
                      )}>

                      {/* Date badge */}
                      <div className={clsx(
                        'text-xs font-semibold w-[22px] h-[22px] flex items-center justify-center rounded-full self-start leading-none',
                        isT  ? 'bg-accent text-black font-bold' :
                        c.cur ? 'text-muted' : 'text-muted'
                      )}>{c.day}</div>

                      {/* PNL */}
                      {hasT && (
                        <div className="flex-1 flex flex-col items-center justify-center gap-0.5 mt-1">
                          <span className={clsx(
                            'text-[22px] font-bold font-mono leading-none',
                            pl > 0 ? 'text-profit' : pl < 0 ? 'text-loss' : 'text-yellow'
                          )}>
                            {fmtPnl(pl)}
                          </span>
                          <span className="text-[11px] text-muted">{dt.length} trades</span>
                        </div>
                      )}
                    </div>
                  )
                })}
              </div>
            )
          })}
        </div>

        {/* ── Monthly Review ── */}
        <div className="bg-bg2 border border-border rounded-2xl p-5 space-y-3">
          <div className="flex items-center gap-2">
            <NotebookPen size={14} className="text-accent" />
            <span className="text-sm font-semibold text-primary">Monthly Review</span>
            <span className="text-xs text-muted">— {MONTHS[mo]} {yr}</span>
          </div>
          <textarea
            value={monthReview}
            onChange={e => saveMonthReview(e.target.value.slice(0, 1693))}
            placeholder="What were your strengths this month? What needs improvement? Key lessons..."
            rows={4}
            className="w-full bg-bg3 border border-border rounded-xl px-4 py-3 text-sm text-primary placeholder-zinc-600 resize-none focus:outline-none focus:border-accent/50 transition-colors"
          />
          <div className={clsx('text-[11px] text-right mt-1', monthReview.length >= 1693 ? 'text-loss' : 'text-muted')}>
            {monthReview.length} / 1693
          </div>
        </div>
      </div>
    </>
  )
}
