// File: src/pages/CategoryPage.tsx
import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { collection, query, where, getDocs } from 'firebase/firestore';
import { db } from '../firebase';
import { ArrowLeft, FileText } from 'lucide-react';

interface ContentData {
    id: string;
    title: string;
    description: string;
}

const CategoryPage: React.FC = () => {
    const { categoryId } = useParams<{ categoryId: string }>(); // Tangkap 'psp', 'sewa', dll
    const navigate = useNavigate();
    const [documents, setDocuments] = useState<ContentData[]>([]);
    const [loading, setLoading] = useState(true);

    // Ubah kode 'psp' jadi Judul Bagus 'PSP'
    const categoryTitle = categoryId?.replace('-', ' ').toUpperCase();

    useEffect(() => {
        const fetchCategoryDocs = async () => {
            if (!categoryId) return;
            try {
                // Ambil data dari Firebase yang kategorinya COCOK dengan tombol yang diklik
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
        <div className="min-h-screen bg-slate-50 font-sans">
            <header className="bg-[#0D5C35] text-white p-6 shadow-md sticky top-0 z-50">
                <div className="max-w-4xl mx-auto flex items-center">
                    <button onClick={() => navigate('/')} className="mr-4 hover:bg-white/20 p-2 rounded-full transition"><ArrowLeft /></button>
                    <h1 className="text-xl font-bold">Kategori: {categoryTitle}</h1>
                </div>
            </header>

            <main className="max-w-4xl mx-auto p-6 mt-4">
                {loading ? (
                    <div className="text-center py-10">Memuat data...</div>
                ) : documents.length > 0 ? (
                    <div className="grid gap-4">
                        {documents.map(doc => (
                            <div
                                key={doc.id}
                                onClick={() => navigate(`/detail/${doc.id}`)}
                                className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm hover:shadow-md cursor-pointer transition"
                            >
                                <div className="flex items-start">
                                    <div className="bg-emerald-50 p-3 rounded-lg mr-4 text-[#0D5C35]"><FileText /></div>
                                    <div>
                                        <h3 className="font-bold text-lg text-slate-800">{doc.title}</h3>
                                        <p className="text-slate-600 mt-1">{doc.description}</p>
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                ) : (
                    <div className="text-center py-20 bg-white rounded-xl border border-dashed border-slate-300">
                        <p className="text-slate-500 font-medium">Belum ada SOP untuk kategori {categoryTitle}.</p>
                        <p className="text-sm text-slate-400 mt-1">Silakan minta Admin untuk menambahkan data.</p>
                    </div>
                )}
            </main>
        </div>
    );
};

export default CategoryPage;