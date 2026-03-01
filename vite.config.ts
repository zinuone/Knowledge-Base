// File: vite.config.ts
import path from 'path';
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { VitePWA } from 'vite-plugin-pwa';

// ─────────────────────────────────────────────────────────────────
// CATATAN KEAMANAN — Gemini API Key:
// Blok `define` yang sebelumnya menyuntikkan GEMINI_API_KEY ke
// dalam bundle JavaScript sudah dihapus karena berbahaya:
// siapapun bisa membaca nilai key tsb via browser DevTools.
//
// Jika suatu saat ingin menggunakan Gemini AI, akses API-nya
// harus melalui backend / Cloud Function, BUKAN langsung dari
// kode React (client-side). Bicarakan dulu sebelum implementasi.
// ─────────────────────────────────────────────────────────────────

export default defineConfig({
    server: {
        port: 3000,
        host: '0.0.0.0',
    },
    plugins: [
        react(),

        // ── Konfigurasi PWA ────────────────────────────────────────
        VitePWA({
            registerType: 'autoUpdate',
            includeAssets: ['logo.png'],
            manifest: {
                name: 'Knowledge Base KPKNL Kendari',
                short_name: 'KPKNL KB',
                description: 'Sistem Informasi Knowledge Base & SOP KPKNL Kendari',
                theme_color: '#0D5C35',
                background_color: '#F8FAF9',
                display: 'standalone',
                orientation: 'portrait',
                scope: '/',
                start_url: '/',
                icons: [
                    {
                        src: 'logo.png',
                        sizes: '192x192',
                        type: 'image/png',
                    },
                    {
                        src: 'logo.png',
                        sizes: '512x512',
                        type: 'image/png',
                    },
                    {
                        src: 'logo.png',
                        sizes: '512x512',
                        type: 'image/png',
                        purpose: 'any maskable',
                    },
                ],
            },
        }),
    ],

    resolve: {
        alias: {
            '@': path.resolve(__dirname, '.'),
        },
    },
});