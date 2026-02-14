# 🏛️ Knowledge Base & SOP Management System - KPKNL Kendari

![Project Banner](https://img.shields.io/badge/Status-Production%20Ready-success?style=for-the-badge) ![Version](https://img.shields.io/badge/Version-1.0.0-blue?style=for-the-badge) ![Tech](https://img.shields.io/badge/Built%20With-React%20%2B%20Vite-61DAFB?style=for-the-badge)

Sistem Informasi Manajemen Pengetahuan (Knowledge Base) berbasis web modern yang dirancang khusus untuk **KPKNL Kendari (Kementerian Keuangan RI)**. Aplikasi ini berfungsi sebagai pusat informasi SOP, Panduan Layanan, dan FAQ yang dapat diakses secara *real-time* oleh pegawai maupun publik, serta dilengkapi dengan panel administrasi yang *powerful*.

---

## 🚀 Fitur Unggulan

### 🌍 Untuk Pengguna (Public)
- **Pencarian Cepat & Cerdas:** Cari SOP berdasarkan kata kunci atau kategori layanan secara instan dengan fitur *Clear Search*.
- **Progressive Web App (PWA):** Dapat diinstal di HP (Android/iOS) dan Laptop layaknya aplikasi native (Full Screen).
- **Dual Mode UI:** Tampilan responsif yang otomatis menyesuaikan layar Desktop dan Mobile.
- **Interaktif:** Fitur *Rating* (Like/Dislike) dan *Share* dokumen.
- **Visualisasi Data:** Tampilan grid kategori yang elegan dengan animasi *scroll reveal*.

### 🛡️ Untuk Administrator (Admin Panel)
- **Dashboard Analitik:** Grafik statistik pengunjung, dokumen populer, dan distribusi kategori (menggunakan *Recharts*).
- **Manajemen Konten (CRUD):** Tambah, Edit, dan Hapus SOP/FAQ/Panduan dengan mudah.
- **Rich Text Editor:** Format teks (Bold, List, Heading) langsung di dalam aplikasi untuk SOP, FAQ, dan Panduan.
- **Export Laporan:** Unduh rekapitulasi data SOP ke format **Microsoft Excel (.xlsx)**.
- **Keamanan:** Sistem login terintegrasi Firebase Authentication dengan proteksi *route*.

---

## 🛠️ Tech Stack (Teknologi yang Digunakan)

Aplikasi ini dibangun menggunakan teknologi web terkini untuk menjamin performa, keamanan, dan kemudahan pengembangan:

| Kategori | Teknologi |
| :--- | :--- |
| **Frontend Framework** | [React.js](https://reactjs.org/) + [Vite](https://vitejs.dev/) |
| **Language** | [TypeScript](https://www.typescriptlang.org/) |
| **Styling** | [Tailwind CSS](https://tailwindcss.com/) |
| **Database & Auth** | [Google Firebase (Firestore & Auth)](https://firebase.google.com/) |
| **Charting** | [Recharts](https://recharts.org/) |
| **Data Processing** | [SheetJS (XLSX)](https://sheetjs.com/) |
| **Icons** | [Lucide React](https://lucide.dev/) |
| **Deployment** | [Vercel](https://vercel.com/) |

---

## 💻 Panduan Instalasi (Untuk Developer/Admin Selanjutnya)

Ikuti langkah ini jika ingin menjalankan proyek ini di komputer lokal:

### 1. Prasyarat
Pastikan komputer Anda sudah terinstal:
- [Node.js](https://nodejs.org/) (Versi 18 atau terbaru)
- Git

### 2. Clone Repositori
Buka terminal dan jalankan perintah:
```bash
git clone [https://github.com/username-anda/kpknl-knowledge-base.git](https://github.com/username-anda/kpknl-knowledge-base.git)
cd kpknl-knowledge-base
```

### 3. Install Dependencies
Install semua library yang dibutuhkan:
```bash
npm install
```

### 4. Konfigurasi Environment (PENTING!)
Buat file .env di folder utama, lalu isi dengan konfigurasi Firebase Anda:
```bash
VITE_API_KEY=api_key_firebase_anda
VITE_AUTH_DOMAIN=project_id.firebaseapp.com
VITE_PROJECT_ID=project_id_anda
VITE_STORAGE_BUCKET=project_id.appspot.com
VITE_MESSAGING_SENDER_ID=sender_id
VITE_APP_ID=app_id
```

### 5. Jalankan Aplikasi 
Untuk mode pengembangan (Development):
```bash
npm run dev
Buka browser dan akses: http://localhost:3000
```

### 6. Build untuk Produksi 
Untuk membuat versi siap tayang (Production):
```bash
npm run build
npm run preview
```
---

## 📂 Struktur Folder Proyek
Agar tidak tersesat, berikut adalah peta struktur folder utama aplikasi ini:
```bash
kpknl-knowledge-base/
├── public/              # Aset statis (Logo Kemenkeu, Logo KPKNL, Icon PWA, Manifest)
├── src/
│   ├── components/      # Komponen UI (Card, Loader, Modal, FAQItem)
│   ├── pages/           # Halaman Utama (App, Login, AdminDashboard, DetailPage)
│   ├── firebase.ts      # Konfigurasi koneksi ke Database Firestore
│   ├── main.tsx         # Titik masuk aplikasi (Entry point)
│   └── index.css        # Konfigurasi Tailwind CSS
├── index.html           # File HTML utama
├── vite.config.ts       # Konfigurasi Vite & PWA Plugin
└── package.json         # Daftar library & script
```
---

## 🔒 Catatan Keamanan (Security Rules)
Pastikan aturan Firestore Database diatur seperti berikut untuk menjaga keamanan data namun tetap memungkinkan interaksi publik (Rating):
```bash
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    match /{document=**} {
      // Publik boleh BACA
      allow read: if true;
      
      // Hanya Admin Login boleh Create/Delete
      allow create, delete: if request.auth != null;
      
      // Admin boleh Update semua. 
      // Publik HANYA boleh Update field 'views', 'likes', 'dislikes' (untuk fitur Rating & Counter).
      allow update: if request.auth != null || 
                   (request.resource.data.diff(resource.data).affectedKeys().hasOnly(['views', 'likes', 'dislikes']));
    }
  }
}
```
---

## 👨‍💻 Kredit Pengembang
Dikembangkan dengan ❤️ dan ☕ oleh:
Muhammad Ridwan Mahasiswa Teknik Informatika - Universitas Halu Oleo Internship at KPKNL Kendari (2026)

> "Koding itu seni, bukan sekadar logika."

© 2026 KPKNL Kendari - Kementerian Keuangan Republik Indonesia