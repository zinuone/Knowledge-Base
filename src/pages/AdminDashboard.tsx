// File: src/pages/AdminDashboard.tsx
import React, { useEffect, useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { signOut } from 'firebase/auth';
import {
    collection, addDoc, deleteDoc, updateDoc, doc, onSnapshot, serverTimestamp, query, orderBy
} from 'firebase/firestore';
import { auth, db } from '../firebase';
import {
    LogOut, Plus, Trash2, FileText, HelpCircle, LayoutList, Edit, BookOpen, Quote,
    Eye, ThumbsUp, BarChart3, PieChart as PieChartIcon, TrendingUp, FileSpreadsheet,
    AlertTriangle, X, List as ListIcon, Type, Hash
} from 'lucide-react';
import {
    BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell, PieChart, Pie, Legend
} from 'recharts';
import * as XLSX from 'xlsx';
import toast, { Toaster } from 'react-hot-toast';

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
    updatedAt?: any;
}

interface FAQData {
    id: string;
    question: string;
    answer: string;
}

interface GuideData {
    id: string;
    content: string;
    updatedAt?: any;
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

const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884d8', '#82ca9d', '#ffc658'];

const AdminDashboard: React.FC = () => {
    const navigate = useNavigate();
    const [activeTab, setActiveTab] = useState<'overview' | 'sop' | 'faq' | 'guide'>('overview');

    const [contents, setContents] = useState<ContentData[]>([]);
    const [faqs, setFaqs] = useState<FAQData[]>([]);
    const [guides, setGuides] = useState<GuideData[]>([]);

    // Modal States
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [isFaqModalOpen, setIsFaqModalOpen] = useState(false);
    const [isGuideModalOpen, setIsGuideModalOpen] = useState(false);

    // Konfirmasi Modal
    const [confirmModal, setConfirmModal] = useState<{
        isOpen: boolean;
        type: 'delete' | 'logout';
        title: string;
        message: string;
        onConfirm: () => void;
    }>({ isOpen: false, type: 'delete', title: '', message: '', onConfirm: () => { } });

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

    const stats = useMemo(() => {
        const totalViews = contents.reduce((acc, curr) => acc + (curr.views || 0), 0);
        const totalLikes = contents.reduce((acc, curr) => acc + (curr.likes || 0), 0);
        const topViewed = [...contents].sort((a, b) => (b.views || 0) - (a.views || 0)).slice(0, 5).map(item => ({ name: item.title.length > 20 ? item.title.substring(0, 20) + '...' : item.title, views: item.views || 0 }));
        const categoryDist: Record<string, number> = {};
        contents.forEach(item => { const catName = item.category.toUpperCase().replace('-', ' '); categoryDist[catName] = (categoryDist[catName] || 0) + 1; });
        const pieData = Object.keys(categoryDist).map(key => ({ name: key, value: categoryDist[key] }));
        return { totalViews, totalLikes, topViewed, pieData };
    }, [contents]);

    const handleExportExcel = () => {
        const dataToExport = contents.map((item, index) => ({
            No: index + 1, Judul: item.title, Kategori: item.category.toUpperCase().replace('-', ' '), 'Dilihat (Views)': item.views || 0, 'Disukai (Likes)': item.likes || 0, 'Terakhir Update': item.updatedAt ? new Date(item.updatedAt.seconds * 1000).toLocaleDateString('id-ID') : '-', Deskripsi: item.description
        }));
        const ws = XLSX.utils.json_to_sheet(dataToExport);
        const wb = XLSX.utils.book_new();
        XLSX.utils.book_append_sheet(wb, ws, "Laporan SOP");
        XLSX.writeFile(wb, `Laporan_KPKNL_KnowledgeBase_${new Date().toISOString().split('T')[0]}.xlsx`);
        toast.success("Laporan berhasil didownload!");
    };

    const confirmDelete = (collectionName: string, id: string) => {
        setConfirmModal({
            isOpen: true,
            type: 'delete',
            title: 'Hapus Data?',
            message: 'Tindakan ini tidak dapat dibatalkan. Data akan hilang permanen.',
            onConfirm: async () => {
                const deletePromise = deleteDoc(doc(db, collectionName, id));
                toast.promise(deletePromise, {
                    loading: 'Menghapus data...',
                    success: 'Data berhasil dihapus!',
                    error: 'Gagal menghapus data.',
                });
                setConfirmModal(prev => ({ ...prev, isOpen: false }));
            }
        });
    };

    const confirmLogout = () => {
        setConfirmModal({
            isOpen: true,
            type: 'logout',
            title: 'Konfirmasi Keluar',
            message: 'Apakah Anda yakin ingin keluar dari sesi Admin?',
            onConfirm: async () => {
                await signOut(auth);
                toast('Sampai jumpa!', { icon: '👋' });
                navigate('/login');
                setConfirmModal(prev => ({ ...prev, isOpen: false }));
            }
        });
    };

    const handleEditSop = (item: ContentData) => { setEditingId(item.id); setFormData({ ...item, imageBase64: item.imageBase64 || '', pdfUrl: item.pdfUrl || '' }); setIsModalOpen(true); };
    const handleEditFaq = (item: FAQData) => { setEditingId(item.id); setFaqForm({ ...item }); setIsFaqModalOpen(true); };
    const handleEditGuide = (item: GuideData) => { setEditingId(item.id); setGuideForm({ content: item.content }); setIsGuideModalOpen(true); };

    const handleAddSop = () => { setEditingId(null); setFormData({ title: '', category: 'psp', description: '', content: '', imageBase64: '', pdfUrl: '' }); setIsModalOpen(true); };
    const handleAddFaq = () => { setEditingId(null); setFaqForm({ question: '', answer: '' }); setIsFaqModalOpen(true); };
    const handleAddGuide = () => { setEditingId(null); setGuideForm({ content: '' }); setIsGuideModalOpen(true); };

    const handleSaveSop = async (e: React.FormEvent) => {
        e.preventDefault(); setIsSaving(true);
        const savePromise = editingId
            ? updateDoc(doc(db, "knowledge-base", editingId), { ...formData, updatedAt: serverTimestamp() })
            : addDoc(collection(db, "knowledge-base"), { ...formData, updatedAt: serverTimestamp(), views: 0, likes: 0, dislikes: 0 });
        await toast.promise(savePromise, { loading: 'Menyimpan SOP...', success: 'SOP berhasil disimpan!', error: 'Gagal menyimpan SOP.' });
        setIsSaving(false); setIsModalOpen(false);
    };

    const handleSaveFaq = async (e: React.FormEvent) => {
        e.preventDefault(); setIsSaving(true);
        const savePromise = editingId
            ? updateDoc(doc(db, "faqs", editingId), { ...faqForm, createdAt: serverTimestamp() })
            : addDoc(collection(db, "faqs"), { ...faqForm, createdAt: serverTimestamp() });
        await toast.promise(savePromise, { loading: 'Menyimpan FAQ...', success: 'FAQ berhasil disimpan!', error: 'Gagal menyimpan FAQ.' });
        setIsSaving(false); setIsFaqModalOpen(false);
    };

    const handleSaveGuide = async (e: React.FormEvent) => {
        e.preventDefault(); setIsSaving(true);
        const savePromise = editingId
            ? updateDoc(doc(db, "guides", editingId), { ...guideForm, updatedAt: serverTimestamp() })
            : addDoc(collection(db, "guides"), { ...guideForm, updatedAt: serverTimestamp() });
        await toast.promise(savePromise, { loading: 'Menyimpan Panduan...', success: 'Panduan berhasil disimpan!', error: 'Gagal menyimpan Panduan.' });
        setIsSaving(false); setIsGuideModalOpen(false);
    };

    const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => { const file = e.target.files?.[0]; if (file) { if (file.size > 800000) { toast.error("Maksimal ukuran gambar 800KB"); return; } const reader = new FileReader(); reader.onloadend = () => setFormData({ ...formData, imageBase64: reader.result as string }); reader.readAsDataURL(file); } };

    // FUNGSI UTILITY: Insert Format Text (Bold, List, dll)
    // Diupdate untuk support 'sop', 'faq', dan 'guide'
    const insertFormat = (target: 'sop' | 'faq' | 'guide', tag: string) => {
        let elementId = '';
        if (target === 'sop') elementId = 'content-editor';
        if (target === 'faq') elementId = 'faq-editor';
        if (target === 'guide') elementId = 'guide-editor';

        const textarea = document.getElementById(elementId) as HTMLTextAreaElement;
        if (!textarea) return;

        const start = textarea.selectionStart;
        const end = textarea.selectionEnd;

        let currentText = '';
        if (target === 'sop') currentText = formData.content;
        if (target === 'faq') currentText = faqForm.answer;
        if (target === 'guide') currentText = guideForm.content;

        const before = currentText.substring(0, start);
        const after = currentText.substring(end, currentText.length);

        let newText = '';
        if (tag === 'bold') newText = `${before}**Teks Tebal**${after}`;
        else if (tag === 'list') newText = `${before}\n- Poin 1\n- Poin 2${after}`;
        else if (tag === 'number') newText = `${before}\n1. Langkah 1\n2. Langkah 2${after}`;
        else if (tag === 'h2') newText = `${before}\n## Judul Besar${after}`;
        else if (tag === 'h3') newText = `${before}\n### Sub Judul${after}`;
        else if (tag === 'quote') newText = `${before}\n> "Catatan"${after}`;

        // Set State sesuai target
        if (target === 'sop') setFormData({ ...formData, content: newText });
        else if (target === 'faq') setFaqForm({ ...faqForm, answer: newText });
        else if (target === 'guide') setGuideForm({ ...guideForm, content: newText });

        setTimeout(() => textarea.focus(), 100);
    };

    // Komponen Toolbar Format (Reusable)
    const FormatToolbar = ({ target }: { target: 'sop' | 'faq' | 'guide' }) => (
        <div className="flex flex-wrap gap-2 p-2 bg-slate-100 border rounded-t-lg">
            <button type="button" onClick={() => insertFormat(target, 'bold')} className="p-1.5 hover:bg-white rounded text-slate-600 transition" title="Tebal"><Type className="w-4 h-4" /></button>
            <button type="button" onClick={() => insertFormat(target, 'list')} className="p-1.5 hover:bg-white rounded text-slate-600 transition" title="List"><ListIcon className="w-4 h-4" /></button>
            <button type="button" onClick={() => insertFormat(target, 'number')} className="p-1.5 hover:bg-white rounded text-slate-600 transition" title="Nomor"><Hash className="w-4 h-4" /></button>
            <button type="button" onClick={() => insertFormat(target, 'h2')} className="px-2 py-1 bg-white border rounded text-xs font-bold uppercase hover:bg-slate-50">H2</button>
            <button type="button" onClick={() => insertFormat(target, 'h3')} className="px-2 py-1 bg-white border rounded text-xs font-bold uppercase hover:bg-slate-50">H3</button>
            <button type="button" onClick={() => insertFormat(target, 'quote')} className="p-1.5 hover:bg-white rounded text-slate-600 transition" title="Kutipan"><Quote className="w-4 h-4" /></button>
        </div>
    );

    return (
        <div className="min-h-screen bg-slate-50 font-sans">
            <Toaster position="top-right" />

            <nav className="bg-white border-b border-slate-200 px-6 py-4 flex justify-between items-center sticky top-0 z-10 shadow-sm">
                <div className="flex items-center space-x-3"><div className="bg-[#0D5C35] p-2 rounded-lg"><FileText className="text-white w-5 h-5" /></div><div><h1 className="font-bold text-slate-800 text-lg leading-none">Admin Panel</h1><span className="text-xs text-slate-500 uppercase">KPKNL Knowledge Base</span></div></div>
                <button onClick={confirmLogout} className="flex items-center text-rose-600 hover:text-rose-700 font-medium text-sm transition-colors hover:bg-rose-50 px-3 py-2 rounded-lg"><LogOut className="w-4 h-4 mr-2" /> Keluar</button>
            </nav>

            <main className="max-w-7xl mx-auto p-6 md:p-10">
                {/* Menu Navigasi Tab */}
                <div className="flex space-x-4 mb-8 border-b border-slate-200 overflow-x-auto pb-1">
                    <button onClick={() => setActiveTab('overview')} className={`pb-3 px-4 font-bold flex items-center transition-colors whitespace-nowrap ${activeTab === 'overview' ? 'text-[#0D5C35] border-b-2 border-[#0D5C35]' : 'text-slate-400 hover:text-slate-600'}`}><BarChart3 className="w-5 h-5 mr-2" /> Dashboard</button>
                    <button onClick={() => setActiveTab('sop')} className={`pb-3 px-4 font-bold flex items-center transition-colors whitespace-nowrap ${activeTab === 'sop' ? 'text-[#0D5C35] border-b-2 border-[#0D5C35]' : 'text-slate-400 hover:text-slate-600'}`}><LayoutList className="w-5 h-5 mr-2" /> Data SOP ({contents.length})</button>
                    <button onClick={() => setActiveTab('faq')} className={`pb-3 px-4 font-bold flex items-center transition-colors whitespace-nowrap ${activeTab === 'faq' ? 'text-[#0D5C35] border-b-2 border-[#0D5C35]' : 'text-slate-400 hover:text-slate-600'}`}><HelpCircle className="w-5 h-5 mr-2" /> Data FAQ ({faqs.length})</button>
                    <button onClick={() => setActiveTab('guide')} className={`pb-3 px-4 font-bold flex items-center transition-colors whitespace-nowrap ${activeTab === 'guide' ? 'text-[#0D5C35] border-b-2 border-[#0D5C35]' : 'text-slate-400 hover:text-slate-600'}`}><BookOpen className="w-5 h-5 mr-2" /> Data Panduan ({guides.length})</button>
                </div>

                {activeTab === 'overview' && (
                    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
                        {/* Summary Cards */}
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                            <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100 flex items-center space-x-4">
                                <div className="p-4 bg-blue-50 rounded-xl text-blue-600"><FileText className="w-8 h-8" /></div>
                                <div><p className="text-slate-500 text-sm font-medium">Total Dokumen</p><h3 className="text-3xl font-black text-slate-800">{contents.length}</h3></div>
                            </div>
                            <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100 flex items-center space-x-4">
                                <div className="p-4 bg-emerald-50 rounded-xl text-emerald-600"><Eye className="w-8 h-8" /></div>
                                <div><p className="text-slate-500 text-sm font-medium">Total Dilihat</p><h3 className="text-3xl font-black text-slate-800">{stats.totalViews}</h3></div>
                            </div>
                            <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100 flex items-center space-x-4">
                                <div className="p-4 bg-amber-50 rounded-xl text-amber-600"><ThumbsUp className="w-8 h-8" /></div>
                                <div><p className="text-slate-500 text-sm font-medium">Total Apresiasi (Like)</p><h3 className="text-3xl font-black text-slate-800">{stats.totalLikes}</h3></div>
                            </div>
                        </div>

                        {/* Charts Area */}
                        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                            {/* Bar Chart */}
                            <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100">
                                <h3 className="font-bold text-slate-800 mb-6 flex items-center"><TrendingUp className="w-5 h-5 mr-2 text-[#0D5C35]" /> Dokumen Terpopuler (Top 5)</h3>
                                <div className="h-96 w-full">
                                    <ResponsiveContainer width="100%" height="100%">
                                        <BarChart data={stats.topViewed} layout="vertical" margin={{ top: 5, right: 30, left: 20, bottom: 5 }}>
                                            <CartesianGrid strokeDasharray="3 3" horizontal={true} vertical={false} />
                                            <XAxis type="number" hide />
                                            <YAxis dataKey="name" type="category" width={100} tick={{ fontSize: 10 }} />
                                            <Tooltip cursor={{ fill: '#f0fdf4' }} />
                                            <Bar dataKey="views" fill="#0D5C35" radius={[0, 4, 4, 0]} barSize={20} />
                                        </BarChart>
                                    </ResponsiveContainer>
                                </div>
                            </div>

                            {/* Pie Chart (DIPERBAIKI UNTUK MOBILE) */}
                            <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100">
                                <h3 className="font-bold text-slate-800 mb-6 flex items-center"><PieChartIcon className="w-5 h-5 mr-2 text-[#0D5C35]" /> Distribusi Kategori</h3>
                                {/* FIX: Tinggi diperbesar jadi h-96 agar legend muat */}
                                <div className="h-96 w-full min-w-[300px]">
                                    <ResponsiveContainer width="100%" height="100%">
                                        <PieChart>
                                            <Pie data={stats.pieData} cx="50%" cy="50%" innerRadius={60} outerRadius={80} fill="#8884d8" paddingAngle={5} dataKey="value">
                                                {stats.pieData.map((entry, index) => (
                                                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                                                ))}
                                            </Pie>
                                            <Tooltip />
                                            <Legend verticalAlign="bottom" height={70} iconType="circle" wrapperStyle={{ fontSize: '10px' }} />
                                        </PieChart>
                                    </ResponsiveContainer>
                                </div>
                            </div>
                        </div>
                    </div>
                )}

                {activeTab === 'sop' && (
                    <div className="animate-in fade-in zoom-in duration-300">
                        <div className="flex justify-end mb-6 space-x-3">
                            <button onClick={handleExportExcel} className="flex items-center bg-[#00A3C8] text-white px-5 py-2.5 rounded-xl font-bold shadow-lg shadow-cyan-100 hover:bg-[#008CAE] transition">
                                <FileSpreadsheet className="w-5 h-5 mr-2" /> Export Data
                            </button>
                            <button onClick={handleAddSop} className="flex items-center bg-[#0D5C35] text-white px-5 py-2.5 rounded-xl font-bold shadow-lg hover:bg-[#0A492A] transition">
                                <Plus className="w-5 h-5 mr-2" /> Tambah SOP
                            </button>
                        </div>
                        <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden overflow-x-auto">
                            <table className="w-full text-left border-collapse min-w-[800px]">
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
                                                <button onClick={() => handleEditSop(item)} aria-label="Edit SOP" className="p-2 text-amber-600 hover:bg-amber-50 rounded-lg transition"><Edit className="w-4 h-4" /></button>
                                                <button onClick={() => confirmDelete("knowledge-base", item.id)} aria-label="Hapus SOP" className="p-2 text-rose-600 hover:bg-rose-50 rounded-lg transition"><Trash2 className="w-4 h-4" /></button>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    </div>
                )}

                {activeTab === 'faq' && (
                    <div className="grid gap-4 animate-in fade-in zoom-in duration-300">
                        <div className="flex justify-end mb-6"><button onClick={handleAddFaq} className="flex items-center bg-[#0D5C35] text-white px-5 py-2.5 rounded-xl font-bold shadow-lg hover:bg-[#0A492A] transition"><Plus className="w-5 h-5 mr-2" /> Tambah FAQ</button></div>
                        {faqs.map(item => (<div key={item.id} className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm flex justify-between items-start"><div className="flex-grow pr-4"><h3 className="font-bold text-slate-800 text-lg mb-1">Q: {item.question}</h3><p className="text-slate-600 whitespace-pre-line">A: {item.answer}</p></div><div className="flex flex-col space-y-2 flex-shrink-0"><button onClick={() => handleEditFaq(item)} aria-label="Edit FAQ" className="text-amber-600 hover:bg-amber-50 p-2 rounded-lg"><Edit className="w-4 h-4" /></button><button onClick={() => confirmDelete("faqs", item.id)} aria-label="Hapus FAQ" className="text-rose-600 hover:bg-rose-50 p-2 rounded-lg"><Trash2 className="w-4 h-4" /></button></div></div>))}
                    </div>
                )}

                {/* --- TAB GUIDE (DIPERBAIKI JADI TABEL) --- */}
                {activeTab === 'guide' && (
                    <div className="animate-in fade-in zoom-in duration-300">
                        <div className="flex justify-end mb-6">{guides.length === 0 && (<button onClick={handleAddGuide} className="flex items-center bg-[#0D5C35] text-white px-5 py-2.5 rounded-xl font-bold shadow-lg hover:bg-[#0A492A] transition"><Plus className="w-5 h-5 mr-2" /> Buat Panduan</button>)}</div>

                        <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden overflow-x-auto">
                            <table className="w-full text-left border-collapse min-w-[800px]">
                                <thead className="bg-slate-50 text-slate-500 text-xs uppercase font-bold">
                                    <tr><th className="p-5 w-20">#</th><th className="p-5">Isi Panduan (Preview)</th><th className="p-5 w-40 text-center">Update</th><th className="p-5 text-center w-32">Aksi</th></tr>
                                </thead>
                                <tbody className="divide-y divide-slate-100">
                                    {guides.map((item, index) => (
                                        <tr key={item.id} className="hover:bg-slate-50 transition-colors">
                                            <td className="p-5 font-bold text-slate-500">{index + 1}</td>
                                            <td className="p-5">
                                                <p className="text-slate-700 text-sm line-clamp-2 font-medium">{item.content}</p>
                                            </td>
                                            <td className="p-5 text-center text-xs text-slate-400">
                                                {item.updatedAt ? new Date(item.updatedAt.seconds * 1000).toLocaleDateString() : '-'}
                                            </td>
                                            <td className="p-5 text-center flex justify-center space-x-2">
                                                <button onClick={() => handleEditGuide(item)} aria-label="Edit Panduan" className="p-2 text-amber-600 hover:bg-amber-50 rounded-lg transition"><Edit className="w-4 h-4" /></button>
                                                <button onClick={() => confirmDelete("guides", item.id)} aria-label="Hapus Panduan" className="p-2 text-rose-600 hover:bg-rose-50 rounded-lg transition"><Trash2 className="w-4 h-4" /></button>
                                            </td>
                                        </tr>
                                    ))}
                                    {guides.length === 0 && <tr><td colSpan={4} className="p-10 text-center text-slate-400 italic">Belum ada panduan.</td></tr>}
                                </tbody>
                            </table>
                        </div>
                    </div>
                )}
            </main>

            {/* MODAL KONFIRMASI */}
            {confirmModal.isOpen && (
                <div className="fixed inset-0 bg-black/50 z-[60] flex items-center justify-center p-4 backdrop-blur-sm animate-in fade-in duration-200">
                    <div className="bg-white rounded-2xl w-full max-w-sm p-6 shadow-2xl transform scale-100 transition-all">
                        <div className="flex flex-col items-center text-center">
                            <div className={`w-14 h-14 rounded-full flex items-center justify-center mb-4 ${confirmModal.type === 'delete' ? 'bg-rose-100 text-rose-600' : 'bg-amber-100 text-amber-600'}`}>
                                <AlertTriangle className="w-8 h-8" />
                            </div>
                            <h3 className="text-xl font-bold text-slate-900 mb-2">{confirmModal.title}</h3>
                            <p className="text-slate-500 mb-6 leading-relaxed text-sm">{confirmModal.message}</p>
                            <div className="flex w-full space-x-3">
                                <button onClick={() => setConfirmModal(prev => ({ ...prev, isOpen: false }))} className="flex-1 px-4 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold rounded-xl transition-colors">Batal</button>
                                <button onClick={confirmModal.onConfirm} className={`flex-1 px-4 py-2.5 text-white font-bold rounded-xl shadow-lg transition-all transform active:scale-95 ${confirmModal.type === 'delete' ? 'bg-rose-600 hover:bg-rose-700 shadow-rose-200' : 'bg-amber-500 hover:bg-amber-600 shadow-amber-200'}`}>{confirmModal.type === 'delete' ? 'Ya, Hapus' : 'Ya, Keluar'}</button>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* MODALS INPUT (SOP) */}
            {isModalOpen && (
                <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4 backdrop-blur-sm">
                    <div className="bg-white rounded-2xl w-full max-w-2xl p-6 overflow-y-auto max-h-[90vh]">
                        <h3 className="font-bold text-lg mb-4 flex items-center">{editingId ? 'Edit SOP' : 'Tambah SOP'}</h3>
                        <form onSubmit={handleSaveSop} className="space-y-4">
                            <input type="text" placeholder="Judul" className="w-full p-3 border rounded-lg" required value={formData.title} onChange={e => setFormData({ ...formData, title: e.target.value })} />
                            <select className="w-full p-3 border rounded-lg" value={formData.category} onChange={e => setFormData({ ...formData, category: e.target.value })}><option value="psp">PSP</option><option value="sewa">SEWA</option><option value="penjualan">PENJUALAN</option><option value="penghapusan">PENGHAPUSAN</option><option value="pinjam-pakai">PINJAM PAKAI</option><option value="penggunaan-sementara">PENGGUNAAN SEMENTARA</option><option value="alih-status">ALIH STATUS</option></select>
                            <input type="text" placeholder="Deskripsi Singkat" className="w-full p-3 border rounded-lg" required value={formData.description} onChange={e => setFormData({ ...formData, description: e.target.value })} />
                            <input type="file" accept="image/*" onChange={handleImageUpload} className="block w-full text-sm text-slate-500 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:bg-emerald-50 file:text-emerald-700" />
                            <input type="url" placeholder="Link Google Drive PDF" className="w-full p-3 border rounded-lg" value={formData.pdfUrl} onChange={e => setFormData({ ...formData, pdfUrl: e.target.value })} />

                            {/* Rich Text Editor */}
                            <div className="space-y-2">
                                <FormatToolbar target="sop" />
                                <textarea id="content-editor" rows={10} className="w-full p-4 border border-t-0 rounded-b-lg font-mono text-sm focus:ring-2 focus:ring-[#0D5C35] outline-none" required value={formData.content} onChange={e => setFormData({ ...formData, content: e.target.value })}></textarea>
                            </div>

                            <div className="flex justify-end gap-2"><button type="button" onClick={() => setIsModalOpen(false)} className="px-4 py-2 text-slate-500">Batal</button><button type="submit" disabled={isSaving} className="px-4 py-2 bg-[#0D5C35] text-white rounded-lg font-bold">{isSaving ? 'Menyimpan...' : 'Simpan'}</button></div>
                        </form>
                    </div>
                </div>
            )}

            {/* MODAL INPUT (FAQ) - SEKARANG ADA TOOLBAR */}
            {isFaqModalOpen && (
                <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4 backdrop-blur-sm">
                    <div className="bg-white rounded-2xl w-full max-w-lg p-6">
                        <form onSubmit={handleSaveFaq} className="space-y-4">
                            <input type="text" placeholder="Pertanyaan FAQ" className="w-full p-3 border rounded-lg" value={faqForm.question} onChange={e => setFaqForm({ ...faqForm, question: e.target.value })} />

                            {/* Rich Text Editor FAQ */}
                            <div className="space-y-2">
                                <FormatToolbar target="faq" />
                                <textarea id="faq-editor" placeholder="Jawaban..." rows={6} className="w-full p-4 border border-t-0 rounded-b-lg font-mono text-sm focus:ring-2 focus:ring-[#0D5C35] outline-none" value={faqForm.answer} onChange={e => setFaqForm({ ...faqForm, answer: e.target.value })} />
                            </div>

                            <div className="flex justify-end gap-2"><button type="button" onClick={() => setIsFaqModalOpen(false)} className="px-4 py-2 text-slate-500">Batal</button><button type="submit" className="px-4 py-2 bg-[#0D5C35] text-white rounded-lg font-bold">Simpan</button></div>
                        </form>
                    </div>
                </div>
            )}

            {/* MODAL INPUT (PANDUAN) - SEKARANG ADA TOOLBAR */}
            {isGuideModalOpen && (
                <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4 backdrop-blur-sm">
                    <div className="bg-white rounded-2xl w-full max-w-2xl p-6">
                        <form onSubmit={handleSaveGuide} className="space-y-4">
                            {/* Rich Text Editor Guide */}
                            <div className="space-y-2">
                                <FormatToolbar target="guide" />
                                <textarea id="guide-editor" placeholder="Isi Panduan..." rows={12} className="w-full p-4 border border-t-0 rounded-b-lg font-mono text-sm focus:ring-2 focus:ring-[#0D5C35] outline-none" value={guideForm.content} onChange={e => setGuideForm({ ...guideForm, content: e.target.value })} />
                            </div>
                            <div className="flex justify-end gap-2"><button type="button" onClick={() => setIsGuideModalOpen(false)} className="px-4 py-2 text-slate-500">Batal</button><button type="submit" className="px-4 py-2 bg-[#0D5C35] text-white rounded-lg font-bold">Simpan</button></div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
};

export default AdminDashboard;