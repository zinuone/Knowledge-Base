// File: src/pages/CategoryPage.tsx
import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { collection, query, where, getDocs } from 'firebase/firestore';
import { db } from '../firebase';
import {
    ArrowLeft, FileText, Hammer, Key, Trash2, Clock, Timer, RefreshCw, Gift, ArrowRight
} from 'lucide-react';

interface ContentData {
    id: string;
    title: string;
    description: string;
}

const CategoryPage: React.FC = () => {
    const { categoryId } = useParams<{ categoryId: string }>();
    const navigate = useNavigate();
    const [documents, setDocuments] = useState<ContentData[]>([]);
    const [loading, setLoading] = useState(true);

    const categoryTitle = categoryId?.replace('-', ' ').toUpperCase();

    // Helper untuk styling & ikon dinamis berdasarkan Kategori (Biar seragam dengan Halaman Utama)
    const getCategoryMeta = (catId: string | undefined) => {
        switch (catId) {
            case 'psp': return { icon: <FileText className="w-10 h-10" />, color: 'text-emerald-600', bg: 'bg-emerald-100', hoverBg: 'group-hover:bg-emerald-600' };
            case 'penjualan': return { icon: <Hammer className="w-10 h-10" />, color: 'text-amber-600', bg: 'bg-amber-100', hoverBg: 'group-hover:bg-amber-600' };
            case 'sewa': return { icon: <Key className="w-10 h-10" />, color: 'text-blue-600', bg: 'bg-blue-100', hoverBg: 'group-hover:bg-blue-600' };
            case 'penghapusan': return { icon: <Trash2 className="w-10 h-10" />, color: 'text-rose-600', bg: 'bg-rose-100', hoverBg: 'group-hover:bg-rose-600' };
            case 'pinjam-pakai': return { icon: <Clock className="w-10 h-10" />, color: 'text-indigo-600', bg: 'bg-indigo-100', hoverBg: 'group-hover:bg-indigo-600' };
            case 'penggunaan-sementara': return { icon: <Timer className="w-10 h-10" />, color: 'text-purple-600', bg: 'bg-purple-100', hoverBg: 'group-hover:bg-purple-600' };
            case 'alih-status': return { icon: <RefreshCw className="w-10 h-10" />, color: 'text-teal-600', bg: 'bg-teal-100', hoverBg: 'group-hover:bg-teal-600' };
            case 'hibah': return { icon: <Gift className="w-10 h-10" />, color: 'text-orange-600', bg: 'bg-orange-100', hoverBg: 'group-hover:bg-orange-600' };
            default: return { icon: <FileText className="w-10 h-10" />, color: 'text-[#0D5C35]', bg: 'bg-[#EAF2EE]', hoverBg: 'group-hover:bg-[#0D5C35]' };
        }
    };

    const meta = getCategoryMeta(categoryId);

    useEffect(() => {
        const fetchCategoryDocs = async () => {
            if (!categoryId) return;
            try {
                const q = query(collection(db, "knowledge-base"), where("category", "==", categoryId));
                const querySnapshot = await getDocs(q);

                const docs = querySnapshot.docs.map(doc => ({
                    id: doc.id,
                    ...doc.data()
                })) as ContentData[];

                setDocuments(docs);
            } catch (error) {
                console.error("Error ambil data:", error);
            } finally {
                setLoading(false);
            }
        };

        fetchCategoryDocs();
    }, [categoryId]);

    return (
        <div className="min-h-screen bg-[#F8FAF9] font-sans pb-20">
            {/* HEADER MEWAH */}
            <header className="bg-gradient-to-r from-[#0D5C35] to-[#0A492A] text-white p-8 md:p-12 shadow-lg relative overflow-hidden">
                <div className="absolute -right-10 -top-10 opacity-10 pointer-events-none transform rotate-12">
                    {meta.icon}
                </div>

                <div className="max-w-6xl mx-auto relative z-10 flex flex-col md:flex-row items-start md:items-center justify-between">
                    <div>
                        <button onClick={() => navigate('/')} className="mb-6 inline-flex items-center text-emerald-100 hover:text-white bg-white/10 hover:bg-white/20 px-4 py-2 rounded-full transition-all text-sm font-bold border border-white/10">
                            <ArrowLeft className="w-4 h-4 mr-2" /> Kembali ke Beranda
                        </button>
                        <h1 className="text-4xl md:text-5xl font-black tracking-tight mb-2">Kategori: {categoryTitle}</h1>
                        <p className="text-emerald-100 text-lg">Daftar informasi dan prosedur terkait layanan {categoryTitle}.</p>
                    </div>

                    {/* Icon besar di header khusus Desktop */}
                    <div className="hidden md:flex bg-white/10 p-6 rounded-3xl backdrop-blur-sm border border-white/20 shadow-xl">
                        <div className="text-white">
                            {React.cloneElement(meta.icon as React.ReactElement, { className: 'w-16 h-16' })}
                        </div>
                    </div>
                </div>
            </header>

            <main className="max-w-6xl mx-auto px-4 sm:px-6 mt-12">
                {loading ? (
                    <div className="text-center py-20 flex flex-col items-center">
                        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#0D5C35] mb-4"></div>
                        <p className="text-slate-500 font-bold">Menyiapkan Dokumen...</p>
                    </div>
                ) : documents.length > 0 ? (

                    // REVISI 4: GRID KOTAK-KOTAK
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                        {documents.map(doc => (
                            <div
                                key={doc.id}
                                onClick={() => navigate(`/detail/${doc.id}`)}
                                className="bg-white rounded-3xl p-8 border border-slate-100 shadow-sm hover:shadow-2xl hover:-translate-y-2 cursor-pointer transition-all duration-300 group flex flex-col h-full"
                            >
                                {/* Icon Dinamis */}
                                <div className={`mb-6 p-4 rounded-2xl w-fit transition-colors duration-300 ${meta.bg} ${meta.color} ${meta.hoverBg} group-hover:text-white`}>
                                    {meta.icon}
                                </div>

                                <h3 className="font-black text-xl text-slate-800 mb-3 group-hover:text-[#0D5C35] transition-colors line-clamp-2">
                                    {doc.title}
                                </h3>

                                <p className="text-slate-500 text-base leading-relaxed line-clamp-3 flex-grow mb-6">
                                    {doc.description}
                                </p>

                                {/* Tombol Aksi di dalam Card */}
                                <div className={`mt-auto pt-5 border-t border-slate-100 flex items-center justify-between font-bold text-sm transition-all duration-300 ${meta.color} opacity-80 group-hover:opacity-100`}>
                                    <span>Baca Selengkapnya</span>
                                    <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
                                </div>
                            </div>
                        ))}
                    </div>
                ) : (
                    // TAMPILAN JIKA DATA KOSONG
                    <div className="text-center py-24 bg-white rounded-3xl border-2 border-dashed border-slate-200 shadow-sm max-w-2xl mx-auto">
                        <div className={`mx-auto w-24 h-24 mb-6 rounded-full flex items-center justify-center ${meta.bg} ${meta.color} opacity-50`}>
                            {meta.icon}
                        </div>
                        <h3 className="text-2xl font-bold text-slate-800 mb-2">Belum Ada Informasi</h3>
                        <p className="text-slate-500 text-lg px-6">Informasi dan SOP untuk layanan <b>{categoryTitle}</b> sedang dalam tahap penyusunan oleh Admin.</p>
                        <button onClick={() => navigate('/')} className="mt-8 px-8 py-3 bg-[#0D5C35] hover:bg-[#0A492A] text-white rounded-xl font-bold shadow-lg transition-all">
                            Kembali ke Beranda
                        </button>
                    </div>
                )}
            </main>
        </div>
    );
};

export default CategoryPage;