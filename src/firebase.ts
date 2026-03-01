// File: src/firebase.ts
//
// ════════════════════════════════════════════════════════════════
// PANDUAN SETUP — WAJIB DIBACA SEBELUM DEPLOY
// ════════════════════════════════════════════════════════════════
//
// Firebase config dipindah ke environment variables (.env.local)
// agar tidak ter-hardcode di dalam kode yang bisa masuk Git.
//
// LANGKAH 1 — Tambahkan baris berikut ke file .env.local Anda:
//
//   VITE_FIREBASE_API_KEY=AIzaSyCjOuJTtDyRPCzLPtgNMxnPPqD3rOPh63M
//   VITE_FIREBASE_AUTH_DOMAIN=kpknl-knowledge-base.firebaseapp.com
//   VITE_FIREBASE_PROJECT_ID=kpknl-knowledge-base
//   VITE_FIREBASE_STORAGE_BUCKET=kpknl-knowledge-base.firebasestorage.app
//   VITE_FIREBASE_MESSAGING_SENDER_ID=713077520113
//   VITE_FIREBASE_APP_ID=1:713077520113:web:037fa9e3d04e385f1c1b50
//
// LANGKAH 2 — Pastikan .env.local sudah ada di .gitignore
//   (*.local sudah tercantum di .gitignore proyek ini ✓)
//
// LANGKAH 3 — Untuk deployment Vercel (production):
//   Tambahkan env vars yang sama di:
//   Vercel Dashboard → Project → Settings → Environment Variables
//
// ════════════════════════════════════════════════════════════════
// Mengapa ini penting meski Firebase punya Security Rules?
// Security Rules melindungi DATA di Firestore, tapi key yang
// ter-commit ke Git bisa dipakai orang lain untuk:
// - Membuat proyek Firebase palsu dengan nama yang sama
// - Memenuhi kuota gratis Anda
// - Mengakses storage bucket jika rules-nya terbuka
// ════════════════════════════════════════════════════════════════

import { initializeApp } from 'firebase/app';
import { getAuth }        from 'firebase/auth';
import { getFirestore }   from 'firebase/firestore';

const firebaseConfig = {
    apiKey:            import.meta.env.VITE_FIREBASE_API_KEY,
    authDomain:        import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
    projectId:         import.meta.env.VITE_FIREBASE_PROJECT_ID,
    storageBucket:     import.meta.env.VITE_FIREBASE_STORAGE_BUCKET,
    messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
    appId:             import.meta.env.VITE_FIREBASE_APP_ID,
};

const app = initializeApp(firebaseConfig);

export const auth = getAuth(app);
export const db   = getFirestore(app);