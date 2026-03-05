// File: src/pages/SearchPage.tsx
import React, { useEffect, useState, useMemo, useCallback, useRef } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { Helmet } from 'react-helmet-async';
import { collection, getDocs, query, orderBy, addDoc, serverTimestamp } from 'firebase/firestore';
import { db } from '../firebase';
import {
    Search, X, Home, ChevronRight, Eye, Calendar, Tag,
    FileText, ArrowLeft, Clock,
    ArrowRight, Sparkles, ChevronLeft, Moon, Sun, TrendingUp,
} from 'lucide-react';

/* ─── CSS Premium ──────────────────────────────────────────────── */
const PAGE_CSS = `
@keyframes searchBlob {
  0%,100% { transform: translate(0,0) scale(1); }
  50%      { transform: translate(-30px,20px) scale(1.08); }
}
@keyframes cardIn {
  from { opacity: 0; transform: translateY(14px) scale(0.98); }
  to   { opacity: 1; transform: translateY(0) scale(1); }
}
@keyframes searchPulse {
  0%, 100% { transform: scale(1); box-shadow: 0 0 0 0 rgba(212,175,55,0.4); }
  50%       { transform: scale(1.02); box-shadow: 0 0 0 8px rgba(212,175,55,0); }
}
@keyframes pulseRing {
  0%   { transform: scale(1);   opacity: 0.5; }
  100% { transform: scale(1.7); opacity: 0; }
}
@keyframes accentSlide {
  from { transform: scaleY(0); transform-origin: top; }
  to   { transform: scaleY(1); transform-origin: top; }
}
@keyframes dotGridPan {
  0%   { background-position: 0 0; }
  100% { background-position: 40px 40px; }
}
@keyframes shimmerSweep {
  from { transform: translateX(-150%) skewX(-12deg); }
  to   { transform: translateX(250%)  skewX(-12deg); }
}

.search-blob { animation: searchBlob 16s ease-in-out infinite; }

.result-card { animation: cardIn 0.4s cubic-bezier(0.22,0.61,0.36,1) forwards; opacity: 0; }

/* Dot grid hero */
.search-dot-grid {
  background-image: radial-gradient(circle, rgba(255,255,255,0.08) 1px, transparent 1px);
  background-size: 40px 40px;
  animation: dotGridPan 18s linear infinite;
}

/* Result card shimmer on hover */
.result-card-inner {
  position: relative;
  overflow: hidden;
}
.result-card-inner::after {
  content: '';
  position: absolute;
  top: 0; left: -80%;
  width: 60%;
  height: 100%;
  background: linear-gradient(90deg, transparent, rgba(255,255,255,0.05), transparent);
  transform: skewX(-12deg);
  pointer-events: none;
  opacity: 0;
}
.result-card-inner:hover::after {
  opacity: 1;
  animation: shimmerSweep 0.7s ease-out;
}

/* Left accent bar on result card */
.result-accent {
  animation: accentSlide 0.3s ease-out 0.15s both;
}
`;

/* ─── TYPES ─────────────────────────────────────────────────────── */
interface Doc {
    id: string;
    title: string;
    category: string;
    description: string;
    content: string;
    views?: number;
    likes?: number;
    updatedAt?: any;
    tags?: string[];
}

/* ─── HELPERS ───────────────────────────────────────────────────── */
const CATEGORIES = ['psp', 'sewa', 'penjualan', 'penghapusan', 'pinjam-pakai', 'penggunaan-sementara', 'alih-status', 'hibah', 'user-siman'];

const getCategoryStyle = (cat: string) => {
    const map: Record<string, string> = {
        'psp':                   'bg-emerald-100 text-emerald-800 border-emerald-200 dark:bg-emerald-900/30 dark:text-emerald-300',
        'penjualan':             'bg-amber-100   text-amber-800   border-amber-200   dark:bg-amber-900/30   dark:text-amber-300',
        'sewa':                  'bg-blue-100    text-blue-800    border-blue-200    dark:bg-blue-900/30    dark:text-blue-300',
        'penghapusan':           'bg-rose-100    text-rose-800    border-rose-200    dark:bg-rose-900/30    dark:text-rose-300',
        'pinjam-pakai':          'bg-indigo-100  text-indigo-800  border-indigo-200  dark:bg-indigo-900/30  dark:text-indigo-300',
        'penggunaan-sementara':  'bg-purple-100  text-purple-800  border-purple-200  dark:bg-purple-900/30  dark:text-purple-300',
        'alih-status':           'bg-teal-100    text-teal-800    border-teal-200    dark:bg-teal-900/30    dark:text-teal-300',
        'hibah':                 'bg-orange-100  text-orange-800  border-orange-200  dark:bg-orange-900/30  dark:text-orange-300',
        'user-siman':            'bg-slate-100   text-slate-800   border-slate-200   dark:bg-slate-700      dark:text-slate-300',
    };
    return map[cat] ?? 'bg-slate-100 text-slate-800 border-slate-200';
};

/* Left accent bar gradient per category */
const getCategoryAccent = (cat: string) => {
    const map: Record<string, string> = {
        'psp':                   'from-emerald-400 to-teal-500',
        'penjualan':             'from-amber-400   to-orange-500',
        'sewa':                  'from-blue-400    to-indigo-500',
        'penghapusan':           'from-rose-400    to-pink-500',
        'pinjam-pakai':          'from-indigo-400  to-purple-500',
        'penggunaan-sementara':  'from-purple-400  to-violet-500',
        'alih-status':           'from-teal-400    to-cyan-500',
        'hibah':                 'from-orange-400  to-red-400',
        'user-siman':            'from-slate-400   to-slate-600',
    };
    return map[cat] ?? 'from-emerald-400 to-teal-500';
};

/* highlight matching text */
const Highlight = ({ text, query }: { text: string; query: string }) => {
    if (!query.trim()) return <>{text}</>;
    const parts = text.split(new RegExp(`(${query.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')})`, 'gi'));
    return <>
        {parts.map((p, i) =>
            p.toLowerCase() === query.toLowerCase()
                ? <mark key={i} className="bg-[#D4AF37]/30 text-[#7a5c00] dark:text-[#D4AF37] rounded px-0.5 font-bold not-italic">{p}</mark>
                : p
        )}
    </>;
};

/* extract content snippet around the match */
const getSnippet = (content: string, q: string, len = 160): string => {
    if (!content || !q.trim()) return content?.substring(0, len) + '…';
    const idx = content.toLowerCase().indexOf(q.toLowerCase());
    if (idx === -1) return content.substring(0, len) + '…';
    const start = Math.max(0, idx - 50);
    const end   = Math.min(content.length, start + len);
    return (start > 0 ? '…' : '') + content.substring(start, end) + (end < content.length ? '…' : '');
};

/* ══════════════════════════════════════════════════════════════
   KOMPONEN UTAMA
══════════════════════════════════════════════════════════════ */
const SearchPage: React.FC = () => {
    const navigate = useNavigate();
    const [searchParams, setSearchParams] = useSearchParams();

    const [allDocs, setAllDocs]       = useState<Doc[]>([]);
    const [loading, setLoading]       = useState(true);
    const [inputVal, setInputVal]     = useState(searchParams.get('q') || '');
    const [activeQuery, setActiveQuery] = useState(searchParams.get('q') || '');
    const [filterCat, setFilterCat]   = useState(searchParams.get('cat') || 'all');
    const [sortBy, setSortBy]         = useState<'relevance' | 'newest' | 'views'>('relevance');
    const [currentPage, setCurrentPage] = useState(1);
    const RESULTS_PER_PAGE = 10;

    /* ── Search Analytics: ref untuk mencegah log duplikat ── */
    const lastLoggedQueryRef = useRef<string>('');

    /* Dark mode */
    const [isDark, setIsDark] = useState(() => {
        try { return localStorage.getItem('pkn-theme') === 'dark'; } catch { return false; }
    });
    useEffect(() => {
        document.documentElement.classList.toggle('dark', isDark);
        try { localStorage.setItem('pkn-theme', isDark ? 'dark' : 'light'); } catch { }
    }, [isDark]);

    /* Load all docs once */
    useEffect(() => {
        const load = async () => {
            setLoading(true);
            try {
                const snap = await getDocs(query(collection(db, 'knowledge-base'), orderBy('updatedAt', 'desc')));
                setAllDocs(snap.docs.map(d => ({ id: d.id, ...d.data() } as Doc)));
            } catch (e) { console.error(e); }
            finally { setLoading(false); }
        };
        load();
    }, []);

    /* Sync URL params → state */
    useEffect(() => {
        const q   = searchParams.get('q') || '';
        const cat = searchParams.get('cat') || 'all';
        setInputVal(q);
        setActiveQuery(q);
        setFilterCat(cat);
    }, [searchParams]);

    /* Live-search debounce 400 ms */
    useEffect(() => {
        const timer = setTimeout(() => { setActiveQuery(inputVal.trim()); }, 400);
        return () => clearTimeout(timer);
    }, [inputVal]);

    /* Reset halaman saat query/filter/sort berubah */
    useEffect(() => { setCurrentPage(1); }, [activeQuery, filterCat, sortBy]);

    const doSearch = useCallback((q: string, cat: string) => {
        const p: Record<string, string> = {};
        if (q) p.q = q;
        if (cat !== 'all') p.cat = cat;
        setSearchParams(p);
    }, [setSearchParams]);

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        doSearch(inputVal.trim(), filterCat);
    };

    const handleCatClick = (cat: string) => {
        setFilterCat(cat);
        doSearch(activeQuery, cat);
    };

    /* Score & filter results */
    const results = useMemo(() => {
        if (!activeQuery && filterCat === 'all') return [];
        const q = activeQuery.toLowerCase();
        const filtered = allDocs.filter(d => {
            const catMatch = filterCat === 'all' || d.category === filterCat;
            if (!q) return catMatch;
            const inTitle   = (d.title   || '').toLowerCase().includes(q);
            const inDesc    = (d.description || '').toLowerCase().includes(q);
            const inContent = (d.content || '').toLowerCase().includes(q);
            const inTags    = (d.tags    || []).some(t => t.toLowerCase().includes(q));
            return catMatch && (inTitle || inDesc || inContent || inTags);
        });

        const scored = filtered.map(d => {
            const q2 = activeQuery.toLowerCase();
            let score = 0;
            if ((d.title   || '').toLowerCase().includes(q2))    score += 10;
            if ((d.title   || '').toLowerCase().startsWith(q2))  score += 5;
            if ((d.description || '').toLowerCase().includes(q2)) score += 4;
            if ((d.tags    || []).some(t => t.toLowerCase() === q2)) score += 6;
            if ((d.content || '').toLowerCase().includes(q2))    score += 2;
            return { ...d, _score: score };
        });

        if (sortBy === 'relevance') return scored.sort((a, b) => b._score - a._score);
        if (sortBy === 'newest')    return scored.sort((a, b) => (b.updatedAt?.seconds || 0) - (a.updatedAt?.seconds || 0));
        if (sortBy === 'views')     return scored.sort((a, b) => (b.views || 0) - (a.views || 0));
        return scored;
    }, [allDocs, activeQuery, filterCat, sortBy]);

    const hasQuery = activeQuery || filterCat !== 'all';

    /* ── Search Analytics ── */
    // eslint-disable-next-line react-hooks/exhaustive-deps
    useEffect(() => {
        if (!activeQuery.trim() || activeQuery === lastLoggedQueryRef.current) return;
        lastLoggedQueryRef.current = activeQuery;
        addDoc(collection(db, 'search-logs'), {
            query:       activeQuery.trim(),
            resultCount: results.length,
            createdAt:   serverTimestamp(),
        }).catch(() => { /* silent */ });
    }, [activeQuery, results]);

    const totalPages      = Math.ceil(results.length / RESULTS_PER_PAGE);
    const paginatedResults = results.slice((currentPage - 1) * RESULTS_PER_PAGE, currentPage * RESULTS_PER_PAGE);

    /* ── RENDER ── */
    return (
        <div className="min-h-screen bg-[#F4F7F5] dark:bg-[#0d1a12] font-sans transition-colors duration-300">
            <Helmet>
                <title>
                    {activeQuery
                        ? `Pencarian: "${activeQuery}" — Knowledge Base KPKNL Kendari`
                        : 'Pencarian Dokumen — Knowledge Base KPKNL Kendari'
                    }
                </title>
                <meta
                    name="description"
                    content={activeQuery
                        ? `${results.length} hasil pencarian untuk "${activeQuery}" di Knowledge Base KPKNL Kendari.`
                        : 'Cari SOP, regulasi, dan panduan pengelolaan BMN di Knowledge Base KPKNL Kendari.'
                    }
                />
            </Helmet>

            <style dangerouslySetInnerHTML={{ __html: PAGE_CSS }} />

            {/* ══ HERO / SEARCH BAR ═══════════════════════════════════════ */}
            <div className="relative bg-gradient-to-br from-[#0D5C35] via-[#0A492A] to-[#062B18] pt-12 pb-20 px-4 overflow-hidden">
                {/* Dot grid */}
                <div className="absolute inset-0 search-dot-grid opacity-100 pointer-events-none" />

                {/* Ambient blobs */}
                <div className="absolute inset-0 opacity-15 pointer-events-none">
                    <div className="search-blob absolute -top-20 -left-16 w-96 h-96 rounded-full bg-emerald-400 blur-3xl" />
                    <div className="search-blob absolute -bottom-20 right-0 w-80 h-80 rounded-full bg-[#D4AF37] blur-3xl" style={{ animationDelay: '4s' }} />
                </div>
                {/* Center ambient glow */}
                <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[700px] h-[200px] rounded-full bg-white/[0.015] blur-3xl pointer-events-none" />

                <div className="relative z-10 max-w-2xl mx-auto">
                    {/* Breadcrumb */}
                    <nav className="flex items-center gap-1.5 text-xs text-white/50 mb-5">
                        <button onClick={() => navigate('/')} className="hover:text-white transition-colors flex items-center gap-1">
                            <Home className="w-3.5 h-3.5" /> Beranda
                        </button>
                        <ChevronRight className="w-3 h-3" />
                        <span className="text-white/80 font-bold">Pencarian</span>
                        <button
                            onClick={() => setIsDark(p => !p)}
                            className="ml-auto p-2 rounded-full bg-white/10 hover:bg-white/20 border border-white/15 transition-all flex-shrink-0"
                            title={isDark ? 'Mode Terang' : 'Mode Gelap'}
                            aria-label={isDark ? 'Aktifkan mode terang' : 'Aktifkan mode gelap'}>
                            {isDark ? <Sun className="w-3.5 h-3.5 text-[#D4AF37]" /> : <Moon className="w-3.5 h-3.5 text-white/80" />}
                        </button>
                    </nav>

                    {/* Tombol kembali */}
                    <button
                        onClick={() => navigate(-1)}
                        className="mb-6 inline-flex items-center gap-2 text-emerald-100/80 hover:text-white bg-white/10 hover:bg-white/20 px-4 py-2 rounded-full transition-all text-sm font-bold border border-white/10 hover:border-white/30 group">
                        <ArrowLeft className="w-4 h-4 group-hover:-translate-x-0.5 transition-transform" /> Kembali
                    </button>

                    {/* Badge + heading */}
                    <div className="flex items-center gap-2 mb-3">
                        <div className="inline-flex items-center gap-2 px-3 py-1 bg-white/10 border border-white/15 rounded-full text-xs font-bold text-white/70 uppercase tracking-wider">
                            <Search className="w-3.5 h-3.5" /> Pencarian Global
                        </div>
                        {!loading && allDocs.length > 0 && (
                            <div className="inline-flex items-center gap-1.5 px-3 py-1 bg-[#D4AF37]/15 border border-[#D4AF37]/25 rounded-full text-xs font-bold text-[#D4AF37]">
                                <TrendingUp className="w-3 h-3" />
                                {allDocs.length} dokumen
                            </div>
                        )}
                    </div>

                    <h1 className="text-2xl md:text-3xl font-black text-white mb-2 tracking-tight leading-tight">
                        Temukan Informasi yang Kamu Butuhkan
                    </h1>
                    <p className="text-white/55 text-sm mb-8 leading-relaxed">
                        Cari dari seluruh koleksi SOP, panduan, dan regulasi knowledge base KPKNL Kendari.
                    </p>

                    {/* Search form */}
                    <form onSubmit={handleSubmit} className="relative">
                        <div className="flex gap-2.5">
                            <div className="relative flex-1">
                                {inputVal !== activeQuery && inputVal.length > 0
                                    ? <span className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 flex items-center justify-center">
                                        <span className="w-4 h-4 border-2 border-[#D4AF37] border-t-transparent rounded-full animate-spin" />
                                    </span>
                                    : <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400 pointer-events-none" />
                                }
                                <input
                                    type="text"
                                    autoFocus
                                    value={inputVal}
                                    onChange={e => setInputVal(e.target.value)}
                                    placeholder="Ketik kata kunci, judul, atau tag…"
                                    className="w-full pl-12 pr-12 py-4 rounded-2xl bg-white dark:bg-[#0f1f16] text-slate-800 dark:text-slate-200 placeholder:text-slate-400 font-medium text-sm shadow-2xl outline-none focus:ring-2 focus:ring-[#D4AF37]/60 focus:shadow-[0_0_0_4px_rgba(212,175,55,0.15)] transition-all border border-transparent focus:border-[#D4AF37]/30"
                                />
                                {inputVal && (
                                    <button type="button" onClick={() => { setInputVal(''); doSearch('', filterCat); }}
                                        className="absolute right-4 top-1/2 -translate-y-1/2 p-1.5 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-700 rounded-lg transition-all">
                                        <X className="w-3.5 h-3.5" />
                                    </button>
                                )}
                            </div>
                            <button type="submit"
                                className="px-7 py-4 bg-[#D4AF37] hover:bg-[#B5952F] text-slate-900 rounded-2xl font-black text-sm shadow-2xl shadow-amber-400/20 transition-all hover:-translate-y-0.5 hover:shadow-amber-400/30 flex items-center gap-2 flex-shrink-0">
                                <Search className="w-4 h-4" />
                                <span className="hidden sm:inline">Cari</span>
                            </button>
                        </div>

                        {/* Active query pill */}
                        {activeQuery && (
                            <div className="mt-3 flex items-center gap-2 flex-wrap">
                                <span className="text-white/40 text-xs">Mencari:</span>
                                <span className="inline-flex items-center gap-1.5 px-3 py-1 bg-white/15 border border-white/20 rounded-full text-xs font-bold text-white">
                                    <Sparkles className="w-3 h-3 text-[#D4AF37]" />
                                    {activeQuery}
                                    <button type="button" onClick={() => { setInputVal(''); doSearch('', filterCat); }}
                                        className="ml-0.5 hover:text-rose-300 transition-colors">
                                        <X className="w-3 h-3" />
                                    </button>
                                </span>
                                <span className="text-white/40 text-xs">{results.length} hasil</span>
                            </div>
                        )}
                    </form>
                </div>

                {/* Wave bottom */}
                <div className="absolute bottom-0 left-0 right-0 pointer-events-none overflow-hidden" style={{ lineHeight: 0 }}>
                    <svg viewBox="0 0 1440 64" xmlns="http://www.w3.org/2000/svg" preserveAspectRatio="none"
                        className="block w-full" style={{ height: '64px' }}>
                        <path d="M0,32 C360,64 720,0 1080,32 C1260,48 1380,24 1440,32 L1440,64 L0,64 Z"
                            style={{ fill: isDark ? '#0d1a12' : '#F4F7F5' }} />
                    </svg>
                </div>
            </div>

            {/* ══ FILTER BAR (sticky) ══════════════════════════════════════ */}
            <div className="border-b border-slate-200 dark:border-slate-700/80 bg-white/95 dark:bg-[#162918]/95 backdrop-blur-md shadow-sm sticky top-0 z-30">
                <div className="max-w-5xl mx-auto px-4">
                    <div className="flex items-center gap-2 py-3 overflow-x-auto scrollbar-hide">
                        {/* "Semua" pill */}
                        <button onClick={() => handleCatClick('all')}
                            className={`flex-shrink-0 px-4 py-1.5 rounded-xl text-xs font-bold border transition-all ${filterCat === 'all'
                                ? 'bg-[#D4AF37] text-slate-900 border-[#D4AF37] shadow-md shadow-amber-200/50'
                                : 'bg-slate-50 dark:bg-slate-700/70 text-slate-600 dark:text-slate-300 border-slate-200 dark:border-slate-600 hover:border-[#D4AF37]/40 hover:text-slate-800 dark:hover:text-slate-100'
                            }`}>
                            Semua
                        </button>

                        {/* Divider */}
                        <div className="flex-shrink-0 w-px h-5 bg-slate-200 dark:bg-slate-600" />

                        {/* Category pills */}
                        {CATEGORIES.map(cat => (
                            <button key={cat} onClick={() => handleCatClick(cat)}
                                className={`flex-shrink-0 px-3.5 py-1.5 rounded-xl text-xs font-bold border transition-all capitalize ${filterCat === cat
                                    ? 'bg-[#0D5C35] text-white border-[#0D5C35] shadow-md shadow-emerald-200/40 dark:shadow-emerald-900/30'
                                    : 'bg-slate-50 dark:bg-slate-700/70 text-slate-600 dark:text-slate-300 border-slate-200 dark:border-slate-600 hover:border-[#0D5C35]/40 hover:text-[#0D5C35] dark:hover:text-emerald-400 hover:bg-emerald-50/50 dark:hover:bg-emerald-900/10'
                                }`}>
                                {cat.replace(/-/g, ' ')}
                            </button>
                        ))}

                        {/* Sort — hanya muncul saat ada hasil */}
                        {hasQuery && results.length > 0 && (
                            <>
                                <div className="flex-shrink-0 w-px h-5 bg-slate-200 dark:bg-slate-600 ml-auto" />
                                <span className="flex-shrink-0 text-xs text-slate-400 dark:text-slate-500 font-medium">Urut:</span>
                                {([['relevance', 'Relevan'], ['newest', 'Terbaru'], ['views', 'Terpopuler']] as const).map(([key, label]) => (
                                    <button key={key} onClick={() => setSortBy(key)}
                                        className={`flex-shrink-0 px-2.5 py-1 rounded-lg text-[11px] font-bold border transition-all ${sortBy === key
                                            ? 'bg-[#0D5C35] text-white border-[#0D5C35]'
                                            : 'bg-slate-50 dark:bg-slate-700/70 text-slate-500 dark:text-slate-400 border-slate-200 dark:border-slate-600 hover:border-[#0D5C35]/30 hover:text-[#0D5C35] dark:hover:text-emerald-400'
                                        }`}>
                                        {label}
                                    </button>
                                ))}
                            </>
                        )}
                    </div>
                </div>
            </div>

            {/* ══ RESULTS ═══════════════════════════════════════════════════ */}
            <main className="max-w-5xl mx-auto px-4 py-8">

                {/* Status bar */}
                {hasQuery && !loading && (
                    <div className="flex items-center justify-between mb-6 pb-4 border-b border-slate-200/60 dark:border-slate-700/60">
                        <div className="flex items-center gap-2 flex-wrap">
                            {activeQuery && (
                                <p className="text-slate-600 dark:text-slate-400 text-sm">
                                    Hasil untuk{' '}
                                    <span className="font-black text-slate-800 dark:text-slate-100">"{activeQuery}"</span>
                                    {filterCat !== 'all' && <>
                                        {' '}di{' '}
                                        <span className="font-black text-[#0D5C35] dark:text-emerald-400 capitalize">{filterCat.replace(/-/g, ' ')}</span>
                                    </>}
                                </p>
                            )}
                            <span className="text-xs font-bold text-slate-400 dark:text-slate-500 bg-slate-100 dark:bg-slate-700/60 px-2.5 py-0.5 rounded-full border border-slate-200 dark:border-slate-600">
                                {results.length} dokumen{totalPages > 1 ? ` · hal. ${currentPage}/${totalPages}` : ''}
                            </span>
                        </div>
                        {activeQuery && (
                            <button onClick={() => doSearch('', 'all')}
                                className="flex items-center gap-1 text-xs text-rose-500 hover:text-rose-600 font-bold transition-colors hover:bg-rose-50 dark:hover:bg-rose-900/20 px-2 py-1 rounded-lg">
                                <X className="w-3.5 h-3.5" /> Hapus
                            </button>
                        )}
                    </div>
                )}

                {/* Loading skeleton */}
                {loading && (
                    <div className="space-y-4">
                        {Array.from({ length: 4 }).map((_, i) => (
                            <div key={i} className="bg-white dark:bg-[#162918] rounded-2xl p-6 border border-slate-100 dark:border-slate-700 animate-pulse overflow-hidden relative">
                                <div className="absolute left-0 inset-y-0 w-1 bg-slate-200 dark:bg-slate-700 rounded-l-2xl" />
                                <div className="flex items-center gap-2 mb-3">
                                    <div className="h-4 w-20 bg-slate-200 dark:bg-slate-700 rounded-full" />
                                    <div className="h-3 w-14 bg-slate-100 dark:bg-slate-700/50 rounded-full" />
                                </div>
                                <div className="h-5 w-3/4 bg-slate-200 dark:bg-slate-700 rounded-lg mb-2" />
                                <div className="h-3 w-full bg-slate-100 dark:bg-slate-700/50 rounded mb-1" />
                                <div className="h-3 w-2/3 bg-slate-100 dark:bg-slate-700/50 rounded" />
                            </div>
                        ))}
                    </div>
                )}

                {/* Empty state — no query */}
                {!loading && !hasQuery && (
                    <div className="text-center py-20 md:py-24">
                        {/* Animated rings + icon */}
                        <div className="relative inline-flex items-center justify-center mb-8">
                            <span className="absolute w-40 h-40 rounded-full border border-[#0D5C35]/15 dark:border-emerald-700/20 animate-ping" style={{ animationDuration: '3s' }} />
                            <span className="absolute w-28 h-28 rounded-full border border-[#0D5C35]/20 dark:border-emerald-700/30" />
                            <div className="relative w-24 h-24 rounded-3xl bg-gradient-to-br from-[#0D5C35]/10 to-emerald-100/50 dark:from-[#0D5C35]/20 dark:to-emerald-900/20 flex items-center justify-center shadow-lg">
                                <Search className="w-12 h-12 text-[#0D5C35] dark:text-emerald-400 opacity-70" />
                            </div>
                        </div>
                        <h3 className="text-2xl font-black text-slate-700 dark:text-slate-200 mb-2">Mulai Pencarian</h3>
                        <span className="block w-12 h-0.5 bg-[#D4AF37]/50 rounded mx-auto mb-4" />
                        <p className="text-slate-400 dark:text-slate-500 text-sm max-w-sm mx-auto leading-relaxed">
                            Ketik kata kunci di kolom pencarian, atau pilih kategori dari filter bar di atas untuk menelusuri{' '}
                            <strong className="text-slate-600 dark:text-slate-300">{allDocs.length} dokumen</strong> tersedia.
                        </p>
                    </div>
                )}

                {/* No results */}
                {!loading && hasQuery && results.length === 0 && (
                    <div className="text-center py-20 md:py-24">
                        <div className="relative inline-flex items-center justify-center mb-8">
                            <span className="absolute w-32 h-32 rounded-full border border-rose-200 dark:border-rose-800/30 animate-ping" style={{ animationDuration: '2.5s' }} />
                            <div className="relative w-24 h-24 rounded-3xl bg-rose-50 dark:bg-rose-900/20 flex items-center justify-center shadow-lg">
                                <FileText className="w-12 h-12 text-rose-300 dark:text-rose-500" />
                            </div>
                        </div>
                        <h3 className="text-2xl font-black text-slate-700 dark:text-slate-200 mb-2">Tidak Ditemukan</h3>
                        <span className="block w-12 h-0.5 bg-rose-300/50 rounded mx-auto mb-4" />
                        <p className="text-slate-400 dark:text-slate-500 text-sm mb-8 max-w-sm mx-auto leading-relaxed">
                            Tidak ada dokumen yang cocok. Coba kata kunci lain atau pilih kategori berbeda.
                        </p>
                        <button onClick={() => doSearch('', 'all')}
                            className="px-8 py-3 bg-gradient-to-br from-[#0D5C35] to-[#0A492A] text-white rounded-xl font-bold hover:-translate-y-0.5 transition-all shadow-lg shadow-emerald-900/20">
                            Lihat Semua Dokumen
                        </button>
                    </div>
                )}

                {/* Results list */}
                {!loading && results.length > 0 && (
                    <div className="space-y-3">
                        {paginatedResults.map((doc, i) => {
                            const dateStr  = doc.updatedAt?.seconds
                                ? new Date(doc.updatedAt.seconds * 1000).toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric' })
                                : '';
                            const snippet  = getSnippet(doc.content, activeQuery);
                            const globalNo = (currentPage - 1) * RESULTS_PER_PAGE + i + 1;
                            return (
                                <div key={doc.id}
                                    className="result-card result-card-inner group bg-white dark:bg-[#162918] rounded-2xl border border-slate-100 dark:border-slate-700/80 hover:border-[#0D5C35]/25 dark:hover:border-[#D4AF37]/15 shadow-sm hover:shadow-xl hover:shadow-slate-200/60 dark:hover:shadow-slate-900/50 cursor-pointer transition-all duration-300 hover:-translate-y-0.5"
                                    style={{ animationDelay: `${i * 50}ms` }}
                                    onClick={() => navigate(`/detail/${doc.id}`)}>

                                    {/* Left accent bar */}
                                    <div className={`result-accent absolute left-0 inset-y-3 w-1 rounded-full bg-gradient-to-b ${getCategoryAccent(doc.category)} opacity-0 group-hover:opacity-100 transition-opacity duration-300`} />

                                    <div className="p-5 md:p-6">
                                        <div className="flex items-start justify-between gap-4">
                                            <div className="flex-1 min-w-0">
                                                {/* Meta row */}
                                                <div className="flex flex-wrap items-center gap-1.5 mb-2.5">
                                                    {/* Category badge */}
                                                    <span className={`inline-block px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider border ${getCategoryStyle(doc.category)}`}>
                                                        {doc.category.replace(/-/g, ' ')}
                                                    </span>
                                                    {/* Date */}
                                                    {dateStr && (
                                                        <span className="flex items-center gap-1 text-[10px] text-slate-400 dark:text-slate-500 bg-slate-50 dark:bg-slate-700/50 px-2 py-0.5 rounded-full border border-slate-200 dark:border-slate-600">
                                                            <Calendar className="w-3 h-3" />{dateStr}
                                                        </span>
                                                    )}
                                                    {/* Views */}
                                                    <span className="flex items-center gap-1 text-[10px] text-slate-400 dark:text-slate-500 bg-slate-50 dark:bg-slate-700/50 px-2 py-0.5 rounded-full border border-slate-200 dark:border-slate-600">
                                                        <Eye className="w-3 h-3" />{doc.views || 0}
                                                    </span>
                                                    {/* Result number */}
                                                    <span className="ml-auto text-[10px] text-slate-300 dark:text-slate-600 font-bold">
                                                        #{globalNo}
                                                    </span>
                                                </div>

                                                {/* Title */}
                                                <h3 className="font-black text-slate-800 dark:text-slate-100 text-base md:text-lg group-hover:text-[#0D5C35] dark:group-hover:text-emerald-400 transition-colors mb-1.5 leading-snug">
                                                    <Highlight text={doc.title} query={activeQuery} />
                                                </h3>

                                                {/* Description */}
                                                <p className="text-sm text-slate-500 dark:text-slate-400 mb-2.5 leading-relaxed">
                                                    <Highlight text={doc.description} query={activeQuery} />
                                                </p>

                                                {/* Content snippet */}
                                                {activeQuery && doc.content && (
                                                    <div className="border-l-2 border-[#0D5C35]/20 dark:border-emerald-700/30 pl-3 mt-2">
                                                        <p className="text-xs text-slate-400 dark:text-slate-500 italic line-clamp-2 leading-relaxed">
                                                            <Highlight text={snippet} query={activeQuery} />
                                                        </p>
                                                    </div>
                                                )}

                                                {/* Tags */}
                                                {(doc.tags || []).length > 0 && (
                                                    <div className="flex flex-wrap gap-1.5 mt-3">
                                                        {(doc.tags || []).map(tag => (
                                                            <button key={tag}
                                                                onClick={e => { e.stopPropagation(); doSearch(tag, 'all'); }}
                                                                className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold border transition-all
                                                                    ${tag.toLowerCase() === activeQuery.toLowerCase()
                                                                        ? 'bg-[#D4AF37]/20 border-[#D4AF37]/40 text-[#7a5c00] dark:text-[#D4AF37]'
                                                                        : 'bg-slate-100 dark:bg-slate-700 border-slate-200 dark:border-slate-600 text-slate-500 dark:text-slate-400 hover:bg-[#0D5C35] hover:text-white hover:border-[#0D5C35]'
                                                                    }`}>
                                                                <Tag className="w-2.5 h-2.5" />{tag}
                                                            </button>
                                                        ))}
                                                    </div>
                                                )}
                                            </div>

                                            {/* Arrow button kanan */}
                                            <div className="flex-shrink-0 hidden sm:flex items-center justify-center w-11 h-11 rounded-xl bg-slate-50 dark:bg-slate-700/50 border border-slate-200/80 dark:border-slate-600/50 group-hover:bg-[#0D5C35] group-hover:border-[#0D5C35] group-hover:shadow-lg group-hover:shadow-emerald-200/30 dark:group-hover:shadow-emerald-900/30 transition-all duration-300">
                                                <ArrowRight className="w-4 h-4 text-slate-400 group-hover:text-white group-hover:translate-x-0.5 transition-all" />
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                )}
            </main>

            {/* ══ Pagination ══════════════════════════════════════════════ */}
            {!loading && totalPages > 1 && (
                <div className="flex flex-col items-center gap-3 py-8 border-t border-slate-200 dark:border-slate-700/60">
                    <div className="flex items-center gap-2 flex-wrap justify-center bg-white dark:bg-[#162918] rounded-2xl border border-slate-200 dark:border-slate-700 shadow-sm px-4 py-3">
                        <button
                            onClick={() => { setCurrentPage(p => Math.max(1, p - 1)); window.scrollTo({ top: 0, behavior: 'smooth' }); }}
                            disabled={currentPage === 1}
                            className="flex items-center gap-1.5 px-4 py-2 rounded-xl text-sm font-bold bg-slate-50 dark:bg-slate-700/50 border border-slate-200 dark:border-slate-600 text-slate-600 dark:text-slate-300 hover:border-[#0D5C35]/40 hover:text-[#0D5C35] dark:hover:text-emerald-400 disabled:opacity-35 disabled:cursor-not-allowed transition-all">
                            <ChevronLeft className="w-4 h-4" /> Sebelumnya
                        </button>
                        <div className="flex items-center gap-1.5">
                            {Array.from({ length: Math.min(totalPages, 7) }, (_, i) => {
                                let page: number;
                                if (totalPages <= 7) page = i + 1;
                                else if (currentPage <= 4) page = i + 1;
                                else if (currentPage >= totalPages - 3) page = totalPages - 6 + i;
                                else page = currentPage - 3 + i;
                                return (
                                    <button key={page}
                                        onClick={() => { setCurrentPage(page); window.scrollTo({ top: 0, behavior: 'smooth' }); }}
                                        className={`w-10 h-10 rounded-xl text-sm font-bold transition-all ${currentPage === page
                                            ? 'bg-[#0D5C35] text-white shadow-lg shadow-emerald-200/50 dark:shadow-emerald-900/40 scale-110'
                                            : 'bg-white dark:bg-[#162918] text-slate-600 dark:text-slate-300 border border-slate-200 dark:border-slate-700 hover:border-[#0D5C35]/40 hover:text-[#0D5C35] dark:hover:text-emerald-400'
                                        }`}>
                                        {page}
                                    </button>
                                );
                            })}
                        </div>
                        <button
                            onClick={() => { setCurrentPage(p => Math.min(totalPages, p + 1)); window.scrollTo({ top: 0, behavior: 'smooth' }); }}
                            disabled={currentPage === totalPages}
                            className="flex items-center gap-1.5 px-4 py-2 rounded-xl text-sm font-bold bg-slate-50 dark:bg-slate-700/50 border border-slate-200 dark:border-slate-600 text-slate-600 dark:text-slate-300 hover:border-[#0D5C35]/40 hover:text-[#0D5C35] dark:hover:text-emerald-400 disabled:opacity-35 disabled:cursor-not-allowed transition-all">
                            Berikutnya <ArrowRight className="w-4 h-4" />
                        </button>
                    </div>
                    <p className="text-xs text-slate-400 dark:text-slate-500 font-medium">
                        Halaman <span className="font-black text-slate-700 dark:text-slate-200">{currentPage}</span> dari <span className="font-black text-slate-700 dark:text-slate-200">{totalPages}</span>
                        <span className="mx-1.5 opacity-40">·</span>{results.length} hasil total
                    </p>
                </div>
            )}

        </div>
    );
};

export default SearchPage;