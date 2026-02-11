// File: src/pages/DetailPage.tsx
import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { doc, getDoc } from 'firebase/firestore';
import { db } from '../firebase';
import { ArrowLeft, Calendar, FileText, Image as ImageIcon, Download } from 'lucide-react';
import ReactMarkdown from 'react-markdown';

interface ContentData {
  title: string;
  category: string;
  description: string;
  content: string;
  updatedAt: any;
  imageBase64?: string;
  pdfUrl?: string;
}

const DetailPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [data, setData] = useState<ContentData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      if (!id) return;
      try {
        const docRef = doc(db, "knowledge-base", id);
        const docSnap = await getDoc(docRef);
        if (docSnap.exists()) setData(docSnap.data() as ContentData);
      } catch (error) { console.error("Error:", error); } 
      finally { setLoading(false); }
    };
    fetchData();
  }, [id]);

  // Helper untuk Warna Kategori Dinamis (Sesuai App.tsx)
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
      {/* HEADER */}
      <header className="bg-gradient-to-r from-[#0D5C35] to-[#0A492A] text-white p-6 shadow-lg sticky top-0 z-50">
        <div className="max-w-4xl mx-auto flex items-center">
          
          {/* --- TOMBOL KEMBALI (NAVIGASI PINTAR) --- */}
          <button 
            onClick={() => {
              // Cek jika kategori ada, arahkan ke halaman kategori tersebut
              if (data?.category) {
                navigate(`/category/${data.category}`);
              } else {
                // Jika error/tidak ada kategori, baru ke Home
                navigate('/');
              }
            }} 
            className="mr-4 p-2 hover:bg-white/20 rounded-full transition cursor-pointer"
          >
            <ArrowLeft className="w-6 h-6" />
          </button>
          {/* ---------------------------------------- */}

          <h1 className="text-lg md:text-xl font-bold truncate">Knowledge Base</h1>
        </div>
      </header>

      <main className="max-w-4xl mx-auto mt-8 px-4">
        {/* KARTU UTAMA */}
        <div className="bg-white rounded-3xl shadow-md border border-slate-100 overflow-hidden">
          
          {/* Bagian Judul (Header Kartu) - VERSI BARU */}
          <div className="relative p-8 md:p-12 border-b border-slate-100 overflow-hidden bg-gradient-to-br from-white via-slate-50 to-emerald-50/30">
            
            {/* Ornamen Background (Watermark Icon) */}
            <div className="absolute -right-6 -top-6 opacity-5 pointer-events-none">
              <FileText className="w-64 h-64 text-[#0D5C35]" />
            </div>

            {/* Konten Header */}
            <div className="relative z-10">
              {/* Kategori dengan Desain Baru */}
              <div className="flex items-center space-x-3 mb-6">
                <span className={`inline-flex items-center px-4 py-1.5 rounded-full text-xs font-bold uppercase tracking-widest border shadow-sm ${categoryStyle}`}>
                  <span className="w-1.5 h-1.5 rounded-full bg-current mr-2 opacity-60"></span>
                  {data.category.replace('-', ' ')}
                </span>
                <span className="text-slate-400 text-xs font-medium bg-white px-3 py-1.5 rounded-full border border-slate-100 shadow-sm flex items-center">
                  <Calendar className="w-3 h-3 mr-1.5" />
                  {dateStr}
                </span>
              </div>
              
              {/* Judul Besar & Elegan */}
              <h1 className="text-3xl md:text-5xl font-black text-slate-800 mb-4 leading-tight tracking-tight">
                {data.title}
              </h1>

              {/* Deskripsi Singkat (Sub-judul) */}
              <p className="text-lg text-slate-500 font-medium max-w-2xl leading-relaxed">
                {data.description}
              </p>
            </div>
          </div>

          <div className="p-8 md:p-10">
            
            {/* --- 1. KONTEN MARKDOWN (ISI LENGKAP) --- */}
            <div className="prose prose-slate max-w-none mb-12
              prose-headings:scroll-mt-20
              
              /* H2: Judul Seksi */
              prose-h2:text-2xl prose-h2:font-extrabold prose-h2:text-slate-800 prose-h2:mt-10 prose-h2:mb-6 prose-h2:pb-4 prose-h2:border-b-2 prose-h2:border-slate-100
              
              /* H3: Sub-Judul */
              prose-h3:text-lg prose-h3:font-bold prose-h3:text-[#0D5C35] prose-h3:mt-8 prose-h3:mb-3 
              
              /* Paragraf */
              prose-p:text-slate-600 prose-p:leading-relaxed prose-p:mb-4
              
              /* Angka (Ordered List) - LEBIH HIDUP */
              prose-ol:list-decimal prose-ol:pl-5 prose-ol:space-y-3 prose-ol:text-slate-700 prose-ol:font-medium 
              prose-li:marker:text-[#D4AF37] prose-li:marker:font-extrabold prose-li:marker:text-lg
              
              /* Poin (Bullet List) */
              prose-ul:list-disc prose-ul:pl-6 prose-ul:mt-2 prose-ul:space-y-2 prose-ul:text-slate-600 prose-ul:font-normal 
              prose-ul:marker:text-slate-400
              
              /* Quote Box */
              prose-blockquote:bg-amber-50 prose-blockquote:border-l-4 prose-blockquote:border-amber-400 prose-blockquote:p-4 prose-blockquote:rounded-r-lg prose-blockquote:text-slate-700 prose-blockquote:italic prose-blockquote:font-medium prose-blockquote:shadow-sm
              
              /* Bold Text */
              prose-strong:text-slate-900 prose-strong:font-bold prose-strong:bg-slate-100 prose-strong:px-1 prose-strong:rounded-md
              ">
              
              <ReactMarkdown 
                 components={{
                    li: ({node, ...props}) => <li className="pl-2" {...props} />
                 }}
              >
                {data.content}
              </ReactMarkdown>
            </div>

            {/* --- 2. LAMPIRAN GAMBAR (FLOWCHART) --- */}
            {data.imageBase64 && (
              <div className="mb-10 mt-8">
                <h3 className="text-lg font-bold text-slate-800 mb-4 flex items-center">
                  <span className="w-1 h-6 bg-[#0D5C35] rounded-full mr-3"></span>
                  Lampiran Visual
                </h3>
                <div className="p-2 bg-slate-50 border-2 border-dashed border-slate-200 rounded-2xl">
                  <img 
                    src={data.imageBase64} 
                    alt="Lampiran" 
                    className="w-full h-auto object-contain max-h-[600px] rounded-xl bg-white shadow-sm" 
                  />
                  <p className="text-center text-xs text-slate-400 mt-2 py-1 flex justify-center items-center">
                    <ImageIcon className="w-3 h-3 mr-1" /> Gambar Flowchart / Tabel Pendukung
                  </p>
                </div>
              </div>
            )}

            {/* --- 3. TOMBOL DOWNLOAD PDF (PALING BAWAH) --- */}
            {data.pdfUrl && (
              <div className="mt-12 pt-8 border-t border-slate-100">
                 <h3 className="text-lg font-bold text-slate-800 mb-4 flex items-center">
                  <span className="w-1 h-6 bg-rose-500 rounded-full mr-3"></span>
                  Dokumen Asli
                </h3>
                <a 
                  href={data.pdfUrl} 
                  target="_blank" 
                  rel="noopener noreferrer" 
                  className="group block w-full bg-white border border-rose-100 hover:border-rose-300 rounded-2xl p-1 shadow-sm hover:shadow-md transition-all duration-300"
                >
                  <div className="flex items-center justify-between p-4 bg-gradient-to-r from-rose-50 to-white rounded-xl">
                    <div className="flex items-center space-x-4">
                      <div className="bg-white p-3 rounded-xl shadow-sm text-rose-500 group-hover:scale-110 transition-transform duration-300">
                        <FileText className="w-8 h-8" />
                      </div>
                      <div>
                        <div className="font-bold text-slate-800 group-hover:text-rose-600 transition-colors text-lg">
                          Unduh Dokumen Lengkap (PDF)
                        </div>
                        <div className="text-sm text-slate-500">
                          Klik tombol ini untuk melihat file asli dari Google Drive
                        </div>
                      </div>
                    </div>
                    <div className="hidden md:flex bg-rose-500 text-white px-6 py-3 rounded-xl font-bold items-center shadow-lg shadow-rose-200 group-hover:bg-rose-600 group-hover:shadow-rose-300 transition-all">
                      <Download className="w-5 h-5 mr-2" />
                      Download
                    </div>
                  </div>
                  {/* Tombol Mobile */}
                  <div className="md:hidden bg-rose-500 text-white text-center py-3 rounded-b-xl font-bold text-sm">
                    Tap untuk Download PDF
                  </div>
                </a>
              </div>
            )}

          </div>
        </div>
      </main>
    </div>
  );
};

export default DetailPage;