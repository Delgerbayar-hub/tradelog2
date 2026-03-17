// src/components/TradeModal.tsx
import { useState, useRef, useEffect } from 'react';
import { X, Upload, ChevronDown, TrendingUp, TrendingDown } from 'lucide-react';
import { Trade, UserSettings } from '../types';

type FormData = Omit<Trade, 'id' | 'userId' | 'createdAt' | 'updatedAt'>;

interface TradeModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (trade: Omit<Trade, 'id' | 'userId' | 'createdAt' | 'updatedAt'>) => void;
  editTrade?: Trade | null;
  userSettings?: UserSettings;
}

const DEFAULT_PAIRS = ['XAUUSD', 'EURUSD', 'GBPUSD', 'USDJPY', 'NASDAQ'];

const SESSIONS = ['Asia', 'London', 'New York', 'London Close'] as const;
const PSYCHOLOGY = ['Хэвийн','Шунах','Айх','Яарах','Өшөө авах','Эргэлзэх','Хэт итгэх','Уурлах'] as const;
const RR_RATIOS = ['1:1','1:2','1:3','1:4','1:5','1:6','1:7','1:8','1:9','1:10'] as const;
const CONFIDENCE = ['Бага','Дунд','Өндөр'] as const;

type Step = 'entry' | 'exit';

export default function TradeModal({ isOpen, onClose, onSave, editTrade, userSettings }: TradeModalProps) {
  const pairs           = userSettings?.pairs?.length ? userSettings.pairs : DEFAULT_PAIRS;
  const activeAccounts  = (userSettings?.accounts ?? []).filter(a => a.active !== false);

  const emptyEntry = {
    date: new Date().toISOString().slice(0, 10),
    account: activeAccounts[0]?.name || '',
    pair: pairs[0],
    direction: 'buy' as const,
    lotSize: 0.01,
    session: 'London' as const,
    psychology: 'Хэвийн' as const,
    planExecution: 'Планатай' as const,
    confidence: 'Дунд' as const,
    riskPercent: 1,
    rrRatio: '1:2' as const,
    setup: '',
    entryDetails: '',
    screenshotBefore: [] as string[],
    screenshotAfter: [] as string[],
    result: 'Win' as const,
    gainRR: 0,
    gainPercent: 0,
    closedBy: 'TP' as const,
    pnl: 0,
    review: '',
  };

  const [step, setStep] = useState<Step>('entry');
  const [form, setForm] = useState<FormData>({ ...emptyEntry });
  const beforeRef = useRef<HTMLInputElement>(null);
  const afterRef = useRef<HTMLInputElement>(null);
  const [lightbox, setLightbox] = useState<string | null>(null);

  useEffect(() => {
    if (!isOpen) return;
    if (editTrade) {
      setForm({
        date: editTrade.date,
        account: editTrade.account,
        pair: editTrade.pair,
        direction: editTrade.direction,
        lotSize: editTrade.lotSize,
        session: editTrade.session,
        psychology: editTrade.psychology,
        planExecution: editTrade.planExecution,
        confidence: editTrade.confidence,
        riskPercent: editTrade.riskPercent,
        rrRatio: editTrade.rrRatio,
        setup: editTrade.setup,
        entryDetails: editTrade.entryDetails,
        screenshotBefore: editTrade.screenshotBefore || [],
        screenshotAfter: editTrade.screenshotAfter || [],
        result: editTrade.result,
        gainRR: editTrade.gainRR,
        gainPercent: editTrade.gainPercent,
        closedBy: editTrade.closedBy,
        pnl: editTrade.pnl,
        review: editTrade.review,
      });
      setStep('entry');
    } else {
      setForm({ ...emptyEntry });
      setStep('entry');
    }
  }, [isOpen, editTrade]);

  // Auto-compute Profit/Loss/Breakeven label from pnl
  const pnlLabel = form.pnl > 0 ? 'Profit' : form.pnl < 0 ? 'Loss' : 'Breakeven';
  const pnlColor = form.pnl > 0 ? 'text-green' : form.pnl < 0 ? 'text-red' : 'text-yellow';

  const set = <K extends keyof typeof form>(key: K, value: typeof form[K]) =>
    setForm(prev => ({ ...prev, [key]: value }));

  const handleImageUpload = (
    e: React.ChangeEvent<HTMLInputElement>,
    field: 'screenshotBefore' | 'screenshotAfter'
  ) => {
    const files = Array.from(e.target.files || []);
    const current = form[field];
    if (current.length >= 2) return;
    const remaining = 2 - current.length;
    files.slice(0, remaining).forEach(file => {
      const reader = new FileReader();
      reader.onload = ev => {
        const result = ev.target?.result as string;
        setForm(prev => ({ ...prev, [field]: [...prev[field], result] }));
      };
      reader.readAsDataURL(file);
    });
    e.target.value = '';
  };

  const removeImage = (field: 'screenshotBefore' | 'screenshotAfter', idx: number) => {
    setForm(prev => ({ ...prev, [field]: prev[field].filter((_, i) => i !== idx) }));
  };

  const handleSubmit = () => {
    onSave(form);
    onClose();
  };

  if (!isOpen) return null;

  return (
    <>
      {/* Lightbox */}
      {lightbox && (
        <div
          className="fixed inset-0 z-[60] bg-black/90 flex items-center justify-center p-4"
          onClick={() => setLightbox(null)}
        >
          <img src={lightbox} className="max-w-full max-h-full rounded-lg" alt="preview" />
        </div>
      )}

      {/* Backdrop */}
      <div className="fixed inset-0 z-40 bg-black/70 backdrop-blur-sm" onClick={onClose} />

      {/* Modal */}
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
        <div className="bg-bg2 border border-border2 rounded-2xl w-full max-w-2xl max-h-[90vh] overflow-hidden flex flex-col shadow-2xl">

          {/* Header */}
          <div className="flex items-center justify-between px-6 py-4 border-b border-border">
            <div className="flex items-center gap-3">
              <h2 className="text-white font-semibold text-lg">
                {editTrade ? 'Trade засах' : 'Trade бүртгэх'}
              </h2>
              {/* Step tabs */}
              <div className="flex bg-bg3 rounded-lg p-1 gap-1">
                <button
                  onClick={() => setStep('entry')}
                  className={`px-3 py-1 rounded-md text-xs font-medium transition-all ${
                    step === 'entry'
                      ? 'bg-accent text-black'
                      : 'text-muted hover:text-white'
                  }`}
                >
                  Entry
                </button>
                <button
                  onClick={() => setStep('exit')}
                  className={`px-3 py-1 rounded-md text-xs font-medium transition-all ${
                    step === 'exit'
                      ? 'bg-purple text-white'
                      : 'text-muted hover:text-white'
                  }`}
                >
                  Exit
                </button>
              </div>
            </div>
            <button onClick={onClose} className="text-muted hover:text-white transition-colors">
              <X size={20} />
            </button>
          </div>

          {/* Body */}
          <div className="overflow-y-auto flex-1 px-6 py-5 space-y-5">

            {/* ── ENTRY STEP ── */}
            {step === 'entry' && (
              <>
                {/* Row: Date + Account */}
                <div className="grid grid-cols-2 gap-4">
                  <Field label="Date">
                    <input
                      type="date"
                      value={form.date}
                      onChange={e => set('date', e.target.value)}
                      className={inputCls}
                    />
                  </Field>
                  <Field label="Account">
                    {activeAccounts.length ? (
                      <Select
                        value={form.account}
                        onChange={v => set('account', v)}
                        options={activeAccounts.map(a => a.name)}
                      />
                    ) : (
                      <input
                        type="text"
                        value={form.account}
                        onChange={e => set('account', e.target.value)}
                        placeholder="Account нэр"
                        className={inputCls}
                      />
                    )}
                  </Field>
                </div>

                {/* Pairs */}
                <Field label="Pair">
                  <div className="flex flex-wrap gap-2">
                    {pairs.map(p => (
                      <button
                        key={p}
                        onClick={() => set('pair', p)}
                        className={`px-3 py-1.5 rounded-lg text-sm font-mono font-medium transition-all border ${
                          form.pair === p
                            ? 'bg-accent border-accent text-black'
                            : 'bg-bg3 border-border2 text-zinc-300 hover:border-muted'
                        }`}
                      >
                        {p}
                      </button>
                    ))}
                  </div>
                </Field>

                {/* Direction */}
                <Field label="Direction">
                  <div className="flex gap-3">
                    <button
                      onClick={() => set('direction', 'buy')}
                      className={`flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl border font-semibold text-sm transition-all ${
                        form.direction === 'buy'
                          ? 'bg-green/20 border-green text-green'
                          : 'bg-bg3 border-border2 text-muted hover:border-muted'
                      }`}
                    >
                      <TrendingUp size={16} /> BUY
                    </button>
                    <button
                      onClick={() => set('direction', 'sell')}
                      className={`flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl border font-semibold text-sm transition-all ${
                        form.direction === 'sell'
                          ? 'bg-red/20 border-red text-red'
                          : 'bg-bg3 border-border2 text-muted hover:border-muted'
                      }`}
                    >
                      <TrendingDown size={16} /> SELL
                    </button>
                  </div>
                </Field>

                {/* Lot Size + Risk % */}
                <div className="grid grid-cols-2 gap-4">
                  <Field label="Lot Size">
                    <NumericInput
                      value={form.lotSize}
                      onChange={v => set('lotSize', v)}
                      step={0.01}
                      min={0.01}
                    />
                  </Field>
                  <Field label="Risk %">
                    <NumericInput
                      value={form.riskPercent}
                      onChange={v => set('riskPercent', v)}
                      step={0.1}
                      min={0}
                    />
                  </Field>
                </div>

                {/* Session + R:R */}
                <div className="grid grid-cols-2 gap-4">
                  <Field label="Session">
                    <Select
                      value={form.session}
                      onChange={v => set('session', v as typeof form.session)}
                      options={[...SESSIONS]}
                    />
                  </Field>
                  <Field label="Risk : Reward">
                    <Select
                      value={form.rrRatio}
                      onChange={v => set('rrRatio', v as typeof form.rrRatio)}
                      options={[...RR_RATIOS]}
                    />
                  </Field>
                </div>

                {/* Psychology + Plan Execution */}
                <div className="grid grid-cols-2 gap-4">
                  <Field label="Psychology">
                    <Select
                      value={form.psychology}
                      onChange={v => set('psychology', v as typeof form.psychology)}
                      options={[...PSYCHOLOGY]}
                    />
                  </Field>
                  <Field label="Plan Execution">
                    <div className="flex gap-2">
                      {(['Планатай','Плангүй'] as const).map(p => (
                        <button
                          key={p}
                          onClick={() => set('planExecution', p)}
                          className={`flex-1 py-2 rounded-lg text-sm border transition-all ${
                            form.planExecution === p
                              ? 'bg-indigo-500/20 border-indigo-500 text-indigo-300'
                              : 'bg-bg3 border-border2 text-muted'
                          }`}
                        >
                          {p}
                        </button>
                      ))}
                    </div>
                  </Field>
                </div>

                {/* Confidence */}
                <Field label="Confidence">
                  <div className="flex gap-2">
                    {CONFIDENCE.map(c => (
                      <button
                        key={c}
                        onClick={() => set('confidence', c as typeof form.confidence)}
                        className={`flex-1 py-2 rounded-lg text-sm border transition-all ${
                          form.confidence === c
                            ? 'bg-orange-500/20 border-orange-500 text-orange-300'
                            : 'bg-bg3 border-border2 text-muted'
                        }`}
                      >
                        {c}
                      </button>
                    ))}
                  </div>
                </Field>

                {/* Setup */}
                <Field label="Setup">
                  <input
                    type="text"
                    value={form.setup}
                    onChange={e => set('setup', e.target.value)}
                    placeholder="Жишээ: BOS + OB retest"
                    className={inputCls}
                  />
                </Field>

                {/* Entry Details */}
                <Field label="Entry Details">
                  <textarea
                    value={form.entryDetails}
                    onChange={e => set('entryDetails', e.target.value)}
                    placeholder="Аriljaand orson nöхцлöö tайлбарла..."
                    rows={3}
                    className={`${inputCls} resize-none`}
                  />
                </Field>

                {/* Before Screenshots */}
                <Field label="Before (2 зураг)">
                  <ImageUploader
                    images={form.screenshotBefore}
                    onUpload={e => handleImageUpload(e, 'screenshotBefore')}
                    onRemove={idx => removeImage('screenshotBefore', idx)}
                    onLightbox={setLightbox}
                    inputRef={beforeRef}
                    accentColor="cyan"
                  />
                </Field>
              </>
            )}

            {/* ── EXIT STEP ── */}
            {step === 'exit' && (
              <>
                {/* Result */}
                <Field label="Үр дүн">
                  <div className="flex gap-3">
                    {(['Win','Loss','Breakeven'] as const).map(r => (
                      <button
                        key={r}
                        onClick={() => set('result', r)}
                        className={`flex-1 py-2.5 rounded-xl border font-semibold text-sm transition-all ${
                          form.result === r
                            ? r === 'Win'
                              ? 'bg-green/20 border-green text-green'
                              : r === 'Loss'
                              ? 'bg-red/20 border-red text-red'
                              : 'bg-yellow/20 border-yellow text-yellow'
                            : 'bg-bg3 border-border2 text-muted'
                        }`}
                      >
                        {r}
                      </button>
                    ))}
                  </div>
                </Field>

                {/* Closed By */}
                <Field label="Closed By">
                  <div className="flex gap-3">
                    {(['TP','SL','BE'] as const).map(c => (
                      <button
                        key={c}
                        onClick={() => set('closedBy', c)}
                        className={`flex-1 py-2 rounded-lg border text-sm font-mono font-semibold transition-all ${
                          form.closedBy === c
                            ? 'bg-purple/20 border-purple text-purple'
                            : 'bg-bg3 border-border2 text-muted'
                        }`}
                      >
                        {c}
                      </button>
                    ))}
                  </div>
                </Field>

                {/* Gain R:R + Gain % */}
                <div className="grid grid-cols-2 gap-4">
                  <Field label="Gain R:R">
                    <NumericInput
                      value={form.gainRR}
                      onChange={v => set('gainRR', v)}
                      step={0.1}
                      min={0}
                    />
                  </Field>
                  <Field label="Gain %">
                    <NumericInput
                      value={form.gainPercent}
                      onChange={v => set('gainPercent', v)}
                      step={0.01}
                      min={0}
                    />
                  </Field>
                </div>

                {/* PNL */}
                <Field label="PNL">
                  <div className="relative">
                    <NumericInput
                      value={form.pnl}
                      onChange={v => set('pnl', v)}
                      step={0.01}
                      min={-Infinity}
                    />
                    <span className={`absolute right-3 top-1/2 -translate-y-1/2 text-sm font-semibold pointer-events-none ${pnlColor}`}>
                      {pnlLabel}
                    </span>
                  </div>
                </Field>

                {/* After Screenshots */}
                <Field label="After (2 зураг)">
                  <ImageUploader
                    images={form.screenshotAfter}
                    onUpload={e => handleImageUpload(e, 'screenshotAfter')}
                    onRemove={idx => removeImage('screenshotAfter', idx)}
                    onLightbox={setLightbox}
                    inputRef={afterRef}
                    accentColor="purple"
                  />
                </Field>

                {/* Review */}
                <Field label="Review / Дүгнэлт">
                  <textarea
                    value={form.review}
                    onChange={e => set('review', e.target.value)}
                    placeholder="Энэ арилжаанаас юу сурав? Дараагийн удаа юуг өөрчлөх вэ?"
                    rows={4}
                    className={`${inputCls} resize-none`}
                  />
                </Field>
              </>
            )}
          </div>

          {/* Footer */}
          <div className="px-6 py-4 border-t border-border flex items-center justify-between gap-3">
            {step === 'entry' ? (
              <>
                <button onClick={onClose} className={btnSecondary}>Цуцлах</button>
                <button onClick={() => setStep('exit')} className={btnPrimary('cyan')}>
                  Exit →
                </button>
              </>
            ) : (
              <>
                <button onClick={() => setStep('entry')} className={btnSecondary}>← Entry</button>
                <button onClick={handleSubmit} className={btnPrimary('purple')}>
                  {editTrade ? 'Хадгалах' : 'Бүртгэх'}
                </button>
              </>
            )}
          </div>
        </div>
      </div>
    </>
  );
}

// ── Sub-components ──

const inputCls =
  'w-full bg-bg3 border border-border2 rounded-xl px-4 py-2.5 text-zinc-100 text-sm focus:outline-none focus:border-accent/50 transition-colors placeholder-muted';

const btnSecondary =
  'px-4 py-2 rounded-xl border border-border2 text-zinc-300 text-sm hover:bg-bg3 transition-all';

const btnPrimary = (color: 'cyan' | 'purple') =>
  color === 'cyan'
    ? 'px-6 py-2 rounded-xl bg-accent text-black font-semibold text-sm hover:opacity-90 transition-all'
    : 'px-6 py-2 rounded-xl bg-purple text-white font-semibold text-sm hover:opacity-90 transition-all';

function NumericInput({ value, onChange, step: _step, min }: {
  value: number;
  onChange: (v: number) => void;
  step: number;
  min?: number;
}) {
  const [display, setDisplay] = useState(String(value));

  useEffect(() => {
    const n = parseFloat(display);
    if (n !== value) setDisplay(value === 0 ? '0' : String(value));
  }, [value]);

  return (
    <input
      type="text"
      inputMode="decimal"
      value={display}
      onChange={e => {
        const raw = e.target.value;
        // Allow: digits, one dot, leading minus
        if (raw === '' || raw === '-' || /^-?\d*\.?\d*$/.test(raw)) {
          setDisplay(raw);
          const n = parseFloat(raw);
          if (!isNaN(n)) onChange(n);
        }
      }}
      onBlur={() => {
        const n = parseFloat(display);
        const safe = isNaN(n)
          ? (min !== undefined && isFinite(min) ? min : 0)
          : min !== undefined && isFinite(min) && n < min ? min : n;
        onChange(safe);
        setDisplay(String(safe));
      }}
      className={inputCls}
    />
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="space-y-1.5">
      <label className="label">{label}</label>
      {children}
    </div>
  );
}

function Select({
  value,
  onChange,
  options,
}: {
  value: string;
  onChange: (v: string) => void;
  options: string[];
}) {
  return (
    <div className="relative">
      <select
        value={value}
        onChange={e => onChange(e.target.value)}
        className={`${inputCls} appearance-none pr-8 cursor-pointer`}
      >
        {options.map(o => (
          <option key={o} value={o} className="bg-bg2">
            {o}
          </option>
        ))}
      </select>
      <ChevronDown size={14} className="absolute right-3 top-1/2 -translate-y-1/2 text-muted pointer-events-none" />
    </div>
  );
}

function ImageUploader({
  images,
  onUpload,
  onRemove,
  onLightbox,
  inputRef,
  accentColor,
}: {
  images: string[];
  onUpload: (e: React.ChangeEvent<HTMLInputElement>) => void;
  onRemove: (idx: number) => void;
  onLightbox: (src: string) => void;
  inputRef: React.RefObject<HTMLInputElement>;
  accentColor: 'cyan' | 'purple';
}) {
  const accent = accentColor === 'cyan' ? 'border-accent/50 hover:border-accent' : 'border-purple/50 hover:border-purple';
  const labelAccent = accentColor === 'cyan' ? 'text-accent' : 'text-purple';

  const validImages = images.filter(Boolean);
  return (
    <div className="space-y-2">
      {validImages.length > 0 && (
        <div className="flex gap-2">
          {validImages.map((img, idx) => (
            <div key={idx} className="relative group w-28 h-20 rounded-lg overflow-hidden border border-border2">
              <img
                src={img}
                alt={`screenshot ${idx + 1}`}
                className="w-full h-full object-cover cursor-pointer"
                onClick={() => onLightbox(img)}
              />
              <button
                onClick={() => onRemove(idx)}
                className="absolute top-1 right-1 bg-black/70 rounded-full p-0.5 opacity-0 group-hover:opacity-100 transition-opacity"
              >
                <X size={10} className="text-white" />
              </button>
            </div>
          ))}
        </div>
      )}
      {validImages.length < 2 && (
        <button
          onClick={() => inputRef.current?.click()}
          className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border ${accent} text-xs transition-colors ${labelAccent}`}
        >
          <Upload size={12} />
          {validImages.length === 0 ? 'Зураг нэмэх' : 'Нэг зураг нэмэх'}
        </button>
      )}
      <input
        ref={inputRef}
        type="file"
        accept="image/*"
        multiple
        className="hidden"
        onChange={onUpload}
      />
    </div>
  );
}
