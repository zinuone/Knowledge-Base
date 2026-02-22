// File: src/App.tsx
import React, { useState, useEffect, useMemo, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { collection, query, orderBy, onSnapshot } from 'firebase/firestore';
import { db } from './src/firebase';
import {
  Search, FileText, Hammer, Key, Trash2, Clock, RefreshCw,
  Info, Phone, BookOpen, Mail, ArrowUp, Timer, HelpCircle, LogIn,
  Menu, X, ChevronLeft, ChevronRight, Eye, List, Grid,
  Instagram, Globe, Filter,
  Youtube,
  Scale,
  Gift,
  MapPin,
  ExternalLink,
  ChevronDown,
  Sparkles,
  Building2,
} from 'lucide-react';
import ReactMarkdown from 'react-markdown';
import KnowledgeCard from './src/components/KnowledgeCard';
import FAQItem from './src/components/FAQItem';
import { SkeletonCard, SkeletonRow } from './src/components/SkeletonLoader';

// --- KOMPONEN SCROLL REVEAL ---
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
    <div ref={domRef} className={`transition-all duration-1000 ease-out transform ${isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-24'} ${delay || ''}`}>
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

// Komponen FAQ Accordion (di luar App agar tidak unmount saat re-render)
const FAQAccordionItem: React.FC<{ faq: FAQData; index: number }> = ({ faq, index }) => {
  const [isOpen, setIsOpen] = useState(false);
  return (
    <div className={`border-b border-slate-100 last:border-0 transition-all duration-300 ${isOpen ? 'bg-amber-50/30' : 'bg-white hover:bg-slate-50/50'}`}>
      <button onClick={() => setIsOpen(!isOpen)} className="w-full text-left px-6 py-5 flex items-start justify-between gap-4 group">
        <div className="flex items-start gap-4">
          <span className="flex-shrink-0 mt-0.5 w-7 h-7 rounded-full bg-amber-100 text-amber-700 text-xs font-black flex items-center justify-center border border-amber-200">{index + 1}</span>
          <span className="font-bold text-slate-800 text-base leading-snug group-hover:text-[#0D5C35] transition-colors">{faq.question}</span>
        </div>
        <span className={`flex-shrink-0 mt-0.5 w-6 h-6 rounded-full flex items-center justify-center transition-all duration-300 ${isOpen ? 'bg-[#0D5C35] text-white rotate-180' : 'bg-slate-100 text-slate-500'}`}>
          <ChevronDown className="w-4 h-4" />
        </span>
      </button>
      <div className={`overflow-hidden transition-all duration-500 ease-in-out ${isOpen ? 'max-h-[800px] opacity-100' : 'max-h-0 opacity-0'}`}>
        <div className="px-6 pb-6 pl-[4.25rem]">
          <div className="prose prose-slate max-w-none text-sm prose-p:text-slate-600 prose-p:leading-relaxed prose-li:marker:text-[#0D5C35] prose-strong:text-slate-800 prose-headings:text-slate-700 prose-ul:my-2 prose-ol:my-2">
            <ReactMarkdown>{faq.answer}</ReactMarkdown>
          </div>
        </div>
      </div>
    </div>
  );
};

const App: React.FC = () => {
  const [searchQuery, setSearchQuery] = useState('');
  const [activeSearch, setActiveSearch] = useState('');
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

  const categories = [
    { id: 'psp', title: 'PSP', description: 'Penggunaan, Pemanfaatan, Pemindahtanganan BMN', icon: <FileText className="w-8 h-8" />, color: 'bg-emerald-50 text-[#0D5C35]' },
    { id: 'penjualan', title: 'PENJUALAN', description: 'Pengelolaan Lelang dan Penjualan BMN', icon: <Hammer className="w-8 h-8" />, color: 'bg-amber-50 text-amber-700' },
    { id: 'sewa', title: 'SEWA', description: 'Mekanisme dan Prosedur Sewa BMN', icon: <Key className="w-8 h-8" />, color: 'bg-blue-50 text-blue-700' },
    { id: 'penghapusan', title: 'PENGHAPUSAN', description: 'Proses Penghapusan Barang Milik Negara', icon: <Trash2 className="w-8 h-8" />, color: 'bg-rose-50 text-rose-700' },
    { id: 'pinjam-pakai', title: 'PINJAM PAKAI', description: 'Aturan Pinjam Pakai Antar Instansi', icon: <Clock className="w-8 h-8" />, color: 'bg-indigo-50 text-indigo-700' },
    { id: 'penggunaan-sementara', title: 'PENGGUNAAN SEMENTARA', description: 'Penggunaan BMN dalam jangka waktu tertentu', icon: <Timer className="w-8 h-8" />, color: 'bg-purple-50 text-purple-700' },
    { id: 'alih-status', title: 'ALIH STATUS', description: 'Alih Status Penggunaan Barang Milik Negara', icon: <RefreshCw className="w-8 h-8" />, color: 'bg-teal-50 text-teal-700' },
    { id: 'hibah', title: 'HIBAH', description: 'Prosedur Hibah Barang Milik Negara', icon: <Gift className="w-8 h-8" />, color: 'bg-orange-50 text-orange-700' }
  ];

  useEffect(() => {
    setTimeout(() => setIsLoaded(true), 100);
    setIsLoadingData(true);
    const qSop = query(collection(db, "knowledge-base"), orderBy("updatedAt", "desc"));
    const unsubSop = onSnapshot(qSop, (snap) => { setDocuments(snap.docs.map(d => ({ id: d.id, ...d.data() })) as ContentData[]); setIsLoadingData(false); });
    const qFaq = query(collection(db, "faqs"), orderBy("createdAt", "desc"));
    const unsubFaq = onSnapshot(qFaq, (snap) => setFaqs(snap.docs.map(d => ({ id: d.id, ...d.data() })) as FAQData[]));
    const qGuide = query(collection(db, "guides"), orderBy("updatedAt", "desc"));
    const unsubGuide = onSnapshot(qGuide, (snap) => setGuides(snap.docs.map(d => ({ id: d.id, ...d.data() })) as GuideData[]));
    const handleScroll = () => { setIsScrolled(window.scrollY > 50); if (window.scrollY > 50 && isMenuOpen) setIsMenuOpen(false); };
    window.addEventListener('scroll', handleScroll);
    return () => { unsubSop(); unsubFaq(); unsubGuide(); window.removeEventListener('scroll', handleScroll); };
  }, [isMenuOpen]);

  const searchResults = useMemo(() => {
    if (!activeSearch) return [];
    return documents.filter(doc => doc.title.toLowerCase().includes(activeSearch.toLowerCase()) || doc.description.toLowerCase().includes(activeSearch.toLowerCase()));
  }, [activeSearch, documents]);

  const filteredTableDocs = useMemo(() => {
    return documents.filter(doc => {
      const matchesSearch = doc.title.toLowerCase().includes(activeSearch.toLowerCase()) || doc.category.toLowerCase().includes(activeSearch.toLowerCase());
      const matchesCategory = selectedCategoryFilter === 'all' || doc.category === selectedCategoryFilter;
      return matchesSearch && matchesCategory;
    });
  }, [activeSearch, selectedCategoryFilter, documents]);

  const indexOfLastItem = currentPage * itemsPerPage;
  const indexOfFirstItem = indexOfLastItem - itemsPerPage;
  const currentTableDocs = filteredTableDocs.slice(indexOfFirstItem, indexOfLastItem);
  const totalPages = Math.ceil(filteredTableDocs.length / itemsPerPage);

  const handleCategoryClick = (id: string) => navigate(`/category/${id}`);
  const handleDocClick = (id: string) => navigate(`/detail/${id}`);
  const scrollToSection = (id: string) => { const el = document.getElementById(id); if (el) el.scrollIntoView({ behavior: 'smooth' }); setIsMenuOpen(false); };
  const handleScrollTop = () => window.scrollTo({ top: 0, behavior: 'smooth' });

  // Helper scroll ke tabel
  const scrollToTable = () => {
    setTimeout(() => {
      const el = document.getElementById('document-table-section');
      if (el) el.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }, 300);
  };

  // Klik tombol Cari / Enter
  const handleSearchAction = () => {
    setActiveSearch(searchQuery);
    setCurrentPage(1);
    scrollToTable();
  };

  // ✅ FIX 3: Tag populer langsung search + scroll otomatis
  const handlePopularTag = (tag: string) => {
    setSearchQuery(tag);
    setActiveSearch(tag);
    setCurrentPage(1);
    scrollToTable();
  };

  const handleClearSearch = () => { setSearchQuery(''); setActiveSearch(''); setCurrentPage(1); };

  const formatDate = (timestamp: any) => {
    if (!timestamp) return '-';
    return new Date(timestamp.seconds * 1000).toLocaleString('id-ID', { day: 'numeric', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' });
  };

  const isNewDocument = (timestamp: any) => {
    if (!timestamp) return false;
    return Math.ceil(Math.abs(new Date().getTime() - new Date(timestamp.seconds * 1000).getTime()) / (1000 * 60 * 60 * 24)) <= 30;
  };

  // ---- SECTIONS ----
  const SectionHome = () => (
    <div className="space-y-4">
      <section className={`transition-all duration-1000 delay-300 ease-out transform ${isLoaded ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-10'}`}>
        <div className="flex items-center space-x-3 mb-8 px-2 pl-4 border-l-4 border-[#D4AF37]">
          <Grid className="w-6 h-6 text-[#D4AF37]" />
          <h3 className="font-black text-white text-xl uppercase tracking-widest drop-shadow-sm">Kategori Layanan</h3>
        </div>
        {activeSearch && searchResults.length > 0 && (
          <div className="mb-8 p-4 bg-emerald-50 border border-emerald-100 rounded-2xl animate-in fade-in zoom-in duration-300">
            <p className="text-emerald-800 text-sm font-bold mb-4">Hasil Pencarian Cepat untuk "<span className="text-[#0D5C35]">{activeSearch}</span>":</p>
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
              <div key={cat.id} onClick={() => handleCategoryClick(cat.id)} className="cursor-pointer transition-transform hover:scale-105 active:scale-95 h-full" style={{ animationDelay: `${index * 100}ms` }}>
                <KnowledgeCard title={cat.title} description={cat.description} icon={cat.icon} colorClass={cat.color} />
              </div>
            ))}
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
              <span className="ml-2 text-xs font-bold text-slate-400 bg-slate-100 px-2 py-0.5 rounded-full">{filteredTableDocs.length}</span>
            </div>
            <div className="flex flex-col sm:flex-row items-center space-y-2 sm:space-y-0 sm:space-x-4 text-sm w-full md:w-auto">
              <div className="flex items-center text-slate-600 bg-white border border-slate-300 rounded-lg px-2 py-1 w-full sm:w-auto">
                <Filter className="w-4 h-4 mr-2 text-slate-400 flex-shrink-0" />
                <select value={selectedCategoryFilter} onChange={(e) => { setSelectedCategoryFilter(e.target.value); setCurrentPage(1); }} className="bg-transparent outline-none cursor-pointer text-slate-700 font-medium w-full">
                  <option value="all">Semua Kategori</option>
                  {categories.map(cat => <option key={cat.id} value={cat.id}>{cat.title}</option>)}
                </select>
              </div>
              <div className="flex items-center text-slate-600">
                <span className="mr-2 whitespace-nowrap">Tampil</span>
                <select value={itemsPerPage} onChange={(e) => { setItemsPerPage(Number(e.target.value)); setCurrentPage(1); }} className="border border-slate-300 rounded-lg px-2 py-1 bg-white focus:ring-2 focus:ring-[#0D5C35] outline-none cursor-pointer">
                  <option value={5}>5</option><option value={10}>10</option><option value={20}>20</option>
                </select>
                <span className="ml-2">data</span>
              </div>
            </div>
          </div>
          <div className="w-full">
            <table className="w-full text-left text-sm table-fixed">
              <thead className="bg-slate-50 text-slate-600 font-bold uppercase tracking-wider border-b border-slate-200">
                <tr>
                  <th className="px-4 py-4 w-10 text-center hidden sm:table-cell">#</th>
                  <th className="px-4 py-4">Judul Dokumen / Informasi</th>
                  <th className="px-4 py-4 w-28 text-center">Aksi</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {isLoadingData ? Array.from({ length: 5 }).map((_, idx) => <SkeletonRow key={idx} />) :
                  currentTableDocs.length > 0 ? currentTableDocs.map((doc, index) => (
                    <tr key={doc.id} className="hover:bg-slate-50 transition-all duration-200 cursor-default group bg-white">
                      <td className="px-4 py-4 text-center text-slate-400 font-medium hidden sm:table-cell">{indexOfFirstItem + index + 1}</td>
                      <td className="px-4 py-4 min-w-0">
                        <div className="flex flex-wrap items-center gap-1.5 mb-1.5">
                          <span className="inline-block px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider bg-slate-100 text-slate-500 border border-slate-200 group-hover:bg-[#0D5C35] group-hover:text-white transition-colors whitespace-nowrap">{doc.category.replace(/-/g, ' ')}</span>
                          {isNewDocument(doc.updatedAt) && <span className="inline-block px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider bg-amber-100 text-amber-600 border border-amber-200 animate-pulse">Baru</span>}
                        </div>
                        <h4 className="text-slate-900 font-bold text-sm md:text-base mb-1 group-hover:text-[#0D5C35] transition-colors line-clamp-2">{doc.title}</h4>
                        <p className="text-slate-400 text-xs">Update: {formatDate(doc.updatedAt)}</p>
                      </td>
                      <td className="px-4 py-4 text-center">
                        <button onClick={() => handleDocClick(doc.id)} className="inline-flex items-center px-3 py-2 bg-[#00A3C8] text-white rounded-lg font-bold shadow-md shadow-cyan-100 hover:bg-[#008CAE] hover:shadow-lg hover:-translate-y-0.5 transition-all text-xs whitespace-nowrap">
                          <Eye className="w-3 h-3 mr-1" /> Lihat
                        </button>
                      </td>
                    </tr>
                  )) : <tr><td colSpan={3} className="px-6 py-10 text-center text-slate-400 italic bg-slate-50/30">Tidak ada dokumen yang ditemukan.</td></tr>}
              </tbody>
            </table>
          </div>
          <div className="p-4 border-t border-slate-100 flex flex-col md:flex-row justify-between items-center gap-4 text-sm text-slate-500">
            <div>Menampilkan {currentTableDocs.length > 0 ? indexOfFirstItem + 1 : 0}–{Math.min(indexOfLastItem, filteredTableDocs.length)} dari {filteredTableDocs.length} data</div>
            <div className="flex items-center space-x-2">
              <button onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))} disabled={currentPage === 1} className="p-2 border border-slate-200 rounded-lg hover:bg-slate-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"><ChevronLeft className="w-4 h-4" /></button>
              <div className="px-3 font-bold text-slate-700">Halaman {currentPage} / {totalPages || 1}</div>
              <button onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))} disabled={currentPage === totalPages || totalPages === 0} className="p-2 border border-slate-200 rounded-lg hover:bg-slate-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"><ChevronRight className="w-4 h-4" /></button>
            </div>
          </div>
        </section>
      </FadeInSection>
    </div>
  );

  const SectionFAQ = () => (
    <div className="max-w-3xl mx-auto">
      <div className="text-center mb-10">
        <div className="inline-flex items-center justify-center p-3 bg-amber-50 text-amber-500 rounded-2xl mb-4 shadow-sm border border-amber-100"><HelpCircle className="w-7 h-7" /></div>
        <h2 className="text-3xl font-black text-slate-900 mb-2 tracking-tight">Pertanyaan Populer</h2>
        <p className="text-slate-500 text-base">Temukan jawaban cepat atas pertanyaan yang sering diajukan</p>
        <div className="mt-3 flex items-center justify-center gap-2">
          <span className="h-1 w-8 rounded-full bg-amber-200"></span>
          <span className="h-1 w-16 rounded-full bg-amber-400"></span>
          <span className="h-1 w-8 rounded-full bg-amber-200"></span>
        </div>
      </div>
      <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden divide-y divide-slate-100">
        {faqs.length > 0 ? faqs.map((faq, idx) => <FAQAccordionItem key={faq.id} faq={faq} index={idx} />) :
          <div className="p-12 text-center"><HelpCircle className="w-12 h-12 text-slate-200 mx-auto mb-3" /><p className="text-slate-400 font-medium italic">Belum ada FAQ tersedia.</p></div>}
      </div>
      {faqs.length > 0 && <p className="text-center text-slate-400 text-sm mt-5 font-medium">Klik pertanyaan untuk melihat jawaban lengkapnya</p>}
    </div>
  );

  const SectionPanduan = () => (
    <div className="max-w-4xl mx-auto bg-white p-10 rounded-3xl shadow-sm border border-slate-200">
      <div className="flex items-center space-x-4 mb-8"><div className="p-3 bg-[#EAF2EE] text-[#0D5C35] rounded-xl"><BookOpen className="w-8 h-8" /></div><h2 className="text-3xl font-bold text-slate-900">Panduan Pengguna</h2></div>
      <div className="prose prose-slate max-w-none prose-p:text-slate-600 prose-li:marker:text-[#0D5C35] prose-strong:text-slate-800">
        {guides.length > 0 ? guides.map((guide) => <div key={guide.id} className="mb-8 border-b border-slate-50 last:border-0 pb-4 last:pb-0"><ReactMarkdown>{guide.content}</ReactMarkdown></div>) :
          <div className="text-center py-10 border-2 border-dashed border-slate-100 rounded-xl bg-slate-50"><p className="text-slate-400 italic">Belum ada data panduan.</p></div>}
      </div>
    </div>
  );

  const SectionKontak = () => (
    <div className="max-w-4xl mx-auto bg-white p-10 rounded-3xl shadow-sm border border-slate-200">
      <div className="flex items-center space-x-4 mb-8"><div className="p-3 bg-[#EAF2EE] text-[#0D5C35] rounded-xl"><Phone className="w-8 h-8" /></div><h2 className="text-3xl font-bold text-slate-900">Hubungi Kami</h2></div>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        <div className="bg-slate-50 p-6 rounded-2xl border border-slate-100"><h4 className="font-bold text-slate-800 flex items-center mb-2"><Mail className="w-4 h-4 mr-2 text-[#0D5C35]" /> Email Resmi</h4><p className="text-slate-600">kpknl.kendari@kemenkeu.go.id</p></div>
        <div className="bg-slate-50 p-6 rounded-2xl border border-slate-100"><h4 className="font-bold text-slate-800 flex items-center mb-2"><Info className="w-4 h-4 mr-2 text-[#0D5C35]" /> Alamat Kantor</h4><p className="text-slate-600">Jl. Made Sabara No.6, Korumba, Kec. Mandonga, Kota Kendari, Sulawesi Tenggara 93111</p></div>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen flex flex-col font-sans relative bg-[#F8FAF9]" id="top">

      {/* NAVBAR */}
      <header className={`fixed top-0 left-0 right-0 z-50 transition-all duration-500 ease-in-out ${isScrolled ? 'bg-[#0A492A]/90 backdrop-blur-md shadow-lg py-3' : 'bg-transparent py-6'}`}>
        <nav className="max-w-7xl mx-auto px-6">
          <div className="flex justify-between items-center">
            <div className="flex items-center cursor-pointer" onClick={() => scrollToSection('top')}>
              <div className="bg-white p-1.5 rounded-lg shadow-md hover:scale-105 transition-transform flex-shrink-0">
                <img src="/logo_kemenkeu.png" alt="Logo Kemenkeu" className="w-8 h-8 object-contain" onError={(e) => { e.currentTarget.style.display = 'none' }} />
              </div>
              <div className="h-8 w-px bg-white/20 mx-3 hidden sm:block"></div>
              <div className="bg-white px-3 py-0 rounded-lg shadow-md hover:scale-105 transition-transform flex-shrink-0 ml-2 sm:ml-0 flex items-center justify-center h-[44px] md:h-[50px] overflow-hidden">
                <img src="/logo.png" alt="Logo KPKNL" className="h-full w-auto object-contain scale-[1.35] md:scale-[1.45]" />
              </div>
              <div className="flex flex-col text-white ml-4 justify-center">
                <span className="font-black text-lg md:text-xl leading-none tracking-tight">KPKNL KENDARI</span>
                <span className="text-[10px] md:text-xs uppercase opacity-90 tracking-widest text-[#D4AF37] mt-0.5">Kementerian Keuangan RI</span>
              </div>
            </div>
            <div className="hidden md:flex items-center space-x-6">
              <div className="flex space-x-6 text-sm font-semibold uppercase tracking-wider">
                {['Beranda', 'FAQ', 'Panduan', 'Kontak'].map(item => (
                  <button key={item} onClick={() => scrollToSection(item.toLowerCase())} aria-label={`Ke Bagian ${item}`} className="text-white hover:text-[#D4AF37] transition-colors">{item}</button>
                ))}
              </div>
              <button onClick={() => navigate('/login')} aria-label="Login Admin" className="flex items-center px-4 py-2 bg-white/10 hover:bg-white/20 backdrop-blur-sm rounded-full text-xs font-bold text-white border border-white/20 transition-all"><LogIn className="w-3 h-3 mr-1.5" /> Admin</button>
            </div>
            <div className="md:hidden flex items-center gap-3">
              <button onClick={() => setIsMenuOpen(!isMenuOpen)} aria-label="Buka Menu" className="text-white p-2 hover:bg-white/10 rounded-lg">{isMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}</button>
            </div>
          </div>
          {isMenuOpen && (
            <div className="md:hidden absolute top-full left-0 right-0 mt-4 mx-4 bg-[#0A492A] rounded-2xl shadow-2xl border border-white/10 p-4 flex flex-col space-y-2 animate-in slide-in-from-top-5 duration-200">
              {['Beranda', 'FAQ', 'Panduan', 'Kontak'].map(item => (
                <button key={item} onClick={() => scrollToSection(item.toLowerCase())} className="text-left px-4 py-3 rounded-xl hover:bg-white/10 text-white font-semibold flex items-center"><FileText className="w-4 h-4 mr-3 opacity-70" /> {item}</button>
              ))}
              <div className="mt-4 pt-4 border-t border-white/10">
                <button onClick={() => navigate('/login')} className="w-full text-left px-4 py-3 rounded-xl bg-white/10 text-[#D4AF37] font-bold flex items-center hover:bg-white/20 transition-all"><LogIn className="w-4 h-4 mr-3" /> Login Admin</button>
              </div>
            </div>
          )}
        </nav>
      </header>

      {/* HERO */}
      <div className="relative bg-gradient-to-br from-[#0D5C35] via-[#0A492A] to-[#083D23] pt-40 pb-32 px-4">
        <div className={`max-w-4xl mx-auto text-center transition-all duration-1000 transform ${isLoaded ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-10'}`}>
          <h1 className="text-white text-4xl md:text-5xl font-extrabold mb-5 tracking-tight leading-tight">
            KNOWLEDGE BASE <br className="hidden sm:block" />
            <span className="text-2xl md:text-3xl font-medium text-emerald-100 mt-4 flex flex-col sm:flex-row items-center justify-center gap-2 sm:gap-3">
              <span className="tracking-wide">DIVISI PKN</span>
              <span className="hidden sm:inline-block text-[#ffffff] opacity-60">|</span>
              <span className="font-bold text-[#D4AF37] tracking-widest">KPKNL KENDARI</span>
            </span>
          </h1>
          <p className="text-slate-200 mb-10 text-lg max-w-2xl mx-auto opacity-90">Sistem informasi terintegrasi pengelolaan kekayaan negara.</p>

          {/* ✅ FIX 1 & 2: Search bar menyatu dalam satu container, X di dalam */}
          <div className="max-w-2xl mx-auto">
            {/*
              Satu div rounded-full overflow-hidden = visual pill menyatu.
              Di dalamnya: ikon cari | input | tombol X (opsional) | garis | tombol Cari.
              Tidak ada gap, tidak ada shadow terpisah.
            */}
            <div className="flex items-stretch bg-white rounded-full shadow-2xl overflow-hidden ring-0 focus-within:ring-4 focus-within:ring-[#D4AF37]/40 transition-all">

              {/* Ikon kaca pembesar kiri */}
              <div className="flex items-center pl-5 pr-2 flex-shrink-0">
                <Search className="w-5 h-5 text-slate-400 pointer-events-none" />
              </div>

              {/* Input teks */}
              <input
                type="text"
                className="flex-1 py-4 pr-1 bg-transparent text-slate-900 outline-none text-base md:text-lg placeholder:text-slate-400 min-w-0"
                placeholder="Cari SOP atau Layanan..."
                aria-label="Kotak Pencarian"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleSearchAction()}
              />

              {/* ✅ FIX 2: Tombol X di DALAM bar, tampil hanya saat ada teks */}
              {searchQuery && (
                <button
                  onClick={handleClearSearch}
                  aria-label="Hapus Pencarian"
                  className="flex items-center flex-shrink-0 mx-2 p-1.5 text-slate-400 hover:text-rose-500 bg-slate-100 hover:bg-rose-50 rounded-full transition-all self-center"
                >
                  <X className="w-4 h-4" />
                </button>
              )}

              {/* Garis pemisah vertikal tipis */}
              <div className="flex-shrink-0 self-center w-px h-7 bg-slate-200 mx-1"></div>

              {/* ✅ FIX 1: Tombol Cari langsung menempel tanpa gap/border */}
              <button
                onClick={handleSearchAction}
                aria-label="Tombol Cari"
                className="flex-shrink-0 flex items-center gap-2 px-7 bg-[#D4AF37] hover:bg-[#B5952F] text-slate-900 font-black transition-all active:brightness-90 whitespace-nowrap text-sm md:text-base"
              >
                <Search className="w-4 h-4 md:w-5 md:h-5" />
                <span className="hidden sm:inline">Cari</span>
              </button>
            </div>

            {/* ✅ FIX 3: Tag populer — klik langsung scroll ke hasil */}
            <div className="mt-4 flex flex-wrap justify-center gap-2 animate-in fade-in slide-in-from-bottom-2 duration-700 delay-200">
              <span className="text-white/70 text-xs sm:text-sm font-medium mr-1 py-1">Pencarian Populer:</span>
              {['Sewa BMN', 'Lelang', 'Penghapusan', 'Hibah'].map(tag => (
                <button
                  key={tag}
                  onClick={() => handlePopularTag(tag)}
                  className="bg-white/10 hover:bg-white/20 text-white text-xs px-3 py-1 rounded-full transition-colors border border-white/10"
                >
                  {tag}
                </button>
              ))}
            </div>

            {/* Tombol Konsul Online */}
            <div className="mt-10 animate-in fade-in slide-in-from-bottom-4 duration-700 delay-300">
              <a href="#" target="_blank" rel="noopener noreferrer"
                className="inline-flex items-center px-8 py-4 bg-[#D4AF37] hover:bg-[#B5952F] text-slate-900 font-black rounded-full shadow-[0_0_20px_rgba(212,175,55,0.4)] hover:shadow-[0_0_25px_rgba(212,175,55,0.6)] hover:-translate-y-1 transition-all duration-300">
                <Phone className="w-5 h-5 mr-3 animate-pulse" />
                DAFTAR KONSUL ONLINE
              </a>
              <p className="text-emerald-100/70 text-sm mt-3 font-medium">Hubungi petugas kami secara virtual untuk panduan lebih lanjut.</p>
            </div>
          </div>
        </div>
      </div>

      {/* MAIN */}
      <main className="flex-grow max-w-7xl mx-auto px-4 -mt-16 relative z-10 w-full mb-20 space-y-32">
        <div id="beranda"><SectionHome /></div>
        <FadeInSection><div id="faq" className="pt-10 scroll-mt-20"><SectionFAQ /></div></FadeInSection>
        <FadeInSection delay="delay-100"><div id="panduan" className="pt-10 scroll-mt-20"><SectionPanduan /></div></FadeInSection>
        <FadeInSection delay="delay-200"><div id="kontak" className="pt-10 scroll-mt-20"><SectionKontak /></div></FadeInSection>
      </main>

      {/* FOOTER PREMIUM */}
      <footer className="relative bg-gradient-to-b from-[#0A492A] to-[#062B18] text-white overflow-hidden">
        <div className="absolute inset-0 pointer-events-none overflow-hidden">
          <div className="absolute -top-24 -left-24 w-72 h-72 rounded-full bg-white/5 blur-3xl"></div>
          <div className="absolute -bottom-16 -right-16 w-96 h-96 rounded-full bg-[#D4AF37]/10 blur-3xl"></div>
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[200px] rounded-full bg-white/[0.02] blur-2xl"></div>
        </div>
        <div className="h-1 w-full bg-gradient-to-r from-transparent via-[#D4AF37] to-transparent opacity-60"></div>
        <div className="relative max-w-7xl mx-auto px-6 pt-16 pb-8">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-12 mb-14">
            <div className="lg:col-span-1">
              <div className="flex items-center gap-3 mb-5">
                <div className="bg-white/10 backdrop-blur-sm p-2.5 rounded-xl border border-white/10 shadow-lg">
                  <img src="/logo.png" alt="Logo KPKNL" className="w-10 h-10 object-contain" onError={(e) => { e.currentTarget.style.display = 'none' }} />
                </div>
                <div><p className="font-black text-white text-lg leading-none">KPKNL</p><p className="text-[#D4AF37] text-xs font-bold tracking-widest uppercase">Kendari</p></div>
              </div>
              <p className="text-emerald-100/70 text-sm leading-relaxed mb-5">Kantor Pelayanan Kekayaan Negara dan Lelang Kendari — bagian dari Direktorat Jenderal Kekayaan Negara, Kementerian Keuangan RI.</p>
              <div className="inline-flex items-center gap-2 px-3 py-1.5 bg-white/10 rounded-full border border-white/10 text-xs text-emerald-100/80 font-medium">
                <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>Layanan Aktif
              </div>
            </div>
            <div>
              <h4 className="font-black text-white uppercase tracking-widest text-xs mb-5 flex items-center gap-2">
                <span className="h-px flex-1 bg-white/10"></span><span>Navigasi</span><span className="h-px flex-1 bg-white/10"></span>
              </h4>
              <ul className="space-y-3">
                {[{ label: 'Beranda', id: 'beranda' }, { label: 'Kategori Layanan', id: 'beranda' }, { label: 'FAQ', id: 'faq' }, { label: 'Panduan Pengguna', id: 'panduan' }, { label: 'Hubungi Kami', id: 'kontak' }].map(item => (
                  <li key={item.label}>
                    <button onClick={() => scrollToSection(item.id)} className="text-emerald-100/70 hover:text-[#D4AF37] text-sm transition-colors flex items-center gap-2 group">
                      <ChevronRight className="w-3.5 h-3.5 opacity-0 group-hover:opacity-100 -ml-1 transition-all group-hover:translate-x-1" />{item.label}
                    </button>
                  </li>
                ))}
              </ul>
            </div>
            <div>
              <h4 className="font-black text-white uppercase tracking-widest text-xs mb-5 flex items-center gap-2">
                <span className="h-px flex-1 bg-white/10"></span><span>Tautan Resmi</span><span className="h-px flex-1 bg-white/10"></span>
              </h4>
              <ul className="space-y-3">
                {[{ label: 'Website DJKN', href: 'https://www.djkn.kemenkeu.go.id/kpknl-kendari' }, { label: 'Portal Lelang', href: 'https://lelang.go.id/' }, { label: 'SIMAK BMN', href: '#' }, { label: 'Kemenkeu RI', href: 'https://www.kemenkeu.go.id' }].map(link => (
                  <li key={link.label}>
                    <a href={link.href} target="_blank" rel="noopener noreferrer" className="text-emerald-100/70 hover:text-[#D4AF37] text-sm transition-colors flex items-center gap-2 group">
                      <ExternalLink className="w-3.5 h-3.5 flex-shrink-0 opacity-60 group-hover:opacity-100" />{link.label}
                    </a>
                  </li>
                ))}
              </ul>
            </div>
            <div>
              <h4 className="font-black text-white uppercase tracking-widest text-xs mb-5 flex items-center gap-2">
                <span className="h-px flex-1 bg-white/10"></span><span>Kontak</span><span className="h-px flex-1 bg-white/10"></span>
              </h4>
              <ul className="space-y-3 mb-6">
                <li className="flex items-start gap-3 text-emerald-100/70 text-sm"><MapPin className="w-4 h-4 mt-0.5 flex-shrink-0 text-[#D4AF37]" /><span>Jl. Made Sabara No.6, Korumba, Kendari, Sulawesi Tenggara 93111</span></li>
                <li className="flex items-center gap-3 text-emerald-100/70 text-sm"><Mail className="w-4 h-4 flex-shrink-0 text-[#D4AF37]" /><a href="mailto:kpknl.kendari@kemenkeu.go.id" className="hover:text-[#D4AF37] transition-colors truncate">kpknl.kendari@kemenkeu.go.id</a></li>
              </ul>
              <div className="flex gap-2 flex-wrap">
                {[{ href: 'https://www.instagram.com/kpknlkendari', icon: <Instagram className="w-4 h-4" />, label: 'Instagram', color: 'hover:bg-pink-500' }, { href: 'https://www.youtube.com/@kpknlkendarimelulo9245', icon: <Youtube className="w-4 h-4" />, label: 'YouTube', color: 'hover:bg-red-500' }, { href: 'https://www.djkn.kemenkeu.go.id/kpknl-kendari', icon: <Globe className="w-4 h-4" />, label: 'Website', color: 'hover:bg-blue-500' }, { href: 'https://lelang.go.id/', icon: <Scale className="w-4 h-4" />, label: 'Lelang', color: 'hover:bg-amber-500' }].map(sm => (
                  <a key={sm.label} href={sm.href} target="_blank" rel="noopener noreferrer" aria-label={sm.label} title={sm.label} className={`p-2.5 bg-white/10 ${sm.color} rounded-xl transition-all duration-300 hover:scale-110 hover:shadow-lg border border-white/10`}>{sm.icon}</a>
                ))}
              </div>
            </div>
          </div>
          <div className="mb-10 p-5 rounded-2xl bg-gradient-to-r from-[#D4AF37]/10 via-white/5 to-[#D4AF37]/10 border border-[#D4AF37]/20 flex flex-col sm:flex-row items-center justify-center gap-3 text-center">
            <Sparkles className="w-5 h-5 text-[#D4AF37] flex-shrink-0 animate-pulse" />
            <p className="text-[#D4AF37] font-black tracking-widest uppercase text-sm">"Melayani dengan Hati, Mengelola dengan Integritas"</p>
            <Sparkles className="w-5 h-5 text-[#D4AF37] flex-shrink-0 animate-pulse" />
          </div>
          <div className="h-px w-full bg-gradient-to-r from-transparent via-white/10 to-transparent mb-8"></div>
          <div className="flex flex-col md:flex-row items-center justify-between gap-4 text-xs text-emerald-100/50">
            <div className="flex items-center gap-2">
              <Building2 className="w-3.5 h-3.5" />
              <span>Direktorat Jenderal Kekayaan Negara (DJKN)</span>
              <span className="hidden sm:inline">•</span>
              <span className="hidden sm:inline">Kementerian Keuangan Republik Indonesia</span>
            </div>
            <div className="flex items-center gap-2"><span>Copyright © 2026 KPKNL Kendari.</span><span>Hak Cipta Dilindungi.</span></div>
          </div>
        </div>
      </footer>

      <button onClick={handleScrollTop} aria-label="Kembali ke atas" className={`fixed bottom-8 right-8 p-4 bg-[#D4AF37] text-white rounded-full shadow-2xl hover:bg-[#B5952F] hover:scale-110 active:scale-95 transition-all duration-500 z-50 group ${isScrolled ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-10 pointer-events-none'}`}>
        <ArrowUp className="w-6 h-6 group-hover:-translate-y-1 transition-transform" />
      </button>
    </div>
  );
};

export default App;