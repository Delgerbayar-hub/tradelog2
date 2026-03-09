// src/pages/TradesPage.tsx
import React, { useState, useRef } from 'react'
import { Trash2, ChevronDown, ChevronRight, Download, Upload, Pencil } from 'lucide-react'
import type { Trade } from '../types'
import clsx from 'clsx'

interface Props {
  trades: Trade[]
  onAdd: () => void
  onEdit: (t: Trade) => void
  onDelete: (id: string) => void
  onImport?: (trades: Omit<Trade,'id'|'userId'|'createdAt'|'screenshotBase64'|'screenshotBefore'|'screenshotAfter'>[]) => void
  accountId: string
}

const PAIRS    = ['XAUUSD','EURUSD','GBPUSD','USDJPY','USDCHF','AUDUSD','NZDUSD','GBPJPY','EURJPY','USDCAD','US30','NAS100','GER40']
const SESSIONS = ['Asian','London','New York']

export default function TradesPage({ trades, onAdd, onEdit, onDelete, onImport, accountId }: Props) {
  const [pair,      setPair]      = useState('')
  const [session,   setSession]   = useState('')
  const [result,    setResult]    = useState('')
  const [expanded,  setExpanded]  = useState<string | null>(null)
  const [lightbox,  setLightbox]  = useState<string | null>(null)
  const [importMsg, setImportMsg] = useState('')
  const fileRef = useRef<HTMLInputElement>(null)

  const filtered = [...trades]
    .filter(t => (!pair || t.pair === pair) && (!session || t.session === session) && (!result || t.result === result))
    .reverse()

  const sel = 'bg-bg3 border border-border2 text-zinc-300 px-2.5 py-1.5 rounded-lg text-xs outline-none cursor-pointer'

  const exportCSV = () => {
    const headers = ['date','session','pair','direction','lot','risk','rr','result','pl','strategy','emotion','notes']
    const rows = [...trades].sort((a,b)=>a.date.localeCompare(b.date)).map(t =>
      headers.map(h => {
        const v = (t as any)[h]
        return typeof v === 'string' && v.includes(',') ? `"${v}"` : v
      }).join(',')
    )
    const csv = [headers.join(','), ...rows].join('\n')
    const blob = new Blob([csv], { type: 'text/csv' })
    const a = document.createElement('a')
    a.href = URL.createObjectURL(blob)
    a.download = `trades_${new Date().toISOString().split('T')[0]}.csv`
    a.click()
  }

  const handleImportFile = (file: File) => {
    const reader = new FileReader()
    reader.onload = e => {
      try {
        const text = e.target?.result as string
        const lines = text.trim().split('\n')
        const headers = lines[0].split(',').map(h => h.trim().toLowerCase())
        const parsed: any[] = []
        for (let i = 1; i < lines.length; i++) {
          const vals = lines[i].split(',')
          const row: any = {}
          headers.forEach((h, idx) => { row[h] = vals[idx]?.replace(/^"|"$/g,'').trim() })
          if (!row.date || !row.pair) continue
          parsed.push({
            accountId,
            date:      row.date,
            session:   row.session || 'London',
            pair:      row.pair,
            direction: row.direction === 'Sell' ? 'Sell' : 'Buy',
            lot:       row.lot || '',
            risk:      row.risk || '',
            rr:        parseFloat(row.rr) || 2,
            result:    (['Win','Loss','BE'].includes(row.result) ? row.result : 'Win') as any,
            pl:        parseFloat(row.pl) || 0,
            strategy:  row.strategy || 'Other',
            emotion:   row.emotion || '😐 Neutral',
            notes:     row.notes || '',
          })
        }
        if (onImport && parsed.length) {
          onImport(parsed)
          setImportMsg(`✓ ${parsed.length} trades imported`)
          setTimeout(() => setImportMsg(''), 3000)
        } else {
          setImportMsg('No valid trades found')
          setTimeout(() => setImportMsg(''), 3000)
        }
      } catch {
        setImportMsg('Failed to parse CSV')
        setTimeout(() => setImportMsg(''), 3000)
      }
    }
    reader.readAsText(file)
  }

  const thumb = (t: Trade) => t.screenshotBefore || t.screenshotBase64 || null

  return (
    <div className="fade-in">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-xl font-bold text-zinc-100 tracking-tight">Trades</h1>
          <p className="text-sm text-muted mt-0.5">Full journal log</p>
        </div>
        <div className="flex items-center gap-2">
          {importMsg && <span className="text-xs text-green font-mono">{importMsg}</span>}
          <button onClick={() => fileRef.current?.click()} className="btn-ghost gap-2 text-xs py-1.5 px-3">
            <Upload size={13}/> Import CSV
          </button>
          <button onClick={exportCSV} disabled={!trades.length} className="btn-ghost gap-2 text-xs py-1.5 px-3">
            <Download size={13}/> Export CSV
          </button>
          <button onClick={onAdd} className="btn-primary">+ Log Trade</button>
          <input ref={fileRef} type="file" accept=".csv" className="hidden"
            onChange={e => { if (e.target.files?.[0]) handleImportFile(e.target.files[0]); e.target.value = '' }}/>
        </div>
      </div>

      <div className="card overflow-hidden">
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
                    <tr onClick={() => setExpanded(expanded === t.id ? null : t.id)}
                      className="border-b border-border hover:bg-bg3 cursor-pointer transition-colors">
                      <td className="px-4 py-3 font-mono text-[10px] text-muted">#{String(trades.length - i).padStart(3,'0')}</td>
                      <td className="px-4 py-3 font-mono text-[11px] text-zinc-400">{t.date}</td>
                      <td className="px-4 py-3 font-semibold text-[13px] text-zinc-100">{t.pair}</td>
                      <td className="px-4 py-3"><span className={t.direction === 'Buy' ? 'badge-buy' : 'badge-sell'}>{t.direction}</span></td>
                      <td className="px-4 py-3 text-xs text-muted">{t.session}</td>
                      <td className="px-4 py-3 font-mono text-xs text-zinc-300">{t.lot || '—'}</td>
                      <td className="px-4 py-3 font-mono text-xs text-zinc-300">{t.risk ? t.risk+'%' : '—'}</td>
                      <td className="px-4 py-3 font-mono text-xs" style={{color:'#a855f7'}}>1:{t.rr||'—'}</td>
                      <td className={clsx('px-4 py-3 font-mono text-[12px] font-semibold', t.pl>=0?'text-green':'text-red')}>
                        {t.pl>=0?'+':''}${t.pl.toFixed(2)}
                      </td>
                      <td className="px-4 py-3"><span className={`badge-${t.result.toLowerCase() as 'win'|'loss'|'be'}`}>{t.result}</span></td>
                      <td className="px-4 py-3">
                        {thumb(t)
                          ? <img src={thumb(t)!} onClick={e => { e.stopPropagation(); setLightbox(thumb(t)) }}
                              className="w-10 h-7 object-cover rounded border border-border2 hover:border-accent cursor-pointer transition-colors" alt="chart"/>
                          : <span className="text-muted text-xs">—</span>}
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-1">
                          {expanded === t.id ? <ChevronDown size={12} className="text-muted"/> : <ChevronRight size={12} className="text-muted"/>}
                          <button onClick={e => { e.stopPropagation(); onEdit(t) }}
                            className="text-muted hover:text-accent transition-colors p-1">
                            <Pencil size={11}/>
                          </button>
                          <button onClick={e => { e.stopPropagation(); if(confirm('Delete this trade?')) onDelete(t.id) }}
                            className="text-muted hover:text-red transition-colors p-1">
                            <Trash2 size={11}/>
                          </button>
                        </div>
                      </td>
                    </tr>

                    {expanded === t.id && (
                      <tr className="border-b border-border" style={{background:'rgba(20,21,25,0.6)'}}>
                        <td colSpan={12} className="px-6 py-4">
                          <div className="grid grid-cols-3 gap-4 text-sm mb-3">
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

                          {(t.screenshotBefore || t.screenshotBase64 || t.screenshotAfter) && (
                            <div className="flex gap-3 mt-1">
                              {(t.screenshotBefore || t.screenshotBase64) && (
                                <div className="flex-1">
                                  <div className="text-[10px] font-semibold mb-1.5" style={{color:'#00e5ff'}}>Before</div>
                                  <img
                                    src={t.screenshotBefore || t.screenshotBase64!}
                                    onClick={() => setLightbox(t.screenshotBefore || t.screenshotBase64!)}
                                    className="w-full max-h-44 rounded-lg border border-border2 cursor-pointer object-contain transition-colors hover:border-accent"
                                    alt="before"/>
                                </div>
                              )}
                              {t.screenshotAfter && (
                                <div className="flex-1">
                                  <div className="text-[10px] font-semibold mb-1.5" style={{color:'#a855f7'}}>After</div>
                                  <img
                                    src={t.screenshotAfter}
                                    onClick={() => setLightbox(t.screenshotAfter!)}
                                    className="w-full max-h-44 rounded-lg border border-border2 cursor-pointer object-contain transition-colors hover:border-purple-500"
                                    alt="after"/>
                                </div>
                              )}
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

      {lightbox && (
        <div className="fixed inset-0 bg-black/90 z-[600] flex items-center justify-center p-4" onClick={() => setLightbox(null)}>
          <img src={lightbox} className="max-w-[90vw] max-h-[88vh] rounded-xl border border-border2 object-contain"/>
          <button onClick={() => setLightbox(null)} className="absolute top-4 right-5 text-muted hover:text-zinc-200 text-2xl">×</button>
        </div>
      )}
    </div>
  )
}