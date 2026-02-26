// File: src/pages/BookmarksPage.tsx
import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { collection, query, where, documentId, getDocs } from 'firebase/firestore';
import { db } from '../firebase';
import {
    ArrowLeft, Bookmark, BookmarkX, Home, FileText,
    ArrowRight, Trash2, Sparkles, ChevronRight,
} from 'lucide-react';

/* ─── CSS ─────────────────────────────────────────────────────── */
const PAGE_CSS = `
@keyframes fadeInUp {
  from { opacity: 0; transform: translateY(16px); }
  to   { opacity: 1; transform: translateY(0); }
}
@keyframes bmBlob1 {
  0%,100% { transform: translate(0,0) scale(1); }
  50%     { transform: translate(30px,-20px) scale(1.06); }
}
.bm-card { animation: fadeInUp 0.4s ease-out forwards; opacity: 0; }
.bm-blob { animation: bmBlob1 16s ease-in-out infinite; }
.bm-grid {
  background-image: radial-gradient(circle, rgba(255,255,255,0.10) 1px, transparent 1px);
  background-size: 44px 44px;
}
`;

/* ─── WARNA KATEGORI ─────────────────────────────────────────── */
const getCategoryStyle = (cat: string) => {
    const map: Record<string, string> = {
        'psp': 'bg-emerald-100 text-emerald-800 border-emerald-200 dark:bg-emerald-900/30 dark:text-emerald-300 dark:border-emerald-700/30',
        'penjualan': 'bg-amber-100   text-amber-800   border-amber-200   dark:bg-amber-900/30   dark:text-amber-300   dark:border-amber-700/30',
        'sewa': 'bg-blue-100    text-blue-800    border-blue-200    dark:bg-blue-900/30    dark:text-blue-300    dark:border-blue-700/30',
        'penghapusan': 'bg-rose-100    text-rose-800    border-rose-200    dark:bg-rose-900/30    dark:text-rose-300    dark:border-rose-700/30',
        'pinjam-pakai': 'bg-indigo-100  text-indigo-800  border-indigo-200  dark:bg-indigo-900/30  dark:text-indigo-300  dark:border-indigo-700/30',
        'penggunaan-sementara': 'bg-purple-100  text-purple-800  border-purple-200  dark:bg-purple-900/30  dark:text-purple-300  dark:border-purple-700/30',
        'alih-status': 'bg-teal-100    text-teal-800    border-teal-200    dark:bg-teal-900/30    dark:text-teal-300    dark:border-teal-700/30',
        'hibah': 'bg-orange-100  text-orange-800  border-orange-200  dark:bg-orange-900/30  dark:text-orange-300  dark:border-orange-700/30',
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
    const [loading, setLoading] = useState(true);
    const [bookmarkIds, setBookmarkIds] = useState<string[]>(() => {
        try { return JSON.parse(localStorage.getItem('pkn-bookmarks') || '[]'); } catch { return []; }
    });

    /* ── Dark Mode ── */
    useEffect(() => {
        try {
            const isDark = localStorage.getItem('pkn-theme') === 'dark';
            document.documentElement.classList.toggle('dark', isDark);
        } catch { }
    }, []);

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
            <style dangerouslySetInnerHTML={{ __html: PAGE_CSS }} />

            {/* ── HERO HEADER ── */}
            <header className="relative bg-gradient-to-br from-[#0D5C35] via-[#0A492A] to-[#062B18] overflow-hidden">
                <div className="absolute inset-0 bm-grid opacity-20 pointer-events-none" />
                <div className="absolute inset-0 pointer-events-none overflow-hidden">
                    <div className="bm-blob absolute -top-20 -left-16 w-80 h-80 rounded-full bg-emerald-400/20 blur-3xl" />
                    <div className="bm-blob absolute -bottom-16 -right-12 w-72 h-72 rounded-full bg-[#D4AF37]/12 blur-3xl" style={{ animationDelay: '8s' }} />
                </div>

                <div className="relative z-10 max-w-5xl mx-auto px-4 sm:px-6 py-8 md:py-10">
                    {/* Breadcrumb */}
                    <nav className="flex items-center gap-1.5 text-emerald-100/55 text-xs font-medium mb-5">
                        <button onClick={() => navigate('/')} className="flex items-center gap-1 hover:text-white transition-colors">
                            <Home className="w-3.5 h-3.5" /> Beranda
                        </button>
                        <ChevronRight className="w-3 h-3" />
                        <span className="text-white/80 font-bold">Dokumen Favorit</span>
                    </nav>

                    <button onClick={() => navigate('/')}
                        className="mb-5 inline-flex items-center gap-2 text-emerald-100/80 hover:text-white bg-white/10 hover:bg-white/20 px-4 py-2 rounded-full transition-all text-sm font-bold border border-white/10">
                        <ArrowLeft className="w-4 h-4" /> Kembali ke Beranda
                    </button>

                    <div className="flex items-start justify-between gap-4">
                        <div>
                            <div className="flex items-center gap-3 mb-3">
                                <div className="p-2.5 bg-[#D4AF37]/20 border border-[#D4AF37]/30 rounded-2xl">
                                    <Bookmark className="w-6 h-6 text-[#D4AF37]" />
                                </div>
                                <span className="px-3 py-1 bg-[#D4AF37]/20 border border-[#D4AF37]/30 rounded-full text-[#D4AF37] text-xs font-bold uppercase tracking-widest">Koleksi Saya</span>
                            </div>
                            <h1 className="text-3xl sm:text-4xl font-black text-white tracking-tight mb-2 leading-tight">
                                Dokumen Favorit
                            </h1>
                            <p className="text-emerald-100/70 text-sm max-w-md leading-relaxed">
                                Kumpulan dokumen yang Anda tandai — akses cepat ke informasi paling sering dibutuhkan.
                            </p>
                        </div>
                        {!loading && docs.length > 0 && (
                            <div className="hidden sm:flex flex-col items-end gap-2 flex-shrink-0">
                                <div className="text-4xl font-black text-[#D4AF37]">{docs.length}</div>
                                <div className="text-emerald-100/60 text-xs font-medium uppercase tracking-wider">Dokumen</div>
                            </div>
                        )}
                    </div>
                </div>
            </header>

            {/* ── MAIN ── */}
            <main className="max-w-5xl mx-auto px-4 sm:px-6 mt-8 md:mt-10">

                {/* Header action bar */}
                {!loading && docs.length > 0 && (
                    <div className="flex items-center justify-between mb-6">
                        <p className="text-slate-500 dark:text-slate-400 text-sm">
                            <span className="font-bold text-slate-700 dark:text-slate-200">{docs.length}</span> dokumen tersimpan
                        </p>
                        <button onClick={handleClearAll}
                            className="flex items-center gap-1.5 text-xs font-bold text-rose-500 hover:text-rose-600 dark:text-rose-400 bg-rose-50 dark:bg-rose-900/20 border border-rose-100 dark:border-rose-800/30 px-3 py-1.5 rounded-xl hover:shadow-sm transition-all">
                            <Trash2 className="w-3.5 h-3.5" /> Hapus Semua
                        </button>
                    </div>
                )}

                {/* Loading */}
                {loading && (
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
                        {Array.from({ length: 3 }).map((_, i) => (
                            <div key={i} className="bg-white dark:bg-[#162918] rounded-3xl p-6 border border-slate-100 dark:border-slate-700 animate-pulse">
                                <div className="h-4 bg-slate-100 dark:bg-slate-700 rounded-full w-1/3 mb-4" />
                                <div className="h-5 bg-slate-100 dark:bg-slate-700 rounded-full w-full mb-2" />
                                <div className="h-5 bg-slate-100 dark:bg-slate-700 rounded-full w-3/4 mb-4" />
                                <div className="h-3 bg-slate-100 dark:bg-slate-700 rounded-full w-full mb-1" />
                                <div className="h-3 bg-slate-100 dark:bg-slate-700 rounded-full w-5/6" />
                            </div>
                        ))}
                    </div>
                )}

                {/* Empty state */}
                {!loading && docs.length === 0 && (
                    <div className="text-center py-20 bg-white dark:bg-[#162918] rounded-3xl border-2 border-dashed border-slate-200 dark:border-slate-700 max-w-lg mx-auto">
                        <div className="w-20 h-20 bg-[#D4AF37]/10 rounded-3xl flex items-center justify-center mx-auto mb-5">
                            <Bookmark className="w-10 h-10 text-[#D4AF37]/60" />
                        </div>
                        <h3 className="text-xl font-black text-slate-800 dark:text-slate-100 mb-2">Belum Ada Favorit</h3>
                        <p className="text-slate-500 dark:text-slate-400 text-sm leading-relaxed mb-6 px-8">
                            Tandai dokumen yang sering Anda butuhkan dengan menekan tombol <strong>Simpan</strong> di halaman artikel.
                        </p>
                        <button onClick={() => navigate('/')}
                            className="px-8 py-3 bg-[#0D5C35] hover:bg-[#0A492A] text-white rounded-xl font-bold shadow-lg hover:-translate-y-0.5 transition-all text-sm">
                            Jelajahi Dokumen
                        </button>
                    </div>
                )}

                {/* Grid dokumen */}
                {!loading && docs.length > 0 && (
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
                        {docs.map((item, i) => (
                            <div key={item.id}
                                className="bm-card group relative bg-white dark:bg-[#162918] rounded-3xl p-6 border border-slate-100 dark:border-slate-700 shadow-sm hover:shadow-xl hover:-translate-y-1.5 hover:border-[#D4AF37]/25 dark:hover:border-[#D4AF37]/20 transition-all duration-300 flex flex-col"
                                style={{ animationDelay: `${i * 70}ms` }}>

                                {/* Dekorasi */}
                                <div className="absolute top-0 right-0 w-24 h-24 rounded-bl-full -mr-12 -mt-12 bg-[#D4AF37]/5 group-hover:bg-[#D4AF37]/10 transition-colors pointer-events-none" />

                                {/* Remove button */}
                                <button
                                    onClick={(e) => { e.stopPropagation(); handleRemove(item.id); }}
                                    className="absolute top-3.5 right-3.5 p-1.5 text-slate-300 hover:text-rose-500 dark:text-slate-600 dark:hover:text-rose-400 bg-white dark:bg-slate-800 rounded-full opacity-0 group-hover:opacity-100 transition-all hover:shadow-md z-10"
                                    title="Hapus dari favorit"
                                >
                                    <BookmarkX className="w-4 h-4" />
                                </button>

                                {/* Category badge */}
                                <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider mb-3 border w-fit ${getCategoryStyle(item.category)}`}>
                                    <span className="w-1.5 h-1.5 rounded-full bg-current mr-1.5 opacity-60" />
                                    {item.category.replace(/-/g, ' ')}
                                </span>

                                {/* Title */}
                                <h3 className="font-black text-slate-800 dark:text-slate-100 group-hover:text-[#0D5C35] dark:group-hover:text-emerald-400 transition-colors text-base leading-snug mb-2 line-clamp-2 flex-none">
                                    {item.title}
                                </h3>

                                {/* Description */}
                                <p className="text-slate-500 dark:text-slate-400 text-sm leading-relaxed line-clamp-3 flex-grow mb-5">
                                    {item.description}
                                </p>

                                {/* Footer */}
                                <div className="mt-auto pt-4 border-t border-slate-100 dark:border-slate-700 flex items-center justify-between">
                                    <div className="flex items-center gap-1.5">
                                        <Sparkles className="w-3 h-3 text-[#D4AF37]/60" />
                                        <span className="text-[10px] text-slate-400 dark:text-slate-500 font-medium">
                                            {item.updatedAt
                                                ? new Date(item.updatedAt.seconds * 1000).toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric' })
                                                : '—'}
                                        </span>
                                    </div>
                                    <button
                                        onClick={() => navigate(`/detail/${item.id}`)}
                                        className="flex items-center gap-1 text-xs font-bold text-[#0D5C35] dark:text-emerald-400 opacity-70 group-hover:opacity-100 transition-opacity"
                                    >
                                        Baca <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-0.5 transition-transform" />
                                    </button>
                                </div>
                            </div>
                        ))}
                    </div>
                )}

                {/* CTA ke beranda */}
                {!loading && docs.length > 0 && (
                    <div className="mt-10 text-center">
                        <button onClick={() => navigate('/')}
                            className="inline-flex items-center gap-2 px-6 py-3 bg-white dark:bg-[#162918] border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 rounded-xl font-bold hover:border-[#0D5C35]/30 hover:text-[#0D5C35] dark:hover:text-emerald-400 transition-all text-sm shadow-sm hover:shadow-md">
                            <FileText className="w-4 h-4" /> Jelajahi Lebih Banyak Dokumen
                        </button>
                    </div>
                )}
            </main>
        </div>
    );
};

export default BookmarksPage;