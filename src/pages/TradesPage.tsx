// src/pages/TradesPage.tsx
import React, { useState } from 'react';
import {
  Plus, Search, Download,
  ChevronDown, ChevronUp, Pencil, Trash2,
  TrendingUp, TrendingDown
} from 'lucide-react';
import { Trade, UserSettings } from '../types';
import TradeModal from '../components/TradeModal';
import { getActiveAccounts, getArchivedNames } from '../lib/accounts';

interface TradesPageProps {
  trades: Trade[];
  onAdd: (t: Omit<Trade, 'id' | 'userId' | 'createdAt' | 'updatedAt'>) => void;
  onUpdate: (id: string, t: Partial<Trade>) => void;
  onDelete: (id: string) => void;
  userSettings: UserSettings | null;
  openModal?: boolean;
  onModalClose?: () => void;
}

export default function TradesPage({
  trades, onAdd, onUpdate, onDelete, userSettings, openModal, onModalClose
}: TradesPageProps) {
  const [modalOpen, setModalOpen] = useState(false);

  React.useEffect(() => {
    if (openModal) {
      setModalOpen(true);
      onModalClose?.();
    }
  }, [openModal]);
  const [editTrade, setEditTrade] = useState<Trade | null>(null);
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [search, setSearch] = useState('');
  const [filterResult, setFilterResult] = useState<'All' | 'Win' | 'Loss' | 'Breakeven'>('All');
  const [filterAccount, setFilterAccount] = useState<string>('All');
  const [lightbox, setLightbox] = useState<string | null>(null);

  const allAccounts = userSettings?.accounts ?? [];
  const accounts    = getActiveAccounts(allAccounts);
  const archived    = getArchivedNames(allAccounts);

  const filtered = trades.filter(t => {
    if (archived.has(t.account)) return false;
    const matchSearch =
      t.pair.toLowerCase().includes(search.toLowerCase()) ||
      t.setup?.toLowerCase().includes(search.toLowerCase()) ||
      t.account?.toLowerCase().includes(search.toLowerCase());
    const matchResult = filterResult === 'All' || t.result === filterResult;
    const matchAccount = filterAccount === 'All' || t.account === filterAccount;
    return matchSearch && matchResult && matchAccount;
  });

  const handleSave = (data: Omit<Trade, 'id' | 'userId' | 'createdAt' | 'updatedAt'>) => {
    if (editTrade) {
      onUpdate(editTrade.id, data);
    } else {
      onAdd(data);
    }
    setEditTrade(null);
  };

  const handleEdit = (trade: Trade) => {
    setEditTrade(trade);
    setModalOpen(true);
  };

  const handleDelete = (id: string) => {
    if (confirm('Trade устгах уу?')) onDelete(id);
  };

  // CSV Export
  const exportCSV = () => {
    const headers = [
      'Date','Account','Pair','Direction','LotSize','Session',
      'Psychology','PlanExecution','Confidence','RiskPercent',
      'RRRatio','Setup','EntryDetails','Result','GainRR',
      'GainPercent','ClosedBy','PNL','Review'
    ];
    const rows = trades.map(t => [
      t.date, t.account, t.pair, t.direction, t.lotSize, t.session,
      t.psychology, t.planExecution, t.confidence, t.riskPercent,
      t.rrRatio, `"${t.setup}"`, `"${t.entryDetails}"`, t.result,
      t.gainRR, t.gainPercent, t.closedBy, t.pnl, `"${t.review}"`
    ]);
    const csv = [headers, ...rows].map(r => r.join(',')).join('\n');
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `tradelog_${new Date().toISOString().slice(0,10)}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <>
      {/* Lightbox */}
      {lightbox && (
        <div
          className="fixed inset-0 z-50 bg-black/90 flex items-center justify-center p-4"
          onClick={() => setLightbox(null)}
        >
          <img src={lightbox} className="max-w-full max-h-full rounded-lg" alt="preview" />
        </div>
      )}

      <TradeModal
        isOpen={modalOpen}
        onClose={() => { setModalOpen(false); setEditTrade(null); }}
        onSave={handleSave}
        editTrade={editTrade}
        userSettings={userSettings ?? undefined}
      />

      <div className="p-6 space-y-5">
        {/* Top bar */}
        <div className="flex flex-wrap items-center gap-3 justify-between">
          <h1 className="text-white text-xl font-semibold">Trades</h1>
          <div className="flex items-center gap-2 flex-wrap">
            {/* Search */}
            <div className="relative">
              <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted" />
              <input
                type="text"
                value={search}
                onChange={e => setSearch(e.target.value)}
                placeholder="Хайх..."
                className="input pl-8 w-48"
              />
            </div>

            {/* Filter */}
            {(['All','Win','Loss','Breakeven'] as const).map(f => (
              <button
                key={f}
                onClick={() => setFilterResult(f)}
                className={`px-3 py-1.5 rounded-lg text-xs font-medium border transition-all ${
                  filterResult === f
                    ? f === 'Win' ? 'bg-green/20 border-green text-green'
                    : f === 'Loss' ? 'bg-red/20 border-red text-red'
                    : f === 'Breakeven' ? 'bg-yellow/20 border-yellow text-yellow'
                    : 'bg-bg3 border-border text-zinc-100'
                    : 'bg-bg3 border-border2 text-muted hover:border-muted'
                }`}
              >
                {f}
              </button>
            ))}

            <button
              onClick={exportCSV}
              className="btn-ghost"
            >
              <Download size={13} /> Export
            </button>

            <button
              onClick={() => { setEditTrade(null); setModalOpen(true); }}
              className="btn-primary"
            >
              <Plus size={15} /> Арилжаа бүртгэх
            </button>
          </div>
        </div>

        {/* Account filter */}
        {accounts.length > 0 && (
          <div className="flex items-center gap-2 flex-wrap">
            <span className="text-xs text-muted">Данс:</span>
            {(['All', ...accounts.map(a => a.name)] as string[]).map(name => (
              <button
                key={name}
                onClick={() => setFilterAccount(name)}
                className={`px-3 py-1.5 rounded-lg text-xs font-medium border transition-all ${
                  filterAccount === name
                    ? 'bg-accent/20 border-accent text-accent'
                    : 'bg-bg3 border-border2 text-muted hover:border-muted'
                }`}
              >
                {name === 'All' ? 'Бүгд' : name}
              </button>
            ))}
          </div>
        )}

        {/* Stats row */}
        <StatsRow trades={filtered} />

        {/* Table */}
        <div className="card overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border">
                  {['Date','Pair','Dir','Session','Setup','R:R','Result','PNL',''].map(h => (
                    <th key={h} className="text-left text-xs font-medium text-muted uppercase tracking-wider px-4 py-3">
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {filtered.length === 0 && (
                  <tr>
                    <td colSpan={9} className="text-center text-muted py-12">
                      Trade байхгүй байна
                    </td>
                  </tr>
                )}
                {filtered.map(trade => (
                  <React.Fragment key={trade.id}>
                    <tr
                      className="border-b border-border/50 hover:bg-bg3/40 transition-colors cursor-pointer"
                      onClick={() => setExpandedId(expandedId === trade.id ? null : trade.id)}
                    >
                      <td className="px-4 py-3 text-zinc-300 whitespace-nowrap">{trade.date}</td>
                      <td className="px-4 py-3 font-mono text-white font-medium">{trade.pair}</td>
                      <td className="px-4 py-3">
                        {trade.direction === 'buy'
                          ? <span className="flex items-center gap-1 text-green"><TrendingUp size={13}/> BUY</span>
                          : <span className="flex items-center gap-1 text-red"><TrendingDown size={13}/> SELL</span>
                        }
                      </td>
                      <td className="px-4 py-3 text-muted">{trade.session}</td>
                      <td className="px-4 py-3 text-zinc-300 max-w-[120px] truncate">{trade.setup || '—'}</td>
                      <td className="px-4 py-3 font-mono text-zinc-300">{trade.rrRatio}</td>
                      <td className="px-4 py-3">
                        <ResultBadge result={trade.result} />
                      </td>
                      <td className={`px-4 py-3 font-mono font-semibold ${
                        trade.pnl > 0 ? 'text-green' : trade.pnl < 0 ? 'text-red' : 'text-yellow'
                      }`}>
                        {trade.pnl > 0 ? '+' : ''}{trade.pnl?.toFixed(2) ?? '0.00'}
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-2" onClick={e => e.stopPropagation()}>
                          <button
                            onClick={() => handleEdit(trade)}
                            className="btn-icon"
                          >
                            <Pencil size={13} />
                          </button>
                          <button
                            onClick={() => handleDelete(trade.id)}
                            className="btn-icon hover:text-red"
                          >
                            <Trash2 size={13} />
                          </button>
                          {expandedId === trade.id
                            ? <ChevronUp size={14} className="text-muted" />
                            : <ChevronDown size={14} className="text-muted" />
                          }
                        </div>
                      </td>
                    </tr>

                    {/* Expanded row */}
                    {expandedId === trade.id && (
                      <tr key={`${trade.id}-exp`} className="bg-bg3/20">
                        <td colSpan={9} className="px-5 py-4">
                          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">

                            {/* Col 1: Stats grid */}
                            <div className="grid grid-cols-2 gap-2 content-start">
                              {[
                                { l: 'Данс',       v: trade.account },
                                { l: 'Лот',        v: trade.lotSize?.toString() },
                                { l: 'Risk %',     v: trade.riskPercent ? `${trade.riskPercent}%` : undefined },
                                { l: 'Хаасан',     v: trade.closedBy },
                                { l: 'Gain R:R',   v: trade.gainRR?.toString() },
                                { l: 'Gain %',     v: trade.gainPercent ? `${trade.gainPercent}%` : undefined },
                              ].filter(x => x.v).map(x => (
                                <div key={x.l} className="bg-bg3 rounded-lg px-3 py-2">
                                  <div className="text-[10px] text-muted uppercase tracking-wider mb-0.5">{x.l}</div>
                                  <div className="text-sm font-medium text-zinc-200">{x.v}</div>
                                </div>
                              ))}
                              {/* Psychology badges */}
                              <div className="col-span-2 flex flex-wrap gap-1.5 mt-1">
                                {trade.psychology && <span className="text-[11px] bg-bg3 border border-border px-2 py-0.5 rounded-full text-zinc-300">{trade.psychology}</span>}
                                {trade.planExecution && <span className="text-[11px] bg-bg3 border border-border px-2 py-0.5 rounded-full text-zinc-300">{trade.planExecution}</span>}
                                {trade.confidence && <span className="text-[11px] bg-bg3 border border-border px-2 py-0.5 rounded-full text-zinc-300">{trade.confidence}</span>}
                              </div>
                            </div>

                            {/* Col 2: Notes */}
                            <div className="space-y-3">
                              {trade.entryDetails && (
                                <div className="bg-bg3 rounded-lg p-3">
                                  <div className="text-[10px] text-accent uppercase tracking-wider mb-1">Entry Details</div>
                                  <p className="text-sm text-zinc-300 leading-relaxed">{trade.entryDetails}</p>
                                </div>
                              )}
                              {trade.review && (
                                <div className="bg-bg3 rounded-lg p-3">
                                  <div className="text-[10px] text-purple uppercase tracking-wider mb-1">Review</div>
                                  <p className="text-sm text-zinc-300 leading-relaxed">{trade.review}</p>
                                </div>
                              )}
                            </div>

                            {/* Col 3: Screenshots */}
                            <div className="space-y-3">
                              {trade.screenshotBefore?.length > 0 && (
                                <div>
                                  <div className="text-[10px] text-accent uppercase tracking-wider mb-1.5">Before</div>
                                  <div className="flex gap-2">
                                    {trade.screenshotBefore.map((img, i) => (
                                      <img key={i} src={img} alt={`before ${i+1}`}
                                        className="flex-1 h-24 object-cover rounded-lg border border-accent/20 cursor-pointer hover:border-accent transition-all"
                                        onClick={() => setLightbox(img)} />
                                    ))}
                                  </div>
                                </div>
                              )}
                              {trade.screenshotAfter?.length > 0 && (
                                <div>
                                  <div className="text-[10px] text-purple uppercase tracking-wider mb-1.5">After</div>
                                  <div className="flex gap-2">
                                    {trade.screenshotAfter.map((img, i) => (
                                      <img key={i} src={img} alt={`after ${i+1}`}
                                        className="flex-1 h-24 object-cover rounded-lg border border-purple/20 cursor-pointer hover:border-purple transition-all"
                                        onClick={() => setLightbox(img)} />
                                    ))}
                                  </div>
                                </div>
                              )}
                            </div>

                          </div>
                        </td>
                      </tr>
                    )}
                  </React.Fragment>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </>
  );
}

// ── Sub-components ──

function StatsRow({ trades }: { trades: Trade[] }) {
  const wins = trades.filter(t => t.result === 'Win').length;
  const losses = trades.filter(t => t.result === 'Loss').length;
  const total = trades.length;
  const winRate = total ? ((wins / total) * 100).toFixed(1) : '0.0';
  const totalPnl = trades.reduce((sum, t) => sum + (t.pnl || 0), 0);

  return (
    <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
      {[
        { label: 'Нийт', value: total.toString(), color: 'text-white' },
        { label: 'Win Rate', value: `${winRate}%`, color: 'text-green' },
        { label: 'Win / Loss', value: `${wins} / ${losses}`, color: 'text-zinc-300' },
        {
          label: 'Total PNL',
          value: `${totalPnl >= 0 ? '+' : ''}${totalPnl.toFixed(2)}`,
          color: totalPnl >= 0 ? 'text-green' : 'text-red'
        },
      ].map(s => (
        <div key={s.label} className="card p-4 relative overflow-hidden">
          <div className="text-xs text-muted uppercase tracking-wider mb-1">{s.label}</div>
          <div className={`text-lg font-semibold font-mono ${s.color}`}>{s.value}</div>
        </div>
      ))}
    </div>
  );
}

function ResultBadge({ result }: { result: Trade['result'] }) {
  const cls =
    result === 'Win' ? 'badge-win'
    : result === 'Loss' ? 'badge-loss'
    : 'badge-be';
  return (
    <span className={cls}>
      {result}
    </span>
  );
}

function DetailRow({ label, value }: { label: string; value?: string }) {
  if (!value) return null;
  return (
    <div className="flex items-center gap-2">
      <span className="text-muted text-xs w-24 shrink-0">{label}</span>
      <span className="text-zinc-300">{value}</span>
    </div>
  );
}
