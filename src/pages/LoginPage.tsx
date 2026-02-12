// File: src/pages/LoginPage.tsx
import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { signInWithEmailAndPassword } from 'firebase/auth';
import { auth } from '../firebase';
import { Lock, Mail, ArrowLeft, AlertCircle, Loader2 } from 'lucide-react'; // Tambah Loader2

const LoginPage: React.FC = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      await signInWithEmailAndPassword(auth, email, password);
      navigate('/admin'); 
    } catch (err: any) {
      console.error(err);
      setError('Email atau password salah. Silakan coba lagi.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex font-sans bg-white">
      
      {/* --- BAGIAN KIRI: VISUAL (Hanya muncul di Layar Besar/Desktop) --- */}
      <div className="hidden lg:flex lg:w-1/2 bg-gradient-to-br from-[#0D5C35] via-[#0A492A] to-[#083D23] relative overflow-hidden items-center justify-center text-white p-12">
        {/* Dekorasi Background Abstrak */}
        <div className="absolute top-0 left-0 w-full h-full opacity-10 pointer-events-none">
            <div className="absolute top-[-10%] left-[-10%] w-[500px] h-[500px] rounded-full bg-white blur-[100px]"></div>
            <div className="absolute bottom-[-10%] right-[-10%] w-[600px] h-[600px] rounded-full bg-[#D4AF37] blur-[120px]"></div>
        </div>

        <div className="relative z-10 max-w-lg text-center">
            <div className="bg-white/10 backdrop-blur-md p-8 rounded-3xl inline-block mb-8 shadow-2xl border border-white/10 animate-in zoom-in duration-500">
                <img src="/logo.png" alt="KPKNL Logo" className="w-28 h-28 object-contain drop-shadow-lg" onError={(e) => { e.currentTarget.src = 'https://upload.wikimedia.org/wikipedia/commons/thumb/8/82/Coat_of_arms_of_Indonesia.svg/1200px-Coat_of_arms_of_Indonesia.svg.png' }} />
            </div>
            <h1 className="text-5xl font-extrabold mb-6 tracking-tight leading-tight">
                Knowledge Base <br/><span className="text-[#D4AF37]">KPKNL KENDARI</span>
            </h1>
            <p className="text-lg text-slate-200/90 leading-relaxed font-light">
                Sistem manajemen informasi & standar operasional prosedur terintegrasi untuk efisiensi layanan.
            </p>
        </div>
      </div>

      {/* --- BAGIAN KANAN: FORM LOGIN --- */}
      <div className="w-full lg:w-1/2 flex flex-col justify-center items-center p-6 md:p-12 bg-slate-50 lg:bg-white relative">
        
        {/* Tombol Kembali (Floating) */}
        <button 
            onClick={() => navigate('/')}
            className="absolute top-6 left-6 md:top-10 md:left-10 flex items-center text-slate-500 hover:text-[#0D5C35] transition-all font-bold text-sm group"
            aria-label="Kembali ke Beranda"
            title="Kembali ke halaman utama"
        >
            <div className="p-2 bg-white border border-slate-200 rounded-full mr-3 shadow-sm group-hover:border-[#0D5C35] group-hover:scale-110 transition-all">
                <ArrowLeft className="w-4 h-4" />
            </div>
            Kembali ke Beranda
        </button>

        <div className="w-full max-w-md bg-white lg:bg-transparent p-8 lg:p-0 rounded-3xl shadow-xl lg:shadow-none border border-slate-100 lg:border-none animate-in fade-in slide-in-from-bottom-4 duration-700">
            <div className="mb-10 text-center lg:text-left">
                <h2 className="text-3xl font-extrabold text-slate-900 mb-2">Selamat Datang 👋</h2>
                <p className="text-slate-500">Silakan login untuk mengakses panel administrator.</p>
            </div>

            {/* Error Alert */}
            {error && (
                <div className="mb-6 p-4 bg-rose-50 border border-rose-100 rounded-xl flex items-start text-rose-700 text-sm animate-in shake duration-300">
                    <AlertCircle className="w-5 h-5 mr-3 flex-shrink-0 mt-0.5" />
                    {error}
                </div>
            )}

            <form onSubmit={handleLogin} className="space-y-6">
                
                {/* Input Email dengan Icon */}
                <div className="space-y-2">
                    <label className="text-sm font-bold text-slate-700 ml-1">Email Dinas</label>
                    <div className="relative group">
                        <div className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-[#0D5C35] transition-colors">
                            <Mail className="w-5 h-5" />
                        </div>
                        <input
                            type="email"
                            required
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            className="w-full pl-12 pr-4 py-4 rounded-xl border border-slate-200 bg-slate-50 focus:bg-white focus:border-[#0D5C35] focus:ring-4 focus:ring-[#0D5C35]/10 outline-none transition-all font-medium text-slate-800 placeholder:text-slate-400"
                            placeholder="nama@kpknl.go.id"
                            aria-label="Masukkan Email Dinas"
                        />
                    </div>
                </div>

                {/* Input Password dengan Icon */}
                <div className="space-y-2">
                    <label className="text-sm font-bold text-slate-700 ml-1">Password</label>
                    <div className="relative group">
                        <div className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-[#0D5C35] transition-colors">
                            <Lock className="w-5 h-5" />
                        </div>
                        <input
                            type="password"
                            required
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            className="w-full pl-12 pr-4 py-4 rounded-xl border border-slate-200 bg-slate-50 focus:bg-white focus:border-[#0D5C35] focus:ring-4 focus:ring-[#0D5C35]/10 outline-none transition-all font-medium text-slate-800 placeholder:text-slate-400"
                            placeholder="••••••••"
                            aria-label="Masukkan Password"
                        />
                    </div>
                </div>

                {/* Tombol Login */}
                <button
                    type="submit"
                    disabled={loading}
                    className="w-full py-4 bg-[#0D5C35] hover:bg-[#0A492A] text-white font-bold rounded-xl shadow-lg shadow-[#0D5C35]/20 hover:shadow-[#0D5C35]/40 transition-all transform active:scale-[0.98] disabled:opacity-70 disabled:cursor-not-allowed flex items-center justify-center mt-8"
                    aria-label={loading ? "Sedang memproses login..." : "Masuk ke Dashboard"}
                >
                    {loading ? (
                        <>
                            <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                            Memproses...
                        </>
                    ) : (
                        'Masuk Dashboard'
                    )}
                </button>
            </form>

            <div className="mt-12 text-center border-t border-slate-100 pt-6">
                <p className="text-xs text-slate-400 font-medium">
                    &copy; 2026 KPKNL Kendari. Sistem Informasi Manajemen Aset Negara.
                </p>
            </div>
        </div>
      </div>
    </div>
  );
};

export default LoginPage;