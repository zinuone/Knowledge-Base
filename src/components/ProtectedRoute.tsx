// File: src/components/ProtectedRoute.tsx
import React, { useEffect, useState } from 'react';
import { Navigate } from 'react-router-dom';
import { onAuthStateChanged } from 'firebase/auth';
import { auth } from '../firebase'; // Pastikan file firebase.ts ada di folder src

interface ProtectedRouteProps {
    children: React.ReactNode;
}

const ProtectedRoute: React.FC<ProtectedRouteProps> = ({ children }) => {
    const [user, setUser] = useState<any>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        // Fungsi ini memantau status login secara real-time
        // Apakah ada user yang sedang login?
        const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
            setUser(currentUser);
            setLoading(false);
        });

        return () => unsubscribe();
    }, []);

    // Tampilkan loading berputar saat sedang mengecek ke server Google
    if (loading) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-slate-50">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#0D5C35]"></div>
            </div>
        );
    }

    // Kalau loading selesai TAPI tidak ada user (belum login)
    // Tendang balik ke halaman Login
    if (!user) {
        return <Navigate to="/login" replace />;
    }

    // Kalau aman (user ada), silakan masuk ke halaman Admin
    return <>{children}</>;
};

export default ProtectedRoute;