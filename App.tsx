// File: src/App.tsx
// ─── CATATAN INSTALASI ────────────────────────────────────────────────────────
// 1. npm install react-helmet-async
// 2. Di main.tsx / index.tsx, bungkus <App /> dengan <HelmetProvider>:
//    import { HelmetProvider } from 'react-helmet-async';
//    <HelmetProvider><RouterProvider ... /></HelmetProvider>
// 3. Di tailwind.config.js, tambahkan: darkMode: 'class'
// ─────────────────────────────────────────────────────────────────────────────
import React, { useState, useEffect, useMemo, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { collection, query, orderBy, onSnapshot } from 'firebase/firestore';
import { db } from './src/firebase';
import { Helmet } from 'react-helmet-async';
import {
  Search, FileText, Hammer, Key, Trash2, Clock, RefreshCw,
  Info, Phone, BookOpen, Mail, ArrowUp, Timer, HelpCircle, LogIn,
  Menu, X, ChevronLeft, ChevronRight, Eye, List, Grid,
  Instagram, Globe, Filter,
  Youtube, Scale, Gift,
  MapPin, ExternalLink, ChevronDown,
  Sparkles, Building2, BarChart3, Layers, MessageSquare, TrendingUp,
  ArrowRight, Moon, Sun, SlidersHorizontal,
} from 'lucide-react';
import ReactMarkdown from 'react-markdown';
import KnowledgeCard from './src/components/KnowledgeCard';
import FAQItem from './src/components/FAQItem';
import { SkeletonCard, SkeletonRow } from './src/components/SkeletonLoader';


/* ─── CSS ANIMASI ─────────────────────────────────────────────── */
const HERO_ANIM_CSS = `
@keyframes blobFloat1 {
  0%,100% { transform: translate(0,0) scale(1); }
  25%      { transform: translate(40px,-30px) scale(1.08); }
  50%      { transform: translate(80px,20px) scale(0.95); }
  75%      { transform: translate(-20px,40px) scale(1.05); }
}
@keyframes blobFloat2 {
  0%,100% { transform: translate(0,0) scale(1); }
  33%     { transform: translate(-50px,30px) scale(1.1); }
  66%     { transform: translate(30px,-40px) scale(0.92); }
}
@keyframes blobFloat3 {
  0%,100% { transform: translate(0,0) scale(1); }
  50%     { transform: translate(25px,35px) scale(1.06); }
}
@keyframes particleFloat {
  0%,100% { transform: translateY(0) rotate(0deg); opacity: 0.4; }
  50%     { transform: translateY(-24px) rotate(180deg); opacity: 0.8; }
}
@keyframes gridPan {
  0%   { background-position: 0 0; }
  100% { background-position: 48px 48px; }
}
@keyframes pulseRing {
  0%,100% { transform: scale(1); opacity: 0.4; }
  50%     { transform: scale(1.15); opacity: 0.15; }
}
@keyframes statCountUp {
  from { transform: translateY(10px); opacity: 0; }
  to   { transform: translateY(0); opacity: 1; }
}
@keyframes suggestionSlide {
  from { transform: translateY(-6px); opacity: 0; }
  to   { transform: translateY(0); opacity: 1; }
}
@keyframes catFilterSlide {
  from { transform: translateX(-8px); opacity: 0; }
  to   { transform: translateX(0); opacity: 1; }
}
.blob-1 { animation: blobFloat1 18s ease-in-out infinite; }
.blob-2 { animation: blobFloat2 22s ease-in-out infinite; }
.blob-3 { animation: blobFloat3 15s ease-in-out infinite; }
.particle { animation: particleFloat 4s ease-in-out infinite; }
.hero-grid {
  background-image: radial-gradient(circle, rgba(255,255,255,0.12) 1px, transparent 1px);
  background-size: 48px 48px;
  animation: gridPan 12s linear infinite;
}
.pulse-ring { animation: pulseRing 3s ease-in-out infinite; }
.stat-animate { animation: statCountUp 0.6s ease-out forwards; }
.suggestion-item { animation: suggestionSlide 0.2s ease-out forwards; }
.cat-filter-item { animation: catFilterSlide 0.25s ease-out forwards; }
`;

/* ─── SCROLL REVEAL ───────────────────────────────────────────── */
const FadeInSection: React.FC<{ children: React.ReactNode; delay?: string }> = ({ children, delay }) => {
  const [isVisible, setIsVisible] = useState(false);
  const domRef = useRef<HTMLDivElement>(null);
  useEffect(() => {
    const observer = new IntersectionObserver(
      entries => entries.forEach(e => { if (e.isIntersecting) setIsVisible(true); }),
      { threshold: 0.08 }
    );
    const el = domRef.current;
    if (el) observer.observe(el);
    return () => { if (el) observer.unobserve(el); };
  }, []);
  return (
    <div ref={domRef} className={`transition-all duration-700 ease-out ${isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-12'} ${delay || ''}`}>
      {children}
    </div>
  );
};

/* ─── TIPE DATA ───────────────────────────────────────────────── */
interface ContentData { id: string; title: string; category: string; description: string; updatedAt?: any; }
interface FAQData { id: string; question: string; answer: string; }
interface GuideData { id: string; content: string; }

/* ─── FAQ ACCORDION ───────────────────────────────────────────── */
const FAQAccordionItem: React.FC<{ faq: FAQData; index: number; isDark: boolean }> = ({ faq, index, isDark }) => {
  const [isOpen, setIsOpen] = useState(false);
  return (
    <div className={`rounded-2xl border transition-all duration-300 overflow-hidden
      ${isOpen
        ? 'border-[#0D5C35]/30 shadow-md shadow-emerald-50 dark:shadow-emerald-900/20'
        : 'border-slate-200 dark:border-slate-700 hover:border-slate-300 dark:hover:border-slate-600'
      }`}>
      <button
        onClick={() => setIsOpen(!isOpen)}
        className={`w-full text-left px-5 py-4 flex items-start justify-between gap-3 transition-colors
          ${isOpen
            ? 'bg-[#0D5C35]/5 dark:bg-[#0D5C35]/15'
            : 'bg-white dark:bg-[#162918] hover:bg-slate-50 dark:hover:bg-[#1a3021]'
          }`}
      >
        <div className="flex items-start gap-3">
          <span className={`flex-shrink-0 mt-0.5 w-6 h-6 rounded-full text-xs font-black flex items-center justify-center transition-colors
            ${isOpen ? 'bg-[#0D5C35] text-white' : 'bg-amber-100 text-amber-700 border border-amber-200 dark:bg-amber-900/30 dark:text-amber-400 dark:border-amber-700/30'}`}>
            {index + 1}
          </span>
          <span className={`font-semibold text-sm leading-snug transition-colors
            ${isOpen ? 'text-[#0D5C35] dark:text-emerald-400' : 'text-slate-800 dark:text-slate-100'}`}>
            {faq.question}
          </span>
        </div>
        <ChevronDown className={`flex-shrink-0 w-4 h-4 mt-0.5 transition-all duration-300
          ${isOpen ? 'rotate-180 text-[#0D5C35] dark:text-emerald-400' : 'text-slate-400 dark:text-slate-500'}`} />
      </button>
      <div className={`overflow-hidden transition-all duration-300 ease-in-out ${isOpen ? 'max-h-[600px] opacity-100' : 'max-h-0 opacity-0'}`}>
        <div className="px-5 pb-5 pt-2 pl-14 border-t border-slate-100 dark:border-slate-700 bg-white dark:bg-[#162918]">
          <div className="prose prose-sm prose-slate dark:prose-invert max-w-none prose-p:text-slate-600 dark:prose-p:text-slate-300 prose-p:leading-relaxed prose-li:marker:text-[#0D5C35] prose-strong:text-slate-800 dark:prose-strong:text-slate-100">
            <ReactMarkdown>{faq.answer}</ReactMarkdown>
          </div>
        </div>
      </div>
    </div>
  );
};

/* ═══════════════════════════════════════════════════════════════
   APP COMPONENT
═══════════════════════════════════════════════════════════════ */
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
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [showCategoryFilter, setShowCategoryFilter] = useState(false);

  /* ── Dark Mode ── */
  const [isDark, setIsDark] = useState(() => {
    try { return localStorage.getItem('pkn-theme') === 'dark'; } catch { return false; }
  });
  useEffect(() => {
    document.documentElement.classList.toggle('dark', isDark);
    try { localStorage.setItem('pkn-theme', isDark ? 'dark' : 'light'); } catch { }
  }, [isDark]);

  const searchInputRef = useRef<HTMLInputElement>(null);
  const navigate = useNavigate();

  const categories = [
    { id: 'psp', title: 'PSP', description: 'Penggunaan, Pemanfaatan, Pemindahtanganan BMN', icon: <FileText className="w-8 h-8" />, color: 'bg-emerald-50 text-[#0D5C35]' },
    { id: 'penjualan', title: 'PENJUALAN', description: 'Pengelolaan Lelang dan Penjualan BMN', icon: <Hammer className="w-8 h-8" />, color: 'bg-amber-50  text-amber-700' },
    { id: 'sewa', title: 'SEWA', description: 'Mekanisme dan Prosedur Sewa BMN', icon: <Key className="w-8 h-8" />, color: 'bg-blue-50   text-blue-700' },
    { id: 'penghapusan', title: 'PENGHAPUSAN', description: 'Proses Penghapusan Barang Milik Negara', icon: <Trash2 className="w-8 h-8" />, color: 'bg-rose-50   text-rose-700' },
    { id: 'pinjam-pakai', title: 'PINJAM PAKAI', description: 'Aturan Pinjam Pakai Antar Instansi', icon: <Clock className="w-8 h-8" />, color: 'bg-indigo-50 text-indigo-700' },
    { id: 'penggunaan-sementara', title: 'PENGGUNAAN SEMENTARA', description: 'Penggunaan BMN dalam jangka waktu tertentu', icon: <Timer className="w-8 h-8" />, color: 'bg-purple-50 text-purple-700' },
    { id: 'alih-status', title: 'ALIH STATUS', description: 'Alih Status Penggunaan Barang Milik Negara', icon: <RefreshCw className="w-8 h-8" />, color: 'bg-teal-50   text-teal-700' },
    { id: 'hibah', title: 'HIBAH', description: 'Prosedur Hibah Barang Milik Negara', icon: <Gift className="w-8 h-8" />, color: 'bg-orange-50 text-orange-700' },
  ];

  /* ── Firebase ── */
  useEffect(() => {
    setTimeout(() => setIsLoaded(true), 100);
    setIsLoadingData(true);
    const qSop = query(collection(db, 'knowledge-base'), orderBy('updatedAt', 'desc'));
    const qFaq = query(collection(db, 'faqs'), orderBy('createdAt', 'desc'));
    const qGuide = query(collection(db, 'guides'), orderBy('updatedAt', 'desc'));
    const unsubSop = onSnapshot(qSop, snap => { setDocuments(snap.docs.map(d => ({ id: d.id, ...d.data() })) as ContentData[]); setIsLoadingData(false); });
    const unsubFaq = onSnapshot(qFaq, snap => setFaqs(snap.docs.map(d => ({ id: d.id, ...d.data() })) as FAQData[]));
    const unsubGuide = onSnapshot(qGuide, snap => setGuides(snap.docs.map(d => ({ id: d.id, ...d.data() })) as GuideData[]));
    const onScroll = () => {
      setIsScrolled(window.scrollY > 50);
      if (window.scrollY > 50 && isMenuOpen) setIsMenuOpen(false);
      setShowSuggestions(false);
    };
    window.addEventListener('scroll', onScroll);
    return () => { unsubSop(); unsubFaq(); unsubGuide(); window.removeEventListener('scroll', onScroll); };
  }, [isMenuOpen]);

  /* ── Pencarian ── */
  const liveSuggestions = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    if (!q) return [];
    return documents
      .filter(d => {
        const matchText = d.title.toLowerCase().includes(q) || d.description.toLowerCase().includes(q);
        const matchCat = selectedCategoryFilter === 'all' || d.category === selectedCategoryFilter;
        return matchText && matchCat;
      })
      .slice(0, 5);
  }, [searchQuery, documents, selectedCategoryFilter]);

  const quickPreviewResults = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    if (!q) return [];
    return documents
      .filter(d => {
        const matchText = d.title.toLowerCase().includes(q) || d.description.toLowerCase().includes(q);
        const matchCat = selectedCategoryFilter === 'all' || d.category === selectedCategoryFilter;
        return matchText && matchCat;
      })
      .slice(0, 3);
  }, [searchQuery, documents, selectedCategoryFilter]);

  const filteredTableDocs = useMemo(() => {
    const q = activeSearch.toLowerCase();
    return documents.filter(d => {
      const matchSearch = !q || d.title.toLowerCase().includes(q) || d.category.toLowerCase().includes(q);
      const matchCat = selectedCategoryFilter === 'all' || d.category === selectedCategoryFilter;
      return matchSearch && matchCat;
    });
  }, [activeSearch, selectedCategoryFilter, documents]);

  const indexOfLastItem = currentPage * itemsPerPage;
  const indexOfFirstItem = indexOfLastItem - itemsPerPage;
  const currentTableDocs = filteredTableDocs.slice(indexOfFirstItem, indexOfLastItem);
  const totalPages = Math.ceil(filteredTableDocs.length / itemsPerPage);

  /* ── Helpers ── */
  const handleCategoryClick = (id: string) => navigate(`/category/${id}`);
  const handleDocClick = (id: string) => { setShowSuggestions(false); navigate(`/detail/${id}`); };
  const scrollToSection = (id: string) => { document.getElementById(id)?.scrollIntoView({ behavior: 'smooth' }); setIsMenuOpen(false); };
  const handleScrollTop = () => window.scrollTo({ top: 0, behavior: 'smooth' });
  const scrollToTable = () => setTimeout(() => document.getElementById('document-table-section')?.scrollIntoView({ behavior: 'smooth', block: 'start' }), 300);

  const handleSearchAction = () => {
    const q = searchQuery.trim();
    if (!q) return;
    setActiveSearch(q);
    setCurrentPage(1);
    setShowSuggestions(false);
    scrollToTable();
  };

  const handlePopularTag = (tag: string) => {
    setSearchQuery(tag);
    setShowSuggestions(true);
    setTimeout(() => searchInputRef.current?.focus(), 50);
  };

  const handleSuggestionClick = (doc: ContentData) => {
    setSearchQuery(doc.title);
    setActiveSearch(doc.title);
    setCurrentPage(1);
    setShowSuggestions(false);
    scrollToTable();
  };

  const handleClearSearch = () => {
    setSearchQuery('');
    setActiveSearch('');
    setCurrentPage(1);
    setShowSuggestions(false);
    searchInputRef.current?.focus();
  };

  const formatDate = (ts: any) => {
    if (!ts) return '-';
    return new Date(ts.seconds * 1000).toLocaleString('id-ID', { day: 'numeric', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' });
  };
  const isNewDocument = (ts: any) => {
    if (!ts) return false;
    return Math.ceil(Math.abs(Date.now() - ts.seconds * 1000) / 86400000) <= 30;
  };

  /* ══════════════════════════════════════════════════════════════
     SECTION: HOME
  ══════════════════════════════════════════════════════════════ */
  const SectionHome = () => (
    <div className="space-y-4">
      <section className={`transition-all duration-1000 delay-300 ease-out ${isLoaded ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-10'}`}>
        <div className="flex items-center space-x-3 mb-8 pl-4 border-l-4 border-[#D4AF37]">
          <Grid className="w-5 h-5 text-[#D4AF37]" />
          <h3 className="font-black text-white text-lg uppercase tracking-widest drop-shadow-sm">Kategori Layanan</h3>
        </div>

        {/* Pencarian cepat */}
        {searchQuery.trim() && quickPreviewResults.length > 0 && (
          <div className="mb-8 p-4 bg-emerald-50 dark:bg-emerald-900/20 border border-emerald-100 dark:border-emerald-800/40 rounded-2xl animate-in fade-in zoom-in duration-300">
            <div className="flex items-center justify-between mb-3">
              <p className="text-emerald-800 dark:text-emerald-300 text-sm font-bold">
                Pencarian cepat: <span className="text-[#0D5C35] dark:text-emerald-400">"{searchQuery.trim()}"</span>
                {selectedCategoryFilter !== 'all' && (
                  <span className="ml-2 text-xs bg-emerald-100 dark:bg-emerald-900/40 text-emerald-700 dark:text-emerald-400 px-2 py-0.5 rounded-full border border-emerald-200 dark:border-emerald-700/30">
                    {categories.find(c => c.id === selectedCategoryFilter)?.title}
                  </span>
                )}
              </p>
              <span className="text-xs text-emerald-600 dark:text-emerald-400 font-medium bg-emerald-100 dark:bg-emerald-900/40 px-2 py-0.5 rounded-full">{quickPreviewResults.length} hasil</span>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
              {quickPreviewResults.map(doc => (
                <div key={doc.id} onClick={() => handleDocClick(doc.id)}
                  className="bg-white dark:bg-[#162918] p-4 rounded-xl shadow-sm cursor-pointer hover:shadow-md border border-emerald-100 dark:border-emerald-800/30 transition-all hover:scale-[1.02] hover:border-[#0D5C35]/30 group">
                  <div className="text-[10px] font-bold text-emerald-600 dark:text-emerald-400 uppercase tracking-wider mb-1">{doc.category.replace(/-/g, ' ')}</div>
                  <div className="font-bold text-slate-800 dark:text-slate-100 text-sm line-clamp-2">{doc.title}</div>
                </div>
              ))}
            </div>
            {activeSearch !== searchQuery.trim() && (
              <p className="text-center text-xs text-slate-400 mt-3 italic">
                Tekan <kbd className="px-1.5 py-0.5 bg-white dark:bg-slate-700 border border-slate-200 dark:border-slate-600 rounded text-slate-600 dark:text-slate-300 font-mono">Enter</kbd> untuk lihat semua di tabel
              </p>
            )}
          </div>
        )}

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {!isLoaded
            ? Array.from({ length: 6 }).map((_, i) => <SkeletonCard key={i} />)
            : categories.map((cat, i) => (
              <div key={cat.id} onClick={() => handleCategoryClick(cat.id)}
                className="cursor-pointer transition-transform hover:scale-105 active:scale-95 h-full"
                style={{ animationDelay: `${i * 80}ms` }}>
                <KnowledgeCard title={cat.title} description={cat.description} icon={cat.icon} colorClass={cat.color} />
              </div>
            ))}
        </div>
      </section>

      <FadeInSection delay="delay-100">
        <div className="relative flex items-center py-8">
          <div className="flex-grow border-t-2 border-slate-100 dark:border-slate-700" />
          <span className="flex-shrink-0 mx-4 text-slate-400 dark:text-slate-500 text-xs font-bold uppercase tracking-widest bg-[#F4F7F5] dark:bg-[#0d1a12] px-4 py-2 rounded-full border border-slate-200 dark:border-slate-700 shadow-sm">
            Atau telusuri database lengkap
          </span>
          <div className="flex-grow border-t-2 border-slate-100 dark:border-slate-700" />
        </div>
      </FadeInSection>

      <FadeInSection delay="delay-200">
        <section id="document-table-section" className="bg-white dark:bg-[#162918] rounded-3xl shadow-sm border border-slate-200 dark:border-slate-700 overflow-hidden">
          <div className="p-6 border-b border-slate-100 dark:border-slate-700 flex flex-col md:flex-row justify-between items-center gap-4 bg-slate-50/50 dark:bg-[#1a3021]/50">
            <div className="flex items-center gap-2 flex-wrap">
              <List className="w-5 h-5 text-[#0D5C35]" />
              <h3 className="font-bold text-slate-800 dark:text-slate-100 text-lg">Daftar Seluruh Dokumen</h3>
              <span className="text-xs font-bold text-slate-400 bg-slate-100 dark:bg-slate-700 dark:text-slate-300 px-2 py-0.5 rounded-full">{filteredTableDocs.length}</span>
              {activeSearch && (
                <span className="text-xs font-bold text-[#0D5C35] dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-900/30 border border-emerald-200 dark:border-emerald-700/30 px-2 py-0.5 rounded-full flex items-center gap-1">
                  Filter: "{activeSearch}"
                  <button onClick={handleClearSearch} className="ml-1 hover:text-rose-500 transition-colors"><X className="w-3 h-3" /></button>
                </span>
              )}
              {selectedCategoryFilter !== 'all' && (
                <span className="text-xs font-bold text-blue-600 dark:text-blue-400 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-700/30 px-2 py-0.5 rounded-full flex items-center gap-1">
                  {categories.find(c => c.id === selectedCategoryFilter)?.title}
                  <button onClick={() => setSelectedCategoryFilter('all')} className="ml-1 hover:text-rose-500 transition-colors"><X className="w-3 h-3" /></button>
                </span>
              )}
            </div>
            <div className="flex flex-col sm:flex-row items-center gap-3 text-sm w-full md:w-auto">
              <div className="flex items-center text-slate-600 dark:text-slate-300 bg-white dark:bg-[#0f1f16] border border-slate-300 dark:border-slate-600 rounded-lg px-2 py-1 w-full sm:w-auto">
                <Filter className="w-4 h-4 mr-2 text-slate-400 flex-shrink-0" />
                <select value={selectedCategoryFilter}
                  onChange={e => { setSelectedCategoryFilter(e.target.value); setCurrentPage(1); }}
                  className="bg-transparent outline-none cursor-pointer text-slate-700 dark:text-slate-200 font-medium w-full">
                  <option value="all">Semua Kategori</option>
                  {categories.map(c => <option key={c.id} value={c.id}>{c.title}</option>)}
                </select>
              </div>
              <div className="flex items-center text-slate-600 dark:text-slate-300 gap-2">
                <span className="whitespace-nowrap">Tampil</span>
                <select value={itemsPerPage}
                  onChange={e => { setItemsPerPage(Number(e.target.value)); setCurrentPage(1); }}
                  className="border border-slate-300 dark:border-slate-600 rounded-lg px-2 py-1 bg-white dark:bg-[#0f1f16] dark:text-slate-200 focus:ring-2 focus:ring-[#0D5C35] outline-none cursor-pointer">
                  <option value={5}>5</option><option value={10}>10</option><option value={20}>20</option>
                </select>
                <span>data</span>
              </div>
            </div>
          </div>

          <table className="w-full text-left text-sm table-fixed">
            <thead className="bg-slate-50 dark:bg-[#1a3021] text-slate-600 dark:text-slate-400 font-bold uppercase tracking-wider border-b border-slate-200 dark:border-slate-700">
              <tr>
                <th className="px-4 py-4 w-10 text-center hidden sm:table-cell">#</th>
                <th className="px-4 py-4">Judul Dokumen / Informasi</th>
                <th className="px-4 py-4 w-28 text-center">Aksi</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-700/50">
              {isLoadingData
                ? Array.from({ length: 5 }).map((_, i) => <SkeletonRow key={i} />)
                : currentTableDocs.length > 0
                  ? currentTableDocs.map((doc, i) => (
                    <tr key={doc.id} className="hover:bg-slate-50 dark:hover:bg-[#1a3021]/50 transition-colors group bg-white dark:bg-transparent">
                      <td className="px-4 py-4 text-center text-slate-400 dark:text-slate-500 font-medium hidden sm:table-cell">{indexOfFirstItem + i + 1}</td>
                      <td className="px-4 py-4 min-w-0">
                        <div className="flex flex-wrap items-center gap-1.5 mb-1.5">
                          <span className="px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider bg-slate-100 dark:bg-slate-700 text-slate-500 dark:text-slate-300 border border-slate-200 dark:border-slate-600 group-hover:bg-[#0D5C35] group-hover:text-white group-hover:border-[#0D5C35] transition-colors whitespace-nowrap">
                            {doc.category.replace(/-/g, ' ')}
                          </span>
                          {isNewDocument(doc.updatedAt) && (
                            <span className="px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider bg-amber-100 dark:bg-amber-900/30 text-amber-600 dark:text-amber-400 border border-amber-200 dark:border-amber-700/30 animate-pulse">Baru</span>
                          )}
                        </div>
                        <h4 className="text-slate-900 dark:text-slate-100 font-bold text-sm md:text-base mb-1 group-hover:text-[#0D5C35] dark:group-hover:text-emerald-400 transition-colors line-clamp-2">{doc.title}</h4>
                        <p className="text-slate-400 dark:text-slate-500 text-xs">Update: {formatDate(doc.updatedAt)}</p>
                      </td>
                      <td className="px-4 py-4 text-center">
                        <button onClick={() => handleDocClick(doc.id)}
                          className="inline-flex items-center px-3 py-2 bg-[#00A3C8] text-white rounded-lg font-bold shadow-md hover:bg-[#008CAE] hover:-translate-y-0.5 transition-all text-xs whitespace-nowrap">
                          <Eye className="w-3 h-3 mr-1" /> Lihat
                        </button>
                      </td>
                    </tr>
                  ))
                  : (
                    <tr>
                      <td colSpan={3} className="px-6 py-10 text-center text-slate-400 italic bg-slate-50/30 dark:bg-transparent">
                        Tidak ada dokumen{activeSearch ? ` untuk "${activeSearch}"` : ''}{selectedCategoryFilter !== 'all' ? ` di kategori "${categories.find(c => c.id === selectedCategoryFilter)?.title}"` : ''}.
                      </td>
                    </tr>
                  )
              }
            </tbody>
          </table>

          <div className="p-4 border-t border-slate-100 dark:border-slate-700 flex flex-col md:flex-row justify-between items-center gap-4 text-sm text-slate-500 dark:text-slate-400 bg-slate-50/30 dark:bg-[#1a3021]/30">
            <div>Menampilkan {currentTableDocs.length > 0 ? indexOfFirstItem + 1 : 0}–{Math.min(indexOfLastItem, filteredTableDocs.length)} dari {filteredTableDocs.length} data</div>
            <div className="flex items-center gap-2">
              <button onClick={() => setCurrentPage(p => Math.max(p - 1, 1))} disabled={currentPage === 1}
                className="p-2 border border-slate-200 dark:border-slate-600 rounded-lg hover:bg-slate-50 dark:hover:bg-slate-700 dark:text-slate-300 disabled:opacity-50 disabled:cursor-not-allowed transition-colors">
                <ChevronLeft className="w-4 h-4" />
              </button>
              <span className="px-3 font-bold text-slate-700 dark:text-slate-200">Halaman {currentPage} / {totalPages || 1}</span>
              <button onClick={() => setCurrentPage(p => Math.min(p + 1, totalPages))} disabled={currentPage === totalPages || totalPages === 0}
                className="p-2 border border-slate-200 dark:border-slate-600 rounded-lg hover:bg-slate-50 dark:hover:bg-slate-700 dark:text-slate-300 disabled:opacity-50 disabled:cursor-not-allowed transition-colors">
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        </section>
      </FadeInSection>
    </div>
  );

  /* ══════════════════════════════════════════════════════════════
     SECTION: FAQ
  ══════════════════════════════════════════════════════════════ */
  const SectionFAQ = () => (
    <div className="max-w-6xl mx-auto">
      <div className="text-center mb-10">
        <span className="inline-flex items-center gap-2 px-4 py-1.5 bg-amber-50 dark:bg-amber-900/20 text-amber-600 dark:text-amber-400 rounded-full text-xs font-bold uppercase tracking-widest border border-amber-200 dark:border-amber-700/30 mb-4">
          <HelpCircle className="w-3.5 h-3.5" /> Pusat Bantuan
        </span>
        <h2 className="text-3xl font-black text-slate-900 dark:text-slate-100 tracking-tight mb-2">Pertanyaan yang Sering Diajukan</h2>
        <p className="text-slate-500 dark:text-slate-400 max-w-lg mx-auto">Temukan jawaban atas pertanyaan umum seputar layanan BMN KPKNL Kendari</p>
      </div>
      <div className="grid grid-cols-1 lg:grid-cols-5 gap-8 items-start">
        <div className="lg:col-span-2 lg:sticky lg:top-24 space-y-4">
          <div className="bg-gradient-to-br from-[#0D5C35] to-[#0A492A] rounded-2xl p-6 text-white shadow-lg shadow-emerald-900/20">
            <div className="flex items-center gap-3 mb-4">
              <div className="p-2 bg-white/10 rounded-xl"><HelpCircle className="w-5 h-5" /></div>
              <div>
                <p className="font-black text-lg leading-none">{faqs.length}</p>
                <p className="text-emerald-200 text-xs">Pertanyaan Tersedia</p>
              </div>
            </div>
            <p className="text-emerald-100/80 text-sm leading-relaxed mb-4">Kumpulan jawaban resmi atas pertanyaan yang paling sering diajukan pengguna layanan KPKNL Kendari.</p>
            <div className="flex flex-wrap gap-2">
              {['Sewa BMN', 'Lelang', 'PSP', 'Hibah'].map(tag => (
                <span key={tag} className="px-3 py-1 bg-white/10 rounded-full text-xs font-medium border border-white/10 text-white/80">{tag}</span>
              ))}
            </div>
          </div>
          <div className="bg-amber-50 dark:bg-amber-900/10 border border-amber-200 dark:border-amber-700/20 rounded-2xl p-5">
            <div className="flex items-start gap-3">
              <Sparkles className="w-5 h-5 text-amber-500 flex-shrink-0 mt-0.5" />
              <div>
                <p className="font-bold text-slate-800 dark:text-slate-100 text-sm mb-1">Tidak menemukan jawaban?</p>
                <p className="text-slate-600 dark:text-slate-400 text-xs leading-relaxed mb-3">Hubungi kami langsung melalui Konsultasi Online untuk mendapatkan bantuan lebih lanjut.</p>
                <a href="#" target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1.5 text-xs font-bold text-amber-700 dark:text-amber-400 hover:text-amber-800 dark:hover:text-amber-300 transition-colors">
                  <Phone className="w-3.5 h-3.5" /> Konsul Online <ArrowRight className="w-3 h-3" />
                </a>
              </div>
            </div>
          </div>
        </div>
        <div className="lg:col-span-3 space-y-3">
          {faqs.length > 0
            ? faqs.map((faq, idx) => <FAQAccordionItem key={faq.id} faq={faq} index={idx} isDark={isDark} />)
            : (
              <div className="bg-white dark:bg-[#162918] rounded-2xl border border-slate-200 dark:border-slate-700 p-12 text-center">
                <HelpCircle className="w-12 h-12 text-slate-200 dark:text-slate-600 mx-auto mb-3" />
                <p className="text-slate-400 dark:text-slate-500 font-medium italic">Belum ada FAQ tersedia.</p>
              </div>
            )
          }
        </div>
      </div>
    </div>
  );

  /* ══════════════════════════════════════════════════════════════
     SECTION: PANDUAN
  ══════════════════════════════════════════════════════════════ */
  const SectionPanduan = () => (
    <div className="max-w-4xl mx-auto">
      <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4 mb-8">
        <div className="flex items-center gap-4">
          <div className="p-3 bg-gradient-to-br from-[#0D5C35] to-[#0A492A] text-white rounded-2xl shadow-lg shadow-emerald-900/20">
            <BookOpen className="w-7 h-7" />
          </div>
          <div>
            <h2 className="text-2xl font-black text-slate-900 dark:text-slate-100 tracking-tight">Panduan Pengguna</h2>
            <p className="text-slate-500 dark:text-slate-400 text-sm">Petunjuk penggunaan layanan KPKNL Kendari</p>
          </div>
        </div>
        {guides.length > 0 && (
          <span className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-emerald-50 dark:bg-emerald-900/20 text-[#0D5C35] dark:text-emerald-400 rounded-full text-xs font-bold border border-emerald-200 dark:border-emerald-700/30">
            <Layers className="w-3.5 h-3.5" /> {guides.length} panduan tersedia
          </span>
        )}
      </div>
      {guides.length > 0 ? (
        <div className="space-y-6">
          {guides.map((guide, idx) => (
            <div key={guide.id} className="group bg-white dark:bg-[#162918] rounded-2xl border border-slate-200 dark:border-slate-700 overflow-hidden shadow-sm hover:shadow-md hover:border-[#0D5C35]/20 dark:hover:border-[#0D5C35]/40 transition-all duration-300">
              <div className="flex items-center gap-3 px-6 py-4 bg-gradient-to-r from-[#EAF2EE] dark:from-[#0D5C35]/15 to-transparent border-b border-slate-100 dark:border-slate-700">
                <span className="flex-shrink-0 w-8 h-8 rounded-full bg-[#0D5C35] text-white text-sm font-black flex items-center justify-center shadow-sm">{idx + 1}</span>
                <span className="text-[#0D5C35] dark:text-emerald-400 text-xs font-bold uppercase tracking-widest">Panduan #{idx + 1}</span>
              </div>
              <div className="px-6 py-5">
                <div className="prose prose-slate dark:prose-invert max-w-none prose-sm prose-p:text-slate-600 dark:prose-p:text-slate-300 prose-p:leading-relaxed prose-li:marker:text-[#0D5C35] prose-strong:text-slate-800 dark:prose-strong:text-slate-100 prose-headings:text-slate-800 dark:prose-headings:text-slate-100 prose-headings:font-bold">
                  <ReactMarkdown>{guide.content}</ReactMarkdown>
                </div>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="bg-white dark:bg-[#162918] rounded-2xl border-2 border-dashed border-slate-200 dark:border-slate-700 p-16 text-center">
          <BookOpen className="w-12 h-12 text-slate-200 dark:text-slate-600 mx-auto mb-3" />
          <p className="text-slate-400 dark:text-slate-500 italic">Belum ada data panduan.</p>
        </div>
      )}
    </div>
  );

  /* ══════════════════════════════════════════════════════════════
     SECTION: CTA / INFO
  ══════════════════════════════════════════════════════════════ */
  const SectionCTA = () => {
    const ctaStats = [
      { label: 'Total Dokumen', value: documents.length, icon: <FileText className="w-6 h-6" />, color: 'from-emerald-500 to-teal-600' },
      { label: 'Kategori Aktif', value: categories.length, icon: <Layers className="w-6 h-6" />, color: 'from-blue-500 to-indigo-600' },
      { label: 'FAQ Tersedia', value: faqs.length, icon: <MessageSquare className="w-6 h-6" />, color: 'from-amber-500 to-orange-600' },
      { label: 'Panduan Lengkap', value: guides.length, icon: <BookOpen className="w-6 h-6" />, color: 'from-rose-500 to-pink-600' },
    ];
    const socials = [
      { href: 'https://www.instagram.com/kpknlkendari', icon: <Instagram className="w-5 h-5" />, label: 'Instagram', bg: 'bg-pink-50 hover:bg-pink-500', text: 'hover:text-white text-pink-600' },
      { href: 'https://www.youtube.com/@kpknlkendarimelulo9245', icon: <Youtube className="w-5 h-5" />, label: 'YouTube', bg: 'bg-red-50 hover:bg-red-500', text: 'hover:text-white text-red-600' },
      { href: 'https://www.djkn.kemenkeu.go.id/kpknl-kendari', icon: <Globe className="w-5 h-5" />, label: 'Website', bg: 'bg-blue-50 hover:bg-blue-500', text: 'hover:text-white text-blue-600' },
      { href: 'https://lelang.go.id/', icon: <Scale className="w-5 h-5" />, label: 'Lelang', bg: 'bg-amber-50 hover:bg-amber-500', text: 'hover:text-white text-amber-600' },
    ];
    return (
      <div id="info" className="max-w-5xl mx-auto">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-10">
          {ctaStats.map((s, i) => (
            <div key={s.label} className="bg-white dark:bg-[#162918] rounded-2xl border border-slate-200 dark:border-slate-700 p-5 text-center shadow-sm hover:shadow-md transition-shadow group stat-animate" style={{ animationDelay: `${i * 100}ms` }}>
              <div className={`w-12 h-12 rounded-xl bg-gradient-to-br ${s.color} text-white flex items-center justify-center mx-auto mb-3 shadow-md group-hover:scale-110 transition-transform`}>{s.icon}</div>
              <div className="text-3xl font-black text-slate-900 dark:text-slate-100 leading-none mb-1">{s.value}</div>
              <div className="text-xs font-medium text-slate-500 dark:text-slate-400 uppercase tracking-wider">{s.label}</div>
            </div>
          ))}
        </div>
        <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-[#0D5C35] via-[#0A492A] to-[#083D23] p-8 md:p-12 shadow-2xl shadow-emerald-900/30">
          <div className="absolute inset-0 hero-grid opacity-30 pointer-events-none" />
          <div className="absolute -top-16 -right-16 w-64 h-64 rounded-full bg-[#D4AF37]/10 blur-3xl pointer-events-none" />
          <div className="absolute -bottom-8 -left-8 w-48 h-48 rounded-full bg-white/5 blur-2xl pointer-events-none" />
          <div className="relative z-10 flex flex-col md:flex-row items-center justify-between gap-8">
            <div className="text-center md:text-left">
              <div className="inline-flex items-center gap-2 px-3 py-1.5 bg-[#D4AF37]/20 border border-[#D4AF37]/30 rounded-full text-[#D4AF37] text-xs font-bold uppercase tracking-widest mb-4">
                <TrendingUp className="w-3.5 h-3.5" /> Layanan Terbaik
              </div>
              <h2 className="text-2xl md:text-3xl font-black text-white leading-tight mb-3">
                Butuh Bantuan <br className="hidden md:block" /><span className="text-[#D4AF37]">Lebih Lanjut?</span>
              </h2>
              <p className="text-emerald-100/70 text-sm max-w-md leading-relaxed">
                Tim profesional kami siap membantu Anda memahami prosedur pengelolaan kekayaan negara secara langsung dan personal.
              </p>
            </div>
            <div className="flex flex-col items-center gap-4 flex-shrink-0">
              <a href="#" target="_blank" rel="noopener noreferrer"
                className="flex items-center gap-3 px-8 py-4 bg-[#D4AF37] hover:bg-[#B5952F] text-slate-900 font-black rounded-2xl shadow-[0_0_24px_rgba(212,175,55,0.4)] hover:shadow-[0_0_30px_rgba(212,175,55,0.6)] hover:-translate-y-1 transition-all duration-300 whitespace-nowrap">
                <div className="relative">
                  <Phone className="w-5 h-5" />
                  <span className="absolute -top-1 -right-1 w-2.5 h-2.5 bg-emerald-400 rounded-full border-2 border-[#D4AF37] pulse-ring"></span>
                </div>
                Konsultasi Online
              </a>
              <div className="flex items-center gap-2">
                {socials.map(s => (
                  <a key={s.label} href={s.href} target="_blank" rel="noopener noreferrer" aria-label={s.label} title={s.label}
                    className={`p-2.5 ${s.bg} ${s.text} rounded-xl border border-white/10 transition-all duration-300 hover:scale-110 hover:shadow-lg`}>
                    {s.icon}
                  </a>
                ))}
              </div>
              <p className="text-emerald-200/50 text-xs">Ikuti kami di media sosial</p>
            </div>
          </div>
        </div>
      </div>
    );
  };

  /* ══════════════════════════════════════════════════════════════
     RENDER
  ══════════════════════════════════════════════════════════════ */
  return (
    <div className="min-h-screen flex flex-col font-sans relative bg-[#F4F7F5] dark:bg-[#0d1a12]" id="top">
      {/* ── SEO Meta Tags ── */}
      <Helmet>
        <title>Knowledge Base Divisi PKN | KPKNL Kendari</title>
        <meta name="description" content="Sistem informasi terpadu SOP, regulasi, dan prosedur layanan pengelolaan kekayaan negara Divisi PKN KPKNL Kendari — Kementerian Keuangan RI." />
        <meta name="keywords" content="KPKNL Kendari, SOP BMN, Pengelolaan Kekayaan Negara, Lelang, PSP, Hibah, Pinjam Pakai, Sewa BMN, DJKN" />
        <meta name="author" content="Divisi PKN KPKNL Kendari" />
        <meta property="og:title" content="Knowledge Base Divisi PKN — KPKNL Kendari" />
        <meta property="og:description" content="Temukan SOP, regulasi, dan panduan layanan pengelolaan BMN secara cepat dan akurat." />
        <meta property="og:type" content="website" />
        <meta property="og:locale" content="id_ID" />
        <meta name="robots" content="index, follow" />
        <meta name="theme-color" content="#0D5C35" />
      </Helmet>

      <style dangerouslySetInnerHTML={{ __html: HERO_ANIM_CSS }} />

      {/* ── NAVBAR ── */}
      <header className={`fixed top-0 left-0 right-0 z-50 transition-all duration-500 ease-in-out ${isScrolled ? 'bg-[#0A492A]/95 backdrop-blur-md shadow-lg py-3' : 'bg-transparent py-5'}`}>
        <nav className="max-w-7xl mx-auto px-6">
          <div className="flex justify-between items-center">
            <div className="flex items-center cursor-pointer" onClick={() => scrollToSection('top')}>
              <img
                src={isScrolled ? '/logo-color.png' : '/logo-white.png'}
                alt="Logo KPKNL Kendari"
                className="h-9 md:h-11 w-auto object-contain transition-all duration-500 drop-shadow-md hover:scale-105"
              />
            </div>

            {/* Desktop nav */}
            <div className="hidden md:flex items-center space-x-5">
              <div className="flex space-x-6 text-sm font-semibold uppercase tracking-wider">
                {[{ label: 'Beranda', id: 'beranda' }, { label: 'FAQ', id: 'faq' }, { label: 'Panduan', id: 'panduan' }, { label: 'Info', id: 'info' }].map(item => (
                  <button key={item.id} onClick={() => scrollToSection(item.id)} className="text-white/90 hover:text-[#D4AF37] transition-colors">{item.label}</button>
                ))}
              </div>
              {/* Dark mode toggle */}
              <button
                onClick={() => setIsDark(p => !p)}
                className="p-2 rounded-full bg-white/10 hover:bg-white/20 text-white border border-white/20 transition-all hover:scale-110"
                aria-label={isDark ? 'Mode Terang' : 'Mode Gelap'}
                title={isDark ? 'Mode Terang' : 'Mode Gelap'}
              >
                {isDark ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
              </button>
              <button onClick={() => navigate('/login')}
                className="flex items-center px-4 py-2 bg-white/10 hover:bg-white/20 backdrop-blur-sm rounded-full text-xs font-bold text-white border border-white/20 transition-all">
                <LogIn className="w-3 h-3 mr-1.5" /> Admin
              </button>
            </div>

            {/* Mobile: dark toggle + hamburger */}
            <div className="md:hidden flex items-center gap-2">
              <button
                onClick={() => setIsDark(p => !p)}
                className="p-2 rounded-full bg-white/10 hover:bg-white/20 text-white border border-white/20 transition-all"
                aria-label="Toggle dark mode"
              >
                {isDark ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
              </button>
              <button onClick={() => setIsMenuOpen(!isMenuOpen)} className="text-white p-2 hover:bg-white/10 rounded-lg">
                {isMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
              </button>
            </div>
          </div>

          {/* Mobile menu */}
          {isMenuOpen && (
            <div className="md:hidden absolute top-full left-0 right-0 mt-4 mx-4 bg-[#0A492A] rounded-2xl shadow-2xl border border-white/10 p-4 flex flex-col space-y-2 animate-in slide-in-from-top-5 duration-200">
              {[
                { label: 'Beranda', id: 'beranda', icon: <Grid className="w-4 h-4" /> },
                { label: 'FAQ', id: 'faq', icon: <HelpCircle className="w-4 h-4" /> },
                { label: 'Panduan', id: 'panduan', icon: <BookOpen className="w-4 h-4" /> },
                { label: 'Info', id: 'info', icon: <BarChart3 className="w-4 h-4" /> },
              ].map(item => (
                <button key={item.id} onClick={() => scrollToSection(item.id)}
                  className="text-left px-4 py-3 rounded-xl hover:bg-white/10 text-white font-semibold flex items-center gap-3">
                  <span className="opacity-70">{item.icon}</span> {item.label}
                </button>
              ))}
              <div className="mt-4 pt-4 border-t border-white/10">
                <button onClick={() => navigate('/login')}
                  className="w-full text-left px-4 py-3 rounded-xl bg-white/10 text-[#D4AF37] font-bold flex items-center gap-3 hover:bg-white/20 transition-all">
                  <LogIn className="w-4 h-4" /> Login Admin
                </button>
              </div>
            </div>
          )}
        </nav>
      </header>

      {/* ── HERO ── */}
      <div className="relative bg-[#0D5C35] pt-40 pb-32 px-4 overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-[#0D5C35] via-[#0A492A] to-[#062B18]" />
        <div className="absolute inset-0 hero-grid opacity-20" />
        <div className="absolute inset-0 pointer-events-none overflow-hidden">
          <div className="blob-1 absolute top-[-80px] left-[-60px]    w-[420px] h-[420px] rounded-full bg-emerald-400/20 blur-3xl" />
          <div className="blob-2 absolute bottom-[-100px] right-[-80px] w-[500px] h-[500px] rounded-full bg-teal-300/15  blur-3xl" />
          <div className="blob-3 absolute top-[30%] left-[50%]        w-[300px] h-[300px] rounded-full bg-[#D4AF37]/10 blur-3xl" />
        </div>
        <div className="absolute inset-0 pointer-events-none overflow-hidden">
          {[
            { top: '15%', left: '10%', size: 'w-2 h-2', delay: '0s' },
            { top: '25%', left: '80%', size: 'w-3 h-3', delay: '1.2s' },
            { top: '60%', left: '5%', size: 'w-1.5 h-1.5', delay: '0.6s' },
            { top: '70%', left: '90%', size: 'w-2.5 h-2.5', delay: '2s' },
            { top: '45%', left: '95%', size: 'w-2 h-2', delay: '1.5s' },
            { top: '80%', left: '40%', size: 'w-1.5 h-1.5', delay: '0.3s' },
            { top: '10%', left: '55%', size: 'w-2 h-2', delay: '2.5s' },
            { top: '50%', left: '20%', size: 'w-1 h-1', delay: '1s' },
          ].map((p, i) => (
            <div key={i} className={`particle absolute ${p.size} rounded-full bg-white/30`} style={{ top: p.top, left: p.left, animationDelay: p.delay }} />
          ))}
        </div>

        <div className={`max-w-4xl mx-auto text-center relative z-10 transition-all duration-1000 ${isLoaded ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-10'}`}>
          <div className="inline-flex items-center gap-2 px-4 py-2 bg-white/10 backdrop-blur-sm border border-white/20 rounded-full text-white/80 text-xs font-semibold uppercase tracking-wider mb-6">
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
            Sistem Informasi Terpadu — KPKNL Kendari
          </div>

          <h1 className="text-white text-4xl md:text-5xl font-extrabold mb-5 tracking-tight leading-tight">
            KNOWLEDGE BASE
            <span className="block text-2xl md:text-3xl font-medium text-emerald-100 mt-3 flex flex-col sm:flex-row items-center justify-center gap-2 sm:gap-3">
              <span className="tracking-wide">DIVISI PKN</span>
              <span className="hidden sm:inline text-white/40">|</span>
              <span className="font-bold text-[#D4AF37] tracking-widest">KPKNL KENDARI</span>
            </span>
          </h1>
          <p className="text-slate-200/80 mb-10 text-base md:text-lg max-w-xl mx-auto leading-relaxed">
            Temukan SOP, regulasi, dan informasi layanan pengelolaan kekayaan negara secara cepat dan akurat.
          </p>

          {/* ── SEARCH BAR ── */}
          <div className="max-w-2xl mx-auto">
            <div className="relative">
              <div className="flex items-stretch bg-white rounded-full shadow-2xl overflow-hidden focus-within:ring-4 focus-within:ring-[#D4AF37]/40 transition-all">
                <div className="flex items-center pl-5 pr-2 flex-shrink-0">
                  <Search className="w-5 h-5 text-slate-400 pointer-events-none" />
                </div>
                <input
                  ref={searchInputRef}
                  type="text"
                  className="flex-1 py-4 pr-1 bg-transparent text-slate-900 outline-none text-base md:text-lg placeholder:text-slate-400 min-w-0"
                  placeholder={selectedCategoryFilter !== 'all' ? `Cari di ${categories.find(c => c.id === selectedCategoryFilter)?.title}...` : 'Cari SOP atau Layanan...'}
                  value={searchQuery}
                  onChange={e => { setSearchQuery(e.target.value); setShowSuggestions(e.target.value.trim().length > 0); }}
                  onKeyDown={e => { if (e.key === 'Enter') handleSearchAction(); if (e.key === 'Escape') setShowSuggestions(false); }}
                  onFocus={() => { if (searchQuery.trim()) setShowSuggestions(true); }}
                  onBlur={() => setTimeout(() => setShowSuggestions(false), 150)}
                />
                {searchQuery && (
                  <button onClick={handleClearSearch} className="flex items-center flex-shrink-0 mx-2 p-1.5 text-slate-400 hover:text-rose-500 bg-slate-100 hover:bg-rose-50 rounded-full transition-all self-center">
                    <X className="w-4 h-4" />
                  </button>
                )}
                {/* Filter toggle button */}
                <button
                  onClick={() => setShowCategoryFilter(p => !p)}
                  className={`flex-shrink-0 flex items-center self-center mx-1.5 p-2 rounded-full transition-all ${showCategoryFilter || selectedCategoryFilter !== 'all' ? 'bg-[#0D5C35] text-white' : 'bg-slate-100 text-slate-500 hover:bg-slate-200'}`}
                  title="Filter Kategori"
                >
                  <SlidersHorizontal className="w-4 h-4" />
                </button>
                <div className="flex-shrink-0 self-center w-px h-7 bg-slate-200 mx-1" />
                <button onClick={handleSearchAction}
                  className="flex-shrink-0 flex items-center gap-2 px-7 bg-[#D4AF37] hover:bg-[#B5952F] text-slate-900 font-black transition-all active:brightness-90 whitespace-nowrap text-sm md:text-base">
                  <Search className="w-4 h-4 md:w-5 md:h-5" />
                  <span className="hidden sm:inline">Cari</span>
                </button>
              </div>

              {/* Dropdown saran live */}
              {showSuggestions && liveSuggestions.length > 0 && (
                <div className="absolute top-full left-0 right-0 mt-2 bg-white rounded-2xl shadow-2xl border border-slate-200 overflow-hidden z-50">
                  <div className="px-4 py-2 bg-slate-50 border-b border-slate-100 flex items-center justify-between">
                    <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">Saran Pencarian</span>
                    <span className="text-xs text-slate-400">{liveSuggestions.length} hasil</span>
                  </div>
                  {liveSuggestions.map((doc, i) => (
                    <button key={doc.id} onMouseDown={() => handleSuggestionClick(doc)}
                      className="suggestion-item w-full text-left px-4 py-3 hover:bg-emerald-50 transition-colors border-b border-slate-50 last:border-0 flex items-start gap-3 group"
                      style={{ animationDelay: `${i * 40}ms` }}>
                      <div className="p-1.5 bg-slate-100 group-hover:bg-[#0D5C35] rounded-lg flex-shrink-0 transition-colors mt-0.5">
                        <Search className="w-3 h-3 text-slate-400 group-hover:text-white transition-colors" />
                      </div>
                      <div className="min-w-0">
                        <div className="font-semibold text-slate-800 text-sm group-hover:text-[#0D5C35] transition-colors line-clamp-1">{doc.title}</div>
                        <div className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mt-0.5">{doc.category.replace(/-/g, ' ')}</div>
                      </div>
                      <ArrowRight className="w-4 h-4 text-slate-300 group-hover:text-[#0D5C35] flex-shrink-0 ml-auto mt-1 transition-colors" />
                    </button>
                  ))}
                  <div className="px-4 py-2.5 bg-slate-50 border-t border-slate-100 text-center">
                    <span className="text-xs text-slate-400">Tekan <kbd className="px-1.5 py-0.5 bg-white border border-slate-200 rounded font-mono text-slate-600">Enter</kbd> untuk cari semua hasil</span>
                  </div>
                </div>
              )}
              {showSuggestions && searchQuery.trim() && liveSuggestions.length === 0 && (
                <div className="absolute top-full left-0 right-0 mt-2 bg-white rounded-2xl shadow-xl border border-slate-200 px-4 py-3 z-50 text-center">
                  <p className="text-sm text-slate-400">Tidak ada saran untuk <strong className="text-slate-600">"{searchQuery}"</strong></p>
                </div>
              )}
            </div>

            {/* ── FILTER KATEGORI (toggle panel) ── */}
            {showCategoryFilter && (
              <div className="mt-3 p-4 bg-white/10 backdrop-blur-sm border border-white/20 rounded-2xl animate-in fade-in slide-in-from-top-2 duration-200">
                <div className="flex items-center gap-2 mb-3">
                  <SlidersHorizontal className="w-3.5 h-3.5 text-white/70" />
                  <span className="text-white/70 text-xs font-bold uppercase tracking-widest">Filter Kategori</span>
                  {selectedCategoryFilter !== 'all' && (
                    <button onClick={() => setSelectedCategoryFilter('all')} className="ml-auto text-white/50 hover:text-white text-xs flex items-center gap-1 transition-colors">
                      <X className="w-3 h-3" /> Reset
                    </button>
                  )}
                </div>
                <div className="flex flex-wrap gap-2">
                  <button
                    onClick={() => setSelectedCategoryFilter('all')}
                    className={`px-3 py-1.5 rounded-full text-xs font-bold transition-all cat-filter-item
                      ${selectedCategoryFilter === 'all' ? 'bg-[#D4AF37] text-slate-900' : 'bg-white/10 text-white/80 hover:bg-white/20 border border-white/20'}`}
                    style={{ animationDelay: '0ms' }}
                  >
                    Semua
                  </button>
                  {categories.map((cat, i) => (
                    <button
                      key={cat.id}
                      onClick={() => setSelectedCategoryFilter(cat.id)}
                      className={`px-3 py-1.5 rounded-full text-xs font-bold transition-all cat-filter-item
                        ${selectedCategoryFilter === cat.id ? 'bg-[#D4AF37] text-slate-900' : 'bg-white/10 text-white/80 hover:bg-white/20 border border-white/20'}`}
                      style={{ animationDelay: `${(i + 1) * 30}ms` }}
                    >
                      {cat.title}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Pencarian Populer */}
            <div className="mt-4 flex flex-wrap justify-center gap-2">
              <span className="text-white/60 text-xs sm:text-sm font-medium py-1">Pencarian Populer:</span>
              {['Sewa BMN', 'Lelang', 'Penghapusan', 'Hibah'].map(tag => (
                <button key={tag} onClick={() => handlePopularTag(tag)}
                  className="bg-white/10 hover:bg-white/25 text-white text-xs px-3 py-1 rounded-full transition-all border border-white/10 hover:border-white/30 hover:scale-105"
                  title="Klik untuk mengisi kotak pencarian">{tag}</button>
              ))}
            </div>

            <div className="mt-10">
              <a href="#" target="_blank" rel="noopener noreferrer"
                className="inline-flex items-center px-8 py-4 bg-[#D4AF37] hover:bg-[#B5952F] text-slate-900 font-black rounded-full shadow-[0_0_20px_rgba(212,175,55,0.4)] hover:shadow-[0_0_30px_rgba(212,175,55,0.6)] hover:-translate-y-1 transition-all duration-300">
                <Phone className="w-5 h-5 mr-3 animate-pulse" />
                DAFTAR KONSUL ONLINE
              </a>
              <p className="text-emerald-100/60 text-sm mt-3">Hubungi petugas kami secara virtual untuk panduan lebih lanjut.</p>
            </div>
          </div>
        </div>
      </div>

      {/* ── MAIN CONTENT ── */}
      <main className="flex-grow max-w-7xl mx-auto px-4 -mt-16 relative z-10 w-full pb-24 space-y-20">
        <div id="beranda"><SectionHome /></div>
        <FadeInSection>
          <div id="faq" className="scroll-mt-24"><SectionFAQ /></div>
        </FadeInSection>
        <FadeInSection delay="delay-100">
          <div id="panduan" className="scroll-mt-24"><SectionPanduan /></div>
        </FadeInSection>
        <FadeInSection delay="delay-150">
          <SectionCTA />
        </FadeInSection>
      </main>

      {/* ── FOOTER ── */}
      <footer className="relative bg-gradient-to-b from-[#0A492A] to-[#062B18] text-white overflow-hidden">
        <div className="absolute inset-0 pointer-events-none overflow-hidden">
          <div className="absolute -top-24 -left-24 w-72 h-72 rounded-full bg-white/5 blur-3xl" />
          <div className="absolute -bottom-16 -right-16 w-96 h-96 rounded-full bg-[#D4AF37]/10 blur-3xl" />
        </div>
        <div className="h-1 w-full bg-gradient-to-r from-transparent via-[#D4AF37] to-transparent opacity-60" />
        <div className="relative max-w-7xl mx-auto px-6 pt-16 pb-8">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-12 mb-14">
            <div>
              <div className="mb-5">
                <img src="/logo-color.png" alt="Logo KPKNL" className="h-12 w-auto object-contain drop-shadow-md" onError={e => { e.currentTarget.style.display = 'none'; }} />
              </div>
              <p className="text-emerald-100/70 text-sm leading-relaxed mb-5">
                Kantor Pelayanan Kekayaan Negara dan Lelang Kendari — bagian dari Direktorat Jenderal Kekayaan Negara, Kementerian Keuangan RI.
              </p>
              <div className="inline-flex items-center gap-2 px-3 py-1.5 bg-white/10 rounded-full border border-white/10 text-xs text-emerald-100/80 font-medium mb-5">
                <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />Layanan Aktif
              </div>
              <div className="flex items-center gap-3 p-3 bg-white/5 rounded-2xl border border-white/10">
                <div className="bg-white/90 rounded-xl p-1.5 flex-shrink-0 shadow-md">
                  <img src="/logo_kemenkeu.png" alt="Logo Kemenkeu" className="w-9 h-9 object-contain" onError={e => { e.currentTarget.style.display = 'none'; }} />
                </div>
                <div>
                  <p className="text-white/90 font-bold text-xs">Kementerian Keuangan</p>
                  <p className="text-[#D4AF37]/80 text-[10px] tracking-wider uppercase font-medium">Republik Indonesia</p>
                </div>
              </div>
            </div>
            <div>
              <h4 className="font-black text-white uppercase tracking-widest text-xs mb-5 flex items-center gap-2">
                <span className="h-px flex-1 bg-white/10" /><span>Navigasi</span><span className="h-px flex-1 bg-white/10" />
              </h4>
              <ul className="space-y-3">
                {[{ label: 'Beranda', id: 'beranda' }, { label: 'Kategori Layanan', id: 'beranda' }, { label: 'FAQ', id: 'faq' }, { label: 'Panduan', id: 'panduan' }, { label: 'Info & Statistik', id: 'info' }].map(item => (
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
                <span className="h-px flex-1 bg-white/10" /><span>Tautan Resmi</span><span className="h-px flex-1 bg-white/10" />
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
                <span className="h-px flex-1 bg-white/10" /><span>Kontak</span><span className="h-px flex-1 bg-white/10" />
              </h4>
              <ul className="space-y-3 mb-6">
                <li className="flex items-start gap-3 text-emerald-100/70 text-sm"><MapPin className="w-4 h-4 mt-0.5 flex-shrink-0 text-[#D4AF37]" /><span>Jl. Made Sabara No.6, Korumba, Kendari, Sulawesi Tenggara 93111</span></li>
                <li className="flex items-center gap-3 text-emerald-100/70 text-sm"><Mail className="w-4 h-4 flex-shrink-0 text-[#D4AF37]" /><a href="mailto:kpknl.kendari@kemenkeu.go.id" className="hover:text-[#D4AF37] transition-colors truncate">kpknl.kendari@kemenkeu.go.id</a></li>
              </ul>
              <div className="flex gap-2 flex-wrap">
                {[
                  { href: 'https://www.instagram.com/kpknlkendari', icon: <Instagram className="w-4 h-4" />, label: 'Instagram', color: 'hover:bg-pink-500' },
                  { href: 'https://www.youtube.com/@kpknlkendarimelulo9245', icon: <Youtube className="w-4 h-4" />, label: 'YouTube', color: 'hover:bg-red-500' },
                  { href: 'https://www.djkn.kemenkeu.go.id/kpknl-kendari', icon: <Globe className="w-4 h-4" />, label: 'Website', color: 'hover:bg-blue-500' },
                  { href: 'https://lelang.go.id/', icon: <Scale className="w-4 h-4" />, label: 'Lelang', color: 'hover:bg-amber-500' },
                ].map(sm => (
                  <a key={sm.label} href={sm.href} target="_blank" rel="noopener noreferrer" aria-label={sm.label} title={sm.label}
                    className={`p-2.5 bg-white/10 ${sm.color} rounded-xl transition-all duration-300 hover:scale-110 border border-white/10`}>{sm.icon}</a>
                ))}
              </div>
            </div>
          </div>
          <div className="mb-10 p-5 rounded-2xl bg-gradient-to-r from-[#D4AF37]/10 via-white/5 to-[#D4AF37]/10 border border-[#D4AF37]/20 flex flex-col sm:flex-row items-center justify-center gap-3 text-center">
            <Sparkles className="w-5 h-5 text-[#D4AF37] animate-pulse flex-shrink-0" />
            <p className="text-[#D4AF37] font-black tracking-widest uppercase text-sm">"Melayani dengan Hati, Mengelola dengan Integritas"</p>
            <Sparkles className="w-5 h-5 text-[#D4AF37] animate-pulse flex-shrink-0" />
          </div>
          <div className="h-px w-full bg-gradient-to-r from-transparent via-white/10 to-transparent mb-8" />
          <div className="flex flex-col md:flex-row items-center justify-between gap-4 text-xs text-emerald-100/50">
            <div className="flex items-center gap-2">
              <Building2 className="w-3.5 h-3.5" />
              <span>Direktorat Jenderal Kekayaan Negara (DJKN)</span>
              <span className="hidden sm:inline">•</span>
              <span className="hidden sm:inline">Kementerian Keuangan Republik Indonesia</span>
            </div>
            <div className="flex items-center gap-2">
              <span>Copyright © 2026 KPKNL Kendari.</span>
              <span>Hak Cipta Dilindungi.</span>
            </div>
          </div>
        </div>
      </footer>

      {/* Scroll to top */}
      <button onClick={handleScrollTop} aria-label="Kembali ke atas"
        className={`fixed bottom-8 right-8 p-4 bg-[#D4AF37] text-white rounded-full shadow-2xl hover:bg-[#B5952F] hover:scale-110 active:scale-95 transition-all duration-500 z-50 group ${isScrolled ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-10 pointer-events-none'}`}>
        <ArrowUp className="w-6 h-6 group-hover:-translate-y-1 transition-transform" />
      </button>
    </div>
  );
};

export default App;