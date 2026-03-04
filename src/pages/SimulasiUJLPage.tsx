// File: src/pages/SimulasiUJLPage.tsx

/* ═══════════════════════════════════════════════════════════════
   SIMULASI UJL PAGE — Halaman penuh Layanan Digital KPKNL
   ───────────────────────────────────────────────────────────────
   Route    : /layanan/ujl
   Tujuan   : Menampilkan kalkulator Uang Jaminan Lelang (UJL),
              alur pembayaran digital, referensi regulasi, dan
              CTA langsung ke platform Mayar.
   Logika   : UJL = 20% × Nilai Limit (PMK 27/PMK.06/2016 Ps.26)
   Desain   : Mengikuti visual proyek — green gradient header,
              dark/light mode, animasi konsisten dengan App.tsx.
   Firebase : Tidak diperlukan — halaman statis/interaktif.
   Status   : Fitur simulasi edukasi (belum produksi penuh).
═══════════════════════════════════════════════════════════════ */

import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Helmet } from 'react-helmet-async';
import {
    ArrowLeft, Home, ChevronRight, Moon, Sun,
    Calculator, Wallet, ShieldCheck, BadgeCheck,
    BookOpen, CreditCard, Zap, Scale, Landmark,
    ArrowRight, CheckCircle2, ExternalLink, Info,
} from 'lucide-react';

/* ─── CSS ANIMASI ─────────────────────────────────────────────── */
const PAGE_CSS = `
/* ── Blob drift — konsisten dengan App.tsx ── */
@keyframes ujlBlob1 {
  0%,100% { transform: translate(0,0) scale(1); }
  33%     { transform: translate(40px,-25px) scale(1.07); }
  66%     { transform: translate(-20px,30px) scale(0.95); }
}
@keyframes ujlBlob2 {
  0%,100% { transform: translate(0,0) scale(1); }
  50%     { transform: translate(-35px,20px) scale(1.09); }
}
.ujl-blob-1 { animation: ujlBlob1 18s ease-in-out infinite; }
.ujl-blob-2 { animation: ujlBlob2 22s ease-in-out infinite reverse; }

/* ── Grid dot background ── */
.ujl-grid {
  background-image: radial-gradient(circle, rgba(255,255,255,0.11) 1px, transparent 1px);
  background-size: 46px 46px;
}

/* ── Fade in up — staggered reveal ── */
@keyframes ujlFadeUp {
  from { opacity: 0; transform: translateY(18px); }
  to   { opacity: 1; transform: translateY(0); }
}
.ufu-1 { animation: ujlFadeUp 0.5s ease-out 0.05s both; }
.ufu-2 { animation: ujlFadeUp 0.5s ease-out 0.18s both; }
.ufu-3 { animation: ujlFadeUp 0.5s ease-out 0.30s both; }
.ufu-4 { animation: ujlFadeUp 0.5s ease-out 0.44s both; }

/* ── Kalkulator float ── */
@keyframes calcFloat {
  0%,100% { transform: translateY(0); }
  50%     { transform: translateY(-7px); }
}
.calc-float { animation: calcFloat 5.5s ease-in-out infinite; }

/* ── Shimmer sweep di card kalkulator ── */
@keyframes shimmerSweep {
  0%   { transform: translateX(-100%) skewX(-12deg); }
  100% { transform: translateX(260%) skewX(-12deg); }
}
.ujl-shimmer { position: relative; overflow: hidden; }
.ujl-shimmer::after {
  content: '';
  position: absolute;
  inset: 0;
  background: linear-gradient(90deg, transparent 0%, rgba(255,255,255,0.06) 50%, transparent 100%);
  animation: shimmerSweep 3.5s ease-in-out infinite;
  pointer-events: none;
}

/* ── CTA button glow — pulse gold ── */
@keyframes payGlow {
  0%,100% { box-shadow: 0 0 0 0 rgba(212,175,55,0.4), 0 4px 20px rgba(212,175,55,0.3); }
  50%     { box-shadow: 0 0 0 8px rgba(212,175,55,0), 0 4px 32px rgba(212,175,55,0.55); }
}
.pay-glow { animation: payGlow 2.6s ease-in-out infinite; }

/* ── Step connector line grow ── */
@keyframes lineGrow {
  from { transform: scaleY(0); opacity: 0; }
  to   { transform: scaleY(1); opacity: 1; }
}
.step-line { animation: lineGrow 0.6s ease-out 0.5s both; transform-origin: top; }

/* ── Badge blink ── */
@keyframes badgeBlink {
  0%,100% { opacity: 1; }
  50%     { opacity: 0.55; }
}
.badge-dot { animation: badgeBlink 2.2s ease-in-out infinite; }

/* ── Result reveal ── */
@keyframes resultReveal {
  from { opacity: 0; transform: scale(0.96) translateY(6px); }
  to   { opacity: 1; transform: scale(1) translateY(0); }
}
.result-reveal { animation: resultReveal 0.35s cubic-bezier(0.34,1.56,0.64,1) forwards; }

/* ── Content section fade ── */
@keyframes sectionFade {
  from { opacity: 0; transform: translateY(14px); }
  to   { opacity: 1; transform: translateY(0); }
}
.section-fade { animation: sectionFade 0.5s ease-out 0.2s both; }
`;

/* ═══════════════════════════════════════════════════════════════
   KOMPONEN UTAMA
═══════════════════════════════════════════════════════════════ */
const SimulasiUJLPage: React.FC = () => {
    const navigate = useNavigate();

    /* ── Dark Mode — sinkron dengan preferensi App.tsx via localStorage ── */
    const [isDark, setIsDark] = useState(() => {
        try { return localStorage.getItem('pkn-theme') === 'dark'; } catch { return false; }
    });
    useEffect(() => {
        document.documentElement.classList.toggle('dark', isDark);
        try { localStorage.setItem('pkn-theme', isDark ? 'dark' : 'light'); } catch { /* noop */ }
    }, [isDark]);

    /* ── Kalkulator UJL state ── */
    const [nilaiLimit, setNilaiLimit] = useState('');
    const [showResult, setShowResult] = useState(false);

    /* ── handleInput: strip SEMUA non-digit sebelum simpan ke state.
       Mencegah bug parseInt("500.000.000") = 500 karena berhenti di titik. */
    const handleInput = (raw: string) => {
        const digits = raw.replace(/\D/g, '');
        setNilaiLimit(digits);
        setShowResult(false);
    };

    /* ── Kalkulasi UJL: 20% × nilai limit (PMK 27/PMK.06/2016 Pasal 26).
       Tidak ada floor — minimum UJL mengikuti nilai limit object lelang. */
    const nilaiLimitNum = parseInt(nilaiLimit || '0', 10);
    const ujlAmount = nilaiLimitNum > 0 ? Math.round(nilaiLimitNum * 0.2) : 0;

    /* ── Format angka ke Rupiah ── */
    const fmt = (n: number) => n > 0 ? `Rp ${n.toLocaleString('id-ID')}` : '—';

    /* ── 4-step alur pembayaran digital ── */
    const steps = [
        {
            no: '01',
            icon: <BookOpen className="w-5 h-5" />,
            label: 'Pelajari SOP Lelang BMN',
            sub: 'Baca ketentuan, syarat peserta, dan regulasi di Knowledge Base KPKNL Kendari sebelum mendaftar.',
            color: 'from-emerald-400 to-teal-500',
        },
        {
            no: '02',
            icon: <Calculator className="w-5 h-5" />,
            label: 'Hitung Estimasi UJL',
            sub: 'Gunakan kalkulator di atas. Masukkan nilai limit lelang — UJL adalah 20% dari nilai tersebut.',
            color: 'from-amber-400 to-orange-500',
        },
        {
            no: '03',
            icon: <CreditCard className="w-5 h-5" />,
            label: 'Bayar via Mayar',
            sub: 'Klik tombol "Lanjutkan ke Mayar" di bawah. Selesaikan pembayaran digital — cepat, aman, terverifikasi.',
            color: 'from-blue-400 to-indigo-500',
        },
        {
            no: '04',
            icon: <BadgeCheck className="w-5 h-5" />,
            label: 'Terima Bukti Pembayaran',
            sub: 'Bukti konfirmasi dikirim otomatis ke email dan WhatsApp Anda sebagai tanda UJL telah diterima.',
            color: 'from-rose-400 to-pink-500',
        },
    ];

    /* ── Regulasi reference cards ── */
    const regulasi = [
        {
            kode: 'PMK 27/PMK.06/2016',
            judul: 'Petunjuk Pelaksanaan Lelang',
            pasal: 'Pasal 26 — UJL ditetapkan paling sedikit 20% dari nilai limit',
        },
        {
            kode: 'PMK 213/PMK.06/2020',
            judul: 'Perubahan atas PMK 27/2016',
            pasal: 'Mempertegas ketentuan penyetoran dan pengembalian UJL',
        },
        {
            kode: 'PP No. 28 Tahun 2015',
            judul: 'Tarif PNBP DJKN',
            pasal: 'Dasar pengenaan Bea Lelang atas objek lelang BMN',
        },
    ];

    /* ──────────────────────────────────────────────────────────────
       RENDER
    ────────────────────────────────────────────────────────────── */
    return (
        <div
            className="min-h-screen bg-[#F4F7F5] dark:bg-[#0d1a12] font-sans transition-colors duration-300 flex flex-col"
            style={{
                backgroundImage: isDark
                    ? 'radial-gradient(rgba(255,255,255,0.022) 1px, transparent 1px)'
                    : 'radial-gradient(rgba(13,92,53,0.04) 1px, transparent 1px)',
                backgroundSize: '28px 28px',
            }}
        >
            {/* ── SEO ── */}
            <Helmet>
                <title>Simulasi UJL Lelang BMN — Layanan Digital KPKNL Kendari</title>
                <meta
                    name="description"
                    content="Hitung estimasi Uang Jaminan Lelang (UJL) Barang Milik Negara secara digital via Mayar. Berdasarkan PMK 27/PMK.06/2016 Pasal 26 — KPKNL Kendari DJKN."
                />
                <meta name="keywords" content="UJL, Uang Jaminan Lelang, BMN, Lelang BMN, KPKNL Kendari, Mayar, PMK 27 2016, DJKN" />
                <meta property="og:title" content="Simulasi UJL Lelang BMN — KPKNL Kendari" />
                <meta property="og:description" content="Kalkulator interaktif Uang Jaminan Lelang (UJL) BMN via Mayar SimplePay." />
            </Helmet>

            <style dangerouslySetInnerHTML={{ __html: PAGE_CSS }} />

            {/* ══════════════════════════════════════════════════════════
          HERO HEADER — green gradient + breadcrumb (pola SearchPage)
      ══════════════════════════════════════════════════════════ */}
            <div className="relative bg-gradient-to-br from-[#0D5C35] via-[#0A492A] to-[#062B18] pt-12 pb-14 px-4 overflow-hidden">
                {/* Blob dekorasi */}
                <div className="absolute inset-0 pointer-events-none overflow-hidden">
                    <div className="ujl-blob-1 absolute -top-20 -left-16 w-[400px] h-[400px] rounded-full bg-emerald-400/18 blur-3xl" />
                    <div className="ujl-blob-2 absolute -bottom-16 -right-12 w-[360px] h-[360px] rounded-full bg-[#D4AF37]/12 blur-3xl" />
                </div>
                {/* Grid dot */}
                <div className="absolute inset-0 ujl-grid opacity-12 pointer-events-none" />

                <div className="relative z-10 max-w-5xl mx-auto">

                    {/* Breadcrumb + dark toggle */}
                    <nav className="ufu-1 flex items-center gap-1.5 text-xs text-white/50 mb-7">
                        <button
                            onClick={() => navigate('/')}
                            className="hover:text-white transition-colors flex items-center gap-1"
                        >
                            <Home className="w-3.5 h-3.5" /> Beranda
                        </button>
                        <ChevronRight className="w-3 h-3 flex-shrink-0" />
                        <span className="text-white/70">Layanan Digital</span>
                        <ChevronRight className="w-3 h-3 flex-shrink-0" />
                        <span className="text-white font-bold">Simulasi UJL</span>

                        {/* Dark mode toggle — kanan */}
                        <button
                            onClick={() => setIsDark(p => !p)}
                            className="ml-auto p-2 rounded-full bg-white/10 hover:bg-white/20 border border-white/15 transition-all flex-shrink-0"
                            title={isDark ? 'Mode Terang' : 'Mode Gelap'}
                            aria-label={isDark ? 'Aktifkan mode terang' : 'Aktifkan mode gelap'}
                        >
                            {isDark
                                ? <Sun className="w-3.5 h-3.5 text-[#D4AF37]" />
                                : <Moon className="w-3.5 h-3.5 text-white/80" />
                            }
                        </button>
                    </nav>

                    {/* Tombol kembali */}
                    <button
                        onClick={() => navigate(-1)}
                        className="ufu-1 inline-flex items-center gap-2 px-4 py-2 mb-5 bg-white/10 hover:bg-white/20 text-white/80 hover:text-white text-xs font-bold rounded-xl border border-white/15 transition-all"
                    >
                        <ArrowLeft className="w-3.5 h-3.5" /> Kembali
                    </button>

                    {/* Badge status */}
                    <div className="ufu-2 inline-flex items-center gap-2 px-3 py-1.5 bg-[#D4AF37]/15 border border-[#D4AF37]/30 rounded-full mb-4 ml-3 align-middle">
                        <span className="badge-dot w-1.5 h-1.5 rounded-full bg-[#D4AF37]" />
                        <span className="text-[#D4AF37] text-[11px] font-black uppercase tracking-widest">Layanan Digital KPKNL</span>
                    </div>

                    <h1 className="ufu-2 text-3xl md:text-4xl font-black text-white tracking-tight mb-3 leading-tight">
                        Simulasi Uang Jaminan Lelang
                        <span className="block text-[#D4AF37] mt-1">Bayar Digital via Mayar</span>
                    </h1>
                    <p className="ufu-3 text-emerald-100/70 text-sm md:text-base leading-relaxed max-w-2xl mb-5">
                        Hitung estimasi <strong className="text-white">UJL (Uang Jaminan Lelang)</strong> Barang Milik
                        Negara secara digital. Tidak perlu antre di bank — pembayaran terverifikasi otomatis via Mayar.
                    </p>

                    {/* Regulasi pill */}
                    <div className="ufu-3 inline-flex items-center gap-2 px-3 py-1.5 bg-white/8 border border-white/12 rounded-full">
                        <Scale className="w-3.5 h-3.5 text-[#D4AF37]/80 flex-shrink-0" />
                        <span className="text-emerald-100/60 text-[11px] font-medium leading-tight">
                            Berdasarkan PMK 27/PMK.06/2016 tentang Petunjuk Pelaksanaan Lelang, Pasal 26
                        </span>
                    </div>
                </div>
            </div>

            {/* ══════════════════════════════════════════════════════════
          MAIN CONTENT
      ══════════════════════════════════════════════════════════ */}
            <main className="flex-grow max-w-5xl mx-auto w-full px-4 sm:px-6 py-10 md:py-14">

                {/* ── GRID: Kalkulator (kiri) + Steps (kanan) ── */}
                <div className="section-fade grid grid-cols-1 lg:grid-cols-2 gap-8 mb-12">

                    {/* ────── KALKULATOR UJL ────── */}
                    <div className="calc-float">
                        <div className="ujl-shimmer bg-white dark:bg-[#162918] border border-slate-200 dark:border-slate-700 rounded-3xl p-6 sm:p-8 shadow-lg shadow-slate-200/60 dark:shadow-black/30 h-full">

                            {/* Card header */}
                            <div className="flex items-center gap-3 mb-6">
                                <div className="w-11 h-11 rounded-2xl bg-gradient-to-br from-[#0D5C35] to-[#0A492A] flex items-center justify-center shadow-md shadow-emerald-900/20 flex-shrink-0">
                                    <Calculator className="w-5 h-5 text-white" />
                                </div>
                                <div>
                                    <p className="text-slate-800 dark:text-slate-100 font-black text-base leading-tight">Kalkulator UJL</p>
                                    <p className="text-slate-500 dark:text-slate-400 text-xs">20% × Nilai Limit Lelang</p>
                                </div>
                            </div>

                            {/* Divider */}
                            <div className="h-px bg-gradient-to-r from-[#0D5C35]/20 via-[#D4AF37]/20 to-transparent dark:from-emerald-500/20 dark:via-[#D4AF37]/15 mb-6" />

                            {/* Input nilai limit */}
                            <label className="block mb-1.5 text-slate-600 dark:text-slate-400 text-xs font-bold uppercase tracking-wider">
                                Nilai Limit Lelang (Rp)
                            </label>
                            <div className="relative mb-2">
                                <span className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 dark:text-slate-500 text-sm font-bold pointer-events-none select-none">
                                    Rp
                                </span>
                                <input
                                    type="text"
                                    inputMode="numeric"
                                    /* display: format state (digits murni) ke toLocaleString agar muncul titik ribuan */
                                    value={nilaiLimitNum > 0 ? nilaiLimitNum.toLocaleString('id-ID') : ''}
                                    onChange={e => handleInput(e.target.value)}
                                    placeholder="Contoh: 500.000.000"
                                    className="w-full pl-12 pr-4 py-4 rounded-2xl font-bold text-lg text-slate-800 dark:text-white bg-slate-50 dark:bg-[#0d1a12] outline-none transition-all
                    border-2 border-slate-200 dark:border-slate-700
                    focus:border-[#0D5C35] dark:focus:border-emerald-500
                    focus:ring-4 focus:ring-[#0D5C35]/10 dark:focus:ring-emerald-500/10
                    placeholder:text-slate-300 dark:placeholder:text-slate-600"
                                />
                            </div>
                            <p className="text-slate-400 dark:text-slate-500 text-[11px] mb-5 ml-1">
                                Ketik nilai limit lelang sesuai dokumen pengumuman lelang
                            </p>

                            {/* Tombol hitung */}
                            <button
                                onClick={() => { if (nilaiLimitNum > 0) setShowResult(true); }}
                                disabled={nilaiLimitNum <= 0}
                                className="w-full py-4 rounded-2xl font-black text-slate-900 text-sm transition-all
                  bg-[#D4AF37] hover:bg-[#B5952F]
                  disabled:opacity-40 disabled:cursor-not-allowed disabled:hover:bg-[#D4AF37]
                  hover:-translate-y-0.5 active:translate-y-0
                  shadow-lg shadow-[#D4AF37]/25 hover:shadow-[#D4AF37]/40 mb-5"
                            >
                                Hitung Estimasi UJL Saya →
                            </button>

                            {/* ── Hasil kalkulator — muncul dengan animasi ── */}
                            {showResult && ujlAmount > 0 && (
                                <div className="result-reveal rounded-2xl overflow-hidden border border-emerald-200 dark:border-emerald-700/40">
                                    {/* Header hasil */}
                                    <div className="bg-gradient-to-r from-[#0D5C35] to-[#0A3D24] px-5 py-3 flex items-center gap-2">
                                        <CheckCircle2 className="w-4 h-4 text-emerald-300 flex-shrink-0" />
                                        <p className="text-emerald-200/90 text-[10px] font-black uppercase tracking-widest">
                                            Estimasi UJL yang Harus Dibayar
                                        </p>
                                    </div>
                                    {/* Body hasil */}
                                    <div className="bg-emerald-50 dark:bg-emerald-900/15 px-5 py-5">
                                        <p className="text-4xl font-black text-[#0D5C35] dark:text-emerald-400 tracking-tight leading-none mb-3">
                                            {fmt(ujlAmount)}
                                        </p>
                                        {/* Breakdown formula visual */}
                                        <div className="flex items-center flex-wrap gap-1.5 text-[11px] mb-3">
                                            <span className="px-2.5 py-1 bg-white dark:bg-[#162918] border border-slate-200 dark:border-slate-700 rounded-lg text-slate-600 dark:text-slate-300 font-semibold">
                                                {fmt(nilaiLimitNum)}
                                            </span>
                                            <span className="text-slate-400 dark:text-slate-500 font-bold">×</span>
                                            <span className="px-2.5 py-1 bg-[#D4AF37]/15 border border-[#D4AF37]/30 rounded-lg text-amber-700 dark:text-[#D4AF37] font-black">
                                                20%
                                            </span>
                                            <span className="text-slate-400 dark:text-slate-500 font-bold">=</span>
                                            <span className="px-2.5 py-1 bg-[#0D5C35]/10 dark:bg-emerald-500/15 border border-[#0D5C35]/20 dark:border-emerald-500/25 rounded-lg text-[#0D5C35] dark:text-emerald-400 font-black">
                                                {fmt(ujlAmount)}
                                            </span>
                                        </div>
                                        {/* Disclaimer */}
                                        <div className="flex items-start gap-1.5">
                                            <Info className="w-3 h-3 text-slate-400 flex-shrink-0 mt-0.5" />
                                            <p className="text-slate-400 dark:text-slate-500 text-[10px] leading-relaxed">
                                                Bersifat ilustratif · PMK 27/PMK.06/2016 Ps. 26 · Nilai aktual ditetapkan oleh Pejabat Lelang KPKNL
                                            </p>
                                        </div>
                                    </div>
                                </div>
                            )}

                            {/* Info box — muncul saat belum ada input */}
                            {!showResult && (
                                <div className="flex items-start gap-3 p-4 bg-amber-50 dark:bg-amber-900/10 border border-amber-200 dark:border-amber-700/20 rounded-2xl">
                                    <Info className="w-4 h-4 text-amber-500 flex-shrink-0 mt-0.5" />
                                    <div>
                                        <p className="text-amber-700 dark:text-amber-400 text-xs font-bold mb-0.5">Fitur Simulasi Edukasi</p>
                                        <p className="text-amber-600/80 dark:text-amber-500/80 text-[11px] leading-relaxed">
                                            Nilai UJL aktual ditetapkan oleh Pejabat Lelang resmi KPKNL. Kalkulator ini hanya sebagai panduan awal.
                                        </p>
                                    </div>
                                </div>
                            )}
                        </div>
                    </div>

                    {/* ────── ALUR PEMBAYARAN DIGITAL ────── */}
                    <div className="section-fade flex flex-col">
                        <div className="mb-5">
                            <p className="text-[#0D5C35] dark:text-emerald-400 text-xs font-black uppercase tracking-widest mb-1">
                                Alur Pembayaran Digital
                            </p>
                            <p className="text-slate-500 dark:text-slate-400 text-sm">
                                Ikuti 4 langkah berikut untuk menyelesaikan pembayaran UJL secara digital.
                            </p>
                        </div>

                        <div className="flex-1 space-y-0">
                            {steps.map((s, i) => (
                                <div key={i} className="flex items-start gap-4 group">
                                    {/* Step indicator column */}
                                    <div className="flex flex-col items-center flex-shrink-0">
                                        <div className={`w-10 h-10 rounded-xl bg-gradient-to-br ${s.color} text-white flex items-center justify-center shadow-md group-hover:scale-105 transition-transform duration-300`}>
                                            {s.icon}
                                        </div>
                                        {i < steps.length - 1 && (
                                            <div className="step-line w-0.5 h-10 mt-1 bg-gradient-to-b from-slate-300 dark:from-slate-600 to-transparent" />
                                        )}
                                    </div>
                                    {/* Step content */}
                                    <div className={`${i < steps.length - 1 ? 'pb-8' : 'pb-0'} pt-1.5 flex-1`}>
                                        <div className="flex items-center gap-2 mb-0.5">
                                            <span className="text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest">
                                                Langkah {s.no}
                                            </span>
                                        </div>
                                        <p className="text-slate-800 dark:text-slate-100 font-black text-sm leading-tight mb-1">
                                            {s.label}
                                        </p>
                                        <p className="text-slate-500 dark:text-slate-400 text-xs leading-relaxed">
                                            {s.sub}
                                        </p>
                                    </div>
                                </div>
                            ))}
                        </div>

                        {/* Benefit chips */}
                        <div className="mt-6 flex flex-wrap gap-2">
                            {[
                                { icon: <Zap className="w-3 h-3" />, label: 'Proses Instan' },
                                { icon: <ShieldCheck className="w-3 h-3" />, label: 'Transaksi Aman' },
                                { icon: <BadgeCheck className="w-3 h-3" />, label: 'Konfirmasi Otomatis' },
                                { icon: <Landmark className="w-3 h-3" />, label: 'Sesuai Regulasi' },
                            ].map(c => (
                                <span
                                    key={c.label}
                                    className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-white dark:bg-[#162918] border border-slate-200 dark:border-slate-700 rounded-full text-slate-600 dark:text-slate-300 text-xs font-semibold shadow-sm"
                                >
                                    <span className="text-[#0D5C35] dark:text-emerald-400">{c.icon}</span>
                                    {c.label}
                                </span>
                            ))}
                        </div>
                    </div>
                </div>

                {/* ── DIVIDER ── */}
                <div className="relative flex items-center gap-5 mb-10">
                    <div className="flex-1 h-px bg-gradient-to-r from-transparent via-slate-300 dark:via-slate-600 to-transparent" />
                    <div className="flex items-center gap-2 px-3 py-1.5 bg-white dark:bg-[#162918] border border-slate-200 dark:border-slate-700 rounded-full shadow-sm">
                        <Wallet className="w-3.5 h-3.5 text-[#D4AF37]" />
                        <span className="text-slate-600 dark:text-slate-300 text-[11px] font-black uppercase tracking-widest">Lanjutkan Pembayaran</span>
                    </div>
                    <div className="flex-1 h-px bg-gradient-to-r from-transparent via-slate-300 dark:via-slate-600 to-transparent" />
                </div>

                {/* ── CTA MAYAR ── */}
                <div className="section-fade mb-12">
                    <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-[#0D5C35] via-[#0A3D24] to-[#062B18] p-8 md:p-10 shadow-2xl shadow-emerald-900/25">
                        {/* Dekorasi dalam card */}
                        <div className="absolute inset-0 ujl-grid opacity-15 pointer-events-none" />
                        <div className="absolute -top-12 -right-12 w-52 h-52 rounded-full bg-[#D4AF37]/10 blur-3xl pointer-events-none" />
                        <div className="absolute -bottom-8 -left-8 w-40 h-40 rounded-full bg-white/5 blur-2xl pointer-events-none" />

                        <div className="relative z-10 flex flex-col md:flex-row items-center gap-8">
                            {/* Kiri: info */}
                            <div className="flex-1 text-center md:text-left">
                                <div className="inline-flex items-center gap-2 px-3 py-1 bg-[#D4AF37]/15 border border-[#D4AF37]/25 rounded-full text-[#D4AF37] text-[11px] font-black uppercase tracking-widest mb-4">
                                    <span className="badge-dot w-1.5 h-1.5 rounded-full bg-[#D4AF37]" />
                                    Powered by Mayar SimplePay
                                </div>
                                <h2 className="text-xl md:text-2xl font-black text-white leading-tight mb-3">
                                    Siap Bayar UJL <span className="text-[#D4AF37]">Sekarang?</span>
                                </h2>
                                <p className="text-emerald-100/65 text-sm leading-relaxed max-w-md">
                                    Klik tombol di samping untuk melanjutkan ke platform Mayar.
                                    Pembayaran digital aman, cepat, dan terdokumentasi otomatis.
                                </p>
                            </div>

                            {/* Kanan: tombol */}
                            <div className="flex flex-col items-center gap-3 flex-shrink-0">
                                <a
                                    href="https://mayar.id"
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="pay-glow inline-flex items-center gap-3 px-8 py-4 bg-[#D4AF37] hover:bg-[#C9A832] text-slate-900 font-black text-base rounded-2xl transition-all duration-300 hover:-translate-y-0.5 active:translate-y-0 group whitespace-nowrap"
                                >
                                    <Wallet className="w-5 h-5 group-hover:scale-110 transition-transform" />
                                    Lanjutkan ke Mayar
                                    <ExternalLink className="w-4 h-4 group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-transform" />
                                </a>
                                <div className="flex items-center gap-1.5">
                                    <ShieldCheck className="w-3.5 h-3.5 text-emerald-400/70" />
                                    <span className="text-emerald-100/50 text-[11px] font-medium">Transaksi dienkripsi & aman</span>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                {/* ── REFERENSI REGULASI ── */}
                <div className="section-fade mb-10">
                    <div className="flex items-center gap-3 mb-5">
                        <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-[#0D5C35] to-[#0A492A] flex items-center justify-center shadow-md">
                            <Scale className="w-4 h-4 text-white" />
                        </div>
                        <div>
                            <p className="text-slate-800 dark:text-slate-100 font-black text-base leading-none">Dasar Hukum</p>
                            <p className="text-slate-500 dark:text-slate-400 text-xs mt-0.5">Regulasi yang mengatur Uang Jaminan Lelang BMN</p>
                        </div>
                    </div>
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                        {regulasi.map((r, i) => (
                            <div
                                key={i}
                                className="bg-white dark:bg-[#162918] border border-slate-200 dark:border-slate-700 rounded-2xl p-5 hover:border-[#0D5C35]/30 dark:hover:border-emerald-500/30 hover:shadow-md transition-all duration-300 group"
                            >
                                <div className="inline-flex items-center gap-1.5 px-2.5 py-1 bg-[#0D5C35]/8 dark:bg-emerald-500/10 border border-[#0D5C35]/15 dark:border-emerald-500/20 rounded-lg mb-3">
                                    <span className="text-[#0D5C35] dark:text-emerald-400 text-[10px] font-black uppercase tracking-wide">{r.kode}</span>
                                </div>
                                <p className="text-slate-700 dark:text-slate-200 font-bold text-sm leading-snug mb-2 group-hover:text-[#0D5C35] dark:group-hover:text-emerald-400 transition-colors">
                                    {r.judul}
                                </p>
                                <p className="text-slate-400 dark:text-slate-500 text-xs leading-relaxed">{r.pasal}</p>
                            </div>
                        ))}
                    </div>
                </div>

                {/* ── TOMBOL KEMBALI KE BERANDA ── */}
                <div className="section-fade flex flex-col sm:flex-row items-center justify-center gap-3">
                    <button
                        onClick={() => navigate('/')}
                        className="flex items-center gap-2 px-6 py-3 bg-[#0D5C35] hover:bg-[#0A492A] text-white rounded-xl font-bold shadow-lg shadow-emerald-200/40 dark:shadow-emerald-900/30 hover:-translate-y-0.5 transition-all text-sm"
                    >
                        <Home className="w-4 h-4" /> Kembali ke Beranda
                    </button>
                    <button
                        onClick={() => navigate(-1)}
                        className="flex items-center gap-2 px-6 py-3 bg-white dark:bg-[#162918] hover:bg-slate-50 dark:hover:bg-[#1a3021] text-slate-600 dark:text-slate-300 rounded-xl font-bold border border-slate-200 dark:border-slate-700 hover:border-slate-300 transition-all text-sm shadow-sm"
                    >
                        <ArrowLeft className="w-4 h-4" /> Halaman Sebelumnya
                    </button>
                    <button
                        onClick={() => navigate('/search')}
                        className="flex items-center gap-2 px-6 py-3 bg-white dark:bg-[#162918] hover:bg-slate-50 dark:hover:bg-[#1a3021] text-slate-600 dark:text-slate-300 rounded-xl font-bold border border-slate-200 dark:border-slate-700 hover:border-slate-300 transition-all text-sm shadow-sm"
                    >
                        <ArrowRight className="w-4 h-4" /> Cari Dokumen Lainnya
                    </button>
                </div>

            </main>

            {/* ── FOOTER MINI ── */}
            <footer className="border-t border-slate-200 dark:border-slate-700 py-4 text-center">
                <p className="text-xs text-slate-400 dark:text-slate-500">
                    Knowledge Base KPKNL Kendari · Direktorat Jenderal Kekayaan Negara · Kementerian Keuangan RI
                </p>
            </footer>
        </div>
    );
};

export default SimulasiUJLPage;