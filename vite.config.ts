// File: vite.config.ts
import path from 'path';
import { defineConfig, loadEnv } from 'vite';
import react from '@vitejs/plugin-react';
import { VitePWA } from 'vite-plugin-pwa'; // Import PWA

export default defineConfig(({ mode }) => {
    const env = loadEnv(mode, '.', '');
    return {
      server: {
        port: 3000,
        host: '0.0.0.0',
      },
      plugins: [
        react(),
        // KONFIGURASI PWA DI SINI
        VitePWA({
          registerType: 'autoUpdate',
          includeAssets: ['logo.png'], // Pastikan ada file logo.png di folder public
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
                src: 'logo.png', // Menggunakan logo yang sama untuk ikon
                sizes: '192x192',
                type: 'image/png'
              },
              {
                src: 'logo.png',
                sizes: '512x512',
                type: 'image/png'
              },
              {
                src: 'logo.png',
                sizes: '512x512',
                type: 'image/png',
                purpose: 'any maskable'
              }
            ]
          }
        })
      ],
      define: {
        'process.env.API_KEY': JSON.stringify(env.GEMINI_API_KEY),
        'process.env.GEMINI_API_KEY': JSON.stringify(env.GEMINI_API_KEY)
      },
      resolve: {
        alias: {
          '@': path.resolve(__dirname, '.'),
        }
      }
    };
});