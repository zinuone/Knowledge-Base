// File: src/pages/LoginPage.tsx
import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { signInWithEmailAndPassword } from 'firebase/auth';
import { auth } from '../firebase'; // Import auth dari file koneksi tadi
import { Lock, ArrowLeft, AlertCircle } from 'lucide-react';

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
      // Ini fungsi sakti dari Firebase buat cek password
      await signInWithEmailAndPassword(auth, email, password);
      // Kalau sukses, lempar ke halaman Admin (nanti kita buat)
      navigate('/admin'); 
    } catch (err: any) {
      console.error(err);
      setError('Email atau password salah. Silakan coba lagi.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
      <div className="max-w-md w-full bg-white rounded-2xl shadow-xl overflow-hidden border border-slate-100">
        
        {/* Header Hijau */}
        <div className="bg-[#0D5C35] p-8 text-center relative">
          <button 
            onClick={() => navigate('/')}
            className="absolute left-4 top-4 text-white/80 hover:text-white transition"
            title="Kembali ke Beranda"  // <--- TAMBAHKAN INI
            aria-label="Kembali ke Beranda" // <--- ATAU INI
          >
            <ArrowLeft className="w-6 h-6" />
          </button>
          <div className="w-16 h-16 bg-white/10 rounded-full flex items-center justify-center mx-auto mb-4 backdrop-blur-sm">
            <Lock className="w-8 h-8 text-[#D4AF37]" />
          </div>
          <h2 className="text-2xl font-bold text-white">Login Administrator</h2>
          <p className="text-[#EAF2EE]/80 text-sm mt-1">KPKNL Knowledge Base</p>
        </div>

        {/* Form Login */}
        <div className="p-8">
          {error && (
            <div className="mb-6 p-4 bg-rose-50 border border-rose-100 rounded-xl flex items-start text-rose-700 text-sm">
              <AlertCircle className="w-5 h-5 mr-2 flex-shrink-0" />
              {error}
            </div>
          )}

          <form onSubmit={handleLogin} className="space-y-6">
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">Email Dinas</label>
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:border-[#0D5C35] focus:ring-2 focus:ring-[#0D5C35]/20 outline-none transition"
                placeholder="admin@kpknl.go.id"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">Password</label>
              <input
                type="password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:border-[#0D5C35] focus:ring-2 focus:ring-[#0D5C35]/20 outline-none transition"
                placeholder="••••••••"
              />
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full py-3.5 bg-[#0D5C35] hover:bg-[#0A492A] text-white font-bold rounded-xl shadow-lg shadow-[#0D5C35]/20 transition-all transform active:scale-95 disabled:opacity-70 disabled:cursor-not-allowed"
            >
              {loading ? 'Memproses...' : 'Masuk ke Dashboard'}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
};

export default LoginPage;