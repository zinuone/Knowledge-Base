// File: src/pages/NotFoundPage.tsx
import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Home, Search, ArrowLeft, FileText, RefreshCw, Sun, Moon } from 'lucide-react';
import { Helmet } from 'react-helmet-async';

const PAGE_CSS = `
@keyframes floatUp {
  0%,100% { transform: translateY(0); }
  50%      { transform: translateY(-14px); }
}
@keyframes blobDrift {
  0%,100% { transform: translate(0,0) scale(1); }
  33%      { transform: translate(30px,-20px) scale(1.05); }
  66%      { transform: translate(-20px,15px) scale(0.97); }
}
@keyframes fadeInUp {
  from { opacity: 0; transform: translateY(20px); }
  to   { opacity: 1; transform: translateY(0); }
}
.float-anim { animation: floatUp 4s ease-in-out infinite; }
.blob-404-1 { animation: blobDrift 14s ease-in-out infinite; }
.blob-404-2 { animation: blobDrift 18s ease-in-out infinite reverse; }
.fade-up-1 { animation: fadeInUp 0.5s ease-out 0.1s both; }
.fade-up-2 { animation: fadeInUp 0.5s ease-out 0.25s both; }
.fade-up-3 { animation: fadeInUp 0.5s ease-out 0.4s both; }
`;

const NotFoundPage: React.FC = () => {
    const navigate = useNavigate();
    const [searchVal, setSearchVal] = useState('');

    /* ── Dark Mode — reaktif + persist (konsisten dengan halaman lain) ──
       Sebelumnya: useEffect read-once tanpa state, tidak ada toggle button.
       Sekarang: state isDark + useEffect reaktif + tombol toggle di UI. */
    const [isDark, setIsDark] = useState(() => {
        try { return localStorage.getItem('pkn-theme') === 'dark'; } catch { return false; }
    });
    useEffect(() => {
        document.documentElement.classList.toggle('dark', isDark);
        try { localStorage.setItem('pkn-theme', isDark ? 'dark' : 'light'); } catch { }
    }, [isDark]);

    const handleSearch = (e: React.FormEvent) => {
        e.preventDefault();
        if (searchVal.trim()) {
            navigate(`/search?q=${encodeURIComponent(searchVal.trim())}`);
        }
    };

    return (
        <div className="min-h-screen bg-[#F4F7F5] dark:bg-[#0d1a12] font-sans flex flex-col transition-colors duration-300 relative overflow-hidden">
            <Helmet>
                <title>404 - Halaman Tidak Ditemukan | Knowledge Base KPKNL Kendari</title>
                <meta name="robots" content="noindex" />
            </Helmet>
            <style dangerouslySetInnerHTML={{ __html: PAGE_CSS }} />

            {/* Background blobs */}
            <div className="absolute inset-0 pointer-events-none overflow-hidden">
                <div className="blob-404-1 absolute -top-24 -right-24 w-96 h-96 rounded-full bg-emerald-100 dark:bg-[#0D5C35]/15 blur-3xl opacity-60" />
                <div className="blob-404-2 absolute -bottom-24 -left-24 w-80 h-80 rounded-full bg-[#D4AF37]/15 dark:bg-[#D4AF37]/10 blur-3xl opacity-60" />
            </div>

            <div className="relative z-10 flex flex-col items-center justify-center flex-1 px-6 py-16 text-center">

                {/* Brand + dark mode toggle */}
                <div className="fade-up-1 flex items-center justify-between w-full max-w-md mb-10">
                    <div className="flex items-center gap-2">
                        <div className="w-8 h-8 rounded-xl bg-[#0D5C35] flex items-center justify-center shadow-md">
                            <FileText className="w-4 h-4 text-white" />
                        </div>
                        <span className="font-black text-[#0D5C35] dark:text-emerald-400 text-sm uppercase tracking-widest">KPKNL Kendari</span>
                    </div>
                    {/* Toggle dark mode — sama dengan halaman lain */}
                    <button
                        onClick={() => setIsDark(p => !p)}
                        className="p-2.5 rounded-full bg-slate-100 dark:bg-[#162918] hover:bg-slate-200 dark:hover:bg-[#1a3021] border border-slate-200 dark:border-slate-700 transition-all"
                        title={isDark ? 'Mode Terang' : 'Mode Gelap'}
                        aria-label={isDark ? 'Aktifkan Mode Terang' : 'Aktifkan Mode Gelap'}
                    >
                        {isDark
                            ? <Sun className="w-4 h-4 text-[#D4AF37]" />
                            : <Moon className="w-4 h-4 text-slate-500" />
                        }
                    </button>
                </div>

                {/* 404 illustration */}
                <div className="float-anim fade-up-1 mb-8 relative">
                    <div className="relative inline-block">
                        {/* Big "404" */}
                        <span className="text-[9rem] md:text-[12rem] font-black leading-none select-none"
                            style={{
                                background: 'linear-gradient(135deg, #0D5C35 0%, #D4AF37 100%)',
                                WebkitBackgroundClip: 'text',
                                WebkitTextFillColor: 'transparent',
                                backgroundClip: 'text',
                            }}>
                            404
                        </span>
                        {/* Floating document emoji */}
                        <div className="absolute -top-4 -right-4 text-4xl" style={{ animationDelay: '1s' }}>📄</div>
                        <div className="absolute bottom-4 -left-6 text-2xl opacity-60" style={{ animationDelay: '2s' }}>🔍</div>
                    </div>
                </div>

                {/* Text */}
                <div className="fade-up-2 mb-8 max-w-md">
                    <h1 className="text-2xl md:text-3xl font-black text-slate-800 dark:text-slate-100 mb-3 tracking-tight">
                        Halaman Tidak Ditemukan
                    </h1>
                    <p className="text-slate-500 dark:text-slate-400 leading-relaxed">
                        Maaf, halaman yang Anda cari tidak tersedia atau mungkin telah dipindahkan.
                        Coba cari dokumen yang Anda butuhkan di bawah ini.
                    </p>
                </div>

                {/* Search box */}
                <form onSubmit={handleSearch} className="fade-up-3 w-full max-w-md mb-8">
                    <div className="relative flex gap-2">
                        <div className="relative flex-1">
                            <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 pointer-events-none" />
                            <input
                                type="text"
                                value={searchVal}
                                onChange={e => setSearchVal(e.target.value)}
                                placeholder="Cari dokumen…"
                                className="w-full pl-11 pr-4 py-3.5 rounded-xl bg-white dark:bg-[#162918] border border-slate-200 dark:border-slate-700 text-slate-800 dark:text-slate-200 placeholder:text-slate-400 text-sm font-medium outline-none focus:ring-2 focus:ring-[#0D5C35] dark:focus:ring-emerald-500 transition-all shadow-sm"
                            />
                        </div>
                        <button type="submit"
                            className="px-5 py-3.5 bg-[#D4AF37] hover:bg-[#B5952F] text-slate-900 rounded-xl font-black text-sm shadow-lg transition-all hover:-translate-y-0.5">
                            <Search className="w-4 h-4" />
                        </button>
                    </div>
                </form>

                {/* Action buttons */}
                <div className="fade-up-3 flex flex-col sm:flex-row gap-3 items-center">
                    <button
                        onClick={() => navigate('/')}
                        className="flex items-center gap-2 px-6 py-3 bg-[#0D5C35] hover:bg-[#0A492A] text-white rounded-xl font-bold shadow-lg shadow-emerald-200/50 dark:shadow-emerald-900/30 hover:-translate-y-0.5 transition-all text-sm">
                        <Home className="w-4 h-4" /> Kembali ke Beranda
                    </button>
                    <button
                        onClick={() => navigate(-1)}
                        className="flex items-center gap-2 px-6 py-3 bg-white dark:bg-[#162918] hover:bg-slate-50 dark:hover:bg-[#1a3021] text-slate-600 dark:text-slate-300 rounded-xl font-bold border border-slate-200 dark:border-slate-700 hover:border-slate-300 transition-all text-sm shadow-sm">
                        <ArrowLeft className="w-4 h-4" /> Halaman Sebelumnya
                    </button>
                    <button
                        onClick={() => window.location.reload()}
                        className="flex items-center gap-2 px-6 py-3 bg-white dark:bg-[#162918] hover:bg-slate-50 dark:hover:bg-[#1a3021] text-slate-500 dark:text-slate-400 rounded-xl font-bold border border-slate-200 dark:border-slate-700 transition-all text-sm shadow-sm">
                        <RefreshCw className="w-4 h-4" /> Muat Ulang
                    </button>
                </div>

                {/* Quick links */}
                <div className="fade-up-3 mt-12 pt-8 border-t border-slate-200 dark:border-slate-700 w-full max-w-lg">
                    <p className="text-xs font-bold text-slate-400 dark:text-slate-500 uppercase tracking-widest mb-4">Halaman Populer</p>
                    <div className="flex flex-wrap justify-center gap-2">
                        {[
                            { label: 'PSP', path: '/category/psp' },
                            { label: 'Penjualan', path: '/category/penjualan' },
                            { label: 'Sewa', path: '/category/sewa' },
                            { label: 'Penghapusan', path: '/category/penghapusan' },
                            { label: 'Dokumen Favorit', path: '/bookmarks' },
                            { label: 'Login Admin', path: '/login' },
                        ].map(link => (
                            <button key={link.path} onClick={() => navigate(link.path)}
                                className="px-3.5 py-1.5 rounded-xl text-xs font-bold bg-white dark:bg-[#162918] border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-400 hover:border-[#0D5C35]/40 hover:text-[#0D5C35] dark:hover:text-emerald-400 transition-all shadow-sm">
                                {link.label}
                            </button>
                        ))}
                    </div>
                </div>
            </div>

            {/* Footer note */}
            <div className="relative z-10 text-center py-4 border-t border-slate-200 dark:border-slate-700 text-xs text-slate-400 dark:text-slate-500">
                Knowledge Base KPKNL Kendari · Direktorat Jenderal Kekayaan Negara
            </div>
        </div>
    );
};

export default NotFoundPage;