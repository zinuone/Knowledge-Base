import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { collection, query, where, getDocs } from 'firebase/firestore';
import { db } from '../firebase';
import {
    ArrowLeft, FileText, Hammer, Key, Trash2, Clock, Users,
    Timer, RefreshCw, Gift, ArrowRight, ArrowUp, Home,
    ChevronRight, ChevronLeft, Layers, Search, X, ArrowUpDown,
    Moon, Sun, Sparkles, TrendingUp,
} from 'lucide-react';
import { SkeletonCategoryGrid } from '../components/SkeletonLoader';
import { Helmet } from 'react-helmet-async';

/* ─── Animasi & CSS Premium ────────────────────────────────────── */
const PAGE_CSS = `
@keyframes catBlob1 {
  0%,100% { transform: translate(0,0) scale(1); }
  33%     { transform: translate(40px,-30px) scale(1.08); }
  66%     { transform: translate(-20px,20px) scale(0.96); }
}
@keyframes catBlob2 {
  0%,100% { transform: translate(0,0) scale(1); }
  50%     { transform: translate(-40px,30px) scale(1.1); }
}
@keyframes catGridPan {
  0%   { background-position: 0 0; }
  100% { background-position: 48px 48px; }
}
@keyframes cardIn {
  from { opacity: 0; transform: translateY(28px) scale(0.97); }
  to   { opacity: 1; transform: translateY(0) scale(1); }
}
@keyframes floatIcon {
  0%, 100% { transform: translateY(0px) rotate(-1deg); }
  50%       { transform: translateY(-12px) rotate(2deg); }
}
@keyframes pulseRing {
  0%   { transform: scale(1);   opacity: 0.55; }
  100% { transform: scale(1.7); opacity: 0; }
}
@keyframes shimmerSweep {
  from { transform: translateX(-150%) skewX(-12deg); }
  to   { transform: translateX(250%)  skewX(-12deg); }
}
@keyframes accentBarIn {
  from { transform: scaleX(0); transform-origin: left; }
  to   { transform: scaleX(1); transform-origin: left; }
}
@keyframes goldLine {
  0%   { width: 0; opacity: 0; }
  100% { width: 80px; opacity: 1; }
}
@keyframes countUp {
  from { transform: translateY(6px); opacity: 0; }
  to   { transform: translateY(0);   opacity: 1; }
}

/* Blob background */
.cat-blob-1 { animation: catBlob1 18s ease-in-out infinite; }
.cat-blob-2 { animation: catBlob2 22s ease-in-out infinite; }

/* Dot grid */
.cat-hero-grid {
  background-image: radial-gradient(circle, rgba(255,255,255,0.10) 1px, transparent 1px);
  background-size: 48px 48px;
  animation: catGridPan 14s linear infinite;
}

/* Card entrance */
.cat-card { animation: cardIn 0.5s cubic-bezier(0.22,0.61,0.36,1) forwards; opacity: 0; }

/* Floating icon */
.cat-float-icon { animation: floatIcon 5s ease-in-out infinite; }

/* Pulse rings behind icon */
.cat-pulse-ring {
  position: absolute;
  inset: -8px;
  border-radius: 50%;
  border: 2px solid rgba(255,255,255,0.25);
  animation: pulseRing 2.4s ease-out infinite;
}
.cat-pulse-ring-2 {
  position: absolute;
  inset: -8px;
  border-radius: 50%;
  border: 2px solid rgba(255,255,255,0.15);
  animation: pulseRing 2.4s ease-out 1.2s infinite;
}

/* Card shimmer on hover */
.cat-card-inner {
  position: relative;
  overflow: hidden;
}
.cat-card-inner::after {
  content: '';
  position: absolute;
  top: 0; left: -80%;
  width: 60%;
  height: 100%;
  background: linear-gradient(90deg, transparent, rgba(255,255,255,0.07), transparent);
  transform: skewX(-12deg);
  pointer-events: none;
  opacity: 0;
  transition: opacity 0.1s;
}
.cat-card-inner:hover::after {
  opacity: 1;
  animation: shimmerSweep 0.65s ease-out;
}

/* Accent bar on card top */
.cat-accent-bar {
  animation: accentBarIn 0.4s cubic-bezier(0.22,0.61,0.36,1) 0.3s both;
}

/* Gold decorative line */
.cat-gold-line {
  display: block;
  height: 3px;
  background: linear-gradient(90deg, #D4AF37, #F0D060, #D4AF37);
  border-radius: 99px;
  animation: goldLine 0.8s ease-out 0.4s both;
}
`;

interface ContentData {
    id: string;
    title: string;
    description: string;
    updatedAt?: any;
}

type SortKey = 'default' | 'az' | 'za' | 'newest' | 'oldest';

const CategoryPage: React.FC = () => {
    const { categoryId } = useParams<{ categoryId: string }>();
    const navigate = useNavigate();
    const [documents, setDocuments] = useState<ContentData[]>([]);
    const [loading, setLoading] = useState(true);
    const [isScrolled, setIsScrolled] = useState(false);
    const [searchLocal, setSearchLocal] = useState('');
    const [sortBy, setSortBy] = useState<SortKey>('default');
    const [currentPage, setCurrentPage] = useState(1);
    const DOCS_PER_PAGE = 9;

    /* ── Dark Mode ── */
    const [isDark, setIsDark] = useState(() => {
        try { return localStorage.getItem('pkn-theme') === 'dark'; } catch { return false; }
    });
    useEffect(() => {
        document.documentElement.classList.toggle('dark', isDark);
        try { localStorage.setItem('pkn-theme', isDark ? 'dark' : 'light'); } catch { }
    }, [isDark]);

    const categoryTitle = categoryId?.replace(/-/g, ' ').toUpperCase() ?? '';

    const getCategoryMeta = (catId?: string) => {
        const map: Record<string, {
            icon: React.ReactElement; color: string; bg: string;
            gradient: string; hoverBg: string; hoverText: string;
            darkBg: string; darkColor: string; accentGradient: string;
        }> = {
            'psp':                   { icon: <FileText className="w-8 h-8" />,  color: 'text-emerald-600', bg: 'bg-emerald-100', darkBg: 'dark:bg-emerald-900/30', darkColor: 'dark:text-emerald-400', gradient: 'from-emerald-500 to-teal-600',     hoverBg: 'group-hover:bg-emerald-600', hoverText: 'group-hover:text-white', accentGradient: 'from-emerald-400 to-teal-500' },
            'penjualan':             { icon: <Hammer className="w-8 h-8" />,    color: 'text-amber-600',   bg: 'bg-amber-100',   darkBg: 'dark:bg-amber-900/30',   darkColor: 'dark:text-amber-400',   gradient: 'from-amber-500 to-orange-600',    hoverBg: 'group-hover:bg-amber-600',   hoverText: 'group-hover:text-white', accentGradient: 'from-amber-400 to-orange-500' },
            'sewa':                  { icon: <Key className="w-8 h-8" />,       color: 'text-blue-600',    bg: 'bg-blue-100',    darkBg: 'dark:bg-blue-900/30',    darkColor: 'dark:text-blue-400',    gradient: 'from-blue-500 to-indigo-600',     hoverBg: 'group-hover:bg-blue-600',    hoverText: 'group-hover:text-white', accentGradient: 'from-blue-400 to-indigo-500' },
            'penghapusan':           { icon: <Trash2 className="w-8 h-8" />,    color: 'text-rose-600',    bg: 'bg-rose-100',    darkBg: 'dark:bg-rose-900/30',    darkColor: 'dark:text-rose-400',    gradient: 'from-rose-500 to-pink-600',       hoverBg: 'group-hover:bg-rose-600',    hoverText: 'group-hover:text-white', accentGradient: 'from-rose-400 to-pink-500' },
            'pinjam-pakai':          { icon: <Clock className="w-8 h-8" />,     color: 'text-indigo-600',  bg: 'bg-indigo-100',  darkBg: 'dark:bg-indigo-900/30',  darkColor: 'dark:text-indigo-400',  gradient: 'from-indigo-500 to-purple-600',   hoverBg: 'group-hover:bg-indigo-600',  hoverText: 'group-hover:text-white', accentGradient: 'from-indigo-400 to-purple-500' },
            'penggunaan-sementara':  { icon: <Timer className="w-8 h-8" />,     color: 'text-purple-600',  bg: 'bg-purple-100',  darkBg: 'dark:bg-purple-900/30',  darkColor: 'dark:text-purple-400',  gradient: 'from-purple-500 to-violet-600',   hoverBg: 'group-hover:bg-purple-600',  hoverText: 'group-hover:text-white', accentGradient: 'from-purple-400 to-violet-500' },
            'alih-status':           { icon: <RefreshCw className="w-8 h-8" />, color: 'text-teal-600',    bg: 'bg-teal-100',    darkBg: 'dark:bg-teal-900/30',    darkColor: 'dark:text-teal-400',    gradient: 'from-teal-500 to-cyan-600',       hoverBg: 'group-hover:bg-teal-600',    hoverText: 'group-hover:text-white', accentGradient: 'from-teal-400 to-cyan-500' },
            'hibah':                 { icon: <Gift className="w-8 h-8" />,      color: 'text-orange-600',  bg: 'bg-orange-100',  darkBg: 'dark:bg-orange-900/30',  darkColor: 'dark:text-orange-400',  gradient: 'from-orange-500 to-red-500',      hoverBg: 'group-hover:bg-orange-600',  hoverText: 'group-hover:text-white', accentGradient: 'from-orange-400 to-red-400' },
            'user-siman':            { icon: <Users className="w-8 h-8" />,     color: 'text-cyan-600',    bg: 'bg-cyan-100',    darkBg: 'dark:bg-cyan-900/30',    darkColor: 'dark:text-cyan-400',    gradient: 'from-cyan-500 to-blue-600',       hoverBg: 'group-hover:bg-cyan-600',    hoverText: 'group-hover:text-white', accentGradient: 'from-cyan-400 to-blue-500' },
        };
        return map[catId ?? ''] ?? {
            icon: <FileText className="w-8 h-8" />, color: 'text-[#0D5C35]', bg: 'bg-[#EAF2EE]',
            darkBg: 'dark:bg-[#0D5C35]/20', darkColor: 'dark:text-emerald-400',
            gradient: 'from-[#0D5C35] to-[#0A492A]',
            hoverBg: 'group-hover:bg-[#0D5C35]', hoverText: 'group-hover:text-white',
            accentGradient: 'from-emerald-500 to-teal-600',
        };
    };

    const meta = getCategoryMeta(categoryId);

    /* ── Label & deskripsi per kategori untuk Helmet SEO ── */
    const categoryLabelMap: Record<string, string> = {
        'psp':                  'PSP (Penetapan Status Penggunaan)',
        'penjualan':            'Penjualan BMN',
        'sewa':                 'Sewa BMN',
        'penghapusan':          'Penghapusan BMN',
        'pinjam-pakai':         'Pinjam Pakai BMN',
        'penggunaan-sementara': 'Penggunaan Sementara BMN',
        'alih-status':          'Alih Status BMN',
        'hibah':                'Hibah BMN',
        'user-siman':           'Panduan Pengguna SIMAN',
    };
    const categoryDescMap: Record<string, string> = {
        'psp':                  'SOP dan panduan Penetapan Status Penggunaan (PSP) Barang Milik Negara di KPKNL Kendari.',
        'penjualan':            'SOP dan panduan proses penjualan Barang Milik Negara (BMN) di KPKNL Kendari.',
        'sewa':                 'SOP dan panduan sewa Barang Milik Negara (BMN) di KPKNL Kendari.',
        'penghapusan':          'SOP dan panduan penghapusan Barang Milik Negara (BMN) dari daftar inventaris.',
        'pinjam-pakai':         'SOP dan panduan pinjam pakai Barang Milik Negara (BMN) di KPKNL Kendari.',
        'penggunaan-sementara': 'SOP dan panduan penggunaan sementara Barang Milik Negara (BMN).',
        'alih-status':          'SOP dan panduan alih status Barang Milik Negara (BMN) di KPKNL Kendari.',
        'hibah':                'SOP dan panduan hibah Barang Milik Negara (BMN) di KPKNL Kendari.',
        'user-siman':           'Panduan penggunaan aplikasi SIMAN untuk pengelola Barang Milik Negara.',
    };
    const seoTitle = categoryLabelMap[categoryId ?? ''] ?? categoryTitle;
    const seoDesc  = categoryDescMap[categoryId ?? '']
        ?? `Dokumen SOP dan panduan ${categoryTitle} — Knowledge Base KPKNL Kendari.`;

    useEffect(() => {
        const fetchDocs = async () => {
            if (!categoryId) return;
            try {
                const q = query(collection(db, 'knowledge-base'), where('category', '==', categoryId));
                const snap = await getDocs(q);
                setDocuments(snap.docs.map(d => ({ id: d.id, ...d.data() })) as ContentData[]);
            } catch (e) { console.error(e); }
            finally { setLoading(false); }
        };
        fetchDocs();
        const onScroll = () => setIsScrolled(window.scrollY > 300);
        window.addEventListener('scroll', onScroll);
        return () => window.removeEventListener('scroll', onScroll);
    }, [categoryId]);

    useEffect(() => { setCurrentPage(1); }, [searchLocal, sortBy, categoryId]);

    const filteredDocs = searchLocal.trim()
        ? documents.filter(d =>
            d.title.toLowerCase().includes(searchLocal.toLowerCase()) ||
            d.description.toLowerCase().includes(searchLocal.toLowerCase()))
        : documents;

    const sortedDocs = (() => {
        const arr = [...filteredDocs];
        switch (sortBy) {
            case 'az':     return arr.sort((a, b) => a.title.localeCompare(b.title, 'id'));
            case 'za':     return arr.sort((a, b) => b.title.localeCompare(a.title, 'id'));
            case 'newest': return arr.sort((a, b) => (b.updatedAt?.seconds || 0) - (a.updatedAt?.seconds || 0));
            case 'oldest': return arr.sort((a, b) => (a.updatedAt?.seconds || 0) - (b.updatedAt?.seconds || 0));
            default: return arr;
        }
    })();

    const totalPages    = Math.ceil(sortedDocs.length / DOCS_PER_PAGE);
    const paginatedDocs = sortedDocs.slice((currentPage - 1) * DOCS_PER_PAGE, currentPage * DOCS_PER_PAGE);

    /* Helper: format tanggal dari Firestore timestamp */
    const formatDate = (ts?: any) => {
        if (!ts?.seconds) return null;
        return new Date(ts.seconds * 1000).toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric' });
    };

    return (
        <div className="min-h-screen bg-[#F4F7F5] dark:bg-[#0d1a12] font-sans pb-24 relative transition-colors duration-300">
            <Helmet>
                <title>{seoTitle} — Knowledge Base KPKNL Kendari</title>
                <meta name="description" content={seoDesc} />
                <meta property="og:title" content={`${seoTitle} — Knowledge Base KPKNL Kendari`} />
                <meta property="og:description" content={seoDesc} />
                <meta property="og:type" content="website" />
            </Helmet>

            <style dangerouslySetInnerHTML={{ __html: PAGE_CSS }} />

            {/* ══ HERO HEADER ══════════════════════════════════════════════ */}
            <header className="relative bg-[#0D5C35] overflow-hidden">
                {/* Latar gradient + grid + blob */}
                <div className="absolute inset-0 bg-gradient-to-br from-[#0D5C35] via-[#0A492A] to-[#062B18]" />
                <div className="absolute inset-0 cat-hero-grid opacity-20" />
                <div className="absolute inset-0 pointer-events-none overflow-hidden">
                    <div className="cat-blob-1 absolute -top-24 -left-20 w-[400px] h-[400px] rounded-full bg-emerald-400/20 blur-3xl" />
                    <div className="cat-blob-2 absolute -bottom-24 -right-20 w-[460px] h-[460px] rounded-full bg-[#D4AF37]/10 blur-3xl" />
                    {/* Ambient accent orbs */}
                    <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[300px] rounded-full bg-white/[0.02] blur-3xl pointer-events-none" />
                </div>

                <div className="relative z-10 max-w-6xl mx-auto px-4 sm:px-6 pt-8 pb-20 md:pt-10 md:pb-24">
                    {/* Breadcrumb */}
                    <nav className="flex items-center gap-1.5 text-emerald-100/55 text-xs font-medium mb-6">
                        <button onClick={() => navigate('/')} className="flex items-center gap-1 hover:text-white transition-colors">
                            <Home className="w-3.5 h-3.5" /> Beranda
                        </button>
                        <ChevronRight className="w-3 h-3" />
                        <span className="text-white/80 font-bold truncate max-w-[200px] sm:max-w-none">{categoryTitle}</span>
                        <button
                            onClick={() => setIsDark(p => !p)}
                            className="ml-auto p-2 rounded-full bg-white/10 hover:bg-white/20 border border-white/15 transition-all flex-shrink-0"
                            title={isDark ? 'Mode Terang' : 'Mode Gelap'}
                            aria-label={isDark ? 'Aktifkan mode terang' : 'Aktifkan mode gelap'}>
                            {isDark ? <Sun className="w-3.5 h-3.5 text-[#D4AF37]" /> : <Moon className="w-3.5 h-3.5 text-white/80" />}
                        </button>
                    </nav>

                    <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-8 md:gap-12">
                        {/* Kiri: teks */}
                        <div className="flex-1 min-w-0">
                            {/* Tombol kembali */}
                            <button onClick={() => navigate(-1)}
                                className="mb-6 inline-flex items-center gap-2 text-emerald-100/80 hover:text-white bg-white/10 hover:bg-white/20 px-4 py-2 rounded-full transition-all text-sm font-bold border border-white/10 hover:border-white/30 group">
                                <ArrowLeft className="w-4 h-4 group-hover:-translate-x-0.5 transition-transform" /> Kembali
                            </button>

                            {/* Badge kategori */}
                            <div className="flex items-center gap-2 mb-3">
                                <span className="inline-flex items-center gap-1.5 px-3 py-1 bg-[#D4AF37]/20 border border-[#D4AF37]/40 rounded-full text-[#D4AF37] text-xs font-bold uppercase tracking-widest">
                                    <Sparkles className="w-3 h-3" /> Kategori
                                </span>
                            </div>

                            {/* Judul */}
                            <h1 className="text-3xl sm:text-4xl md:text-5xl font-black text-white tracking-tight mb-3 leading-tight break-words">
                                {categoryTitle}
                            </h1>

                            {/* Gold accent line */}
                            <span className="cat-gold-line mb-4 inline-block" style={{ width: '80px' }} />

                            <p className="text-emerald-100/65 text-sm sm:text-base max-w-md leading-relaxed mb-5">
                                Daftar informasi, SOP, dan prosedur resmi terkait layanan{' '}
                                <strong className="text-emerald-100/90">{categoryTitle}</strong> yang dikelola KPKNL Kendari.
                            </p>

                            {/* Stat chips */}
                            {!loading && (
                                <div className="flex flex-wrap items-center gap-2">
                                    <div className="inline-flex items-center gap-2 px-3 py-1.5 bg-white/10 hover:bg-white/15 rounded-full border border-white/10 text-white/75 text-xs font-semibold transition-colors">
                                        <Layers className="w-3.5 h-3.5 text-[#D4AF37]" />
                                        {documents.length} dokumen tersedia
                                    </div>
                                    {documents.length > 0 && (
                                        <div className="inline-flex items-center gap-2 px-3 py-1.5 bg-white/10 hover:bg-white/15 rounded-full border border-white/10 text-white/75 text-xs font-semibold transition-colors">
                                            <TrendingUp className="w-3.5 h-3.5 text-emerald-300" />
                                            Halaman {currentPage} / {Math.max(1, totalPages)}
                                        </div>
                                    )}
                                </div>
                            )}
                        </div>

                        {/* Kanan: icon mengambang */}
                        <div className="hidden md:flex flex-shrink-0 items-center justify-center">
                            <div className="relative">
                                {/* Pulse rings */}
                                <span className="cat-pulse-ring" />
                                <span className="cat-pulse-ring-2" />
                                {/* Icon box */}
                                <div className={`cat-float-icon relative bg-gradient-to-br ${meta.gradient} p-8 lg:p-10 rounded-3xl shadow-2xl shadow-black/30 border border-white/15 backdrop-blur-sm`}>
                                    {/* Inner glow */}
                                    <div className="absolute inset-0 rounded-3xl bg-white/5" />
                                    <div className="relative text-white opacity-95">
                                        {React.cloneElement(meta.icon as React.ReactElement, { className: 'w-16 h-16 lg:w-18 lg:h-18 drop-shadow-lg' })}
                                    </div>
                                    {/* Gold sparkle corner */}
                                    <span className="absolute -top-2 -right-2 w-5 h-5 bg-[#D4AF37] rounded-full flex items-center justify-center shadow-lg">
                                        <Sparkles className="w-2.5 h-2.5 text-slate-900" />
                                    </span>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Wave bottom — menyatu dengan bg konten */}
                <div className="absolute bottom-0 left-0 right-0 pointer-events-none overflow-hidden" style={{ lineHeight: 0 }}>
                    <svg viewBox="0 0 1440 64" xmlns="http://www.w3.org/2000/svg" preserveAspectRatio="none"
                        className="block w-full" style={{ height: '64px' }}>
                        <path d="M0,32 C360,64 720,0 1080,32 C1260,48 1380,24 1440,32 L1440,64 L0,64 Z"
                            style={{ fill: isDark ? '#0d1a12' : '#F4F7F5' }} />
                    </svg>
                </div>
            </header>

            {/* ══ MAIN CONTENT ════════════════════════════════════════════ */}
            <main className="max-w-6xl mx-auto px-4 sm:px-6 mt-6 md:mt-8">

                {/* ── Toolbar: Search + Sort (sticky glass) ── */}
                {!loading && documents.length > 0 && (
                    <div className="sticky top-3 z-20 mb-8">
                        <div className="bg-white/90 dark:bg-[#162918]/90 backdrop-blur-md rounded-2xl border border-slate-200/70 dark:border-slate-600/60 shadow-xl shadow-slate-300/30 dark:shadow-slate-900/50 px-4 py-3 flex flex-col sm:flex-row gap-3 items-stretch sm:items-center flex-wrap">
                            {/* Search input */}
                            <div className="relative flex-1 min-w-0 max-w-sm">
                                <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
                                <input
                                    type="text"
                                    placeholder={`Cari di ${categoryTitle}...`}
                                    value={searchLocal}
                                    onChange={e => setSearchLocal(e.target.value)}
                                    className="w-full pl-10 pr-9 py-2.5 rounded-xl border border-slate-200 dark:border-slate-600/80 bg-slate-50 dark:bg-[#0f1f16] dark:text-slate-200 text-sm font-medium outline-none focus:ring-2 focus:ring-[#0D5C35]/50 dark:focus:ring-emerald-600/50 focus:border-[#0D5C35]/40 transition-all placeholder:text-slate-400"
                                />
                                {searchLocal && (
                                    <button onClick={() => setSearchLocal('')}
                                        className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 transition-colors">
                                        <X className="w-3.5 h-3.5" />
                                    </button>
                                )}
                            </div>

                            {/* Divider (desktop) */}
                            <div className="hidden sm:block w-px h-6 bg-slate-200 dark:bg-slate-600" />

                            {/* Sort buttons */}
                            <div className="flex items-center gap-1.5 flex-wrap">
                                <ArrowUpDown className="w-3.5 h-3.5 text-slate-400 flex-shrink-0" />
                                {([
                                    { key: 'default', label: 'Default' },
                                    { key: 'newest',  label: 'Terbaru' },
                                    { key: 'oldest',  label: 'Terlama' },
                                    { key: 'az',      label: 'A–Z' },
                                    { key: 'za',      label: 'Z–A' },
                                ] as { key: SortKey; label: string }[]).map(s => (
                                    <button key={s.key} onClick={() => setSortBy(s.key)}
                                        className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all
                                            ${sortBy === s.key
                                                ? 'bg-[#0D5C35] text-white shadow-md shadow-emerald-900/20'
                                                : 'bg-slate-100 dark:bg-slate-700/60 text-slate-500 dark:text-slate-400 border border-slate-200 dark:border-slate-600/60 hover:border-[#0D5C35]/40 hover:text-[#0D5C35] dark:hover:text-emerald-400 hover:bg-white dark:hover:bg-[#0f1f16]'
                                            }`}>
                                        {s.label}
                                    </button>
                                ))}
                            </div>

                            {/* Divider + count */}
                            <div className="hidden sm:block w-px h-6 bg-slate-200 dark:bg-slate-600" />
                            <p className="text-sm text-slate-500 dark:text-slate-400 self-center whitespace-nowrap ml-auto sm:ml-0">
                                {searchLocal ? (
                                    <><span className="font-black text-[#0D5C35] dark:text-emerald-400">{sortedDocs.length}</span> dari {documents.length}</>
                                ) : (
                                    <><span className="font-black text-slate-700 dark:text-slate-200">{documents.length}</span> dokumen</>
                                )}
                            </p>
                        </div>
                    </div>
                )}

                {/* ── Konten ── */}
                {loading ? (
                    <SkeletonCategoryGrid />
                ) : sortedDocs.length > 0 ? (
                    <>
                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5 md:gap-6">
                            {paginatedDocs.map((doc, i) => {
                                const dateStr = formatDate(doc.updatedAt);
                                const globalIdx = (currentPage - 1) * DOCS_PER_PAGE + i + 1;
                                return (
                                    <div key={doc.id}
                                        onClick={() => navigate(`/detail/${doc.id}`)}
                                        className="cat-card cat-card-inner bg-white dark:bg-[#162918] rounded-3xl border border-slate-100 dark:border-slate-700/80 shadow-sm hover:shadow-2xl hover:shadow-slate-200/60 dark:hover:shadow-slate-900/60 hover:-translate-y-2 cursor-pointer transition-all duration-400 group flex flex-col h-full"
                                        style={{ animationDelay: `${i * 65}ms` }}>

                                        {/* Accent bar atas (kategori-specific gradient) */}
                                        <div className={`cat-accent-bar h-1 w-full rounded-t-3xl bg-gradient-to-r ${meta.accentGradient} opacity-0 group-hover:opacity-100 transition-opacity duration-300`} />

                                        <div className="p-6 md:p-7 flex flex-col h-full">
                                            {/* Row: icon + nomor urut */}
                                            <div className="flex items-start justify-between mb-5">
                                                <div className={`p-4 rounded-2xl w-fit transition-all duration-300
                                                    ${meta.bg} ${meta.color} ${meta.darkBg} ${meta.darkColor}
                                                    ${meta.hoverBg} ${meta.hoverText}
                                                    group-hover:shadow-lg group-hover:scale-105`}>
                                                    {meta.icon}
                                                </div>
                                                {/* Nomor dokumen */}
                                                <span className="flex items-center justify-center w-7 h-7 rounded-full bg-slate-100 dark:bg-slate-700 text-slate-400 dark:text-slate-500 text-[11px] font-black group-hover:bg-[#0D5C35]/10 group-hover:text-[#0D5C35] dark:group-hover:text-emerald-400 transition-all">
                                                    {globalIdx}
                                                </span>
                                            </div>

                                            <h3 className="font-black text-lg md:text-xl text-slate-800 dark:text-slate-100 mb-3 group-hover:text-[#0D5C35] dark:group-hover:text-emerald-400 transition-colors leading-tight line-clamp-2">
                                                {doc.title}
                                            </h3>

                                            <p className="text-slate-500 dark:text-slate-400 text-sm leading-relaxed line-clamp-3 flex-grow mb-5">
                                                {doc.description}
                                            </p>

                                            {/* Footer kartu */}
                                            <div className="mt-auto pt-4 border-t border-slate-100 dark:border-slate-700/80 flex items-center justify-between gap-2">
                                                <div className={`flex items-center gap-1.5 font-bold text-sm opacity-65 group-hover:opacity-100 transition-all duration-300 ${meta.color} ${meta.darkColor}`}>
                                                    <span>Baca Selengkapnya</span>
                                                    <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-1.5 transition-transform duration-300" />
                                                </div>
                                                {dateStr && (
                                                    <span className="text-[10px] text-slate-400 dark:text-slate-500 font-medium flex-shrink-0">
                                                        {dateStr}
                                                    </span>
                                                )}
                                            </div>
                                        </div>
                                    </div>
                                );
                            })}
                        </div>

                        {/* ── Pagination ── */}
                        {totalPages > 1 && (
                            <div className="mt-12 flex flex-col items-center gap-3">
                                <div className="flex items-center gap-2 flex-wrap justify-center bg-white dark:bg-[#162918] rounded-2xl border border-slate-200 dark:border-slate-700 shadow-sm px-4 py-3">
                                    <button
                                        onClick={() => { setCurrentPage(p => Math.max(1, p - 1)); window.scrollTo({ top: 0, behavior: 'smooth' }); }}
                                        disabled={currentPage === 1}
                                        className="flex items-center gap-1.5 px-4 py-2.5 rounded-xl text-sm font-bold bg-slate-50 dark:bg-slate-700/50 border border-slate-200 dark:border-slate-600 text-slate-600 dark:text-slate-300 hover:border-[#0D5C35]/40 hover:text-[#0D5C35] dark:hover:text-emerald-400 disabled:opacity-35 disabled:cursor-not-allowed transition-all">
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
                                        className="flex items-center gap-1.5 px-4 py-2.5 rounded-xl text-sm font-bold bg-slate-50 dark:bg-slate-700/50 border border-slate-200 dark:border-slate-600 text-slate-600 dark:text-slate-300 hover:border-[#0D5C35]/40 hover:text-[#0D5C35] dark:hover:text-emerald-400 disabled:opacity-35 disabled:cursor-not-allowed transition-all">
                                        Berikutnya <ChevronRight className="w-4 h-4" />
                                    </button>
                                </div>
                                <p className="text-xs text-slate-400 dark:text-slate-500 font-medium">
                                    Halaman <span className="font-black text-slate-700 dark:text-slate-200">{currentPage}</span> dari <span className="font-black text-slate-700 dark:text-slate-200">{totalPages}</span>
                                    <span className="mx-1.5 opacity-40">·</span>
                                    {sortedDocs.length} dokumen total
                                </p>
                            </div>
                        )}
                    </>
                ) : (
                    /* ── Empty State Premium ── */
                    <div className="text-center py-16 md:py-20 max-w-lg mx-auto">
                        <div className="relative inline-flex items-center justify-center mb-8">
                            {/* Outer rings */}
                            <span className="absolute w-36 h-36 rounded-full border border-slate-200 dark:border-slate-700 animate-ping" style={{ animationDuration: '3s' }} />
                            <span className="absolute w-28 h-28 rounded-full border border-slate-200 dark:border-slate-700 opacity-60" />
                            {/* Icon container */}
                            <div className={`relative w-24 h-24 rounded-3xl flex items-center justify-center shadow-xl ${meta.bg} ${meta.darkBg}`}>
                                <div className={`${meta.color} ${meta.darkColor} opacity-60`}>
                                    {React.cloneElement(meta.icon as React.ReactElement, { className: 'w-12 h-12' })}
                                </div>
                            </div>
                        </div>

                        <h3 className="text-2xl md:text-3xl font-black text-slate-800 dark:text-slate-100 mb-3">
                            {searchLocal ? 'Tidak Ditemukan' : 'Belum Ada Informasi'}
                        </h3>

                        <span className="block w-12 h-0.5 bg-[#D4AF37]/60 rounded mx-auto mb-4" />

                        <p className="text-slate-500 dark:text-slate-400 px-4 mb-8 leading-relaxed text-sm md:text-base">
                            {searchLocal
                                ? <>Tidak ada dokumen yang cocok dengan <strong className="text-slate-700 dark:text-slate-200">"{searchLocal}"</strong>. Coba kata kunci lain.</>
                                : <>Informasi dan SOP untuk layanan <strong className="text-slate-700 dark:text-slate-200">{categoryTitle}</strong> sedang dalam tahap penyusunan.</>
                            }
                        </p>

                        <div className="flex flex-col sm:flex-row gap-3 justify-center">
                            {searchLocal && (
                                <button onClick={() => setSearchLocal('')}
                                    className="px-6 py-3 bg-white dark:bg-[#162918] border border-slate-200 dark:border-slate-600 text-slate-700 dark:text-slate-200 rounded-xl font-bold hover:bg-slate-50 dark:hover:bg-slate-700 hover:border-slate-300 transition-all text-sm shadow-sm">
                                    Reset Pencarian
                                </button>
                            )}
                            <button onClick={() => navigate('/')}
                                className="px-8 py-3 bg-gradient-to-br from-[#0D5C35] to-[#0A492A] hover:from-[#0A492A] hover:to-[#062B18] text-white rounded-xl font-bold shadow-lg shadow-emerald-900/20 hover:-translate-y-0.5 transition-all text-sm">
                                Kembali ke Beranda
                            </button>
                        </div>
                    </div>
                )}
            </main>

            {/* ── Scroll to top ── */}
            <button onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
                aria-label="Kembali ke atas"
                className={`fixed bottom-6 right-6 md:bottom-8 md:right-8 p-3.5 md:p-4 bg-[#D4AF37] text-slate-900 rounded-full shadow-2xl shadow-amber-400/30 hover:bg-[#B5952F] hover:scale-110 hover:shadow-amber-400/40 active:scale-95 transition-all duration-300 z-50 group ${isScrolled ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-10 pointer-events-none'}`}>
                <ArrowUp className="w-4 h-4 md:w-5 md:h-5 group-hover:-translate-y-1 transition-transform" />
            </button>
        </div>
    );
};

export default CategoryPage;