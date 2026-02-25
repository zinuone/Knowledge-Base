// File: src/pages/LoginPage.tsx
// ─── FITUR LOGIN ──────────────────────────────────────────────────────────────
//  ✅ Show / Hide Password (Eye / EyeOff toggle)
//  ✅ Caps Lock Detection + peringatan
//  ✅ Remember Me (simpan email ke localStorage)
//  ✅ Login Attempt Counter → lockout 30 detik setelah 5 kali gagal
//  ✅ Pesan error spesifik per kode Firebase
//  ✅ Dark Mode (baca dari localStorage 'pkn-theme', dengan toggle)
//  ✅ Reset Password via email
//  ✅ Mobile-first — full screen form di mobile, split panel di desktop
//  ✅ Auto-focus & auto-fill email dari "Ingat Email"
// ─────────────────────────────────────────────────────────────────────────────
import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { signInWithEmailAndPassword, sendPasswordResetEmail } from 'firebase/auth';
import { auth } from '../firebase';
import {
    Lock, Mail, ArrowLeft, AlertCircle, Loader2, CheckCircle2,
    Shield, FileText, BarChart3, BookOpen, Eye, EyeOff,
    Moon, Sun, KeyRound, AlertTriangle,
} from 'lucide-react';

/* ─── CSS Animasi ─────────────────────────────────────────────── */
const LOGIN_CSS = `
@keyframes loginBlob1 {
  0%,100% { transform: translate(0,0) scale(1); }
  33%     { transform: translate(40px,-25px) scale(1.07); }
  66%     { transform: translate(-15px,30px) scale(0.95); }
}
@keyframes loginBlob2 {
  0%,100% { transform: translate(0,0) scale(1); }
  50%     { transform: translate(-35px,25px) scale(1.1); }
}
@keyframes loginGridPan {
  0%   { background-position: 0 0; }
  100% { background-position: 48px 48px; }
}
@keyframes loginParticle {
  0%,100% { transform: translateY(0) rotate(0deg); opacity: 0.35; }
  50%     { transform: translateY(-22px) rotate(180deg); opacity: 0.75; }
}
@keyframes loginCardFloat {
  0%,100% { transform: translateY(0px); }
  50%     { transform: translateY(-8px); }
}
@keyframes loginFadeIn {
  from { opacity: 0; transform: translateX(-12px); }
  to   { opacity: 1; transform: translateX(0); }
}
@keyframes loginShake {
  0%,100% { transform: translateX(0); }
  20%,60% { transform: translateX(-6px); }
  40%,80% { transform: translateX(6px); }
}
@keyframes loginCountdown {
  from { stroke-dashoffset: 0; }
  to   { stroke-dashoffset: 88; }
}
.login-blob-1    { animation: loginBlob1 18s ease-in-out infinite; }
.login-blob-2    { animation: loginBlob2 22s ease-in-out infinite; }
.login-hero-grid {
  background-image: radial-gradient(circle, rgba(255,255,255,0.10) 1px, transparent 1px);
  background-size: 48px 48px;
  animation: loginGridPan 14s linear infinite;
}
.login-particle  { animation: loginParticle 4s ease-in-out infinite; }
.login-card-float { animation: loginCardFloat 5s ease-in-out infinite; }
.login-stat-item {
  animation: loginFadeIn 0.5s ease-out forwards;
  opacity: 0;
}
.login-shake { animation: loginShake 0.4s ease-in-out; }
`;

/* ─── Constants ───────────────────────────────────────────────── */
const MAX_ATTEMPTS   = 5;
const LOCKOUT_SECS   = 30;
const REMEMBER_KEY   = 'pkn-remember-email';
const ATTEMPT_KEY    = 'pkn-login-attempts';
const LOCKOUT_KEY    = 'pkn-lockout-until';

/* ─── Firebase Error Map ──────────────────────────────────────── */
const getFirebaseErrorMsg = (code: string): string => {
    const map: Record<string, string> = {
        'auth/invalid-credential':    'Email atau password salah. Periksa kembali.',
        'auth/user-not-found':        'Email tidak terdaftar dalam sistem.',
        'auth/wrong-password':        'Password yang Anda masukkan salah.',
        'auth/invalid-email':         'Format email tidak valid.',
        'auth/user-disabled':         'Akun ini telah dinonaktifkan.',
        'auth/too-many-requests':     'Terlalu banyak percobaan. Coba lagi nanti.',
        'auth/network-request-failed':'Koneksi jaringan gagal. Cek internet Anda.',
    };
    return map[code] ?? 'Terjadi kesalahan. Silakan coba lagi.';
};

/* ══════════════════════════════════════════════════════════════
   KOMPONEN
══════════════════════════════════════════════════════════════ */
const LoginPage: React.FC = () => {
    const [email,       setEmail]       = useState('');
    const [password,    setPassword]    = useState('');
    const [showPass,    setShowPass]    = useState(false);
    const [capsLock,    setCapsLock]    = useState(false);
    const [rememberMe,  setRememberMe]  = useState(false);
    const [error,       setError]       = useState('');
    const [successMsg,  setSuccessMsg]  = useState('');
    const [loading,     setLoading]     = useState(false);
    const [isResetMode, setIsResetMode] = useState(false);
    const [attempts,    setAttempts]    = useState(0);
    const [lockoutLeft, setLockoutLeft] = useState(0);
    const [shakeForm,   setShakeForm]   = useState(false);

    /* Dark Mode */
    const [isDark, setIsDark] = useState(() => {
        try { return localStorage.getItem('pkn-theme') === 'dark'; } catch { return false; }
    });
    useEffect(() => {
        document.documentElement.classList.toggle('dark', isDark);
        try { localStorage.setItem('pkn-theme', isDark ? 'dark' : 'light'); } catch {}
    }, [isDark]);

    const emailRef    = useRef<HTMLInputElement>(null);
    const navigate    = useNavigate();

    /* ── Init: baca remember + attempt + lockout dari localStorage ── */
    useEffect(() => {
        try {
            const saved = localStorage.getItem(REMEMBER_KEY);
            if (saved) { setEmail(saved); setRememberMe(true); }

            const savedAttempts = parseInt(localStorage.getItem(ATTEMPT_KEY) ?? '0');
            const lockUntil     = parseInt(localStorage.getItem(LOCKOUT_KEY) ?? '0');
            const now           = Date.now();

            if (lockUntil > now) {
                setAttempts(savedAttempts);
                const left = Math.ceil((lockUntil - now) / 1000);
                setLockoutLeft(left);
            } else {
                // Lockout sudah kadaluarsa, reset
                if (lockUntil > 0) {
                    localStorage.removeItem(ATTEMPT_KEY);
                    localStorage.removeItem(LOCKOUT_KEY);
                }
                setAttempts(savedAttempts < MAX_ATTEMPTS ? savedAttempts : 0);
            }
        } catch {}
        // Auto-focus email jika kosong, password jika sudah ada email
        setTimeout(() => emailRef.current?.focus(), 300);
    }, []);

    /* ── Countdown timer ── */
    useEffect(() => {
        if (lockoutLeft <= 0) return;
        const timer = setInterval(() => {
            setLockoutLeft(p => {
                if (p <= 1) {
                    clearInterval(timer);
                    localStorage.removeItem(ATTEMPT_KEY);
                    localStorage.removeItem(LOCKOUT_KEY);
                    setAttempts(0);
                    setError('');
                    return 0;
                }
                return p - 1;
            });
        }, 1000);
        return () => clearInterval(timer);
    }, [lockoutLeft]);

    /* ── Caps Lock detection ── */
    const handleKeyDown = (e: React.KeyboardEvent) => {
        setCapsLock(e.getModifierState?.('CapsLock') ?? false);
    };
    const handleKeyUp = (e: React.KeyboardEvent) => {
        setCapsLock(e.getModifierState?.('CapsLock') ?? false);
    };

    /* ── Trigger shake ── */
    const triggerShake = () => {
        setShakeForm(true);
        setTimeout(() => setShakeForm(false), 450);
    };

    /* ── Login handler ── */
    const handleLogin = async (e: React.FormEvent) => {
        e.preventDefault();
        setError('');
        if (lockoutLeft > 0) return;
        setLoading(true);
        try {
            await signInWithEmailAndPassword(auth, email, password);
            // Sukses — simpan / hapus email
            if (rememberMe) {
                localStorage.setItem(REMEMBER_KEY, email);
            } else {
                localStorage.removeItem(REMEMBER_KEY);
            }
            // Reset attempts
            localStorage.removeItem(ATTEMPT_KEY);
            localStorage.removeItem(LOCKOUT_KEY);
            navigate('/admin');
        } catch (err: any) {
            const newAttempts = attempts + 1;
            setAttempts(newAttempts);
            localStorage.setItem(ATTEMPT_KEY, String(newAttempts));
            triggerShake();

            if (newAttempts >= MAX_ATTEMPTS) {
                const lockUntil = Date.now() + LOCKOUT_SECS * 1000;
                localStorage.setItem(LOCKOUT_KEY, String(lockUntil));
                setLockoutLeft(LOCKOUT_SECS);
                setError(`Terlalu banyak percobaan gagal. Silakan tunggu ${LOCKOUT_SECS} detik.`);
            } else {
                setError(`${getFirebaseErrorMsg(err.code)} (${MAX_ATTEMPTS - newAttempts} percobaan tersisa)`);
            }
        } finally { setLoading(false); }
    };

    /* ── Reset Password handler ── */
    const handleResetPassword = async (e: React.FormEvent) => {
        e.preventDefault();
        setError(''); setSuccessMsg(''); setLoading(true);
        try {
            await sendPasswordResetEmail(auth, email);
            setSuccessMsg(`Link reset password telah dikirim ke ${email}. Silakan cek kotak masuk atau folder spam.`);
        } catch (err: any) {
            triggerShake();
            setError(getFirebaseErrorMsg(err.code));
        } finally { setLoading(false); }
    };

    /* ── Data panel kiri ── */
    const particles = [
        { top: '12%', left: '8%',  size: 'w-2 h-2',     delay: '0s'   },
        { top: '28%', left: '85%', size: 'w-3 h-3',     delay: '1.3s' },
        { top: '55%', left: '6%',  size: 'w-1.5 h-1.5', delay: '0.7s' },
        { top: '72%', left: '88%', size: 'w-2.5 h-2.5', delay: '2.1s' },
        { top: '42%', left: '92%', size: 'w-2 h-2',     delay: '1.6s' },
        { top: '82%', left: '35%', size: 'w-1.5 h-1.5', delay: '0.4s' },
        { top: '18%', left: '60%', size: 'w-2 h-2',     delay: '2.6s' },
        { top: '65%', left: '25%', size: 'w-1 h-1',     delay: '1.1s' },
    ];

    const features = [
        { icon: <FileText   className="w-4 h-4" />, label: 'Kelola SOP & Dokumen',    color: 'bg-emerald-400/20 border-emerald-300/30 text-emerald-100', delay: '0.1s'  },
        { icon: <BarChart3  className="w-4 h-4" />, label: 'Dashboard & Statistik',   color: 'bg-[#D4AF37]/20  border-[#D4AF37]/30  text-[#D4AF37]',    delay: '0.25s' },
        { icon: <BookOpen   className="w-4 h-4" />, label: 'Panduan & FAQ',           color: 'bg-blue-400/20   border-blue-300/30   text-blue-200',      delay: '0.4s'  },
        { icon: <Shield     className="w-4 h-4" />, label: 'Akses Aman & Terlindungi',color: 'bg-rose-400/20   border-rose-300/30   text-rose-200',       delay: '0.55s' },
    ];

    /* ── Warna strength password ── */
    const passStrength = (() => {
        if (!password) return null;
        let s = 0;
        if (password.length >= 8) s++;
        if (/[A-Z]/.test(password)) s++;
        if (/[0-9]/.test(password)) s++;
        if (/[^A-Za-z0-9]/.test(password)) s++;
        if      (s <= 1) return { label: 'Lemah',   color: 'bg-rose-500',   w: 'w-1/4' };
        else if (s <= 2) return { label: 'Cukup',   color: 'bg-amber-400',  w: 'w-2/4' };
        else if (s <= 3) return { label: 'Baik',    color: 'bg-blue-500',   w: 'w-3/4' };
        else             return { label: 'Kuat',    color: 'bg-emerald-500',w: 'w-full' };
    })();

    const isLocked = lockoutLeft > 0;

    /* ══════════════════════════════════════════════════════════
       RENDER
    ══════════════════════════════════════════════════════════ */
    return (
        <div className="min-h-screen flex font-sans bg-white dark:bg-[#0d1a12] transition-colors duration-300">
            <style dangerouslySetInnerHTML={{ __html: LOGIN_CSS }} />

            {/* ══════════════════════════════════════════════════════
                PANEL KIRI — animated (desktop only)
            ══════════════════════════════════════════════════════ */}
            <div className="hidden lg:flex lg:w-[52%] relative overflow-hidden items-center justify-center text-white">

                {/* Backgrounds */}
                <div className="absolute inset-0 bg-gradient-to-br from-[#0D5C35] via-[#0A492A] to-[#062B18]" />
                <div className="absolute inset-0 login-hero-grid opacity-20" />
                <div className="absolute inset-0 pointer-events-none overflow-hidden">
                    <div className="login-blob-1 absolute -top-20 -left-16 w-[380px] h-[380px] rounded-full bg-emerald-400/20 blur-3xl" />
                    <div className="login-blob-2 absolute -bottom-20 -right-16 w-[450px] h-[450px] rounded-full bg-[#D4AF37]/12 blur-3xl" />
                    <div className="absolute top-1/2 left-1/3 w-[250px] h-[250px] rounded-full bg-teal-300/10 blur-3xl" style={{ animation: 'loginBlob1 25s ease-in-out infinite reverse' }} />
                </div>
                <div className="absolute inset-0 pointer-events-none overflow-hidden">
                    {particles.map((p, i) => (
                        <div key={i} className={`login-particle absolute ${p.size} rounded-full bg-white/25`} style={{ top: p.top, left: p.left, animationDelay: p.delay }} />
                    ))}
                </div>

                {/* Konten panel kiri */}
                <div className="relative z-10 max-w-md px-10 py-12 flex flex-col gap-10">

                    {/* Logo floating */}
                    <div className="login-card-float">
                        <div className="bg-white/10 backdrop-blur-md p-7 rounded-3xl inline-block shadow-2xl border border-white/10">
                            <img src="/logo-color.png" alt="KPKNL Logo"
                                className="w-40 h-20 object-contain drop-shadow-lg"
                                onError={e => { e.currentTarget.style.display = 'none'; }}
                            />
                        </div>
                    </div>

                    {/* Teks hero */}
                    <div>
                        <div className="inline-flex items-center gap-2 px-3 py-1.5 bg-[#D4AF37]/20 border border-[#D4AF37]/30 rounded-full text-[#D4AF37] text-xs font-bold uppercase tracking-widest mb-5">
                            <Shield className="w-3.5 h-3.5" /> Panel Administrator
                        </div>
                        <h1 className="text-4xl font-black text-white mb-3 leading-tight tracking-tight">
                            Pusat Kendali<br /><span className="text-[#D4AF37]">Knowledge Base</span>
                        </h1>
                        <p className="text-emerald-100/70 text-sm leading-relaxed">
                            Kelola seluruh SOP, regulasi, dan informasi layanan pengelolaan kekayaan negara KPKNL Kendari dari satu dasbor terpadu.
                        </p>
                    </div>

                    {/* Feature list */}
                    <div className="space-y-3">
                        {features.map((f, i) => (
                            <div key={i}
                                className={`login-stat-item flex items-center gap-3.5 p-3.5 rounded-2xl backdrop-blur-sm border ${f.color}`}
                                style={{ animationDelay: f.delay }}>
                                <div className="p-2 bg-white/10 rounded-xl flex-shrink-0">{f.icon}</div>
                                <span className="text-sm font-semibold">{f.label}</span>
                            </div>
                        ))}
                    </div>

                    {/* Footer */}
                    <div className="flex items-center gap-3 p-4 bg-white/5 rounded-2xl border border-white/10 text-emerald-100/50 text-xs">
                        <div className="flex items-center gap-1.5">
                            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse flex-shrink-0" />
                            Sistem aktif & aman
                        </div>
                        <span className="h-3 w-px bg-white/10" />
                        <span>KPKNL Kendari © 2026</span>
                    </div>
                </div>
            </div>

            {/* ══════════════════════════════════════════════════════
                PANEL KANAN — form login
            ══════════════════════════════════════════════════════ */}
            <div className="w-full lg:w-[48%] flex flex-col justify-center items-center
                p-5 sm:p-8 md:p-12
                bg-slate-50 dark:bg-[#0d1a12] lg:bg-white lg:dark:bg-[#162918]
                relative min-h-screen lg:min-h-0">

                {/* Top bar: Kembali + Dark Toggle */}
                <div className="absolute top-5 left-5 right-5 sm:top-7 sm:left-8 sm:right-8 flex items-center justify-between">
                    <button onClick={() => navigate('/')}
                        className="flex items-center text-slate-500 dark:text-slate-400 hover:text-[#0D5C35] dark:hover:text-emerald-400 transition-all font-bold text-sm group"
                        aria-label="Kembali ke Beranda">
                        <div className="p-2 bg-white dark:bg-slate-700 border border-slate-200 dark:border-slate-600 rounded-full mr-2.5 shadow-sm group-hover:border-[#0D5C35] dark:group-hover:border-emerald-500 group-hover:scale-110 transition-all">
                            <ArrowLeft className="w-4 h-4" />
                        </div>
                        <span className="hidden sm:inline">Kembali</span>
                    </button>

                    <button
                        onClick={() => setIsDark(p => !p)}
                        className="p-2.5 rounded-xl bg-white dark:bg-slate-700 border border-slate-200 dark:border-slate-600 text-slate-500 dark:text-slate-300 hover:border-[#0D5C35] dark:hover:border-emerald-500 transition-all shadow-sm"
                        aria-label="Toggle dark mode" title={isDark ? 'Mode Terang' : 'Mode Gelap'}>
                        {isDark ? <Sun className="w-4 h-4 text-amber-500" /> : <Moon className="w-4 h-4" />}
                    </button>
                </div>

                {/* Card form */}
                <div className={`w-full max-w-md bg-white dark:bg-[#1a3021] lg:bg-transparent lg:dark:bg-transparent
                    p-7 sm:p-8 lg:p-0
                    rounded-3xl shadow-xl lg:shadow-none
                    border border-slate-100 dark:border-slate-700 lg:border-none
                    animate-in fade-in slide-in-from-bottom-4 duration-700
                    ${shakeForm ? 'login-shake' : ''}
                `}>

                    {/* Header form — logo mobile */}
                    <div className="mb-7 text-center lg:text-left">
                        <div className="lg:hidden mb-6 flex justify-center">
                            <div className="bg-[#0D5C35]/8 dark:bg-[#0D5C35]/20 p-4 rounded-2xl border border-[#0D5C35]/10 dark:border-[#0D5C35]/30">
                                <img src="/logo-color.png" alt="KPKNL" className="w-28 h-12 object-contain"
                                    onError={e => { e.currentTarget.style.display = 'none'; }} />
                            </div>
                        </div>

                        <div className="inline-flex items-center gap-2 px-3 py-1.5 bg-[#0D5C35]/8 dark:bg-[#0D5C35]/20 border border-[#0D5C35]/15 dark:border-[#0D5C35]/30 rounded-full text-[#0D5C35] dark:text-emerald-400 text-xs font-bold uppercase tracking-widest mb-4">
                            <KeyRound className="w-3.5 h-3.5" />
                            {isResetMode ? 'Reset Password' : 'Login Admin'}
                        </div>

                        <h2 className="text-2xl sm:text-3xl font-extrabold text-slate-900 dark:text-slate-100 mb-2 tracking-tight">
                            {isResetMode ? 'Lupa Password?' : 'Selamat Datang 👋'}
                        </h2>
                        <p className="text-slate-500 dark:text-slate-400 text-sm leading-relaxed">
                            {isResetMode
                                ? 'Masukkan email Anda untuk menerima link reset password.'
                                : 'Masuk ke panel administrator KPKNL Kendari.'}
                        </p>
                    </div>

                    {/* Alert: Lockout */}
                    {isLocked && (
                        <div className="mb-5 p-4 bg-rose-50 dark:bg-rose-900/20 border border-rose-200 dark:border-rose-800/40 rounded-2xl animate-in fade-in slide-in-from-top-2 duration-300">
                            <div className="flex items-center gap-3 mb-2">
                                <div className="p-2 bg-rose-100 dark:bg-rose-800/30 rounded-xl flex-shrink-0">
                                    <AlertTriangle className="w-4 h-4 text-rose-600 dark:text-rose-400" />
                                </div>
                                <div>
                                    <p className="font-bold text-rose-700 dark:text-rose-400 text-sm">Akun Dikunci Sementara</p>
                                    <p className="text-rose-600 dark:text-rose-500 text-xs">Terlalu banyak percobaan gagal</p>
                                </div>
                            </div>
                            <div className="flex items-center justify-between bg-rose-100 dark:bg-rose-900/30 rounded-xl p-3">
                                <span className="text-rose-700 dark:text-rose-400 text-xs font-medium">Silakan tunggu...</span>
                                <div className="flex items-center gap-1.5 text-rose-700 dark:text-rose-400">
                                    <span className="text-2xl font-black tabular-nums">{lockoutLeft}</span>
                                    <span className="text-xs font-medium">detik</span>
                                </div>
                            </div>
                        </div>
                    )}

                    {/* Alert: Error */}
                    {error && !isLocked && (
                        <div className="mb-5 p-4 bg-rose-50 dark:bg-rose-900/20 border border-rose-100 dark:border-rose-800/30 rounded-xl flex items-start text-rose-700 dark:text-rose-400 text-sm animate-in fade-in slide-in-from-top-2 duration-300">
                            <AlertCircle className="w-4 h-4 mr-2.5 flex-shrink-0 mt-0.5" />
                            {error}
                        </div>
                    )}

                    {/* Alert: Sukses (reset) */}
                    {successMsg && (
                        <div className="mb-5 p-4 bg-emerald-50 dark:bg-emerald-900/20 border border-emerald-100 dark:border-emerald-800/30 rounded-xl flex items-start text-emerald-700 dark:text-emerald-400 text-sm animate-in fade-in slide-in-from-top-2 duration-300">
                            <CheckCircle2 className="w-4 h-4 mr-2.5 flex-shrink-0 mt-0.5" />
                            {successMsg}
                        </div>
                    )}

                    {/* Attempt indicator (hanya tampil jika ada percobaan gagal) */}
                    {!isLocked && attempts > 0 && attempts < MAX_ATTEMPTS && (
                        <div className="mb-4 flex items-center gap-1.5">
                            <span className="text-xs text-slate-400 dark:text-slate-500 font-medium">Percobaan:</span>
                            <div className="flex gap-1">
                                {Array.from({ length: MAX_ATTEMPTS }).map((_, i) => (
                                    <span key={i} className={`w-4 h-1.5 rounded-full transition-colors ${i < attempts ? 'bg-rose-400' : 'bg-slate-200 dark:bg-slate-600'}`} />
                                ))}
                            </div>
                            <span className="text-xs text-rose-500 dark:text-rose-400 font-bold">{MAX_ATTEMPTS - attempts} tersisa</span>
                        </div>
                    )}

                    {/* Form */}
                    <form onSubmit={isResetMode ? handleResetPassword : handleLogin} className="space-y-4">

                        {/* Email */}
                        <div className="space-y-1.5">
                            <label className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider ml-1">
                                Email Dinas
                            </label>
                            <div className="relative group">
                                <div className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-[#0D5C35] dark:group-focus-within:text-emerald-400 transition-colors pointer-events-none">
                                    <Mail className="w-5 h-5" />
                                </div>
                                <input
                                    ref={emailRef}
                                    type="email"
                                    required
                                    autoComplete="email"
                                    disabled={isLocked}
                                    value={email}
                                    onChange={e => setEmail(e.target.value)}
                                    className="w-full pl-12 pr-4 py-4 rounded-xl border border-slate-200 dark:border-slate-600
                                        bg-slate-50 dark:bg-[#0f1f16] dark:text-slate-200
                                        focus:bg-white dark:focus:bg-[#0f1f16]
                                        focus:border-[#0D5C35] dark:focus:border-emerald-500
                                        focus:ring-4 focus:ring-[#0D5C35]/10 dark:focus:ring-emerald-500/10
                                        outline-none transition-all font-medium text-slate-800
                                        placeholder:text-slate-400 text-sm
                                        disabled:opacity-50 disabled:cursor-not-allowed"
                                    placeholder="nama@kpknl.go.id"
                                />
                            </div>
                        </div>

                        {/* Password */}
                        {!isResetMode && (
                            <div className="space-y-1.5">
                                <div className="flex justify-between items-center ml-1">
                                    <label className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">Password</label>
                                    <button type="button"
                                        onClick={() => { setIsResetMode(true); setError(''); setSuccessMsg(''); }}
                                        className="text-xs font-bold text-[#0D5C35] dark:text-emerald-400 hover:underline transition-colors">
                                        Lupa Password?
                                    </button>
                                </div>
                                <div className="relative group">
                                    <div className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-[#0D5C35] dark:group-focus-within:text-emerald-400 transition-colors pointer-events-none">
                                        <Lock className="w-5 h-5" />
                                    </div>
                                    <input
                                        type={showPass ? 'text' : 'password'}
                                        required
                                        autoComplete="current-password"
                                        disabled={isLocked}
                                        value={password}
                                        onChange={e => setPassword(e.target.value)}
                                        onKeyDown={handleKeyDown}
                                        onKeyUp={handleKeyUp}
                                        className="w-full pl-12 pr-12 py-4 rounded-xl border border-slate-200 dark:border-slate-600
                                            bg-slate-50 dark:bg-[#0f1f16] dark:text-slate-200
                                            focus:bg-white dark:focus:bg-[#0f1f16]
                                            focus:border-[#0D5C35] dark:focus:border-emerald-500
                                            focus:ring-4 focus:ring-[#0D5C35]/10 dark:focus:ring-emerald-500/10
                                            outline-none transition-all font-medium text-slate-800
                                            placeholder:text-slate-400 text-sm
                                            disabled:opacity-50 disabled:cursor-not-allowed"
                                        placeholder="••••••••"
                                    />
                                    {/* Show/hide toggle */}
                                    <button type="button" onClick={() => setShowPass(p => !p)}
                                        className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-300 transition-colors p-1 rounded-lg"
                                        aria-label={showPass ? 'Sembunyikan password' : 'Tampilkan password'}>
                                        {showPass ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                                    </button>
                                </div>

                                {/* Caps Lock warning */}
                                {capsLock && (
                                    <div className="flex items-center gap-2 px-3 py-1.5 bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-700/30 rounded-lg animate-in fade-in slide-in-from-top-1 duration-200">
                                        <AlertTriangle className="w-3.5 h-3.5 text-amber-500 flex-shrink-0" />
                                        <span className="text-xs font-bold text-amber-600 dark:text-amber-400">Caps Lock aktif — perhatikan huruf kapital</span>
                                    </div>
                                )}

                                {/* Password strength bar */}
                                {password.length > 0 && passStrength && (
                                    <div className="space-y-1">
                                        <div className="h-1 w-full bg-slate-100 dark:bg-slate-700 rounded-full overflow-hidden">
                                            <div className={`h-full ${passStrength.w} ${passStrength.color} rounded-full transition-all duration-400`} />
                                        </div>
                                        <p className="text-xs text-slate-400 dark:text-slate-500 px-1">
                                            Kekuatan: <span className="font-bold text-slate-600 dark:text-slate-300">{passStrength.label}</span>
                                        </p>
                                    </div>
                                )}
                            </div>
                        )}

                        {/* Remember Me — hanya di mode login */}
                        {!isResetMode && (
                            <div className="flex items-center gap-3 py-1">
                                <div className="relative">
                                    <input
                                        type="checkbox"
                                        id="remember-me"
                                        checked={rememberMe}
                                        onChange={e => setRememberMe(e.target.checked)}
                                        className="sr-only peer"
                                    />
                                    <div className="w-10 h-5 bg-slate-200 dark:bg-slate-600 peer-checked:bg-[#0D5C35] dark:peer-checked:bg-emerald-500 rounded-full transition-colors cursor-pointer"
                                        onClick={() => setRememberMe(p => !p)} />
                                    <div className="absolute top-0.5 left-0.5 w-4 h-4 bg-white rounded-full shadow-sm transition-transform peer-checked:translate-x-5 cursor-pointer"
                                        onClick={() => setRememberMe(p => !p)} />
                                </div>
                                <label htmlFor="remember-me" className="text-sm text-slate-600 dark:text-slate-400 font-medium cursor-pointer select-none"
                                    onClick={() => setRememberMe(p => !p)}>
                                    Ingat email saya
                                </label>
                            </div>
                        )}

                        {/* Submit */}
                        <button type="submit" disabled={loading || isLocked}
                            className="w-full py-4 bg-gradient-to-br from-[#0D5C35] to-[#0A492A]
                                hover:from-[#0A492A] hover:to-[#083D23]
                                text-white font-bold rounded-xl
                                shadow-lg shadow-[#0D5C35]/25
                                hover:shadow-[#0D5C35]/40 hover:-translate-y-0.5
                                transition-all active:scale-[0.98]
                                disabled:opacity-60 disabled:cursor-not-allowed disabled:translate-y-0
                                flex items-center justify-center gap-2 mt-2">
                            {loading ? (
                                <><Loader2 className="w-5 h-5 animate-spin" /> Memproses...</>
                            ) : isLocked ? (
                                <><AlertTriangle className="w-5 h-5" /> Tunggu {lockoutLeft}s...</>
                            ) : (
                                isResetMode ? '📧 Kirim Link Reset' : '🔐 Masuk Dashboard'
                            )}
                        </button>

                        {/* Kembali ke login dari reset */}
                        {isResetMode && (
                            <button type="button"
                                onClick={() => { setIsResetMode(false); setError(''); setSuccessMsg(''); }}
                                className="w-full py-3 bg-white dark:bg-slate-700 border border-slate-200 dark:border-slate-600 text-slate-600 dark:text-slate-300 font-bold rounded-xl hover:bg-slate-50 dark:hover:bg-slate-600 transition-all text-sm">
                                ← Kembali ke Login
                            </button>
                        )}
                    </form>

                    {/* Security Notice */}
                    <div className="mt-8 flex items-start gap-3 p-4 bg-slate-50 dark:bg-slate-800/40 rounded-2xl border border-slate-100 dark:border-slate-700">
                        <Shield className="w-4 h-4 text-slate-400 dark:text-slate-500 flex-shrink-0 mt-0.5" />
                        <p className="text-xs text-slate-400 dark:text-slate-500 leading-relaxed">
                            Halaman ini hanya untuk administrator yang berwenang. Akses tidak sah adalah pelanggaran kebijakan keamanan KPKNL Kendari.
                        </p>
                    </div>

                    {/* Footer */}
                    <div className="mt-6 pt-5 border-t border-slate-100 dark:border-slate-700 text-center">
                        <p className="text-xs text-slate-400 dark:text-slate-500 font-medium">
                            © 2026 KPKNL Kendari — Sistem Informasi Manajemen Kekayaan Negara
                        </p>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default LoginPage;