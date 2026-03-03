// File: src/pages/SearchPage.tsx
import React, { useEffect, useState, useMemo, useCallback, useRef } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { Helmet } from 'react-helmet-async';
import { collection, getDocs, query, orderBy, addDoc, serverTimestamp } from 'firebase/firestore';
import { db } from '../firebase';
import {
    Search, X, Home, ChevronRight, Eye, Calendar, Tag,
    FileText, Filter, ArrowLeft, SlidersHorizontal, Clock,
    ArrowRight, Sparkles, ChevronLeft, Moon, Sun,
} from 'lucide-react';

/* ─── CSS ──────────────────────────────────────────────────────── */
const PAGE_CSS = `
@keyframes searchBlob {
  0%,100% { transform: translate(0,0) scale(1); }
  50%      { transform: translate(-30px,20px) scale(1.08); }
}
@keyframes cardIn {
  from { opacity: 0; transform: translateY(12px); }
  to   { opacity: 1; transform: translateY(0); }
}
.search-blob { animation: searchBlob 16s ease-in-out infinite; }
.result-card { animation: cardIn 0.35s ease-out forwards; opacity: 0; }
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
        'psp': 'bg-emerald-100 text-emerald-800 border-emerald-200 dark:bg-emerald-900/30 dark:text-emerald-300',
        'penjualan': 'bg-amber-100   text-amber-800   border-amber-200   dark:bg-amber-900/30   dark:text-amber-300',
        'sewa': 'bg-blue-100    text-blue-800    border-blue-200    dark:bg-blue-900/30    dark:text-blue-300',
        'penghapusan': 'bg-rose-100    text-rose-800    border-rose-200    dark:bg-rose-900/30    dark:text-rose-300',
        'pinjam-pakai': 'bg-indigo-100  text-indigo-800  border-indigo-200  dark:bg-indigo-900/30  dark:text-indigo-300',
        'penggunaan-sementara': 'bg-purple-100  text-purple-800  border-purple-200  dark:bg-purple-900/30  dark:text-purple-300',
        'alih-status': 'bg-teal-100    text-teal-800    border-teal-200    dark:bg-teal-900/30    dark:text-teal-300',
        'hibah': 'bg-orange-100  text-orange-800  border-orange-200  dark:bg-orange-900/30  dark:text-orange-300',
        'user-siman': 'bg-slate-100   text-slate-800   border-slate-200   dark:bg-slate-700   dark:text-slate-300',
    };
    return map[cat] ?? 'bg-slate-100 text-slate-800 border-slate-200';
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
    const end = Math.min(content.length, start + len);
    return (start > 0 ? '…' : '') + content.substring(start, end) + (end < content.length ? '…' : '');
};

/* ══════════════════════════════════════════════════════════════
   KOMPONEN UTAMA
══════════════════════════════════════════════════════════════ */
const SearchPage: React.FC = () => {
    const navigate = useNavigate();
    const [searchParams, setSearchParams] = useSearchParams();

    const [allDocs, setAllDocs] = useState<Doc[]>([]);
    const [loading, setLoading] = useState(true);
    const [inputVal, setInputVal] = useState(searchParams.get('q') || '');
    const [activeQuery, setActiveQuery] = useState(searchParams.get('q') || '');
    const [filterCat, setFilterCat] = useState(searchParams.get('cat') || 'all');
    const [sortBy, setSortBy] = useState<'relevance' | 'newest' | 'views'>('relevance');
    const [showFilters, setShowFilters] = useState(false);
    const [currentPage, setCurrentPage] = useState(1);
    const RESULTS_PER_PAGE = 10;

    /* ── Search Analytics: ref untuk mencegah log duplikat ── */
    const lastLoggedQueryRef = useRef<string>('');

    /* Dark mode — state + reaktif (apply & simpan ke localStorage) */
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
        const q = searchParams.get('q') || '';
        const cat = searchParams.get('cat') || 'all';
        setInputVal(q);
        setActiveQuery(q);
        setFilterCat(cat);
    }, [searchParams]);

    /* ── Live-search debounce 400 ms ── */
    useEffect(() => {
        const timer = setTimeout(() => {
            setActiveQuery(inputVal.trim());
        }, 400);
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
        let filtered = allDocs.filter(d => {
            const catMatch = filterCat === 'all' || d.category === filterCat;
            if (!q) return catMatch;
            const inTitle = (d.title || '').toLowerCase().includes(q);
            const inDesc = (d.description || '').toLowerCase().includes(q);
            const inContent = (d.content || '').toLowerCase().includes(q);
            const inTags = (d.tags || []).some(t => t.toLowerCase().includes(q));
            return catMatch && (inTitle || inDesc || inContent || inTags);
        });

        /* Scoring for relevance sort */
        const scored = filtered.map(d => {
            const q2 = activeQuery.toLowerCase();
            let score = 0;
            if ((d.title || '').toLowerCase().includes(q2)) score += 10;
            if ((d.title || '').toLowerCase().startsWith(q2)) score += 5;
            if ((d.description || '').toLowerCase().includes(q2)) score += 4;
            if ((d.tags || []).some(t => t.toLowerCase() === q2)) score += 6;
            if ((d.content || '').toLowerCase().includes(q2)) score += 2;
            return { ...d, _score: score };
        });

        if (sortBy === 'relevance') return scored.sort((a, b) => b._score - a._score);
        if (sortBy === 'newest') return scored.sort((a, b) => (b.updatedAt?.seconds || 0) - (a.updatedAt?.seconds || 0));
        if (sortBy === 'views') return scored.sort((a, b) => (b.views || 0) - (a.views || 0));
        return scored;
    }, [allDocs, activeQuery, filterCat, sortBy]);

    const hasQuery = activeQuery || filterCat !== 'all';

    /* ── Search Analytics: simpan query ke Firestore saat aktif ──
       POSISI PENTING: harus setelah `results` useMemo karena useEffect
       membaca results.length. Menaruhnya sebelum deklarasi results
       menyebabkan "used before declaration" error di TypeScript.
       Fire-and-forget: error diabaikan agar tidak ganggu UX.
       ─────────────────────────────────────────────────────────────
       FIX: 'resultsCount' → 'resultCount' (tanpa 's') dan
            'timestamp'    → 'createdAt'
       Kedua field harus cocok dengan yang dibaca AdminDashboard:
         - interface SearchLog membaca 'resultCount'
         - query Firestore orderBy('createdAt', 'desc')
    ── */
    // eslint-disable-next-line react-hooks/exhaustive-deps
    useEffect(() => {
        if (!activeQuery.trim() || activeQuery === lastLoggedQueryRef.current) return;
        lastLoggedQueryRef.current = activeQuery;
        addDoc(collection(db, 'search-logs'), {
            query:       activeQuery.trim(),
            resultCount: results.length,    // ✅ FIX: was 'resultsCount' (typo dengan 's')
            createdAt:   serverTimestamp(),  // ✅ FIX: was 'timestamp' (tidak cocok orderBy AdminDashboard)
        }).catch(() => { /* silent — jangan ganggu UX */ });
    }, [activeQuery, results]);

    const totalPages = Math.ceil(results.length / RESULTS_PER_PAGE);
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

            {/* ── HERO / SEARCH BAR ── */}
            <div className="relative bg-gradient-to-br from-[#0D5C35] to-[#062B18] pt-14 pb-12 px-4 overflow-hidden">
                <div className="absolute inset-0 opacity-10 pointer-events-none">
                    <div className="search-blob absolute -top-16 -left-16 w-80 h-80 rounded-full bg-emerald-400 blur-3xl" />
                    <div className="search-blob absolute -bottom-16 right-0 w-64 h-64 rounded-full bg-[#D4AF37] blur-3xl" style={{ animationDelay: '4s' }} />
                </div>

                <div className="relative z-10 max-w-2xl mx-auto">
                    {/* Breadcrumb */}
                    <nav className="flex items-center gap-1.5 text-xs text-white/50 mb-6">
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

                    <div className="flex items-center gap-2 mb-2">
                        <div className="inline-flex items-center gap-2 px-3 py-1 bg-white/10 border border-white/15 rounded-full text-xs font-bold text-white/70 uppercase tracking-wider">
                            <Search className="w-3.5 h-3.5" /> Pencarian Global
                        </div>
                    </div>
                    <h1 className="text-2xl md:text-3xl font-black text-white mb-2 tracking-tight">
                        Temukan Informasi yang Kamu Butuhkan
                    </h1>
                    <p className="text-white/60 text-sm mb-7">Cari dari seluruh {allDocs.length} dokumen knowledge base KPKNL Kendari.</p>

                    {/* Search form */}
                    <form onSubmit={handleSubmit} className="relative">
                        <div className="flex gap-2">
                            <div className="relative flex-1">
                                {inputVal !== activeQuery && inputVal.length > 0
                                ? <span className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 flex items-center justify-center"><span className="w-4 h-4 border-2 border-[#0D5C35] border-t-transparent rounded-full animate-spin" /></span>
                                : <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400 pointer-events-none" />
                            }
                                <input
                                    type="text"
                                    autoFocus
                                    value={inputVal}
                                    onChange={e => setInputVal(e.target.value)}
                                    placeholder="Ketik kata kunci, judul, atau tag…"
                                    className="w-full pl-12 pr-12 py-4 rounded-2xl bg-white dark:bg-[#0f1f16] text-slate-800 dark:text-slate-200 placeholder:text-slate-400 font-medium text-sm shadow-xl outline-none focus:ring-2 focus:ring-[#D4AF37] transition-all"
                                />
                                {inputVal && (
                                    <button type="button" onClick={() => { setInputVal(''); doSearch('', filterCat); }}
                                        className="absolute right-4 top-1/2 -translate-y-1/2 p-1 text-slate-400 hover:text-slate-600 transition-colors">
                                        <X className="w-4 h-4" />
                                    </button>
                                )}
                            </div>
                            <button type="submit"
                                className="px-6 py-4 bg-[#D4AF37] hover:bg-[#B5952F] text-slate-900 rounded-2xl font-black text-sm shadow-xl transition-all hover:-translate-y-0.5 flex items-center gap-2">
                                <Search className="w-4 h-4" />
                                <span className="hidden sm:inline">Cari</span>
                            </button>
                        </div>
                    </form>
                </div>
            </div>

            {/* ── FILTERS ── */}
            <div className="border-b border-slate-200 dark:border-slate-700 bg-white dark:bg-[#162918] shadow-sm sticky top-0 z-30">
                <div className="max-w-5xl mx-auto px-4 py-3 flex items-center gap-3 flex-wrap">
                    <button onClick={() => setShowFilters(p => !p)}
                        className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold border transition-all ${showFilters ? 'bg-[#0D5C35] text-white border-[#0D5C35]' : 'bg-slate-50 dark:bg-slate-700 text-slate-600 dark:text-slate-300 border-slate-200 dark:border-slate-600 hover:border-[#0D5C35]/40'}`}>
                        <SlidersHorizontal className="w-3.5 h-3.5" /> Filter
                    </button>
                    <div className="flex items-center gap-2 flex-wrap">
                        <button onClick={() => handleCatClick('all')}
                            className={`px-3 py-1.5 rounded-xl text-xs font-bold border transition-all ${filterCat === 'all' ? 'bg-[#D4AF37] text-slate-900 border-[#D4AF37]' : 'bg-slate-50 dark:bg-slate-700 text-slate-600 dark:text-slate-300 border-slate-200 dark:border-slate-600 hover:border-slate-300'}`}>
                            Semua
                        </button>
                        {CATEGORIES.map(cat => (
                            <button key={cat} onClick={() => handleCatClick(cat)}
                                className={`px-3 py-1.5 rounded-xl text-xs font-bold border transition-all capitalize ${filterCat === cat ? 'bg-[#0D5C35] text-white border-[#0D5C35]' : 'bg-slate-50 dark:bg-slate-700 text-slate-600 dark:text-slate-300 border-slate-200 dark:border-slate-600 hover:border-[#0D5C35]/30'}`}>
                                {cat.replace(/-/g, ' ')}
                            </button>
                        ))}
                    </div>

                    {/* Sort */}
                    {hasQuery && results.length > 0 && (
                        <div className="ml-auto flex items-center gap-2">
                            <span className="text-xs text-slate-400 dark:text-slate-500">Urut:</span>
                            {([['relevance', 'Relevan'], ['newest', 'Terbaru'], ['views', 'Terpopuler']] as const).map(([key, label]) => (
                                <button key={key} onClick={() => setSortBy(key)}
                                    className={`px-2.5 py-1 rounded-lg text-[11px] font-bold border transition-all ${sortBy === key ? 'bg-[#0D5C35] text-white border-[#0D5C35]' : 'bg-slate-50 dark:bg-slate-700 text-slate-500 dark:text-slate-400 border-slate-200 dark:border-slate-600'}`}>
                                    {label}
                                </button>
                            ))}
                        </div>
                    )}
                </div>
            </div>

            {/* ── RESULTS ── */}
            <main className="max-w-5xl mx-auto px-4 py-8">

                {/* Status bar */}
                {hasQuery && !loading && (
                    <div className="flex items-center justify-between mb-6">
                        <div className="flex items-center gap-2">
                            {activeQuery && (
                                <p className="text-slate-600 dark:text-slate-400 text-sm">
                                    Hasil pencarian untuk <span className="font-black text-slate-800 dark:text-slate-100">"{activeQuery}"</span>
                                    {filterCat !== 'all' && <> di <span className="font-black text-[#0D5C35] dark:text-emerald-400 capitalize">{filterCat.replace(/-/g, ' ')}</span></>}
                                </p>
                            )}
                            <span className="text-xs font-bold text-slate-400 dark:text-slate-500 bg-slate-100 dark:bg-slate-700 px-2 py-0.5 rounded-full">
                                {results.length} dokumen{totalPages > 1 ? ` · hal. ${currentPage}/${totalPages}` : ''}
                            </span>
                        </div>
                        {activeQuery && (
                            <button onClick={() => doSearch('', 'all')}
                                className="flex items-center gap-1 text-xs text-rose-500 hover:text-rose-600 font-bold transition-colors">
                                <X className="w-3.5 h-3.5" /> Hapus
                            </button>
                        )}
                    </div>
                )}

                {/* Loading */}
                {loading && (
                    <div className="space-y-4">
                        {Array.from({ length: 4 }).map((_, i) => (
                            <div key={i} className="bg-white dark:bg-[#162918] rounded-2xl p-6 border border-slate-100 dark:border-slate-700 animate-pulse">
                                <div className="h-3 w-20 bg-slate-200 dark:bg-slate-700 rounded mb-3" />
                                <div className="h-5 w-3/4 bg-slate-200 dark:bg-slate-700 rounded mb-2" />
                                <div className="h-3 w-full bg-slate-100 dark:bg-slate-700/50 rounded mb-1" />
                                <div className="h-3 w-2/3 bg-slate-100 dark:bg-slate-700/50 rounded" />
                            </div>
                        ))}
                    </div>
                )}

                {/* Empty state — no query */}
                {!loading && !hasQuery && (
                    <div className="text-center py-20">
                        <div className="inline-flex items-center justify-center w-20 h-20 rounded-3xl bg-[#0D5C35]/10 dark:bg-[#0D5C35]/20 mb-5">
                            <Search className="w-10 h-10 text-[#0D5C35] dark:text-emerald-400 opacity-60" />
                        </div>
                        <h3 className="text-xl font-black text-slate-700 dark:text-slate-200 mb-2">Mulai Pencarian</h3>
                        <p className="text-slate-400 dark:text-slate-500 text-sm max-w-sm mx-auto">
                            Ketik kata kunci di kolom di atas untuk mencari dari {allDocs.length} dokumen tersedia.
                        </p>
                        {/* Suggested tags */}
                        <div className="mt-8">
                            <p className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-3">Atau telusuri per kategori</p>
                            <div className="flex flex-wrap gap-2 justify-center">
                                {CATEGORIES.map(cat => (
                                    <button key={cat} onClick={() => handleCatClick(cat)}
                                        className="px-4 py-2 rounded-xl text-sm font-bold bg-white dark:bg-[#162918] border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 hover:border-[#0D5C35]/40 hover:text-[#0D5C35] dark:hover:text-emerald-400 transition-all capitalize shadow-sm">
                                        {cat.replace(/-/g, ' ')}
                                    </button>
                                ))}
                            </div>
                        </div>
                    </div>
                )}

                {/* No results */}
                {!loading && hasQuery && results.length === 0 && (
                    <div className="text-center py-20">
                        <div className="inline-flex items-center justify-center w-20 h-20 rounded-3xl bg-rose-50 dark:bg-rose-900/20 mb-5">
                            <FileText className="w-10 h-10 text-rose-300 dark:text-rose-500" />
                        </div>
                        <h3 className="text-xl font-black text-slate-700 dark:text-slate-200 mb-2">Tidak Ditemukan</h3>
                        <p className="text-slate-400 dark:text-slate-500 text-sm mb-6 max-w-sm mx-auto">
                            Coba kata kunci lain atau hapus filter kategori.
                        </p>
                        <button onClick={() => doSearch('', 'all')}
                            className="px-6 py-3 bg-[#0D5C35] text-white rounded-xl font-bold hover:-translate-y-0.5 transition-all shadow-lg shadow-emerald-200/50">
                            Lihat Semua Dokumen
                        </button>
                    </div>
                )}

                {/* Results list */}
                {!loading && results.length > 0 && (
                    <div className="space-y-4">
                        {paginatedResults.map((doc, i) => {
                            const dateStr = doc.updatedAt?.seconds
                                ? new Date(doc.updatedAt.seconds * 1000).toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric' })
                                : '';
                            const snippet = getSnippet(doc.content, activeQuery);
                            return (
                                <div key={doc.id}
                                    className="result-card group bg-white dark:bg-[#162918] rounded-2xl border border-slate-100 dark:border-slate-700 hover:border-[#0D5C35]/30 dark:hover:border-[#D4AF37]/20 shadow-sm hover:shadow-lg p-5 md:p-6 cursor-pointer transition-all duration-300 hover:-translate-y-0.5"
                                    style={{ animationDelay: `${i * 50}ms` }}
                                    onClick={() => navigate(`/detail/${doc.id}`)}>
                                    <div className="flex items-start justify-between gap-4">
                                        <div className="flex-1 min-w-0">
                                            <div className="flex flex-wrap items-center gap-2 mb-2">
                                                <span className={`inline-block px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider border ${getCategoryStyle(doc.category)}`}>
                                                    {doc.category.replace(/-/g, ' ')}
                                                </span>
                                                {dateStr && (
                                                    <span className="flex items-center gap-1 text-[10px] text-slate-400 dark:text-slate-500">
                                                        <Calendar className="w-3 h-3" />{dateStr}
                                                    </span>
                                                )}
                                                <span className="flex items-center gap-1 text-[10px] text-slate-400 dark:text-slate-500">
                                                    <Eye className="w-3 h-3" />{doc.views || 0}
                                                </span>
                                            </div>
                                            <h3 className="font-black text-slate-800 dark:text-slate-100 text-base md:text-lg group-hover:text-[#0D5C35] dark:group-hover:text-emerald-400 transition-colors mb-1.5 leading-snug">
                                                <Highlight text={doc.title} query={activeQuery} />
                                            </h3>
                                            <p className="text-sm text-slate-500 dark:text-slate-400 mb-2 leading-relaxed">
                                                <Highlight text={doc.description} query={activeQuery} />
                                            </p>
                                            {activeQuery && doc.content && (
                                                <p className="text-xs text-slate-400 dark:text-slate-500 italic line-clamp-2 leading-relaxed border-l-2 border-slate-200 dark:border-slate-600 pl-3">
                                                    <Highlight text={snippet} query={activeQuery} />
                                                </p>
                                            )}
                                            {/* Tags */}
                                            {(doc.tags || []).length > 0 && (
                                                <div className="flex flex-wrap gap-1.5 mt-3">
                                                    {(doc.tags || []).map(tag => (
                                                        <button key={tag}
                                                            onClick={e => { e.stopPropagation(); doSearch(tag, 'all'); }}
                                                            className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold border transition-all ${tag.toLowerCase() === activeQuery.toLowerCase() ? 'bg-[#D4AF37]/20 border-[#D4AF37]/40 text-[#7a5c00] dark:text-[#D4AF37]' : 'bg-slate-100 dark:bg-slate-700 border-slate-200 dark:border-slate-600 text-slate-500 dark:text-slate-400 hover:bg-[#0D5C35] hover:text-white hover:border-[#0D5C35]'}`}>
                                                            <Tag className="w-2.5 h-2.5" />{tag}
                                                        </button>
                                                    ))}
                                                </div>
                                            )}
                                        </div>
                                        <div className="flex-shrink-0 hidden sm:flex items-center justify-center w-10 h-10 rounded-xl bg-slate-50 dark:bg-slate-700 group-hover:bg-[#0D5C35] group-hover:text-white transition-all">
                                            <ArrowRight className="w-4 h-4 text-slate-400 group-hover:text-white group-hover:translate-x-0.5 transition-all" />
                                        </div>
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                )}
            </main>

            {/* ── Pagination ── */}
            {!loading && totalPages > 1 && (
                <div className="flex flex-col items-center gap-3 py-6 border-t border-slate-200 dark:border-slate-700">
                    <div className="flex items-center gap-2 flex-wrap justify-center">
                        <button
                            onClick={() => { setCurrentPage(p => Math.max(1, p - 1)); window.scrollTo({ top: 0, behavior: 'smooth' }); }}
                            disabled={currentPage === 1}
                            className="flex items-center gap-1.5 px-4 py-2 rounded-xl text-sm font-bold bg-white dark:bg-[#162918] border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 hover:border-[#0D5C35]/40 hover:text-[#0D5C35] dark:hover:text-emerald-400 disabled:opacity-35 disabled:cursor-not-allowed transition-all shadow-sm">
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
                                            ? 'bg-[#0D5C35] text-white shadow-md shadow-emerald-200/50 dark:shadow-emerald-900/30 scale-110'
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
                            className="flex items-center gap-1.5 px-4 py-2 rounded-xl text-sm font-bold bg-white dark:bg-[#162918] border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 hover:border-[#0D5C35]/40 hover:text-[#0D5C35] dark:hover:text-emerald-400 disabled:opacity-35 disabled:cursor-not-allowed transition-all shadow-sm">
                            Berikutnya <ArrowRight className="w-4 h-4" />
                        </button>
                    </div>
                    <p className="text-xs text-slate-400 dark:text-slate-500 font-medium">
                        Halaman <span className="font-black text-slate-700 dark:text-slate-200">{currentPage}</span> dari <span className="font-black text-slate-700 dark:text-slate-200">{totalPages}</span>
                        <span className="mx-1.5 opacity-40">·</span>{results.length} hasil total
                    </p>
                </div>
            )}

            {/* Bottom CTA */}
            <div className="border-t border-slate-200 dark:border-slate-700 py-8 text-center">
                <button onClick={() => navigate('/')}
                    className="inline-flex items-center gap-2 text-sm font-bold text-slate-500 dark:text-slate-400 hover:text-[#0D5C35] dark:hover:text-emerald-400 transition-colors">
                    <ArrowLeft className="w-4 h-4" /> Kembali ke Beranda
                </button>
            </div>
        </div>
    );
};

export default SearchPage;