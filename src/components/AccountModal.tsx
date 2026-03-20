// src/components/AccountModal.tsx
import React, { useState, useEffect } from 'react'
import { X } from 'lucide-react'
import { PALETTE } from './Sidebar'
import type { Account } from '../types'
import clsx from 'clsx'

interface Props {
  open: boolean; editing: Account | null
  onClose: () => void
  onSave: (d: { name: string; color: string; initBalance: number; broker: string }) => void
  onDelete?: () => void
}

export default function AccountModal({ open, editing, onClose, onSave, onDelete }: Props) {
  const [name, setName]     = useState('')
  const [bal, setBal]       = useState('10000')
  const [broker, setBroker] = useState('')
  const [color, setColor]   = useState(PALETTE[0])

  useEffect(() => {
    if (editing) { setName(editing.name); setBal(String(editing.initBalance)); setBroker(editing.broker || ''); setColor(editing.color) }
    else { setName(''); setBal('10000'); setBroker(''); setColor(PALETTE[0]) }
  }, [editing, open])

  if (!open) return null

  return (
    <div className="fixed inset-0 bg-black/70 z-[500] flex items-center justify-center backdrop-blur-sm" onClick={onClose}>
      <div className="card w-[380px] p-6 fade-in" onClick={e => e.stopPropagation()}>
        <div className="flex justify-between items-center mb-5">
          <h2 className="font-semibold text-primary">{editing ? 'Edit Account' : 'New Account'}</h2>
          <button onClick={onClose} className="btn-icon"><X size={14}/></button>
        </div>
        <div className="space-y-4">
          <div><label className="label">Account name</label><input value={name} onChange={e=>setName(e.target.value)} className="input" placeholder="e.g. Live – IC Markets"/></div>
          <div><label className="label">Starting balance ($)</label><input type="number" value={bal} onChange={e=>setBal(e.target.value)} className="input" placeholder="10000"/></div>
          <div><label className="label">Broker (optional)</label><input value={broker} onChange={e=>setBroker(e.target.value)} className="input" placeholder="IC Markets, Pepperstone…"/></div>
          <div>
            <label className="label">Color</label>
            <div className="flex gap-2 flex-wrap">
              {PALETTE.map(c => (
                <button key={c} onClick={() => setColor(c)}
                  className={clsx('w-6 h-6 rounded-full border-2 transition-transform', color === c ? 'scale-125 border-white' : 'border-transparent opacity-60 hover:opacity-100')}
                  style={{ background: c }}/>
              ))}
            </div>
          </div>
        </div>
        <div className="flex gap-2 mt-6 pt-5 border-t border-border">
          {editing && onDelete && <button onClick={onDelete} className="btn-danger">Delete</button>}
          <div className="flex-1"/>
          <button onClick={onClose} className="btn-ghost">Cancel</button>
          <button onClick={() => name.trim() && onSave({ name: name.trim(), color, initBalance: parseFloat(bal) || 10000, broker })} className="btn-primary">Save</button>
        </div>
      </div>
    </div>
  )
}
