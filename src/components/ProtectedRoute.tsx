// File: src/components/ProtectedRoute.tsx
import React, { useEffect, useState } from 'react';
import { Navigate } from 'react-router-dom';
import { onAuthStateChanged } from 'firebase/auth';
import { auth } from '../firebase';

interface ProtectedRouteProps {
    children: React.ReactNode;
}

const ProtectedRoute: React.FC<ProtectedRouteProps> = ({ children }) => {
    const [user, setUser] = useState<any>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const unsubscribe = onAuthStateChanged(auth, currentUser => {
            setUser(currentUser);
            setLoading(false);
        });
        return () => unsubscribe();
    }, []);

    /* ── Loading — tampilan branded konsisten dengan App.tsx ── */
    if (loading) {
        return (
            <div className="min-h-screen flex flex-col items-center justify-center bg-gradient-to-br from-[#0D5C35] via-[#0A492A] to-[#062B18] font-sans relative overflow-hidden">

                {/* Dekorasi blob */}
                <div className="absolute inset-0 pointer-events-none overflow-hidden">
                    <div className="absolute -top-24 -left-24 w-80 h-80 rounded-full bg-emerald-400/15 blur-3xl" />
                    <div className="absolute -bottom-24 -right-24 w-96 h-96 rounded-full bg-[#D4AF37]/10 blur-3xl" />
                    <div className="absolute top-1/2 left-1/3 w-64 h-64 rounded-full bg-teal-300/10 blur-3xl" />
                </div>

                {/* Grid bergerak */}
                <div
                    className="absolute inset-0 opacity-15 pointer-events-none"
                    style={{
                        backgroundImage: 'radial-gradient(circle, rgba(255,255,255,0.12) 1px, transparent 1px)',
                        backgroundSize: '40px 40px',
                    }}
                />

                {/* Konten */}
                <div className="relative z-10 flex flex-col items-center gap-8 animate-in fade-in zoom-in-95 duration-500">
                    {/* Logo card */}
                    <div className="bg-white/10 backdrop-blur-md p-8 rounded-3xl border border-white/15 shadow-2xl">
                        <img
                            src="/logo-color.png"
                            alt="KPKNL Kendari"
                            className="w-36 h-16 object-contain drop-shadow-lg"
                            onError={e => { e.currentTarget.style.display = 'none'; }}
                        />
                    </div>

                    {/* Brand */}
                    <div className="text-center">
                        <h1 className="text-2xl font-black text-white tracking-tight mb-1">Admin Panel</h1>
                        <p className="text-emerald-200/60 text-sm font-medium uppercase tracking-[0.22em]">
                            KPKNL Kendari
                        </p>
                    </div>

                    {/* Dot-pulse loader */}
                    <div className="flex flex-col items-center gap-3">
                        <div className="flex items-center gap-2">
                            {[0, 1, 2].map(i => (
                                <div
                                    key={i}
                                    className="w-2.5 h-2.5 rounded-full bg-[#D4AF37]"
                                    style={{
                                        animation: 'dotBounce 1.4s ease-in-out infinite',
                                        animationDelay: `${i * 0.22}s`,
                                    }}
                                />
                            ))}
                        </div>
                        <p className="text-emerald-200/40 text-xs font-medium tracking-wider uppercase">
                            Memverifikasi sesi...
                        </p>
                    </div>
                </div>

                <style>{`
          @keyframes dotBounce {
            0%, 80%, 100% { transform: scale(0.55); opacity: 0.35; }
            40%            { transform: scale(1);    opacity: 1;    }
          }
        `}</style>
            </div>
        );
    }

    if (!user) return <Navigate to="/login" replace />;
    return <>{children}</>;
};

export default ProtectedRoute;