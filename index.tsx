// File: index.tsx

// [#9] Import CSS entry point — Tailwind directives + global styles.
// Harus di-import di sini (root render) agar tersedia di seluruh aplikasi.
// Sebelumnya CSS dikelola oleh CDN di index.html; sekarang di-bundle oleh Vite.
import './index.css';

import React from 'react';
import ReactDOM from 'react-dom/client';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { HelmetProvider } from 'react-helmet-async';

import App from './App';
import DetailPage from './src/pages/DetailPage';
import LoginPage from './src/pages/LoginPage';
import AdminDashboard from './src/pages/AdminDashboard';
import ProtectedRoute from './src/components/ProtectedRoute';
import CategoryPage from './src/pages/CategoryPage';
import BookmarksPage from './src/pages/BookmarksPage';
import SearchPage from './src/pages/SearchPage';
import NotFoundPage from './src/pages/NotFoundPage';

/* ═══════════════════════════════════════════════════════════════
   ERROR BOUNDARY
   ───────────────────────────────────────────────────────────────
   Menangkap error JavaScript yang tidak terduga di seluruh
   komponen tree sehingga aplikasi tidak blank total tanpa pesan —
   user tetap mendapat halaman fallback yang ramah dan bisa reload.

   Kenapa class component? Karena React hooks belum mendukung
   componentDidCatch. Ini satu-satunya kasus di proyek ini di mana
   class component memang diperlukan secara teknis.

   Desain fallback mengikuti visual proyek:
   - Background: gradient hijau gelap (sama dengan ProtectedRoute)
   - Tombol: gold (#D4AF37) dan transparan putih
   - Font: Plus Jakarta Sans (dari index.html)
   - Detail error hanya muncul di development (bukan production)
═══════════════════════════════════════════════════════════════ */

interface ErrorBoundaryState {
    hasError: boolean;
    errorMessage: string;
}

class ErrorBoundary extends React.Component<
    { children: React.ReactNode },
    ErrorBoundaryState
> {
    props: any;
    /* ── FIX TS constructor: super(props) wajib agar TypeScript
       mengenali this.props di seluruh class body ── */
    constructor(props: { children: React.ReactNode }) {
        super(props);
    }

    /* ── State sebagai class property (bukan di constructor) ── */
    state: ErrorBoundaryState = { hasError: false, errorMessage: '' };

    /* Dipanggil React saat ada error — update state untuk render fallback */
    static getDerivedStateFromError(error: Error): ErrorBoundaryState {
        return {
            hasError: true,
            errorMessage: error.message || 'Terjadi kesalahan yang tidak diketahui.',
        };
    }

    /* Dipanggil setelah render fallback — cocok untuk error logging */
    componentDidCatch(error: Error, info: React.ErrorInfo) {
        console.error('🔴 [ErrorBoundary] Aplikasi crash:', error);
        console.error('🔴 [ErrorBoundary] Component stack:', info.componentStack);
        // Jika suatu saat ingin integrasi Sentry / monitoring:
        // Sentry.captureException(error, { extra: info });
    }

    render() {
        if (!this.state.hasError) {
            return this.props.children;
        }

        /* ── Fallback UI ── */
        return (
            <div
                style={{ fontFamily: "'Plus Jakarta Sans', sans-serif" }}
                className="min-h-screen flex flex-col items-center justify-center bg-gradient-to-br from-[#0D5C35] via-[#0A492A] to-[#062B18] px-6 relative overflow-hidden"
            >
                {/* Dekorasi blob — sama dengan ProtectedRoute & LoginPage */}
                <div className="absolute inset-0 pointer-events-none overflow-hidden">
                    <div className="absolute -top-24 -left-24 w-80 h-80 rounded-full bg-emerald-400/15 blur-3xl" />
                    <div className="absolute -bottom-24 -right-24 w-96 h-96 rounded-full bg-[#D4AF37]/10 blur-3xl" />
                    <div className="absolute top-1/2 left-1/3 w-64 h-64 rounded-full bg-teal-300/10 blur-3xl" />
                </div>

                {/* Grid titik bergerak — sama dengan ProtectedRoute */}
                <div
                    className="absolute inset-0 opacity-15 pointer-events-none"
                    style={{
                        backgroundImage: 'radial-gradient(circle, rgba(255,255,255,0.12) 1px, transparent 1px)',
                        backgroundSize: '40px 40px',
                    }}
                />

                {/* Konten utama */}
                <div className="relative z-10 flex flex-col items-center text-center max-w-sm w-full">

                    {/* Icon */}
                    <div className="w-20 h-20 rounded-2xl flex items-center justify-center mb-6 bg-white/10 backdrop-blur-md border border-white/15 shadow-2xl">
                        <span style={{ fontSize: '2.5rem', lineHeight: 1 }}>⚠️</span>
                    </div>

                    {/* Label brand */}
                    <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full mb-5 text-xs font-bold uppercase tracking-widest bg-[#D4AF37]/20 border border-[#D4AF37]/30 text-[#D4AF37]">
                        KPKNL Kendari
                    </div>

                    <h1 className="text-2xl md:text-3xl font-black text-white mb-3 leading-tight">
                        Ups, Ada yang Tidak Beres
                    </h1>

                    <p className="text-emerald-100/70 text-sm leading-relaxed mb-5">
                        Aplikasi mengalami error tak terduga. Silakan muat ulang
                        halaman atau kembali ke beranda untuk melanjutkan.
                    </p>

                    {/* Detail error — hanya tampil saat development, tersembunyi di production */}
                    {process.env.NODE_ENV !== 'production' && this.state.errorMessage && (
                        <div className="w-full rounded-xl px-4 py-3 mb-6 text-left bg-black/30 border border-white/10">
                            <p className="text-[10px] font-black text-amber-400 mb-1.5 uppercase tracking-widest">
                                Error Detail (Dev Only)
                            </p>
                            <p className="text-xs text-emerald-200/80 font-mono break-words leading-relaxed">
                                {this.state.errorMessage}
                            </p>
                        </div>
                    )}

                    {/* Tombol aksi */}
                    <div className="flex flex-col sm:flex-row gap-3 w-full">
                        <button
                            onClick={() => window.location.reload()}
                            className="flex-1 py-3.5 rounded-2xl font-black text-slate-900 text-sm hover:-translate-y-0.5 transition-all"
                            style={{
                                background: '#D4AF37',
                                boxShadow: '0 4px 24px rgba(212,175,55,0.35)',
                            }}
                        >
                            🔄&nbsp; Muat Ulang
                        </button>
                        <button
                            onClick={() => { window.location.href = '/'; }}
                            className="flex-1 py-3.5 rounded-2xl font-black text-white text-sm hover:-translate-y-0.5 transition-all bg-white/10 border border-white/20 hover:bg-white/15"
                        >
                            🏠&nbsp; Ke Beranda
                        </button>
                    </div>
                </div>

                {/* Footer */}
                <p className="absolute bottom-6 text-xs text-white/30 font-medium">
                    Knowledge Base KPKNL Kendari · Direktorat Jenderal Kekayaan Negara
                </p>
            </div>
        );
    }
}

/* ═══════════════════════════════════════════════════════════════
   ROOT RENDER
═══════════════════════════════════════════════════════════════ */
const rootElement = document.getElementById('root');
if (!rootElement) {
    throw new Error('Could not find root element to mount to');
}

const root = ReactDOM.createRoot(rootElement);
root.render(
    <React.StrictMode>
        {/* ErrorBoundary: lapisan paling luar — menangkap semua error tree */}
        <ErrorBoundary>
            <HelmetProvider>
                <BrowserRouter>
                    <Routes>
                        {/* Halaman Utama (Public) */}
                        <Route path="/" element={<App />} />

                        {/* Halaman Detail (Public) */}
                        <Route path="/detail/:id" element={<DetailPage />} />

                        {/* Halaman Login (Public) */}
                        <Route path="/login" element={<LoginPage />} />

                        {/* Halaman Kategori */}
                        <Route path="/category/:categoryId" element={<CategoryPage />} />

                        {/* Halaman Favorit */}
                        <Route path="/bookmarks" element={<BookmarksPage />} />

                        {/* Halaman Pencarian Global */}
                        <Route path="/search" element={<SearchPage />} />

                        {/* Halaman Admin (Dilindungi Satpam/ProtectedRoute) */}
                        <Route
                            path="/admin"
                            element={
                                <ProtectedRoute>
                                    <AdminDashboard />
                                </ProtectedRoute>
                            }
                        />

                        {/* 404 — harus paling bawah */}
                        <Route path="*" element={<NotFoundPage />} />
                    </Routes>
                </BrowserRouter>
            </HelmetProvider>
        </ErrorBoundary>
    </React.StrictMode>
);