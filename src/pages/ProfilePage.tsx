// src/pages/ProfilePage.tsx
import { useState, useRef, useEffect } from 'react';
import { User, updateProfile } from 'firebase/auth';
import { Plus, Target, X, Pencil, Check, Camera, Quote, TrendingUp, TrendingDown, BarChart2, Wallet, ChevronRight, MoreHorizontal, Zap, ZapOff, Archive } from 'lucide-react';
import { Trade, TradingAccount, UserSettings, AccountType, AccountStatus } from '../types';
import { fmtPnl, fmtBalance } from '../lib/format';
import { auth } from '../lib/firebase';

const DEFAULT_PAIRS = ['XAUUSD', 'EURUSD', 'GBPUSD', 'USDJPY', 'NASDAQ'];

interface ProfilePageProps {
  user: User;
  userSettings: UserSettings | null;
  trades: Trade[];
  onUpdateSettings: (s: Partial<UserSettings>) => void;
}

// ── Shared Modal shell ────────────────────────────────────────────────────────

function Modal({ title, onClose, onSave, saveLabel = 'Нэмэх', children }: {
  title: string; onClose: () => void; onSave: () => void;
  saveLabel?: string; children: React.ReactNode;
}) {
  return (
    <>
      <div className="fixed inset-0 z-40 bg-black/75 backdrop-blur-sm" onClick={onClose} />
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
        <div className="bg-bg2 border border-border2 rounded-2xl w-full max-w-sm shadow-2xl">
          <div className="flex items-center justify-between px-6 py-4 border-b border-border">
            <h2 className="text-white font-semibold text-[15px]">{title}</h2>
            <button onClick={onClose} className="text-muted hover:text-white transition-colors p-1">
              <X size={18} />
            </button>
          </div>
          <div className="px-6 py-5 space-y-4">{children}</div>
          <div className="flex gap-3 px-6 py-4 border-t border-border">
            <button onClick={onClose} className="btn-ghost flex-1 justify-center">Цуцлах</button>
            <button onClick={onSave}  className="btn-primary flex-1 justify-center">{saveLabel}</button>
          </div>
        </div>
      </div>
    </>
  );
}

function AddPairModal({ onClose, onSave, existing }: {
  onClose: () => void; onSave: (p: string) => void; existing: string[];
}) {
  const [input, setInput] = useState('');
  const [error, setError] = useState('');
  const handleSave = () => {
    const val = input.trim().toUpperCase();
    if (!val) return setError('Pair оруулна уу');
    if (existing.includes(val)) return setError('Аль хэдийн байна');
    onSave(val); onClose();
  };
  return (
    <Modal title="Pair нэмэх" onClose={onClose} onSave={handleSave}>
      <div>
        <label className="label">Symbol</label>
        <input autoFocus type="text" value={input}
          onChange={e => { setInput(e.target.value.toUpperCase()); setError(''); }}
          onKeyDown={e => e.key === 'Enter' && handleSave()}
          placeholder="XAUUSD, BTCUSD, NAS100..."
          className="input font-mono tracking-widest" />
      </div>
      {error && <p className="text-red text-xs">{error}</p>}
    </Modal>
  );
}

function AddAccountModal({ onClose, onSave, existing }: {
  onClose: () => void; onSave: (a: TradingAccount) => void; existing: string[];
}) {
  const [form, setForm] = useState({ name: '', type: 'Personal' as AccountType, balance: '', goal: '' });
  const [error, setError] = useState('');
  const handleSave = () => {
    const name    = form.name.trim();
    const balance = parseFloat(form.balance);
    const goal    = parseFloat(form.goal);
    if (!name)                          return setError('Нэр оруулна уу');
    if (existing.includes(name))        return setError('Аль хэдийн байна');
    if (isNaN(balance) || balance <= 0)          return setError('Эхлэх баланс оруулна уу');
    if (balance > 1_000_000_000)                 return setError('Баланс 1 тэрбумаас хэтрэхгүй');
    if (isNaN(goal)    || goal    <= 0)          return setError('Зорилго оруулна уу');
    if (goal > 1_000_000_000)                    return setError('Зорилго 1 тэрбумаас хэтрэхгүй');
    if (goal <= balance)                         return setError('Зорилго нь эхлэх балансаас их байх ёстой');
    onSave({ name, type: form.type, balance, goal }); onClose();
  };

  const ACCOUNT_TYPES: AccountType[] = ['Personal', 'Challenge', 'Funded', 'Demo', 'Contest'];
  const TYPE_COLORS: Record<AccountType, string> = {
    Personal:  'bg-blue-500/15 text-blue-400 border-blue-500/30',
    Challenge: 'bg-yellow-500/15 text-yellow-400 border-yellow-500/30',
    Funded:    'bg-green-500/15 text-green-400 border-green-500/30',
    Demo:      'bg-zinc-500/15 text-zinc-400 border-zinc-500/30',
    Contest:   'bg-purple-500/15 text-purple-400 border-purple-500/30',
  };

  return (
    <Modal title="Данс нэмэх" onClose={onClose} onSave={handleSave}>
      <div>
        <label className="label">Дансны нэр</label>
        <input autoFocus type="text" value={form.name}
          onChange={e => { setForm(f => ({ ...f, name: e.target.value })); setError(''); }}
          placeholder="MyFundedAccount, Demo01..." className="input" />
      </div>
      <div>
        <label className="label">Дансны төрөл</label>
        <div className="flex flex-wrap gap-2 mt-1">
          {ACCOUNT_TYPES.map(t => (
            <button key={t} type="button"
              onClick={() => setForm(f => ({ ...f, type: t }))}
              className={`text-xs font-medium px-3 py-1.5 rounded-lg border transition-all ${form.type === t ? TYPE_COLORS[t] : 'bg-bg3 text-muted border-border hover:border-border2'}`}>
              {t}
            </button>
          ))}
        </div>
      </div>
      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className="label">Эхлэх баланс ($)</label>
          <input type="number" value={form.balance}
            onChange={e => { setForm(f => ({ ...f, balance: e.target.value })); setError(''); }}
            placeholder="10000" className="input" />
        </div>
        <div>
          <label className="label">Зорилго ($)</label>
          <input type="number" value={form.goal}
            onChange={e => { setForm(f => ({ ...f, goal: e.target.value })); setError(''); }}
            placeholder="15000" onKeyDown={e => e.key === 'Enter' && handleSave()} className="input" />
        </div>
      </div>
      {error && <p className="text-red text-xs">{error}</p>}
    </Modal>
  );
}

// ── Main page ─────────────────────────────────────────────────────────────────

export default function ProfilePage({ user, userSettings, trades, onUpdateSettings }: ProfilePageProps) {
  const accounts = userSettings?.accounts ?? [];
  const pairs    = userSettings?.pairs ?? DEFAULT_PAIRS;

  const [showAddAccount,    setShowAddAccount]    = useState(false);
  const [showAddPair,       setShowAddPair]       = useState(false);
  const [accountFilter, setAccountFilter] = useState<AccountStatus>('active');
  const [openMenuName, setOpenMenuName] = useState<string | null>(null);

  useEffect(() => {
    if (!openMenuName) return;
    const close = () => setOpenMenuName(null);
    window.addEventListener('click', close);
    return () => window.removeEventListener('click', close);
  }, [openMenuName]);

  const [editing, setEditing] = useState(false);
  const [saving,  setSaving]  = useState(false);

  const [editName,   setEditName]   = useState('');
  const [editBio,    setEditBio]    = useState('');
  const [editAvatar, setEditAvatar] = useState('');
  const avatarRef = useRef<HTMLInputElement>(null);

  const displayName   = userSettings?.displayName || user.displayName || '—';
  const displayAvatar = userSettings?.avatarBase64 || user.photoURL;
  const displayBio    = userSettings?.bio;

  const startEdit = () => {
    setEditName(userSettings?.displayName || user.displayName || '');
    setEditBio(userSettings?.bio || '');
    setEditAvatar(userSettings?.avatarBase64 || user.photoURL || '');
    setEditing(true);
  };

  const handleAvatarFile = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = ev => setEditAvatar(ev.target?.result as string);
    reader.readAsDataURL(file);
    e.target.value = '';
  };

  const handleSaveProfile = async () => {
    setSaving(true);
    try {
      const name = editName.trim() || user.displayName || '';
      await updateProfile(auth.currentUser!, { displayName: name });
      onUpdateSettings({ displayName: name, bio: editBio, avatarBase64: editAvatar });
      setEditing(false);
    } catch (err) { console.error(err); }
    setSaving(false);
  };

  const totalTrades = trades.length;
  const totalWins   = trades.filter(t => t.result === 'Win').length;
  const totalPnl    = trades.reduce((s, t) => s + (t.pnl || 0), 0);
  const overallWR   = totalTrades ? ((totalWins / totalTrades) * 100).toFixed(1) : '0';

  const Avatar = ({ src, name, size }: { src?: string | null; name: string; size: string }) =>
    src ? (
      <img src={src} className={`${size} rounded-full object-cover ring-4 ring-card shadow-2xl shrink-0`} alt="avatar" />
    ) : (
      <div className={`${size} rounded-full bg-bg3 border border-border2 flex items-center justify-center text-accent font-bold text-2xl ring-4 ring-card shadow-2xl shrink-0`}>
        {name[0]?.toUpperCase() ?? '?'}
      </div>
    );

  return (
    <>
      {showAddAccount && (
        <AddAccountModal onClose={() => setShowAddAccount(false)}
          onSave={acc => onUpdateSettings({ accounts: [...accounts, acc] })}
          existing={accounts.map(a => a.name)} />
      )}
      {showAddPair && (
        <AddPairModal onClose={() => setShowAddPair(false)}
          onSave={p => onUpdateSettings({ pairs: [...pairs, p] })}
          existing={pairs} />
      )}

      <div className="min-h-screen py-8 px-6 flex flex-col items-center fade-in">
        <div className="w-full max-w-2xl space-y-5">

        {/* ── Profile card ── */}
        <div className="card overflow-hidden">
          {/* Banner */}
          <div className="h-32 relative" style={{
            background: 'linear-gradient(135deg, #0f1a2e 0%, #0d1f3c 40%, #111827 100%)'
          }}>
            {/* Decorative glows */}
            <div className="absolute inset-0"
              style={{ backgroundImage: 'radial-gradient(ellipse at 15% 60%, rgba(0,229,255,0.22) 0%, transparent 55%), radial-gradient(ellipse at 85% 40%, rgba(168,85,247,0.18) 0%, transparent 55%)' }} />
            {/* Grid lines */}
            <div className="absolute inset-0 opacity-[0.04]"
              style={{ backgroundImage: 'linear-gradient(rgba(255,255,255,1) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,1) 1px, transparent 1px)', backgroundSize: '32px 32px' }} />
            {!editing && (
              <button onClick={startEdit}
                className="absolute top-3 right-3 flex items-center gap-1.5 text-xs text-zinc-400 hover:text-white transition-colors px-3 py-1.5 rounded-lg backdrop-blur-sm"
                style={{ background: 'rgba(0,0,0,0.45)', border: '1px solid rgba(255,255,255,0.08)' }}>
                <Pencil size={11} /> Засах
              </button>
            )}
          </div>

          <div className="px-6 pb-6">
            {editing ? (
              /* ── Edit mode ── */
              <div className="space-y-5 pt-4">
                <div className="flex items-center gap-5">
                  <div className="relative z-10 -mt-16 shrink-0">
                    <Avatar src={editAvatar} name={editName || displayName} size="w-24 h-24" />
                    <button onClick={() => avatarRef.current?.click()}
                      className="absolute inset-0 rounded-2xl bg-black/60 flex flex-col items-center justify-center gap-1 opacity-0 hover:opacity-100 transition-opacity">
                      <Camera size={16} className="text-white" />
                      <span className="text-white text-[10px] font-medium">Солих</span>
                    </button>
                    <input ref={avatarRef} type="file" accept="image/*" className="hidden" onChange={handleAvatarFile} />
                  </div>
                  <div className="flex-1 mt-2">
                    <label className="label">Нэр</label>
                    <input autoFocus type="text" value={editName}
                      onChange={e => setEditName(e.target.value)}
                      placeholder="Нэрээ оруулна уу" className="input" />
                  </div>
                </div>
                <div>
                  <label className="label flex items-center gap-1.5"><Quote size={11} className="text-accent" /> Ишлэл / Bio</label>
                  <textarea value={editBio} rows={3}
                    onChange={e => setEditBio(e.target.value.slice(0, 160))}
                    placeholder="Арилжааны тухай философи, зарчим, эсвэл мотивац..."
                    className="input resize-none" />
                  <p className="text-right text-[11px] text-muted mt-1">{editBio.length} / 160</p>
                </div>
                <div className="flex gap-3 pt-1">
                  <button onClick={() => setEditing(false)} className="btn-ghost">Цуцлах</button>
                  <button onClick={handleSaveProfile} disabled={saving} className="btn-primary">
                    {saving
                      ? <><span className="w-3.5 h-3.5 border border-black border-t-transparent rounded-full animate-spin inline-block" /> Хадгалж байна...</>
                      : <><Check size={14} /> Хадгалах</>}
                  </button>
                </div>
              </div>
            ) : (
              /* ── View mode ── */
              <div>
                <div className="relative z-10 flex items-end gap-4 -mt-14 mb-5">
                  <Avatar src={displayAvatar} name={displayName} size="w-24 h-24" />
                  <div className="pb-1.5 flex-1 min-w-0">
                    <p className="text-white text-2xl font-bold tracking-tight truncate">{displayName}</p>
                    <p className="text-muted text-sm truncate">{user.email}</p>
                  </div>
                </div>

                {displayBio ? (
                  <div className="flex items-start gap-2.5 rounded-xl px-4 py-3 mb-5"
                    style={{ background: 'rgba(0,229,255,0.05)', border: '1px solid rgba(0,229,255,0.12)' }}>
                    <Quote size={13} className="text-accent shrink-0 mt-0.5" />
                    <p className="text-zinc-300 text-sm leading-relaxed italic">{displayBio}</p>
                  </div>
                ) : (
                  <button onClick={startEdit}
                    className="mb-5 w-full flex items-center gap-2 text-muted text-sm italic hover:text-zinc-400 transition-colors px-3 py-2 rounded-lg border border-dashed border-border hover:border-border2">
                    <Quote size={12} /> Ишлэл нэмэх...
                  </button>
                )}

                {/* Stats row */}
                <div className="grid grid-cols-3 gap-3">
                  {[
                    { icon: BarChart2, label: 'Нийт арилжаа', val: String(totalTrades), color: '#00e5ff', bg: 'rgba(0,229,255,0.07)' },
                    { icon: Target,    label: 'Win Rate',      val: overallWR + '%',     color: '#22c55e', bg: 'rgba(34,197,94,0.07)' },
                    { icon: Wallet,    label: 'Нийт P&L',
                      val: fmtPnl(totalPnl),
                      color: totalPnl >= 0 ? '#22c55e' : '#ef4444',
                      bg: totalPnl >= 0 ? 'rgba(34,197,94,0.07)' : 'rgba(239,68,68,0.07)' },
                  ].map(({ icon: Icon, label, val, color, bg }) => (
                    <div key={label} className="rounded-xl p-3.5 text-center" style={{ background: bg, border: `1px solid ${color}20` }}>
                      <Icon size={14} className="mx-auto mb-2" style={{ color }} />
                      <div className="text-lg font-bold font-mono leading-none" style={{ color }}>{val}</div>
                      <div className="text-[11px] text-muted mt-1.5">{label}</div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>

        {/* ── Pairs ── */}
        <div className="card p-5 space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-white font-semibold text-[15px]">Арилжааны Pair</h2>
              <p className="text-muted text-xs mt-0.5">Trade бүртгэхэд харагдах · {pairs.length} pair</p>
            </div>
            <button onClick={() => setShowAddPair(true)} className="btn-primary text-xs px-3 py-1.5">
              <Plus size={13} /> Нэмэх
            </button>
          </div>
          <div className="flex flex-wrap gap-2">
            {pairs.map(p => (
              <span key={p}
                className="group flex items-center gap-1.5 text-xs font-mono font-semibold px-3 py-1.5 rounded-lg transition-all hover:scale-105"
                style={{ background: 'rgba(0,229,255,0.08)', border: '1px solid rgba(0,229,255,0.2)', color: '#00e5ff' }}>
                {p}
                <button onClick={() => onUpdateSettings({ pairs: pairs.filter(x => x !== p) })}
                  className="transition-colors opacity-40 group-hover:opacity-100 hover:text-red ml-0.5">
                  <X size={10} />
                </button>
              </span>
            ))}
            {pairs.length === 0 && (
              <button onClick={() => setShowAddPair(true)}
                className="text-muted text-sm italic hover:text-zinc-400 transition-colors">
                + Pair нэмэх...
              </button>
            )}
          </div>
        </div>

        {/* ── Accounts ── */}
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-white font-semibold text-[15px]">Арилжааны Данснууд</h2>
              <p className="text-muted text-xs mt-0.5">
                {accounts.filter(a => a.active !== false).length} идэвхтэй
                {accounts.some(a => a.active === false) && ` · ${accounts.filter(a => a.active === false).length} идэвхгүй`}
              </p>
            </div>
            <div className="flex items-center gap-2">
              <div className="flex rounded-lg border border-border overflow-hidden text-xs">
                {([['active','Идэвхтэй'],['inactive','Идэвхгүй'],['archived','Архив']] as [AccountStatus,string][]).map(([f,label]) => (
                  <button key={f} onClick={() => setAccountFilter(f)}
                    className={`px-3 py-1.5 transition-colors ${accountFilter === f ? 'bg-accent/15 text-accent' : 'text-muted hover:text-zinc-300'}`}>
                    {label}
                  </button>
                ))}
              </div>
              {accounts.length < 5 ? (
                <button onClick={() => setShowAddAccount(true)} className="btn-primary text-xs px-3 py-1.5">
                  <Plus size={13} /> Данс нэмэх
                </button>
              ) : (
                <span className="text-xs text-muted px-3 py-1.5">Хязгаар: 3/3</span>
              )}
            </div>
          </div>

          {accounts.length === 0 && (
            <div className="card p-10 text-center space-y-3">
              <div className="w-14 h-14 rounded-2xl flex items-center justify-center mx-auto"
                style={{ background: 'rgba(0,229,255,0.07)', border: '1px solid rgba(0,229,255,0.15)' }}>
                <Wallet size={22} className="text-accent" />
              </div>
              <div>
                <p className="text-white font-medium">Данс байхгүй байна</p>
                <p className="text-muted text-sm mt-1">Арилжааны данс нэмж эхлэнэ үү</p>
              </div>
              <button onClick={() => setShowAddAccount(true)} className="btn-primary mx-auto mt-2" disabled={accounts.length >= 5}>
                <Plus size={14} /> Данс нэмэх
              </button>
            </div>
          )}

          {accounts.filter(a => {
            const st = a.status ?? (a.active === false ? 'inactive' : 'active');
            return st === accountFilter;
          }).map(acc => {
            const accStatus = acc.status ?? (acc.active === false ? 'inactive' : 'active');
            const isActive  = accStatus === 'active';
            const isArchived = accStatus === 'archived';
            const accTrades = trades.filter(t => t.account === acc.name);
            const pnl       = accTrades.reduce((s, t) => s + (t.pnl || 0), 0);
            const current   = acc.balance + pnl;
            const wins      = accTrades.filter(t => t.result === 'Win').length;
            const wr        = accTrades.length ? (wins / accTrades.length) * 100 : null;
            const progress  = acc.goal > acc.balance
              ? Math.min(Math.max(((current - acc.balance) / (acc.goal - acc.balance)) * 100, 0), 100)
              : 0;
            const isUp = pnl >= 0;
            const menuOpen = openMenuName === acc.name;

            const setStatus = (s: AccountStatus) => {
              onUpdateSettings({ accounts: accounts.map(a => a.name === acc.name ? { ...a, status: s, active: s === 'active' } : a) });
              setOpenMenuName(null);
            };
            return (
              <div key={acc.name} className={`card overflow-visible hover:border-border2 transition-all relative ${isArchived ? 'opacity-40' : !isActive ? 'opacity-60' : ''}`}>
                {/* Color top bar */}
                <div className="h-[3px] rounded-t-xl" style={{ background: isUp ? 'linear-gradient(90deg,#22c55e,#00e5ff)' : 'linear-gradient(90deg,#ef4444,#f97316)' }} />

                <div className="p-5">
                  {/* Header */}
                  <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-xl flex items-center justify-center shrink-0"
                        style={{ background: isUp ? 'rgba(34,197,94,0.1)' : 'rgba(239,68,68,0.1)', border: `1px solid ${isUp ? 'rgba(34,197,94,0.2)' : 'rgba(239,68,68,0.2)'}` }}>
                        {isUp ? <TrendingUp size={17} className="text-green" /> : <TrendingDown size={17} className="text-red" />}
                      </div>
                      <div>
                        <div className="flex items-center gap-2">
                          <p className="text-white font-bold leading-tight">{acc.name}</p>
                          {acc.type && (
                            <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-md border ${
                              acc.type === 'Personal'  ? 'bg-blue-500/15 text-blue-400 border-blue-500/30' :
                              acc.type === 'Challenge' ? 'bg-yellow-500/15 text-yellow-400 border-yellow-500/30' :
                              acc.type === 'Funded'    ? 'bg-green-500/15 text-green-400 border-green-500/30' :
                              acc.type === 'Demo'      ? 'bg-zinc-500/15 text-zinc-400 border-zinc-500/30' :
                                                         'bg-purple-500/15 text-purple-400 border-purple-500/30'
                            }`}>{acc.type}</span>
                          )}
                        </div>
                        <p className="text-muted text-xs">{accTrades.length} арилжаа</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      {accStatus !== 'active' && (
                        <span className="text-[10px] font-semibold px-2 py-0.5 rounded-md bg-zinc-700/60 text-zinc-400 border border-zinc-600/50">
                          {accStatus === 'archived' ? 'Архив' : 'Идэвхгүй'}
                        </span>
                      )}
                      <span className="text-xs font-mono font-semibold px-2 py-0.5 rounded-md"
                        style={{ color: isUp ? '#22c55e' : '#ef4444', background: isUp ? 'rgba(34,197,94,0.1)' : 'rgba(239,68,68,0.1)' }}>
                        {fmtPnl(pnl)}
                      </span>
                      {/* Overflow menu */}
                      <div className="relative">
                        <button onClick={e => { e.stopPropagation(); setOpenMenuName(menuOpen ? null : acc.name); }}
                          className="p-1.5 rounded-lg text-muted hover:text-zinc-200 hover:bg-bg3 transition-colors">
                          <MoreHorizontal size={14} />
                        </button>
                        {menuOpen && (
                          <div className="absolute right-0 top-8 z-30 bg-bg2 border border-border2 rounded-xl shadow-2xl w-44 py-1 text-sm">
                            {accStatus !== 'active'   && <button onClick={() => setStatus('active')}   className="flex items-center gap-2.5 w-full px-3 py-2 hover:bg-bg3 text-green"><Zap size={13}/> Идэвхжүүлэх</button>}
                            {accStatus !== 'inactive' && <button onClick={() => setStatus('inactive')} className="flex items-center gap-2.5 w-full px-3 py-2 hover:bg-bg3 text-zinc-300"><ZapOff size={13}/> Идэвхгүй болгох</button>}
                            {accStatus !== 'archived' && <button onClick={() => setStatus('archived')} className="flex items-center gap-2.5 w-full px-3 py-2 hover:bg-bg3 text-zinc-400"><Archive size={13}/> Архивлах</button>}
                          </div>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Stats grid */}
                  <div className="grid grid-cols-3 gap-2.5 mb-4">
                    <div className="bg-bg3 rounded-xl p-3.5">
                      <p className="text-[10px] text-muted uppercase tracking-widest mb-2">Win Rate</p>
                      <p className={`text-2xl font-bold font-mono leading-none ${wr === null ? 'text-muted' : wr >= 50 ? 'text-green' : 'text-red'}`}>
                        {wr !== null ? wr.toFixed(0) + '%' : '—'}
                      </p>
                      <p className="text-[11px] text-muted mt-1.5">{wins}W · {accTrades.length - wins}L</p>
                    </div>
                    <div className="bg-bg3 rounded-xl p-3.5">
                      <p className="text-[10px] text-muted uppercase tracking-widest mb-2">Balance</p>
                      <p className={`text-2xl font-bold font-mono leading-none ${isUp ? 'text-green' : 'text-red'}`}>
                        {fmtBalance(current)}
                      </p>
                      <p className="text-[11px] text-muted mt-1.5">эхлэл {fmtBalance(acc.balance)}</p>
                    </div>
                    <div className="bg-bg3 rounded-xl p-3.5">
                      <p className="text-[10px] text-muted uppercase tracking-widest mb-2 flex items-center gap-1"><Target size={9} /> Goal</p>
                      <p className="text-2xl font-bold font-mono leading-none text-yellow-400">
                        {fmtBalance(acc.goal)}
                      </p>
                      <p className="text-[11px] text-muted mt-1.5 flex items-center gap-1">
                        <ChevronRight size={9} /> зорилго
                      </p>
                    </div>
                  </div>

                  {/* Progress */}
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="text-[11px] text-muted">Зорилгын явц</span>
                      <span className="text-xs font-mono font-bold"
                        style={{ color: progress >= 100 ? '#22c55e' : progress > 50 ? '#eab308' : '#00e5ff' }}>
                        {progress.toFixed(1)}%
                      </span>
                    </div>
                    <div className="h-2 bg-bg3 rounded-full overflow-hidden">
                      <div className="h-full rounded-full transition-all duration-700"
                        style={{
                          width: `${progress}%`,
                          background: progress >= 100 ? '#22c55e' : 'linear-gradient(90deg, #00e5ff, #22c55e)',
                          boxShadow: progress > 0 ? `0 0 8px ${progress >= 100 ? '#22c55e80' : '#00e5ff60'}` : 'none',
                        }} />
                    </div>
                    <div className="flex justify-between text-[10px] text-muted">
                      <span>{fmtBalance(acc.balance)}</span>
                      <span>{fmtBalance(acc.goal)}</span>
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        </div>
      </div>
    </>
  );
}
