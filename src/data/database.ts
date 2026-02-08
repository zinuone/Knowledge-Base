// File: src/data/database.ts

export const knowledgeData: Record<string, { title: string; date: string; content: string; steps: string[] }> = {
  "psp": {
    title: "Penggunaan, Pemanfaatan, dan Pemindahtanganan (PSP)",
    date: "Terakhir diupdate: 2 Feb 2026",
    content: "PSP adalah siklus pengelolaan BMN yang meliputi penetapan status penggunaan, pemanfaatan (sewa, pinjam pakai), hingga pemindahtanganan (jual, hibah). Satuan kerja wajib mengajukan permohonan PSP untuk setiap perubahan status aset.",
    steps: [
      "Satker menginventarisasi BMN yang akan diusulkan.",
      "Satker mengajukan permohonan melalui aplikasi SIMAN.",
      "KPKNL melakukan penelitian berkas dan fisik (cek lapangan).",
      "Penerbitan SK Penetapan Status Penggunaan oleh Kepala KPKNL/Kanwil."
    ]
  },
  "penjualan": {
    title: "Penjualan dan Lelang BMN",
    date: "Terakhir diupdate: 10 Jan 2026",
    content: "Penjualan BMN dilakukan melalui mekanisme lelang umum secara online (e-Auction) melalui portal lelang.go.id untuk menjamin transparansi dan harga yang adil.",
    steps: [
      "Satker mengajukan permohonan penilaian BMN.",
      "KPKNL/Penilai Pemerintah menetapkan Nilai Wajar dan Nilai Limit.",
      "Satker mengajukan permohonan lelang ke KPKNL.",
      "Pejabat Lelang menetapkan jadwal lelang.",
      "Pelaksanaan lelang dan pelunasan oleh pemenang."
    ]
  },
  "sewa": {
    title: "Sewa Barang Milik Negara",
    date: "Terakhir diupdate: 5 Feb 2026",
    content: "Pemanfaatan BMN oleh pihak ketiga dalam jangka waktu tertentu dengan imbalan uang tunai. Ini bisa berupa sewa kantin, ATM, atau lahan untuk bisnis.",
    steps: [
      "Mitra mengajukan surat minat sewa ke Satker.",
      "Satker mengajukan permohonan persetujuan sewa ke KPKNL.",
      "KPKNL melakukan penilaian besaran sewa.",
      "Penerbitan surat persetujuan sewa.",
      "Pembayaran uang sewa ke Kas Negara."
    ]
  },
  "penghapusan": {
    title: "Penghapusan BMN",
    date: "Terakhir diupdate: 1 Feb 2026",
    content: "Proses mengeluarkan BMN dari daftar barang karena sudah rusak berat, hilang, atau sebab lain yang sah.",
    steps: [
      "Satker membentuk panitia penghapusan.",
      "Cek fisik barang yang akan dihapus.",
      "Pengajuan SK Penghapusan ke KPKNL."
    ]
  },
  "pinjam-pakai": {
    title: "Pinjam Pakai BMN",
    date: "Terakhir diupdate: 3 Feb 2026",
    content: "Pemanfaatan BMN antar instansi pemerintah (Pusat/Daerah) tanpa imbalan uang, untuk menunjang tugas dan fungsi.",
    steps: [
      "Instansi peminjam mengajukan permohonan.",
      "Perjanjian pinjam pakai antara kedua belah pihak.",
      "Serah terima barang."
    ]
  },
  "alih-status": {
    title: "Alih Status Penggunaan",
    date: "Terakhir diupdate: 4 Feb 2026",
    content: "Pengalihan status penggunaan BMN dari satu pengguna barang ke pengguna barang lainnya (misal: dari Kemenkeu ke Kemenag).",
    steps: [
      "Kesepakatan antar kementerian/lembaga.",
      "Pengajuan permohonan ke DJKN.",
      "Penerbitan SK Alih Status."
    ]
  }
};