// File: src/pages/CategoryPage.tsx
import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { collection, query, where, getDocs } from 'firebase/firestore';
import { db } from '../firebase';
import {
    ArrowLeft, FileText, Hammer, Key, Trash2, Clock,
    Timer, RefreshCw, Gift, ArrowRight, ArrowUp, Home,
    ChevronRight, Layers, Search, X, ArrowUpDown,
} from 'lucide-react';
import { SkeletonCategoryGrid } from '../components/SkeletonLoader';

/* ─── Animasi ─────────────────────────────────────────────────── */
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
  from { opacity: 0; transform: translateY(22px); }
  to   { opacity: 1; transform: translateY(0); }
}
.cat-blob-1 { animation: catBlob1 18s ease-in-out infinite; }
.cat-blob-2 { animation: catBlob2 22s ease-in-out infinite; }
.cat-hero-grid {
  background-image: radial-gradient(circle, rgba(255,255,255,0.10) 1px, transparent 1px);
  background-size: 48px 48px;
  animation: catGridPan 14s linear infinite;
}
.cat-card { animation: cardIn 0.45s ease-out forwards; opacity: 0; }
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

    /* ── Dark Mode: baca dari localStorage ── */
    useEffect(() => {
        try {
            const isDark = localStorage.getItem('pkn-theme') === 'dark';
            document.documentElement.classList.toggle('dark', isDark);
        } catch { }
    }, []);

    const categoryTitle = categoryId?.replace(/-/g, ' ').toUpperCase() ?? '';

    const getCategoryMeta = (catId?: string) => {
        const map: Record<string, {
            icon: JSX.Element; color: string; bg: string;
            gradient: string; hoverBg: string; hoverText: string;
            darkBg: string; darkColor: string;
        }> = {
            'psp': { icon: <FileText className="w-8 h-8" />, color: 'text-emerald-600', bg: 'bg-emerald-100', darkBg: 'dark:bg-emerald-900/30', darkColor: 'dark:text-emerald-400', gradient: 'from-emerald-500 to-teal-600', hoverBg: 'group-hover:bg-emerald-600', hoverText: 'group-hover:text-white' },
            'penjualan': { icon: <Hammer className="w-8 h-8" />, color: 'text-amber-600', bg: 'bg-amber-100', darkBg: 'dark:bg-amber-900/30', darkColor: 'dark:text-amber-400', gradient: 'from-amber-500 to-orange-600', hoverBg: 'group-hover:bg-amber-600', hoverText: 'group-hover:text-white' },
            'sewa': { icon: <Key className="w-8 h-8" />, color: 'text-blue-600', bg: 'bg-blue-100', darkBg: 'dark:bg-blue-900/30', darkColor: 'dark:text-blue-400', gradient: 'from-blue-500 to-indigo-600', hoverBg: 'group-hover:bg-blue-600', hoverText: 'group-hover:text-white' },
            'penghapusan': { icon: <Trash2 className="w-8 h-8" />, color: 'text-rose-600', bg: 'bg-rose-100', darkBg: 'dark:bg-rose-900/30', darkColor: 'dark:text-rose-400', gradient: 'from-rose-500 to-pink-600', hoverBg: 'group-hover:bg-rose-600', hoverText: 'group-hover:text-white' },
            'pinjam-pakai': { icon: <Clock className="w-8 h-8" />, color: 'text-indigo-600', bg: 'bg-indigo-100', darkBg: 'dark:bg-indigo-900/30', darkColor: 'dark:text-indigo-400', gradient: 'from-indigo-500 to-purple-600', hoverBg: 'group-hover:bg-indigo-600', hoverText: 'group-hover:text-white' },
            'penggunaan-sementara': { icon: <Timer className="w-8 h-8" />, color: 'text-purple-600', bg: 'bg-purple-100', darkBg: 'dark:bg-purple-900/30', darkColor: 'dark:text-purple-400', gradient: 'from-purple-500 to-violet-600', hoverBg: 'group-hover:bg-purple-600', hoverText: 'group-hover:text-white' },
            'alih-status': { icon: <RefreshCw className="w-8 h-8" />, color: 'text-teal-600', bg: 'bg-teal-100', darkBg: 'dark:bg-teal-900/30', darkColor: 'dark:text-teal-400', gradient: 'from-teal-500 to-cyan-600', hoverBg: 'group-hover:bg-teal-600', hoverText: 'group-hover:text-white' },
            'hibah': { icon: <Gift className="w-8 h-8" />, color: 'text-orange-600', bg: 'bg-orange-100', darkBg: 'dark:bg-orange-900/30', darkColor: 'dark:text-orange-400', gradient: 'from-orange-500 to-red-500', hoverBg: 'group-hover:bg-orange-600', hoverText: 'group-hover:text-white' },
        };
        return map[catId ?? ''] ?? {
            icon: <FileText className="w-8 h-8" />, color: 'text-[#0D5C35]', bg: 'bg-[#EAF2EE]',
            darkBg: 'dark:bg-[#0D5C35]/20', darkColor: 'dark:text-emerald-400',
            gradient: 'from-[#0D5C35] to-[#0A492A]',
            hoverBg: 'group-hover:bg-[#0D5C35]', hoverText: 'group-hover:text-white',
        };
    };

    const meta = getCategoryMeta(categoryId);

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

    /* ── Filter lokal ── */
    const filteredDocs = searchLocal.trim()
        ? documents.filter(d =>
            d.title.toLowerCase().includes(searchLocal.toLowerCase()) ||
            d.description.toLowerCase().includes(searchLocal.toLowerCase()))
        : documents;

    /* ── Sort ── */
    const sortedDocs = (() => {
        const arr = [...filteredDocs];
        switch (sortBy) {
            case 'az': return arr.sort((a, b) => a.title.localeCompare(b.title, 'id'));
            case 'za': return arr.sort((a, b) => b.title.localeCompare(a.title, 'id'));
            case 'newest': return arr.sort((a, b) => (b.updatedAt?.seconds || 0) - (a.updatedAt?.seconds || 0));
            case 'oldest': return arr.sort((a, b) => (a.updatedAt?.seconds || 0) - (b.updatedAt?.seconds || 0));
            default: return arr;
        }
    })();

    return (
        <div className="min-h-screen bg-[#F4F7F5] dark:bg-[#0d1a12] font-sans pb-24 relative transition-colors duration-300">
            <style dangerouslySetInnerHTML={{ __html: PAGE_CSS }} />

            {/* ── HERO HEADER ── */}
            <header className="relative bg-[#0D5C35] overflow-hidden">
                <div className="absolute inset-0 bg-gradient-to-br from-[#0D5C35] via-[#0A492A] to-[#062B18]" />
                <div className="absolute inset-0 cat-hero-grid opacity-20" />
                <div className="absolute inset-0 pointer-events-none overflow-hidden">
                    <div className="cat-blob-1 absolute -top-24 -left-20 w-[360px] h-[360px] rounded-full bg-emerald-400/20 blur-3xl" />
                    <div className="cat-blob-2 absolute -bottom-24 -right-20 w-[420px] h-[420px] rounded-full bg-[#D4AF37]/12 blur-3xl" />
                </div>

                <div className="relative z-10 max-w-6xl mx-auto px-4 sm:px-6 py-8 md:py-12">
                    {/* Breadcrumb */}
                    <nav className="flex items-center gap-1.5 text-emerald-100/55 text-xs font-medium mb-5">
                        <button onClick={() => navigate('/')} className="flex items-center gap-1 hover:text-white transition-colors">
                            <Home className="w-3.5 h-3.5" /> Beranda
                        </button>
                        <ChevronRight className="w-3 h-3" />
                        <span className="text-white/80 font-bold truncate max-w-[200px] sm:max-w-none">{categoryTitle}</span>
                    </nav>

                    <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-6 md:gap-8">
                        <div className="flex-1 min-w-0">
                            <button onClick={() => navigate('/')}
                                className="mb-5 inline-flex items-center gap-2 text-emerald-100/80 hover:text-white bg-white/10 hover:bg-white/20 px-4 py-2 rounded-full transition-all text-sm font-bold border border-white/10">
                                <ArrowLeft className="w-4 h-4" /> Kembali ke Beranda
                            </button>

                            <div className="flex items-center gap-3 mb-3">
                                <span className="px-3 py-1 bg-[#D4AF37]/20 border border-[#D4AF37]/30 rounded-full text-[#D4AF37] text-xs font-bold uppercase tracking-widest">Kategori</span>
                            </div>

                            <h1 className="text-3xl sm:text-4xl md:text-5xl font-black text-white tracking-tight mb-3 leading-tight break-words">
                                {categoryTitle}
                            </h1>
                            <p className="text-emerald-100/70 text-sm sm:text-base max-w-md leading-relaxed">
                                Daftar informasi, SOP, dan prosedur resmi terkait layanan{' '}
                                <strong className="text-emerald-100/90">{categoryTitle}</strong> yang dikelola KPKNL Kendari.
                            </p>

                            {!loading && (
                                <div className="mt-4 inline-flex items-center gap-2 px-3 py-1.5 bg-white/10 rounded-full border border-white/10 text-white/70 text-xs font-medium">
                                    <Layers className="w-3.5 h-3.5" />
                                    {documents.length} dokumen tersedia
                                </div>
                            )}
                        </div>

                        {/* Icon besar — desktop */}
                        <div className="hidden md:flex flex-shrink-0">
                            <div className={`bg-gradient-to-br ${meta.gradient} p-8 lg:p-9 rounded-3xl shadow-2xl border border-white/10`}>
                                <div className="text-white opacity-90">
                                    {React.cloneElement(meta.icon as React.ReactElement, { className: 'w-14 h-14 lg:w-16 lg:h-16' })}
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </header>

            {/* ── MAIN CONTENT ── */}
            <main className="max-w-6xl mx-auto px-4 sm:px-6 mt-8 md:mt-10">

                {/* Search lokal + info dokumen */}
                {!loading && documents.length > 0 && (
                    <div className="mb-7 flex flex-col sm:flex-row gap-3 items-stretch sm:items-center flex-wrap">
                        <div className="relative flex-1 max-w-sm">
                            <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
                            <input
                                type="text"
                                placeholder={`Cari di ${categoryTitle}...`}
                                value={searchLocal}
                                onChange={e => setSearchLocal(e.target.value)}
                                className="w-full pl-10 pr-9 py-2.5 rounded-xl border border-slate-200 dark:border-slate-600 bg-white dark:bg-[#162918] dark:text-slate-200 text-sm font-medium outline-none focus:ring-2 focus:ring-[#0D5C35] dark:focus:ring-emerald-500 transition-all shadow-sm"
                            />
                            {searchLocal && (
                                <button onClick={() => setSearchLocal('')} className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 transition-colors">
                                    <X className="w-3.5 h-3.5" />
                                </button>
                            )}
                        </div>

                        {/* Sort buttons */}
                        <div className="flex items-center gap-1.5 flex-wrap">
                            <ArrowUpDown className="w-3.5 h-3.5 text-slate-400 flex-shrink-0" />
                            {([
                                { key: 'default', label: 'Default' },
                                { key: 'newest', label: 'Terbaru' },
                                { key: 'oldest', label: 'Terlama' },
                                { key: 'az', label: 'A–Z' },
                                { key: 'za', label: 'Z–A' },
                            ] as { key: SortKey; label: string }[]).map(s => (
                                <button key={s.key} onClick={() => setSortBy(s.key)}
                                    className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all
                                        ${sortBy === s.key
                                            ? 'bg-[#0D5C35] text-white shadow-md'
                                            : 'bg-white dark:bg-[#162918] text-slate-500 dark:text-slate-400 border border-slate-200 dark:border-slate-600 hover:border-[#0D5C35]/40 hover:text-[#0D5C35]'
                                        }`}>
                                    {s.label}
                                </button>
                            ))}
                        </div>

                        <p className="text-sm text-slate-500 dark:text-slate-400 self-center whitespace-nowrap">
                            {searchLocal ? (
                                <><span className="font-bold text-slate-700 dark:text-slate-200">{sortedDocs.length}</span> dari {documents.length} dokumen</>
                            ) : (
                                <><span className="font-bold text-slate-700 dark:text-slate-200">{documents.length}</span> dokumen ditemukan</>
                            )}
                        </p>
                    </div>
                )}

                {loading ? (
                    <SkeletonCategoryGrid />
                ) : sortedDocs.length > 0 ? (
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5 md:gap-7">
                        {sortedDocs.map((doc, i) => (
                            <div key={doc.id} onClick={() => navigate(`/detail/${doc.id}`)}
                                className="cat-card bg-white dark:bg-[#162918] rounded-3xl p-6 md:p-8 border border-slate-100 dark:border-slate-700 shadow-sm hover:shadow-2xl hover:-translate-y-2 cursor-pointer transition-all duration-350 group flex flex-col h-full"
                                style={{ animationDelay: `${i * 70}ms` }}>
                                {/* Icon */}
                                <div className={`mb-5 p-4 rounded-2xl w-fit transition-all duration-300
                                    ${meta.bg} ${meta.color} ${meta.darkBg} ${meta.darkColor}
                                    ${meta.hoverBg} ${meta.hoverText}
                                    group-hover:shadow-lg group-hover:scale-105`}>
                                    {meta.icon}
                                </div>

                                <h3 className="font-black text-lg md:text-xl text-slate-800 dark:text-slate-100 mb-3 group-hover:text-[#0D5C35] dark:group-hover:text-emerald-400 transition-colors leading-tight line-clamp-2">
                                    {doc.title}
                                </h3>

                                <p className="text-slate-500 dark:text-slate-400 text-sm leading-relaxed line-clamp-3 flex-grow mb-6">
                                    {doc.description}
                                </p>

                                <div className={`mt-auto pt-4 md:pt-5 border-t border-slate-100 dark:border-slate-700
                                    flex items-center justify-between font-bold text-sm
                                    opacity-70 group-hover:opacity-100 transition-all duration-300
                                    ${meta.color} ${meta.darkColor}`}>
                                    <span>Baca Selengkapnya</span>
                                    <ArrowRight className="w-4 h-4 group-hover:translate-x-1.5 transition-transform duration-300" />
                                </div>
                            </div>
                        ))}
                    </div>
                ) : (
                    <div className="text-center py-20 md:py-24 bg-white dark:bg-[#162918] rounded-3xl border-2 border-dashed border-slate-200 dark:border-slate-700 shadow-sm max-w-2xl mx-auto animate-in fade-in zoom-in-95 duration-500">
                        <div className={`mx-auto w-20 h-20 mb-6 rounded-2xl flex items-center justify-center opacity-50 ${meta.bg} ${meta.color} ${meta.darkBg} ${meta.darkColor}`}>
                            {React.cloneElement(meta.icon as React.ReactElement, { className: 'w-10 h-10' })}
                        </div>
                        <h3 className="text-xl md:text-2xl font-black text-slate-800 dark:text-slate-100 mb-2">
                            {searchLocal ? 'Tidak Ditemukan' : 'Belum Ada Informasi'}
                        </h3>
                        <p className="text-slate-500 dark:text-slate-400 px-8 mb-8 leading-relaxed text-sm md:text-base">
                            {searchLocal
                                ? <>Tidak ada dokumen yang cocok untuk <strong>"{searchLocal}"</strong>.</>
                                : <>Informasi dan SOP untuk layanan <strong>{categoryTitle}</strong> sedang dalam tahap penyusunan.</>
                            }
                        </p>
                        <div className="flex flex-col sm:flex-row gap-3 justify-center px-8">
                            {searchLocal && (
                                <button onClick={() => setSearchLocal('')}
                                    className="px-6 py-3 bg-white dark:bg-slate-700 border border-slate-200 dark:border-slate-600 text-slate-700 dark:text-slate-200 rounded-xl font-bold hover:bg-slate-50 dark:hover:bg-slate-600 transition-all text-sm">
                                    Reset Pencarian
                                </button>
                            )}
                            <button onClick={() => navigate('/')}
                                className="px-8 py-3 bg-[#0D5C35] hover:bg-[#0A492A] text-white rounded-xl font-bold shadow-lg shadow-emerald-900/20 hover:-translate-y-0.5 transition-all text-sm">
                                Kembali ke Beranda
                            </button>
                        </div>
                    </div>
                )}
            </main>

            {/* Scroll to top */}
            <button onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
                aria-label="Kembali ke atas"
                className={`fixed bottom-6 right-6 md:bottom-8 md:right-8 p-3.5 md:p-4 bg-[#D4AF37] text-slate-900 rounded-full shadow-2xl hover:bg-[#B5952F] hover:scale-110 active:scale-95 transition-all duration-500 z-50 group ${isScrolled ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-10 pointer-events-none'}`}>
                <ArrowUp className="w-4 h-4 md:w-5 md:h-5 group-hover:-translate-y-1 transition-transform" />
            </button>
        </div>
    );
};

export default CategoryPage;