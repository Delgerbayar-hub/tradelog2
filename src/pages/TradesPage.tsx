// src/pages/TradesPage.tsx
import React, { useState } from 'react'
import { Trash2, ChevronDown, ChevronRight } from 'lucide-react'
import type { Trade } from '../types'
import clsx from 'clsx'

interface Props { trades: Trade[]; onAdd: () => void; onDelete: (id: string) => void }

const PAIRS    = ['XAUUSD','EURUSD','GBPUSD','USDJPY','USDCHF','AUDUSD','NZDUSD','GBPJPY','EURJPY','USDCAD','US30','NAS100','GER40']
const SESSIONS = ['Asian','London','New York']

export default function TradesPage({ trades, onAdd, onDelete }: Props) {
  const [pair,    setPair]    = useState('')
  const [session, setSession] = useState('')
  const [result,  setResult]  = useState('')
  const [expanded, setExpanded] = useState<string | null>(null)
  const [lightbox, setLightbox] = useState<string | null>(null)

  const filtered = [...trades]
    .filter(t => (!pair || t.pair === pair) && (!session || t.session === session) && (!result || t.result === result))
    .reverse()

  const sel = 'bg-bg3 border border-border2 text-zinc-300 px-2.5 py-1.5 rounded-lg text-xs outline-none focus:border-accent/40 cursor-pointer'

  return (
    <div className="fade-in">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-xl font-bold text-zinc-100 tracking-tight">Trades</h1>
          <p className="text-sm text-muted mt-0.5">Full journal log</p>
        </div>
        <button onClick={onAdd} className="btn-primary">+ Log Trade</button>
      </div>

      <div className="card overflow-hidden">
        {/* Filter bar */}
        <div className="flex items-center justify-between px-5 py-3 border-b border-border">
          <span className="text-sm text-zinc-400">
            <span className="font-semibold text-zinc-200">{filtered.length}</span> trades
          </span>
          <div className="flex gap-2">
            <select value={pair}    onChange={e => setPair(e.target.value)}    className={sel}>
              <option value="">All Pairs</option>
              {PAIRS.map(p => <option key={p}>{p}</option>)}
            </select>
            <select value={session} onChange={e => setSession(e.target.value)} className={sel}>
              <option value="">All Sessions</option>
              {SESSIONS.map(s => <option key={s}>{s}</option>)}
            </select>
            <select value={result}  onChange={e => setResult(e.target.value)}  className={sel}>
              <option value="">All Results</option>
              {['Win','Loss','BE'].map(r => <option key={r}>{r}</option>)}
            </select>
          </div>
        </div>

        {!filtered.length ? (
          <div className="text-center py-16 text-muted">
            <div className="text-4xl mb-3">📋</div>
            <div className="text-sm">No trades yet — log your first trade</div>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full border-collapse text-sm">
              <thead>
                <tr className="bg-bg2">
                  {['#','Date','Pair','Dir','Session','Lot','Risk','R:R','P&L','Result','Chart',''].map(h => (
                    <th key={h} className="text-left px-4 py-2.5 text-[10px] font-semibold text-muted uppercase tracking-wider border-b border-border">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {filtered.map((t, i) => (
                  <React.Fragment key={t.id}>
                    <tr
                      onClick={() => setExpanded(expanded === t.id ? null : t.id)}
                      className="border-b border-border hover:bg-bg3/50 cursor-pointer transition-colors">
                      <td className="px-4 py-3 font-mono text-[10px] text-muted">#{String(trades.length - i).padStart(3,'0')}</td>
                      <td className="px-4 py-3 font-mono text-[11px] text-zinc-400">{t.date}</td>
                      <td className="px-4 py-3 font-semibold text-[13px] text-zinc-100">{t.pair}</td>
                      <td className="px-4 py-3">
                        <span className={t.direction === 'Buy' ? 'badge-buy' : 'badge-sell'}>{t.direction}</span>
                      </td>
                      <td className="px-4 py-3 text-xs text-muted">{t.session}</td>
                      <td className="px-4 py-3 font-mono text-xs text-zinc-300">{t.lot || '—'}</td>
                      <td className="px-4 py-3 font-mono text-xs text-zinc-300">{t.risk ? t.risk + '%' : '—'}</td>
                      <td className="px-4 py-3 font-mono text-xs text-purple-400">1:{t.rr || '—'}</td>
                      <td className={clsx('px-4 py-3 font-mono text-[12px] font-semibold', t.pl >= 0 ? 'text-green' : 'text-red')}>
                        {t.pl >= 0 ? '+' : ''}${t.pl.toFixed(2)}
                      </td>
                      <td className="px-4 py-3">
                        <span className={`badge-${t.result.toLowerCase() as 'win'|'loss'|'be'}`}>{t.result}</span>
                      </td>
                      <td className="px-4 py-3">
                        {t.screenshotBase64
                          ? <img src={t.screenshotBase64} onClick={e => { e.stopPropagation(); setLightbox(t.screenshotBase64!) }}
                              className="w-10 h-7 object-cover rounded border border-border2 hover:border-accent/40 cursor-pointer transition-colors" alt="chart"/>
                          : <span className="text-muted text-xs">—</span>}
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-1.5">
                          {expanded === t.id ? <ChevronDown size={12} className="text-muted"/> : <ChevronRight size={12} className="text-muted"/>}
                          <button onClick={e => { e.stopPropagation(); onDelete(t.id) }}
                            className="text-muted hover:text-red transition-colors p-0.5 ml-1">
                            <Trash2 size={12}/>
                          </button>
                        </div>
                      </td>
                    </tr>

                    {/* Expanded detail row */}
                    {expanded === t.id && (
                      <tr className="border-b border-border bg-bg3/30">
                        <td colSpan={12} className="px-6 py-4">
                          <div className="grid grid-cols-3 gap-4 text-sm">
                            <div>
                              <div className="text-[10px] font-semibold text-muted uppercase tracking-wider mb-1">Strategy</div>
                              <div className="text-zinc-300">{t.strategy}</div>
                            </div>
                            <div>
                              <div className="text-[10px] font-semibold text-muted uppercase tracking-wider mb-1">Psychology</div>
                              <div className="text-zinc-300">{t.emotion}</div>
                            </div>
                            <div>
                              <div className="text-[10px] font-semibold text-muted uppercase tracking-wider mb-1">Notes</div>
                              <div className="text-zinc-300 leading-relaxed">{t.notes || <span className="text-muted italic">No notes</span>}</div>
                            </div>
                          </div>
                          {t.screenshotBase64 && (
                            <div className="mt-3">
                              <img src={t.screenshotBase64} onClick={() => setLightbox(t.screenshotBase64!)}
                                className="max-h-48 rounded-lg border border-border2 cursor-pointer hover:border-accent/40 transition-colors object-contain" alt="chart"/>
                            </div>
                          )}
                        </td>
                      </tr>
                    )}
                  </React.Fragment>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Lightbox */}
      {lightbox && (
        <div className="fixed inset-0 bg-black/90 z-[600] flex items-center justify-center p-4" onClick={() => setLightbox(null)}>
          <img src={lightbox} className="max-w-[90vw] max-h-[88vh] rounded-xl border border-border2 object-contain"/>
          <button onClick={() => setLightbox(null)} className="absolute top-4 right-5 text-muted hover:text-zinc-200 text-2xl transition-colors">×</button>
        </div>
      )}
    </div>
  )
}
