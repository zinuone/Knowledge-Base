// File: src/pages/DetailPage.tsx
import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  doc, getDoc, updateDoc, increment,
  collection, query, where, limit, getDocs
} from 'firebase/firestore';
import { db } from '../firebase';
import {
  ArrowLeft, Calendar, FileText, Image as ImageIcon, Download,
  Eye, ThumbsUp, ThumbsDown, Share2, Check, Home, ChevronRight,
  Maximize2, X, PlayCircle, Sparkles, ArrowRight, Bookmark,
} from 'lucide-react';
import ReactMarkdown from 'react-markdown';
import toast, { Toaster } from 'react-hot-toast';
import { SkeletonDetail } from '../components/SkeletonLoader';

/* ─── Animasi ──────────────────────────────────────────────────── */
const PAGE_CSS = `
@keyframes fadeInUp {
  from { opacity: 0; transform: translateY(16px); }
  to   { opacity: 1; transform: translateY(0); }
}
@keyframes progressGlow {
  0%,100% { box-shadow: 0 0 6px #D4AF37, 0 0 12px #D4AF37aa; }
  50%     { box-shadow: 0 0 12px #D4AF37, 0 0 24px #D4AF37; }
}
.detail-fade-in { animation: fadeInUp 0.5s ease-out forwards; }
.progress-glow  { animation: progressGlow 2s ease-in-out infinite; }
`;

/* ─── TIPE DATA ────────────────────────────────────────────────── */
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
}

/* ─── HELPER: Warna kategori ──────────────────────────────────── */
const getCategoryStyle = (cat: string) => {
  const map: Record<string, string> = {
    'psp':                  'bg-emerald-100 text-emerald-800 border-emerald-200 dark:bg-emerald-900/30 dark:text-emerald-300 dark:border-emerald-700/30',
    'penjualan':            'bg-amber-100   text-amber-800   border-amber-200   dark:bg-amber-900/30   dark:text-amber-300   dark:border-amber-700/30',
    'sewa':                 'bg-blue-100    text-blue-800    border-blue-200    dark:bg-blue-900/30    dark:text-blue-300    dark:border-blue-700/30',
    'penghapusan':          'bg-rose-100    text-rose-800    border-rose-200    dark:bg-rose-900/30    dark:text-rose-300    dark:border-rose-700/30',
    'pinjam-pakai':         'bg-indigo-100  text-indigo-800  border-indigo-200  dark:bg-indigo-900/30  dark:text-indigo-300  dark:border-indigo-700/30',
    'penggunaan-sementara': 'bg-purple-100  text-purple-800  border-purple-200  dark:bg-purple-900/30  dark:text-purple-300  dark:border-purple-700/30',
    'alih-status':          'bg-teal-100    text-teal-800    border-teal-200    dark:bg-teal-900/30    dark:text-teal-300    dark:border-teal-700/30',
    'hibah':                'bg-orange-100  text-orange-800  border-orange-200  dark:bg-orange-900/30  dark:text-orange-300  dark:border-orange-700/30',
  };
  return map[cat] ?? 'bg-slate-100 text-slate-800 border-slate-200 dark:bg-slate-700 dark:text-slate-300 dark:border-slate-600';
};

/* ─── HELPER: Auto-embed URL ──────────────────────────────────── */
const getEmbedUrl = (url: string): string | null => {
  if (!url) return null;
  try {
    if (url.includes('youtube.com') || url.includes('youtu.be')) {
      const m = url.match(/^.*(youtu.be\/|v\/|u\/\w\/|embed\/|watch\?v=|&v=)([^#&?]*).*/);
      const id = m && m[2].length === 11 ? m[2] : null;
      if (id) return `https://www.youtube.com/embed/${id}`;
    }
    if (url.includes('drive.google.com/file/d/')) {
      const m = url.match(/\/d\/(.+?)\//);
      if (m) return `https://drive.google.com/file/d/${m[1]}/preview`;
    }
  } catch {}
  return url;
};

/* ══════════════════════════════════════════════════════════════
   KOMPONEN UTAMA
══════════════════════════════════════════════════════════════ */
const DetailPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();

  const [data,            setData]           = useState<ContentData | null>(null);
  const [relatedDocs,     setRelatedDocs]    = useState<ContentData[]>([]);
  const [loading,         setLoading]        = useState(true);
  const [hasVoted,        setHasVoted]       = useState(false);
  const [voteType,        setVoteType]       = useState<'like' | 'dislike' | null>(null);
  const [isCopied,        setIsCopied]       = useState(false);
  const [isLightboxOpen,  setIsLightboxOpen] = useState(false);
  const [scrollProgress,  setScrollProgress] = useState(0);
  const [isScrolled,      setIsScrolled]     = useState(false);

  /* ── Dark Mode: baca dari localStorage ── */
  useEffect(() => {
    try {
      const isDark = localStorage.getItem('pkn-theme') === 'dark';
      document.documentElement.classList.toggle('dark', isDark);
    } catch {}
  }, []);

  /* Scroll progress bar */
  useEffect(() => {
    const onScroll = () => {
      const total = document.documentElement.scrollHeight - document.documentElement.clientHeight;
      setScrollProgress(total > 0 ? document.documentElement.scrollTop / total : 0);
      setIsScrolled(document.documentElement.scrollTop > 120);
    };
    window.addEventListener('scroll', onScroll);
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  /* Fetch data */
  useEffect(() => {
    const fetchData = async () => {
      if (!id) return;
      setLoading(true);
      window.scrollTo(0, 0);
      try {
        const docRef = doc(db, 'knowledge-base', id);
        const docSnap = await getDoc(docRef);
        if (docSnap.exists()) {
          const mainData = { id: docSnap.id, ...docSnap.data() } as ContentData;
          setData(mainData);

          /* Hitung view (sekali per session) */
          const sessionKey = `viewed_${id}`;
          if (!sessionStorage.getItem(sessionKey)) {
            await updateDoc(docRef, { views: increment(1) });
            sessionStorage.setItem(sessionKey, 'true');
          }

          /* Dokumen terkait */
          const rq = query(collection(db, 'knowledge-base'), where('category', '==', mainData.category), limit(4));
          const rSnap = await getDocs(rq);
          setRelatedDocs(rSnap.docs.map(d => ({ id: d.id, ...d.data() } as ContentData)).filter(i => i.id !== id).slice(0, 3));
        }
      } catch (e) { console.error(e); }
      finally { setLoading(false); }
    };
    fetchData();
  }, [id]);

  /* Voting */
  const handleVote = async (type: 'like' | 'dislike') => {
    if (!id || hasVoted) return;
    const toastId = toast.loading('Mengirim masukan...');
    try {
      await updateDoc(doc(db, 'knowledge-base', id), {
        [type === 'like' ? 'likes' : 'dislikes']: increment(1)
      });
      setHasVoted(true);
      setVoteType(type);
      toast.success('Terima kasih atas masukan Anda!', { id: toastId });
    } catch {
      toast.error('Gagal mengirim masukan.', { id: toastId });
    }
  };

  /* Share */
  const handleShare = () => {
    navigator.clipboard.writeText(window.location.href);
    setIsCopied(true);
    toast.success('Link berhasil disalin!', {
      icon: '🔗',
      style: { borderRadius: '12px', background: '#1e293b', color: '#fff', fontWeight: '600' },
    });
    setTimeout(() => setIsCopied(false), 2500);
  };

  /* ── Loading state ── */
  if (loading) {
    return (
      <div className="min-h-screen bg-[#F4F7F5] dark:bg-[#0d1a12] font-sans pb-20 transition-colors duration-300">
        <style dangerouslySetInnerHTML={{ __html: PAGE_CSS }} />
        <div className="bg-gradient-to-r from-[#0D5C35] to-[#0A492A] text-white p-5 shadow-lg">
          <div className="max-w-4xl mx-auto flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-white/10 rounded-full"><ArrowLeft className="w-5 h-5 text-white/60" /></div>
              <div className="h-5 w-32 bg-white/10 rounded-lg animate-pulse" />
            </div>
            <div className="h-8 w-24 bg-white/10 rounded-lg animate-pulse" />
          </div>
        </div>
        <main className="max-w-4xl mx-auto mt-8 px-4">
          <SkeletonDetail />
        </main>
      </div>
    );
  }

  /* ── Data not found ── */
  if (!data) {
    return (
      <div className="min-h-screen bg-[#F4F7F5] dark:bg-[#0d1a12] font-sans flex flex-col items-center justify-center gap-6 p-8 text-center transition-colors duration-300">
        <div className="p-6 bg-rose-50 dark:bg-rose-900/20 rounded-3xl border border-rose-100 dark:border-rose-800/30">
          <FileText className="w-14 h-14 text-rose-300 dark:text-rose-500 mx-auto" />
        </div>
        <h2 className="text-2xl font-black text-slate-800 dark:text-slate-100">Data Tidak Ditemukan</h2>
        <p className="text-slate-500 dark:text-slate-400 max-w-sm">Dokumen yang Anda cari tidak tersedia atau telah dihapus.</p>
        <button onClick={() => navigate('/')} className="px-8 py-3 bg-[#0D5C35] text-white rounded-xl font-bold shadow-lg hover:-translate-y-0.5 transition-all">
          Kembali ke Beranda
        </button>
      </div>
    );
  }

  const dateStr = data.updatedAt
    ? new Date(data.updatedAt.seconds * 1000).toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' })
    : 'Baru saja';
  const categoryStyle = getCategoryStyle(data.category);

  return (
    <div className="min-h-screen bg-[#F4F7F5] dark:bg-[#0d1a12] pb-24 font-sans relative transition-colors duration-300">
      <style dangerouslySetInnerHTML={{ __html: PAGE_CSS }} />
      <Toaster position="top-center" toastOptions={{ style: { borderRadius: '12px', fontWeight: 600 } }} />

      {/* Progress bar */}
      <div
        className="fixed top-0 left-0 h-1.5 bg-[#D4AF37] z-[60] transition-all duration-100 ease-out progress-glow"
        style={{ width: `${scrollProgress * 100}%` }}
      />

      {/* Lightbox gambar */}
      {isLightboxOpen && data.imageBase64 && (
        <div
          className="fixed inset-0 z-[70] bg-black/92 flex items-center justify-center p-4 backdrop-blur-md animate-in fade-in duration-300"
          onClick={() => setIsLightboxOpen(false)}
        >
          <button className="absolute top-5 right-5 text-white/70 hover:text-white bg-white/10 hover:bg-white/20 p-2.5 rounded-full transition-all">
            <X className="w-6 h-6" />
          </button>
          <img src={data.imageBase64} alt="Full Preview"
            className="max-w-full max-h-[90vh] object-contain rounded-2xl shadow-2xl"
            onClick={e => e.stopPropagation()} />
          <p className="absolute bottom-5 text-white/50 text-sm font-medium">Klik di luar gambar untuk menutup</p>
        </div>
      )}

      {/* ── STICKY HEADER ── */}
      <header className="bg-gradient-to-r from-[#0D5C35] to-[#0A492A] text-white shadow-lg sticky top-0 z-50">
        <div className="max-w-4xl mx-auto px-4 sm:px-5 py-4 flex items-center justify-between gap-3 md:gap-4">
          <div className="flex items-center gap-2 md:gap-3 min-w-0">
            <button
              onClick={() => data.category ? navigate(`/category/${data.category}`) : navigate('/')}
              className="flex-shrink-0 p-2 hover:bg-white/20 rounded-full transition"
              aria-label="Kembali">
              <ArrowLeft className="w-5 h-5" />
            </button>
            <div className={`transition-all duration-300 min-w-0 overflow-hidden ${isScrolled ? 'opacity-100 max-w-[200px] sm:max-w-xs' : 'opacity-0 max-w-0'}`}>
              <p className="font-bold text-sm truncate text-white/90">{data.title}</p>
            </div>
            <div className={`transition-all duration-300 ${isScrolled ? 'opacity-0 hidden' : 'opacity-100'}`}>
              <h1 className="text-sm md:text-base font-bold text-white/90">Knowledge Base</h1>
            </div>
          </div>
          <button onClick={handleShare}
            className="flex-shrink-0 flex items-center gap-1.5 bg-white/10 hover:bg-white/20 px-3 md:px-3.5 py-2 rounded-xl transition-all text-xs font-bold border border-white/15">
            {isCopied
              ? <><Check className="w-3.5 h-3.5 text-emerald-300" /><span className="hidden sm:inline">Tersalin!</span></>
              : <><Share2 className="w-3.5 h-3.5" /><span className="hidden sm:inline">Bagikan</span></>
            }
          </button>
        </div>
      </header>

      {/* ── MAIN ── */}
      <main className="max-w-4xl mx-auto mt-6 md:mt-8 px-4 detail-fade-in">

        {/* Breadcrumb */}
        <nav aria-label="Breadcrumb"
          className="flex items-center text-xs text-slate-500 dark:text-slate-400 mb-5 md:mb-6 gap-1.5 overflow-x-auto whitespace-nowrap pb-1">
          <button onClick={() => navigate('/')} className="flex items-center gap-1 hover:text-[#0D5C35] dark:hover:text-emerald-400 transition-colors flex-shrink-0">
            <Home className="w-3.5 h-3.5" /> Beranda
          </button>
          <ChevronRight className="w-3 h-3 text-slate-300 dark:text-slate-600 flex-shrink-0" />
          <button onClick={() => navigate(`/category/${data.category}`)} className="hover:text-[#0D5C35] dark:hover:text-emerald-400 font-bold uppercase transition-colors flex-shrink-0">
            {data.category.replace(/-/g, ' ')}
          </button>
          <ChevronRight className="w-3 h-3 text-slate-300 dark:text-slate-600 flex-shrink-0" />
          <span className="text-slate-800 dark:text-slate-200 font-medium truncate max-w-[140px] sm:max-w-[200px] md:max-w-xs">{data.title}</span>
        </nav>

        {/* Artikel card */}
        <div className="bg-white dark:bg-[#162918] rounded-3xl shadow-md border border-slate-100 dark:border-slate-700 overflow-hidden">

          {/* Header artikel */}
          <div className="relative p-6 sm:p-8 md:p-12 border-b border-slate-100 dark:border-slate-700 overflow-hidden bg-gradient-to-br from-white via-slate-50 to-[#EAF2EE]/40 dark:from-[#162918] dark:via-[#1a3021] dark:to-[#162918]">
            <div className="absolute -right-8 -top-8 opacity-[0.04] pointer-events-none select-none">
              <FileText className="w-72 h-72 text-[#0D5C35]" />
            </div>

            <div className="relative z-10">
              {/* Badge baris */}
              <div className="flex flex-wrap items-center gap-2 mb-5 md:mb-6">
                <span className={`inline-flex items-center px-3 sm:px-3.5 py-1.5 rounded-full text-xs font-bold uppercase tracking-widest border shadow-sm ${categoryStyle}`}>
                  <span className="w-1.5 h-1.5 rounded-full bg-current mr-2 opacity-60" />
                  {data.category.replace(/-/g, ' ')}
                </span>
                <span className="text-slate-400 dark:text-slate-500 text-xs font-medium bg-white dark:bg-slate-700 px-3 py-1.5 rounded-full border border-slate-100 dark:border-slate-600 shadow-sm flex items-center gap-1.5">
                  <Calendar className="w-3 h-3" /> {dateStr}
                </span>
                <span className="text-slate-400 dark:text-slate-500 text-xs font-medium bg-white dark:bg-slate-700 px-3 py-1.5 rounded-full border border-slate-100 dark:border-slate-600 shadow-sm flex items-center gap-1.5">
                  <Eye className="w-3 h-3" /> {data.views || 0} Views
                </span>
              </div>

              <h1 className="text-2xl sm:text-3xl md:text-4xl font-black text-slate-800 dark:text-slate-100 mb-3 md:mb-4 leading-tight tracking-tight">
                {data.title}
              </h1>
              <p className="text-base md:text-lg text-slate-500 dark:text-slate-400 font-medium max-w-2xl leading-relaxed">
                {data.description}
              </p>
            </div>
          </div>

          {/* Body artikel */}
          <div className="p-6 sm:p-8 md:p-10">

            {/* Konten Markdown */}
            <div className="
              prose prose-slate dark:prose-invert max-w-none mb-10 md:mb-12
              prose-headings:scroll-mt-24
              prose-h2:text-xl sm:prose-h2:text-2xl prose-h2:font-extrabold prose-h2:text-slate-800 dark:prose-h2:text-slate-100
                prose-h2:mt-8 md:prose-h2:mt-10 prose-h2:mb-4 md:prose-h2:mb-5
                prose-h2:pb-3 md:prose-h2:pb-4 prose-h2:border-b-2 prose-h2:border-slate-100 dark:prose-h2:border-slate-700
              prose-h3:text-base sm:prose-h3:text-lg prose-h3:font-bold prose-h3:text-[#0D5C35] dark:prose-h3:text-emerald-400
                prose-h3:mt-6 md:prose-h3:mt-8 prose-h3:mb-3
              prose-p:text-slate-600 dark:prose-p:text-slate-300 prose-p:leading-[1.85] prose-p:mb-4 prose-p:text-sm sm:prose-p:text-base
              prose-li:marker:text-[#D4AF37] prose-li:marker:font-extrabold prose-li:pl-1
                prose-li:text-slate-600 dark:prose-li:text-slate-300 prose-li:text-sm sm:prose-li:text-base
              prose-strong:text-slate-900 dark:prose-strong:text-slate-100 prose-strong:font-bold
                prose-strong:bg-[#EAF2EE] dark:prose-strong:bg-[#0D5C35]/20
                prose-strong:text-[#0D5C35] dark:prose-strong:text-emerald-400
                prose-strong:px-1.5 prose-strong:py-0.5 prose-strong:rounded-md
              prose-blockquote:border-l-4 prose-blockquote:border-[#D4AF37]
                prose-blockquote:bg-amber-50/50 dark:prose-blockquote:bg-amber-900/10
                prose-blockquote:px-4 sm:prose-blockquote:px-5 prose-blockquote:py-3 prose-blockquote:rounded-r-xl
                prose-blockquote:text-slate-600 dark:prose-blockquote:text-slate-400 prose-blockquote:not-italic
            ">
              <ReactMarkdown
                components={{ li: ({ node, ...props }) => <li className="pl-2 my-1" {...props} /> }}>
                {data.content}
              </ReactMarkdown>
            </div>

            {/* VOTE */}
            <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-[#EAF2EE] via-white to-amber-50/40 dark:from-[#0D5C35]/10 dark:via-[#162918] dark:to-amber-900/5 border border-[#0D5C35]/12 dark:border-[#0D5C35]/20 p-5 md:p-7 mb-8 md:mb-10 shadow-sm">
              <div className="absolute -right-4 -top-4 w-24 h-24 rounded-full bg-[#D4AF37]/8 blur-2xl pointer-events-none" />
              <div className="absolute -left-4 -bottom-4 w-24 h-24 rounded-full bg-[#0D5C35]/8 blur-2xl pointer-events-none" />
              <div className="relative z-10 flex flex-col sm:flex-row items-center justify-between gap-4 md:gap-5">
                <div className="text-center sm:text-left">
                  <div className="flex items-center gap-2 mb-1 justify-center sm:justify-start">
                    <Sparkles className="w-4 h-4 text-[#D4AF37]" />
                    <h4 className="font-black text-slate-800 dark:text-slate-100 text-sm md:text-base">Apakah informasi ini membantu?</h4>
                  </div>
                  <p className="text-xs md:text-sm text-slate-500 dark:text-slate-400">
                    {hasVoted
                      ? voteType === 'like' ? '🎉 Terima kasih! Apresiasi Anda sangat berarti.' : '📝 Terima kasih! Kami akan terus memperbaiki konten.'
                      : 'Bantu kami meningkatkan kualitas layanan KPKNL Kendari.'}
                  </p>
                </div>
                <div className="flex gap-3 flex-shrink-0">
                  <button onClick={() => handleVote('like')} disabled={hasVoted} aria-label="Membantu"
                    className={`flex items-center gap-2 px-4 sm:px-5 py-2.5 rounded-xl font-bold text-sm transition-all
                      ${hasVoted && voteType === 'like'
                        ? 'bg-emerald-500 text-white shadow-lg shadow-emerald-200 dark:shadow-emerald-900/30 cursor-default scale-105'
                        : hasVoted ? 'bg-slate-100 dark:bg-slate-700 text-slate-400 cursor-not-allowed'
                        : 'bg-white dark:bg-slate-700 border border-slate-200 dark:border-slate-600 text-slate-600 dark:text-slate-300 hover:bg-emerald-50 dark:hover:bg-emerald-900/20 hover:text-emerald-700 hover:border-emerald-200 shadow-sm hover:shadow-md hover:-translate-y-0.5'
                      }`}>
                    <ThumbsUp className="w-4 h-4" /> <span className="hidden sm:inline">Ya, Membantu</span><span className="sm:hidden">Ya</span>
                  </button>
                  <button onClick={() => handleVote('dislike')} disabled={hasVoted} aria-label="Tidak membantu"
                    className={`flex items-center gap-2 px-4 sm:px-5 py-2.5 rounded-xl font-bold text-sm transition-all
                      ${hasVoted && voteType === 'dislike'
                        ? 'bg-rose-500 text-white shadow-lg shadow-rose-200 dark:shadow-rose-900/30 cursor-default scale-105'
                        : hasVoted ? 'bg-slate-100 dark:bg-slate-700 text-slate-400 cursor-not-allowed'
                        : 'bg-white dark:bg-slate-700 border border-slate-200 dark:border-slate-600 text-slate-600 dark:text-slate-300 hover:bg-rose-50 dark:hover:bg-rose-900/20 hover:text-rose-700 hover:border-rose-200 shadow-sm hover:shadow-md hover:-translate-y-0.5'
                      }`}>
                    <ThumbsDown className="w-4 h-4" /> <span className="hidden sm:inline">Tidak</span>
                  </button>
                </div>
              </div>
            </div>

            {/* Lampiran gambar */}
            {data.imageBase64 && (
              <div className="mb-8 md:mb-10">
                <h3 className="text-sm md:text-base font-black text-slate-800 dark:text-slate-100 mb-4 flex items-center gap-3">
                  <span className="w-1 h-5 bg-[#0D5C35] rounded-full" />
                  Lampiran Visual
                </h3>
                <div
                  className="p-2 bg-slate-50 dark:bg-[#0f1f16] border-2 border-dashed border-slate-200 dark:border-slate-600 rounded-2xl cursor-zoom-in group relative overflow-hidden hover:border-[#0D5C35]/30 transition-colors"
                  onClick={() => setIsLightboxOpen(true)}
                  title="Klik untuk memperbesar">
                  <div className="absolute inset-0 bg-black/0 group-hover:bg-black/10 transition-colors flex items-center justify-center z-10">
                    <div className="bg-white/90 dark:bg-slate-800/90 p-3 rounded-full opacity-0 group-hover:opacity-100 transition-all shadow-lg translate-y-2 group-hover:translate-y-0">
                      <Maximize2 className="w-5 h-5 text-slate-700 dark:text-slate-200" />
                    </div>
                  </div>
                  <img src={data.imageBase64} alt="Lampiran" className="w-full h-auto object-contain max-h-[600px] rounded-xl bg-white dark:bg-slate-800 shadow-sm" />
                  <p className="text-center text-xs text-slate-400 dark:text-slate-500 mt-2 py-1 flex items-center justify-center gap-1">
                    <ImageIcon className="w-3 h-3" /> Klik untuk memperbesar
                  </p>
                </div>
              </div>
            )}

            {/* Video tutorial */}
            {data.videoUrl && (
              <div className="mb-8 md:mb-10">
                <h3 className="text-sm md:text-base font-black text-slate-800 dark:text-slate-100 mb-4 flex items-center gap-3">
                  <span className="w-1 h-5 bg-blue-500 rounded-full" />
                  Video Tutorial
                </h3>
                <div className="w-full aspect-video rounded-2xl overflow-hidden shadow-xl border border-slate-200 dark:border-slate-700 bg-slate-900 relative">
                  <iframe
                    src={getEmbedUrl(data.videoUrl) || ''}
                    title="Video Tutorial"
                    className="w-full h-full absolute inset-0"
                    allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                    allowFullScreen />
                </div>
                <p className="text-center text-xs text-slate-400 dark:text-slate-500 mt-3 flex items-center justify-center gap-1">
                  <PlayCircle className="w-3 h-3" /> Putar video langsung dari sistem
                </p>
              </div>
            )}

            {/* Unduh PDF */}
            {data.pdfUrl && (
              <div className="mt-8 md:mt-10 pt-6 md:pt-8 border-t border-slate-100 dark:border-slate-700">
                <h3 className="text-sm md:text-base font-black text-slate-800 dark:text-slate-100 mb-4 flex items-center gap-3">
                  <span className="w-1 h-5 bg-rose-500 rounded-full" />
                  Dokumen Asli
                </h3>
                <a href={data.pdfUrl} target="_blank" rel="noopener noreferrer"
                  className="group block w-full bg-white dark:bg-[#0f1f16] border border-rose-100 dark:border-rose-800/30 hover:border-rose-300 dark:hover:border-rose-600/40 rounded-2xl overflow-hidden shadow-sm hover:shadow-lg transition-all duration-300">
                  <div className="flex items-center justify-between p-4 sm:p-5 bg-gradient-to-r from-rose-50 dark:from-rose-900/15 via-white dark:via-[#0f1f16] to-white dark:to-[#0f1f16]">
                    <div className="flex items-center gap-3 md:gap-4 min-w-0">
                      <div className="bg-white dark:bg-slate-700 p-2.5 md:p-3 rounded-xl shadow-sm text-rose-500 group-hover:scale-110 group-hover:shadow-md transition-all duration-300 flex-shrink-0">
                        <FileText className="w-6 h-6 md:w-7 md:h-7" />
                      </div>
                      <div className="min-w-0">
                        <div className="font-bold text-slate-800 dark:text-slate-100 group-hover:text-rose-600 dark:group-hover:text-rose-400 transition-colors text-sm md:text-base truncate">
                          Unduh Dokumen Lengkap (PDF)
                        </div>
                        <div className="text-xs sm:text-sm text-slate-400 dark:text-slate-500">Klik untuk melihat file asli</div>
                      </div>
                    </div>
                    <div className="hidden md:flex items-center gap-2 bg-rose-500 hover:bg-rose-600 text-white px-4 md:px-5 py-2.5 rounded-xl font-bold shadow-lg shadow-rose-200 dark:shadow-rose-900/30 transition-all flex-shrink-0">
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

        {/* ── DOKUMEN TERKAIT ── */}
        {relatedDocs.length > 0 && (
          <div className="mt-10 md:mt-14 mb-6">
            <div className="flex items-center gap-3 mb-5 md:mb-6">
              <div className="w-1 h-6 bg-[#0D5C35] rounded-full" />
              <h3 className="text-lg md:text-xl font-black text-slate-800 dark:text-slate-100">Lihat Juga Informasi Terkait</h3>
              <span className="text-xs font-bold text-slate-400 dark:text-slate-500 bg-slate-100 dark:bg-slate-700 px-2 py-0.5 rounded-full">{relatedDocs.length}</span>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4 md:gap-5">
              {relatedDocs.map((item, i) => (
                <div key={item.id} onClick={() => navigate(`/detail/${item.id}`)}
                  className="bg-white dark:bg-[#162918] p-5 md:p-6 rounded-2xl border border-slate-100 dark:border-slate-700 shadow-sm hover:shadow-xl hover:-translate-y-1.5 hover:border-[#D4AF37]/25 dark:hover:border-[#D4AF37]/20 cursor-pointer transition-all duration-300 group relative overflow-hidden"
                  style={{ animationDelay: `${i * 80}ms` }}>
                  <div className="absolute top-0 right-0 w-20 h-20 rounded-bl-full -mr-10 -mt-10 bg-[#D4AF37]/5 dark:bg-[#D4AF37]/8 group-hover:bg-[#D4AF37]/10 transition-colors" />

                  <span className={`inline-block px-2.5 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider mb-3 border ${getCategoryStyle(item.category)}`}>
                    {item.category.replace(/-/g, ' ')}
                  </span>

                  <h4 className="font-bold text-slate-800 dark:text-slate-100 group-hover:text-[#0D5C35] dark:group-hover:text-emerald-400 transition-colors line-clamp-2 mb-2 text-sm leading-snug">
                    {item.title}
                  </h4>

                  <p className="text-xs text-slate-400 dark:text-slate-500 line-clamp-2 leading-relaxed mb-4">
                    {item.description}
                  </p>

                  <div className="flex items-center gap-1 text-xs font-bold text-[#0D5C35] dark:text-emerald-400 opacity-60 group-hover:opacity-100 transition-opacity">
                    <Bookmark className="w-3 h-3" />
                    <span>Baca dokumen</span>
                    <ArrowRight className="w-3 h-3 ml-auto group-hover:translate-x-1 transition-transform" />
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