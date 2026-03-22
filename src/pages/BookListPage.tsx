// src/pages/BookListPage.tsx
import { useState, useRef } from 'react';
import { BookOpen, Check, Clock, Star, Plus, X, ChevronLeft, ImagePlus } from 'lucide-react';
import { Book, BookStatus as Status, PageLog } from '../types';

const DEFAULTS: Book[] = [
  { id: 1, title: 'Trading in the Zone',               author: 'Mark Douglas',     category: 'Psychology',  status: 'unread' },
  { id: 2, title: 'Reminiscences of a Stock Operator', author: 'Edwin Lefèvre',    category: 'Classic',     status: 'unread' },
  { id: 3, title: 'Market Wizards',                    author: 'Jack D. Schwager', category: 'Interviews',  status: 'unread' },
];

const CATEGORY_COLORS: Record<string, string> = {
  Psychology: 'text-purple bg-purple/10',
  Classic:    'text-yellow bg-yellow/10',
  Interviews: 'text-accent bg-accent/10',
  Strategy:   'text-profit bg-profit/10',
  Technical:  'text-secondary bg-secondary/10',
};

const STATUS_CONFIG: Record<Status, { label: string; icon: React.ReactNode; cls: string }> = {
  unread:  { label: 'Уншаагүй',    icon: <Clock size={11} />,     cls: 'text-muted bg-muted/10' },
  reading: { label: 'Уншиж байна', icon: <BookOpen size={11} />,  cls: 'text-accent bg-accent/10' },
  done:    { label: 'Уншсан',      icon: <Check size={11} />,     cls: 'text-profit bg-profit/10' },
};

const FILTER_TABS: { key: Status | 'all'; label: string }[] = [
  { key: 'all',     label: 'Бүгд' },
  { key: 'unread',  label: 'Уншаагүй' },
  { key: 'reading', label: 'Уншиж байна' },
  { key: 'done',    label: 'Уншсан' },
];

const today = () => new Date().toISOString().slice(0, 10);

/* ── Book Detail View ── */
function BookDetail({ book, onBack, onChange }: {
  book: Book;
  onBack: () => void;
  onChange: (b: Book) => void;
}) {
  const [pageInput, setPageInput] = useState('');
  const [totalInput, setTotalInput] = useState(book.totalPages?.toString() ?? '');
  const coverRef = useRef<HTMLInputElement>(null);

  const handleCoverChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = ev => onChange({ ...book, coverBase64: ev.target?.result as string });
    reader.readAsDataURL(file);
    e.target.value = '';
  };

  const total   = book.totalPages ?? 0;
  const current = book.currentPage ?? 0;
  const pct     = total > 0 ? Math.min(100, Math.round((current / total) * 100)) : 0;

  const logPage = () => {
    const p = parseInt(pageInput);
    if (!p || p < 1 || p > total) return;
    const entry: PageLog = { date: today(), page: p };
    const logs = [...(book.pageLogs ?? []), entry].sort((a, b) => a.date.localeCompare(b.date));
    const newStatus: Status = p >= total ? 'done' : 'reading';
    onChange({ ...book, currentPage: p, pageLogs: logs, status: newStatus });
    setPageInput('');
  };

  const saveTotalPages = () => {
    const t = parseInt(totalInput);
    if (t > 0) onChange({ ...book, totalPages: t });
  };

  const setRating = (r: number) => onChange({ ...book, rating: r });

  const cc = CATEGORY_COLORS[book.category] ?? 'text-secondary bg-secondary/10';
  const sc = STATUS_CONFIG[book.status];

  return (
    <div className="p-6 max-w-xl mx-auto space-y-5 fade-in">

      {/* Back */}
      <button onClick={onBack} className="flex items-center gap-1.5 text-muted hover:text-primary text-sm transition-colors">
        <ChevronLeft size={15} /> Буцах
      </button>

      {/* Header card */}
      <div className="card p-5 space-y-3">
        <div className="flex items-start gap-8">
          <div className="relative group/cover shrink-0 cursor-pointer" onClick={() => coverRef.current?.click()}>
            <input ref={coverRef} type="file" accept="image/*" className="hidden" onChange={handleCoverChange} />
            {book.coverBase64 ? (
              <img src={book.coverBase64} className="w-24 object-cover rounded-lg border border-border2" style={{ height: 132 }} />
            ) : (
              <div className="w-24 flex flex-col items-center justify-center rounded-lg border border-dashed border-border2 text-muted" style={{ height: 132 }}>
                <ImagePlus size={16} />
              </div>
            )}
            <div className="absolute inset-0 rounded-lg bg-black/50 flex items-center justify-center opacity-0 group-hover/cover:opacity-100 transition-opacity">
              <ImagePlus size={14} className="text-white" />
            </div>
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex items-start justify-between gap-2">
              <h2 className="text-primary font-semibold text-lg leading-tight">{book.title}</h2>
              <span className={`text-[10px] font-medium px-2 py-0.5 rounded-full shrink-0 mt-0.5 ${cc}`}>{book.category}</span>
            </div>
            <p className="text-muted text-sm mt-0.5">{book.author}</p>
          </div>
        </div>

        {/* Status badge */}
        <div className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-medium ${sc.cls}`}>
          {sc.icon} {sc.label}
        </div>

        {/* Rating (done) */}
        {book.status === 'done' && (
          <div className="flex gap-1">
            {[1,2,3,4,5].map(r => (
              <button key={r} onClick={() => setRating(r)}>
                <Star size={16} className={r <= (book.rating ?? 0) ? 'text-yellow fill-yellow' : 'text-border2'} />
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Total pages setup */}
      {!book.totalPages && (
        <div className="card p-4 space-y-2">
          <p className="text-muted text-xs">Нийт хуудасны тоо оруулна уу</p>
          <div className="flex gap-2">
            <input
              className="input"
              type="number"
              placeholder="300"
              value={totalInput}
              onChange={e => setTotalInput(e.target.value)}
            />
            <button onClick={saveTotalPages} className="btn-primary px-4 shrink-0">Хадгалах</button>
          </div>
        </div>
      )}

      {/* Progress */}
      {total > 0 && (
        <div className="card p-5 space-y-3">
          <div className="flex gap-2">
            <input
              className="input"
              type="number"
              placeholder={`Өнөөдрийн хуудас (1–${total})`}
              value={pageInput}
              min={1}
              max={total}
              onChange={e => setPageInput(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && logPage()}
            />
            <button onClick={logPage} className="btn-primary px-4 shrink-0">Бүртгэх</button>
          </div>
          <div className="flex items-center gap-2">
            <div className="flex-1 h-1.5 bg-bg rounded-full overflow-hidden">
              <div className={`h-full rounded-full transition-all duration-500 ${pct >= 100 ? 'bg-profit' : 'bg-accent'}`}
                style={{ width: `${pct}%` }} />
            </div>
            <span className="text-[11px] text-muted font-mono shrink-0">{current}/{total} · {pct}%</span>
          </div>
        </div>
      )}

      {/* Page log history */}
      {(book.pageLogs?.length ?? 0) > 0 && (
        <div className="card p-4 space-y-2">
          <p className="text-muted text-xs uppercase tracking-wider font-semibold mb-3">Уншилтын түүх</p>
          <div className="space-y-1.5 max-h-48 overflow-y-auto">
            {[...(book.pageLogs ?? [])].reverse().map((log, i) => (
              <div key={i} className="flex items-center justify-between text-sm">
                <span className="text-muted font-mono text-xs">{log.date}</span>
                <span className="text-primary font-medium">{log.page}-р хуудас</span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

interface Props {
  books: Book[];
  onBooksChange: (books: Book[]) => void;
}

/* ── Main List ── */
export default function BookListPage({ books: savedBooks, onBooksChange }: Props) {
  const [books, setBooks] = useState<Book[]>(savedBooks.length ? savedBooks : DEFAULTS);
  const [filter, setFilter] = useState<Status | 'all'>('reading');
  const [selected, setSelected] = useState<number | null>(null);
  const [showAdd, setShowAdd]   = useState(false);
  const [newTitle, setNewTitle] = useState('');
  const [newAuthor, setNewAuthor] = useState('');
  const [newCat, setNewCat]   = useState('Psychology');
  const [newPages, setNewPages] = useState('');
  const [addError, setAddError] = useState('');
  const [pagesError, setPagesError] = useState('');
  const [newCover, setNewCover] = useState('');
  const coverRef = useRef<HTMLInputElement>(null);

  const handleCoverFile = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = ev => setNewCover(ev.target?.result as string);
    reader.readAsDataURL(file);
    e.target.value = '';
  };

  const save = (updated: Book[]) => { setBooks(updated); onBooksChange(updated); };

  const updateBook = (b: Book) => save(books.map(x => x.id === b.id ? b : x));

  if (selected !== null) {
    const book = books.find(b => b.id === selected);
    if (book) return <BookDetail book={book} onBack={() => setSelected(null)} onChange={updateBook} />;
  }

  const filtered = filter === 'all' ? books : books.filter(b => b.status === filter);

  const cycleStatus = (id: number) => {
    save(books.map(b => {
      if (b.id !== id) return b;
      const next: Status = b.status === 'unread' ? 'reading' : b.status === 'reading' ? 'done' : 'unread';
      return { ...b, status: next, rating: next === 'done' ? (b.rating ?? 5) : undefined };
    }));
  };

  const setRating = (id: number, r: number) =>
    save(books.map(b => b.id === id ? { ...b, rating: r } : b));

  const removeBook = (id: number) => save(books.filter(b => b.id !== id));

  const addBook = () => {
    let ok = true;
    if (!newTitle.trim()) { setAddError('Номны нэр оруулна уу'); ok = false; } else setAddError('');
    const pages = parseInt(newPages);
    if (!newPages || pages < 1) { setPagesError('Хуудасны тоо оруулна уу'); ok = false; } else setPagesError('');
    if (!ok) return;
    save([...books, {
      id: Date.now(), title: newTitle.trim(), author: newAuthor.trim() || '—',
      category: newCat, status: 'unread',
      totalPages: pages,
      coverBase64: newCover || undefined,
    }]);
    setNewTitle(''); setNewAuthor(''); setNewPages(''); setAddError(''); setPagesError(''); setNewCover(''); setShowAdd(false);
  };

  const counts = {
    all:     books.length,
    unread:  books.filter(b => b.status === 'unread').length,
    reading: books.filter(b => b.status === 'reading').length,
    done:    books.filter(b => b.status === 'done').length,
  };

  return (
    <>
    {showAdd && (
      <>
        <div className="fixed inset-0 z-40 bg-black/60 backdrop-blur-sm" onClick={() => setShowAdd(false)} />
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="bg-bg2 border border-border2 rounded-2xl w-full max-w-sm shadow-2xl">
            <div className="flex items-center justify-between px-6 py-4 border-b border-border">
              <h2 className="text-primary font-semibold text-[15px]">Ном нэмэх</h2>
              <button onClick={() => setShowAdd(false)} className="text-muted hover:text-primary"><X size={16} /></button>
            </div>
            <div className="px-6 py-4 space-y-3">
              <div>
                <label className="label">Номын нэр</label>
                <input className={`input ${addError ? 'border-red/60' : ''}`} placeholder="Trading in the Zone..." value={newTitle} onChange={e => { setNewTitle(e.target.value); setAddError(''); }} />
                {addError && <p className="text-loss text-xs mt-1">{addError}</p>}
              </div>
              <div>
                <label className="label">Зохиолч</label>
                <input className="input" placeholder="Mark Douglas" value={newAuthor} onChange={e => setNewAuthor(e.target.value)} />
              </div>
              <div>
                <label className="label">Ангилал</label>
                <select className="input" value={newCat} onChange={e => setNewCat(e.target.value)}>
                  {Object.keys(CATEGORY_COLORS).map(c => <option key={c}>{c}</option>)}
                </select>
              </div>
              <div>
                <label className="label">Нийт хуудас</label>
                <input className={`input ${pagesError ? 'border-red/60' : ''}`} type="number" placeholder="300" value={newPages} onChange={e => { setNewPages(e.target.value); setPagesError(''); }} />
                {pagesError && <p className="text-loss text-xs mt-1">{pagesError}</p>}
              </div>
              <div>
                <label className="label">Cover зураг</label>
                <input ref={coverRef} type="file" accept="image/*" className="hidden" onChange={handleCoverFile} />
                {newCover ? (
                  <div className="relative w-20 h-28">
                    <img src={newCover} className="w-20 h-28 object-cover rounded-lg border border-border2" />
                    <button onClick={() => setNewCover('')} className="absolute -top-1.5 -right-1.5 w-5 h-5 bg-bg2 border border-border2 rounded-full flex items-center justify-center text-muted hover:text-loss">
                      <X size={10} />
                    </button>
                  </div>
                ) : (
                  <button onClick={() => coverRef.current?.click()}
                    className="w-20 h-28 rounded-lg border border-dashed border-border2 flex flex-col items-center justify-center gap-1 text-muted hover:border-accent/50 hover:text-accent transition-colors">
                    <ImagePlus size={18} />
                    <span className="text-[10px]">Upload</span>
                  </button>
                )}
              </div>
            </div>
            <div className="flex gap-3 px-6 py-4 border-t border-border">
              <button onClick={() => setShowAdd(false)} className="btn-ghost flex-1 justify-center">Цуцлах</button>
              <button onClick={addBook} className="btn-primary flex-1 justify-center">Нэмэх</button>
            </div>
          </div>
        </div>
      </>
    )}
    <div className="p-6 max-w-4xl mx-auto space-y-6 fade-in">

      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-primary font-semibold text-2xl tracking-tight">Reading List</h1>
          <p className="text-muted text-sm mt-0.5">
            <span className="text-profit font-medium">{counts.done}</span>/{counts.all} уншсан
            {counts.reading > 0 && <> · <span className="text-accent font-medium">{counts.reading}</span> уншиж байна</>}
          </p>
        </div>
        <button onClick={() => setShowAdd(true)} className="btn-primary text-sm gap-2">
          <Plus size={14} /> Нэмэх
        </button>
      </div>

      {/* Filter tabs */}
      <div className="flex gap-1.5">
        {FILTER_TABS.map(({ key, label }) => (
          <button key={key} onClick={() => setFilter(key)}
            className={`px-3 py-2 rounded-lg text-[13px] font-medium transition-colors ${
              filter === key ? 'bg-accent/15 text-accent border border-accent/20' : 'bg-bg3 text-muted hover:text-primary border border-border'
            }`}>
            {label}
            <span className={`ml-1.5 text-[12px] ${filter === key ? 'text-accent/70' : 'opacity-50'}`}>
              {counts[key as keyof typeof counts]}
            </span>
          </button>
        ))}
      </div>

      {/* Book list */}
      <div className="space-y-2">
        {filtered.length === 0 && (
          <div className="card p-12 text-center">
            <BookOpen size={28} className="text-muted mx-auto mb-3" />
            <p className="text-muted text-base">Ном байхгүй</p>
          </div>
        )}
        {filtered.map(book => {
          const sc = STATUS_CONFIG[book.status];
          const cc = CATEGORY_COLORS[book.category] ?? 'text-secondary bg-secondary/10';
          const total   = book.totalPages ?? 0;
          const current = book.currentPage ?? 0;
          const pct     = total > 0 ? Math.min(100, Math.round((current / total) * 100)) : 0;
          return (
            <div key={book.id}
              className="card px-4 py-3.5 group cursor-pointer hover:border-border2 transition-all hover:bg-hover-bg/30"
              onClick={() => setSelected(book.id)}>
              <div className="flex items-center gap-3">

                {/* Cover thumbnail */}
                {book.coverBase64 ? (
                  <img src={book.coverBase64} className="w-9 h-12 object-cover rounded shrink-0 border border-border2" />
                ) : (
                  <div className={`w-7 h-7 rounded-lg flex items-center justify-center shrink-0 ${sc.cls}`}>
                    <BookOpen size={13} />
                  </div>
                )}

                {/* Status icon */}
                <button onClick={e => { e.stopPropagation(); cycleStatus(book.id); }}
                  title="Status солих"
                  className={`w-7 h-7 rounded-lg flex items-center justify-center shrink-0 transition-colors ${sc.cls}`}>
                  {sc.icon}
                </button>

                {/* Title + author */}
                <div className="flex-1 min-w-0">
                  <p className={`text-[15px] font-medium truncate leading-tight ${book.status === 'done' ? 'line-through text-muted' : 'text-primary'}`}>
                    {book.title}
                  </p>
                  <p className="text-[13px] text-muted mt-0.5 truncate">{book.author}</p>
                </div>

                {/* Category */}
                <span className={`text-[12px] font-medium px-2 py-0.5 rounded-full shrink-0 hidden sm:inline ${cc}`}>
                  {book.category}
                </span>

                {/* Stars if done */}
                {book.status === 'done' && (
                  <div className="flex gap-0.5 shrink-0" onClick={e => e.stopPropagation()}>
                    {[1,2,3,4,5].map(r => (
                      <button key={r} onClick={() => setRating(book.id, r)}>
                        <Star size={11} className={r <= (book.rating ?? 0) ? 'text-yellow fill-yellow' : 'text-border2'} />
                      </button>
                    ))}
                  </div>
                )}

                {/* Pages label */}
                {total > 0 && book.status !== 'unread' && (
                  <span className="text-[12px] text-muted font-mono shrink-0">{current}/{total}p</span>
                )}

                {/* Delete */}
                <button onClick={e => { e.stopPropagation(); removeBook(book.id); }}
                  className="opacity-0 group-hover:opacity-100 text-muted hover:text-loss transition-all shrink-0 ml-1">
                  <X size={13} />
                </button>
              </div>

              {/* Progress bar */}
              {total > 0 && book.status !== 'unread' && (
                <div className="mt-2.5 w-full h-0.5 bg-border rounded-full overflow-hidden">
                  <div className={`h-full rounded-full transition-all duration-500 ${pct >= 100 ? 'bg-profit' : 'bg-accent'}`}
                    style={{ width: `${pct}%` }} />
                </div>
              )}
            </div>
          );
        })}
      </div>

    </div>
    </>
  );
}
