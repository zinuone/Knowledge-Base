// File: src/pages/AdminDashboard.tsx
import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { signOut } from 'firebase/auth';
import {
    collection, addDoc, deleteDoc, updateDoc, doc, onSnapshot, serverTimestamp, query, orderBy
} from 'firebase/firestore';
import { auth, db } from '../firebase';
import { LogOut, Plus, Trash2, FileText, Image as ImageIcon, HelpCircle, LayoutList, Edit, X, Link as LinkIcon } from 'lucide-react';

interface ContentData {
    id: string;
    title: string;
    category: string;
    description: string;
    content: string;
    imageBase64?: string;
    pdfUrl?: string;
}

interface FAQData {
    id: string;
    question: string;
    answer: string;
}

// Helper Warna Kategori (Sudah Benar)
const getCategoryColor = (cat: string) => {
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

const AdminDashboard: React.FC = () => {
    const navigate = useNavigate();
    const [activeTab, setActiveTab] = useState<'sop' | 'faq'>('sop');
    const [contents, setContents] = useState<ContentData[]>([]);
    const [faqs, setFaqs] = useState<FAQData[]>([]);

    const [isModalOpen, setIsModalOpen] = useState(false);
    const [isFaqModalOpen, setIsFaqModalOpen] = useState(false);
    const [isSaving, setIsSaving] = useState(false);
    const [editingId, setEditingId] = useState<string | null>(null);

    const [formData, setFormData] = useState({ title: '', category: 'psp', description: '', content: '', imageBase64: '', pdfUrl: '' });
    const [faqForm, setFaqForm] = useState({ question: '', answer: '' });

    useEffect(() => {
        const qSop = query(collection(db, "knowledge-base"), orderBy("updatedAt", "desc"));
        const unsubSop = onSnapshot(qSop, (snapshot) => {
            setContents(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })) as ContentData[]);
        });
        const qFaq = query(collection(db, "faqs"), orderBy("createdAt", "desc"));
        const unsubFaq = onSnapshot(qFaq, (snapshot) => {
            setFaqs(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })) as FAQData[]);
        });
        return () => { unsubSop(); unsubFaq(); };
    }, []);

    const handleLogout = async () => { await signOut(auth); navigate('/login'); };

    const handleDeleteSop = async (id: string) => {
        if (confirm("Hapus SOP ini?")) await deleteDoc(doc(db, "knowledge-base", id));
    };
    const handleDeleteFaq = async (id: string) => {
        if (confirm("Hapus FAQ ini?")) await deleteDoc(doc(db, "faqs", id));
    };

    const handleEditSop = (item: ContentData) => {
        setEditingId(item.id);
        setFormData({
            title: item.title, category: item.category, description: item.description, content: item.content,
            imageBase64: item.imageBase64 || '', pdfUrl: item.pdfUrl || ''
        });
        setIsModalOpen(true);
    };
    const handleAddSop = () => {
        setEditingId(null);
        setFormData({ title: '', category: 'psp', description: '', content: '', imageBase64: '', pdfUrl: '' });
        setIsModalOpen(true);
    };

    const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file) {
            if (file.size > 800000) { alert("Ukuran gambar terlalu besar! Maksimal 800KB ya."); return; }
            const reader = new FileReader();
            reader.onloadend = () => { setFormData({ ...formData, imageBase64: reader.result as string }); };
            reader.readAsDataURL(file);
        }
    };
    const handleRemoveImage = () => { setFormData({ ...formData, imageBase64: '' }); };

    const handleEditFaq = (item: FAQData) => { setEditingId(item.id); setFaqForm({ question: item.question, answer: item.answer }); setIsFaqModalOpen(true); };
    const handleAddFaq = () => { setEditingId(null); setFaqForm({ question: '', answer: '' }); setIsFaqModalOpen(true); };

    const handleSaveSop = async (e: React.FormEvent) => {
        e.preventDefault(); setIsSaving(true);
        try {
            if (editingId) { await updateDoc(doc(db, "knowledge-base", editingId), { ...formData, updatedAt: serverTimestamp() }); }
            else { await addDoc(collection(db, "knowledge-base"), { ...formData, updatedAt: serverTimestamp() }); }
            setIsModalOpen(false); setFormData({ title: '', category: 'psp', description: '', content: '', imageBase64: '', pdfUrl: '' }); setEditingId(null);
        } catch (err) { alert("Gagal menyimpan data."); } finally { setIsSaving(false); }
    };

    const handleSaveFaq = async (e: React.FormEvent) => {
        e.preventDefault(); setIsSaving(true);
        try {
            if (editingId) { await updateDoc(doc(db, "faqs", editingId), { ...faqForm, createdAt: serverTimestamp() }); }
            else { await addDoc(collection(db, "faqs"), { ...faqForm, createdAt: serverTimestamp() }); }
            setIsFaqModalOpen(false); setFaqForm({ question: '', answer: '' }); setEditingId(null);
        } catch (err) { alert("Gagal menyimpan FAQ."); } finally { setIsSaving(false); }
    };

    return (
        <div className="min-h-screen bg-slate-50 font-sans">
            <nav className="bg-white border-b border-slate-200 px-6 py-4 flex justify-between items-center sticky top-0 z-10 shadow-sm">
                <div className="flex items-center space-x-3">
                    <div className="bg-[#0D5C35] p-2 rounded-lg"><FileText className="text-white w-5 h-5" /></div>
                    <div><h1 className="font-bold text-slate-800 text-lg leading-none">Admin Panel</h1><span className="text-xs text-slate-500 uppercase">KPKNL Knowledge Base</span></div>
                </div>
                <button onClick={handleLogout} className="flex items-center text-rose-600 hover:text-rose-700 font-medium text-sm"><LogOut className="w-4 h-4 mr-2" /> Keluar</button>
            </nav>

            <main className="max-w-7xl mx-auto p-6 md:p-10">
                <div className="flex space-x-4 mb-8 border-b border-slate-200">
                    <button onClick={() => setActiveTab('sop')} className={`pb-4 px-4 font-bold flex items-center transition-colors ${activeTab === 'sop' ? 'text-[#0D5C35] border-b-2 border-[#0D5C35]' : 'text-slate-400 hover:text-slate-600'}`}><LayoutList className="w-5 h-5 mr-2" /> Data SOP ({contents.length})</button>
                    <button onClick={() => setActiveTab('faq')} className={`pb-4 px-4 font-bold flex items-center transition-colors ${activeTab === 'faq' ? 'text-[#0D5C35] border-b-2 border-[#0D5C35]' : 'text-slate-400 hover:text-slate-600'}`}><HelpCircle className="w-5 h-5 mr-2" /> Data FAQ ({faqs.length})</button>
                </div>

                {activeTab === 'sop' && (
                    <div>
                        <div className="flex justify-end mb-6">
                            <button onClick={handleAddSop} className="flex items-center bg-[#0D5C35] text-white px-5 py-2.5 rounded-xl font-bold shadow-lg hover:bg-[#0A492A] transition"><Plus className="w-5 h-5 mr-2" /> Tambah SOP</button>
                        </div>
                        <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
                            <table className="w-full text-left border-collapse">
                                <thead className="bg-slate-50 text-slate-500 text-xs uppercase font-bold">
                                    <tr><th className="p-5">Judul</th><th className="p-5">Kategori</th><th className="p-5 text-center">Aksi</th></tr>
                                </thead>
                                <tbody className="divide-y divide-slate-100">
                                    {contents.map(item => (
                                        <tr key={item.id} className="hover:bg-slate-50 transition-colors">
                                            <td className="p-5 font-medium">{item.title}</td>
                                            {/* --- PERBAIKAN DI SINI: LABEL WARNA-WARNI --- */}
                                            <td className="p-5">
                                                <span className={`px-3 py-1 rounded-full text-xs font-bold uppercase border ${getCategoryColor(item.category)}`}>
                                                    {item.category.replace('-', ' ')}
                                                </span>
                                            </td>
                                            {/* --------------------------------------------- */}
                                            <td className="p-5 text-center flex justify-center space-x-2">
                                                <button onClick={() => handleEditSop(item)} className="p-2 text-amber-600 hover:bg-amber-50 rounded-lg transition"><Edit className="w-4 h-4" /></button>
                                                <button onClick={() => handleDeleteSop(item.id)} className="p-2 text-rose-600 hover:bg-rose-50 rounded-lg transition"><Trash2 className="w-4 h-4" /></button>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                            {contents.length === 0 && <div className="p-10 text-center text-slate-400">Belum ada data SOP.</div>}
                        </div>
                    </div>
                )}

                {activeTab === 'faq' && (
                    <div>
                        <div className="flex justify-end mb-6">
                            <button onClick={handleAddFaq} className="flex items-center bg-[#0D5C35] text-white px-5 py-2.5 rounded-xl font-bold shadow-lg hover:bg-[#0A492A] transition"><Plus className="w-5 h-5 mr-2" /> Tambah FAQ</button>
                        </div>
                        <div className="grid gap-4">
                            {faqs.map(item => (
                                <div key={item.id} className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm flex justify-between items-start">
                                    <div className="flex-grow pr-4">
                                        <h3 className="font-bold text-slate-800 text-lg mb-1">Q: {item.question}</h3>
                                        <p className="text-slate-600">A: {item.answer}</p>
                                    </div>
                                    <div className="flex flex-col space-y-2 flex-shrink-0">
                                        <button onClick={() => handleEditFaq(item)} className="text-amber-600 hover:bg-amber-50 p-2 rounded-lg"><Edit className="w-4 h-4" /></button>
                                        <button onClick={() => handleDeleteFaq(item.id)} className="text-rose-600 hover:bg-rose-50 p-2 rounded-lg"><Trash2 className="w-4 h-4" /></button>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                )}
            </main>

            {/* MODAL SOP */}
            {isModalOpen && (
                <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4 backdrop-blur-sm">
                    <div className="bg-white rounded-2xl w-full max-w-2xl p-6 overflow-y-auto max-h-[90vh]">
                        <h3 className="font-bold text-lg mb-4 flex items-center">
                            {editingId ? <Edit className="w-5 h-5 mr-2 text-amber-600" /> : <Plus className="w-5 h-5 mr-2 text-[#0D5C35]" />}
                            {editingId ? 'Edit SOP' : 'Tambah SOP Baru'}
                        </h3>
                        <form onSubmit={handleSaveSop} className="space-y-4">
                            <input type="text" placeholder="Judul" className="w-full p-3 border rounded-lg" required value={formData.title} onChange={e => setFormData({ ...formData, title: e.target.value })} />

                            <select className="w-full p-3 border rounded-lg" value={formData.category} onChange={e => setFormData({ ...formData, category: e.target.value })}>
                                <option value="psp">PSP</option><option value="sewa">SEWA</option><option value="penjualan">PENJUALAN</option><option value="penghapusan">PENGHAPUSAN</option><option value="pinjam-pakai">PINJAM PAKAI</option><option value="penggunaan-sementara">PENGGUNAAN SEMENTARA</option><option value="alih-status">ALIH STATUS</option>
                            </select>

                            <input type="text" placeholder="Deskripsi Singkat" className="w-full p-3 border rounded-lg" required value={formData.description} onChange={e => setFormData({ ...formData, description: e.target.value })} />

                            {/* UPLOAD GAMBAR */}
                            <div className="border-2 border-dashed border-slate-300 rounded-lg p-4 bg-slate-50">
                                <label className="block text-sm font-bold text-slate-700 mb-2">Upload Flowchart / Gambar (Opsional)</label>
                                {!formData.imageBase64 ? (
                                    <div className="flex flex-col items-center">
                                        <input type="file" accept="image/*" onChange={handleImageUpload} className="block w-full text-sm text-slate-500 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-emerald-50 file:text-emerald-700 hover:file:bg-emerald-100" />
                                        <p className="text-xs text-slate-400 mt-2">Maksimal 800KB (JPG/PNG)</p>
                                    </div>
                                ) : (
                                    <div className="relative inline-block">
                                        <img src={formData.imageBase64} alt="Preview" className="max-h-40 rounded-lg border shadow-sm" />
                                        <button type="button" onClick={handleRemoveImage} className="absolute -top-2 -right-2 bg-rose-500 text-white rounded-full p-1 shadow-md hover:bg-rose-600"><X className="w-4 h-4" /></button>
                                    </div>
                                )}
                            </div>

                            {/* INPUT PDF */}
                            <div className="mb-4 mt-4">
                                <label className="block text-sm font-bold text-slate-700 mb-1">Link File PDF / Dokumen (Opsional)</label>
                                <div className="relative">
                                    <LinkIcon className="absolute left-3 top-3.5 w-4 h-4 text-slate-400" />
                                    <input type="url" placeholder="https://drive.google.com/..." className="w-full p-3 pl-10 border rounded-lg text-sm bg-slate-50 focus:ring-[#0D5C35] focus:border-[#0D5C35]" value={formData.pdfUrl} onChange={e => setFormData({ ...formData, pdfUrl: e.target.value })} />
                                </div>
                            </div>

                            <textarea placeholder="Isi Lengkap" rows={5} className="w-full p-3 border rounded-lg" required value={formData.content} onChange={e => setFormData({ ...formData, content: e.target.value })}></textarea>
                            <div className="flex justify-end gap-2 mt-4"><button type="button" onClick={() => setIsModalOpen(false)} className="px-4 py-2 text-slate-500">Batal</button><button type="submit" disabled={isSaving} className="px-4 py-2 bg-[#0D5C35] text-white rounded-lg font-bold">{isSaving ? 'Menyimpan...' : (editingId ? 'Update Data' : 'Simpan Data')}</button></div>
                        </form>
                    </div>
                </div>
            )}

            {/* MODAL FAQ */}
            {isFaqModalOpen && (
                <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4 backdrop-blur-sm">
                    <div className="bg-white rounded-2xl w-full max-w-lg p-6">
                        <h3 className="font-bold text-lg mb-4 flex items-center">{editingId ? <Edit className="w-5 h-5 mr-2 text-amber-600" /> : <Plus className="w-5 h-5 mr-2 text-[#0D5C35]" />}{editingId ? 'Edit FAQ' : 'Tambah FAQ Baru'}</h3>
                        <form onSubmit={handleSaveFaq} className="space-y-4">
                            <div><label className="block text-sm font-bold text-slate-700 mb-1">Pertanyaan (Q)</label><input type="text" placeholder="Contoh: Cara Reset Password SIMAN?" className="w-full p-3 border rounded-lg" required value={faqForm.question} onChange={e => setFaqForm({ ...faqForm, question: e.target.value })} /></div>
                            <div><label className="block text-sm font-bold text-slate-700 mb-1">Jawaban (A)</label><textarea placeholder="Tulis jawaban singkat di sini..." rows={3} className="w-full p-3 border rounded-lg" required value={faqForm.answer} onChange={e => setFaqForm({ ...faqForm, answer: e.target.value })}></textarea></div>
                            <div className="flex justify-end gap-2 mt-4"><button type="button" onClick={() => setIsFaqModalOpen(false)} className="px-4 py-2 text-slate-500">Batal</button><button type="submit" className="px-4 py-2 bg-[#0D5C35] text-white rounded-lg font-bold">{editingId ? 'Update FAQ' : 'Simpan FAQ'}</button></div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
};

export default AdminDashboard;