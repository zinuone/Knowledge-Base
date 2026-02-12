// File: src/pages/AdminDashboard.tsx
import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { signOut } from 'firebase/auth';
import {
    collection, addDoc, deleteDoc, updateDoc, doc, onSnapshot, serverTimestamp, query, orderBy
} from 'firebase/firestore';
import { auth, db } from '../firebase';
import { LogOut, Plus, Trash2, FileText, HelpCircle, LayoutList, Edit, BookOpen, Quote, Eye, ThumbsUp } from 'lucide-react';

// Tipe Data
interface ContentData {
    id: string;
    title: string;
    category: string;
    description: string;
    content: string;
    imageBase64?: string;
    pdfUrl?: string;
    views?: number;
    likes?: number;
}

interface FAQData {
    id: string;
    question: string;
    answer: string;
}

interface GuideData {
    id: string;
    content: string; 
}

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
    const [activeTab, setActiveTab] = useState<'sop' | 'faq' | 'guide'>('sop');
    
    const [contents, setContents] = useState<ContentData[]>([]);
    const [faqs, setFaqs] = useState<FAQData[]>([]);
    const [guides, setGuides] = useState<GuideData[]>([]);

    const [isModalOpen, setIsModalOpen] = useState(false);
    const [isFaqModalOpen, setIsFaqModalOpen] = useState(false);
    const [isGuideModalOpen, setIsGuideModalOpen] = useState(false);
    const [isSaving, setIsSaving] = useState(false);
    const [editingId, setEditingId] = useState<string | null>(null);

    const [formData, setFormData] = useState({ title: '', category: 'psp', description: '', content: '', imageBase64: '', pdfUrl: '' });
    const [faqForm, setFaqForm] = useState({ question: '', answer: '' });
    const [guideForm, setGuideForm] = useState({ content: '' });

    useEffect(() => {
        const qSop = query(collection(db, "knowledge-base"), orderBy("updatedAt", "desc"));
        const unsubSop = onSnapshot(qSop, (snap) => setContents(snap.docs.map(d => ({ id: d.id, ...d.data() })) as ContentData[]));
        const qFaq = query(collection(db, "faqs"), orderBy("createdAt", "desc"));
        const unsubFaq = onSnapshot(qFaq, (snap) => setFaqs(snap.docs.map(d => ({ id: d.id, ...d.data() })) as FAQData[]));
        const qGuide = query(collection(db, "guides"), orderBy("updatedAt", "desc"));
        const unsubGuide = onSnapshot(qGuide, (snap) => setGuides(snap.docs.map(d => ({ id: d.id, ...d.data() })) as GuideData[]));
        return () => { unsubSop(); unsubFaq(); unsubGuide(); };
    }, []);

    const handleLogout = async () => { await signOut(auth); navigate('/login'); };
    const handleDelete = async (collectionName: string, id: string) => { if (confirm("Yakin hapus data ini?")) await deleteDoc(doc(db, collectionName, id)); };

    const handleEditSop = (item: ContentData) => { setEditingId(item.id); setFormData({ ...item, imageBase64: item.imageBase64 || '', pdfUrl: item.pdfUrl || '' }); setIsModalOpen(true); };
    const handleEditFaq = (item: FAQData) => { setEditingId(item.id); setFaqForm({ ...item }); setIsFaqModalOpen(true); };
    const handleEditGuide = (item: GuideData) => { setEditingId(item.id); setGuideForm({ content: item.content }); setIsGuideModalOpen(true); };
    
    const handleAddSop = () => { setEditingId(null); setFormData({ title: '', category: 'psp', description: '', content: '', imageBase64: '', pdfUrl: '' }); setIsModalOpen(true); };
    const handleAddFaq = () => { setEditingId(null); setFaqForm({ question: '', answer: '' }); setIsFaqModalOpen(true); };
    const handleAddGuide = () => { setEditingId(null); setGuideForm({ content: '' }); setIsGuideModalOpen(true); };

    const handleSaveSop = async (e: React.FormEvent) => { 
        e.preventDefault(); setIsSaving(true); 
        try { 
            if (editingId) {
                await updateDoc(doc(db, "knowledge-base", editingId), { ...formData, updatedAt: serverTimestamp() }); 
            } else { 
                await addDoc(collection(db, "knowledge-base"), { ...formData, updatedAt: serverTimestamp(), views: 0, likes: 0, dislikes: 0 }); 
            }
            setIsModalOpen(false); 
        } catch (err) { alert("Error saving SOP"); } finally { setIsSaving(false); } 
    };

    const handleSaveFaq = async (e: React.FormEvent) => { e.preventDefault(); setIsSaving(true); try { if (editingId) await updateDoc(doc(db, "faqs", editingId), { ...faqForm, createdAt: serverTimestamp() }); else await addDoc(collection(db, "faqs"), { ...faqForm, createdAt: serverTimestamp() }); setIsFaqModalOpen(false); } catch (err) { alert("Error saving FAQ"); } finally { setIsSaving(false); } };
    const handleSaveGuide = async (e: React.FormEvent) => { e.preventDefault(); setIsSaving(true); try { if (editingId) await updateDoc(doc(db, "guides", editingId), { ...guideForm, updatedAt: serverTimestamp() }); else await addDoc(collection(db, "guides"), { ...guideForm, updatedAt: serverTimestamp() }); setIsGuideModalOpen(false); } catch (err) { alert("Error saving Guide"); } finally { setIsSaving(false); } };

    const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => { const file = e.target.files?.[0]; if (file) { if (file.size > 800000) { alert("Maksimal 800KB"); return; } const reader = new FileReader(); reader.onloadend = () => setFormData({ ...formData, imageBase64: reader.result as string }); reader.readAsDataURL(file); } };
    
    const insertFormat = (target: 'sop' | 'guide', tag: string) => {
        const textarea = document.getElementById(target === 'sop' ? 'content-editor' : 'guide-editor') as HTMLTextAreaElement;
        if (!textarea) return;
        const start = textarea.selectionStart; const end = textarea.selectionEnd;
        const text = target === 'sop' ? formData.content : guideForm.content;
        const before = text.substring(0, start); const after = text.substring(end, text.length);
        let newText = '';
        if (tag === 'bold') newText = `${before}**Teks Tebal**${after}`; else if (tag === 'list') newText = `${before}\n- Poin 1\n- Poin 2${after}`; else if (tag === 'number') newText = `${before}\n1. Langkah 1\n2. Langkah 2${after}`; else if (tag === 'h2') newText = `${before}\n## Judul Besar${after}`; else if (tag === 'h3') newText = `${before}\n### Sub Judul${after}`; else if (tag === 'quote') newText = `${before}\n> "Catatan"${after}`;
        if (target === 'sop') setFormData({ ...formData, content: newText }); else setGuideForm({ ...guideForm, content: newText });
        setTimeout(() => textarea.focus(), 100);
    };

    return (
        <div className="min-h-screen bg-slate-50 font-sans">
            <nav className="bg-white border-b border-slate-200 px-6 py-4 flex justify-between items-center sticky top-0 z-10 shadow-sm">
                <div className="flex items-center space-x-3"><div className="bg-[#0D5C35] p-2 rounded-lg"><FileText className="text-white w-5 h-5" /></div><div><h1 className="font-bold text-slate-800 text-lg leading-none">Admin Panel</h1><span className="text-xs text-slate-500 uppercase">KPKNL Knowledge Base</span></div></div>
                <button onClick={handleLogout} className="flex items-center text-rose-600 hover:text-rose-700 font-medium text-sm"><LogOut className="w-4 h-4 mr-2" /> Keluar</button>
            </nav>

            <main className="max-w-7xl mx-auto p-6 md:p-10">
                <div className="flex space-x-4 mb-8 border-b border-slate-200 overflow-x-auto">
                    <button onClick={() => setActiveTab('sop')} className={`pb-4 px-4 font-bold flex items-center transition-colors whitespace-nowrap ${activeTab === 'sop' ? 'text-[#0D5C35] border-b-2 border-[#0D5C35]' : 'text-slate-400 hover:text-slate-600'}`}><LayoutList className="w-5 h-5 mr-2" /> Data SOP ({contents.length})</button>
                    <button onClick={() => setActiveTab('faq')} className={`pb-4 px-4 font-bold flex items-center transition-colors whitespace-nowrap ${activeTab === 'faq' ? 'text-[#0D5C35] border-b-2 border-[#0D5C35]' : 'text-slate-400 hover:text-slate-600'}`}><HelpCircle className="w-5 h-5 mr-2" /> Data FAQ ({faqs.length})</button>
                    <button onClick={() => setActiveTab('guide')} className={`pb-4 px-4 font-bold flex items-center transition-colors whitespace-nowrap ${activeTab === 'guide' ? 'text-[#0D5C35] border-b-2 border-[#0D5C35]' : 'text-slate-400 hover:text-slate-600'}`}><BookOpen className="w-5 h-5 mr-2" /> Data Panduan ({guides.length})</button>
                </div>

                {activeTab === 'sop' && (
                    <div>
                        <div className="flex justify-end mb-6"><button onClick={handleAddSop} className="flex items-center bg-[#0D5C35] text-white px-5 py-2.5 rounded-xl font-bold shadow-lg hover:bg-[#0A492A] transition"><Plus className="w-5 h-5 mr-2" /> Tambah SOP</button></div>
                        <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
                            <table className="w-full text-left border-collapse">
                                <thead className="bg-slate-50 text-slate-500 text-xs uppercase font-bold">
                                    <tr><th className="p-5">Judul</th><th className="p-5">Kategori</th><th className="p-5 text-center">Statistik</th><th className="p-5 text-center">Aksi</th></tr>
                                </thead>
                                <tbody className="divide-y divide-slate-100">
                                    {contents.map(item => (
                                        <tr key={item.id} className="hover:bg-slate-50 transition-colors">
                                            <td className="p-5 font-medium">{item.title}</td>
                                            <td className="p-5"><span className={`px-3 py-1 rounded-full text-xs font-bold uppercase border ${getCategoryColor(item.category)}`}>{item.category.replace('-', ' ')}</span></td>
                                            <td className="p-5 text-center">
                                                <div className="flex items-center justify-center space-x-3 text-xs font-bold text-slate-600">
                                                    <span className="flex items-center bg-blue-50 px-2 py-1 rounded text-blue-600" title="Jumlah Dilihat"><Eye className="w-3 h-3 mr-1" /> {item.views || 0}</span>
                                                    <span className="flex items-center bg-emerald-50 px-2 py-1 rounded text-emerald-600" title="Jumlah Like"><ThumbsUp className="w-3 h-3 mr-1" /> {item.likes || 0}</span>
                                                </div>
                                            </td>
                                            <td className="p-5 text-center flex justify-center space-x-2">
                                                {/* FIX: Tambah aria-label dan title pada tombol ikon */}
                                                <button onClick={() => handleEditSop(item)} aria-label="Edit SOP" title="Edit SOP" className="p-2 text-amber-600 hover:bg-amber-50 rounded-lg transition"><Edit className="w-4 h-4" /></button>
                                                <button onClick={() => handleDelete("knowledge-base", item.id)} aria-label="Hapus SOP" title="Hapus SOP" className="p-2 text-rose-600 hover:bg-rose-50 rounded-lg transition"><Trash2 className="w-4 h-4" /></button>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    </div>
                )}

                {activeTab === 'faq' && (
                    <div className="grid gap-4">
                        <div className="flex justify-end mb-6"><button onClick={handleAddFaq} className="flex items-center bg-[#0D5C35] text-white px-5 py-2.5 rounded-xl font-bold shadow-lg hover:bg-[#0A492A] transition"><Plus className="w-5 h-5 mr-2" /> Tambah FAQ</button></div>
                        {faqs.map(item => (<div key={item.id} className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm flex justify-between items-start"><div className="flex-grow pr-4"><h3 className="font-bold text-slate-800 text-lg mb-1">Q: {item.question}</h3><p className="text-slate-600">A: {item.answer}</p></div><div className="flex flex-col space-y-2 flex-shrink-0"><button onClick={() => handleEditFaq(item)} aria-label="Edit FAQ" className="text-amber-600 hover:bg-amber-50 p-2 rounded-lg"><Edit className="w-4 h-4" /></button><button onClick={() => handleDelete("faqs", item.id)} aria-label="Hapus FAQ" className="text-rose-600 hover:bg-rose-50 p-2 rounded-lg"><Trash2 className="w-4 h-4" /></button></div></div>))}
                    </div>
                )}
                {activeTab === 'guide' && (
                    <div className="grid gap-4">
                        <div className="flex justify-end mb-6">{guides.length === 0 && (<button onClick={handleAddGuide} className="flex items-center bg-[#0D5C35] text-white px-5 py-2.5 rounded-xl font-bold shadow-lg hover:bg-[#0A492A] transition"><Plus className="w-5 h-5 mr-2" /> Buat Panduan</button>)}</div>
                        {guides.map((item, index) => (<div key={item.id} className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm"><div className="flex justify-between items-center mb-4 border-b border-slate-100 pb-2"><h3 className="font-bold text-slate-800">Panduan #{index + 1}</h3><div className="flex space-x-2"><button onClick={() => handleEditGuide(item)} aria-label="Edit Panduan" className="flex items-center text-amber-600 hover:bg-amber-50 px-3 py-1 rounded-lg text-sm font-bold"><Edit className="w-4 h-4 mr-1" /> Edit</button><button onClick={() => handleDelete("guides", item.id)} aria-label="Hapus Panduan" className="flex items-center text-rose-600 hover:bg-rose-50 px-3 py-1 rounded-lg text-sm font-bold"><Trash2 className="w-4 h-4 mr-1" /> Hapus</button></div></div><p className="text-slate-500 text-sm line-clamp-3 font-mono bg-slate-50 p-3 rounded">{item.content}</p></div>))}
                    </div>
                )}
            </main>

            {/* MODALS */}
            {isModalOpen && (
                <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4 backdrop-blur-sm">
                    <div className="bg-white rounded-2xl w-full max-w-2xl p-6 overflow-y-auto max-h-[90vh]">
                        <h3 className="font-bold text-lg mb-4 flex items-center">{editingId ? 'Edit SOP' : 'Tambah SOP'}</h3>
                        <form onSubmit={handleSaveSop} className="space-y-4">
                            {/* FIX: Tambah aria-label pada input dan select */}
                            <input type="text" placeholder="Judul" aria-label="Judul SOP" className="w-full p-3 border rounded-lg" required value={formData.title} onChange={e => setFormData({ ...formData, title: e.target.value })} />
                            <select aria-label="Pilih Kategori" className="w-full p-3 border rounded-lg" value={formData.category} onChange={e => setFormData({ ...formData, category: e.target.value })}><option value="psp">PSP</option><option value="sewa">SEWA</option><option value="penjualan">PENJUALAN</option><option value="penghapusan">PENGHAPUSAN</option><option value="pinjam-pakai">PINJAM PAKAI</option><option value="penggunaan-sementara">PENGGUNAAN SEMENTARA</option><option value="alih-status">ALIH STATUS</option></select>
                            <input type="text" placeholder="Deskripsi Singkat" aria-label="Deskripsi SOP" className="w-full p-3 border rounded-lg" required value={formData.description} onChange={e => setFormData({ ...formData, description: e.target.value })} />
                            <input type="file" aria-label="Upload Gambar" accept="image/*" onChange={handleImageUpload} className="block w-full text-sm text-slate-500 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:bg-emerald-50 file:text-emerald-700" />
                            <input type="url" placeholder="Link Google Drive PDF" aria-label="Link PDF" className="w-full p-3 border rounded-lg" value={formData.pdfUrl} onChange={e => setFormData({ ...formData, pdfUrl: e.target.value })} />
                            <div className="space-y-2"><div className="flex flex-wrap gap-2 p-2 bg-slate-100 border rounded-t-lg">{['h2', 'h3', 'bold', 'list', 'number', 'quote'].map(tag => (<button key={tag} type="button" onClick={() => insertFormat('sop', tag)} className="px-2 py-1 bg-white border rounded text-xs font-bold uppercase">{tag}</button>))}</div><textarea id="content-editor" aria-label="Isi Konten" rows={10} className="w-full p-4 border border-t-0 rounded-b-lg font-mono text-sm" required value={formData.content} onChange={e => setFormData({ ...formData, content: e.target.value })}></textarea></div>
                            <div className="flex justify-end gap-2"><button type="button" onClick={() => setIsModalOpen(false)} className="px-4 py-2 text-slate-500">Batal</button><button type="submit" disabled={isSaving} className="px-4 py-2 bg-[#0D5C35] text-white rounded-lg font-bold">{isSaving ? 'Menyimpan...' : 'Simpan'}</button></div>
                        </form>
                    </div>
                </div>
            )}
            {/* Modal FAQ & Guide juga diperbaiki input labelnya */}
            {isFaqModalOpen && (<div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4 backdrop-blur-sm"><div className="bg-white rounded-2xl w-full max-w-lg p-6"><form onSubmit={handleSaveFaq} className="space-y-4"><input type="text" aria-label="Pertanyaan FAQ" className="w-full p-3 border rounded-lg" value={faqForm.question} onChange={e => setFaqForm({...faqForm, question: e.target.value})} /><textarea aria-label="Jawaban FAQ" className="w-full p-3 border rounded-lg" value={faqForm.answer} onChange={e => setFaqForm({...faqForm, answer: e.target.value})} /><div className="flex justify-end gap-2"><button type="button" onClick={() => setIsFaqModalOpen(false)} className="px-4 py-2 text-slate-500">Batal</button><button type="submit" className="px-4 py-2 bg-[#0D5C35] text-white rounded-lg font-bold">Simpan</button></div></form></div></div>)}
            {isGuideModalOpen && (<div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4 backdrop-blur-sm"><div className="bg-white rounded-2xl w-full max-w-2xl p-6"><form onSubmit={handleSaveGuide} className="space-y-4"><textarea id="guide-editor" aria-label="Isi Panduan" rows={8} className="w-full p-4 border rounded-lg" value={guideForm.content} onChange={e => setGuideForm({...guideForm, content: e.target.value})} /><div className="flex justify-end gap-2"><button type="button" onClick={() => setIsGuideModalOpen(false)} className="px-4 py-2 text-slate-500">Batal</button><button type="submit" className="px-4 py-2 bg-[#0D5C35] text-white rounded-lg font-bold">Simpan</button></div></form></div></div>)}
        </div>
    );
};

export default AdminDashboard;