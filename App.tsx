// File: src/App.tsx
import React, { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { collection, query, orderBy, onSnapshot } from 'firebase/firestore';
import { db } from './src/firebase';
import {
  Search, FileText, Hammer, Key, Trash2, Clock, RefreshCw, LayoutGrid,
  Info, Phone, BookOpen, Mail, ArrowUp, Timer, HelpCircle
} from 'lucide-react'; // Tambah Timer dan HelpCircle
import KnowledgeCard from './src/components/KnowledgeCard';
import FAQItem from './src/components/FAQItem';

// Tipe Data
interface ContentData {
  id: string;
  title: string;
  category: string;
  description: string;
}

interface FAQData {
  id: string;
  question: string;
  answer: string;
}

const App: React.FC = () => {
  const [searchQuery, setSearchQuery] = useState('');
  const [documents, setDocuments] = useState<ContentData[]>([]);
  const [faqs, setFaqs] = useState<FAQData[]>([]);
  const navigate = useNavigate();

  // 1. DATA MENU UTAMA (SEKARANG ADA 7)
  const categories = [
    { id: 'psp', title: 'PSP', description: 'Penggunaan, Pemanfaatan, Pemindahtanganan BMN', icon: <FileText className="w-8 h-8" />, color: 'bg-emerald-50 text-[#0D5C35]' },
    { id: 'penjualan', title: 'PENJUALAN', description: 'Pengelolaan Lelang dan Penjualan BMN', icon: <Hammer className="w-8 h-8" />, color: 'bg-amber-50 text-amber-700' },
    { id: 'sewa', title: 'SEWA', description: 'Mekanisme dan Prosedur Sewa BMN', icon: <Key className="w-8 h-8" />, color: 'bg-blue-50 text-blue-700' },
    { id: 'penghapusan', title: 'PENGHAPUSAN', description: 'Proses Penghapusan Barang Milik Negara', icon: <Trash2 className="w-8 h-8" />, color: 'bg-rose-50 text-rose-700' },
    { id: 'pinjam-pakai', title: 'PINJAM PAKAI', description: 'Aturan Pinjam Pakai Antar Instansi', icon: <Clock className="w-8 h-8" />, color: 'bg-indigo-50 text-indigo-700' },
    // MENU BARU KE-6
    { id: 'penggunaan-sementara', title: 'PENGGUNAAN SEMENTARA', description: 'Penggunaan BMN dalam jangka waktu tertentu', icon: <Timer className="w-8 h-8" />, color: 'bg-purple-50 text-purple-700' },
    { id: 'alih-status', title: 'ALIH STATUS', description: 'Alih Status Penggunaan Barang Milik Negara', icon: <RefreshCw className="w-8 h-8" />, color: 'bg-teal-50 text-teal-700' }
  ];

  // 2. AMBIL DATA DARI FIREBASE
  useEffect(() => {
    // SOP
    const qSop = query(collection(db, "knowledge-base"), orderBy("updatedAt", "desc"));
    const unsubSop = onSnapshot(qSop, (snapshot) => {
      const docs = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })) as ContentData[];
      setDocuments(docs);
    });

    // FAQ
    const qFaq = query(collection(db, "faqs"), orderBy("createdAt", "desc"));
    const unsubFaq = onSnapshot(qFaq, (snapshot) => {
      const faqList = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })) as FAQData[];
      setFaqs(faqList);
    });

    return () => { unsubSop(); unsubFaq(); };
  }, []);

  // 3. FILTER SEARCH
  const searchResults = useMemo(() => {
    if (!searchQuery) return [];
    return documents.filter(doc =>
      doc.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      doc.description.toLowerCase().includes(searchQuery.toLowerCase())
    );
  }, [searchQuery, documents]);

  // Navigasi
  const handleCategoryClick = (id: string) => navigate(`/category/${id}`);
  const handleDocClick = (id: string) => navigate(`/detail/${id}`);

  // FUNGSI SCROLL (PENTING BUAT NAVBAR)
  const scrollToSection = (id: string) => {
    const element = document.getElementById(id);
    if (element) element.scrollIntoView({ behavior: 'smooth' });
  };

  // --- BAGIAN-BAGIAN HALAMAN ---

  const SectionHome = () => (
    <div className="space-y-20">
      <section>
        {searchQuery ? (
          <div className="space-y-6">
            <h3 className="font-bold text-slate-700 text-lg">Hasil Pencarian: "{searchQuery}"</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {searchResults.length > 0 ? (
                searchResults.map((doc) => (
                  <div key={doc.id} onClick={() => handleDocClick(doc.id)} className="cursor-pointer transition-transform hover:scale-105">
                    <KnowledgeCard title={doc.title} description={doc.description} icon={<FileText className="w-8 h-8" />} colorClass="bg-slate-100 text-slate-700" />
                  </div>
                ))
              ) : (
                <div className="col-span-full py-10 text-center text-slate-500 border border-dashed rounded-2xl">Tidak ada dokumen ditemukan.</div>
              )}
            </div>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {categories.map((cat) => (
              <div key={cat.id} onClick={() => handleCategoryClick(cat.id)} className="cursor-pointer transition-transform hover:scale-105 active:scale-95">
                <KnowledgeCard title={cat.title} description={cat.description} icon={cat.icon} colorClass={cat.color} />
              </div>
            ))}
          </div>
        )}
      </section>
    </div>
  );

  const SectionFAQ = () => (
    <div className="max-w-3xl mx-auto">
      <div className="text-center mb-10">
        <div className="inline-flex items-center justify-center p-3 bg-amber-50 text-amber-600 rounded-xl mb-4">
          <HelpCircle className="w-6 h-6" />
        </div>
        <h2 className="text-3xl font-bold text-slate-900 mb-2">Pertanyaan Populer</h2>
        <p className="text-slate-500">Temukan jawaban cepat untuk pertanyaan yang sering diajukan</p>
      </div>
      <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
        {faqs.length > 0 ? (
          faqs.map((faq, idx) => (
            <FAQItem
              key={faq.id}
              question={faq.question}
              answer={faq.answer}
              isLast={idx === faqs.length - 1}
            />
          ))
        ) : (
          <div className="p-10 text-center text-slate-500">
            Belum ada pertanyaan populer.
          </div>
        )}
      </div>
    </div>
  );

  const SectionPanduan = () => (
    <div className="max-w-4xl mx-auto bg-white p-10 rounded-3xl shadow-sm border border-slate-200">
      <div className="flex items-center space-x-4 mb-8">
        <div className="p-3 bg-[#EAF2EE] text-[#0D5C35] rounded-xl"><BookOpen className="w-8 h-8" /></div>
        <h2 className="text-3xl font-bold text-slate-900">Panduan Pengguna</h2>
      </div>
      <div className="prose prose-slate max-w-none">
        <p>Gunakan menu kategori di atas untuk mencari SOP spesifik sesuai layanan yang Anda butuhkan, atau gunakan kolom pencarian untuk hasil cepat.</p>
        <p>Anda juga dapat melihat bagian FAQ untuk pertanyaan umum.</p>
      </div>
      <button onClick={() => scrollToSection('top')} className="mt-8 flex items-center text-slate-400 hover:text-[#0D5C35] transition-colors font-medium">
        <ArrowUp className="w-4 h-4 mr-2" /> Kembali ke Atas
      </button>
    </div>
  );

  const SectionKontak = () => (
    <div className="max-w-4xl mx-auto bg-white p-10 rounded-3xl shadow-sm border border-slate-200">
      <div className="flex items-center space-x-4 mb-8">
        <div className="p-3 bg-[#EAF2EE] text-[#0D5C35] rounded-xl"><Phone className="w-8 h-8" /></div>
        <h2 className="text-3xl font-bold text-slate-900">Hubungi Kami</h2>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        <div className="bg-slate-50 p-6 rounded-2xl border border-slate-100">
          <h4 className="font-bold text-slate-800 flex items-center mb-2"><Mail className="w-4 h-4 mr-2 text-[#0D5C35]" /> Email Resmi</h4>
          <p className="text-slate-600">kpknl.kendari@kemenkeu.go.id</p>
        </div>
        <div className="bg-slate-50 p-6 rounded-2xl border border-slate-100">
          <h4 className="font-bold text-slate-800 flex items-center mb-2"><Info className="w-4 h-4 mr-2 text-[#0D5C35]" /> Alamat Kantor</h4>
          <p className="text-slate-600">Jl. Ahmad Yani No. 1, Kota Kendari</p>
        </div>
      </div>
      <button onClick={() => scrollToSection('top')} className="mt-8 flex items-center text-slate-400 hover:text-[#0D5C35] transition-colors font-medium">
        <ArrowUp className="w-4 h-4 mr-2" /> Kembali ke Atas
      </button>
    </div>
  );

  return (
    <div className="min-h-screen flex flex-col font-sans relative" id="top">
      {/* HEADER */}
      <header className="relative bg-gradient-to-br from-[#0D5C35] via-[#0A492A] to-[#083D23] text-white pb-32 pt-16 px-4">
        <nav className="absolute top-0 left-0 right-0 p-6 flex justify-between items-center max-w-7xl mx-auto z-50">
          <div className="flex items-center space-x-3 cursor-pointer" onClick={() => scrollToSection('top')}>
            <div className="bg-white p-2 rounded-lg"><LayoutGrid className="text-[#0D5C35] w-6 h-6" /></div>
            <div className="flex flex-col"><span className="font-bold text-lg leading-none hidden sm:inline">KPKNL KENDARI</span><span className="text-[10px] uppercase opacity-70 hidden sm:inline">Divisi PKN</span></div>
          </div>
          <div className="flex space-x-8 text-sm font-semibold uppercase tracking-wider">
            <button onClick={() => scrollToSection('top')} className="hover:text-[#D4AF37] text-white">Beranda</button>
            {/* MENU FAQ DISELIPKAN DISINI */}
            <button onClick={() => scrollToSection('faq')} className="hover:text-[#D4AF37] text-white">FAQ</button>
            <button onClick={() => scrollToSection('panduan')} className="hover:text-[#D4AF37] text-white">Panduan</button>
            <button onClick={() => scrollToSection('kontak')} className="hover:text-[#D4AF37] text-white">Kontak</button>
          </div>
        </nav>
        <div className="max-w-4xl mx-auto text-center mt-12">
          <h1 className="text-4xl md:text-5xl font-extrabold mb-6 tracking-tight">KNOWLEDGE BASE <br className="sm:hidden" /> <span className="text-[#D4AF37]">KPKNL KENDARI</span></h1>
          <p className="text-slate-200 mb-10 text-lg max-w-2xl mx-auto opacity-90">Sistem informasi terintegrasi pengelolaan kekayaan negara.</p>
          <div className="relative max-w-2xl mx-auto">
            <div className="relative group">
              <input type="text" className="w-full py-4 px-6 pl-14 rounded-full bg-white text-slate-900 shadow-2xl outline-none" placeholder="Cari SOP atau Layanan..." value={searchQuery} onChange={(e) => { setSearchQuery(e.target.value); scrollToSection('top'); }} />
              <Search className="absolute left-5 top-1/2 transform -translate-y-1/2 text-slate-400 w-6 h-6" />
            </div>
          </div>
        </div>
      </header>

      {/* MAIN CONTENT */}
      <main className="flex-grow max-w-7xl mx-auto px-4 -mt-16 relative z-10 w-full mb-20 space-y-32">
        <div id="home"><SectionHome /></div>
        {/* BAGIAN FAQ (DIBERI ID "faq" AGAR BISA DISCROLL) */}
        <div id="faq" className="pt-10 scroll-mt-20"><SectionFAQ /></div>
        <div id="panduan" className="pt-10 scroll-mt-20"><SectionPanduan /></div>
        <div id="kontak" className="pt-10 scroll-mt-20"><SectionKontak /></div>
      </main>

      {/* FOOTER LENGKAP */}
      <footer className="bg-[#0A492A] text-[#EAF2EE]/70 py-12 px-4 border-t border-white/5">
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row justify-between items-center space-y-4 md:space-y-0">
          <div className="text-center md:text-left">
            <p className="text-white font-bold text-lg mb-1 flex items-center justify-center md:justify-start">
              <span className="text-[#D4AF37] mr-2">◆</span> KPKNL Kendari
            </p>
            <p className="text-sm">Direktorat Jenderal Kekayaan Negara (DJKN)</p>
            <p className="text-xs mt-1 text-[#D4AF37] opacity-80 uppercase tracking-widest">Kementerian Keuangan RI</p>
          </div>
          <div className="text-center md:text-right">
            <p className="text-sm font-medium">
              Copyright © 2026 KPKNL Kendari
              <span
                onClick={() => navigate('/login')}
                className="ml-2 opacity-0 hover:opacity-100 cursor-pointer transition-opacity text-xs text-slate-500"
                title="Login Admin"
              >
                (Admin)
              </span>
            </p>
            <p className="text-xs mt-1 text-slate-400 italic">"Melayani dengan Hati, Mengelola dengan Integritas"</p>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default App;