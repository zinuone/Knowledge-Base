// File: tailwind.config.cjs
//
// CATATAN: Ekstensi .cjs (bukan .js) diperlukan karena package.json
// menggunakan "type": "module". File .cjs selalu diperlakukan sebagai
// CommonJS oleh Node.js, terlepas dari setting "type", sehingga
// sintaks require() dan module.exports bekerja normal di sini.
// PostCSS dan Tailwind CLI secara otomatis menemukan file ini.

/** @type {import('tailwindcss').Config} */
module.exports = {

  // ── Dark mode via class (sama dengan konfigurasi CDN sebelumnya) ──
  darkMode: 'class',

  // ── Content paths: semua file yang mengandung Tailwind class ──────
  // Penting: Tailwind hanya generate CSS untuk kelas yang benar-benar
  // dipakai di file-file ini (tree-shaking otomatis oleh JIT engine).
  content: [
    './index.html',
    './index.tsx',
    './App.tsx',
    './src/**/*.{ts,tsx}',
  ],

  theme: {
    extend: {
      // ── Warna custom KPKNL (dari konfigurasi CDN sebelumnya) ──────
      colors: {
        kemenkeu: {
          green:      '#0D5C35',
          greenDark:  '#0A492A',
          greenLight: '#EAF2EE',
          gold:       '#D4AF37',
        },
      },
      // ── Font custom (dari konfigurasi CDN sebelumnya) ─────────────
      fontFamily: {
        sans: ['Plus Jakarta Sans', 'sans-serif'],
      },
    },
  },

  plugins: [
    // ── @tailwindcss/typography ────────────────────────────────────
    // Menyediakan kelas prose-* yang dipakai di ReactMarkdown renderer
    // (App.tsx, AdminDashboard.tsx, DetailPage.tsx, SearchPage.tsx, dll.)
    // Sebelumnya dimuat via CDN ?plugins=typography, kini via npm.
    require('@tailwindcss/typography'),

    // ── tailwindcss-animate ────────────────────────────────────────
    // Menyediakan kelas animate-in, fade-in, zoom-in, slide-in-from-*,
    // zoom-in-95, dll. yang dipakai di App.tsx dan AdminDashboard.tsx.
    // Plugin ini TIDAK tersedia di CDN sebelumnya, sehingga semua kelas
    // animate-in sebelumnya tidak menghasilkan CSS apapun (silent fail).
    // Setelah migrasi ini, animasi tersebut baru aktif sungguhan.
    require('tailwindcss-animate'),
  ],
};
