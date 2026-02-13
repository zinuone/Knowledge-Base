// File: src/App.tsx
import React, { useState, useEffect, useMemo, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { collection, query, orderBy, onSnapshot } from 'firebase/firestore';
import { db } from './src/firebase';
import {
  Search, FileText, Hammer, Key, Trash2, Clock, RefreshCw,
  Info, Phone, BookOpen, Mail, ArrowUp, Timer, HelpCircle, LogIn,
  Menu, X, ChevronLeft, ChevronRight, Eye, List, Grid,
  Instagram, Globe, Facebook, Filter,
  Youtube,
  Scale,
} from 'lucide-react';
import ReactMarkdown from 'react-markdown';
import KnowledgeCard from './src/components/KnowledgeCard';
import FAQItem from './src/components/FAQItem';
import { SkeletonCard, SkeletonRow } from './src/components/SkeletonLoader';

// --- KOMPONEN BARU: SCROLL REVEAL (ANIMASI MUNCUL SAAT SCROLL) ---
const FadeInSection: React.FC<{ children: React.ReactNode, delay?: string }> = ({ children, delay }) => {
  const [isVisible, setIsVisible] = useState(false);
  const domRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const observer = new IntersectionObserver(entries => {
      entries.forEach(entry => {
        if (entry.isIntersecting) setIsVisible(true);
      });
    }, { threshold: 0.1 }); 

    const currentRef = domRef.current;
    if (currentRef) observer.observe(currentRef);
    return () => { if (currentRef) observer.unobserve(currentRef); };
  }, []);

  return (
    <div
      ref={domRef}
      className={`transition-all duration-1000 ease-out transform ${isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-24'
        } ${delay || ''}`}
    >
      {children}
    </div>
  );
};

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
  const [selectedCategoryFilter, setSelectedCategoryFilter] = useState('all');

  const [documents, setDocuments] = useState<ContentData[]>([]);
  const [faqs, setFaqs] = useState<FAQData[]>([]);
  const [guides, setGuides] = useState<GuideData[]>([]);
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isScrolled, setIsScrolled] = useState(false);

  const [isLoaded, setIsLoaded] = useState(false);
  const [isLoadingData, setIsLoadingData] = useState(true);

  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(5);

  const navigate = useNavigate();

  // DATA KATEGORI
  const categories = [
    { id: 'psp', title: 'PSP', description: 'Penggunaan, Pemanfaatan, Pemindahtanganan BMN', icon: <FileText className="w-8 h-8" />, color: 'bg-emerald-50 text-[#0D5C35]' },
    { id: 'penjualan', title: 'PENJUALAN', description: 'Pengelolaan Lelang dan Penjualan BMN', icon: <Hammer className="w-8 h-8" />, color: 'bg-amber-50 text-amber-700' },
    { id: 'sewa', title: 'SEWA', description: 'Mekanisme dan Prosedur Sewa BMN', icon: <Key className="w-8 h-8" />, color: 'bg-blue-50 text-blue-700' },
    { id: 'penghapusan', title: 'PENGHAPUSAN', description: 'Proses Penghapusan Barang Milik Negara', icon: <Trash2 className="w-8 h-8" />, color: 'bg-rose-50 text-rose-700' },
    { id: 'pinjam-pakai', title: 'PINJAM PAKAI', description: 'Aturan Pinjam Pakai Antar Instansi', icon: <Clock className="w-8 h-8" />, color: 'bg-indigo-50 text-indigo-700' },
    { id: 'penggunaan-sementara', title: 'PENGGUNAAN SEMENTARA', description: 'Penggunaan BMN dalam jangka waktu tertentu', icon: <Timer className="w-8 h-8" />, color: 'bg-purple-50 text-purple-700' },
    { id: 'alih-status', title: 'ALIH STATUS', description: 'Alih Status Penggunaan Barang Milik Negara', icon: <RefreshCw className="w-8 h-8" />, color: 'bg-teal-50 text-teal-700' }
  ];

  // FETCH DATA
  useEffect(() => {
    setTimeout(() => setIsLoaded(true), 100);
    setIsLoadingData(true);

    const qSop = query(collection(db, "knowledge-base"), orderBy("updatedAt", "desc"));
    const unsubSop = onSnapshot(qSop, (snap) => {
      setDocuments(snap.docs.map(d => ({ id: d.id, ...d.data() })) as ContentData[]);
      setIsLoadingData(false);
    });

    const qFaq = query(collection(db, "faqs"), orderBy("createdAt", "desc"));
    const unsubFaq = onSnapshot(qFaq, (snap) => setFaqs(snap.docs.map(d => ({ id: d.id, ...d.data() })) as FAQData[]));

    const qGuide = query(collection(db, "guides"), orderBy("updatedAt", "desc"));
    const unsubGuide = onSnapshot(qGuide, (snap) => setGuides(snap.docs.map(d => ({ id: d.id, ...d.data() })) as GuideData[]));

    // PERBAIKAN 1: Tambahkan logika auto-close menu saat scroll
    const handleScroll = () => {
        setIsScrolled(window.scrollY > 50);
        if (window.scrollY > 50 && isMenuOpen) {
            setIsMenuOpen(false); // Tutup menu jika user scroll
        }
    };
    window.addEventListener('scroll', handleScroll);

    return () => { unsubSop(); unsubFaq(); unsubGuide(); window.removeEventListener('scroll', handleScroll); };
  }, [isMenuOpen]); // Tambahkan isMenuOpen ke dependency

  // LOGIC FILTER
  const searchResults = useMemo(() => {
    if (!searchQuery) return [];
    return documents.filter(doc =>
      doc.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      doc.description.toLowerCase().includes(searchQuery.toLowerCase())
    );
  }, [searchQuery, documents]);

  const filteredTableDocs = useMemo(() => {
    return documents.filter(doc => {
      const matchesSearch = doc.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        doc.category.toLowerCase().includes(searchQuery.toLowerCase());
      const matchesCategory = selectedCategoryFilter === 'all' || doc.category === selectedCategoryFilter;
      return matchesSearch && matchesCategory;
    });
  }, [searchQuery, selectedCategoryFilter, documents]);

  const indexOfLastItem = currentPage * itemsPerPage;
  const indexOfFirstItem = indexOfLastItem - itemsPerPage;
  const currentTableDocs = filteredTableDocs.slice(indexOfFirstItem, indexOfLastItem);
  const totalPages = Math.ceil(filteredTableDocs.length / itemsPerPage);

  const handleCategoryClick = (id: string) => navigate(`/category/${id}`);
  const handleDocClick = (id: string) => navigate(`/detail/${id}`);
  const scrollToSection = (id: string) => {
    const el = document.getElementById(id);
    if (el) el.scrollIntoView({ behavior: 'smooth' });
    setIsMenuOpen(false);
  };
  const handleScrollTop = () => window.scrollTo({ top: 0, behavior: 'smooth' });
  const handleSearchAction = () => {
    const tableSection = document.getElementById('document-table-section');
    if (tableSection) tableSection.scrollIntoView({ behavior: 'smooth', block: 'start' });
  };

  const formatDate = (timestamp: any) => {
    if (!timestamp) return '-';
    return new Date(timestamp.seconds * 1000).toLocaleString('id-ID', {
      day: 'numeric', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit'
    });
  };

  const isNewDocument = (timestamp: any) => {
    if (!timestamp) return false;
    const docDate = new Date(timestamp.seconds * 1000);
    const diffTime = Math.abs(new Date().getTime() - docDate.getTime());
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return diffDays <= 30;
  };

  // COMPONENTS
  const SectionHome = () => (
    <div className="space-y-4">
      <section className={`transition-all duration-1000 delay-300 ease-out transform ${isLoaded ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-10'}`}>
        <div className="flex items-center space-x-3 mb-8 px-2 pl-4 border-l-4 border-[#D4AF37]">
          <Grid className="w-6 h-6 text-[#D4AF37]" />
          <h3 className="font-black text-white text-xl uppercase tracking-widest drop-shadow-sm">Kategori Layanan</h3>
        </div>
        {searchQuery && searchResults.length > 0 && (
          <div className="mb-8 p-4 bg-emerald-50 border border-emerald-100 rounded-2xl animate-in fade-in zoom-in duration-300">
            <p className="text-emerald-800 text-sm font-bold mb-4">Hasil Pencarian Cepat:</p>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {searchResults.slice(0, 3).map((doc) => (
                <div key={doc.id} onClick={() => handleDocClick(doc.id)} className="bg-white p-4 rounded-xl shadow-sm cursor-pointer hover:shadow-md border border-emerald-100 transition-all hover:scale-[1.02]">
                  <div className="text-xs font-bold text-emerald-600 uppercase mb-1">{doc.category}</div>
                  <div className="font-bold text-slate-800 text-sm">{doc.title}</div>
                </div>
              ))}
            </div>
          </div>
        )}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {!isLoaded ? Array.from({ length: 6 }).map((_, idx) => <SkeletonCard key={idx} />) :
            categories.map((cat, index) => (
              <div key={cat.id} onClick={() => handleCategoryClick(cat.id)} className="cursor-pointer transition-transform hover:scale-105 active:scale-95 h-full [animation-delay:var(--delay)]" style={{ '--delay': `${index * 100}ms` } as React.CSSProperties}>
                <KnowledgeCard title={cat.title} description={cat.description} icon={cat.icon} colorClass={cat.color} />
              </div>
            ))
          }
        </div>
      </section>

      <FadeInSection delay="delay-100">
        <div className="relative flex items-center py-16">
          <div className="flex-grow border-t-2 border-slate-100"></div>
          <span className="flex-shrink-0 mx-4 text-slate-400 text-xs font-bold uppercase tracking-widest bg-[#F8FAF9] px-4 py-2 rounded-full border border-slate-200 shadow-sm">Atau telusuri database lengkap</span>
          <div className="flex-grow border-t-2 border-slate-100"></div>
        </div>
      </FadeInSection>

      <FadeInSection delay="delay-200">
        <section id="document-table-section" className="bg-white rounded-3xl shadow-sm border border-slate-200 overflow-hidden">
          <div className="p-6 border-b border-slate-100 flex flex-col md:flex-row justify-between items-center gap-4 bg-slate-50/50 backdrop-blur-sm">
            <div className="flex items-center space-x-2">
              <List className="w-5 h-5 text-[#0D5C35]" />
              <h3 className="font-bold text-slate-800 text-lg">Daftar Seluruh Dokumen</h3>
            </div>
            <div className="flex flex-col sm:flex-row items-center space-y-2 sm:space-y-0 sm:space-x-4 text-sm w-full md:w-auto">
              <div className="flex items-center text-slate-600 bg-white border border-slate-300 rounded-lg px-2 py-1">
                <Filter className="w-4 h-4 mr-2 text-slate-400" />
                <select
                  value={selectedCategoryFilter}
                  onChange={(e) => { setSelectedCategoryFilter(e.target.value); setCurrentPage(1); }}
                  className="bg-transparent outline-none cursor-pointer text-slate-700 font-medium"
                >
                  <option value="all">Semua Kategori</option>
                  {categories.map(cat => <option key={cat.id} value={cat.id}>{cat.title}</option>)}
                </select>
              </div>
              <div className="flex items-center text-slate-600">
                <span className="mr-2">Tampil</span>
                <select value={itemsPerPage} onChange={(e) => { setItemsPerPage(Number(e.target.value)); setCurrentPage(1); }} className="border border-slate-300 rounded-lg px-2 py-1 bg-white focus:ring-2 focus:ring-[#0D5C35] outline-none cursor-pointer">
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
                {isLoadingData ? Array.from({ length: 5 }).map((_, idx) => <SkeletonRow key={idx} />) :
                  currentTableDocs.length > 0 ? (
                    currentTableDocs.map((doc, index) => (
                      <tr key={doc.id} className="hover:bg-slate-50 transition-all duration-200 hover:scale-[1.01] hover:shadow-sm cursor-default group bg-white">
                        <td className="px-6 py-4 text-center text-slate-400 font-medium">{indexOfFirstItem + index + 1}</td>
                        <td className="px-6 py-4">
                          <div className="flex items-center space-x-2 mb-1">
                            <span className="inline-block px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider bg-slate-100 text-slate-500 border border-slate-200 group-hover:bg-[#0D5C35] group-hover:text-white transition-colors">{doc.category.replace('-', ' ')}</span>
                            {isNewDocument(doc.updatedAt) && (
                              <span className="inline-block px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider bg-amber-100 text-amber-600 border border-amber-200 animate-pulse">Baru</span>
                            )}
                          </div>
                          <h4 className="text-slate-900 font-bold text-base mb-1 group-hover:text-[#0D5C35] transition-colors">{doc.title}</h4>
                          <p className="text-slate-400 text-xs flex items-center">Update: {formatDate(doc.updatedAt)}</p>
                        </td>
                        <td className="px-6 py-4 text-center">
                          <button onClick={() => handleDocClick(doc.id)} className="inline-flex items-center px-4 py-2 bg-[#00A3C8] text-white rounded-lg font-bold shadow-md shadow-cyan-100 hover:bg-[#008CAE] hover:shadow-lg hover:-translate-y-0.5 transition-all text-xs"><Eye className="w-3 h-3 mr-1.5" /> Lihat</button>
                        </td>
                      </tr>
                    ))
                  ) : (
                    <tr><td colSpan={3} className="px-6 py-10 text-center text-slate-400 italic bg-slate-50/30">Tidak ada dokumen yang ditemukan.</td></tr>
                  )}
              </tbody>
            </table>
          </div>
          <div className="p-4 border-t border-slate-100 flex flex-col md:flex-row justify-between items-center gap-4 text-sm text-slate-500">
            <div>Menampilkan {currentTableDocs.length > 0 ? indexOfFirstItem + 1 : 0} sampai {Math.min(indexOfLastItem, filteredTableDocs.length)} dari {filteredTableDocs.length} data</div>
            <div className="flex items-center space-x-2">
              <button onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))} disabled={currentPage === 1} className="p-2 border border-slate-200 rounded-lg hover:bg-slate-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"><ChevronLeft className="w-4 h-4" /></button>
              <div className="px-3 font-bold text-slate-700">Halaman {currentPage}</div>
              <button onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))} disabled={currentPage === totalPages || totalPages === 0} className="p-2 border border-slate-200 rounded-lg hover:bg-slate-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"><ChevronRight className="w-4 h-4" /></button>
            </div>
          </div>
        </section>
      </FadeInSection>
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
    </div>
  );

  const SectionKontak = () => (
    <div className="max-w-4xl mx-auto bg-white p-10 rounded-3xl shadow-sm border border-slate-200">
      <div className="flex items-center space-x-4 mb-8"><div className="p-3 bg-[#EAF2EE] text-[#0D5C35] rounded-xl"><Phone className="w-8 h-8" /></div><h2 className="text-3xl font-bold text-slate-900">Hubungi Kami</h2></div>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-8"><div className="bg-slate-50 p-6 rounded-2xl border border-slate-100"><h4 className="font-bold text-slate-800 flex items-center mb-2"><Mail className="w-4 h-4 mr-2 text-[#0D5C35]" /> Email Resmi</h4><p className="text-slate-600">kpknl.kendari@kemenkeu.go.id</p></div><div className="bg-slate-50 p-6 rounded-2xl border border-slate-100"><h4 className="font-bold text-slate-800 flex items-center mb-2"><Info className="w-4 h-4 mr-2 text-[#0D5C35]" /> Alamat Kantor</h4><p className="text-slate-600">Jl. Made Sabara No.6, Korumba, Kec. Mandonga, Kota Kendari, Sulawesi Tenggara 93111</p></div></div>
    </div>
  );

  return (
    <div className="min-h-screen flex flex-col font-sans relative bg-[#F8FAF9]" id="top">
      <header className={`fixed top-0 left-0 right-0 z-50 transition-all duration-500 ease-in-out ${isScrolled ? 'bg-[#0A492A]/90 backdrop-blur-md shadow-lg py-3' : 'bg-transparent py-6'}`}>
        <nav className="max-w-7xl mx-auto px-6">
          <div className="flex justify-between items-center">
            
            {/* PERBAIKAN 2: Logo KPKNL Muncul di Mobile (Dihapus class hidden) */}
            <div className="flex items-center cursor-pointer" onClick={() => scrollToSection('top')}>
              {/* 1. Logo Kemenkeu (Kiri) */}
              <div className="bg-white p-1.5 rounded-lg shadow-md hover:scale-105 transition-transform flex-shrink-0">
                <img src="/logo_kemenkeu.png" alt="Logo Kemenkeu" className="w-8 h-8 object-contain" onError={(e) => { e.currentTarget.style.display = 'none' }} />
              </div>

              {/* Garis Pemisah (Divider - Tetap Hidden di Mobile agar rapi) */}
              <div className="h-8 w-px bg-white/20 mx-3 hidden sm:block"></div>

              {/* 2. Logo KPKNL (Kanan - SEKARANG MUNCUL DI MOBILE) */}
              <div className="bg-white p-1.5 rounded-lg shadow-md hover:scale-105 transition-transform flex-shrink-0 ml-2 sm:ml-0">
                <img src="/logo.png" alt="Logo KPKNL" className="w-8 h-8 object-contain" />
              </div>

              {/* 3. Teks Identitas */}
              <div className="flex flex-col text-white ml-3">
                <span className="font-bold text-base sm:text-lg leading-none tracking-tight">KPKNL KENDARI</span>
                <span className="text-[9px] sm:text-[10px] uppercase opacity-80 tracking-widest text-[#D4AF37]">
                  Kementerian Keuangan RI
                </span>
              </div>
            </div>

            {/* Menu Desktop */}
            <div className="hidden md:flex items-center space-x-6">
              <div className="flex space-x-6 text-sm font-semibold uppercase tracking-wider">{['Beranda', 'FAQ', 'Panduan', 'Kontak'].map(item => (<button key={item} onClick={() => scrollToSection(item.toLowerCase())} aria-label={`Ke Bagian ${item}`} className="text-white hover:text-[#D4AF37] transition-colors">{item}</button>))}</div>
              <button onClick={() => navigate('/login')} aria-label="Login Admin" className="flex items-center px-4 py-2 bg-white/10 hover:bg-white/20 backdrop-blur-sm rounded-full text-xs font-bold text-white border border-white/20 transition-all"><LogIn className="w-3 h-3 mr-1.5" /> Admin</button>
            </div>
            {/* Menu Mobile Toggle */}
            <div className="md:hidden flex items-center gap-3"><button onClick={() => setIsMenuOpen(!isMenuOpen)} aria-label="Buka Menu" className="text-white p-2 hover:bg-white/10 rounded-lg">{isMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}</button></div>
          </div>
          {/* Mobile Menu Dropdown */}
          {isMenuOpen && (<div className="md:hidden absolute top-full left-0 right-0 mt-4 mx-4 bg-[#0A492A] rounded-2xl shadow-2xl border border-white/10 p-4 flex flex-col space-y-2 animate-in slide-in-from-top-5 duration-200">{['Beranda', 'FAQ', 'Panduan', 'Kontak'].map(item => (<button key={item} onClick={() => scrollToSection(item.toLowerCase())} className="text-left px-4 py-3 rounded-xl hover:bg-white/10 text-white font-semibold flex items-center"><FileText className="w-4 h-4 mr-3 opacity-70" /> {item}</button>))}<div className="mt-4 pt-4 border-t border-white/10"><button onClick={() => navigate('/login')} className="w-full text-left px-4 py-3 rounded-xl bg-white/10 text-[#D4AF37] font-bold flex items-center hover:bg-white/20 transition-all"><LogIn className="w-4 h-4 mr-3" /> Login Admin</button></div></div>)}
        </nav>
      </header>

      <div className="relative bg-gradient-to-br from-[#0D5C35] via-[#0A492A] to-[#083D23] pt-40 pb-32 px-4">
        <div className={`max-w-4xl mx-auto text-center transition-all duration-1000 transform ${isLoaded ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-10'}`}>
          <h1 className="text-white text-4xl md:text-5xl font-extrabold mb-6 tracking-tight">KNOWLEDGE BASE <br className="sm:hidden" /> <span className="text-[#D4AF37]">KPKNL KENDARI</span></h1>
          <p className="text-slate-200 mb-10 text-lg max-w-2xl mx-auto opacity-90">Sistem informasi terintegrasi pengelolaan kekayaan negara.</p>
          <div className="relative max-w-2xl mx-auto">
            <div className="relative group">
              <input type="text" className="w-full py-4 px-6 pl-14 pr-16 rounded-full bg-white text-slate-900 shadow-2xl outline-none focus:ring-4 focus:ring-[#D4AF37]/30 transition-all text-lg placeholder:text-slate-400" placeholder="Cari SOP atau Layanan..." aria-label="Kotak Pencarian" value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} onKeyDown={(e) => e.key === 'Enter' && handleSearchAction()} />
              <button onClick={handleSearchAction} aria-label="Tombol Cari" className="absolute left-5 top-1/2 transform -translate-y-1/2 text-slate-400 hover:text-[#0D5C35] transition-colors"><Search className="w-6 h-6" /></button>
              {searchQuery && (<button onClick={() => setSearchQuery('')} className="absolute right-4 top-1/2 transform -translate-y-1/2 text-slate-400 hover:text-rose-500 bg-slate-100 hover:bg-rose-50 p-1.5 rounded-full transition-all" aria-label="Hapus Pencarian"><X className="w-4 h-4" /></button>)}
            </div>
            <div className="mt-4 flex flex-wrap justify-center gap-2 animate-in fade-in slide-in-from-bottom-2 duration-700 delay-200">
              <span className="text-white/70 text-xs sm:text-sm font-medium mr-1 py-1">Pencarian Populer:</span>
              {['Sewa BMN', 'Lelang', 'Penghapusan', 'Status Penggunaan'].map(tag => (
                <button key={tag} onClick={() => setSearchQuery(tag)} className="bg-white/10 hover:bg-white/20 text-white text-xs px-3 py-1 rounded-full transition-colors border border-white/10">{tag}</button>
              ))}
            </div>
          </div>
        </div>
      </div>

      <main className="flex-grow max-w-7xl mx-auto px-4 -mt-16 relative z-10 w-full mb-20 space-y-32">
        <div id="beranda"><SectionHome /></div>
        <FadeInSection><div id="faq" className="pt-10 scroll-mt-20"><SectionFAQ /></div></FadeInSection>
        <FadeInSection delay="delay-100"><div id="panduan" className="pt-10 scroll-mt-20"><SectionPanduan /></div></FadeInSection>
        <FadeInSection delay="delay-200"><div id="kontak" className="pt-10 scroll-mt-20"><SectionKontak /></div></FadeInSection>
      </main>

      <footer className="bg-[#0A492A] text-[#EAF2EE]/70 py-12 px-4 border-t border-white/5">
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row justify-between items-center space-y-8 md:space-y-0">
          <div className="text-center md:text-left">
            <p className="text-white font-bold text-lg mb-1 flex items-center justify-center md:justify-start"><span className="text-[#D4AF37] mr-2">◆</span> KPKNL Kendari</p>
            <p className="text-sm">Direktorat Jenderal Kekayaan Negara (DJKN)</p>
            <p className="text-xs mt-1 text-[#D4AF37] opacity-80 uppercase tracking-widest">Kementerian Keuangan RI</p>
          </div>
          <div className="flex space-x-4">
            <a href="https://www.instagram.com/kpknlkendari" className="p-2 bg-white/5 hover:bg-white/10 rounded-full transition-colors text-white" aria-label="Instagram"><Instagram className="w-5 h-5" /></a>
            <a href="https://www.youtube.com/@kpknlkendarimelulo9245" className="p-2 bg-white/5 hover:bg-white/10 rounded-full transition-colors text-white" aria-label="Youtube"><Youtube className="w-5 h-5" /></a>
            <a href="https://www.djkn.kemenkeu.go.id/kpknl-kendari" target="_blank" rel="noopener noreferrer" className="p-2 bg-white/5 hover:bg-white/10 rounded-full transition-colors text-white" aria-label="Website Resmi"><Globe className="w-5 h-5" /></a>
            <a href="https://lelang.go.id/" target="_blank" rel="noopener noreferrer" className="p-2 bg-white/5 hover:bg-white/10 rounded-full transition-colors text-white" aria-label="Lelang"><Scale className="w-5 h-5" /></a>
          </div>
          <div className="text-center md:text-right"><p className="text-sm font-medium">Copyright © 2026 KPKNL Kendari</p><p className="text-xs mt-1 text-slate-400 italic">"Melayani dengan Hati, Mengelola dengan Integritas"</p></div>
        </div>
      </footer>

      <button onClick={handleScrollTop} aria-label="Kembali ke atas" className={`fixed bottom-8 right-8 p-4 bg-[#D4AF37] text-white rounded-full shadow-2xl hover:bg-[#B5952F] hover:scale-110 active:scale-95 transition-all duration-500 z-50 group ${isScrolled ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-10 pointer-events-none'}`}>
        <ArrowUp className="w-6 h-6 group-hover:-translate-y-1 transition-transform" />
      </button>
    </div>
  );
};

export default App;