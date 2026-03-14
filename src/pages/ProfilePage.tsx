// src/pages/ProfilePage.tsx
import { useState } from 'react';
import { User } from 'firebase/auth';
import { Plus, Trash2, Target, X } from 'lucide-react';
import { Trade, TradingAccount, UserSettings } from '../types';

interface ProfilePageProps {
  user: User;
  userSettings: UserSettings | null;
  trades: Trade[];
  onUpdateSettings: (s: Partial<UserSettings>) => void;
}

const EMPTY_FORM = { name: '', balance: '', goal: '' };

function AddAccountModal({ onClose, onSave, existing }: {
  onClose: () => void;
  onSave: (a: TradingAccount) => void;
  existing: string[];
}) {
  const [form, setForm] = useState(EMPTY_FORM);
  const [error, setError] = useState('');

  const handleSave = () => {
    const name    = form.name.trim();
    const balance = parseFloat(form.balance);
    const goal    = parseFloat(form.goal);
    if (!name)                          return setError('Нэр оруулна уу');
    if (existing.includes(name))        return setError('Ийм нэртэй данс аль хэдийн байна');
    if (isNaN(balance) || balance <= 0) return setError('Эхлэх баланс оруулна уу');
    if (isNaN(goal)    || goal    <= 0) return setError('Зорилго оруулна уу');
    if (goal <= balance)                return setError('Зорилго нь эхлэх балансаас их байх ёстой');
    onSave({ name, balance, goal });
    onClose();
  };

  return (
    <>
      <div className="fixed inset-0 z-40 bg-black/70 backdrop-blur-sm" onClick={onClose} />
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
        <div className="bg-gray-900 border border-gray-700 rounded-2xl w-full max-w-sm shadow-2xl">
          {/* Header */}
          <div className="flex items-center justify-between px-6 py-4 border-b border-gray-800">
            <h2 className="text-white font-semibold">Данс нэмэх</h2>
            <button onClick={onClose} className="text-gray-400 hover:text-white transition-colors">
              <X size={18} />
            </button>
          </div>

          {/* Body */}
          <div className="px-6 py-5 space-y-4">
            <div>
              <label className="text-xs text-gray-400 uppercase tracking-wider mb-1.5 block">Дансны нэр</label>
              <input
                autoFocus
                type="text"
                value={form.name}
                onChange={e => { setForm(f => ({ ...f, name: e.target.value })); setError(''); }}
                placeholder="Live, Demo, Prop..."
                className="w-full bg-gray-800 border border-gray-700 rounded-xl px-4 py-2.5 text-sm text-white placeholder-gray-500 focus:outline-none focus:border-cyan-500/50 transition-colors"
              />
            </div>
            <div>
              <label className="text-xs text-gray-400 uppercase tracking-wider mb-1.5 block">Эхлэх баланс ($)</label>
              <input
                type="number"
                value={form.balance}
                onChange={e => { setForm(f => ({ ...f, balance: e.target.value })); setError(''); }}
                placeholder="10000"
                className="w-full bg-gray-800 border border-gray-700 rounded-xl px-4 py-2.5 text-sm text-white placeholder-gray-500 focus:outline-none focus:border-cyan-500/50 transition-colors"
              />
            </div>
            <div>
              <label className="text-xs text-gray-400 uppercase tracking-wider mb-1.5 block">Зорилго ($)</label>
              <input
                type="number"
                value={form.goal}
                onChange={e => { setForm(f => ({ ...f, goal: e.target.value })); setError(''); }}
                placeholder="15000"
                onKeyDown={e => e.key === 'Enter' && handleSave()}
                className="w-full bg-gray-800 border border-gray-700 rounded-xl px-4 py-2.5 text-sm text-white placeholder-gray-500 focus:outline-none focus:border-cyan-500/50 transition-colors"
              />
            </div>
            {error && <p className="text-red-400 text-xs">{error}</p>}
          </div>

          {/* Footer */}
          <div className="flex gap-3 px-6 py-4 border-t border-gray-800">
            <button onClick={onClose} className="flex-1 px-4 py-2 rounded-xl border border-gray-700 text-gray-300 text-sm hover:bg-gray-800 transition-all">
              Цуцлах
            </button>
            <button onClick={handleSave} className="flex-1 px-4 py-2 rounded-xl bg-cyan-500 text-black text-sm font-semibold hover:bg-cyan-400 transition-all">
              Нэмэх
            </button>
          </div>
        </div>
      </div>
    </>
  );
}

export default function ProfilePage({ user, userSettings, trades, onUpdateSettings }: ProfilePageProps) {
  const accounts = userSettings?.accounts ?? [];
  const [showModal, setShowModal] = useState(false);

  const handleSave = (acc: TradingAccount) => {
    onUpdateSettings({ accounts: [...accounts, acc] });
  };

  const removeAccount = (name: string) => {
    if (!confirm(`"${name}" дансыг устгах уу?`)) return;
    onUpdateSettings({ accounts: accounts.filter(a => a.name !== name) });
  };

  return (
    <div className="p-6 max-w-2xl space-y-6">
      {showModal && (
        <AddAccountModal
          onClose={() => setShowModal(false)}
          onSave={handleSave}
          existing={accounts.map(a => a.name)}
        />
      )}

      <h1 className="text-white text-xl font-semibold">Profile</h1>

      {/* User info */}
      <div className="bg-gray-900 border border-gray-800 rounded-2xl p-5 flex items-center gap-4">
        {user.photoURL ? (
          <img src={user.photoURL} className="w-14 h-14 rounded-full" alt="avatar" />
        ) : (
          <div className="w-14 h-14 rounded-full bg-cyan-500/20 flex items-center justify-center text-cyan-400 text-xl font-bold">
            {user.displayName?.[0] ?? user.email?.[0] ?? '?'}
          </div>
        )}
        <div>
          <p className="text-white font-medium">{user.displayName || '—'}</p>
          <p className="text-gray-400 text-sm">{user.email}</p>
        </div>
      </div>

      {/* Accounts section */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <h2 className="text-white font-medium">Арилжааны Данснууд</h2>
          <button
            onClick={() => setShowModal(true)}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-cyan-500 text-black text-sm font-semibold hover:bg-cyan-400 transition-all"
          >
            <Plus size={14} /> Данс нэмэх
          </button>
        </div>

        {accounts.length === 0 && (
          <div className="bg-gray-900 border border-gray-800 rounded-2xl p-8 text-center text-gray-500 text-sm">
            Данс байхгүй байна
          </div>
        )}

        {accounts.map(acc => {
          const accTrades = trades.filter(t => t.account === acc.name);
          const totalPnl  = accTrades.reduce((s, t) => s + (t.pnl || 0), 0);
          const current   = acc.balance + totalPnl;
          const wins      = accTrades.filter(t => t.result === 'Win').length;
          const wr        = accTrades.length ? ((wins / accTrades.length) * 100).toFixed(1) : null;
          const progress  = acc.goal > acc.balance
            ? Math.min(Math.max(((current - acc.balance) / (acc.goal - acc.balance)) * 100, 0), 100)
            : 0;
          const isUp = totalPnl >= 0;

          return (
            <div key={acc.name} className="bg-gray-900 border border-gray-800 rounded-2xl p-5 group">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-2">
                  <div className="w-2 h-2 rounded-full bg-cyan-400" />
                  <span className="text-white font-semibold">{acc.name}</span>
                  <span className="text-xs text-gray-500">{accTrades.length} trade</span>
                </div>
                <button
                  onClick={() => removeAccount(acc.name)}
                  className="text-gray-700 hover:text-red-400 transition-colors opacity-0 group-hover:opacity-100"
                >
                  <Trash2 size={14} />
                </button>
              </div>

              <div className="grid grid-cols-3 gap-3 mb-4">
                <div className="bg-gray-800 rounded-xl px-3 py-2.5">
                  <div className="text-xs text-gray-500 mb-1">Win Rate</div>
                  <div className={`text-lg font-bold font-mono ${wr === null ? 'text-gray-500' : parseFloat(wr) >= 50 ? 'text-emerald-400' : 'text-red-400'}`}>
                    {wr !== null ? `${wr}%` : '—'}
                  </div>
                </div>
                <div className="bg-gray-800 rounded-xl px-3 py-2.5">
                  <div className="text-xs text-gray-500 mb-1">Balance</div>
                  <div className={`text-lg font-bold font-mono ${isUp ? 'text-emerald-400' : 'text-red-400'}`}>
                    ${current.toLocaleString()}
                  </div>
                  {accTrades.length > 0 && (
                    <div className="text-xs text-gray-600 font-mono">
                      {isUp ? '+' : ''}${totalPnl.toFixed(0)}
                    </div>
                  )}
                </div>
                <div className="bg-gray-800 rounded-xl px-3 py-2.5">
                  <div className="flex items-center gap-1 text-xs text-gray-500 mb-1">
                    <Target size={10} /> Goal
                  </div>
                  <div className="text-lg font-bold font-mono text-yellow-400">
                    ${acc.goal.toLocaleString()}
                  </div>
                </div>
              </div>

              <div>
                <div className="flex justify-between text-xs text-gray-500 mb-1.5">
                  <span>${acc.balance.toLocaleString()}</span>
                  <span className="text-yellow-400 font-medium">{progress.toFixed(0)}%</span>
                  <span>${acc.goal.toLocaleString()}</span>
                </div>
                <div className="h-2 bg-gray-800 rounded-full overflow-hidden">
                  <div
                    className="h-full rounded-full transition-all duration-500"
                    style={{
                      width: `${progress}%`,
                      background: progress >= 100 ? '#22c55e' : 'linear-gradient(90deg, #06b6d4, #22c55e)',
                    }}
                  />
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
