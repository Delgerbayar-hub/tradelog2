// src/pages/TradesPage.tsx
import React, { useState } from 'react';
import {
  Plus, Search, Download,
  ChevronDown, ChevronUp, Pencil, Trash2,
  TrendingUp, TrendingDown
} from 'lucide-react';
import { Trade, UserSettings } from '../types';
import TradeModal from '../components/TradeModal';

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
  const [lightbox, setLightbox] = useState<string | null>(null);

  const filtered = trades.filter(t => {
    const matchSearch =
      t.pair.toLowerCase().includes(search.toLowerCase()) ||
      t.setup?.toLowerCase().includes(search.toLowerCase()) ||
      t.account?.toLowerCase().includes(search.toLowerCase());
    const matchResult = filterResult === 'All' || t.result === filterResult;
    return matchSearch && matchResult;
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
              <Plus size={15} /> Trade
            </button>
          </div>
        </div>

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
                      <tr key={`${trade.id}-exp`} className="bg-bg3/30">
                        <td colSpan={9} className="px-6 py-5">
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            {/* Left: details */}
                            <div className="space-y-3 text-sm">
                              <DetailRow label="Account" value={trade.account} />
                              <DetailRow label="Lot Size" value={trade.lotSize?.toString()} />
                              <DetailRow label="Risk %" value={`${trade.riskPercent}%`} />
                              <DetailRow label="Psychology" value={trade.psychology} />
                              <DetailRow label="Plan" value={trade.planExecution} />
                              <DetailRow label="Confidence" value={trade.confidence} />
                              <DetailRow label="Closed By" value={trade.closedBy} />
                              <DetailRow label="Gain R:R" value={trade.gainRR?.toString()} />
                              <DetailRow label="Gain %" value={`${trade.gainPercent}%`} />
                              {trade.entryDetails && (
                                <div>
                                  <span className="text-muted text-xs uppercase tracking-wider">Entry Details</span>
                                  <p className="text-zinc-300 mt-1 text-sm leading-relaxed">{trade.entryDetails}</p>
                                </div>
                              )}
                              {trade.review && (
                                <div>
                                  <span className="text-muted text-xs uppercase tracking-wider">Review</span>
                                  <p className="text-zinc-300 mt-1 text-sm leading-relaxed">{trade.review}</p>
                                </div>
                              )}
                            </div>

                            {/* Right: screenshots */}
                            <div className="space-y-4">
                              {trade.screenshotBefore?.length > 0 && (
                                <div>
                                  <span className="text-xs font-medium text-accent uppercase tracking-wider">Before</span>
                                  <div className="flex gap-2 mt-2">
                                    {trade.screenshotBefore.map((img, i) => (
                                      <img
                                        key={i}
                                        src={img}
                                        alt={`before ${i+1}`}
                                        className="w-32 h-20 object-cover rounded-lg border border-accent/30 cursor-pointer hover:border-accent transition-all"
                                        onClick={() => setLightbox(img)}
                                      />
                                    ))}
                                  </div>
                                </div>
                              )}
                              {trade.screenshotAfter?.length > 0 && (
                                <div>
                                  <span className="text-xs font-medium text-purple uppercase tracking-wider">After</span>
                                  <div className="flex gap-2 mt-2">
                                    {trade.screenshotAfter.map((img, i) => (
                                      <img
                                        key={i}
                                        src={img}
                                        alt={`after ${i+1}`}
                                        className="w-32 h-20 object-cover rounded-lg border border-purple/30 cursor-pointer hover:border-purple transition-all"
                                        onClick={() => setLightbox(img)}
                                      />
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
