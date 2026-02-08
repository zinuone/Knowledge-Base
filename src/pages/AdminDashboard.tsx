// File: src/pages/AdminDashboard.tsx
import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { signOut } from 'firebase/auth';
import {
    collection, addDoc, deleteDoc, updateDoc, doc, onSnapshot, serverTimestamp, query, orderBy
} from 'firebase/firestore';
import { auth, db } from '../firebase';
import { LogOut, Plus, Trash2, FileText, Save, HelpCircle, LayoutList, Edit } from 'lucide-react';

// Tipe Data
interface ContentData {
    id: string;
    title: string;
    category: string;
    description: string;
    content: string;
}

interface FAQData {
    id: string;
    question: string;
    answer: string;
}

const AdminDashboard: React.FC = () => {
    const navigate = useNavigate();
    const [activeTab, setActiveTab] = useState<'sop' | 'faq'>('sop');
    const [contents, setContents] = useState<ContentData[]>([]);
    const [faqs, setFaqs] = useState<FAQData[]>([]);

    const [isModalOpen, setIsModalOpen] = useState(false);
    const [isFaqModalOpen, setIsFaqModalOpen] = useState(false);
    const [isSaving, setIsSaving] = useState(false);
    const [editingId, setEditingId] = useState<string | null>(null);

    const [formData, setFormData] = useState({ title: '', category: 'psp', description: '', content: '' });
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
        setFormData({ title: item.title, category: item.category, description: item.description, content: item.content });
        setIsModalOpen(true);
    };
    const handleAddSop = () => {
        setEditingId(null);
        setFormData({ title: '', category: 'psp', description: '', content: '' });
        setIsModalOpen(true);
    };
    const handleEditFaq = (item: FAQData) => {
        setEditingId(item.id);
        setFaqForm({ question: item.question, answer: item.answer });
        setIsFaqModalOpen(true);
    };
    const handleAddFaq = () => {
        setEditingId(null);
        setFaqForm({ question: '', answer: '' });
        setIsFaqModalOpen(true);
    };

    const handleSaveSop = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsSaving(true);
        try {
            if (editingId) {
                await updateDoc(doc(db, "knowledge-base", editingId), { ...formData, updatedAt: serverTimestamp() });
            } else {
                await addDoc(collection(db, "knowledge-base"), { ...formData, updatedAt: serverTimestamp() });
            }
            setIsModalOpen(false);
            setFormData({ title: '', category: 'psp', description: '', content: '' });
            setEditingId(null);
        } catch (err) { alert("Gagal menyimpan data."); } finally { setIsSaving(false); }
    };

    const handleSaveFaq = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsSaving(true);
        try {
            if (editingId) {
                await updateDoc(doc(db, "faqs", editingId), { ...faqForm, createdAt: serverTimestamp() });
            } else {
                await addDoc(collection(db, "faqs"), { ...faqForm, createdAt: serverTimestamp() });
            }
            setIsFaqModalOpen(false);
            setFaqForm({ question: '', answer: '' });
            setEditingId(null);
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
                                            <td className="p-5"><span className="px-3 py-1 bg-blue-100 text-blue-700 rounded-full text-xs font-bold uppercase">{item.category}</span></td>
                                            <td className="p-5 text-center flex justify-center space-x-2">
                                                <button onClick={() => handleEditSop(item)} className="p-2 text-amber-600 hover:bg-amber-50 rounded-lg transition" title="Edit Data"><Edit className="w-4 h-4" /></button>
                                                <button onClick={() => handleDeleteSop(item.id)} className="p-2 text-rose-600 hover:bg-rose-50 rounded-lg transition" title="Hapus Data"><Trash2 className="w-4 h-4" /></button>
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
                                        <button onClick={() => handleEditFaq(item)} className="text-amber-600 hover:bg-amber-50 p-2 rounded-lg" title="Edit FAQ"><Edit className="w-4 h-4" /></button>
                                        <button onClick={() => handleDeleteFaq(item.id)} className="text-rose-600 hover:bg-rose-50 p-2 rounded-lg" title="Hapus FAQ"><Trash2 className="w-4 h-4" /></button>
                                    </div>
                                </div>
                            ))}
                            {faqs.length === 0 && <div className="p-10 text-center text-slate-400 bg-white rounded-xl border border-dashed">Belum ada Pertanyaan Populer.</div>}
                        </div>
                    </div>
                )}
            </main>

            {isModalOpen && (
                <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4 backdrop-blur-sm">
                    <div className="bg-white rounded-2xl w-full max-w-2xl p-6">
                        <h3 className="font-bold text-lg mb-4 flex items-center">
                            {editingId ? <Edit className="w-5 h-5 mr-2 text-amber-600" /> : <Plus className="w-5 h-5 mr-2 text-[#0D5C35]" />}
                            {editingId ? 'Edit SOP' : 'Tambah SOP Baru'}
                        </h3>
                        <form onSubmit={handleSaveSop} className="space-y-4">
                            <input type="text" placeholder="Judul" className="w-full p-3 border rounded-lg" required value={formData.title} onChange={e => setFormData({ ...formData, title: e.target.value })} />

                            {/* BAGIAN DROPDOWN KATEGORI YANG DIUPDATE */}
                            <select className="w-full p-3 border rounded-lg" value={formData.category} onChange={e => setFormData({ ...formData, category: e.target.value })}>
                                <option value="psp">PSP</option>
                                <option value="sewa">SEWA</option>
                                <option value="penjualan">PENJUALAN</option>
                                <option value="penghapusan">PENGHAPUSAN</option>
                                <option value="pinjam-pakai">PINJAM PAKAI</option>
                                <option value="penggunaan-sementara">PENGGUNAAN SEMENTARA</option> {/* NEW */}
                                <option value="alih-status">ALIH STATUS</option>
                            </select>

                            <input type="text" placeholder="Deskripsi Singkat" className="w-full p-3 border rounded-lg" required value={formData.description} onChange={e => setFormData({ ...formData, description: e.target.value })} />
                            <textarea placeholder="Isi Lengkap" rows={5} className="w-full p-3 border rounded-lg" required value={formData.content} onChange={e => setFormData({ ...formData, content: e.target.value })}></textarea>
                            <div className="flex justify-end gap-2 mt-4"><button type="button" onClick={() => setIsModalOpen(false)} className="px-4 py-2 text-slate-500">Batal</button><button type="submit" className="px-4 py-2 bg-[#0D5C35] text-white rounded-lg font-bold">{editingId ? 'Update Data' : 'Simpan Data'}</button></div>
                        </form>
                    </div>
                </div>
            )}

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