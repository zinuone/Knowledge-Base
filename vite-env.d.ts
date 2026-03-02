/// <reference types="vite/client" />

/* ═══════════════════════════════════════════════════════════════
   VITE ENVIRONMENT VARIABLES — Type Declarations
   ───────────────────────────────────────────────────────────────
   Mendefinisikan semua variabel VITE_ yang dipakai di proyek ini
   sehingga import.meta.env.VITE_xxx sudah typed dengan benar
   dan tidak perlu cast (import.meta as any) di tempat manapun.

   Nilai sebenarnya disimpan di .env.local (tidak di-commit ke Git)
   dan di Vercel Environment Variables untuk production/preview.

   Semua variabel bersifat readonly dan optional (string | undefined)
   karena bisa saja belum dikonfigurasi di environment tertentu.
═══════════════════════════════════════════════════════════════ */

interface ImportMetaEnv {
  /* ── Gemini AI ─────────────────────────────────────────────── */
  readonly VITE_GEMINI_API_KEY?: string;

  /* ── Firebase ──────────────────────────────────────────────── */
  readonly VITE_FIREBASE_API_KEY?: string;
  readonly VITE_FIREBASE_AUTH_DOMAIN?: string;
  readonly VITE_FIREBASE_PROJECT_ID?: string;
  readonly VITE_FIREBASE_STORAGE_BUCKET?: string;
  readonly VITE_FIREBASE_MESSAGING_SENDER_ID?: string;
  readonly VITE_FIREBASE_APP_ID?: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}