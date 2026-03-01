import React, { useState, useEffect, useMemo, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { collection, query, orderBy, onSnapshot } from 'firebase/firestore';
import { db } from './src/firebase';
import { Helmet } from 'react-helmet-async';
import toast, { Toaster } from 'react-hot-toast';
import {
  Search, FileText, Hammer, Key, Trash2, Clock, RefreshCw, Users,
  Info, Phone, BookOpen, Mail, ArrowUp, Timer, HelpCircle, LogIn,
  Menu, X, ChevronLeft, ChevronRight, Eye, Grid, Zap, Flame, Command,
  Instagram, Globe, Filter,
  Youtube, Scale, Gift,
  MapPin, ExternalLink, ChevronDown,
  Sparkles, Building2, BarChart3, Layers, MessageSquare, TrendingUp,
  ArrowRight, Moon, Sun, SlidersHorizontal, Bookmark, Download,
} from 'lucide-react';
import ReactMarkdown from 'react-markdown';
import KnowledgeCard from './src/components/KnowledgeCard';
import FAQItem from './src/components/FAQItem';
import { SkeletonCard } from './src/components/SkeletonLoader';


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

@keyframes sunSpin {
  from { transform: rotate(0deg) scale(1); }
  50%  { transform: rotate(180deg) scale(1.2); }
  to   { transform: rotate(360deg) scale(1); }
}
@keyframes moonBob {
  0%, 100% { transform: rotate(-20deg) scale(1); }
  50%       { transform: rotate(20deg) scale(1.15); }
}
.sun-icon  { transition: transform 0.4s ease; }
.moon-icon { transition: transform 0.4s ease; }
.dark-toggle:hover .sun-icon  { animation: sunSpin 0.7s ease-in-out; }
.dark-toggle:hover .moon-icon { animation: moonBob 0.5s ease-in-out; }

/* ── Section separator ── */
@keyframes dividerPulse {
  0%,100% { opacity: 0.35; transform: scale(1); }
  50%      { opacity: 1;    transform: scale(1.25); }
}
.sep-dot { animation: dividerPulse 2.4s ease-in-out infinite; }

/* ── Ctrl+K pill ── */
@keyframes kbdPulse {
  0%,100% { box-shadow: 0 0 0 0 rgba(212,175,55,0); }
  50%      { box-shadow: 0 0 0 5px rgba(212,175,55,0.12); }
}
.kbd-pill { animation: kbdPulse 3.5s ease-in-out infinite; }

/* ── Card hover glow ── */
@keyframes cardGlow {
  0%,100% { box-shadow: 0 0 0 0 rgba(13,92,53,0); }
  50%      { box-shadow: 0 8px 32px -4px rgba(13,92,53,0.18); }
}
.stat-card-glow:hover { animation: cardGlow 1s ease-out forwards; }

/* ── Ring spin ── */
@keyframes ringPulse {
  0%,100% { transform: scale(1); opacity: 0.5; }
  50%      { transform: scale(1.08); opacity: 0.8; }
}
.ring-pulse { animation: ringPulse 3s ease-in-out infinite; }

/* ── Premium showcase card accent ── */
.showcase-card { transition: all 0.25s cubic-bezier(0.4,0,0.2,1); }
.showcase-card:hover { transform: translateY(-4px); }

@keyframes tabSlide {
  from { opacity: 0; transform: translateY(6px); }
  to   { opacity: 1; transform: translateY(0); }
}
@keyframes statPop {
  0%   { transform: scale(0.92); opacity: 0; }
  60%  { transform: scale(1.04); }
  100% { transform: scale(1); opacity: 1; }
}
.tab-content-enter { animation: tabSlide 0.25s ease-out forwards; }
.stat-pop { animation: statPop 0.4s ease-out forwards; }
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
interface ContentData { id: string; title: string; category: string; description: string; updatedAt?: any; views?: number; likes?: number; dislikes?: number; tags?: string[]; content?: string; }
interface FAQData { id: string; question: string; answer: string; }
interface GuideData { id: string; content: string; }
interface HistoryItem { id: string; title: string; category: string; description: string; visitedAt: number; }

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
/* ─── PWA: TypeScript interface untuk beforeinstallprompt event ──
   Browser tidak menyertakan tipe ini di lib.dom.d.ts standar,
   sehingga kita deklarasikan sendiri di sini.              ── */
interface BeforeInstallPromptEvent extends Event {
  readonly platforms: string[];
  readonly userChoice: Promise<{ outcome: 'accepted' | 'dismissed'; platform: string }>;
  prompt(): Promise<void>;
}

const App: React.FC = () => {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategoryFilter, setSelectedCategoryFilter] = useState('all');
  const [documents, setDocuments] = useState<ContentData[]>([]);
  const [faqs, setFaqs] = useState<FAQData[]>([]);
  const [guides, setGuides] = useState<GuideData[]>([]);
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const setMenuOpen = (val: boolean) => { isMenuOpenRef.current = val; setIsMenuOpen(val); };
  const [isScrolled, setIsScrolled] = useState(false);
  const [isLoaded, setIsLoaded] = useState(false);
  const [isLoadingData, setIsLoadingData] = useState(true);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [showCategoryFilter, setShowCategoryFilter] = useState(false);
  const [recentHistory, setRecentHistory] = useState<HistoryItem[]>(() => {
    try { return JSON.parse(localStorage.getItem('pkn-history') || '[]'); } catch { return []; }
  });
  const [activeDocTab, setActiveDocTab] = useState<'popular' | 'newest' | 'new'>('popular');
  const prevDocIdsRef = useRef<Set<string> | null>(null);
  const isMenuOpenRef = useRef(false);
  const [selectedSuggestionIdx, setSelectedSuggestionIdx] = useState(-1);

  /* ── Dark Mode ── */
  const [isDark, setIsDark] = useState(() => {
    try { return localStorage.getItem('pkn-theme') === 'dark'; } catch { return false; }
  });
  useEffect(() => {
    document.documentElement.classList.toggle('dark', isDark);
    try { localStorage.setItem('pkn-theme', isDark ? 'dark' : 'light'); } catch { }
  }, [isDark]);

  /* ── PWA Install Prompt ──────────────────────────────────────
     installPrompt  : event yang di-capture dari beforeinstallprompt
                      (null = tidak tersedia / sudah di-install)
     pwaInstalled   : true setelah event 'appinstalled' terpicu,
                      mencegah tombol muncul lagi di sesi yang sama   */
  const [installPrompt, setInstallPrompt] = useState<BeforeInstallPromptEvent | null>(null);
  const [pwaInstalled,  setPwaInstalled]  = useState(false);

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
    { id: 'user-siman', title: 'USER SIMAN', description: 'Panduan Layanan Akun dan Role SIMAN V2', icon: <Users className="w-8 h-8" />, color: 'bg-cyan-50  text-cyan-700' },
  ];

  /* ── Firebase ── */
  useEffect(() => {
    setTimeout(() => setIsLoaded(true), 100);
    setIsLoadingData(true);
    const qSop = query(collection(db, 'knowledge-base'), orderBy('updatedAt', 'desc'));
    const qFaq = query(collection(db, 'faqs'), orderBy('createdAt', 'desc'));
    const qGuide = query(collection(db, 'guides'), orderBy('updatedAt', 'desc'));
    const unsubSop = onSnapshot(qSop, snap => {
      const newDocs = snap.docs.map(d => ({ id: d.id, ...d.data() })) as ContentData[];
      /* ── Notifikasi dokumen baru (realtime) ── */
      if (prevDocIdsRef.current !== null) {
        const added = newDocs.filter(d => !prevDocIdsRef.current!.has(d.id));
        if (added.length > 0) {
          toast.success(
            `🔔 ${added.length} dokumen baru ditambahkan!`,
            { duration: 6000, style: { borderRadius: '12px', background: '#0D5C35', color: '#fff', fontWeight: 700 } }
          );
        }
      }
      prevDocIdsRef.current = new Set(newDocs.map(d => d.id));
      setDocuments(newDocs);
      setIsLoadingData(false);
    });
    const unsubFaq = onSnapshot(qFaq, snap => setFaqs(snap.docs.map(d => ({ id: d.id, ...d.data() })) as FAQData[]));
    const unsubGuide = onSnapshot(qGuide, snap => setGuides(snap.docs.map(d => ({ id: d.id, ...d.data() })) as GuideData[]));
    /* Refresh history when user returns to this tab */
    const refreshHistory = () => {
      try { setRecentHistory(JSON.parse(localStorage.getItem('pkn-history') || '[]')); } catch { }
    };
    window.addEventListener('focus', refreshHistory);
    const onScroll = () => {
      setIsScrolled(window.scrollY > 50);
      if (window.scrollY > 50 && isMenuOpenRef.current) setMenuOpen(false);
      setShowSuggestions(false);
    };
    window.addEventListener('scroll', onScroll);
    return () => { unsubSop(); unsubFaq(); unsubGuide(); window.removeEventListener('scroll', onScroll); window.removeEventListener('focus', refreshHistory); };
  }, []); /* listener sekali pasang, ref selalu fresh */

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


  /* ── Helpers ── */
  const handleCategoryClick = (id: string) => navigate(`/category/${id}`);
  const handleDocClick = (id: string) => { setShowSuggestions(false); navigate(`/detail/${id}`); };
  const scrollToSection = (id: string) => { document.getElementById(id)?.scrollIntoView({ behavior: 'smooth' }); setMenuOpen(false); };
  const handleScrollTop = () => window.scrollTo({ top: 0, behavior: 'smooth' });

  const handleSearchAction = () => {
    const q = searchQuery.trim();
    if (!q) return;
    setShowSuggestions(false);
    navigate(`/search?q=${encodeURIComponent(q)}`);
  };

  const handlePopularTag = (tag: string) => {
    navigate(`/search?q=${encodeURIComponent(tag)}`);
  };

  const handleSuggestionClick = (doc: ContentData) => {
    setShowSuggestions(false);
    navigate(`/detail/${doc.id}`);
  };

  const handleClearSearch = () => {
    setSearchQuery('');
    setShowSuggestions(false);
    setSelectedSuggestionIdx(-1);
    searchInputRef.current?.focus();
  };

  /* ── Ctrl+K global shortcut ── */
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key === 'k') {
        e.preventDefault();
        navigate('/search');
      }
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [navigate]);

  /* ── PWA Install: event listeners ────────────────────────────
     beforeinstallprompt : Chrome/Edge menyimpannya agar kita bisa
       trigger kapan saja (tidak perlu langsung saat event muncul).
     appinstalled        : terpicu setelah instalasi selesai —
       bersihkan state supaya tombol hilang.                   ── */
  useEffect(() => {
    const onBeforeInstall = (e: Event) => {
      e.preventDefault();                                   // cegah prompt otomatis
      setInstallPrompt(e as BeforeInstallPromptEvent);      // simpan untuk nanti
    };
    const onAppInstalled = () => {
      setInstallPrompt(null);
      setPwaInstalled(true);
      toast.success('✅ Aplikasi berhasil diinstal!', {
        duration: 4000,
        style: { borderRadius: '12px', background: '#0D5C35', color: '#fff', fontWeight: 700 },
      });
    };
    window.addEventListener('beforeinstallprompt', onBeforeInstall);
    window.addEventListener('appinstalled',        onAppInstalled);
    return () => {
      window.removeEventListener('beforeinstallprompt', onBeforeInstall);
      window.removeEventListener('appinstalled',        onAppInstalled);
    };
  }, []);

  const handleInstall = async () => {
    if (!installPrompt) return;
    await installPrompt.prompt();
    const { outcome } = await installPrompt.userChoice;
    if (outcome === 'accepted') {
      setInstallPrompt(null);
    }
  };

  const formatDate = (ts: any) => {
    if (!ts) return '-';
    return new Date(ts.seconds * 1000).toLocaleString('id-ID', { day: 'numeric', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' });
  };
  const isNewDocument = (ts: any) => {
    if (!ts) return false;
    return Math.ceil(Math.abs(Date.now() - ts.seconds * 1000) / 86400000) <= 7;
  };

  /* ── Showcase dokumen ── */
  const showcaseDocs = useMemo(() => {
    const popular = [...documents].sort((a, b) => (b.views || 0) - (a.views || 0)).slice(0, 6);
    const newest = [...documents].slice(0, 6);
    const newDocs = documents.filter(d => isNewDocument(d.updatedAt)).slice(0, 6);
    return { popular, newest, newDocs };
  }, [documents]);

  const statsData = useMemo(() => ({
    total: documents.length,
    newCount: documents.filter(d => isNewDocument(d.updatedAt)).length,
    cats: new Set(documents.map(d => d.category)).size,
    views: documents.reduce((a, d) => a + (d.views || 0), 0),
  }), [documents]);

  /* ══════════════════════════════════════════════════════════════
     SECTION: HOME
  ══════════════════════════════════════════════════════════════ */
  const SectionHome = () => (
    <div className="space-y-10">
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
            <p className="text-center text-xs text-slate-400 mt-3 italic">
              Tekan <kbd className="px-1.5 py-0.5 bg-white dark:bg-slate-700 border border-slate-200 dark:border-slate-600 rounded text-slate-600 dark:text-slate-300 font-mono">Enter</kbd> untuk buka halaman pencarian lengkap
            </p>
          </div>
        )}

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {!isLoaded
            ? Array.from({ length: 6 }).map((_, i) => <SkeletonCard key={i} />)
            : categories.map((cat, i) => {
              const docCount = documents.filter(d => d.category === cat.id).length;
              return (
                <div key={cat.id} onClick={() => handleCategoryClick(cat.id)}
                  className="cursor-pointer transition-transform hover:scale-105 active:scale-95 h-full"
                  style={{ animationDelay: `${i * 80}ms` }}>
                  <KnowledgeCard title={cat.title} description={cat.description} icon={cat.icon} colorClass={cat.color} docCount={docCount} />
                </div>
              );
            })}
        </div>

        {/* ── Terakhir Dibaca ── */}
        {recentHistory.length > 0 && (
          <div className="mt-10 md:mt-12">
            <div className="flex items-center justify-between mb-4 md:mb-5">
              <div className="flex items-center gap-3">
                <div className="w-1 h-5 bg-[#D4AF37] rounded-full" />
                <h3 className="font-black text-slate-800 dark:text-slate-100 text-base uppercase tracking-wider">Terakhir Dibaca</h3>
                <span className="text-xs font-bold text-slate-500 dark:text-slate-400 bg-slate-100 dark:bg-slate-700 px-2 py-0.5 rounded-full">{recentHistory.length}</span>
              </div>
              <button
                onClick={() => { try { localStorage.removeItem('pkn-history'); setRecentHistory([]); } catch { } }}
                className="text-slate-400 hover:text-rose-500 dark:text-slate-500 dark:hover:text-rose-400 text-xs font-medium transition-colors"
              >Hapus semua</button>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-3">
              {recentHistory.map((item, i) => (
                <div key={item.id} onClick={() => handleDocClick(item.id)}
                  className="group bg-white dark:bg-[#162918] hover:bg-[#EAF2EE] dark:hover:bg-[#1a3021] border border-slate-200 dark:border-slate-700 hover:border-[#0D5C35]/30 dark:hover:border-[#D4AF37]/25 rounded-2xl p-4 cursor-pointer transition-all duration-300 hover:-translate-y-1 shadow-sm hover:shadow-md"
                  style={{ animationDelay: `${i * 60}ms` }}>
                  <span className="inline-block px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider bg-slate-100 dark:bg-slate-700 text-slate-500 dark:text-slate-400 group-hover:bg-[#0D5C35] group-hover:text-white transition-colors mb-2 truncate max-w-full">
                    {item.category.replace(/-/g, ' ')}
                  </span>
                  <h4 className="font-bold text-slate-800 dark:text-slate-100 group-hover:text-[#0D5C35] dark:group-hover:text-emerald-400 transition-colors text-sm line-clamp-2 leading-snug mb-1">
                    {item.title}
                  </h4>
                  <p className="text-slate-400 dark:text-slate-500 text-[10px]">
                    {new Date(item.visitedAt).toLocaleDateString('id-ID', { day: 'numeric', month: 'short' })}
                  </p>
                </div>
              ))}
            </div>
          </div>
        )}
      </section>

      {/* ── Separator ── */}
      <div className="relative flex items-center gap-4 py-2">
        <div className="flex-1 h-px bg-gradient-to-r from-transparent via-slate-200 dark:via-slate-700 to-transparent" />
        <div className="flex items-center gap-2 px-4 py-2 rounded-full bg-white dark:bg-[#162918] border border-slate-200 dark:border-slate-700 shadow-sm">
          <span className="sep-dot w-1.5 h-1.5 rounded-full bg-[#D4AF37]" style={{ animationDelay: '0ms' }} />
          <span className="sep-dot w-1.5 h-1.5 rounded-full bg-[#0D5C35]" style={{ animationDelay: '500ms' }} />
          <span className="sep-dot w-1.5 h-1.5 rounded-full bg-[#D4AF37]" style={{ animationDelay: '1000ms' }} />
        </div>
        <div className="flex-1 h-px bg-gradient-to-r from-transparent via-slate-200 dark:via-slate-700 to-transparent" />
      </div>

      {/* ══════════════════════════════════════════════════════════
           STATS BAR
      ══════════════════════════════════════════════════════════ */}
      <FadeInSection delay="delay-100">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {[
            {
              label: 'Total Dokumen',
              value: statsData.total,
              icon: <FileText className="w-5 h-5" />,
              accent: 'text-[#0D5C35] dark:text-emerald-400',
              bg: 'bg-emerald-50 dark:bg-emerald-900/20',
              border: 'border-emerald-100 dark:border-emerald-800/30',
            },
            {
              label: 'Dokumen Baru',
              value: statsData.newCount,
              icon: <Zap className="w-5 h-5" />,
              accent: 'text-amber-600 dark:text-amber-400',
              bg: 'bg-amber-50 dark:bg-amber-900/20',
              border: 'border-amber-100 dark:border-amber-800/30',
            },
            {
              label: 'Kategori Aktif',
              value: statsData.cats,
              icon: <Layers className="w-5 h-5" />,
              accent: 'text-blue-600 dark:text-blue-400',
              bg: 'bg-blue-50 dark:bg-blue-900/20',
              border: 'border-blue-100 dark:border-blue-800/30',
            },
            {
              label: 'Total Dibaca',
              value: statsData.views.toLocaleString('id-ID'),
              icon: <Eye className="w-5 h-5" />,
              accent: 'text-purple-600 dark:text-purple-400',
              bg: 'bg-purple-50 dark:bg-purple-900/20',
              border: 'border-purple-100 dark:border-purple-800/30',
            },
          ].map((s, i) => (
            <div key={i}
              className={`relative overflow-hidden bg-white dark:bg-[#162918] rounded-2xl border ${s.border} p-5 flex items-center gap-4 shadow-sm hover:shadow-xl transition-all duration-300 hover:-translate-y-1.5 group stat-pop`}
              style={{ animationDelay: `${i * 90}ms` }}>
              {/* Decorative ring */}
              <div className={`absolute -top-10 -right-10 w-28 h-28 rounded-full ${s.bg} opacity-60 ring-pulse pointer-events-none`} style={{ animationDelay: `${i * 0.5}s` }} />
              <div className={`absolute -bottom-6 -left-6 w-16 h-16 rounded-full ${s.bg} opacity-30 pointer-events-none`} />
              {/* Ghost number */}
              <div className={`absolute right-3 bottom-1 text-6xl font-black ${s.accent} opacity-[0.07] leading-none select-none pointer-events-none`}>{i === 0 ? '' : i === 1 ? '' : i === 2 ? '' : ''}</div>
              <div className={`${s.bg} ${s.accent} p-3 rounded-xl flex-shrink-0 group-hover:scale-110 transition-transform duration-300 shadow-sm relative z-10`}>{s.icon}</div>
              <div className="min-w-0 relative z-10">
                <p className="text-xs font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider truncate">{s.label}</p>
                <p className={`text-2xl font-black ${s.accent} leading-tight tracking-tight`}>{isLoadingData ? '—' : s.value}</p>
              </div>
            </div>
          ))}
        </div>
      </FadeInSection>

      {/* ── Separator ── */}
      <div className="relative flex items-center gap-4">
        <div className="flex-1 h-px bg-gradient-to-r from-transparent via-slate-200 dark:via-slate-700 to-transparent" />
        <span className="text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-[0.2em] px-3 whitespace-nowrap">
          Temukan Dokumen
        </span>
        <div className="flex-1 h-px bg-gradient-to-r from-transparent via-slate-200 dark:via-slate-700 to-transparent" />
      </div>

      {/* ══════════════════════════════════════════════════════════
           DOCUMENT SHOWCASE — Terpopuler / Terbaru / Baru
      ══════════════════════════════════════════════════════════ */}
      <FadeInSection delay="delay-200">
        <div className="bg-white dark:bg-[#162918] rounded-3xl shadow-sm border border-slate-200 dark:border-slate-700 overflow-hidden">
          {/* Header + Tabs */}
          <div className="px-6 pt-6 pb-0 border-b border-slate-100 dark:border-slate-700">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-4">
              <div>
                <h3 className="font-black text-slate-800 dark:text-slate-100 text-lg tracking-tight">Temukan Dokumen</h3>
                <p className="text-slate-400 dark:text-slate-500 text-xs mt-0.5">Pilih dokumen berdasarkan popularitas atau waktu update</p>
              </div>
              <button
                onClick={() => navigate('/search')}
                className="flex-shrink-0 flex items-center gap-1.5 text-xs font-bold text-[#0D5C35] dark:text-emerald-400 hover:underline transition-colors">
                Lihat semua <ArrowRight className="w-3.5 h-3.5" />
              </button>
            </div>
            {/* Tab pills */}
            <div className="flex gap-1 -mb-px">
              {([
                { key: 'popular', label: 'Terpopuler', icon: <Flame className="w-3.5 h-3.5" /> },
                { key: 'newest', label: 'Terbaru', icon: <Clock className="w-3.5 h-3.5" /> },
                { key: 'new', label: 'Baru Masuk', icon: <Zap className="w-3.5 h-3.5" /> },
              ] as const).map(tab => (
                <button key={tab.key} onClick={() => setActiveDocTab(tab.key)}
                  className={`flex items-center gap-1.5 px-4 py-2.5 rounded-t-xl text-xs font-bold border-b-2 transition-all ${activeDocTab === tab.key
                    ? 'border-[#0D5C35] text-[#0D5C35] dark:text-emerald-400 dark:border-emerald-400 bg-emerald-50/50 dark:bg-emerald-900/10'
                    : 'border-transparent text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-800/40'
                    }`}>
                  {tab.icon} {tab.label}
                  {tab.key === 'new' && statsData.newCount > 0 && (
                    <span className="ml-0.5 bg-amber-400 text-amber-900 text-[9px] font-black px-1.5 py-0.5 rounded-full">{statsData.newCount}</span>
                  )}
                </button>
              ))}
            </div>
          </div>

          {/* Cards grid */}
          <div className="p-6">
            {isLoadingData ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                {Array.from({ length: 6 }).map((_, i) => (
                  <div key={i} className="rounded-2xl border border-slate-100 dark:border-slate-700 p-5 animate-pulse bg-slate-50 dark:bg-[#1a3021]">
                    <div className="h-3 w-16 bg-slate-200 dark:bg-slate-600 rounded mb-3" />
                    <div className="h-4 w-full bg-slate-200 dark:bg-slate-600 rounded mb-2" />
                    <div className="h-4 w-3/4 bg-slate-200 dark:bg-slate-600 rounded mb-4" />
                    <div className="h-3 w-20 bg-slate-100 dark:bg-slate-700 rounded" />
                  </div>
                ))}
              </div>
            ) : (
              (() => {
                const list = activeDocTab === 'popular'
                  ? showcaseDocs.popular
                  : activeDocTab === 'newest'
                    ? showcaseDocs.newest
                    : showcaseDocs.newDocs;

                if (list.length === 0) {
                  return (
                    <div className="py-16 text-center">
                      <div className="inline-flex items-center justify-center w-14 h-14 rounded-2xl bg-slate-50 dark:bg-slate-800 mb-3">
                        <FileText className="w-7 h-7 text-slate-300 dark:text-slate-600" />
                      </div>
                      <p className="text-slate-400 dark:text-slate-500 font-medium text-sm">Belum ada dokumen di tab ini.</p>
                    </div>
                  );
                }

                return (
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                    {list.map((doc, i) => {
                      const catColors: Record<string, string> = {
                        'psp': 'bg-emerald-100 text-emerald-800 dark:bg-emerald-900/30 dark:text-emerald-300',
                        'penjualan': 'bg-amber-100   text-amber-800   dark:bg-amber-900/30   dark:text-amber-300',
                        'sewa': 'bg-blue-100    text-blue-800    dark:bg-blue-900/30    dark:text-blue-300',
                        'penghapusan': 'bg-rose-100    text-rose-800    dark:bg-rose-900/30    dark:text-rose-300',
                        'pinjam-pakai': 'bg-indigo-100  text-indigo-800  dark:bg-indigo-900/30  dark:text-indigo-300',
                        'penggunaan-sementara': 'bg-purple-100  text-purple-800  dark:bg-purple-900/30  dark:text-purple-300',
                        'alih-status': 'bg-teal-100    text-teal-800    dark:bg-teal-900/30    dark:text-teal-300',
                        'hibah': 'bg-orange-100  text-orange-800  dark:bg-orange-900/30  dark:text-orange-300',
                        'user-siman': 'bg-cyan-100   text-cyan-800   dark:bg-cyan-900/30   dark:text-cyan-300',
                      };
                      const catCls = catColors[doc.category] ?? 'bg-slate-100 text-slate-700 dark:bg-slate-700 dark:text-slate-300';
                      return (
                        <div key={doc.id}
                          onClick={() => handleDocClick(doc.id)}
                          style={{ animationDelay: `${i * 50}ms` }}
                          className="showcase-card group relative bg-white dark:bg-[#0f1f16] hover:bg-white dark:hover:bg-[#162918] border border-slate-100 dark:border-slate-700/60 hover:border-[#0D5C35]/20 dark:hover:border-emerald-700/30 rounded-2xl p-5 cursor-pointer overflow-hidden hover:shadow-xl">
                          {/* Left accent bar */}
                          <div className="absolute left-0 top-4 bottom-4 w-0.5 rounded-full bg-gradient-to-b from-[#D4AF37] via-[#0D5C35] to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
                          {/* Rank badge for popular */}
                          {activeDocTab === 'popular' && i < 3 && (
                            <div className={`absolute top-3 right-3 w-6 h-6 rounded-full flex items-center justify-center text-[10px] font-black ${i === 0 ? 'bg-[#D4AF37] text-slate-900' : i === 1 ? 'bg-slate-300 dark:bg-slate-600 text-slate-700 dark:text-slate-200' : 'bg-orange-200 dark:bg-orange-900/40 text-orange-800 dark:text-orange-300'
                              }`}>#{i + 1}</div>
                          )}
                          {/* New badge */}
                          {isNewDocument(doc.updatedAt) && activeDocTab !== 'new' && (
                            <span className="absolute top-3 right-3 px-1.5 py-0.5 bg-amber-400 text-amber-900 text-[9px] font-black rounded-full animate-pulse">NEW</span>
                          )}
                          {/* Category */}
                          <span className={`inline-block px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider mb-3 ${catCls}`}>
                            {doc.category.replace(/-/g, ' ')}
                          </span>
                          {/* Title */}
                          <h4 className="font-bold text-slate-800 dark:text-slate-100 group-hover:text-[#0D5C35] dark:group-hover:text-emerald-400 transition-colors text-sm leading-snug line-clamp-2 mb-3">
                            {doc.title}
                          </h4>
                          {/* Description */}
                          <p className="text-xs text-slate-400 dark:text-slate-500 line-clamp-2 leading-relaxed mb-4">{doc.description}</p>
                          {/* Footer stats */}
                          <div className="flex items-center justify-between text-[10px] font-bold text-slate-400 dark:text-slate-500">
                            <span className="flex items-center gap-1"><Eye className="w-3 h-3" />{doc.views || 0} views</span>
                            <span className="flex items-center gap-1 text-[#0D5C35] dark:text-emerald-400 opacity-0 group-hover:opacity-100 transition-all duration-200 translate-x-1 group-hover:translate-x-0">
                              Baca <ArrowRight className="w-3 h-3" />
                            </span>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                );
              })()
            )}
          </div>
        </div>
      </FadeInSection>

      {/* ══════════════════════════════════════════════════════════
           CTA BANNER — Jelajahi semua dokumen
      ══════════════════════════════════════════════════════════ */}
      <FadeInSection delay="delay-300">
        <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-[#0D5C35] via-[#0A492A] to-[#062B18] p-8 md:p-10 shadow-xl">
          {/* Decorative blobs */}
          <div className="absolute -top-10 -right-10 w-48 h-48 rounded-full bg-white/5 pointer-events-none" />
          <div className="absolute -bottom-8 -left-8 w-36 h-36 rounded-full bg-[#D4AF37]/10 pointer-events-none" />
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-64 h-64 rounded-full bg-emerald-500/5 blur-3xl pointer-events-none" />

          <div className="relative z-10 flex flex-col md:flex-row items-center justify-between gap-6 md:gap-8">
            <div className="text-center md:text-left">
              <div className="inline-flex items-center gap-2 px-3 py-1 bg-white/10 border border-white/15 rounded-full text-xs font-bold text-white/70 uppercase tracking-wider mb-3">
                <Sparkles className="w-3.5 h-3.5 text-[#D4AF37]" /> Knowledge Base Lengkap
              </div>
              <h3 className="text-2xl md:text-3xl font-black text-white mb-2 tracking-tight leading-tight">
                {documents.length} Dokumen Siap<br className="hidden md:block" /> Diakses Kapan Saja
              </h3>
              <p className="text-white/60 text-sm max-w-md leading-relaxed">
                Cari, filter, dan telusuri seluruh SOP, regulasi, dan panduan layanan BMN dengan pencarian pintar.
              </p>
            </div>
            <div className="flex flex-col sm:flex-row gap-3 flex-shrink-0">
              <button
                onClick={() => navigate('/search')}
                className="group flex items-center justify-center gap-2.5 px-8 py-4 bg-[#D4AF37] hover:bg-[#B5952F] text-slate-900 rounded-2xl font-black text-sm shadow-lg shadow-[#D4AF37]/30 hover:shadow-[#D4AF37]/50 hover:-translate-y-0.5 transition-all duration-300">
                <Search className="w-4 h-4 group-hover:scale-110 transition-transform" />
                Jelajahi Semua Dokumen
              </button>
              <button
                onClick={() => navigate('/bookmarks')}
                className="flex items-center justify-center gap-2.5 px-6 py-4 bg-white/10 hover:bg-white/20 border border-white/20 text-white rounded-2xl font-bold text-sm transition-all hover:-translate-y-0.5">
                <Bookmark className="w-4 h-4" />
                Dokumen Favorit
              </button>
            </div>
          </div>
        </div>
      </FadeInSection>
    </div>
  );

  /* ══════════════════════════════════════════════════════════════
     SECTION: FAQ
  ══════════════════════════════════════════════════════════════ */
  const SectionFAQ = () => (
    <div className="max-w-6xl mx-auto">
      <div className="text-center mb-10">
        <div>
          <h2 className="flex items-center justify-center gap-3 sm:gap-4 text-2xl sm:text-3xl font-black text-slate-900 dark:text-slate-100 tracking-tight mb-2 group cursor-default">
            <div className="shrink-0 relative flex items-center justify-center w-10 h-10 sm:w-12 sm:h-12 rounded-xl bg-gradient-to-br from-amber-100 to-orange-50 dark:from-amber-900/40 dark:to-orange-900/20 border border-amber-200 dark:border-amber-700/50 shadow-sm group-hover:shadow-md group-hover:-translate-y-1 transition-all duration-300">
              <HelpCircle className="w-5 h-5 sm:w-7 sm:h-7 text-amber-500 dark:text-amber-400 group-hover:rotate-12 transition-transform duration-300" />
              <span className="absolute -top-1 -right-1 flex h-2.5 w-2.5 sm:h-3.5 sm:w-3.5">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-amber-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2.5 w-2.5 sm:h-3.5 sm:w-3.5 bg-amber-500 border-2 border-white dark:border-[#0d1a12]"></span>
              </span>
            </div>
            <span className="text-left leading-tight">
              Pertanyaan yang Sering Diajukan
            </span>
          </h2>
          <p className="text-slate-500 dark:text-slate-400 max-w-lg mx-auto text-sm sm:text-base px-4 mt-3">
            Temukan jawaban atas pertanyaan umum seputar layanan BMN KPKNL Kendari
          </p>
        </div>
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
                <a href="https://www.djkn.kemenkeu.go.id/kpknl-kendari/kontak" target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1.5 text-xs font-bold text-amber-700 dark:text-amber-400 hover:text-amber-800 dark:hover:text-amber-300 transition-colors">
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
      <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4 mb-8 group cursor-default">
        <div className="flex items-center gap-4">
          <div className="shrink-0 relative flex items-center justify-center w-10 h-10 sm:w-12 sm:h-12 rounded-xl bg-gradient-to-br from-emerald-100 to-green-50 dark:from-emerald-900/40 dark:to-green-900/20 border border-emerald-200 dark:border-emerald-700/50 shadow-sm group-hover:shadow-md group-hover:-translate-y-1 transition-all duration-300">
            <BookOpen className="w-5 h-5 sm:w-7 sm:h-7 text-[#0D5C35] dark:text-emerald-400 group-hover:scale-110 group-hover:-rotate-12 transition-transform duration-300" />
            <span className="absolute -top-1 -right-1 flex h-2.5 w-2.5 sm:h-3.5 sm:w-3.5">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2.5 w-2.5 sm:h-3.5 sm:w-3.5 bg-emerald-500 border-2 border-white dark:border-[#0d1a12]"></span>
            </span>
          </div>
          <div>
            <h2 className="text-2xl font-black text-slate-900 dark:text-slate-100 tracking-tight group-hover:text-[#0D5C35] dark:group-hover:text-emerald-400 transition-colors duration-300">
              Panduan Pengguna
            </h2>
            <p className="text-slate-500 dark:text-slate-400 text-sm">
              Petunjuk penggunaan layanan KPKNL Kendari
            </p>
          </div>
        </div>
        {guides.length > 0 && (
          <span className="shrink-0 inline-flex items-center gap-1.5 px-3 py-1.5 bg-emerald-50 dark:bg-emerald-900/20 text-[#0D5C35] dark:text-emerald-400 rounded-full text-xs font-bold border border-emerald-200 dark:border-emerald-700/30">
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
      { label: 'Total Kunjungan', value: documents.reduce((a, d) => a + (d.views || 0), 0).toLocaleString('id-ID'), icon: <Eye className="w-6 h-6" />, color: 'from-blue-500 to-indigo-600' },
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
              <a href="https://www.djkn.kemenkeu.go.id/kpknl-kendari/kontak" target="_blank" rel="noopener noreferrer"
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
      <Toaster position="top-right" toastOptions={{ style: { borderRadius: '12px', fontWeight: 600 } }} />

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
              <button onClick={() => navigate('/search')}
                className="flex items-center gap-1.5 text-white/80 hover:text-[#D4AF37] transition-colors text-sm font-semibold uppercase tracking-wider relative group"
                title="Pencarian (Ctrl+K)">
                <Search className="w-4 h-4" />
                {/* Ctrl+K tooltip */}
                <span className="absolute -bottom-8 left-1/2 -translate-x-1/2 whitespace-nowrap text-[10px] font-bold bg-slate-800 text-white/80 px-2 py-0.5 rounded-md opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none">Ctrl+K</span>
              </button>
              <button onClick={() => navigate('/bookmarks')}
                className="flex items-center gap-1.5 text-white/80 hover:text-[#D4AF37] transition-colors text-sm font-semibold uppercase tracking-wider"
                title="Dokumen Favorit">
                <Bookmark className="w-4 h-4" />
              </button>

              {/* PWA Install — hanya muncul kalau browser mendukung & belum di-install */}
              {installPrompt && !pwaInstalled && (
                <button
                  onClick={handleInstall}
                  title="Install Aplikasi"
                  className="relative flex items-center gap-1.5 text-white/80 hover:text-[#D4AF37] transition-colors text-sm font-semibold uppercase tracking-wider group"
                >
                  <Download className="w-4 h-4" />
                  {/* Pulse dot — penanda visual bahwa ada aksi tersedia */}
                  <span className="absolute -top-0.5 -right-0.5 w-2 h-2 rounded-full bg-[#D4AF37] animate-pulse" />
                </button>
              )}

              {/* Dark mode toggle */}
              <button
                onClick={() => setIsDark(p => !p)}
                className="dark-toggle relative p-2.5 rounded-full bg-white/10 hover:bg-white/25 text-white border border-white/20 hover:border-white/40 transition-all hover:scale-110 hover:shadow-lg hover:shadow-white/10"
                aria-label={isDark ? 'Mode Terang' : 'Mode Gelap'}
                title={isDark ? 'Aktifkan Mode Terang' : 'Aktifkan Mode Gelap'}
              >
                {isDark
                  ? <Sun className="sun-icon w-4 h-4 text-[#D4AF37]" />
                  : <Moon className="moon-icon w-4 h-4 text-white/90" />
                }
              </button>
              <button onClick={() => navigate('/login')}
                className="group flex items-center gap-2 px-4 py-2 bg-[#D4AF37] hover:bg-[#B5952F] rounded-full text-xs font-black text-slate-900 shadow-md shadow-[#D4AF37]/30 hover:shadow-[#D4AF37]/50 hover:scale-105 transition-all duration-300">
                <LogIn className="w-3.5 h-3.5 group-hover:translate-x-0.5 transition-transform" />
                <span>Admin</span>
              </button>
            </div>

            {/* Mobile: dark toggle + hamburger */}
            <div className="md:hidden flex items-center gap-2">
              <button
                onClick={() => setIsDark(p => !p)}
                className="dark-toggle p-2.5 rounded-full bg-white/10 hover:bg-white/25 text-white border border-white/20 transition-all"
                aria-label="Toggle dark mode"
              >
                {isDark
                  ? <Sun className="sun-icon w-4 h-4 text-[#D4AF37]" />
                  : <Moon className="moon-icon w-4 h-4" />
                }
              </button>
              <button onClick={() => setMenuOpen(!isMenuOpen)} className="text-white p-2 hover:bg-white/10 rounded-lg">
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
              <div className="mt-2 pt-2 border-t border-white/10">
                <button onClick={() => { setMenuOpen(false); navigate('/search'); }}
                  className="w-full text-left px-4 py-3 rounded-xl hover:bg-white/10 text-white/90 font-semibold flex items-center gap-3 transition-all">
                  <Search className="w-4 h-4 opacity-70" /> Pencarian
                </button>
                <button onClick={() => { setMenuOpen(false); navigate('/bookmarks'); }}
                  className="w-full text-left px-4 py-3 rounded-xl hover:bg-white/10 text-[#D4AF37] font-semibold flex items-center gap-3 transition-all">
                  <Bookmark className="w-4 h-4 opacity-70" /> Dokumen Favorit
                </button>

                {/* PWA Install di mobile menu */}
                {installPrompt && !pwaInstalled && (
                  <button
                    onClick={() => { setMenuOpen(false); handleInstall(); }}
                    className="w-full text-left px-4 py-3 rounded-xl hover:bg-white/10 text-white/90 font-semibold flex items-center gap-3 transition-all"
                  >
                    <div className="relative">
                      <Download className="w-4 h-4 opacity-70" />
                      <span className="absolute -top-0.5 -right-0.5 w-1.5 h-1.5 rounded-full bg-[#D4AF37] animate-pulse" />
                    </div>
                    Install Aplikasi
                  </button>
                )}
              </div>
              <div className="mt-1 pt-2 border-t border-white/10">
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
          <div className="flex flex-wrap items-center justify-center gap-3 mb-6">
            <div className="inline-flex items-center gap-2 px-4 py-2 bg-white/10 backdrop-blur-sm border border-white/20 rounded-full text-white/80 text-xs font-semibold uppercase tracking-wider">
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
              Sistem Informasi Terpadu — KPKNL Kendari
            </div>
            {!isLoadingData && (
              <div className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-[#D4AF37]/20 border border-[#D4AF37]/30 rounded-full text-[#D4AF37] text-xs font-bold">
                <Eye className="w-3 h-3" />
                {statsData.views.toLocaleString('id-ID')} total kunjungan
              </div>
            )}
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
                  onKeyDown={e => {
                    if (e.key === 'Enter') {
                      if (selectedSuggestionIdx >= 0 && liveSuggestions[selectedSuggestionIdx]) {
                        handleSuggestionClick(liveSuggestions[selectedSuggestionIdx]);
                        setSelectedSuggestionIdx(-1);
                      } else {
                        handleSearchAction();
                      }
                    }
                    if (e.key === 'Escape') { setShowSuggestions(false); setSelectedSuggestionIdx(-1); }
                    if (e.key === 'ArrowDown') { e.preventDefault(); setSelectedSuggestionIdx(i => Math.min(i + 1, liveSuggestions.length - 1)); }
                    if (e.key === 'ArrowUp') { e.preventDefault(); setSelectedSuggestionIdx(i => Math.max(i - 1, -1)); }
                  }}
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
                    <button key={doc.id} onMouseDown={() => { handleSuggestionClick(doc); setSelectedSuggestionIdx(-1); }}
                      className={`suggestion-item w-full text-left px-4 py-3 transition-colors border-b border-slate-50 last:border-0 flex items-start gap-3 group ${selectedSuggestionIdx === i ? 'bg-emerald-50 dark:bg-emerald-900/20' : 'hover:bg-emerald-50 dark:hover:bg-emerald-900/10'}`}
                      style={{ animationDelay: `${i * 40}ms` }}>
                      <div className={`p-1.5 rounded-lg flex-shrink-0 transition-colors mt-0.5 ${selectedSuggestionIdx === i ? 'bg-[#0D5C35] text-white' : 'bg-slate-100 group-hover:bg-[#0D5C35]'}`}>
                        <Search className={`w-3 h-3 transition-colors ${selectedSuggestionIdx === i ? 'text-white' : 'text-slate-400 group-hover:text-white'}`} />
                      </div>
                      <div className="min-w-0">
                        <div className={`font-semibold text-sm line-clamp-1 transition-colors ${selectedSuggestionIdx === i ? 'text-[#0D5C35] dark:text-emerald-400' : 'text-slate-800 dark:text-slate-200 group-hover:text-[#0D5C35]'}`}>{doc.title}</div>
                        <div className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mt-0.5">{doc.category.replace(/-/g, ' ')}</div>
                      </div>
                      <ArrowRight className={`w-4 h-4 flex-shrink-0 ml-auto mt-1 transition-colors ${selectedSuggestionIdx === i ? 'text-[#0D5C35]' : 'text-slate-300 group-hover:text-[#0D5C35]'}`} />
                    </button>
                  ))}
                  <div className="px-4 py-2.5 bg-slate-50 border-t border-slate-100 text-center">
                    <span className="text-xs text-slate-400">Tekan <kbd className="px-1.5 py-0.5 bg-white border border-slate-200 rounded font-mono text-slate-600">Enter</kbd> untuk buka halaman pencarian</span>
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
              {['User SIMAN', 'Sewa BMN', 'Penghapusan', 'Hibah'].map(tag => (
                <button key={tag} onClick={() => handlePopularTag(tag)}
                  className="bg-white/10 hover:bg-white/25 text-white text-xs px-3 py-1 rounded-full transition-all border border-white/10 hover:border-white/30 hover:scale-105"
                  title="Klik untuk mengisi kotak pencarian">{tag}</button>
              ))}
            </div>

            {/* Ctrl+K hint */}
            {/* <div className="mt-3 flex justify-center">
              <button onClick={() => navigate('/search')}
                className="kbd-pill inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-white/8 border border-white/15 text-white/45 hover:text-white/80 hover:bg-white/15 transition-all text-[11px] font-medium">
                <Command className="w-3 h-3" />
                <span>K</span>
                <span className="text-white/25 mx-0.5">·</span>
                <span>Buka pencarian lengkap</span>
              </button>
            </div> */}

            <div className="mt-10">
              <a href="https://www.djkn.kemenkeu.go.id/kpknl-kendari/kontak" target="_blank" rel="noopener noreferrer"
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
      <main className="flex-grow max-w-7xl mx-auto px-4 -mt-16 relative z-10 w-full pb-24">
        <div id="beranda" className="mb-20"><SectionHome /></div>

        {/* ── Premium section divider ── */}
        <FadeInSection>
          <div className="relative flex items-center gap-6 mb-16">
            <div className="flex-1 h-px bg-gradient-to-r from-transparent via-slate-300 dark:via-slate-600 to-transparent" />
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-amber-400 to-amber-600 flex items-center justify-center shadow-lg shadow-amber-200 dark:shadow-amber-900/30">
                <HelpCircle className="w-4 h-4 text-white" />
              </div>
              <span className="font-black text-slate-700 dark:text-slate-200 uppercase tracking-[0.15em] text-xs">FAQ & Bantuan</span>
            </div>
            <div className="flex-1 h-px bg-gradient-to-r from-transparent via-slate-300 dark:via-slate-600 to-transparent" />
          </div>
        </FadeInSection>

        <FadeInSection>
          <div id="faq" className="scroll-mt-24 mb-20"><SectionFAQ /></div>
        </FadeInSection>

        {/* ── Premium section divider ── */}
        <FadeInSection>
          <div className="relative flex items-center gap-6 mb-16">
            <div className="flex-1 h-px bg-gradient-to-r from-transparent via-slate-300 dark:via-slate-600 to-transparent" />
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-[#0D5C35] to-[#0A492A] flex items-center justify-center shadow-lg shadow-emerald-200 dark:shadow-emerald-900/30">
                <BookOpen className="w-4 h-4 text-white" />
              </div>
              <span className="font-black text-slate-700 dark:text-slate-200 uppercase tracking-[0.15em] text-xs">Panduan Pengguna</span>
            </div>
            <div className="flex-1 h-px bg-gradient-to-r from-transparent via-slate-300 dark:via-slate-600 to-transparent" />
          </div>
        </FadeInSection>

        <FadeInSection delay="delay-100">
          <div id="panduan" className="scroll-mt-24 mb-20"><SectionPanduan /></div>
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
                {[{ label: 'Website DJKN', href: 'https://www.djkn.kemenkeu.go.id/kpknl-kendari' }, { label: 'Portal Lelang', href: 'https://lelang.go.id/' }, { label: 'SIMAK BMN', href: 'https://simak-bmn.kemenkeu.go.id' }, { label: 'Kemenkeu RI', href: 'https://www.kemenkeu.go.id' }].map(link => (
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