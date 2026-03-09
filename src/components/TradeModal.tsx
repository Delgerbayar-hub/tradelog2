// src/components/TradeModal.tsx
import React, { useState, useRef, useEffect } from 'react'
import { X, Upload } from 'lucide-react'
import type { Trade } from '../types'
import clsx from 'clsx'

const PAIRS      = ['XAUUSD','EURUSD','GBPUSD','USDJPY','USDCHF','AUDUSD','NZDUSD','GBPJPY','EURJPY','USDCAD','US30','NAS100','GER40']
const SESSIONS   = ['Asian','London','New York'] as const
const EMOTIONS   = ['😎 Calm','😐 Neutral','🔥 Confident','😰 Fearful','😤 Frustrated','🤑 Greedy','😩 Tired']
const STRATEGIES = ['SMC','ICT','Supply & Demand','Breakout','Trend Follow','Scalp','Other']

type FormData = Omit<Trade,'id'|'userId'|'createdAt'|'screenshotBase64'|'screenshotBefore'|'screenshotAfter'>

interface Props {
  open: boolean
  accountId: string
  editing?: Trade | null
  onClose: () => void
  onSave: (d: FormData, before?: File, after?: File) => Promise<void>
  onUpdate?: (id: string, d: FormData, before?: File, after?: File, keepBefore?: boolean, keepAfter?: boolean) => Promise<void>
}

const blank = (aid: string): FormData => ({
  accountId: aid,
  date: new Date().toISOString().split('T')[0],
  session: 'London', pair: 'XAUUSD', direction: 'Buy',
  lot: '', risk: '', rr: 2, result: 'Win', pl: 0,
  strategy: 'SMC', emotion: '😎 Calm', notes: '',
})

interface ImgSlot { file: File | null; preview: string | null }

export default function TradeModal({ open, accountId, editing, onClose, onSave, onUpdate }: Props) {
  const [form,   setForm]   = useState<FormData>(blank(accountId))
  const [before, setBefore] = useState<ImgSlot>({ file: null, preview: null })
  const [after,  setAfter]  = useState<ImgSlot>({ file: null, preview: null })
  const [saving, setSaving] = useState(false)
  const beforeRef = useRef<HTMLInputElement>(null)
  const afterRef  = useRef<HTMLInputElement>(null)

  useEffect(() => {
    if (!open) return
    if (editing) {
      setForm({
        accountId: editing.accountId,
        date: editing.date, session: editing.session,
        pair: editing.pair, direction: editing.direction,
        lot: editing.lot, risk: editing.risk, rr: editing.rr,
        result: editing.result, pl: editing.pl,
        strategy: editing.strategy, emotion: editing.emotion,
        notes: editing.notes,
      })
      setBefore({ file: null, preview: editing.screenshotBefore || editing.screenshotBase64 || null })
      setAfter({  file: null, preview: editing.screenshotAfter  || null })
    } else {
      setForm(blank(accountId))
      setBefore({ file: null, preview: null })
      setAfter({  file: null, preview: null })
    }
  }, [open, editing, accountId])

  if (!open) return null

  const s = (k: keyof FormData, v: any) => setForm(f => ({ ...f, [k]: v }))

  const loadImg = (file: File, setter: (s: ImgSlot) => void) => {
    if (!file.type.startsWith('image/')) return
    const r = new FileReader()
    r.onload = e => setter({ file, preview: e.target?.result as string })
    r.readAsDataURL(file)
  }

  const save = async () => {
    setSaving(true)
    try {
      if (editing && onUpdate) {
        await onUpdate(
          editing.id, form,
          before.file || undefined,
          after.file  || undefined,
          !before.file && !!before.preview,
          !after.file  && !!after.preview,
        )
      } else {
        await onSave(form, before.file || undefined, after.file || undefined)
      }
      onClose()
    } finally { setSaving(false) }
  }

  const segBtn = (label: string, active: boolean, color: string, onClick: () => void) => (
    <button onClick={onClick}
      className="flex-1 py-2 rounded-lg text-sm font-medium transition-all border"
      style={active
        ? { background: color + '18', borderColor: color, color }
        : { background: '#141519', borderColor: '#242529', color: '#52525b' }}>
      {label}
    </button>
  )

  const ImgSlotUI = ({
    label, slot, setSlot, inputRef, color
  }: {
    label: string
    slot: ImgSlot
    setSlot: (s: ImgSlot) => void
    inputRef: React.RefObject<HTMLInputElement>
    color: string
  }) => (
    <div className="flex-1">
      <div className="flex items-center justify-between mb-1.5">
        <span className="text-[11px] font-semibold uppercase tracking-wider" style={{ color }}>{label}</span>
        {slot.preview && (
          <button onClick={() => setSlot({ file: null, preview: null })}
            className="text-[10px] text-muted hover:text-red transition-colors">✕ Remove</button>
        )}
      </div>
      <div
        onClick={() => inputRef.current?.click()}
        onDrop={e => { e.preventDefault(); const f = e.dataTransfer.files[0]; if (f) loadImg(f, setSlot) }}
        onDragOver={e => e.preventDefault()}
        className="rounded-xl cursor-pointer transition-all border-2 border-dashed"
        style={{
          borderColor: slot.preview ? color + '40' : '#242529',
          background: '#0d0e11',
          minHeight: '96px',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          padding: slot.preview ? '6px' : '20px',
        }}>
        {slot.preview
          ? <img src={slot.preview} alt={label} className="w-full rounded-lg max-h-36 object-contain"/>
          : <div className="flex flex-col items-center gap-2 text-center pointer-events-none">
              <div className="w-9 h-9 rounded-xl flex items-center justify-center" style={{ background: color + '15' }}>
                <Upload size={15} style={{ color }}/>
              </div>
              <div className="text-xs text-muted">{label} chart</div>
              <div className="text-[10px] text-zinc-600">Click or drag & drop</div>
            </div>
        }
      </div>
      <input ref={inputRef} type="file" accept="image/*" className="hidden"
        onChange={e => { if (e.target.files?.[0]) loadImg(e.target.files[0], setSlot); e.currentTarget.value = '' }}/>
    </div>
  )

  return (
    <div className="fixed inset-0 bg-black/75 z-[500] flex items-center justify-center backdrop-blur-sm p-4 overflow-y-auto" onClick={onClose}>
      <div className="card w-full max-w-[600px] my-auto fade-in" onClick={e => e.stopPropagation()}>

        <div className="flex justify-between items-center px-6 py-4 border-b border-border">
          <h2 className="font-semibold text-zinc-100">{editing ? 'Edit Trade' : 'Log Trade'}</h2>
          <button onClick={onClose} className="btn-icon"><X size={14}/></button>
        </div>

        <div className="px-6 py-5 space-y-4">

          <div className="grid grid-cols-2 gap-3">
            <div><label className="label">Date</label><input type="date" value={form.date} onChange={e=>s('date',e.target.value)} className="input"/></div>
            <div><label className="label">Session</label>
              <select value={form.session} onChange={e=>s('session',e.target.value as any)} className="input">
                {SESSIONS.map(x => <option key={x}>{x}</option>)}
              </select>
            </div>
          </div>

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

          <div className="grid grid-cols-3 gap-3">
            <div><label className="label">Lot Size</label><input type="number" step="0.01" value={form.lot} onChange={e=>s('lot',e.target.value)} className="input" placeholder="0.01"/></div>
            <div><label className="label">Risk %</label><input type="number" step="0.1" value={form.risk} onChange={e=>s('risk',e.target.value)} className="input" placeholder="1.0"/></div>
            <div><label className="label">R:R Ratio</label><input type="number" step="0.1" value={form.rr} onChange={e=>s('rr',parseFloat(e.target.value)||0)} className="input" placeholder="2.0"/></div>
          </div>

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

          {/* Before / After */}
          <div>
            <label className="label mb-2">Screenshots</label>
            <div className="flex gap-3">
              <ImgSlotUI label="Before" slot={before} setSlot={setBefore} inputRef={beforeRef} color="#00e5ff"/>
              <ImgSlotUI label="After"  slot={after}  setSlot={setAfter}  inputRef={afterRef}  color="#a855f7"/>
            </div>
          </div>

          <div>
            <label className="label">Notes</label>
            <textarea value={form.notes} onChange={e=>s('notes',e.target.value)} className="input resize-none min-h-[72px]" placeholder="Entry reason, mistakes, key lessons…"/>
          </div>

        </div>

        <div className="flex gap-2 px-6 py-4 border-t border-border">
          <div className="flex-1"/>
          <button onClick={onClose} className="btn-ghost">Cancel</button>
          <button onClick={save} disabled={saving} className="btn-primary">
            {saving ? 'Saving…' : editing ? 'Update Trade' : 'Save Trade'}
          </button>
        </div>
      </div>
    </div>
  )
}