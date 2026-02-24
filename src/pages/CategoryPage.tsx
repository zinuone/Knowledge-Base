// File: src/pages/CategoryPage.tsx
import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { collection, query, where, getDocs } from 'firebase/firestore';
import { db } from '../firebase';
import {
    ArrowLeft, FileText, Hammer, Key, Trash2, Clock,
    Timer, RefreshCw, Gift, ArrowRight, ArrowUp, Home,
    ChevronRight, Layers,
} from 'lucide-react';
import { SkeletonCategoryGrid } from '../components/SkeletonLoader';

/* ─── Animasi konsisten dengan App.tsx hero ──────────────────── */
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
}

const CategoryPage: React.FC = () => {
    const { categoryId } = useParams<{ categoryId: string }>();
    const navigate = useNavigate();
    const [documents, setDocuments] = useState<ContentData[]>([]);
    const [loading, setLoading] = useState(true);
    const [isScrolled, setIsScrolled] = useState(false);

    /* Perbaikan bug: replace semua hyphen (bukan hanya yg pertama) */
    const categoryTitle = categoryId?.replace(/-/g, ' ').toUpperCase() ?? '';

    /* Meta ikon + warna per kategori */
    const getCategoryMeta = (catId?: string) => {
        const map: Record<string, {
            icon: JSX.Element; color: string; bg: string;
            gradient: string; hoverBg: string; hoverText: string;
        }> = {
            'psp': { icon: <FileText className="w-8 h-8" />, color: 'text-emerald-600', bg: 'bg-emerald-100', gradient: 'from-emerald-500 to-teal-600', hoverBg: 'group-hover:bg-emerald-600', hoverText: 'group-hover:text-white' },
            'penjualan': { icon: <Hammer className="w-8 h-8" />, color: 'text-amber-600', bg: 'bg-amber-100', gradient: 'from-amber-500 to-orange-600', hoverBg: 'group-hover:bg-amber-600', hoverText: 'group-hover:text-white' },
            'sewa': { icon: <Key className="w-8 h-8" />, color: 'text-blue-600', bg: 'bg-blue-100', gradient: 'from-blue-500 to-indigo-600', hoverBg: 'group-hover:bg-blue-600', hoverText: 'group-hover:text-white' },
            'penghapusan': { icon: <Trash2 className="w-8 h-8" />, color: 'text-rose-600', bg: 'bg-rose-100', gradient: 'from-rose-500 to-pink-600', hoverBg: 'group-hover:bg-rose-600', hoverText: 'group-hover:text-white' },
            'pinjam-pakai': { icon: <Clock className="w-8 h-8" />, color: 'text-indigo-600', bg: 'bg-indigo-100', gradient: 'from-indigo-500 to-purple-600', hoverBg: 'group-hover:bg-indigo-600', hoverText: 'group-hover:text-white' },
            'penggunaan-sementara': { icon: <Timer className="w-8 h-8" />, color: 'text-purple-600', bg: 'bg-purple-100', gradient: 'from-purple-500 to-violet-600', hoverBg: 'group-hover:bg-purple-600', hoverText: 'group-hover:text-white' },
            'alih-status': { icon: <RefreshCw className="w-8 h-8" />, color: 'text-teal-600', bg: 'bg-teal-100', gradient: 'from-teal-500 to-cyan-600', hoverBg: 'group-hover:bg-teal-600', hoverText: 'group-hover:text-white' },
            'hibah': { icon: <Gift className="w-8 h-8" />, color: 'text-orange-600', bg: 'bg-orange-100', gradient: 'from-orange-500 to-red-500', hoverBg: 'group-hover:bg-orange-600', hoverText: 'group-hover:text-white' },
        };
        return map[catId ?? ''] ?? {
            icon: <FileText className="w-8 h-8" />, color: 'text-[#0D5C35]',
            bg: 'bg-[#EAF2EE]', gradient: 'from-[#0D5C35] to-[#0A492A]',
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

    return (
        <div className="min-h-screen bg-[#F4F7F5] font-sans pb-24 relative">
            <style dangerouslySetInnerHTML={{ __html: PAGE_CSS }} />

            {/* ══════════════════════════════════════════════════════════
          HERO HEADER — animasi blobs + moving grid
      ══════════════════════════════════════════════════════════ */}
            <header className="relative bg-[#0D5C35] overflow-hidden">
                <div className="absolute inset-0 bg-gradient-to-br from-[#0D5C35] via-[#0A492A] to-[#062B18]" />
                <div className="absolute inset-0 cat-hero-grid opacity-20" />
                <div className="absolute inset-0 pointer-events-none overflow-hidden">
                    <div className="cat-blob-1 absolute -top-24 -left-20 w-[360px] h-[360px] rounded-full bg-emerald-400/20 blur-3xl" />
                    <div className="cat-blob-2 absolute -bottom-24 -right-20 w-[420px] h-[420px] rounded-full bg-[#D4AF37]/12 blur-3xl" />
                </div>

                <div className="relative z-10 max-w-6xl mx-auto px-6 py-10 md:py-14">
                    {/* Breadcrumb */}
                    <nav className="flex items-center gap-1.5 text-emerald-100/55 text-xs font-medium mb-6">
                        <button
                            onClick={() => navigate('/')}
                            className="flex items-center gap-1 hover:text-white transition-colors"
                        >
                            <Home className="w-3.5 h-3.5" /> Beranda
                        </button>
                        <ChevronRight className="w-3 h-3" />
                        <span className="text-white/80 font-bold">{categoryTitle}</span>
                    </nav>

                    <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-8">
                        {/* Teks kiri */}
                        <div className="flex-1">
                            <button
                                onClick={() => navigate('/')}
                                className="mb-5 inline-flex items-center gap-2 text-emerald-100/80 hover:text-white bg-white/10 hover:bg-white/20 px-4 py-2 rounded-full transition-all text-sm font-bold border border-white/10"
                            >
                                <ArrowLeft className="w-4 h-4" /> Kembali ke Beranda
                            </button>

                            <div className="flex items-center gap-3 mb-3">
                                <span className="px-3 py-1 bg-[#D4AF37]/20 border border-[#D4AF37]/30 rounded-full text-[#D4AF37] text-xs font-bold uppercase tracking-widest">
                                    Kategori
                                </span>
                            </div>

                            <h1 className="text-4xl md:text-5xl font-black text-white tracking-tight mb-3 leading-tight">
                                {categoryTitle}
                            </h1>
                            <p className="text-emerald-100/70 text-base max-w-md leading-relaxed">
                                Daftar informasi, SOP, dan prosedur resmi terkait layanan{' '}
                                <strong className="text-emerald-100/90">{categoryTitle}</strong> yang dikelola KPKNL Kendari.
                            </p>

                            {!loading && (
                                <div className="mt-5 inline-flex items-center gap-2 px-3 py-1.5 bg-white/10 rounded-full border border-white/10 text-white/70 text-xs font-medium">
                                    <Layers className="w-3.5 h-3.5" />
                                    {documents.length} dokumen tersedia
                                </div>
                            )}
                        </div>

                        {/* Icon besar — desktop */}
                        <div className="hidden md:flex flex-shrink-0">
                            <div className={`bg-gradient-to-br ${meta.gradient} p-9 rounded-3xl shadow-2xl border border-white/10`}>
                                <div className="text-white opacity-90">
                                    {React.cloneElement(meta.icon as React.ReactElement, { className: 'w-16 h-16' })}
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </header>

            {/* ══════════════════════════════════════════════════════════
          MAIN CONTENT
      ══════════════════════════════════════════════════════════ */}
            <main className="max-w-6xl mx-auto px-4 sm:px-6 mt-10">
                {loading ? (
                    <SkeletonCategoryGrid />
                ) : documents.length > 0 ? (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-7">
                        {documents.map((doc, i) => (
                            <div
                                key={doc.id}
                                onClick={() => navigate(`/detail/${doc.id}`)}
                                className="cat-card bg-white rounded-3xl p-8 border border-slate-100 shadow-sm hover:shadow-2xl hover:-translate-y-2 cursor-pointer transition-all duration-350 group flex flex-col h-full"
                                style={{ animationDelay: `${i * 70}ms` }}
                            >
                                {/* Icon box */}
                                <div className={`
                  mb-6 p-4 rounded-2xl w-fit transition-all duration-300
                  ${meta.bg} ${meta.color}
                  ${meta.hoverBg} ${meta.hoverText}
                  group-hover:shadow-lg group-hover:scale-105
                `}>
                                    {meta.icon}
                                </div>

                                {/* Title */}
                                <h3 className="font-black text-xl text-slate-800 mb-3 group-hover:text-[#0D5C35] transition-colors leading-tight line-clamp-2">
                                    {doc.title}
                                </h3>

                                {/* Description */}
                                <p className="text-slate-500 text-sm leading-relaxed line-clamp-3 flex-grow mb-6">
                                    {doc.description}
                                </p>

                                {/* Footer */}
                                <div className={`
                  mt-auto pt-5 border-t border-slate-100
                  flex items-center justify-between font-bold text-sm
                  opacity-70 group-hover:opacity-100 transition-all duration-300
                  ${meta.color}
                `}>
                                    <span>Baca Selengkapnya</span>
                                    <ArrowRight className="w-4 h-4 group-hover:translate-x-1.5 transition-transform duration-300" />
                                </div>
                            </div>
                        ))}
                    </div>
                ) : (
                    /* Empty state */
                    <div className="text-center py-24 bg-white rounded-3xl border-2 border-dashed border-slate-200 shadow-sm max-w-2xl mx-auto animate-in fade-in zoom-in-95 duration-500">
                        <div className={`mx-auto w-20 h-20 mb-6 rounded-2xl flex items-center justify-center ${meta.bg} ${meta.color} opacity-50`}>
                            {React.cloneElement(meta.icon as React.ReactElement, { className: 'w-10 h-10' })}
                        </div>
                        <h3 className="text-2xl font-black text-slate-800 mb-2">Belum Ada Informasi</h3>
                        <p className="text-slate-500 px-8 mb-8 leading-relaxed">
                            Informasi dan SOP untuk layanan{' '}
                            <strong>{categoryTitle}</strong> sedang dalam tahap penyusunan.
                        </p>
                        <button
                            onClick={() => navigate('/')}
                            className="px-8 py-3 bg-[#0D5C35] hover:bg-[#0A492A] text-white rounded-xl font-bold shadow-lg shadow-emerald-900/20 hover:-translate-y-0.5 transition-all"
                        >
                            Kembali ke Beranda
                        </button>
                    </div>
                )}
            </main>

            {/* Scroll to top */}
            <button
                onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
                aria-label="Kembali ke atas"
                className={`
          fixed bottom-8 right-8 p-4 bg-[#D4AF37] text-slate-900 rounded-full
          shadow-2xl hover:bg-[#B5952F] hover:scale-110 active:scale-95
          transition-all duration-500 z-50 group
          ${isScrolled ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-10 pointer-events-none'}
        `}
            >
                <ArrowUp className="w-5 h-5 group-hover:-translate-y-1 transition-transform" />
            </button>
        </div>
    );
};

export default CategoryPage;