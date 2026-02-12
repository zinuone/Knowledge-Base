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
  Eye, ThumbsUp, ThumbsDown, Share2, Check, Home, ChevronRight
} from 'lucide-react';
import ReactMarkdown from 'react-markdown';

// Tipe Data
interface ContentData {
  id: string;
  title: string;
  category: string;
  description: string;
  content: string;
  updatedAt: any;
  imageBase64?: string;
  pdfUrl?: string;
  views?: number;
  likes?: number;
  dislikes?: number;
}

const DetailPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();

  // State Utama
  const [data, setData] = useState<ContentData | null>(null);
  const [relatedDocs, setRelatedDocs] = useState<ContentData[]>([]);

  // State UI
  const [loading, setLoading] = useState(true);
  const [hasVoted, setHasVoted] = useState(false);
  const [isCopied, setIsCopied] = useState(false);

  useEffect(() => {
    const fetchData = async () => {
      if (!id) return;
      setLoading(true);
      window.scrollTo(0, 0);

      try {
        const docRef = doc(db, "knowledge-base", id);
        const docSnap = await getDoc(docRef);

        if (docSnap.exists()) {
          const mainData = { id: docSnap.id, ...docSnap.data() } as ContentData;
          setData(mainData);

          const sessionKey = `viewed_${id}`;
          if (!sessionStorage.getItem(sessionKey)) {
            await updateDoc(docRef, { views: increment(1) });
            sessionStorage.setItem(sessionKey, 'true');
          }

          const relatedQuery = query(
            collection(db, "knowledge-base"),
            where("category", "==", mainData.category),
            limit(4)
          );

          const relatedSnap = await getDocs(relatedQuery);
          const relatedList = relatedSnap.docs
            .map(d => ({ id: d.id, ...d.data() } as ContentData))
            .filter(item => item.id !== id)
            .slice(0, 3);

          setRelatedDocs(relatedList);
        }
      } catch (error) { console.error("Error:", error); }
      finally { setLoading(false); }
    };
    fetchData();
  }, [id]);

  const handleVote = async (type: 'like' | 'dislike') => {
    if (!id || hasVoted) return;
    try {
      const docRef = doc(db, "knowledge-base", id);
      await updateDoc(docRef, {
        [type === 'like' ? 'likes' : 'dislikes']: increment(1)
      });
      setHasVoted(true);
      alert("Terima kasih atas masukan Anda!");
    } catch (error) { console.error("Gagal voting:", error); }
  };

  const handleShare = () => {
    navigator.clipboard.writeText(window.location.href);
    setIsCopied(true);
    setTimeout(() => setIsCopied(false), 2000);
  };

  const getCategoryStyle = (cat: string) => {
    switch (cat) {
      case 'psp': return 'bg-emerald-100 text-emerald-800 border-emerald-200';
      case 'penjualan': return 'bg-amber-100 text-amber-800 border-amber-200';
      case 'sewa': return 'bg-blue-100 text-blue-800 border-blue-200';
      case 'penghapusan': return 'bg-rose-100 text-rose-800 border-rose-200';
      case 'pinjam-pakai': return 'bg-indigo-100 text-indigo-800 border-indigo-200';
      case 'penggunaan-sementara': return 'bg-purple-100 text-purple-800 border-purple-200';
      case 'alih-status': return 'bg-teal-100 text-teal-800 border-teal-200';
      default: return 'bg-slate-100 text-slate-800 border-slate-200';
    }
  };

  if (loading) return <div className="min-h-screen flex items-center justify-center bg-gray-50"><div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#0D5C35]"></div></div>;
  if (!data) return <div className="p-10 text-center">Data tidak ditemukan.</div>;

  const dateStr = data.updatedAt ? new Date(data.updatedAt.seconds * 1000).toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' }) : 'Baru saja';
  const categoryStyle = getCategoryStyle(data.category);

  return (
    <div className="min-h-screen bg-[#F8FAF9] pb-20 font-sans">
      <header className="bg-gradient-to-r from-[#0D5C35] to-[#0A492A] text-white p-6 shadow-lg sticky top-0 z-50">
        <div className="max-w-4xl mx-auto flex items-center justify-between">
          <div className="flex items-center">
            <button
              onClick={() => { if (data?.category) { navigate(`/category/${data.category}`); } else { navigate('/'); } }}
              aria-label="Kembali"
              title="Kembali ke halaman sebelumnya"
              className="mr-4 p-2 hover:bg-white/20 rounded-full transition cursor-pointer"
            >
              <ArrowLeft className="w-6 h-6" />
            </button>
            <h1 className="text-lg md:text-xl font-bold truncate">Knowledge Base</h1>
          </div>
          <button
            onClick={handleShare}
            aria-label="Bagikan Halaman Ini"
            title="Salin Link Halaman"
            className="flex items-center bg-white/10 hover:bg-white/20 px-3 py-2 rounded-lg transition-all text-xs font-bold border border-white/20"
          >
            {isCopied ? <Check className="w-4 h-4 mr-2 text-emerald-300" /> : <Share2 className="w-4 h-4 mr-2" />}
            {isCopied ? "Tersalin!" : "Bagikan"}
          </button>
        </div>
      </header>

      <main className="max-w-4xl mx-auto mt-8 px-4">
        <nav aria-label="Breadcrumb" className="flex items-center text-xs md:text-sm text-slate-500 mb-6 space-x-2 overflow-x-auto whitespace-nowrap pb-2">
          <button onClick={() => navigate('/')} className="hover:text-[#0D5C35] flex items-center transition-colors" aria-label="Ke Beranda">
            <Home className="w-3 h-3 mr-1" /> Beranda
          </button>
          <ChevronRight className="w-3 h-3 text-slate-300 flex-shrink-0" />
          <button onClick={() => navigate(`/category/${data.category}`)} className="hover:text-[#0D5C35] uppercase font-bold transition-colors" aria-label={`Ke Kategori ${data.category}`}>
            {data.category.replace('-', ' ')}
          </button>
          <ChevronRight className="w-3 h-3 text-slate-300 flex-shrink-0" />
          <span className="text-slate-800 font-medium truncate max-w-[150px] md:max-w-xs">{data.title}</span>
        </nav>

        <div className="bg-white rounded-3xl shadow-md border border-slate-100 overflow-hidden animate-in fade-in duration-500">
          <div className="relative p-8 md:p-12 border-b border-slate-100 overflow-hidden bg-gradient-to-br from-white via-slate-50 to-emerald-50/30">
            <div className="absolute -right-6 -top-6 opacity-5 pointer-events-none">
              <FileText className="w-64 h-64 text-[#0D5C35]" />
            </div>
            <div className="relative z-10">
              <div className="flex flex-wrap items-center gap-3 mb-6">
                <span className={`inline-flex items-center px-4 py-1.5 rounded-full text-xs font-bold uppercase tracking-widest border shadow-sm ${categoryStyle}`}>
                  <span className="w-1.5 h-1.5 rounded-full bg-current mr-2 opacity-60"></span>
                  {data.category.replace('-', ' ')}
                </span>
                <span className="text-slate-400 text-xs font-medium bg-white px-3 py-1.5 rounded-full border border-slate-100 shadow-sm flex items-center">
                  <Calendar className="w-3 h-3 mr-1.5" />
                  {dateStr}
                </span>
                <span className="text-slate-400 text-xs font-medium bg-white px-3 py-1.5 rounded-full border border-slate-100 shadow-sm flex items-center">
                  <Eye className="w-3 h-3 mr-1.5" />
                  {data.views || 0} Views
                </span>
              </div>
              <h1 className="text-3xl md:text-5xl font-black text-slate-800 mb-4 leading-tight tracking-tight">
                {data.title}
              </h1>
              <p className="text-lg text-slate-500 font-medium max-w-2xl leading-relaxed">
                {data.description}
              </p>
            </div>
          </div>

          <div className="p-8 md:p-10">
            {/* FIX: Hapus prop components={{li:...}} karena sudah ditangani prose */}
            <div className="prose prose-slate max-w-none mb-12
              prose-headings:scroll-mt-20
              prose-h2:text-2xl prose-h2:font-extrabold prose-h2:text-slate-800 prose-h2:mt-10 prose-h2:mb-6 prose-h2:pb-4 prose-h2:border-b-2 prose-h2:border-slate-100
              prose-h3:text-lg prose-h3:font-bold prose-h3:text-[#0D5C35] prose-h3:mt-8 prose-h3:mb-3 
              prose-p:text-slate-600 prose-p:leading-relaxed prose-p:mb-4
              prose-li:marker:text-[#D4AF37] prose-li:marker:font-extrabold
              prose-strong:text-slate-900 prose-strong:font-bold prose-strong:bg-slate-100 prose-strong:px-1 prose-strong:rounded-md
              ">
              <ReactMarkdown>
                {data.content}
              </ReactMarkdown>
            </div>

            <div className="bg-slate-50 border border-slate-200 rounded-2xl p-6 mb-10 flex flex-col md:flex-row items-center justify-between">
              <div>
                <h4 className="font-bold text-slate-800">Apakah informasi ini membantu?</h4>
                <p className="text-sm text-slate-500">Bantu kami meningkatkan kualitas layanan.</p>
              </div>
              <div className="flex space-x-3 mt-4 md:mt-0">
                <button
                  onClick={() => handleVote('like')}
                  disabled={hasVoted}
                  aria-label="Suka"
                  title="Informasi ini membantu"
                  className={`flex items-center px-4 py-2 rounded-xl font-bold transition-all ${hasVoted ? 'bg-slate-200 text-slate-400 cursor-not-allowed' : 'bg-white border border-slate-200 text-slate-600 hover:bg-emerald-50 hover:text-emerald-600 hover:border-emerald-200 shadow-sm'}`}
                >
                  <ThumbsUp className="w-4 h-4 mr-2" /> Ya, Membantu
                </button>
                <button
                  onClick={() => handleVote('dislike')}
                  disabled={hasVoted}
                  aria-label="Tidak Suka"
                  title="Informasi ini kurang membantu"
                  className={`flex items-center px-4 py-2 rounded-xl font-bold transition-all ${hasVoted ? 'bg-slate-200 text-slate-400 cursor-not-allowed' : 'bg-white border border-slate-200 text-slate-600 hover:bg-rose-50 hover:text-rose-600 hover:border-rose-200 shadow-sm'}`}
                >
                  <ThumbsDown className="w-4 h-4 mr-2" /> Tidak
                </button>
              </div>
            </div>

            {data.imageBase64 && (
              <div className="mb-10 mt-8">
                <h3 className="text-lg font-bold text-slate-800 mb-4 flex items-center">
                  <span className="w-1 h-6 bg-[#0D5C35] rounded-full mr-3"></span>
                  Lampiran Visual
                </h3>
                <div className="p-2 bg-slate-50 border-2 border-dashed border-slate-200 rounded-2xl">
                  <img src={data.imageBase64} alt="Lampiran" className="w-full h-auto object-contain max-h-[600px] rounded-xl bg-white shadow-sm" />
                  <p className="text-center text-xs text-slate-400 mt-2 py-1 flex justify-center items-center">
                    <ImageIcon className="w-3 h-3 mr-1" /> Gambar Flowchart / Tabel Pendukung
                  </p>
                </div>
              </div>
            )}

            {data.pdfUrl && (
              <div className="mt-12 pt-8 border-t border-slate-100">
                <h3 className="text-lg font-bold text-slate-800 mb-4 flex items-center">
                  <span className="w-1 h-6 bg-rose-500 rounded-full mr-3"></span>
                  Dokumen Asli
                </h3>
                <a href={data.pdfUrl} target="_blank" rel="noopener noreferrer" className="group block w-full bg-white border border-rose-100 hover:border-rose-300 rounded-2xl p-1 shadow-sm hover:shadow-md transition-all duration-300">
                  <div className="flex items-center justify-between p-4 bg-gradient-to-r from-rose-50 to-white rounded-xl">
                    <div className="flex items-center space-x-4">
                      <div className="bg-white p-3 rounded-xl shadow-sm text-rose-500 group-hover:scale-110 transition-transform duration-300"><FileText className="w-8 h-8" /></div>
                      <div>
                        <div className="font-bold text-slate-800 group-hover:text-rose-600 transition-colors text-lg">Unduh Dokumen Lengkap (PDF)</div>
                        <div className="text-sm text-slate-500">Klik tombol ini untuk melihat file asli dari Google Drive</div>
                      </div>
                    </div>
                    <div className="hidden md:flex bg-rose-500 text-white px-6 py-3 rounded-xl font-bold items-center shadow-lg shadow-rose-200 group-hover:bg-rose-600 group-hover:shadow-rose-300 transition-all">
                      <Download className="w-5 h-5 mr-2" /> Download
                    </div>
                  </div>
                  <div className="md:hidden bg-rose-500 text-white text-center py-3 rounded-b-xl font-bold text-sm">Tap untuk Download PDF</div>
                </a>
              </div>
            )}
          </div>
        </div>

        {relatedDocs.length > 0 && (
          <div className="mt-16 mb-10">
            <h3 className="text-xl font-bold text-slate-800 mb-6 flex items-center">
              <div className="w-1 h-6 bg-[#0D5C35] rounded-full mr-3"></div>
              Lihat Juga Informasi Terkait
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {relatedDocs.map((item) => (
                <div
                  key={item.id}
                  onClick={() => navigate(`/detail/${item.id}`)}
                  className="bg-white p-6 rounded-2xl border border-slate-100 shadow-sm hover:shadow-md hover:border-emerald-100 cursor-pointer transition-all group"
                >
                  <span className={`inline-block px-2 py-1 rounded text-[10px] font-bold uppercase tracking-wider mb-3 border ${getCategoryStyle(item.category)}`}>
                    {item.category.replace('-', ' ')}
                  </span>
                  <h4 className="font-bold text-slate-800 group-hover:text-[#0D5C35] transition-colors line-clamp-2 mb-2">
                    {item.title}
                  </h4>
                  <p className="text-xs text-slate-400 line-clamp-2">
                    {item.description}
                  </p>
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