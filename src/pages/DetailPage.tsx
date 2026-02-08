// File: src/pages/DetailPage.tsx
import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { doc, getDoc } from 'firebase/firestore';
import { db } from '../firebase'; // Pastikan path benar
import { ArrowLeft, Calendar, FileText } from 'lucide-react';

interface ContentData {
  title: string;
  category: string;
  description: string;
  content: string;
  updatedAt: any;
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
        
        if (docSnap.exists()) {
          setData(docSnap.data() as ContentData);
        } else {
          setData(null);
        }
      } catch (error) {
        console.error("Error fetching document:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [id]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#0D5C35]"></div>
      </div>
    );
  }

  if (!data) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-gray-50">
        <h2 className="text-2xl font-bold text-gray-800">Data Tidak Ditemukan</h2>
        <p className="text-gray-500 mb-4">Mungkin data ini sudah dihapus oleh Admin.</p>
        <button onClick={() => navigate('/')} className="px-6 py-2 bg-[#0D5C35] text-white rounded-full hover:bg-[#0A492A] transition">
          Kembali ke Beranda
        </button>
      </div>
    );
  }

  // Format Tanggal (Kalau ada timestamp)
  const dateStr = data.updatedAt ? new Date(data.updatedAt.seconds * 1000).toLocaleDateString('id-ID', {
    day: 'numeric', month: 'long', year: 'numeric'
  }) : 'Baru saja';

  return (
    <div className="min-h-screen bg-gray-50 pb-20 font-sans">
      {/* Header Detail */}
      <header className="bg-gradient-to-r from-[#0D5C35] to-[#0A492A] text-white p-6 shadow-lg sticky top-0 z-50">
        <div className="max-w-4xl mx-auto flex items-center">
          <button onClick={() => navigate('/')} className="mr-4 p-2 hover:bg-white/20 rounded-full transition cursor-pointer" title="Kembali">
            <ArrowLeft className="w-6 h-6" />
          </button>
          <h1 className="text-lg md:text-xl font-bold truncate">Knowledge Base</h1>
        </div>
      </header>

      {/* Konten Utama */}
      <main className="max-w-4xl mx-auto mt-8 px-4 animate-in fade-in slide-in-from-bottom-4 duration-500">
        <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-8">
          <div className="flex justify-between items-start mb-4">
             <span className="inline-block px-3 py-1 bg-amber-100 text-amber-800 rounded-full text-xs font-bold uppercase tracking-wider">
               {data.category}
             </span>
          </div>
          
          <h1 className="text-3xl font-bold text-slate-900 mb-2">{data.title}</h1>
          
          <div className="flex items-center text-slate-500 text-sm mb-8 border-b border-slate-100 pb-6">
            <Calendar className="w-4 h-4 mr-2" />
            Diperbarui: {dateStr}
          </div>

          <div className="prose prose-slate max-w-none">
            {/* Trik memecah paragraf berdasarkan Enter (\n) */}
            {data.content.split('\n').map((paragraph, idx) => (
              paragraph.trim() !== "" && (
                <p key={idx} className="text-lg leading-relaxed text-slate-700 mb-4">
                  {paragraph}
                </p>
              )
            ))}
          </div>

          {/* Footer Card */}
          <div className="mt-10 pt-6 border-t border-slate-100 text-slate-400 text-sm flex items-center">
            <FileText className="w-4 h-4 mr-2" />
            Dokumen Resmi Knowledge Base KPKNL Kendari
          </div>
        </div>
      </main>
    </div>
  );
};

export default DetailPage;