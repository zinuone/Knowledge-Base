// File: src/App.tsx
import React, { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { collection, query, orderBy, onSnapshot } from 'firebase/firestore';
import { db } from './src/firebase';
import {
  Search, FileText, Hammer, Key, Trash2, Clock, RefreshCw,
  Info, Phone, BookOpen, Mail, ArrowUp, Timer, HelpCircle, LogIn,
  Menu, X, ChevronLeft, ChevronRight, Eye, List, Grid
} from 'lucide-react';
import ReactMarkdown from 'react-markdown';
import KnowledgeCard from './src/components/KnowledgeCard';
import FAQItem from './src/components/FAQItem';

// Tipe Data
interface ContentData {
  id: string;
  title: string;
  category: string;
  description: string;
  updatedAt?: any;
}

interface FAQData {
  id: string;
  question: string;
  answer: string;
}

interface GuideData {
  id: string;
  content: string;
}

const App: React.FC = () => {
  const [searchQuery, setSearchQuery] = useState('');
  const [documents, setDocuments] = useState<ContentData[]>([]);
  const [faqs, setFaqs] = useState<FAQData[]>([]);
  const [guides, setGuides] = useState<GuideData[]>([]);
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  
  // STATE TABEL
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(5);

  const navigate = useNavigate();

  // 1. DATA MENU UTAMA
  const categories = [
    { id: 'psp', title: 'PSP', description: 'Penggunaan, Pemanfaatan, Pemindahtanganan BMN', icon: <FileText className="w-8 h-8" />, color: 'bg-emerald-50 text-[#0D5C35]' },
    { id: 'penjualan', title: 'PENJUALAN', description: 'Pengelolaan Lelang dan Penjualan BMN', icon: <Hammer className="w-8 h-8" />, color: 'bg-amber-50 text-amber-700' },
    { id: 'sewa', title: 'SEWA', description: 'Mekanisme dan Prosedur Sewa BMN', icon: <Key className="w-8 h-8" />, color: 'bg-blue-50 text-blue-700' },
    { id: 'penghapusan', title: 'PENGHAPUSAN', description: 'Proses Penghapusan Barang Milik Negara', icon: <Trash2 className="w-8 h-8" />, color: 'bg-rose-50 text-rose-700' },
    { id: 'pinjam-pakai', title: 'PINJAM PAKAI', description: 'Aturan Pinjam Pakai Antar Instansi', icon: <Clock className="w-8 h-8" />, color: 'bg-indigo-50 text-indigo-700' },
    { id: 'penggunaan-sementara', title: 'PENGGUNAAN SEMENTARA', description: 'Penggunaan BMN dalam jangka waktu tertentu', icon: <Timer className="w-8 h-8" />, color: 'bg-purple-50 text-purple-700' },
    { id: 'alih-status', title: 'ALIH STATUS', description: 'Alih Status Penggunaan Barang Milik Negara', icon: <RefreshCw className="w-8 h-8" />, color: 'bg-teal-50 text-teal-700' }
  ];

  // 2. FETCH DATA
  useEffect(() => {
    const qSop = query(collection(db, "knowledge-base"), orderBy("updatedAt", "desc"));
    const unsubSop = onSnapshot(qSop, (snap) => setDocuments(snap.docs.map(d => ({ id: d.id, ...d.data() })) as ContentData[]));
    const qFaq = query(collection(db, "faqs"), orderBy("createdAt", "desc"));
    const unsubFaq = onSnapshot(qFaq, (snap) => setFaqs(snap.docs.map(d => ({ id: d.id, ...d.data() })) as FAQData[]));
    const qGuide = query(collection(db, "guides"), orderBy("updatedAt", "desc"));
    const unsubGuide = onSnapshot(qGuide, (snap) => setGuides(snap.docs.map(d => ({ id: d.id, ...d.data() })) as GuideData[]));
    return () => { unsubSop(); unsubFaq(); unsubGuide(); };
  }, []);

  // 3. FILTER LOGIC
  const searchResults = useMemo(() => {
    if (!searchQuery) return [];
    return documents.filter(doc =>
      doc.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      doc.description.toLowerCase().includes(searchQuery.toLowerCase())
    );
  }, [searchQuery, documents]);

  // Pagination Logic
  const filteredTableDocs = documents.filter(doc => 
    doc.title.toLowerCase().includes(searchQuery.toLowerCase()) || 
    doc.category.toLowerCase().includes(searchQuery.toLowerCase())
  );
  const indexOfLastItem = currentPage * itemsPerPage;
  const indexOfFirstItem = indexOfLastItem - itemsPerPage;
  const currentTableDocs = filteredTableDocs.slice(indexOfFirstItem, indexOfLastItem);
  const totalPages = Math.ceil(filteredTableDocs.length / itemsPerPage);

  // --- ACTIONS ---
  const handleCategoryClick = (id: string) => navigate(`/category/${id}`);
  const handleDocClick = (id: string) => navigate(`/detail/${id}`);
  
  const scrollToSection = (id: string) => {
    const el = document.getElementById(id);
    if (el) el.scrollIntoView({ behavior: 'smooth' });
    setIsMenuOpen(false);
  };

  // FUNGSI BARU: AUTO SCROLL SAAT SEARCH
  const handleSearchAction = () => {
    // Scroll otomatis ke bagian tabel
    const tableSection = document.getElementById('document-table-section');
    if (tableSection) {
      tableSection.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  };

  const formatDate = (timestamp: any) => {
    if (!timestamp) return '-';
    return new Date(timestamp.seconds * 1000).toLocaleString('id-ID', {
      day: 'numeric', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit'
    });
  };

  // --- KOMPONEN SECTION HOME ---
  const SectionHome = () => (
    <div className="space-y-4"> {/* Kurangi spacing container utama */}
      
      {/* 1. SECTION GRID KATEGORI */}
      <section>
        <div className="flex items-center space-x-2 mb-6 px-2">
          <Grid className="w-5 h-5 text-[#0D5C35]" />
          <h3 className="font-bold text-slate-700 text-lg uppercase tracking-wider">Kategori Layanan</h3>
        </div>
        
        {/* TAMPILAN PENCARIAN DI GRID (Jika user scroll manual ke atas) */}
        {searchQuery && searchResults.length > 0 && (
           <div className="mb-8 p-4 bg-emerald-50 border border-emerald-100 rounded-2xl">
              <p className="text-emerald-800 text-sm font-bold mb-4">Hasil Pencarian Cepat:</p>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {searchResults.slice(0,3).map((doc) => (
                  <div key={doc.id} onClick={() => handleDocClick(doc.id)} className="bg-white p-4 rounded-xl shadow-sm cursor-pointer hover:shadow-md border border-emerald-100 transition-all">
                    <div className="text-xs font-bold text-emerald-600 uppercase mb-1">{doc.category}</div>
                    <div className="font-bold text-slate-800 text-sm">{doc.title}</div>
                  </div>
                ))}
              </div>
           </div>
        )}

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {categories.map((cat) => (
            <div key={cat.id} onClick={() => handleCategoryClick(cat.id)} className="cursor-pointer transition-transform hover:scale-105 active:scale-95 h-full">
              <KnowledgeCard title={cat.title} description={cat.description} icon={cat.icon} colorClass={cat.color} />
            </div>
          ))}
        </div>
      </section>

      {/* 2. PEMISAH / SEPARATOR (VISUAL BARU) */}
      <div className="relative flex items-center py-16">
        <div className="flex-grow border-t-2 border-slate-100"></div>
        <span className="flex-shrink-0 mx-4 text-slate-400 text-xs font-bold uppercase tracking-widest bg-[#F8FAF9] px-4 py-2 rounded-full border border-slate-200 shadow-sm">
          Atau telusuri database lengkap
        </span>
        <div className="flex-grow border-t-2 border-slate-100"></div>
      </div>

      {/* 3. TABEL DATA LENGKAP (TARGET SCROLL) */}
      <section id="document-table-section" className="scroll-mt-32 bg-white rounded-3xl shadow-sm border border-slate-200 overflow-hidden">
        <div className="p-6 border-b border-slate-100 flex flex-col md:flex-row justify-between items-center gap-4 bg-slate-50/50">
          <div className="flex items-center space-x-2">
            <List className="w-5 h-5 text-[#0D5C35]" />
            <h3 className="font-bold text-slate-800 text-lg">Daftar Seluruh Dokumen</h3>
          </div>
          
          <div className="flex items-center space-x-4 text-sm w-full md:w-auto">
            <div className="flex items-center text-slate-600">
              <span className="mr-2">Tampil</span>
              <select 
                value={itemsPerPage} 
                onChange={(e) => { setItemsPerPage(Number(e.target.value)); setCurrentPage(1); }}
                className="border border-slate-300 rounded-lg px-2 py-1 bg-white focus:ring-2 focus:ring-[#0D5C35] outline-none"
              >
                <option value={5}>5</option><option value={10}>10</option><option value={20}>20</option>
              </select>
              <span className="ml-2">data</span>
            </div>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead className="bg-slate-50 text-slate-600 font-bold uppercase tracking-wider border-b border-slate-200">
              <tr><th className="px-6 py-4 w-16 text-center">#</th><th className="px-6 py-4">Judul Dokumen / Informasi</th><th className="px-6 py-4 w-40 text-center">Aksi</th></tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {currentTableDocs.length > 0 ? (
                currentTableDocs.map((doc, index) => (
                  <tr key={doc.id} className="hover:bg-slate-50 transition-colors group">
                    <td className="px-6 py-4 text-center text-slate-400 font-medium">{indexOfFirstItem + index + 1}</td>
                    <td className="px-6 py-4">
                      <span className="inline-block px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider bg-slate-100 text-slate-500 mb-1 border border-slate-200">{doc.category.replace('-', ' ')}</span>
                      <h4 className="text-slate-900 font-bold text-base mb-1 group-hover:text-[#0D5C35] transition-colors">{doc.title}</h4>
                      <p className="text-slate-400 text-xs flex items-center">Update: {formatDate(doc.updatedAt)}</p>
                    </td>
                    <td className="px-6 py-4 text-center">
                      <button onClick={() => handleDocClick(doc.id)} className="inline-flex items-center px-4 py-2 bg-[#00A3C8] text-white rounded-lg font-bold shadow-md shadow-cyan-100 hover:bg-[#008CAE] hover:shadow-lg hover:-translate-y-0.5 transition-all text-xs">
                        <Eye className="w-3 h-3 mr-1.5" /> Lihat
                      </button>
                    </td>
                  </tr>
                ))
              ) : (
                <tr><td colSpan={3} className="px-6 py-10 text-center text-slate-400 italic bg-slate-50/30">Tidak ada dokumen yang ditemukan untuk pencarian "{searchQuery}".</td></tr>
              )}
            </tbody>
          </table>
        </div>

        <div className="p-4 border-t border-slate-100 flex flex-col md:flex-row justify-between items-center gap-4 text-sm text-slate-500">
          <div>Menampilkan {currentTableDocs.length > 0 ? indexOfFirstItem + 1 : 0} sampai {Math.min(indexOfLastItem, filteredTableDocs.length)} dari {filteredTableDocs.length} data</div>
          <div className="flex items-center space-x-2">
            <button onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))} disabled={currentPage === 1} className="p-2 border border-slate-200 rounded-lg hover:bg-slate-50 disabled:opacity-50 disabled:cursor-not-allowed"><ChevronLeft className="w-4 h-4" /></button>
            <div className="px-3 font-bold text-slate-700">Halaman {currentPage}</div>
            <button onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))} disabled={currentPage === totalPages || totalPages === 0} className="p-2 border border-slate-200 rounded-lg hover:bg-slate-50 disabled:opacity-50 disabled:cursor-not-allowed"><ChevronRight className="w-4 h-4" /></button>
          </div>
        </div>
      </section>
    </div>
  );

  const SectionFAQ = () => (
    <div className="max-w-3xl mx-auto">
      <div className="text-center mb-10"><div className="inline-flex items-center justify-center p-3 bg-amber-50 text-amber-600 rounded-xl mb-4"><HelpCircle className="w-6 h-6" /></div><h2 className="text-3xl font-bold text-slate-900 mb-2">Pertanyaan Populer</h2><p className="text-slate-500">Temukan jawaban cepat</p></div>
      <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">{faqs.length > 0 ? faqs.map((faq, idx) => <FAQItem key={faq.id} question={faq.question} answer={faq.answer} isLast={idx === faqs.length - 1} />) : <div className="p-10 text-center text-slate-500">Belum ada FAQ.</div>}</div>
    </div>
  );

  const SectionPanduan = () => (
    <div className="max-w-4xl mx-auto bg-white p-10 rounded-3xl shadow-sm border border-slate-200">
      <div className="flex items-center space-x-4 mb-8"><div className="p-3 bg-[#EAF2EE] text-[#0D5C35] rounded-xl"><BookOpen className="w-8 h-8" /></div><h2 className="text-3xl font-bold text-slate-900">Panduan Pengguna</h2></div>
      <div className="prose prose-slate max-w-none prose-p:text-slate-600 prose-li:marker:text-[#0D5C35] prose-strong:text-slate-800">{guides.length > 0 ? guides.map((guide) => <div key={guide.id} className="mb-8 border-b border-slate-50 last:border-0 pb-4 last:pb-0"><ReactMarkdown>{guide.content}</ReactMarkdown></div>) : <div className="text-center py-10 border-2 border-dashed border-slate-100 rounded-xl bg-slate-50"><p className="text-slate-400 italic">Belum ada data panduan.</p></div>}</div>
      <button onClick={() => scrollToSection('top')} className="mt-8 flex items-center text-slate-400 hover:text-[#0D5C35] transition-colors font-medium"><ArrowUp className="w-4 h-4 mr-2" /> Kembali ke Atas</button>
    </div>
  );

  const SectionKontak = () => (
    <div className="max-w-4xl mx-auto bg-white p-10 rounded-3xl shadow-sm border border-slate-200">
      <div className="flex items-center space-x-4 mb-8"><div className="p-3 bg-[#EAF2EE] text-[#0D5C35] rounded-xl"><Phone className="w-8 h-8" /></div><h2 className="text-3xl font-bold text-slate-900">Hubungi Kami</h2></div>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-8"><div className="bg-slate-50 p-6 rounded-2xl border border-slate-100"><h4 className="font-bold text-slate-800 flex items-center mb-2"><Mail className="w-4 h-4 mr-2 text-[#0D5C35]" /> Email Resmi</h4><p className="text-slate-600">kpknl.kendari@kemenkeu.go.id</p></div><div className="bg-slate-50 p-6 rounded-2xl border border-slate-100"><h4 className="font-bold text-slate-800 flex items-center mb-2"><Info className="w-4 h-4 mr-2 text-[#0D5C35]" /> Alamat Kantor</h4><p className="text-slate-600">Jl. Ahmad Yani No. 1, Kota Kendari</p></div></div>
      <button onClick={() => scrollToSection('top')} className="mt-8 flex items-center text-slate-400 hover:text-[#0D5C35] transition-colors font-medium"><ArrowUp className="w-4 h-4 mr-2" /> Kembali ke Atas</button>
    </div>
  );

  return (
    <div className="min-h-screen flex flex-col font-sans relative" id="top">
      {/* HEADER */}
      <header className="relative bg-gradient-to-br from-[#0D5C35] via-[#0A492A] to-[#083D23] text-white pb-32 pt-16 px-4">
        <nav className="absolute top-0 left-0 right-0 p-6 max-w-7xl mx-auto z-50">
          <div className="flex justify-between items-center">
            <div className="flex items-center space-x-3 cursor-pointer" onClick={() => scrollToSection('top')}>
              <div className="bg-white p-1.5 rounded-lg shadow-md"><img src="/logo.png" alt="Logo" className="w-8 h-8 object-contain" onError={(e) => { e.currentTarget.src = 'https://upload.wikimedia.org/wikipedia/commons/thumb/8/82/Coat_of_arms_of_Indonesia.svg/1200px-Coat_of_arms_of_Indonesia.svg.png' }} /></div>
              <div className="flex flex-col"><span className="font-bold text-base sm:text-lg leading-none tracking-tight">KPKNL KENDARI</span><span className="text-[9px] sm:text-[10px] uppercase opacity-80 tracking-widest text-[#D4AF37]">Divisi PKN</span></div>
            </div>
            <div className="hidden md:flex items-center space-x-6">
              <div className="flex space-x-6 text-sm font-semibold uppercase tracking-wider">{['Beranda', 'FAQ', 'Panduan', 'Kontak'].map(item => (<button key={item} onClick={() => scrollToSection(item.toLowerCase())} className="hover:text-[#D4AF37] transition-colors text-white">{item}</button>))}</div>
              <button onClick={() => navigate('/login')} className="flex items-center px-4 py-2 bg-white/10 hover:bg-white/20 backdrop-blur-sm rounded-full text-xs font-bold border border-white/20 transition-all"><LogIn className="w-3 h-3 mr-1.5" /> ADMIN</button>
            </div>
            <div className="md:hidden flex items-center gap-3"><button onClick={() => setIsMenuOpen(!isMenuOpen)} className="text-white p-2 hover:bg-white/10 rounded-lg">{isMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}</button></div>
          </div>
          {isMenuOpen && (<div className="md:hidden absolute top-full left-0 right-0 mt-4 mx-4 bg-[#0A492A] rounded-2xl shadow-2xl border border-white/10 p-4 flex flex-col space-y-2 animate-in slide-in-from-top-5 duration-200">{['Beranda', 'FAQ', 'Panduan', 'Kontak'].map(item => (<button key={item} onClick={() => scrollToSection(item.toLowerCase())} className="text-left px-4 py-3 rounded-xl hover:bg-white/10 text-white font-semibold flex items-center"><FileText className="w-4 h-4 mr-3 opacity-70" /> {item}</button>))}<div className="mt-4 pt-4 border-t border-white/10"><button onClick={() => navigate('/login')} className="w-full text-left px-4 py-3 rounded-xl bg-white/10 text-[#D4AF37] font-bold flex items-center hover:bg-white/20 transition-all"><LogIn className="w-4 h-4 mr-3" /> LOGIN ADMIN</button></div></div>)}
        </nav>

        {/* HERO SECTION DENGAN SEARCH LOGIC BARU */}
        <div className="max-w-4xl mx-auto text-center mt-12">
          <h1 className="text-4xl md:text-5xl font-extrabold mb-6 tracking-tight">KNOWLEDGE BASE <br className="sm:hidden" /> <span className="text-[#D4AF37]">KPKNL KENDARI</span></h1>
          <p className="text-slate-200 mb-10 text-lg max-w-2xl mx-auto opacity-90">Sistem informasi terintegrasi pengelolaan kekayaan negara.</p>
          <div className="relative max-w-2xl mx-auto">
            <div className="relative group">
              <input 
                type="text" 
                className="w-full py-4 px-6 pl-14 rounded-full bg-white text-slate-900 shadow-2xl outline-none focus:ring-4 focus:ring-[#D4AF37]/30 transition-all text-lg placeholder:text-slate-400" 
                placeholder="Cari SOP atau Layanan..." 
                value={searchQuery} 
                onChange={(e) => setSearchQuery(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleSearchAction()} // LOGIC ENTER
              />
              <button onClick={handleSearchAction} className="absolute left-5 top-1/2 transform -translate-y-1/2 text-slate-400 hover:text-[#0D5C35] transition-colors">
                <Search className="w-6 h-6" />
              </button>
            </div>
          </div>
        </div>
      </header>

      {/* MAIN CONTENT */}
      <main className="flex-grow max-w-7xl mx-auto px-4 -mt-16 relative z-10 w-full mb-20 space-y-32">
        <div id="beranda"><SectionHome /></div>
        <div id="faq" className="pt-10 scroll-mt-20"><SectionFAQ /></div>
        <div id="panduan" className="pt-10 scroll-mt-20"><SectionPanduan /></div>
        <div id="kontak" className="pt-10 scroll-mt-20"><SectionKontak /></div>
      </main>

      <footer className="bg-[#0A492A] text-[#EAF2EE]/70 py-12 px-4 border-t border-white/5">
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row justify-between items-center space-y-4 md:space-y-0">
          <div className="text-center md:text-left"><p className="text-white font-bold text-lg mb-1 flex items-center justify-center md:justify-start"><span className="text-[#D4AF37] mr-2">◆</span> KPKNL Kendari</p><p className="text-sm">Direktorat Jenderal Kekayaan Negara (DJKN)</p><p className="text-xs mt-1 text-[#D4AF37] opacity-80 uppercase tracking-widest">Kementerian Keuangan RI</p></div>
          <div className="text-center md:text-right"><p className="text-sm font-medium">Copyright © 2026 KPKNL Kendari</p><p className="text-xs mt-1 text-slate-400 italic">"Melayani dengan Hati, Mengelola dengan Integritas"</p></div>
        </div>
      </footer>
    </div>
  );
};

export default App;