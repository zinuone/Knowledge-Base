// File: src/pages/DetailPage.tsx
import React, { useEffect, useState, useRef, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  doc, getDoc, updateDoc, increment,
  collection, query, where, limit, getDocs
} from 'firebase/firestore';
import { db } from '../firebase';
import { Helmet } from 'react-helmet-async';
import {
  ArrowLeft, Calendar, FileText, Image as ImageIcon, Download,
  Eye, ThumbsUp, ThumbsDown, Share2, Check, Home, ChevronRight,
  Maximize2, X, PlayCircle, Sparkles, ArrowRight, Bookmark,
  BookmarkCheck, Printer, BookOpen, ArrowUp, Clock, Copy,
  MessageCircle, Tag, User,
} from 'lucide-react';
import ReactMarkdown from 'react-markdown';
import toast, { Toaster } from 'react-hot-toast';
import { SkeletonDetail } from '../components/SkeletonLoader';

/* ─── CSS Premium ───────────────────────────────────────────────── */
const PAGE_CSS = `
@keyframes fadeInUp {
  from { opacity: 0; transform: translateY(20px); }
  to   { opacity: 1; transform: translateY(0); }
}
@keyframes progressGlow {
  0%,100% { box-shadow: 0 0 6px #D4AF37, 0 0 12px #D4AF37aa; }
  50%     { box-shadow: 0 0 14px #D4AF37, 0 0 28px #D4AF37; }
}
@keyframes bookmarkPop {
  0%   { transform: scale(1); }
  50%  { transform: scale(1.3); }
  100% { transform: scale(1); }
}
@keyframes tooltipIn {
  from { opacity: 0; transform: translateX(-50%) translateY(6px); }
  to   { opacity: 1; transform: translateX(-50%) translateY(0); }
}
@keyframes shimmerRelated {
  from { transform: translateX(-150%) skewX(-12deg); }
  to   { transform: translateX(250%)  skewX(-12deg); }
}
@keyframes accentBarIn {
  from { transform: scaleX(0); transform-origin: left; }
  to   { transform: scaleX(1); }
}
@keyframes goldLineDraw {
  from { width: 0; opacity: 0; }
  to   { width: 80px; opacity: 1; }
}
@keyframes articleHeaderOrb {
  0%,100% { transform: translate(0,0) scale(1); }
  50%     { transform: translate(-20px,15px) scale(1.06); }
}
@keyframes sectionPulse {
  0%, 100% { opacity: 0.7; }
  50%       { opacity: 1; }
}
@keyframes aiCardGlow {
  0%, 100% { box-shadow: 0 0 0 0 rgba(13,92,53,0); }
  50%       { box-shadow: 0 0 20px 2px rgba(13,92,53,0.08); }
}
@keyframes spinOnce {
  from { transform: rotate(0deg); }
  to   { transform: rotate(360deg); }
}

.detail-fade-in  { animation: fadeInUp 0.5s ease-out forwards; }
.progress-glow   { animation: progressGlow 2.5s ease-in-out infinite; }
.bookmark-pop    { animation: bookmarkPop 0.35s ease-out; }
.copy-tooltip    { animation: tooltipIn 0.15s ease-out forwards; }

.detail-orb-1 { animation: articleHeaderOrb 14s ease-in-out infinite; }
.detail-orb-2 { animation: articleHeaderOrb 18s ease-in-out infinite reverse; }

.ai-card-active { animation: aiCardGlow 3s ease-in-out infinite; }

/* Related card shimmer */
.related-card-inner {
  position: relative;
  overflow: hidden;
}
.related-card-inner::after {
  content: '';
  position: absolute;
  top: 0; left: -80%;
  width: 60%;
  height: 100%;
  background: linear-gradient(90deg, transparent, rgba(255,255,255,0.06), transparent);
  transform: skewX(-12deg);
  pointer-events: none;
  opacity: 0;
}
.related-card-inner:hover::after {
  opacity: 1;
  animation: shimmerRelated 0.65s ease-out;
}

/* Accent bar for related cards */
.related-accent {
  animation: accentBarIn 0.3s ease-out 0.1s both;
}

/* Gold accent line under title */
.gold-line-draw {
  animation: goldLineDraw 0.8s ease-out 0.5s both;
}

.reading-mode .prose p,
.reading-mode .prose li {
  font-size: 1.1rem !important;
  line-height: 2.05 !important;
}
.reading-mode .prose-content-wrap {
  max-width: 68ch;
  margin-left: auto;
  margin-right: auto;
}

@media print {
  @page { margin: 18mm 15mm; size: A4; }
  * { -webkit-print-color-adjust: exact; print-color-adjust: exact; }
  body { background: white !important; color: #1e293b !important; font-family: 'Plus Jakarta Sans', Arial, sans-serif !important; }
  .no-print { display: none !important; }
  header, nav, footer { display: none !important; }
  .fixed, .sticky { position: static !important; }
  #print-article { box-shadow: none !important; border: none !important; border-radius: 0 !important; padding: 0 !important; }
  #print-article .prose p { font-size: 10.5pt !important; line-height: 1.75 !important; }
  #print-header { display: flex !important; flex-direction: column; border-bottom: 2.5px solid #0D5C35; padding-bottom: 10px; margin-bottom: 14px; }
  #print-header-inner { display: flex; align-items: center; justify-content: space-between; }
  .print-title { font-size: 18pt !important; font-weight: 900 !important; color: #0D5C35 !important; line-height: 1.3 !important; }
  .print-meta  { font-size: 8pt !important; color: #64748b !important; margin-top: 6px; }
  .progress-glow { display: none !important; }
  a { color: inherit !important; text-decoration: none !important; }
  img { max-width: 100% !important; page-break-inside: avoid; }
  h2, h3 { page-break-after: avoid; }
  .prose-content-wrap { max-width: 100% !important; }
}
`;

/* ─── TIPE DATA ─────────────────────────────────────────────────── */
interface ContentData {
  id: string;
  title: string;
  category: string;
  description: string;
  content: string;
  updatedAt: any;
  imageBase64?: string;
  pdfUrl?: string;
  videoUrl?: string;
  views?: number;
  likes?: number;
  dislikes?: number;
  tags?: string[];
  updatedBy?: string;
}

/* ─── HELPER: Warna kategori badge ────────────────────────────── */
const getCategoryStyle = (cat: string) => {
  const map: Record<string, string> = {
    'psp': 'bg-emerald-100 text-emerald-800 border-emerald-200 dark:bg-emerald-900/30 dark:text-emerald-300 dark:border-emerald-700/30',
    'penjualan': 'bg-amber-100   text-amber-800   border-amber-200   dark:bg-amber-900/30   dark:text-amber-300   dark:border-amber-700/30',
    'sewa': 'bg-blue-100    text-blue-800    border-blue-200    dark:bg-blue-900/30    dark:text-blue-300    dark:border-blue-700/30',
    'penghapusan': 'bg-rose-100    text-rose-800    border-rose-200    dark:bg-rose-900/30    dark:text-rose-300    dark:border-rose-700/30',
    'pinjam-pakai': 'bg-indigo-100  text-indigo-800  border-indigo-200  dark:bg-indigo-900/30  dark:text-indigo-300  dark:border-indigo-700/30',
    'penggunaan-sementara': 'bg-purple-100  text-purple-800  border-purple-200  dark:bg-purple-900/30  dark:text-purple-300  dark:border-purple-700/30',
    'alih-status': 'bg-teal-100    text-teal-800    border-teal-200    dark:bg-teal-900/30    dark:text-teal-300    dark:border-teal-700/30',
    'hibah': 'bg-orange-100  text-orange-800  border-orange-200  dark:bg-orange-900/30  dark:text-orange-300  dark:border-orange-700/30',
    'user-siman': 'bg-cyan-100    text-cyan-800    border-cyan-200    dark:bg-cyan-900/30    dark:text-cyan-300    dark:border-cyan-700/30',
  };
  return map[cat] ?? 'bg-slate-100 text-slate-800 border-slate-200 dark:bg-slate-700 dark:text-slate-300 dark:border-slate-600';
};

/* ─── HELPER: Accent gradient per kategori ────────────────────── */
const getCategoryAccent = (cat: string) => {
  const map: Record<string, string> = {
    'psp': 'from-emerald-400 to-teal-500',
    'penjualan': 'from-amber-400   to-orange-500',
    'sewa': 'from-blue-400    to-indigo-500',
    'penghapusan': 'from-rose-400    to-pink-500',
    'pinjam-pakai': 'from-indigo-400  to-purple-500',
    'penggunaan-sementara': 'from-purple-400  to-violet-500',
    'alih-status': 'from-teal-400    to-cyan-500',
    'hibah': 'from-orange-400  to-red-400',
    'user-siman': 'from-cyan-400    to-blue-500',
  };
  return map[cat] ?? 'from-emerald-400 to-teal-500';
};

/* ─── HELPER: Auto-embed URL ───────────────────────────────────── */
const getEmbedUrl = (url: string): string | null => {
  if (!url) return null;
  try {
    if (url.includes('youtube.com') || url.includes('youtu.be')) {
      const m = url.match(/^.*(youtu.be\/|v\/|u\/\w\/|embed\/|watch\?v=|&v=)([^#&?]*).*/);
      const vidId = m && m[2].length === 11 ? m[2] : null;
      if (vidId) return 'https://www.youtube.com/embed/' + vidId;
    }
    if (url.includes('drive.google.com/file/d/')) {
      const m = url.match(/\/d\/(.+?)\//);
      if (m) return 'https://drive.google.com/file/d/' + m[1] + '/preview';
    }
  } catch { }
  return url;
};

/* ══════════════════════════════════════════════════════════════
   KOMPONEN UTAMA
══════════════════════════════════════════════════════════════ */
const DetailPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();

  const [data, setData] = useState<ContentData | null>(null);
  const [relatedDocs, setRelatedDocs] = useState<ContentData[]>([]);
  const [loading, setLoading] = useState(true);
  const [hasVoted, setHasVoted] = useState(false);
  const [voteType, setVoteType] = useState<'like' | 'dislike' | null>(null);
  const [isCopied, setIsCopied] = useState(false);
  const [isLightboxOpen, setIsLightboxOpen] = useState(false);
  const [scrollProgress, setScrollProgress] = useState(0);
  const [isScrolled, setIsScrolled] = useState(false);
  const [isBookmarked, setIsBookmarked] = useState(false);
  const [bookmarkAnim, setBookmarkAnim] = useState(false);
  const [isReadingMode, setIsReadingMode] = useState(false);
  const [copyTooltip, setCopyTooltip] = useState<{ x: number; y: number } | null>(null);

  /* ── Reading Progress: debounce timer ref ── */
  const scrollSaveTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  /* ── AI Ringkasan ── */
  const [aiSummary, setAiSummary] = useState('');
  const [isLoadingAI, setIsLoadingAI] = useState(false);
  const [aiError, setAiError] = useState('');
  const [showAI, setShowAI] = useState(false);

  /* ── Dark Mode ── */
  useEffect(() => {
    try {
      const isDark = localStorage.getItem('pkn-theme') === 'dark';
      document.documentElement.classList.toggle('dark', isDark);
    } catch { }
  }, []);

  /* ── Load bookmark state ── */
  useEffect(() => {
    if (!id) return;
    try {
      const bookmarks: string[] = JSON.parse(localStorage.getItem('pkn-bookmarks') || '[]');
      setIsBookmarked(bookmarks.includes(id));
    } catch { }
  }, [id]);

  /* ── Reset & restore vote state per dokumen ── */
  useEffect(() => {
    if (!id) return;
    setHasVoted(false);
    setVoteType(null);
    try {
      const saved = localStorage.getItem('pkn-vote-' + id);
      if (saved === 'like' || saved === 'dislike') {
        setHasVoted(true);
        setVoteType(saved);
      }
    } catch { }
  }, [id]);

  /* ── Scroll progress + Reading Progress save ──
     Posisi scroll disimpan ke localStorage dengan key pkn-scroll-{id}.
     Debounce 600ms mencegah localStorage write berlebihan.             */
  useEffect(() => {
    const onScroll = () => {
      const scrollTop = document.documentElement.scrollTop;
      const total = document.documentElement.scrollHeight - document.documentElement.clientHeight;
      setScrollProgress(total > 0 ? scrollTop / total : 0);
      setIsScrolled(scrollTop > 120);

      if (id) {
        if (scrollSaveTimerRef.current) clearTimeout(scrollSaveTimerRef.current);
        scrollSaveTimerRef.current = setTimeout(() => {
          try { localStorage.setItem('pkn-scroll-' + id, String(scrollTop)); } catch { }
        }, 600);
      }
    };
    window.addEventListener('scroll', onScroll);
    return () => {
      window.removeEventListener('scroll', onScroll);
      if (scrollSaveTimerRef.current) clearTimeout(scrollSaveTimerRef.current);
    };
  }, [id]);

  /* ── Close copy tooltip on outside click ── */
  useEffect(() => {
    const close = () => setCopyTooltip(null);
    document.addEventListener('mousedown', close);
    return () => document.removeEventListener('mousedown', close);
  }, []);

  /* ── Fetch data ── */
  useEffect(() => {
    const fetchData = async () => {
      if (!id) return;
      setLoading(true);
      try {
        const docRef = doc(db, 'knowledge-base', id);
        const docSnap = await getDoc(docRef);
        if (docSnap.exists()) {
          const mainData = { id: docSnap.id, ...docSnap.data() } as ContentData;
          setData(mainData);

          /* Simpan ke riwayat terakhir dibaca */
          try {
            const hist = JSON.parse(localStorage.getItem('pkn-history') || '[]');
            const entry = {
              id: mainData.id,
              title: mainData.title,
              category: mainData.category,
              description: mainData.description,
              visitedAt: Date.now(),
            };
            const updated = [entry, ...hist.filter((h: any) => h.id !== mainData.id)].slice(0, 5);
            localStorage.setItem('pkn-history', JSON.stringify(updated));
          } catch { }

          /* Hitung view (sekali per session) */
          const sessionKey = 'viewed_' + id;
          if (!sessionStorage.getItem(sessionKey)) {
            await updateDoc(docRef, { views: increment(1) });
            sessionStorage.setItem(sessionKey, 'true');
          }

          /* Dokumen terkait */
          const rq = query(
            collection(db, 'knowledge-base'),
            where('category', '==', mainData.category),
            limit(4)
          );
          const rSnap = await getDocs(rq);
          setRelatedDocs(
            rSnap.docs
              .map(d => ({ id: d.id, ...d.data() } as ContentData))
              .filter(item => item.id !== id)
              .slice(0, 3)
          );
        }
      } catch (e) { console.error(e); }
      finally {
        setLoading(false);
        /* Restore posisi baca, atau scroll ke atas kalau belum ada */
        try {
          const saved = localStorage.getItem('pkn-scroll-' + id);
          if (saved && parseInt(saved) > 120) {
            requestAnimationFrame(() => {
              setTimeout(() => {
                window.scrollTo({ top: parseInt(saved), behavior: 'instant' as ScrollBehavior });
              }, 120);
            });
          } else {
            window.scrollTo(0, 0);
          }
        } catch { window.scrollTo(0, 0); }
      }
    };
    fetchData();
  }, [id]);

  /* ── Voting ── */
  const handleVote = async (type: 'like' | 'dislike') => {
    if (!id || hasVoted) return;
    const toastId = toast.loading('Mengirim masukan...');
    try {
      await updateDoc(doc(db, 'knowledge-base', id), {
        [type === 'like' ? 'likes' : 'dislikes']: increment(1),
      });
      setHasVoted(true);
      setVoteType(type);
      try { localStorage.setItem('pkn-vote-' + id, type); } catch { }
      toast.success('Terima kasih atas masukan Anda!', { id: toastId });
    } catch {
      toast.error('Gagal mengirim masukan.', { id: toastId });
    }
  };

  /* ── AI Ringkasan via Gemini ─────────────────────────────────────
     SETUP: tambahkan ke .env.local dan Vercel Environment Variables:
       VITE_GEMINI_API_KEY=your_key_from_aistudio.google.com
     Model: Gemini 1.5 Flash (cepat, gratis tier tersedia).          */
  const handleAISummary = useCallback(async () => {
    if (isLoadingAI) return;

    /* Toggle: kalau sudah ada ringkasan, sembunyikan/tampilkan */
    if (aiSummary && !aiError) {
      setShowAI(prev => !prev);
      return;
    }

    const apiKey = import.meta.env.VITE_GEMINI_API_KEY;
    if (!apiKey || apiKey === 'PLACEHOLDER' || apiKey.trim() === '') {
      setAiError('API key belum dikonfigurasi. Tambahkan VITE_GEMINI_API_KEY ke .env.local');
      setShowAI(true);
      return;
    }

    setIsLoadingAI(true);
    setAiError('');
    setShowAI(true);

    try {
      const contentSnippet = (data?.content || '').slice(0, 3500);
      const prompt =
        'Kamu adalah asisten ahli pengelolaan Barang Milik Negara (BMN) di KPKNL Kendari.\n\n' +
        'Ringkas dokumen SOP berikut dalam 3 poin utama menggunakan bahasa Indonesia yang jelas, singkat, dan profesional.\n\n' +
        'Format jawaban WAJIB:\n' +
        '• [Poin 1 — ringkasan poin utama pertama]\n' +
        '• [Poin 2 — ringkasan poin utama kedua]\n' +
        '• [Poin 3 — ringkasan poin utama ketiga]\n\n' +
        'Judul dokumen: ' + (data?.title || '') + '\n' +
        'Isi dokumen:\n' + contentSnippet;

      const response = await fetch(
        'https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=' + apiKey,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            contents: [{ parts: [{ text: prompt }] }],
            generationConfig: { temperature: 0.3, maxOutputTokens: 512 },
          }),
        }
      );

      if (!response.ok) {
        const errData = await response.json().catch(() => ({}));
        throw new Error((errData as any)?.error?.message || 'HTTP ' + response.status);
      }

      const result = await response.json();
      const text: string = result?.candidates?.[0]?.content?.parts?.[0]?.text || '';
      if (!text) throw new Error('Respons AI kosong.');
      setAiSummary(text.trim());
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Gagal menghubungi Gemini API.';
      setAiError(msg);
    } finally {
      setIsLoadingAI(false);
    }
  }, [data, isLoadingAI, aiSummary, aiError]);

  /* ── Share ── */
  const handleShare = () => {
    navigator.clipboard.writeText(window.location.href);
    setIsCopied(true);
    toast.success('Link berhasil disalin!', {
      icon: '🔗',
      style: { borderRadius: '12px', background: '#1e293b', color: '#fff', fontWeight: '600' },
    });
    setTimeout(() => setIsCopied(false), 2500);
  };

  /* ── Share via WhatsApp ── */
  const handleShareWA = () => {
    if (!data) return;
    const text =
      '📄 *' + data.title + '*\n\n' +
      data.description + '\n\n' +
      '🔗 Baca selengkapnya:\n' +
      window.location.href;
    window.open('https://wa.me/?text=' + encodeURIComponent(text), '_blank');
  };

  /* ── Bookmark ── */
  const handleBookmark = () => {
    if (!id || !data) return;
    try {
      const bookmarks: string[] = JSON.parse(localStorage.getItem('pkn-bookmarks') || '[]');
      const newState = !isBookmarked;
      const updated = newState ? [...bookmarks, id] : bookmarks.filter(b => b !== id);
      localStorage.setItem('pkn-bookmarks', JSON.stringify(updated));
      setIsBookmarked(newState);
      setBookmarkAnim(true);
      setTimeout(() => setBookmarkAnim(false), 400);
      toast.success(newState ? 'Dokumen disimpan ke Favorit!' : 'Dihapus dari Favorit', {
        icon: newState ? '🔖' : '🗑️',
        style: { borderRadius: '12px', background: '#1e293b', color: '#fff', fontWeight: '600' },
      });
    } catch { }
  };

  /* ── Print ── */
  const handlePrint = () => { window.print(); };

  /* ── Copy selected text ── */
  const handleCopySelection = () => {
    const text = window.getSelection()?.toString() || '';
    if (text) {
      navigator.clipboard.writeText(text);
      toast.success('Teks disalin!', {
        icon: '📋',
        style: { borderRadius: '12px', background: '#1e293b', color: '#fff', fontWeight: '600' },
      });
      setCopyTooltip(null);
      window.getSelection()?.removeAllRanges();
    }
  };

  const handleTextSelect = (e: React.MouseEvent) => {
    setTimeout(() => {
      const sel = window.getSelection();
      if (sel && sel.toString().trim().length > 5) {
        setCopyTooltip({ x: e.clientX, y: e.clientY });
      } else {
        setCopyTooltip(null);
      }
    }, 10);
  };

  /* ══════════════ LOADING STATE ════════════════════════════════ */
  if (loading) {
    return (
      <div className="min-h-screen bg-[#F4F7F5] dark:bg-[#0d1a12] font-sans pb-20 transition-colors duration-300">
        <style dangerouslySetInnerHTML={{ __html: PAGE_CSS }} />
        {/* Mini header skeleton */}
        <div className="bg-gradient-to-r from-[#0D5C35] to-[#0A492A] text-white shadow-lg">
          <div className="max-w-4xl mx-auto px-4 sm:px-5 py-4 flex items-center justify-between gap-3">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-white/10 rounded-full">
                <ArrowLeft className="w-5 h-5 text-white/50" />
              </div>
              <div className="h-4 w-36 bg-white/15 rounded-lg animate-pulse" />
            </div>
            <div className="flex items-center gap-2">
              <div className="h-8 w-20 bg-white/10 rounded-xl animate-pulse" />
              <div className="h-8 w-20 bg-white/10 rounded-xl animate-pulse" />
              <div className="h-8 w-20 bg-white/10 rounded-xl animate-pulse" />
            </div>
          </div>
        </div>
        <main className="max-w-4xl mx-auto mt-8 px-4">
          <SkeletonDetail />
        </main>
      </div>
    );
  }

  /* ══════════════ NOT FOUND STATE ══════════════════════════════ */
  if (!data) {
    return (
      <div className="min-h-screen bg-[#F4F7F5] dark:bg-[#0d1a12] font-sans flex flex-col items-center justify-center gap-6 p-8 text-center transition-colors duration-300">
        <style dangerouslySetInnerHTML={{ __html: PAGE_CSS }} />
        {/* Animated rings */}
        <div className="relative inline-flex items-center justify-center">
          <span className="absolute w-40 h-40 rounded-full border border-rose-200 dark:border-rose-800/30 animate-ping" style={{ animationDuration: '2.5s' }} />
          <span className="absolute w-28 h-28 rounded-full border border-rose-200/60 dark:border-rose-800/20" />
          <div className="relative w-24 h-24 bg-rose-50 dark:bg-rose-900/20 rounded-3xl flex items-center justify-center shadow-lg border border-rose-100 dark:border-rose-800/30">
            <FileText className="w-12 h-12 text-rose-300 dark:text-rose-500" />
          </div>
        </div>
        <h2 className="text-2xl font-black text-slate-800 dark:text-slate-100">Data Tidak Ditemukan</h2>
        <span className="block w-12 h-0.5 bg-rose-300/50 rounded" />
        <p className="text-slate-500 dark:text-slate-400 max-w-sm text-sm leading-relaxed">
          Dokumen yang Anda cari tidak tersedia atau telah dihapus dari sistem.
        </p>
        <button
          onClick={() => navigate('/')}
          className="px-8 py-3 bg-gradient-to-br from-[#0D5C35] to-[#0A492A] text-white rounded-xl font-bold shadow-lg shadow-emerald-900/20 hover:-translate-y-0.5 transition-all"
        >
          Kembali ke Beranda
        </button>
      </div>
    );
  }

  /* ── Derived values ── */
  const dateStr = data.updatedAt
    ? new Date(data.updatedAt.seconds * 1000).toLocaleDateString('id-ID', {
      day: 'numeric', month: 'long', year: 'numeric',
    })
    : 'Baru saja';
  const categoryStyle = getCategoryStyle(data.category);
  const categoryAccent = getCategoryAccent(data.category);
  const isNewDoc = data.updatedAt
    ? (Date.now() - data.updatedAt.seconds * 1000) <= 7 * 24 * 60 * 60 * 1000
    : false;
  const readingTime = Math.max(1, Math.ceil((data.content || '').split(/\s+/).length / 200));

  /* ═══════════════════════ RENDER ════════════════════════════════ */
  return (
    <div className="min-h-screen bg-[#F4F7F5] dark:bg-[#0d1a12] pb-24 font-sans relative transition-colors duration-300">

      {/* SEO */}
      <Helmet>
        <title>{data.title} | Knowledge Base KPKNL Kendari</title>
        <meta name="description" content={data.description} />
        <meta property="og:title" content={data.title + ' — KPKNL Kendari'} />
        <meta property="og:description" content={data.description} />
        <meta property="og:type" content="article" />
        <meta property="og:locale" content="id_ID" />
        <meta name="robots" content="index, follow" />
        <meta name="keywords" content={'KPKNL Kendari, ' + data.category.replace(/-/g, ' ') + ', BMN, ' + data.title} />
      </Helmet>
      <style dangerouslySetInnerHTML={{ __html: PAGE_CSS }} />
      <Toaster position="top-center" toastOptions={{ style: { borderRadius: '12px', fontWeight: 600 } }} />

      {/* ── Copy Tooltip ── */}
      {copyTooltip && (
        <div
          className="copy-tooltip fixed z-[100] bg-slate-800 dark:bg-slate-700 text-white text-xs font-bold px-3 py-1.5 rounded-xl shadow-2xl flex items-center gap-1.5 cursor-pointer hover:bg-[#0D5C35] transition-colors border border-white/10 select-none"
          style={{
            left: Math.min(copyTooltip.x, window.innerWidth - 130) + 'px',
            top: (copyTooltip.y - 48) + 'px',
            transform: 'translateX(-50%)',
          }}
          onMouseDown={e => e.preventDefault()}
          onClick={handleCopySelection}
        >
          <Copy className="w-3 h-3" /> Salin teks
          <span className="absolute left-1/2 -bottom-1.5 -translate-x-1/2 w-0 h-0 border-l-4 border-r-4 border-t-4 border-l-transparent border-r-transparent border-t-slate-800 dark:border-t-slate-700" />
        </div>
      )}

      {/* ── Scroll to Top ── */}
      <button
        onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
        aria-label="Kembali ke atas"
        className={
          'no-print fixed bottom-7 right-7 z-50 p-3.5 bg-[#D4AF37] hover:bg-[#B5952F] text-slate-900 rounded-full shadow-2xl shadow-amber-400/30 hover:scale-110 hover:shadow-amber-400/40 active:scale-95 transition-all duration-300 group ' +
          (isScrolled ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-10 pointer-events-none')
        }
      >
        <ArrowUp className="w-5 h-5 group-hover:-translate-y-0.5 transition-transform" />
      </button>

      {/* ── Progress Bar ── */}
      <div
        className="fixed top-0 left-0 h-1 bg-gradient-to-r from-[#D4AF37] via-[#F0D060] to-[#D4AF37] z-[60] transition-all duration-100 ease-out progress-glow"
        style={{ width: (scrollProgress * 100) + '%' }}
      />

      {/* ── Lightbox ── */}
      {isLightboxOpen && data.imageBase64 && (
        <div
          className="fixed inset-0 z-[70] bg-black/92 flex items-center justify-center p-4 backdrop-blur-md animate-in fade-in duration-300"
          onClick={() => setIsLightboxOpen(false)}
        >
          <button className="absolute top-5 right-5 text-white/70 hover:text-white bg-white/10 hover:bg-white/20 p-3 rounded-full transition-all hover:scale-110 border border-white/10">
            <X className="w-5 h-5" />
          </button>
          <img
            src={data.imageBase64}
            alt="Full Preview"
            className="max-w-full max-h-[88vh] object-contain rounded-2xl shadow-2xl ring-1 ring-white/10"
            onClick={e => e.stopPropagation()}
          />
          <p className="absolute bottom-6 text-white/40 text-xs font-medium tracking-wide">
            Klik di luar gambar untuk menutup
          </p>
        </div>
      )}

      {/* ══════ STICKY HEADER ═══════════════════════════════════════ */}
      <header className="bg-gradient-to-r from-[#0D5C35] via-[#0A492A] to-[#0A492A] text-white shadow-lg shadow-emerald-900/20 sticky top-0 z-50 border-b border-white/[0.06]">
        <div className="max-w-4xl mx-auto px-4 sm:px-5 py-3.5 flex items-center justify-between gap-2 md:gap-3">

          {/* Kiri: back + judul scroll */}
          <div className="flex items-center gap-2 md:gap-3 min-w-0">
            <button
              onClick={() => { if (window.history.length > 2) { navigate(-1); } else { navigate('/'); } }}
              className="flex-shrink-0 p-2 hover:bg-white/20 rounded-full transition-all group"
              aria-label="Kembali"
            >
              <ArrowLeft className="w-5 h-5 group-hover:-translate-x-0.5 transition-transform" />
            </button>

            {/* Judul muncul saat di-scroll */}
            <div className={'transition-all duration-300 min-w-0 overflow-hidden ' + (isScrolled ? 'opacity-100 max-w-[180px] sm:max-w-xs' : 'opacity-0 max-w-0')}>
              <p className="font-bold text-sm truncate text-white/90 leading-tight">{data.title}</p>
            </div>

            {/* Label statik saat belum scroll */}
            <div className={'transition-all duration-300 ' + (isScrolled ? 'opacity-0 hidden' : 'opacity-100')}>
              <p className="text-sm font-bold text-white/80 hidden sm:block">Knowledge Base</p>
            </div>
          </div>

          {/* Kanan: action buttons */}
          <div className="flex items-center gap-1.5 md:gap-2 flex-shrink-0">
            {/* Share link */}
            <button
              onClick={handleShare}
              className="flex items-center gap-1.5 bg-white/10 hover:bg-white/20 px-3 md:px-3.5 py-2 rounded-xl transition-all text-xs font-bold border border-white/10 hover:border-white/20"
            >
              {isCopied
                ? <><Check className="w-3.5 h-3.5 text-emerald-300" /><span className="hidden sm:inline text-emerald-300">Tersalin!</span></>
                : <><Share2 className="w-3.5 h-3.5" /><span className="hidden sm:inline">Bagikan</span></>
              }
            </button>

            {/* WhatsApp */}
            <button
              onClick={handleShareWA}
              className="flex items-center gap-1.5 bg-[#25D366]/15 hover:bg-[#25D366]/25 border border-[#25D366]/25 hover:border-[#25D366]/40 px-3 md:px-3.5 py-2 rounded-xl transition-all text-xs font-bold text-white"
              aria-label="Bagikan via WhatsApp"
            >
              <MessageCircle className="w-3.5 h-3.5 text-[#25D366]" />
              <span className="hidden md:inline text-[#25D366]">WA</span>
            </button>

            {/* Bookmark */}
            <button
              onClick={handleBookmark}
              aria-label={isBookmarked ? 'Hapus Bookmark' : 'Simpan Bookmark'}
              className={
                'no-print flex items-center gap-1.5 px-3 md:px-3.5 py-2 rounded-xl transition-all text-xs font-bold border ' +
                (isBookmarked
                  ? 'bg-[#D4AF37] border-[#D4AF37]/70 text-slate-900 shadow-lg shadow-[#D4AF37]/25 '
                  : 'bg-white/10 hover:bg-white/20 border-white/10 hover:border-white/20 ') +
                (bookmarkAnim ? 'bookmark-pop' : '')
              }
            >
              {isBookmarked
                ? <><BookmarkCheck className="w-3.5 h-3.5" /><span className="hidden sm:inline">Tersimpan</span></>
                : <><Bookmark className="w-3.5 h-3.5" /><span className="hidden sm:inline">Simpan</span></>
              }
            </button>

            {/* Print */}
            <button
              onClick={handlePrint}
              aria-label="Cetak / Ekspor PDF"
              className="no-print hidden sm:flex items-center gap-1.5 bg-white/10 hover:bg-white/20 px-3 md:px-3.5 py-2 rounded-xl transition-all text-xs font-bold border border-white/10 hover:border-white/20"
            >
              <Printer className="w-3.5 h-3.5" /><span className="hidden md:inline">Cetak</span>
            </button>
          </div>
        </div>
      </header>

      {/* ══════ MAIN ════════════════════════════════════════════════ */}
      <main className="max-w-4xl mx-auto mt-6 md:mt-8 px-4 detail-fade-in">

        {/* Print-only header */}
        <div id="print-header" className="hidden print:flex flex-col mb-6">
          <div id="print-header-inner">
            <div>
              <p className="text-[8pt] text-slate-400 uppercase tracking-widest font-bold mb-0.5">
                Kantor Pelayanan Kekayaan Negara dan Lelang Kendari
              </p>
              <p className="text-[8pt] text-slate-400">
                Direktorat Jenderal Kekayaan Negara — Kementerian Keuangan RI
              </p>
            </div>
            <p className="text-[8pt] text-slate-400 text-right">
              {new Date().toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' })}
            </p>
          </div>
          <p className="print-meta mt-2">
            Kategori: {data.category.replace(/-/g, ' ').toUpperCase()} &nbsp;|&nbsp; {data.views || 0} Views &nbsp;|&nbsp; {readingTime} menit baca
          </p>
        </div>

        {/* Breadcrumb */}
        <nav
          aria-label="Breadcrumb"
          className="flex items-center text-xs text-slate-500 dark:text-slate-400 mb-5 md:mb-6 gap-1.5 overflow-x-auto whitespace-nowrap pb-1"
        >
          <button
            onClick={() => navigate('/')}
            className="flex items-center gap-1 hover:text-[#0D5C35] dark:hover:text-emerald-400 transition-colors flex-shrink-0"
          >
            <Home className="w-3.5 h-3.5" /> Beranda
          </button>
          <ChevronRight className="w-3 h-3 text-slate-300 dark:text-slate-600 flex-shrink-0" />
          <button
            onClick={() => navigate('/category/' + data.category)}
            className="hover:text-[#0D5C35] dark:hover:text-emerald-400 font-bold uppercase transition-colors flex-shrink-0"
          >
            {data.category.replace(/-/g, ' ')}
          </button>
          <ChevronRight className="w-3 h-3 text-slate-300 dark:text-slate-600 flex-shrink-0" />
          <span className="text-slate-700 dark:text-slate-300 font-medium truncate max-w-[140px] sm:max-w-[220px] md:max-w-xs">
            {data.title}
          </span>
        </nav>

        {/* ══════ ARTIKEL CARD ══════════════════════════════════════ */}
        <div className="bg-white dark:bg-[#162918] rounded-3xl shadow-lg shadow-slate-200/60 dark:shadow-slate-900/60 border border-slate-100 dark:border-slate-700/80 overflow-hidden">

          {/* Kategori-specific accent bar di paling atas */}
          <div className={`h-1 w-full bg-gradient-to-r ${categoryAccent}`} />

          {/* ── Header Artikel ── */}
          <div className="relative p-6 sm:p-8 md:px-12 md:pt-10 md:pb-9 border-b border-slate-100 dark:border-slate-700/80 overflow-hidden">
            {/* Ambient background gradient */}
            <div className="absolute inset-0 bg-gradient-to-br from-white via-slate-50/80 to-[#EAF2EE]/50 dark:from-[#162918] dark:via-[#1a3021] dark:to-[#162918]" />

            {/* Decorative orbs */}
            <div className="absolute -right-12 -top-12 pointer-events-none overflow-hidden w-48 h-48">
              <div className="detail-orb-1 w-full h-full rounded-full bg-[#0D5C35]/5 dark:bg-emerald-500/8 blur-2xl" />
            </div>
            <div className="absolute -left-8 -bottom-8 pointer-events-none overflow-hidden w-36 h-36">
              <div className="detail-orb-2 w-full h-full rounded-full bg-[#D4AF37]/6 dark:bg-amber-400/8 blur-2xl" />
            </div>
            {/* Ghost icon corner */}
            <div className="absolute -right-6 -top-6 opacity-[0.035] pointer-events-none select-none">
              <FileText className="w-64 h-64 text-[#0D5C35]" />
            </div>

            <div className="relative z-10">
              {/* ── Badge row ── */}
              <div className="flex flex-wrap items-center gap-2 mb-5 md:mb-6">
                {/* Kategori */}
                <span className={'inline-flex items-center px-3 sm:px-3.5 py-1.5 rounded-full text-xs font-bold uppercase tracking-widest border shadow-sm ' + categoryStyle}>
                  <span className="w-1.5 h-1.5 rounded-full bg-current mr-2 opacity-60" />
                  {data.category.replace(/-/g, ' ')}
                </span>

                {/* "Baru" badge */}
                {isNewDoc && (
                  <span className="inline-flex items-center gap-1 px-3 py-1.5 rounded-full text-xs font-black uppercase tracking-widest bg-amber-400 text-amber-900 border border-amber-500 shadow-sm">
                    ✨ Baru
                  </span>
                )}

                {/* Tanggal */}
                <span className="text-slate-400 dark:text-slate-500 text-xs font-medium bg-white dark:bg-slate-700/70 px-3 py-1.5 rounded-full border border-slate-100 dark:border-slate-600 shadow-sm flex items-center gap-1.5">
                  <Calendar className="w-3 h-3" /> {dateStr}
                </span>

                {/* Author */}
                {data.updatedBy && (
                  <span className="text-[#0D5C35] dark:text-emerald-400 text-xs font-bold bg-[#EAF2EE] dark:bg-emerald-900/20 px-3 py-1.5 rounded-full border border-[#0D5C35]/15 dark:border-emerald-700/30 shadow-sm flex items-center gap-1.5">
                    <User className="w-3 h-3" /> {data.updatedBy.split('@')[0]}
                  </span>
                )}

                {/* Views */}
                <span className="text-slate-400 dark:text-slate-500 text-xs font-medium bg-white dark:bg-slate-700/70 px-3 py-1.5 rounded-full border border-slate-100 dark:border-slate-600 shadow-sm flex items-center gap-1.5">
                  <Eye className="w-3 h-3" /> {data.views || 0} Views
                </span>

                {/* Reading time */}
                <span className="text-slate-400 dark:text-slate-500 text-xs font-medium bg-white dark:bg-slate-700/70 px-3 py-1.5 rounded-full border border-slate-100 dark:border-slate-600 shadow-sm flex items-center gap-1.5">
                  <Clock className="w-3 h-3" /> {readingTime} mnt baca
                </span>

                {/* Mode baca toggle */}
                <button
                  onClick={() => setIsReadingMode(m => !m)}
                  className={
                    'no-print inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-bold border shadow-sm transition-all ' +
                    (isReadingMode
                      ? 'bg-[#0D5C35] text-white border-[#0D5C35] shadow-emerald-200/50 dark:shadow-emerald-900/30'
                      : 'bg-white dark:bg-slate-700/70 text-slate-500 dark:text-slate-300 border-slate-100 dark:border-slate-600 hover:border-[#0D5C35]/40 hover:text-[#0D5C35]')
                  }
                  title={isReadingMode ? 'Nonaktifkan Mode Baca' : 'Aktifkan Mode Baca'}
                >
                  <BookOpen className="w-3 h-3" />
                  {isReadingMode ? 'Mode Baca ✓' : 'Mode Baca'}
                </button>
              </div>

              {/* Judul utama */}
              <h1 className="text-2xl sm:text-3xl md:text-4xl font-black text-slate-800 dark:text-slate-100 mb-3 md:mb-4 leading-tight tracking-tight">
                {data.title}
              </h1>

              {/* Gold separator */}
              <span
                className="block h-[3px] rounded-full mb-4 gold-line-draw"
                style={{ background: 'linear-gradient(90deg,#D4AF37,#F0D060,#D4AF37)', width: '80px' }}
              />

              {/* Deskripsi */}
              <p className="text-base md:text-lg text-slate-500 dark:text-slate-400 font-medium max-w-2xl leading-relaxed">
                {data.description}
              </p>

              {/* Tags */}
              {(data.tags || []).length > 0 && (
                <div className="flex flex-wrap gap-2 mt-5">
                  {(data.tags || []).map(tag => (
                    <button
                      key={tag}
                      onClick={() => navigate('/search?q=' + encodeURIComponent(tag))}
                      className="no-print inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-bold bg-slate-100 dark:bg-slate-700/60 text-slate-600 dark:text-slate-300 border border-slate-200 dark:border-slate-600 hover:bg-[#0D5C35] hover:text-white hover:border-[#0D5C35] transition-all"
                    >
                      <Tag className="w-3 h-3" />{tag}
                    </button>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* ── Body Artikel ── */}
          <div
            id="print-article"
            className={'px-6 sm:px-8 md:px-10 pt-7 pb-6 sm:pb-8 md:pb-10 ' + (isReadingMode ? 'reading-mode' : '')}
          >
            {/* Konten Markdown */}
            <div className={'prose-content-wrap ' + (isReadingMode ? 'max-w-[68ch] mx-auto' : '')}>
              <div
                className="prose prose-slate dark:prose-invert max-w-none mb-10 md:mb-12
                  prose-headings:scroll-mt-24
                  prose-h2:text-xl prose-h2:font-extrabold prose-h2:text-slate-800 dark:prose-h2:text-slate-100
                  prose-h2:mt-8 prose-h2:mb-4 prose-h2:pb-3
                  prose-h2:border-b-2 prose-h2:border-slate-100 dark:prose-h2:border-slate-700
                  prose-h3:text-base prose-h3:font-bold prose-h3:text-[#0D5C35] dark:prose-h3:text-emerald-400
                  prose-h3:mt-6 prose-h3:mb-3
                  prose-p:text-slate-600 dark:prose-p:text-slate-300 prose-p:leading-[1.85] prose-p:mb-4 prose-p:text-sm
                  prose-li:marker:text-[#D4AF37] prose-li:marker:font-extrabold prose-li:pl-1
                  prose-li:text-slate-600 dark:prose-li:text-slate-300 prose-li:text-sm
                  prose-strong:text-slate-900 dark:prose-strong:text-slate-100 prose-strong:font-bold
                  prose-strong:bg-[#EAF2EE] dark:prose-strong:bg-[#0D5C35]/20
                  prose-strong:text-[#0D5C35] dark:prose-strong:text-emerald-400
                  prose-strong:px-1.5 prose-strong:py-0.5 prose-strong:rounded-md
                  prose-blockquote:border-l-4 prose-blockquote:border-[#D4AF37]
                  prose-blockquote:bg-amber-50/60 dark:prose-blockquote:bg-amber-900/10
                  prose-blockquote:px-4 prose-blockquote:py-3 prose-blockquote:rounded-r-xl
                  prose-blockquote:text-slate-600 dark:prose-blockquote:text-slate-400 prose-blockquote:not-italic"
                onMouseUp={handleTextSelect}
              >
                <ReactMarkdown
                  components={{ li: ({ node, ...props }) => <li className="pl-2 my-1" {...props} /> }}
                >
                  {data.content}
                </ReactMarkdown>
              </div>
            </div>

            {/* ══════ AI RINGKASAN ═══════════════════════════════════ */}
            <div className="no-print mb-6 md:mb-8">
              {/* Tombol trigger */}
              <button
                onClick={handleAISummary}
                disabled={isLoadingAI}
                className={
                  'group relative flex items-center gap-2.5 px-5 py-3 rounded-xl text-sm font-bold transition-all duration-300 border overflow-hidden ' +
                  (showAI
                    ? 'bg-[#0D5C35] text-white border-[#0D5C35] shadow-lg shadow-[#0D5C35]/20 '
                    : 'bg-white dark:bg-[#162918] text-[#0D5C35] dark:text-emerald-400 border-[#0D5C35]/25 dark:border-emerald-700/40 hover:bg-[#0D5C35] hover:text-white hover:border-[#0D5C35] hover:shadow-lg hover:shadow-[#0D5C35]/20 ') +
                  (isLoadingAI ? 'cursor-wait opacity-80' : '')
                }
              >
                {/* Button shimmer */}
                <span className="absolute inset-0 bg-gradient-to-r from-transparent via-white/10 to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-700 ease-out pointer-events-none" />
                <Sparkles className={'relative w-4 h-4 transition-transform ' + (isLoadingAI ? 'animate-spin' : 'group-hover:rotate-12')} />
                <span className="relative">
                  {isLoadingAI
                    ? 'Meringkas...'
                    : (aiSummary && !aiError)
                      ? (showAI ? 'Sembunyikan Ringkasan' : '✨ Lihat Ringkasan AI')
                      : '✨ Ringkas Dokumen'
                  }
                </span>
              </button>

              {/* Card ringkasan AI */}
              {showAI && (
                <div className={
                  'mt-3 relative overflow-hidden rounded-2xl border p-5 md:p-6 ' +
                  'border-[#0D5C35]/15 dark:border-emerald-800/30 ' +
                  'bg-gradient-to-br from-[#EAF2EE] via-white to-emerald-50/30 ' +
                  'dark:from-[#0D5C35]/12 dark:via-[#162918] dark:to-[#1a3021] ' +
                  (aiSummary && !isLoadingAI ? 'ai-card-active shadow-md' : 'shadow-sm')
                }>
                  {/* Ambient orbs */}
                  <div className="absolute -right-6 -top-6 w-28 h-28 rounded-full bg-[#D4AF37]/8 blur-2xl pointer-events-none" />
                  <div className="absolute -left-4 -bottom-4 w-20 h-20 rounded-full bg-[#0D5C35]/8 blur-2xl pointer-events-none" />

                  {/* Header */}
                  <div className="relative flex items-center gap-2 mb-4">
                    <div className="w-8 h-8 rounded-xl bg-[#0D5C35]/10 dark:bg-emerald-900/30 border border-[#0D5C35]/10 dark:border-emerald-800/30 flex items-center justify-center flex-shrink-0">
                      <Sparkles className="w-4 h-4 text-[#0D5C35] dark:text-emerald-400" />
                    </div>
                    <div>
                      <span className="text-xs font-black text-[#0D5C35] dark:text-emerald-400 uppercase tracking-widest">
                        Ringkasan AI
                      </span>
                    </div>
                    <span className="ml-auto text-[10px] text-slate-400 dark:text-slate-500 font-medium bg-white/70 dark:bg-slate-700/50 px-2 py-0.5 rounded-full border border-slate-200/80 dark:border-slate-600/50">
                      Gemini 1.5 Flash
                    </span>
                  </div>

                  {/* Loading skeleton */}
                  {isLoadingAI && (
                    <div className="relative space-y-2.5 animate-pulse">
                      {[1, 0.9, 0.85, 0.9].map((w, i) => (
                        <div key={i} className="h-3.5 bg-[#0D5C35]/10 dark:bg-emerald-900/30 rounded-lg" style={{ width: `${w * 100}%` }} />
                      ))}
                    </div>
                  )}

                  {/* Error state */}
                  {aiError && !isLoadingAI && (
                    <div className="flex items-start gap-2.5 text-rose-600 dark:text-rose-400">
                      <span className="text-base flex-shrink-0 mt-0.5">⚠️</span>
                      <div>
                        <p className="text-sm font-bold mb-1">Gagal memuat ringkasan</p>
                        <p className="text-xs text-slate-500 dark:text-slate-400 font-mono break-words">{aiError}</p>
                        <button
                          onClick={() => { setAiError(''); setAiSummary(''); setShowAI(false); }}
                          className="mt-2 text-xs font-bold text-[#0D5C35] dark:text-emerald-400 hover:underline"
                        >
                          Coba lagi
                        </button>
                      </div>
                    </div>
                  )}

                  {/* Teks ringkasan */}
                  {aiSummary && !isLoadingAI && !aiError && (
                    <div className="relative space-y-2">
                      {aiSummary.split('\n').filter(line => line.trim() !== '').map((line, idx) => (
                        <p
                          key={idx}
                          className={
                            'text-sm leading-relaxed ' +
                            (line.startsWith('•') || line.startsWith('-')
                              ? 'text-slate-700 dark:text-slate-300 pl-1 flex gap-2'
                              : 'text-slate-600 dark:text-slate-400')
                          }
                        >
                          {line}
                        </p>
                      ))}
                    </div>
                  )}

                  {/* Disclaimer */}
                  {aiSummary && !isLoadingAI && (
                    <p className="relative mt-4 pt-3 border-t border-[#0D5C35]/10 dark:border-emerald-800/20 text-[10px] text-slate-400 dark:text-slate-500 italic">
                      Ringkasan dibuat oleh AI dan mungkin tidak sepenuhnya akurat. Selalu merujuk ke dokumen asli.
                    </p>
                  )}
                </div>
              )}
            </div>

            {/* ══════ VOTE ═══════════════════════════════════════════ */}
            <div className="no-print relative overflow-hidden rounded-2xl border border-[#0D5C35]/10 dark:border-[#0D5C35]/20 p-5 md:p-7 mb-8 md:mb-10 shadow-sm">
              {/* Background */}
              <div className="absolute inset-0 bg-gradient-to-br from-[#EAF2EE]/80 via-white to-amber-50/40 dark:from-[#0D5C35]/10 dark:via-[#162918] dark:to-amber-900/5" />
              {/* Orbs */}
              <div className="absolute -right-4 -top-4 w-24 h-24 rounded-full bg-[#D4AF37]/8 blur-2xl pointer-events-none" />
              <div className="absolute -left-4 -bottom-4 w-24 h-24 rounded-full bg-[#0D5C35]/8 blur-2xl pointer-events-none" />

              <div className="relative z-10 flex flex-col sm:flex-row items-center justify-between gap-4 md:gap-6">
                <div className="text-center sm:text-left">
                  <div className="flex items-center gap-2 mb-1.5 justify-center sm:justify-start">
                    <Sparkles className="w-4 h-4 text-[#D4AF37]" />
                    <h4 className="font-black text-slate-800 dark:text-slate-100 text-sm md:text-base">
                      Apakah informasi ini membantu?
                    </h4>
                  </div>
                  <p className="text-xs md:text-sm text-slate-500 dark:text-slate-400 leading-relaxed">
                    {hasVoted
                      ? voteType === 'like'
                        ? '🎉 Terima kasih! Apresiasi Anda sangat berarti.'
                        : '📝 Terima kasih! Kami akan terus memperbaiki konten.'
                      : 'Bantu kami meningkatkan kualitas layanan KPKNL Kendari.'
                    }
                  </p>
                </div>

                <div className="flex gap-2.5 flex-shrink-0">
                  {/* Ya */}
                  <button
                    onClick={() => handleVote('like')}
                    disabled={hasVoted}
                    aria-label="Membantu"
                    className={
                      'flex items-center gap-2 px-5 sm:px-6 py-2.5 rounded-xl font-bold text-sm transition-all ' +
                      (hasVoted && voteType === 'like'
                        ? 'bg-emerald-500 text-white shadow-lg shadow-emerald-200 dark:shadow-emerald-900/30 scale-105 cursor-default'
                        : hasVoted
                          ? 'bg-slate-100 dark:bg-slate-700 text-slate-400 cursor-not-allowed'
                          : 'bg-white dark:bg-slate-700/70 border border-slate-200 dark:border-slate-600 text-slate-600 dark:text-slate-300 hover:bg-emerald-50 dark:hover:bg-emerald-900/20 hover:text-emerald-700 hover:border-emerald-300 shadow-sm hover:shadow-md hover:-translate-y-0.5')
                    }
                  >
                    <ThumbsUp className="w-4 h-4" />
                    <span className="hidden sm:inline">Ya, Membantu</span>
                    <span className="sm:hidden">Ya</span>
                  </button>

                  {/* Tidak */}
                  <button
                    onClick={() => handleVote('dislike')}
                    disabled={hasVoted}
                    aria-label="Tidak membantu"
                    className={
                      'flex items-center gap-2 px-5 sm:px-6 py-2.5 rounded-xl font-bold text-sm transition-all ' +
                      (hasVoted && voteType === 'dislike'
                        ? 'bg-rose-500 text-white shadow-lg shadow-rose-200 dark:shadow-rose-900/30 scale-105 cursor-default'
                        : hasVoted
                          ? 'bg-slate-100 dark:bg-slate-700 text-slate-400 cursor-not-allowed'
                          : 'bg-white dark:bg-slate-700/70 border border-slate-200 dark:border-slate-600 text-slate-600 dark:text-slate-300 hover:bg-rose-50 dark:hover:bg-rose-900/20 hover:text-rose-700 hover:border-rose-300 shadow-sm hover:shadow-md hover:-translate-y-0.5')
                    }
                  >
                    <ThumbsDown className="w-4 h-4" />
                    <span className="hidden sm:inline">Tidak</span>
                    <span className="sm:hidden">Tidak</span>
                  </button>
                </div>
              </div>
            </div>

            {/* ══════ LAMPIRAN GAMBAR ════════════════════════════════ */}
            {data.imageBase64 && (
              <div className="mb-8 md:mb-10">
                <h3 className="text-sm md:text-base font-black text-slate-800 dark:text-slate-100 mb-4 flex items-center gap-3">
                  <span className="w-1 h-5 bg-gradient-to-b from-[#0D5C35] to-teal-500 rounded-full" />
                  Lampiran Visual
                </h3>
                <div
                  className="p-2 bg-slate-50 dark:bg-[#0f1f16] border-2 border-dashed border-slate-200 dark:border-slate-600 rounded-2xl cursor-zoom-in group relative overflow-hidden hover:border-[#0D5C35]/30 dark:hover:border-emerald-700/40 transition-colors shadow-sm"
                  onClick={() => setIsLightboxOpen(true)}
                  title="Klik untuk memperbesar"
                >
                  <div className="absolute inset-0 bg-black/0 group-hover:bg-black/8 dark:group-hover:bg-black/20 transition-colors flex items-center justify-center z-10">
                    <div className="bg-white/95 dark:bg-slate-800/95 px-4 py-2.5 rounded-xl opacity-0 group-hover:opacity-100 transition-all shadow-lg translate-y-2 group-hover:translate-y-0 flex items-center gap-2">
                      <Maximize2 className="w-4 h-4 text-slate-700 dark:text-slate-200" />
                      <span className="text-xs font-bold text-slate-700 dark:text-slate-200">Perbesar</span>
                    </div>
                  </div>
                  <img
                    src={data.imageBase64}
                    alt="Lampiran"
                    className="w-full h-auto object-contain max-h-[600px] rounded-xl bg-white dark:bg-slate-800 shadow-sm"
                  />
                  <p className="text-center text-xs text-slate-400 dark:text-slate-500 mt-2 py-1 flex items-center justify-center gap-1">
                    <ImageIcon className="w-3 h-3" /> Klik untuk memperbesar
                  </p>
                </div>
              </div>
            )}

            {/* ══════ VIDEO TUTORIAL ═════════════════════════════════ */}
            {data.videoUrl && (
              <div className="mb-8 md:mb-10">
                <h3 className="text-sm md:text-base font-black text-slate-800 dark:text-slate-100 mb-4 flex items-center gap-3">
                  <span className="w-1 h-5 bg-gradient-to-b from-blue-500 to-indigo-500 rounded-full" />
                  Video Tutorial
                </h3>
                <div className="w-full aspect-video rounded-2xl overflow-hidden shadow-xl border border-slate-200 dark:border-slate-700 bg-slate-900 relative ring-1 ring-white/5">
                  <iframe
                    src={getEmbedUrl(data.videoUrl) || ''}
                    title="Video Tutorial"
                    className="w-full h-full absolute inset-0"
                    allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                    allowFullScreen
                  />
                </div>
                <p className="text-center text-xs text-slate-400 dark:text-slate-500 mt-3 flex items-center justify-center gap-1">
                  <PlayCircle className="w-3 h-3" /> Putar video langsung dari sistem
                </p>
              </div>
            )}

            {/* ══════ UNDUH PDF ══════════════════════════════════════ */}
            {data.pdfUrl && (
              <div className="mt-8 md:mt-10 pt-6 md:pt-8 border-t border-slate-100 dark:border-slate-700/80">
                <h3 className="text-sm md:text-base font-black text-slate-800 dark:text-slate-100 mb-4 flex items-center gap-3">
                  <span className="w-1 h-5 bg-gradient-to-b from-rose-500 to-pink-500 rounded-full" />
                  Dokumen Asli
                </h3>
                <a
                  href={data.pdfUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="group block w-full bg-white dark:bg-[#0f1f16] border border-rose-100 dark:border-rose-800/30 hover:border-rose-300 dark:hover:border-rose-600/40 rounded-2xl overflow-hidden shadow-sm hover:shadow-xl hover:shadow-rose-100/50 dark:hover:shadow-rose-900/20 transition-all duration-300"
                >
                  <div className="flex items-center justify-between p-4 sm:p-5 bg-gradient-to-r from-rose-50 dark:from-rose-900/15 via-white dark:via-[#0f1f16] to-white dark:to-[#0f1f16]">
                    <div className="flex items-center gap-3 md:gap-4 min-w-0">
                      <div className="bg-white dark:bg-slate-700 p-2.5 md:p-3 rounded-xl shadow-sm text-rose-500 group-hover:scale-110 group-hover:shadow-md group-hover:bg-rose-50 dark:group-hover:bg-rose-900/20 transition-all duration-300 flex-shrink-0">
                        <FileText className="w-6 h-6 md:w-7 md:h-7" />
                      </div>
                      <div className="min-w-0">
                        <div className="font-bold text-slate-800 dark:text-slate-100 group-hover:text-rose-600 dark:group-hover:text-rose-400 transition-colors text-sm md:text-base">
                          Unduh Dokumen Lengkap (PDF)
                        </div>
                        <div className="text-xs sm:text-sm text-slate-400 dark:text-slate-500">
                          Klik untuk melihat file asli
                        </div>
                      </div>
                    </div>
                    <div className="hidden md:flex items-center gap-2 bg-rose-500 hover:bg-rose-600 text-white px-4 md:px-5 py-2.5 rounded-xl font-bold shadow-lg shadow-rose-200 dark:shadow-rose-900/30 transition-all group-hover:-translate-y-0.5 flex-shrink-0">
                      <Download className="w-4 h-4" /> Download
                    </div>
                  </div>
                  <div className="md:hidden bg-rose-500 text-white text-center py-3 font-bold text-sm">
                    Tap untuk Download PDF
                  </div>
                </a>
              </div>
            )}
          </div>
        </div>

        {/* ══════ DOKUMEN TERKAIT ════════════════════════════════════ */}
        {relatedDocs.length > 0 && (
          <div className="no-print mt-10 md:mt-14 mb-6">
            {/* Section header */}
            <div className="flex items-center gap-3 mb-6 md:mb-7">
              <div className="w-1.5 h-7 bg-gradient-to-b from-[#0D5C35] to-emerald-400 rounded-full" />
              <h3 className="text-lg md:text-xl font-black text-slate-800 dark:text-slate-100">
                Lihat Juga Informasi Terkait
              </h3>
              <span className="text-xs font-black text-slate-400 dark:text-slate-500 bg-slate-100 dark:bg-slate-700/60 px-2.5 py-1 rounded-full border border-slate-200 dark:border-slate-600">
                {relatedDocs.length}
              </span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4 md:gap-5">
              {relatedDocs.map((item, i) => (
                <div
                  key={item.id}
                  onClick={() => navigate('/detail/' + item.id)}
                  className="related-card-inner bg-white dark:bg-[#162918] rounded-2xl border border-slate-100 dark:border-slate-700/80 shadow-sm hover:shadow-xl hover:shadow-slate-200/60 dark:hover:shadow-slate-900/60 hover:-translate-y-2 hover:border-[#D4AF37]/20 dark:hover:border-[#D4AF37]/15 cursor-pointer transition-all duration-300 group overflow-hidden"
                  style={{ animationDelay: i * 80 + 'ms' }}
                >
                  {/* Accent bar atas per kategori */}
                  <div className={`related-accent h-0.5 w-full bg-gradient-to-r ${getCategoryAccent(item.category)} opacity-0 group-hover:opacity-100 transition-opacity duration-300`} />

                  <div className="p-5 md:p-6 relative">
                    {/* Ambient dekorasi */}
                    <div className="absolute top-0 right-0 w-20 h-20 rounded-bl-full -mr-10 -mt-10 bg-[#D4AF37]/4 dark:bg-[#D4AF37]/6 group-hover:bg-[#D4AF37]/8 transition-colors pointer-events-none" />

                    <span className={'relative inline-block px-2.5 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider mb-3.5 border ' + getCategoryStyle(item.category)}>
                      {item.category.replace(/-/g, ' ')}
                    </span>

                    <h4 className="relative font-bold text-slate-800 dark:text-slate-100 group-hover:text-[#0D5C35] dark:group-hover:text-emerald-400 transition-colors line-clamp-2 mb-2 text-sm leading-snug">
                      {item.title}
                    </h4>

                    <p className="relative text-xs text-slate-400 dark:text-slate-500 line-clamp-2 leading-relaxed mb-4">
                      {item.description}
                    </p>

                    <div className="relative flex items-center gap-1 text-xs font-bold text-[#0D5C35] dark:text-emerald-400 opacity-55 group-hover:opacity-100 transition-opacity">
                      <Bookmark className="w-3 h-3" />
                      <span>Baca dokumen</span>
                      <ArrowRight className="w-3 h-3 ml-auto group-hover:translate-x-1 transition-transform" />
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </main>
    </div>
  );
};

export default DetailPage;