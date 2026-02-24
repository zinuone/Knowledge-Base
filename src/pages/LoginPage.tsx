// File: src/pages/LoginPage.tsx
import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { signInWithEmailAndPassword, sendPasswordResetEmail } from 'firebase/auth';
import { auth } from '../firebase';
import {
    Lock, Mail, ArrowLeft, AlertCircle, Loader2, CheckCircle2,
    Shield, FileText, BarChart3, BookOpen,
} from 'lucide-react';

/* ─── CSS animasi panel kiri (konsisten dengan App.tsx) ────── */
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
.login-blob-1    { animation: loginBlob1 18s ease-in-out infinite; }
.login-blob-2    { animation: loginBlob2 22s ease-in-out infinite; }
.login-hero-grid {
  background-image: radial-gradient(circle, rgba(255,255,255,0.10) 1px, transparent 1px);
  background-size: 48px 48px;
  animation: loginGridPan 14s linear infinite;
}
.login-particle { animation: loginParticle 4s ease-in-out infinite; }
.login-card-float { animation: loginCardFloat 5s ease-in-out infinite; }
.login-stat-item {
  animation: loginFadeIn 0.5s ease-out forwards;
  opacity: 0;
}
`;

const LoginPage: React.FC = () => {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [error, setError] = useState('');
    const [successMsg, setSuccessMsg] = useState('');
    const [loading, setLoading] = useState(false);
    const [isResetMode, setIsResetMode] = useState(false);
    const navigate = useNavigate();

    const handleLogin = async (e: React.FormEvent) => {
        e.preventDefault(); setError(''); setLoading(true);
        try {
            await signInWithEmailAndPassword(auth, email, password);
            navigate('/admin');
        } catch {
            setError('Email atau password salah. Silakan coba lagi.');
        } finally { setLoading(false); }
    };

    const handleResetPassword = async (e: React.FormEvent) => {
        e.preventDefault(); setError(''); setSuccessMsg(''); setLoading(true);
        try {
            await sendPasswordResetEmail(auth, email);
            setSuccessMsg(`Link reset password telah dikirim ke ${email}. Silakan cek kotak masuk atau folder spam.`);
        } catch (err: any) {
            setError(err.code === 'auth/user-not-found'
                ? 'Email tidak terdaftar dalam sistem.'
                : 'Gagal mengirim link reset. Pastikan email benar.');
        } finally { setLoading(false); }
    };

    /* Partikel floating (sama pola dengan App.tsx) */
    const particles = [
        { top: '12%', left: '8%', size: 'w-2 h-2', delay: '0s' },
        { top: '28%', left: '85%', size: 'w-3 h-3', delay: '1.3s' },
        { top: '55%', left: '6%', size: 'w-1.5 h-1.5', delay: '0.7s' },
        { top: '72%', left: '88%', size: 'w-2.5 h-2.5', delay: '2.1s' },
        { top: '42%', left: '92%', size: 'w-2 h-2', delay: '1.6s' },
        { top: '82%', left: '35%', size: 'w-1.5 h-1.5', delay: '0.4s' },
        { top: '18%', left: '60%', size: 'w-2 h-2', delay: '2.6s' },
        { top: '65%', left: '25%', size: 'w-1 h-1', delay: '1.1s' },
    ];

    /* Stat cards floating di panel kiri */
    const statCards = [
        { icon: <FileText className="w-4 h-4" />, label: 'Dokumen SOP', color: 'bg-emerald-400/20 border-emerald-300/30 text-emerald-100', delay: '0.1s' },
        { icon: <BarChart3 className="w-4 h-4" />, label: 'Dashboard', color: 'bg-[#D4AF37]/20  border-[#D4AF37]/30  text-[#D4AF37]', delay: '0.25s' },
        { icon: <BookOpen className="w-4 h-4" />, label: 'Panduan', color: 'bg-blue-400/20   border-blue-300/30   text-blue-200', delay: '0.4s' },
    ];

    return (
        <div className="min-h-screen flex font-sans bg-white">
            <style dangerouslySetInnerHTML={{ __html: LOGIN_CSS }} />

            {/* ══════════════════════════════════════════════════════════
          PANEL KIRI — animated background (konsisten App.tsx)
      ══════════════════════════════════════════════════════════ */}
            <div className="hidden lg:flex lg:w-1/2 relative overflow-hidden items-center justify-center text-white">

                {/* Base gradient */}
                <div className="absolute inset-0 bg-gradient-to-br from-[#0D5C35] via-[#0A492A] to-[#062B18]" />

                {/* Moving dot grid */}
                <div className="absolute inset-0 login-hero-grid opacity-20" />

                {/* Animated blobs */}
                <div className="absolute inset-0 pointer-events-none overflow-hidden">
                    <div className="login-blob-1 absolute -top-20 -left-16 w-[380px] h-[380px] rounded-full bg-emerald-400/20 blur-3xl" />
                    <div className="login-blob-2 absolute -bottom-20 -right-16 w-[450px] h-[450px] rounded-full bg-[#D4AF37]/12 blur-3xl" />
                    <div className="absolute top-1/2 left-1/3 w-[250px] h-[250px] rounded-full bg-teal-300/10 blur-3xl" style={{ animation: 'loginBlob1 25s ease-in-out infinite reverse' }} />
                </div>

                {/* Floating particles */}
                <div className="absolute inset-0 pointer-events-none overflow-hidden">
                    {particles.map((p, i) => (
                        <div
                            key={i}
                            className={`login-particle absolute ${p.size} rounded-full bg-white/25`}
                            style={{ top: p.top, left: p.left, animationDelay: p.delay }}
                        />
                    ))}
                </div>

                {/* Konten panel kiri */}
                <div className="relative z-10 max-w-md px-10 py-12 flex flex-col gap-10">

                    {/* Logo */}
                    <div className="login-card-float">
                        <div className="bg-white/10 backdrop-blur-md p-7 rounded-3xl inline-block shadow-2xl border border-white/10">
                            <img
                                src="/logo-color.png"
                                alt="KPKNL Logo"
                                className="w-40 h-20 object-contain drop-shadow-lg"
                                onError={e => { e.currentTarget.style.display = 'none'; }}
                            />
                        </div>
                    </div>

                    {/* Heading */}
                    <div>
                        <h1 className="text-5xl font-extrabold mb-4 tracking-tight leading-tight">
                            Knowledge Base<br />
                            <span className="text-[#D4AF37]">KPKNL KENDARI</span>
                        </h1>
                        <p className="text-slate-200/80 leading-relaxed text-base font-light max-w-sm">
                            Sistem manajemen informasi dan standar operasional prosedur terintegrasi untuk efisiensi pelayanan kekayaan negara.
                        </p>
                    </div>

                    {/* Feature stat chips */}
                    <div className="flex flex-col gap-3">
                        {statCards.map((s, i) => (
                            <div
                                key={i}
                                className={`login-stat-item flex items-center gap-3 px-4 py-3 rounded-2xl border backdrop-blur-sm w-fit ${s.color}`}
                                style={{ animationDelay: s.delay }}
                            >
                                {s.icon}
                                <span className="text-sm font-bold">{s.label}</span>
                            </div>
                        ))}
                    </div>

                    {/* Shield badge */}
                    <div className="flex items-center gap-3 text-emerald-100/50 text-xs font-medium">
                        <Shield className="w-4 h-4 flex-shrink-0" />
                        <span>Akses terbatas untuk pengguna yang berwenang</span>
                    </div>
                </div>
            </div>

            {/* ══════════════════════════════════════════════════════════
          PANEL KANAN — Form Login / Reset
      ══════════════════════════════════════════════════════════ */}
            <div className="w-full lg:w-1/2 flex flex-col justify-center items-center p-6 md:p-12 bg-slate-50 lg:bg-white relative">

                {/* Tombol kembali */}
                <button
                    onClick={() => navigate('/')}
                    className="absolute top-6 left-6 md:top-10 md:left-10 flex items-center text-slate-500 hover:text-[#0D5C35] transition-all font-bold text-sm group"
                    aria-label="Kembali ke Beranda"
                >
                    <div className="p-2 bg-white border border-slate-200 rounded-full mr-2.5 shadow-sm group-hover:border-[#0D5C35] group-hover:scale-110 transition-all">
                        <ArrowLeft className="w-4 h-4" />
                    </div>
                    Kembali ke Beranda
                </button>

                <div className="w-full max-w-md bg-white lg:bg-transparent p-8 lg:p-0 rounded-3xl shadow-xl lg:shadow-none border border-slate-100 lg:border-none animate-in fade-in slide-in-from-bottom-4 duration-700">

                    {/* Heading form */}
                    <div className="mb-8 text-center lg:text-left">
                        {/* Mobile: logo kecil */}
                        <div className="lg:hidden mb-6 flex justify-center">
                            <div className="bg-[#0D5C35]/8 p-4 rounded-2xl border border-[#0D5C35]/10">
                                <img
                                    src="/logo-color.png"
                                    alt="KPKNL"
                                    className="w-28 h-12 object-contain"
                                    onError={e => { e.currentTarget.style.display = 'none'; }}
                                />
                            </div>
                        </div>
                        <h2 className="text-3xl font-extrabold text-slate-900 mb-2 tracking-tight">
                            {isResetMode ? 'Reset Password' : 'Selamat Datang 👋'}
                        </h2>
                        <p className="text-slate-500 text-sm leading-relaxed">
                            {isResetMode
                                ? 'Masukkan email Anda untuk menerima link reset password.'
                                : 'Silakan login untuk mengakses panel administrator KPKNL Kendari.'}
                        </p>
                    </div>

                    {/* Alert error */}
                    {error && (
                        <div className="mb-5 p-4 bg-rose-50 border border-rose-100 rounded-xl flex items-start text-rose-700 text-sm animate-in fade-in slide-in-from-top-2 duration-300">
                            <AlertCircle className="w-4 h-4 mr-2.5 flex-shrink-0 mt-0.5" />
                            {error}
                        </div>
                    )}

                    {/* Alert sukses reset */}
                    {successMsg && (
                        <div className="mb-5 p-4 bg-emerald-50 border border-emerald-100 rounded-xl flex items-start text-emerald-700 text-sm animate-in fade-in slide-in-from-top-2 duration-300">
                            <CheckCircle2 className="w-4 h-4 mr-2.5 flex-shrink-0 mt-0.5" />
                            {successMsg}
                        </div>
                    )}

                    <form onSubmit={isResetMode ? handleResetPassword : handleLogin} className="space-y-5">

                        {/* Email field */}
                        <div className="space-y-1.5">
                            <label className="text-xs font-bold text-slate-600 uppercase tracking-wider ml-1">Email Dinas</label>
                            <div className="relative group">
                                <div className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-[#0D5C35] transition-colors pointer-events-none">
                                    <Mail className="w-5 h-5" />
                                </div>
                                <input
                                    type="email"
                                    required
                                    value={email}
                                    onChange={e => setEmail(e.target.value)}
                                    className="w-full pl-12 pr-4 py-4 rounded-xl border border-slate-200 bg-slate-50 focus:bg-white focus:border-[#0D5C35] focus:ring-4 focus:ring-[#0D5C35]/10 outline-none transition-all font-medium text-slate-800 placeholder:text-slate-400 text-sm"
                                    placeholder="nama@kpknl.go.id"
                                />
                            </div>
                        </div>

                        {/* Password field — hanya tampil di mode login */}
                        {!isResetMode && (
                            <div className="space-y-1.5">
                                <div className="flex justify-between items-center ml-1">
                                    <label className="text-xs font-bold text-slate-600 uppercase tracking-wider">Password</label>
                                    <button
                                        type="button"
                                        onClick={() => { setIsResetMode(true); setError(''); setSuccessMsg(''); }}
                                        className="text-xs font-bold text-[#0D5C35] hover:text-[#0A492A] hover:underline transition-colors"
                                    >
                                        Lupa Password?
                                    </button>
                                </div>
                                <div className="relative group">
                                    <div className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-[#0D5C35] transition-colors pointer-events-none">
                                        <Lock className="w-5 h-5" />
                                    </div>
                                    <input
                                        type="password"
                                        required
                                        value={password}
                                        onChange={e => setPassword(e.target.value)}
                                        className="w-full pl-12 pr-4 py-4 rounded-xl border border-slate-200 bg-slate-50 focus:bg-white focus:border-[#0D5C35] focus:ring-4 focus:ring-[#0D5C35]/10 outline-none transition-all font-medium text-slate-800 placeholder:text-slate-400 text-sm"
                                        placeholder="••••••••"
                                    />
                                </div>
                            </div>
                        )}

                        {/* Submit */}
                        <button
                            type="submit"
                            disabled={loading}
                            className="w-full py-4 bg-[#0D5C35] hover:bg-[#0A492A] text-white font-bold rounded-xl shadow-lg shadow-[#0D5C35]/25 hover:shadow-[#0D5C35]/40 hover:-translate-y-0.5 transition-all active:scale-[0.98] disabled:opacity-60 disabled:cursor-not-allowed disabled:translate-y-0 flex items-center justify-center gap-2 mt-2"
                        >
                            {loading ? (
                                <>
                                    <Loader2 className="w-5 h-5 animate-spin" />
                                    Memproses...
                                </>
                            ) : (
                                isResetMode ? 'Kirim Link Reset' : 'Masuk Dashboard'
                            )}
                        </button>

                        {/* Kembali ke login dari reset mode */}
                        {isResetMode && (
                            <button
                                type="button"
                                onClick={() => { setIsResetMode(false); setError(''); setSuccessMsg(''); }}
                                className="w-full py-3 bg-white border border-slate-200 text-slate-600 font-bold rounded-xl hover:bg-slate-50 transition-all text-sm"
                            >
                                ← Kembali ke Login
                            </button>
                        )}
                    </form>

                    {/* Footer */}
                    <div className="mt-10 pt-6 border-t border-slate-100 text-center">
                        <p className="text-xs text-slate-400 font-medium">
                            © 2026 KPKNL Kendari. Sistem Informasi Manajemen Kekayaan Negara.
                        </p>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default LoginPage;