// src/components/TradeModal.tsx
import React, { useState, useRef, useEffect } from 'react'
import { X, ImageIcon } from 'lucide-react'
import type { Trade } from '../types'
import clsx from 'clsx'

const PAIRS     = ['XAUUSD','EURUSD','GBPUSD','USDJPY','USDCHF','AUDUSD','NZDUSD','GBPJPY','EURJPY','USDCAD','US30','NAS100','GER40']
const SESSIONS  = ['Asian', 'London', 'New York'] as const
const EMOTIONS  = ['😎 Calm', '😐 Neutral', '🔥 Confident', '😰 Fearful', '😤 Frustrated', '🤑 Greedy', '😩 Tired']
const STRATEGIES= ['SMC', 'ICT', 'Supply & Demand', 'Breakout', 'Trend Follow', 'Scalp', 'Other']

type FormData = Omit<Trade, 'id' | 'userId' | 'createdAt' | 'screenshotBase64'>

interface Props {
  open: boolean; accountId: string
  onClose: () => void
  onSave: (d: FormData, screenshot?: File) => Promise<void>
}

const blank = (aid: string): FormData => ({
  accountId: aid, date: new Date().toISOString().split('T')[0],
  session: 'London', pair: 'XAUUSD', direction: 'Buy',
  lot: '', risk: '', rr: 2, result: 'Win', pl: 0,
  strategy: 'SMC', emotion: '😎 Calm', notes: '',
})

export default function TradeModal({ open, accountId, onClose, onSave }: Props) {
  const [form, setForm]         = useState<FormData>(blank(accountId))
  const [file, setFile]         = useState<File | null>(null)
  const [preview, setPreview]   = useState<string | null>(null)
  const [saving, setSaving]     = useState(false)
  const fileRef = useRef<HTMLInputElement>(null)

  useEffect(() => { if (open) { setForm(blank(accountId)); setFile(null); setPreview(null) } }, [open, accountId])
  if (!open) return null

  const s = (k: keyof FormData, v: any) => setForm(f => ({ ...f, [k]: v }))

  const handleFile = (f: File) => {
    if (!f.type.startsWith('image/')) return
    setFile(f)
    const r = new FileReader(); r.onload = e => setPreview(e.target?.result as string); r.readAsDataURL(f)
  }

  const save = async () => {
    setSaving(true)
    try { await onSave(form, file || undefined); onClose() }
    finally { setSaving(false) }
  }

  const segBtn = (label: string, active: boolean, color: string, onClick: () => void) => (
    <button onClick={onClick}
      className={clsx('flex-1 py-2 rounded-lg text-sm font-medium transition-all border', active
        ? `border-[${color}] text-[${color}]`
        : 'bg-bg3 border-border2 text-muted hover:text-zinc-200')}
      style={active ? { background: color + '18', borderColor: color, color } : {}}>
      {label}
    </button>
  )

  return (
    <div className="fixed inset-0 bg-black/75 z-[500] flex items-center justify-center backdrop-blur-sm p-4 overflow-y-auto" onClick={onClose}>
      <div className="card w-full max-w-[580px] my-auto fade-in" onClick={e => e.stopPropagation()}>
        {/* Header */}
        <div className="flex justify-between items-center px-6 py-4 border-b border-border">
          <h2 className="font-semibold text-zinc-100">Log Trade</h2>
          <button onClick={onClose} className="btn-icon"><X size={14}/></button>
        </div>

        <div className="px-6 py-5 space-y-4">
          {/* Date + Session */}
          <div className="grid grid-cols-2 gap-3">
            <div><label className="label">Date</label><input type="date" value={form.date} onChange={e=>s('date',e.target.value)} className="input"/></div>
            <div><label className="label">Session</label>
              <select value={form.session} onChange={e=>s('session',e.target.value as any)} className="input">
                {SESSIONS.map(x => <option key={x}>{x}</option>)}
              </select>
            </div>
          </div>

          {/* Pair + Direction */}
          <div className="grid grid-cols-2 gap-3">
            <div><label className="label">Pair</label>
              <select value={form.pair} onChange={e=>s('pair',e.target.value)} className="input">
                {PAIRS.map(p => <option key={p}>{p}</option>)}
              </select>
            </div>
            <div><label className="label">Direction</label>
              <div className="flex gap-2">
                {segBtn('Buy',  form.direction==='Buy',  '#00e5ff', ()=>s('direction','Buy'))}
                {segBtn('Sell', form.direction==='Sell', '#ef4444', ()=>s('direction','Sell'))}
              </div>
            </div>
          </div>

          {/* Lot + Risk + RR */}
          <div className="grid grid-cols-3 gap-3">
            <div><label className="label">Lot Size</label><input type="number" step="0.01" value={form.lot} onChange={e=>s('lot',e.target.value)} className="input" placeholder="0.01"/></div>
            <div><label className="label">Risk %</label><input type="number" step="0.1" value={form.risk} onChange={e=>s('risk',e.target.value)} className="input" placeholder="1.0"/></div>
            <div><label className="label">R:R Ratio</label><input type="number" step="0.1" value={form.rr} onChange={e=>s('rr',parseFloat(e.target.value)||0)} className="input" placeholder="2.0"/></div>
          </div>

          {/* Result + P&L */}
          <div className="grid grid-cols-2 gap-3">
            <div><label className="label">Result</label>
              <div className="flex gap-1.5">
                {segBtn('Win',  form.result==='Win',  '#22c55e', ()=>s('result','Win'))}
                {segBtn('Loss', form.result==='Loss', '#ef4444', ()=>s('result','Loss'))}
                {segBtn('BE',   form.result==='BE',   '#eab308', ()=>s('result','BE'))}
              </div>
            </div>
            <div><label className="label">P&L ($)</label><input type="number" step="0.01" value={form.pl} onChange={e=>s('pl',parseFloat(e.target.value)||0)} className="input" placeholder="0.00"/></div>
          </div>

          {/* Strategy + Emotion */}
          <div className="grid grid-cols-2 gap-3">
            <div><label className="label">Strategy</label>
              <select value={form.strategy} onChange={e=>s('strategy',e.target.value)} className="input">
                {STRATEGIES.map(x => <option key={x}>{x}</option>)}
              </select>
            </div>
            <div><label className="label">Psychology</label>
              <select value={form.emotion} onChange={e=>s('emotion',e.target.value)} className="input">
                {EMOTIONS.map(x => <option key={x}>{x}</option>)}
              </select>
            </div>
          </div>

          {/* Screenshot */}
          <div>
            <label className="label">Screenshot / Chart</label>
            <div
              onClick={() => fileRef.current?.click()}
              onDrop={e => { e.preventDefault(); const f = e.dataTransfer.files[0]; if (f) handleFile(f) }}
              onDragOver={e => e.preventDefault()}
              className={clsx(
                'border-2 border-dashed border-border2 rounded-xl cursor-pointer transition-all hover:border-accent/30 hover:bg-accent/2',
                preview ? 'p-2' : 'p-5 flex flex-col items-center gap-2'
              )}>
              {preview
                ? <img src={preview} alt="" className="w-full rounded-lg max-h-44 object-contain"/>
                : <><ImageIcon size={22} className="text-muted"/><div className="text-sm text-muted">Click or drag & drop chart screenshot</div><div className="text-xs text-muted">PNG · JPG · WEBP</div></>
              }
            </div>
            <input ref={fileRef} type="file" accept="image/*" className="hidden"
              onChange={e => { if (e.target.files?.[0]) handleFile(e.target.files[0]) }}/>
            {preview && <button onClick={() => { setPreview(null); setFile(null) }} className="text-xs text-muted hover:text-red mt-1 transition-colors">✕ Remove</button>}
          </div>

          {/* Notes */}
          <div>
            <label className="label">Notes</label>
            <textarea value={form.notes} onChange={e=>s('notes',e.target.value)} className="input resize-none min-h-[72px]" placeholder="Entry reason, mistakes, key lessons…"/>
          </div>
        </div>

        {/* Footer */}
        <div className="flex gap-2 px-6 py-4 border-t border-border">
          <div className="flex-1"/>
          <button onClick={onClose} className="btn-ghost">Cancel</button>
          <button onClick={save} disabled={saving} className="btn-primary">{saving ? 'Saving…' : 'Save Trade'}</button>
        </div>
      </div>
    </div>
  )
}
