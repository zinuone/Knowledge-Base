// File: src/pages/BookmarksPage.tsx
import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { collection, query, where, documentId, getDocs } from 'firebase/firestore';
import { db } from '../firebase';
import { Helmet } from 'react-helmet-async';
import {
    ArrowLeft, Bookmark, BookmarkX, Home, FileText,
    ArrowRight, Trash2, Sparkles, ChevronRight, Sun, Moon, Search, Info, AlertTriangle,
    Star, TrendingUp,
} from 'lucide-react';

/* ─── CSS Premium ─────────────────────────────────────────────── */
const PAGE_CSS = `
@keyframes fadeInUp {
  from { opacity: 0; transform: translateY(20px) scale(0.97); }
  to   { opacity: 1; transform: translateY(0) scale(1); }
}
@keyframes bmBlob1 {
  0%,100% { transform: translate(0,0) scale(1); }
  50%     { transform: translate(30px,-20px) scale(1.06); }
}
@keyframes bmBlob2 {
  0%,100% { transform: translate(0,0) scale(1); }
  33%     { transform: translate(-25px,15px) scale(1.04); }
  66%     { transform: translate(20px,25px) scale(0.97); }
}
@keyframes gridPan {
  0%   { background-position: 0 0; }
  100% { background-position: 44px 44px; }
}
@keyframes goldPulse {
  0%, 100% { opacity: 0.6; }
  50%       { opacity: 1; }
}
@keyframes goldLine {
  0%   { width: 0; opacity: 0; }
  100% { width: 64px; opacity: 1; }
}
@keyframes accentBarIn {
  from { transform: scaleX(0); transform-origin: left; }
  to   { transform: scaleX(1); transform-origin: left; }
}
@keyframes shimmerSweep {
  from { transform: translateX(-150%) skewX(-12deg); }
  to   { transform: translateX(250%)  skewX(-12deg); }
}
@keyframes pulseRing {
  0%   { transform: scale(1);   opacity: 0.5; }
  100% { transform: scale(1.7); opacity: 0; }
}
@keyframes floatStar {
  0%, 100% { transform: translateY(0) rotate(-5deg); }
  50%       { transform: translateY(-8px) rotate(5deg); }
}
@keyframes removeWobble {
  0%, 100% { transform: rotate(0deg); }
  25%       { transform: rotate(-8deg); }
  75%       { transform: rotate(8deg); }
}

.bm-card  { animation: fadeInUp 0.5s cubic-bezier(0.22,0.61,0.36,1) forwards; opacity: 0; }
.bm-blob-1 { animation: bmBlob1 16s ease-in-out infinite; }
.bm-blob-2 { animation: bmBlob2 20s ease-in-out infinite; }

.bm-hero-grid {
  background-image: radial-gradient(circle, rgba(255,255,255,0.10) 1px, transparent 1px);
  background-size: 44px 44px;
  animation: gridPan 16s linear infinite;
}

.bm-gold-pulse { animation: goldPulse 3s ease-in-out infinite; }
.bm-float-star { animation: floatStar 4s ease-in-out infinite; }

.bm-accent-bar {
  animation: accentBarIn 0.35s cubic-bezier(0.22,0.61,0.36,1) 0.25s both;
}

/* Shimmer on card hover */
.bm-card-inner {
  position: relative;
  overflow: hidden;
}
.bm-card-inner::after {
  content: '';
  position: absolute;
  top: 0; left: -80%;
  width: 60%;
  height: 100%;
  background: linear-gradient(90deg, transparent, rgba(255,255,255,0.06), transparent);
  transform: skewX(-12deg);
  pointer-events: none;
  opacity: 0;
}
.bm-card-inner:hover::after {
  opacity: 1;
  animation: shimmerSweep 0.65s ease-out;
}

/* Remove button wobble on hover */
.bm-remove-btn:hover { animation: removeWobble 0.35s ease-in-out; }
`;

/* ─── ACCENT GRADIENT PER KATEGORI ───────────────────────────── */
const getCategoryAccent = (cat: string) => {
    const map: Record<string, string> = {
        'psp':                  'from-emerald-400 to-teal-500',
        'penjualan':            'from-amber-400   to-orange-500',
        'sewa':                 'from-blue-400    to-indigo-500',
        'penghapusan':          'from-rose-400    to-pink-500',
        'pinjam-pakai':         'from-indigo-400  to-purple-500',
        'penggunaan-sementara': 'from-purple-400  to-violet-500',
        'alih-status':          'from-teal-400    to-cyan-500',
        'hibah':                'from-orange-400  to-red-400',
        'user-siman':           'from-cyan-400    to-blue-500',
    };
    return map[cat] ?? 'from-emerald-400 to-teal-500';
};

/* ─── WARNA KATEGORI BADGE ───────────────────────────────────── */
const getCategoryStyle = (cat: string) => {
    const map: Record<string, string> = {
        'psp':                  'bg-emerald-100 text-emerald-800 border-emerald-200 dark:bg-emerald-900/30 dark:text-emerald-300 dark:border-emerald-700/30',
        'penjualan':            'bg-amber-100   text-amber-800   border-amber-200   dark:bg-amber-900/30   dark:text-amber-300   dark:border-amber-700/30',
        'sewa':                 'bg-blue-100    text-blue-800    border-blue-200    dark:bg-blue-900/30    dark:text-blue-300    dark:border-blue-700/30',
        'penghapusan':          'bg-rose-100    text-rose-800    border-rose-200    dark:bg-rose-900/30    dark:text-rose-300    dark:border-rose-700/30',
        'pinjam-pakai':         'bg-indigo-100  text-indigo-800  border-indigo-200  dark:bg-indigo-900/30  dark:text-indigo-300  dark:border-indigo-700/30',
        'penggunaan-sementara': 'bg-purple-100  text-purple-800  border-purple-200  dark:bg-purple-900/30  dark:text-purple-300  dark:border-purple-700/30',
        'alih-status':          'bg-teal-100    text-teal-800    border-teal-200    dark:bg-teal-900/30    dark:text-teal-300    dark:border-teal-700/30',
        'hibah':                'bg-orange-100  text-orange-800  border-orange-200  dark:bg-orange-900/30  dark:text-orange-300  dark:border-orange-700/30',
        'user-siman':           'bg-cyan-100    text-cyan-800    border-cyan-200    dark:bg-cyan-900/30    dark:text-cyan-300    dark:border-cyan-700/30',
    };
    return map[cat] ?? 'bg-slate-100 text-slate-800 border-slate-200 dark:bg-slate-700 dark:text-slate-300 dark:border-slate-600';
};

interface BookmarkDoc {
    id: string;
    title: string;
    category: string;
    description: string;
    updatedAt?: any;
    views?: number;
}

const BookmarksPage: React.FC = () => {
    const navigate = useNavigate();
    const [docs, setDocs] = useState<BookmarkDoc[]>([]);
    const [isDark, setIsDark] = useState(() => {
        try { return localStorage.getItem('pkn-theme') === 'dark'; } catch { return false; }
    });
    const [loading, setLoading] = useState(true);
    const [bookmarkIds, setBookmarkIds] = useState<string[]>(() => {
        try { return JSON.parse(localStorage.getItem('pkn-bookmarks') || '[]'); } catch { return []; }
    });

    /* ── Dark Mode ── */
    useEffect(() => {
        document.documentElement.classList.toggle('dark', isDark);
        try { localStorage.setItem('pkn-theme', isDark ? 'dark' : 'light'); } catch { }
    }, [isDark]);

    /* ── Fetch documents ── */
    useEffect(() => {
        const fetchBookmarks = async () => {
            if (bookmarkIds.length === 0) { setLoading(false); return; }
            setLoading(true);
            try {
                const results: BookmarkDoc[] = [];
                /* Firestore 'in' supports max 30 items; batch jika lebih */
                const chunks: string[][] = [];
                for (let i = 0; i < bookmarkIds.length; i += 10) {
                    chunks.push(bookmarkIds.slice(i, i + 10));
                }
                for (const chunk of chunks) {
                    const q = query(
                        collection(db, 'knowledge-base'),
                        where(documentId(), 'in', chunk)
                    );
                    const snap = await getDocs(q);
                    snap.docs.forEach(d => results.push({ id: d.id, ...d.data() } as BookmarkDoc));
                }
                /* Preserve original bookmark order */
                const ordered = bookmarkIds
                    .map(id => results.find(r => r.id === id))
                    .filter(Boolean) as BookmarkDoc[];
                setDocs(ordered);
            } catch (e) { console.error(e); }
            finally { setLoading(false); }
        };
        fetchBookmarks();
    }, [bookmarkIds]);

    /* ── Remove single bookmark ── */
    const handleRemove = (id: string) => {
        const updated = bookmarkIds.filter(b => b !== id);
        try { localStorage.setItem('pkn-bookmarks', JSON.stringify(updated)); } catch { }
        setBookmarkIds(updated);
        setDocs(prev => prev.filter(d => d.id !== id));
    };

    /* ── Clear all ── */
    const handleClearAll = () => {
        try { localStorage.setItem('pkn-bookmarks', '[]'); } catch { }
        setBookmarkIds([]);
        setDocs([]);
    };

    return (
        <div className="min-h-screen bg-[#F4F7F5] dark:bg-[#0d1a12] font-sans pb-24 transition-colors duration-300">
            <Helmet>
                <title>Dokumen Favorit | Knowledge Base KPKNL Kendari</title>
                <meta name="description" content="Kumpulan dokumen yang Anda tandai untuk akses cepat ke informasi yang paling sering dibutuhkan." />
            </Helmet>
            <style dangerouslySetInnerHTML={{ __html: PAGE_CSS }} />

            {/* ══ HERO HEADER ══════════════════════════════════════════════ */}
            <header className="relative bg-gradient-to-br from-[#0D5C35] via-[#0A492A] to-[#062B18] overflow-hidden">
                {/* Dot grid */}
                <div className="absolute inset-0 bm-hero-grid opacity-20 pointer-events-none" />

                {/* Ambient blobs */}
                <div className="absolute inset-0 pointer-events-none overflow-hidden">
                    <div className="bm-blob-1 absolute -top-20 -left-16 w-80 h-80 rounded-full bg-emerald-400/20 blur-3xl" />
                    <div className="bm-blob-2 absolute -bottom-16 -right-12 w-72 h-72 rounded-full bg-[#D4AF37]/12 blur-3xl" />
                    {/* Center glow */}
                    <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[200px] rounded-full bg-white/[0.015] blur-3xl" />
                </div>

                <div className="relative z-10 max-w-5xl mx-auto px-4 sm:px-6 pt-8 pb-20 md:pb-24">
                    {/* Breadcrumb */}
                    <nav className="flex items-center gap-1.5 text-emerald-100/55 text-xs font-medium mb-5">
                        <button onClick={() => navigate('/')} className="flex items-center gap-1 hover:text-white transition-colors">
                            <Home className="w-3.5 h-3.5" /> Beranda
                        </button>
                        <ChevronRight className="w-3 h-3" />
                        <span className="text-white/80 font-bold">Dokumen Favorit</span>
                    </nav>

                    {/* Tombol nav */}
                    <div className="mb-6 flex items-center gap-2.5 flex-wrap">
                        <button onClick={() => navigate(-1)}
                            className="inline-flex items-center gap-2 text-emerald-100/80 hover:text-white bg-white/10 hover:bg-white/20 px-4 py-2 rounded-full transition-all text-sm font-bold border border-white/10 hover:border-white/25 group">
                            <ArrowLeft className="w-4 h-4 group-hover:-translate-x-0.5 transition-transform" /> Kembali
                        </button>
                        <button onClick={() => navigate('/search')}
                            className="inline-flex items-center gap-2 text-emerald-100/60 hover:text-white bg-white/10 hover:bg-white/20 px-4 py-2 rounded-full transition-all text-sm font-bold border border-white/10 hover:border-white/25">
                            <Search className="w-4 h-4" /> Cari Dokumen
                        </button>
                        <button
                            onClick={() => setIsDark(p => !p)}
                            className="ml-auto p-2.5 rounded-full bg-white/10 hover:bg-white/20 border border-white/15 transition-all"
                            title={isDark ? 'Mode Terang' : 'Mode Gelap'}>
                            {isDark ? <Sun className="w-4 h-4 text-[#D4AF37]" /> : <Moon className="w-4 h-4 text-white/80" />}
                        </button>
                    </div>

                    <div className="flex items-start justify-between gap-6">
                        <div className="flex-1 min-w-0">
                            {/* Badge */}
                            <div className="flex items-center gap-2.5 mb-3">
                                <div className="p-2.5 bg-[#D4AF37]/20 border border-[#D4AF37]/35 rounded-2xl bm-float-star">
                                    <Bookmark className="w-5 h-5 text-[#D4AF37]" />
                                </div>
                                <span className="inline-flex items-center gap-1.5 px-3 py-1 bg-[#D4AF37]/20 border border-[#D4AF37]/35 rounded-full text-[#D4AF37] text-xs font-bold uppercase tracking-widest">
                                    <Star className="w-3 h-3" /> Koleksi Saya
                                </span>
                            </div>

                            {/* Judul */}
                            <h1 className="text-3xl sm:text-4xl font-black text-white tracking-tight mb-2 leading-tight">
                                Dokumen Favorit
                            </h1>

                            {/* Gold accent line */}
                            <span
                                className="block h-[3px] rounded-full mb-4"
                                style={{
                                    width: '64px',
                                    background: 'linear-gradient(90deg,#D4AF37,#F0D060,#D4AF37)',
                                    animation: 'goldLine 0.8s ease-out 0.3s both',
                                }}
                            />

                            <p className="text-emerald-100/65 text-sm max-w-md leading-relaxed">
                                Kumpulan dokumen yang Anda tandai — akses cepat ke informasi paling sering dibutuhkan.
                            </p>

                            {/* Stat chips */}
                            {!loading && docs.length > 0 && (
                                <div className="mt-4 flex flex-wrap items-center gap-2">
                                    <div className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-white/10 border border-white/10 rounded-full text-white/70 text-xs font-semibold">
                                        <Sparkles className="w-3.5 h-3.5 text-[#D4AF37] bm-gold-pulse" />
                                        {docs.length} dokumen tersimpan
                                    </div>
                                </div>
                            )}
                        </div>

                        {/* Counter besar — desktop */}
                        {!loading && docs.length > 0 && (
                            <div className="hidden sm:flex flex-col items-end gap-1 flex-shrink-0">
                                <div className="relative">
                                    {/* Ring di belakang angka */}
                                    <div className="absolute inset-0 rounded-full bg-[#D4AF37]/10 blur-xl" />
                                    <div className="relative text-5xl font-black text-[#D4AF37] leading-none drop-shadow-lg">
                                        {docs.length}
                                    </div>
                                </div>
                                <div className="text-emerald-100/55 text-[10px] font-bold uppercase tracking-widest mt-1">
                                    Dokumen
                                </div>
                            </div>
                        )}
                    </div>
                </div>

                {/* Wave bottom */}
                <div className="absolute bottom-0 left-0 right-0 pointer-events-none overflow-hidden" style={{ lineHeight: 0 }}>
                    <svg viewBox="0 0 1440 64" xmlns="http://www.w3.org/2000/svg" preserveAspectRatio="none"
                        className="block w-full" style={{ height: '64px' }}>
                        <path d="M0,32 C360,64 720,0 1080,32 C1260,48 1380,24 1440,32 L1440,64 L0,64 Z"
                            style={{ fill: isDark ? '#0d1a12' : '#F4F7F5' }} />
                    </svg>
                </div>
            </header>

            {/* ══ MAIN ════════════════════════════════════════════════════ */}
            <main className="max-w-5xl mx-auto px-4 sm:px-6 mt-6 md:mt-8">

                {/* ── Glass Action Bar ── */}
                {!loading && docs.length > 0 && (
                    <div className="sticky top-3 z-20 mb-7">
                        <div className="bg-white/90 dark:bg-[#162918]/90 backdrop-blur-md rounded-2xl border border-slate-200/70 dark:border-slate-600/60 shadow-xl shadow-slate-300/20 dark:shadow-slate-900/40 px-4 py-3 flex items-center justify-between gap-3">
                            <div className="flex items-center gap-2">
                                <TrendingUp className="w-4 h-4 text-[#D4AF37]" />
                                <p className="text-slate-600 dark:text-slate-300 text-sm font-medium">
                                    <span className="font-black text-slate-800 dark:text-slate-100">{docs.length}</span> dokumen tersimpan
                                </p>
                            </div>
                            <button onClick={handleClearAll}
                                className="flex items-center gap-1.5 text-xs font-bold text-rose-500 hover:text-rose-600 dark:text-rose-400 bg-rose-50 dark:bg-rose-900/20 border border-rose-100 dark:border-rose-800/30 px-3 py-1.5 rounded-xl hover:bg-rose-100 dark:hover:bg-rose-900/30 transition-all">
                                <Trash2 className="w-3.5 h-3.5" /> Hapus Semua
                            </button>
                        </div>
                    </div>
                )}

                {/* ── Disclaimer ── */}
                <div className="mb-7 flex items-start gap-3.5 px-4 py-4 bg-amber-50 dark:bg-amber-900/10 border border-amber-200/80 dark:border-amber-700/25 rounded-2xl shadow-sm">
                    <div className="flex-shrink-0 w-9 h-9 bg-amber-100 dark:bg-amber-900/30 border border-amber-200 dark:border-amber-700/30 rounded-xl flex items-center justify-center mt-0.5">
                        <Info className="w-4.5 h-4.5 text-amber-600 dark:text-amber-400" />
                    </div>
                    <div className="min-w-0 flex-1">
                        <p className="text-sm font-black text-amber-800 dark:text-amber-300 mb-1 flex items-center gap-1.5">
                            <AlertTriangle className="w-3.5 h-3.5 flex-shrink-0" />
                            Tersimpan di Perangkat Ini
                        </p>
                        <p className="text-xs text-amber-700/75 dark:text-amber-400/65 leading-relaxed">
                            Daftar favorit disimpan di <strong>browser perangkat ini saja</strong> — tidak akan muncul jika Anda membuka dari HP atau browser lain.
                            Untuk akses permanen, catat ID dokumen atau gunakan tombol <strong>Cetak/PDF</strong> di halaman artikel.
                        </p>
                    </div>
                </div>

                {/* ── Loading Skeleton ── */}
                {loading && (
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
                        {Array.from({ length: 3 }).map((_, i) => (
                            <div key={i} className="bg-white dark:bg-[#162918] rounded-3xl border border-slate-100 dark:border-slate-700 animate-pulse overflow-hidden">
                                <div className="h-1 w-full bg-slate-200 dark:bg-slate-700 rounded-t-3xl" />
                                <div className="p-6">
                                    <div className="h-4 bg-slate-100 dark:bg-slate-700 rounded-full w-1/3 mb-5" />
                                    <div className="h-5 bg-slate-100 dark:bg-slate-700 rounded-lg w-full mb-2" />
                                    <div className="h-5 bg-slate-100 dark:bg-slate-700 rounded-lg w-3/4 mb-5" />
                                    <div className="h-3 bg-slate-100 dark:bg-slate-700 rounded mb-1.5" />
                                    <div className="h-3 bg-slate-100 dark:bg-slate-700 rounded w-5/6" />
                                </div>
                            </div>
                        ))}
                    </div>
                )}

                {/* ── Empty State ── */}
                {!loading && docs.length === 0 && (
                    <div className="text-center py-16 md:py-20 max-w-lg mx-auto">
                        {/* Animated rings */}
                        <div className="relative inline-flex items-center justify-center mb-8">
                            <span className="absolute w-40 h-40 rounded-full border border-[#D4AF37]/15 animate-ping" style={{ animationDuration: '3s' }} />
                            <span className="absolute w-28 h-28 rounded-full border border-[#D4AF37]/25" />
                            <div className="relative w-24 h-24 rounded-3xl bg-gradient-to-br from-[#D4AF37]/10 to-amber-100/50 dark:from-[#D4AF37]/10 dark:to-amber-900/10 flex items-center justify-center shadow-lg border border-[#D4AF37]/15">
                                <Bookmark className="w-12 h-12 text-[#D4AF37]/70" />
                            </div>
                        </div>
                        <h3 className="text-2xl font-black text-slate-800 dark:text-slate-100 mb-2">Belum Ada Favorit</h3>
                        <span className="block w-12 h-0.5 bg-[#D4AF37]/50 rounded mx-auto mb-4" />
                        <p className="text-slate-500 dark:text-slate-400 text-sm leading-relaxed mb-8 px-4">
                            Tandai dokumen yang sering Anda butuhkan dengan menekan tombol{' '}
                            <strong className="text-slate-700 dark:text-slate-200">Simpan</strong> di halaman artikel.
                        </p>
                        <button onClick={() => navigate('/')}
                            className="px-8 py-3 bg-gradient-to-br from-[#0D5C35] to-[#0A492A] hover:from-[#0A492A] hover:to-[#062B18] text-white rounded-xl font-bold shadow-lg shadow-emerald-900/20 hover:-translate-y-0.5 transition-all text-sm">
                            Jelajahi Dokumen
                        </button>
                    </div>
                )}

                {/* ── Grid Dokumen ── */}
                {!loading && docs.length > 0 && (
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
                        {docs.map((item, i) => (
                            <div
                                key={item.id}
                                className="bm-card bm-card-inner group bg-white dark:bg-[#162918] rounded-3xl border border-slate-100 dark:border-slate-700/80 shadow-sm hover:shadow-2xl hover:shadow-slate-200/60 dark:hover:shadow-slate-900/60 hover:-translate-y-2 hover:border-[#D4AF37]/20 dark:hover:border-[#D4AF37]/15 transition-all duration-350 flex flex-col"
                                style={{ animationDelay: `${i * 70}ms` }}>

                                {/* Accent bar atas per kategori */}
                                <div className={`bm-accent-bar h-1 w-full rounded-t-3xl bg-gradient-to-r ${getCategoryAccent(item.category)} opacity-0 group-hover:opacity-100 transition-opacity duration-300`} />

                                <div className="p-6 flex flex-col h-full relative">
                                    {/* Ambient dekorasi */}
                                    <div className="absolute top-0 right-0 w-24 h-24 rounded-bl-full -mr-10 -mt-8 bg-[#D4AF37]/4 group-hover:bg-[#D4AF37]/8 transition-colors pointer-events-none" />

                                    {/* Remove button */}
                                    <button
                                        onClick={(e) => { e.stopPropagation(); handleRemove(item.id); }}
                                        className="bm-remove-btn absolute top-4 right-4 p-1.5 text-slate-300 hover:text-rose-500 dark:text-slate-600 dark:hover:text-rose-400 bg-white dark:bg-slate-800 rounded-full opacity-0 group-hover:opacity-100 transition-all hover:shadow-md hover:scale-110 z-10"
                                        title="Hapus dari favorit">
                                        <BookmarkX className="w-4 h-4" />
                                    </button>

                                    {/* Row: badge + nomor */}
                                    <div className="flex items-center justify-between mb-4">
                                        <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider border w-fit ${getCategoryStyle(item.category)}`}>
                                            <span className="w-1.5 h-1.5 rounded-full bg-current mr-1.5 opacity-60" />
                                            {item.category.replace(/-/g, ' ')}
                                        </span>
                                        <span className="flex items-center justify-center w-6 h-6 rounded-full bg-slate-100 dark:bg-slate-700 text-slate-400 dark:text-slate-500 text-[10px] font-black group-hover:bg-[#D4AF37]/15 group-hover:text-[#7a5c00] dark:group-hover:text-[#D4AF37] transition-all">
                                            {i + 1}
                                        </span>
                                    </div>

                                    {/* Judul */}
                                    <h3 className="font-black text-slate-800 dark:text-slate-100 group-hover:text-[#0D5C35] dark:group-hover:text-emerald-400 transition-colors text-base leading-snug mb-2.5 line-clamp-2 flex-none">
                                        {item.title}
                                    </h3>

                                    {/* Deskripsi */}
                                    <p className="text-slate-500 dark:text-slate-400 text-sm leading-relaxed line-clamp-3 flex-grow mb-5">
                                        {item.description}
                                    </p>

                                    {/* Footer kartu */}
                                    <div className="mt-auto pt-4 border-t border-slate-100 dark:border-slate-700/80 flex items-center justify-between gap-2">
                                        <div className="flex items-center gap-1.5">
                                            <Sparkles className="w-3 h-3 text-[#D4AF37]/60 bm-gold-pulse" />
                                            <span className="text-[10px] text-slate-400 dark:text-slate-500 font-medium">
                                                {item.updatedAt
                                                    ? new Date(item.updatedAt.seconds * 1000).toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric' })
                                                    : '—'}
                                            </span>
                                        </div>
                                        <button
                                            onClick={() => navigate(`/detail/${item.id}`)}
                                            className="flex items-center gap-1 text-xs font-bold text-[#0D5C35] dark:text-emerald-400 opacity-60 group-hover:opacity-100 transition-all hover:gap-1.5">
                                            Baca <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-0.5 transition-transform" />
                                        </button>
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                )}

                {/* ── CTA Jelajahi ── */}
                {!loading && docs.length > 0 && (
                    <div className="mt-12 text-center">
                        <button onClick={() => navigate('/')}
                            className="inline-flex items-center gap-2.5 px-7 py-3.5 bg-white dark:bg-[#162918] border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 rounded-2xl font-bold hover:border-[#0D5C35]/30 hover:text-[#0D5C35] dark:hover:text-emerald-400 hover:shadow-md transition-all text-sm shadow-sm">
                            <FileText className="w-4 h-4" /> Jelajahi Lebih Banyak Dokumen
                            <ArrowRight className="w-4 h-4 opacity-50 group-hover:translate-x-0.5 transition-transform" />
                        </button>
                    </div>
                )}
            </main>
        </div>
    );
};

export default BookmarksPage;