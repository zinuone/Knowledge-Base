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
    AlertTriangle, X, List as ListIcon, Type, Hash, Search, Filter, RefreshCw
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
    videoUrl?: string;
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
        case 'hibah': return 'bg-orange-100 text-orange-800 border-orange-200';
        default: return 'bg-slate-100 text-slate-800 border-slate-200';
    }
};

const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884d8', '#82ca9d', '#ffc658', '#f97316'];

// ✅ FIX UTAMA: FormatToolbar dipindahkan ke LUAR komponen AdminDashboard
// Sebelumnya didefinisikan di dalam, menyebabkan React unmount/remount setiap re-render → blank screen
const FormatToolbar = ({
    target,
    onInsert
}: {
    target: 'sop' | 'faq' | 'guide';
    onInsert: (target: 'sop' | 'faq' | 'guide', tag: string) => void;
}) => (
    <div className="flex flex-wrap gap-2 p-2 bg-slate-100 border rounded-t-lg">
        <button type="button" onClick={() => onInsert(target, 'bold')} className="p-1.5 hover:bg-white rounded text-slate-600 transition" title="Tebal"><Type className="w-4 h-4" /></button>
        <button type="button" onClick={() => onInsert(target, 'list')} className="p-1.5 hover:bg-white rounded text-slate-600 transition" title="List"><ListIcon className="w-4 h-4" /></button>
        <button type="button" onClick={() => onInsert(target, 'number')} className="p-1.5 hover:bg-white rounded text-slate-600 transition" title="Nomor"><Hash className="w-4 h-4" /></button>
        <button type="button" onClick={() => onInsert(target, 'h2')} className="px-2 py-1 bg-white border rounded text-xs font-bold uppercase hover:bg-slate-50">H2</button>
        <button type="button" onClick={() => onInsert(target, 'h3')} className="px-2 py-1 bg-white border rounded text-xs font-bold uppercase hover:bg-slate-50">H3</button>
        <button type="button" onClick={() => onInsert(target, 'quote')} className="p-1.5 hover:bg-white rounded text-slate-600 transition" title="Kutipan"><Quote className="w-4 h-4" /></button>
    </div>
);

const AdminDashboard: React.FC = () => {
    const navigate = useNavigate();
    const [activeTab, setActiveTab] = useState<'overview' | 'sop' | 'faq' | 'guide'>('overview');

    const [contents, setContents] = useState<ContentData[]>([]);
    const [faqs, setFaqs] = useState<FAQData[]>([]);
    const [guides, setGuides] = useState<GuideData[]>([]);

    const [searchTerm, setSearchTerm] = useState('');
    const [filterCategory, setFilterCategory] = useState('all');

    const [isModalOpen, setIsModalOpen] = useState(false);
    const [isFaqModalOpen, setIsFaqModalOpen] = useState(false);
    const [isGuideModalOpen, setIsGuideModalOpen] = useState(false);

    const [confirmModal, setConfirmModal] = useState<{
        isOpen: boolean;
        type: 'delete' | 'logout';
        title: string;
        message: string;
        onConfirm: () => void;
    }>({ isOpen: false, type: 'delete', title: '', message: '', onConfirm: () => { } });

    const [isSaving, setIsSaving] = useState(false);
    const [editingId, setEditingId] = useState<string | null>(null);

    const [formData, setFormData] = useState({ title: '', category: 'psp', description: '', content: '', imageBase64: '', pdfUrl: '', videoUrl: '' });
    const [faqForm, setFaqForm] = useState({ question: '', answer: '' });
    const [guideForm, setGuideForm] = useState({ content: '' });

    const formatTime = (timestamp: any) => {
        if (timestamp && timestamp.seconds) {
            return new Date(timestamp.seconds * 1000).toLocaleDateString('id-ID');
        }
        return '-';
    };

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
        const topViewed = [...contents].sort((a, b) => (b.views || 0) - (a.views || 0)).slice(0, 5).map(item => {
            const titleStr = item.title || 'Tanpa Judul';
            return { name: titleStr.length > 20 ? titleStr.substring(0, 20) + '...' : titleStr, views: item.views || 0 }
        });
        const categoryDist: Record<string, number> = {};
        contents.forEach(item => {
            const catName = (item.category || 'psp').toUpperCase().replace('-', ' ');
            categoryDist[catName] = (categoryDist[catName] || 0) + 1;
        });
        const pieData = Object.keys(categoryDist).map(key => ({ name: key, value: categoryDist[key] }));
        return { totalViews, totalLikes, topViewed, pieData };
    }, [contents]);

    const filteredContents = useMemo(() => {
        return contents.filter(item => {
            const titleSafe = item.title || '';
            const descSafe = item.description || '';
            const matchSearch = titleSafe.toLowerCase().includes(searchTerm.toLowerCase()) || descSafe.toLowerCase().includes(searchTerm.toLowerCase());
            const matchCategory = filterCategory === 'all' || item.category === filterCategory;
            return matchSearch && matchCategory;
        });
    }, [contents, searchTerm, filterCategory]);

    const handleExportExcel = () => {
        const dataToExport = contents.map((item, index) => ({
            No: index + 1,
            Judul: item.title,
            Kategori: (item.category || '').toUpperCase().replace('-', ' '),
            'Dilihat (Views)': item.views || 0,
            'Disukai (Likes)': item.likes || 0,
            'Terakhir Update': formatTime(item.updatedAt),
            Deskripsi: item.description
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

    const handleEditSop = (item: ContentData) => { setEditingId(item.id); setFormData({ ...item, imageBase64: item.imageBase64 || '', pdfUrl: item.pdfUrl || '', videoUrl: item.videoUrl || '' }); setIsModalOpen(true); };
    const handleEditFaq = (item: FAQData) => { setEditingId(item.id); setFaqForm({ ...item }); setIsFaqModalOpen(true); };
    const handleEditGuide = (item: GuideData) => { setEditingId(item.id); setGuideForm({ content: item.content }); setIsGuideModalOpen(true); };

    const handleAddSop = () => { setEditingId(null); setFormData({ title: '', category: 'psp', description: '', content: '', imageBase64: '', pdfUrl: '', videoUrl: '' }); setIsModalOpen(true); };
    const handleAddFaq = () => { setEditingId(null); setFaqForm({ question: '', answer: '' }); setIsFaqModalOpen(true); };
    const handleAddGuide = () => { setEditingId(null); setGuideForm({ content: '' }); setIsGuideModalOpen(true); };

    // ✅ FIX: Gunakan try/finally agar isSaving selalu di-reset meski terjadi error
    const handleSaveSop = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsSaving(true);
        try {
            const savePromise = editingId
                ? updateDoc(doc(db, "knowledge-base", editingId), { ...formData, updatedAt: serverTimestamp() })
                : addDoc(collection(db, "knowledge-base"), { ...formData, updatedAt: serverTimestamp(), views: 0, likes: 0, dislikes: 0 });
            await toast.promise(savePromise, { loading: 'Menyimpan SOP...', success: 'SOP berhasil disimpan!', error: 'Gagal menyimpan SOP.' });
            setIsModalOpen(false);
        } catch (_) {
            // error sudah ditangani oleh toast.promise
        } finally {
            setIsSaving(false);
        }
    };

    // ✅ FIX: try/finally untuk FAQ
    const handleSaveFaq = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsSaving(true);
        try {
            const savePromise = editingId
                ? updateDoc(doc(db, "faqs", editingId), { ...faqForm, createdAt: serverTimestamp() })
                : addDoc(collection(db, "faqs"), { ...faqForm, createdAt: serverTimestamp() });
            await toast.promise(savePromise, { loading: 'Menyimpan FAQ...', success: 'FAQ berhasil disimpan!', error: 'Gagal menyimpan FAQ.' });
            setIsFaqModalOpen(false);
        } catch (_) {
            // error sudah ditangani oleh toast.promise
        } finally {
            setIsSaving(false);
        }
    };

    // ✅ FIX: try/finally untuk Panduan
    const handleSaveGuide = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsSaving(true);
        try {
            const savePromise = editingId
                ? updateDoc(doc(db, "guides", editingId), { ...guideForm, updatedAt: serverTimestamp() })
                : addDoc(collection(db, "guides"), { ...guideForm, updatedAt: serverTimestamp() });
            await toast.promise(savePromise, { loading: 'Menyimpan Panduan...', success: 'Panduan berhasil disimpan!', error: 'Gagal menyimpan Panduan.' });
            setIsGuideModalOpen(false);
        } catch (_) {
            // error sudah ditangani oleh toast.promise
        } finally {
            setIsSaving(false);
        }
    };

    const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file) {
            if (file.size > 800000) { toast.error("Maksimal ukuran gambar 800KB"); return; }
            const reader = new FileReader();
            reader.onloadend = () => setFormData({ ...formData, imageBase64: reader.result as string });
            reader.readAsDataURL(file);
        }
    };

    // ✅ FIX: insertFormat tetap di dalam komponen (karena butuh akses ke state),
    // tapi sekarang dioper sebagai prop ke FormatToolbar yang sudah ada di luar
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

        if (target === 'sop') setFormData({ ...formData, content: newText });
        else if (target === 'faq') setFaqForm({ ...faqForm, answer: newText });
        else if (target === 'guide') setGuideForm({ ...guideForm, content: newText });

        setTimeout(() => textarea.focus(), 100);
    };

    return (
        <div className="min-h-screen bg-[#F8FAF9] font-sans">
            <Toaster position="top-right" />

            <nav className="bg-white border-b border-slate-200 px-6 py-4 flex justify-between items-center sticky top-0 z-40 shadow-sm">
                <div className="flex items-center space-x-3">
                    <div className="bg-gradient-to-br from-[#0D5C35] to-[#0A492A] p-2.5 rounded-xl shadow-md">
                        <FileText className="text-white w-6 h-6" />
                    </div>
                    <div>
                        <h1 className="font-black text-slate-800 text-xl leading-none tracking-tight">Admin Panel</h1>
                        <span className="text-[10px] font-bold text-[#D4AF37] uppercase tracking-widest">KPKNL Kendari</span>
                    </div>
                </div>
                <button onClick={confirmLogout} className="flex items-center text-rose-600 hover:text-white font-bold text-sm transition-all hover:bg-rose-500 hover:shadow-lg hover:shadow-rose-200 px-4 py-2.5 rounded-xl border border-rose-100">
                    <LogOut className="w-4 h-4 mr-2" /> Keluar Sistem
                </button>
            </nav>

            <main className="max-w-7xl mx-auto p-6 md:p-10">
                <div className="flex space-x-2 mb-10 overflow-x-auto pb-2 scrollbar-hide bg-white p-2 rounded-2xl shadow-sm border border-slate-100 w-fit">
                    <button onClick={() => setActiveTab('overview')} className={`px-5 py-3 font-bold flex items-center rounded-xl transition-all whitespace-nowrap ${activeTab === 'overview' ? 'bg-[#0D5C35] text-white shadow-md' : 'text-slate-500 hover:bg-slate-50'}`}><BarChart3 className="w-5 h-5 mr-2" /> Dashboard</button>
                    <button onClick={() => setActiveTab('sop')} className={`px-5 py-3 font-bold flex items-center rounded-xl transition-all whitespace-nowrap ${activeTab === 'sop' ? 'bg-[#0D5C35] text-white shadow-md' : 'text-slate-500 hover:bg-slate-50'}`}><LayoutList className="w-5 h-5 mr-2" /> Data SOP</button>
                    <button onClick={() => setActiveTab('faq')} className={`px-5 py-3 font-bold flex items-center rounded-xl transition-all whitespace-nowrap ${activeTab === 'faq' ? 'bg-[#0D5C35] text-white shadow-md' : 'text-slate-500 hover:bg-slate-50'}`}><HelpCircle className="w-5 h-5 mr-2" /> Data FAQ</button>
                    <button onClick={() => setActiveTab('guide')} className={`px-5 py-3 font-bold flex items-center rounded-xl transition-all whitespace-nowrap ${activeTab === 'guide' ? 'bg-[#0D5C35] text-white shadow-md' : 'text-slate-500 hover:bg-slate-50'}`}><BookOpen className="w-5 h-5 mr-2" /> Data Panduan</button>
                </div>

                {activeTab === 'overview' && (
                    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                            <div className="bg-white p-8 rounded-3xl shadow-sm border border-slate-100 flex items-center space-x-5 transform transition hover:-translate-y-1 hover:shadow-xl">
                                <div className="p-4 bg-blue-50 rounded-2xl text-blue-600"><FileText className="w-10 h-10" /></div>
                                <div><p className="text-slate-400 text-sm font-bold uppercase tracking-wider">Total Dokumen</p><h3 className="text-4xl font-black text-slate-800">{contents.length}</h3></div>
                            </div>
                            <div className="bg-white p-8 rounded-3xl shadow-sm border border-slate-100 flex items-center space-x-5 transform transition hover:-translate-y-1 hover:shadow-xl">
                                <div className="p-4 bg-emerald-50 rounded-2xl text-emerald-600"><Eye className="w-10 h-10" /></div>
                                <div><p className="text-slate-400 text-sm font-bold uppercase tracking-wider">Total Dilihat</p><h3 className="text-4xl font-black text-slate-800">{stats.totalViews}</h3></div>
                            </div>
                            <div className="bg-white p-8 rounded-3xl shadow-sm border border-slate-100 flex items-center space-x-5 transform transition hover:-translate-y-1 hover:shadow-xl">
                                <div className="p-4 bg-amber-50 rounded-2xl text-amber-600"><ThumbsUp className="w-10 h-10" /></div>
                                <div><p className="text-slate-400 text-sm font-bold uppercase tracking-wider">Total Apresiasi</p><h3 className="text-4xl font-black text-slate-800">{stats.totalLikes}</h3></div>
                            </div>
                        </div>

                        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                            <div className="bg-white p-8 rounded-3xl shadow-sm border border-slate-100">
                                <h3 className="font-bold text-slate-800 mb-8 flex items-center text-lg"><TrendingUp className="w-6 h-6 mr-3 text-[#0D5C35]" /> Dokumen Terpopuler (Top 5)</h3>
                                <div className="h-80 w-full">
                                    <ResponsiveContainer width="100%" height="100%">
                                        <BarChart data={stats.topViewed} layout="vertical" margin={{ top: 5, right: 30, left: 20, bottom: 5 }}>
                                            <CartesianGrid strokeDasharray="3 3" horizontal={true} vertical={false} stroke="#f1f5f9" />
                                            <XAxis type="number" hide />
                                            <YAxis dataKey="name" type="category" width={120} tick={{ fontSize: 11, fontWeight: 600, fill: '#64748b' }} axisLine={false} tickLine={false} />
                                            <Tooltip cursor={{ fill: '#f8fafc' }} contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)' }} />
                                            <Bar dataKey="views" fill="#0D5C35" radius={[0, 8, 8, 0]} barSize={24} />
                                        </BarChart>
                                    </ResponsiveContainer>
                                </div>
                            </div>

                            <div className="bg-white p-8 rounded-3xl shadow-sm border border-slate-100">
                                <h3 className="font-bold text-slate-800 mb-8 flex items-center text-lg"><PieChartIcon className="w-6 h-6 mr-3 text-[#0D5C35]" /> Distribusi Kategori</h3>
                                <div className="h-80 w-full min-w-[300px]">
                                    <ResponsiveContainer width="100%" height="100%">
                                        <PieChart>
                                            <Pie data={stats.pieData} cx="50%" cy="50%" innerRadius={70} outerRadius={90} fill="#8884d8" paddingAngle={5} dataKey="value">
                                                {stats.pieData.map((entry, index) => (
                                                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                                                ))}
                                            </Pie>
                                            <Tooltip contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)' }} />
                                            <Legend verticalAlign="bottom" height={70} iconType="circle" wrapperStyle={{ fontSize: '11px', fontWeight: 600, color: '#64748b' }} />
                                        </PieChart>
                                    </ResponsiveContainer>
                                </div>
                            </div>
                        </div>
                    </div>
                )}

                {activeTab === 'sop' && (
                    <div className="animate-in fade-in zoom-in duration-300">
                        <div className="bg-white p-5 rounded-3xl shadow-sm border border-slate-200 mb-6 flex flex-col md:flex-row justify-between items-center gap-4">
                            <div className="flex flex-col sm:flex-row gap-3 w-full md:w-auto flex-grow">
                                <div className="relative w-full md:max-w-xs">
                                    <Search className="w-5 h-5 absolute left-4 top-3 text-slate-400" />
                                    <input
                                        type="text"
                                        placeholder="Cari judul SOP..."
                                        className="w-full pl-11 pr-4 py-2.5 rounded-xl border border-slate-200 focus:ring-2 focus:ring-[#0D5C35] outline-none text-sm font-medium"
                                        value={searchTerm}
                                        onChange={(e) => setSearchTerm(e.target.value)}
                                    />
                                </div>
                                <div className="relative w-full md:w-48">
                                    <Filter className="w-5 h-5 absolute left-4 top-3 text-slate-400" />
                                    <select
                                        className="w-full pl-11 pr-4 py-2.5 rounded-xl border border-slate-200 focus:ring-2 focus:ring-[#0D5C35] outline-none text-sm font-medium appearance-none cursor-pointer"
                                        value={filterCategory}
                                        onChange={(e) => setFilterCategory(e.target.value)}
                                    >
                                        <option value="all">Semua Kategori</option>
                                        <option value="psp">PSP</option>
                                        <option value="sewa">SEWA</option>
                                        <option value="penjualan">PENJUALAN</option>
                                        <option value="penghapusan">PENGHAPUSAN</option>
                                        <option value="pinjam-pakai">PINJAM PAKAI</option>
                                        <option value="penggunaan-sementara">PENGGUNAAN SEMENTARA</option>
                                        <option value="alih-status">ALIH STATUS</option>
                                        <option value="hibah">HIBAH</option>
                                    </select>
                                </div>
                            </div>

                            <div className="flex gap-3 w-full md:w-auto">
                                <button onClick={handleExportExcel} className="flex-1 md:flex-none flex items-center justify-center bg-white border-2 border-[#00A3C8] text-[#00A3C8] px-5 py-2.5 rounded-xl font-bold hover:bg-[#00A3C8] hover:text-white transition-colors">
                                    <FileSpreadsheet className="w-5 h-5 mr-2" /> Export
                                </button>
                                <button onClick={handleAddSop} className="flex-1 md:flex-none flex items-center justify-center bg-[#0D5C35] text-white px-5 py-2.5 rounded-xl font-bold shadow-lg shadow-emerald-200 hover:bg-[#0A492A] hover:shadow-xl hover:-translate-y-0.5 transition-all">
                                    <Plus className="w-5 h-5 mr-2" /> Tambah
                                </button>
                            </div>
                        </div>

                        <div className="bg-white rounded-3xl shadow-sm border border-slate-200 overflow-hidden overflow-x-auto">
                            <div className="max-h-[600px] overflow-y-auto custom-scrollbar">
                                <table className="w-full text-left border-collapse min-w-[800px] relative">
                                    <thead className="bg-slate-50 text-slate-500 text-xs uppercase font-black tracking-wider sticky top-0 z-10 shadow-sm">
                                        <tr>
                                            <th className="p-6">Judul & Info</th>
                                            <th className="p-6">Kategori</th>
                                            <th className="p-6 text-center">Statistik</th>
                                            <th className="p-6 text-center">Aksi</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-slate-100">
                                        {filteredContents.length > 0 ? (
                                            filteredContents.map(item => (
                                                <tr key={item.id} className="hover:bg-slate-50 transition-colors group">
                                                    <td className="p-6">
                                                        <p className="font-bold text-slate-800 text-base mb-1">{item.title}</p>
                                                        <p className="text-xs text-slate-400 flex items-center">
                                                            Update: {formatTime(item.updatedAt)}
                                                        </p>
                                                    </td>
                                                    <td className="p-6">
                                                        <span className={`px-4 py-1.5 rounded-full text-[10px] font-black uppercase tracking-wider border shadow-sm ${getCategoryColor(item.category || 'psp')}`}>
                                                            {(item.category || 'psp').replace('-', ' ')}
                                                        </span>
                                                    </td>
                                                    <td className="p-6 text-center">
                                                        <div className="flex items-center justify-center space-x-3 text-xs font-bold text-slate-600">
                                                            <span className="flex items-center bg-blue-50/80 px-3 py-1.5 rounded-lg text-blue-600 border border-blue-100" title="Jumlah Dilihat"><Eye className="w-3.5 h-3.5 mr-1.5" /> {item.views || 0}</span>
                                                            <span className="flex items-center bg-emerald-50/80 px-3 py-1.5 rounded-lg text-emerald-600 border border-emerald-100" title="Jumlah Like"><ThumbsUp className="w-3.5 h-3.5 mr-1.5" /> {item.likes || 0}</span>
                                                        </div>
                                                    </td>
                                                    <td className="p-6 text-center flex justify-center space-x-3">
                                                        <button onClick={() => handleEditSop(item)} aria-label="Edit SOP" className="p-2.5 text-amber-600 bg-amber-50 hover:bg-amber-500 hover:text-white rounded-xl transition-all border border-amber-100"><Edit className="w-4 h-4" /></button>
                                                        <button onClick={() => confirmDelete("knowledge-base", item.id)} aria-label="Hapus SOP" className="p-2.5 text-rose-600 bg-rose-50 hover:bg-rose-500 hover:text-white rounded-xl transition-all border border-rose-100"><Trash2 className="w-4 h-4" /></button>
                                                    </td>
                                                </tr>
                                            ))
                                        ) : (
                                            <tr>
                                                <td colSpan={4} className="p-16 text-center">
                                                    <div className="flex flex-col items-center justify-center">
                                                        <FileText className="w-16 h-16 text-slate-200 mb-4" />
                                                        <p className="text-slate-500 font-bold text-lg">Tidak ada data yang cocok dengan filter.</p>
                                                    </div>
                                                </td>
                                            </tr>
                                        )}
                                    </tbody>
                                </table>
                            </div>
                        </div>
                    </div>
                )}

                {activeTab === 'faq' && (
                    <div className="grid gap-6 animate-in fade-in zoom-in duration-300">
                        <div className="flex justify-end"><button onClick={handleAddFaq} className="flex items-center bg-[#0D5C35] text-white px-6 py-3 rounded-xl font-bold shadow-lg shadow-emerald-200 hover:bg-[#0A492A] hover:-translate-y-0.5 transition-all"><Plus className="w-5 h-5 mr-2" /> Tambah FAQ</button></div>
                        {faqs.map(item => (
                            <div key={item.id} className="bg-white p-8 rounded-3xl border border-slate-200 shadow-sm hover:shadow-md transition-shadow flex justify-between items-start group">
                                <div className="flex-grow pr-6">
                                    <div className="flex items-center mb-3">
                                        <span className="bg-amber-100 text-amber-700 font-black px-3 py-1 rounded-lg mr-3 text-sm">Q</span>
                                        <h3 className="font-bold text-slate-800 text-lg">{item.question}</h3>
                                    </div>
                                    <div className="flex items-start">
                                        <span className="bg-emerald-100 text-emerald-700 font-black px-3 py-1 rounded-lg mr-3 text-sm mt-1">A</span>
                                        <p className="text-slate-600 whitespace-pre-line leading-relaxed mt-1">{item.answer}</p>
                                    </div>
                                </div>
                                <div className="flex flex-col space-y-3 flex-shrink-0 opacity-100 sm:opacity-0 group-hover:opacity-100 transition-opacity">
                                    <button onClick={() => handleEditFaq(item)} aria-label="Edit FAQ" className="text-amber-600 bg-amber-50 hover:bg-amber-500 hover:text-white p-3 border border-amber-100 rounded-xl transition-all"><Edit className="w-4 h-4" /></button>
                                    <button onClick={() => confirmDelete("faqs", item.id)} aria-label="Hapus FAQ" className="text-rose-600 bg-rose-50 hover:bg-rose-500 hover:text-white p-3 border border-rose-100 rounded-xl transition-all"><Trash2 className="w-4 h-4" /></button>
                                </div>
                            </div>
                        ))}
                        {faqs.length === 0 && (
                            <div className="bg-white p-16 rounded-3xl border border-slate-200 text-center">
                                <HelpCircle className="w-16 h-16 text-slate-200 mx-auto mb-4" />
                                <p className="text-slate-500 font-bold text-lg">Belum ada FAQ yang dibuat.</p>
                            </div>
                        )}
                    </div>
                )}

                {activeTab === 'guide' && (
                    <div className="animate-in fade-in zoom-in duration-300">
                        <div className="flex justify-end mb-6">
                            {guides.length === 0 && (
                                <button onClick={handleAddGuide} className="flex items-center bg-[#0D5C35] text-white px-6 py-3 rounded-xl font-bold shadow-lg shadow-emerald-200 hover:bg-[#0A492A] hover:-translate-y-0.5 transition-all">
                                    <Plus className="w-5 h-5 mr-2" /> Buat Panduan
                                </button>
                            )}
                        </div>

                        <div className="bg-white rounded-3xl shadow-sm border border-slate-200 overflow-hidden overflow-x-auto">
                            <table className="w-full text-left border-collapse min-w-[800px]">
                                <thead className="bg-slate-50 text-slate-500 text-xs uppercase font-black tracking-wider border-b border-slate-200">
                                    <tr><th className="p-6 w-20">#</th><th className="p-6">Isi Panduan (Preview)</th><th className="p-6 w-40 text-center">Update</th><th className="p-6 text-center w-40">Aksi</th></tr>
                                </thead>
                                <tbody className="divide-y divide-slate-100">
                                    {guides.map((item, index) => (
                                        <tr key={item.id} className="hover:bg-slate-50 transition-colors">
                                            <td className="p-6 font-black text-slate-400">{index + 1}</td>
                                            <td className="p-6">
                                                <p className="text-slate-600 text-sm line-clamp-2 font-medium bg-slate-50 p-3 rounded-xl border border-slate-100">{item.content}</p>
                                            </td>
                                            <td className="p-6 text-center text-xs font-bold text-slate-400">
                                                {formatTime(item.updatedAt)}
                                            </td>
                                            <td className="p-6 text-center flex justify-center space-x-3">
                                                <button onClick={() => handleEditGuide(item)} aria-label="Edit Panduan" className="p-2.5 text-amber-600 bg-amber-50 hover:bg-amber-500 hover:text-white rounded-xl transition-all border border-amber-100"><Edit className="w-4 h-4" /></button>
                                                <button onClick={() => confirmDelete("guides", item.id)} aria-label="Hapus Panduan" className="p-2.5 text-rose-600 bg-rose-50 hover:bg-rose-500 hover:text-white rounded-xl transition-all border border-rose-100"><Trash2 className="w-4 h-4" /></button>
                                            </td>
                                        </tr>
                                    ))}
                                    {guides.length === 0 && <tr><td colSpan={4} className="p-16 text-center text-slate-400 font-bold italic">Belum ada panduan yang dibuat.</td></tr>}
                                </tbody>
                            </table>
                        </div>
                    </div>
                )}
            </main>

            {/* MODAL KONFIRMASI */}
            {confirmModal.isOpen && (
                <div className="fixed inset-0 bg-slate-900/60 z-[60] flex items-center justify-center p-4 backdrop-blur-sm animate-in fade-in duration-200">
                    <div className="bg-white rounded-3xl w-full max-w-sm p-8 shadow-2xl transform scale-100 transition-all border border-white/20">
                        <div className="flex flex-col items-center text-center">
                            <div className={`w-20 h-20 rounded-full flex items-center justify-center mb-6 shadow-inner ${confirmModal.type === 'delete' ? 'bg-rose-50 text-rose-500 border-4 border-rose-100' : 'bg-amber-50 text-amber-500 border-4 border-amber-100'}`}>
                                <AlertTriangle className="w-10 h-10" />
                            </div>
                            <h3 className="text-2xl font-black text-slate-800 mb-3 tracking-tight">{confirmModal.title}</h3>
                            <p className="text-slate-500 mb-8 leading-relaxed font-medium">{confirmModal.message}</p>
                            <div className="flex w-full space-x-4">
                                <button onClick={() => setConfirmModal(prev => ({ ...prev, isOpen: false }))} className="flex-1 px-4 py-3 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold rounded-xl transition-colors">Batal</button>
                                <button onClick={confirmModal.onConfirm} className={`flex-1 px-4 py-3 text-white font-bold rounded-xl shadow-lg transition-all transform active:scale-95 ${confirmModal.type === 'delete' ? 'bg-rose-600 hover:bg-rose-700 shadow-rose-200' : 'bg-amber-500 hover:bg-amber-600 shadow-amber-200'}`}>{confirmModal.type === 'delete' ? 'Ya, Hapus' : 'Ya, Keluar'}</button>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* MODAL INPUT (SOP) */}
            {isModalOpen && (
                <div className="fixed inset-0 bg-slate-900/60 z-50 flex items-center justify-center p-4 backdrop-blur-sm animate-in fade-in zoom-in-95 duration-200">
                    <div className="bg-white rounded-3xl w-full max-w-3xl p-8 overflow-y-auto max-h-[90vh] shadow-2xl border border-white/20">
                        <div className="flex justify-between items-center mb-6 pb-4 border-b border-slate-100">
                            <h3 className="font-black text-2xl text-slate-800 flex items-center">
                                <FileText className="w-6 h-6 mr-3 text-[#0D5C35]" />
                                {editingId ? 'Edit SOP / Layanan' : 'Tambah SOP Baru'}
                            </h3>
                            <button type="button" onClick={() => setIsModalOpen(false)} className="p-2 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-full transition-colors"><X className="w-6 h-6" /></button>
                        </div>
                        <form onSubmit={handleSaveSop} className="space-y-5">
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                                <div className="space-y-1.5">
                                    <label className="text-xs font-bold text-slate-500 uppercase tracking-wider ml-1">Judul Dokumen</label>
                                    <input type="text" placeholder="Masukkan judul..." className="w-full p-3.5 border border-slate-200 rounded-xl focus:ring-2 focus:ring-[#0D5C35] outline-none font-medium bg-slate-50 focus:bg-white transition-colors" required value={formData.title} onChange={e => setFormData({ ...formData, title: e.target.value })} />
                                </div>
                                <div className="space-y-1.5">
                                    <label className="text-xs font-bold text-slate-500 uppercase tracking-wider ml-1">Kategori</label>
                                    <select className="w-full p-3.5 border border-slate-200 rounded-xl focus:ring-2 focus:ring-[#0D5C35] outline-none font-bold text-slate-700 bg-slate-50 focus:bg-white transition-colors cursor-pointer" value={formData.category} onChange={e => setFormData({ ...formData, category: e.target.value })}>
                                        <option value="psp">PSP</option>
                                        <option value="sewa">SEWA</option>
                                        <option value="penjualan">PENJUALAN</option>
                                        <option value="penghapusan">PENGHAPUSAN</option>
                                        <option value="pinjam-pakai">PINJAM PAKAI</option>
                                        <option value="penggunaan-sementara">PENGGUNAAN SEMENTARA</option>
                                        <option value="alih-status">ALIH STATUS</option>
                                        <option value="hibah">HIBAH</option>
                                    </select>
                                </div>
                            </div>

                            <div className="space-y-1.5">
                                <label className="text-xs font-bold text-slate-500 uppercase tracking-wider ml-1">Deskripsi Singkat (Preview)</label>
                                <input type="text" placeholder="Kalimat pendek untuk ditampilkan di halaman awal..." className="w-full p-3.5 border border-slate-200 rounded-xl focus:ring-2 focus:ring-[#0D5C35] outline-none font-medium bg-slate-50 focus:bg-white transition-colors" required value={formData.description} onChange={e => setFormData({ ...formData, description: e.target.value })} />
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                                <div className="space-y-1.5">
                                    <label className="text-xs font-bold text-slate-500 uppercase tracking-wider ml-1">Gambar / Diagram (Opsional)</label>
                                    <input type="file" accept="image/*" onChange={handleImageUpload} className="block w-full text-sm text-slate-500 file:mr-4 file:py-3 file:px-4 file:rounded-lg file:border-0 file:text-sm file:font-bold file:bg-emerald-50 file:text-emerald-700 hover:file:bg-emerald-100 cursor-pointer border border-slate-200 rounded-xl bg-slate-50" />
                                </div>
                                <div className="space-y-1.5">
                                    <label className="text-xs font-bold text-slate-500 uppercase tracking-wider ml-1 flex justify-between">
                                        <span>Link Video Tutorial</span><span className="text-slate-400 lowercase normal-case font-normal">(Opsional)</span>
                                    </label>
                                    <input type="url" placeholder="Link YouTube / Google Drive..." className="w-full p-3.5 border border-slate-200 rounded-xl focus:ring-2 focus:ring-[#0D5C35] outline-none font-medium bg-slate-50 focus:bg-white transition-colors" value={formData.videoUrl} onChange={e => setFormData({ ...formData, videoUrl: e.target.value })} />
                                </div>
                            </div>

                            <div className="space-y-1.5">
                                <label className="text-xs font-bold text-slate-500 uppercase tracking-wider ml-1 flex justify-between">
                                    <span>Link File Excel / PDF Dokumen</span><span className="text-slate-400 lowercase normal-case font-normal">(Opsional)</span>
                                </label>
                                <input type="url" placeholder="https://drive.google.com/..." className="w-full p-3.5 border border-slate-200 rounded-xl focus:ring-2 focus:ring-[#0D5C35] outline-none font-medium bg-slate-50 focus:bg-white transition-colors" value={formData.pdfUrl} onChange={e => setFormData({ ...formData, pdfUrl: e.target.value })} />
                            </div>

                            <div className="space-y-1.5 pt-2">
                                <label className="text-xs font-bold text-slate-500 uppercase tracking-wider ml-1 flex items-center justify-between">
                                    <span>Isi Dokumen (Mendukung Markdown)</span>
                                </label>
                                <div className="border border-slate-200 rounded-xl overflow-hidden focus-within:ring-2 focus-within:ring-[#0D5C35] focus-within:border-transparent transition-all shadow-sm">
                                    {/* ✅ FormatToolbar sekarang menerima onInsert sebagai prop */}
                                    <FormatToolbar target="sop" onInsert={insertFormat} />
                                    <textarea id="content-editor" placeholder="Ketik isi SOP di sini..." rows={12} className="w-full p-5 font-mono text-sm outline-none bg-slate-50 focus:bg-white resize-y" required value={formData.content} onChange={e => setFormData({ ...formData, content: e.target.value })}></textarea>
                                </div>
                            </div>

                            <div className="flex justify-end gap-3 pt-6 border-t border-slate-100">
                                <button type="button" onClick={() => setIsModalOpen(false)} className="px-6 py-3 font-bold text-slate-500 bg-slate-100 hover:bg-slate-200 rounded-xl transition-colors">Batal</button>
                                <button type="submit" disabled={isSaving} className="px-8 py-3 bg-[#0D5C35] hover:bg-[#0A492A] text-white rounded-xl font-bold shadow-lg shadow-emerald-200 transition-all flex items-center">
                                    {isSaving ? <><RefreshCw className="w-5 h-5 mr-2 animate-spin" /> Menyimpan...</> : 'Simpan Data'}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {/* MODAL INPUT (FAQ) */}
            {isFaqModalOpen && (
                <div className="fixed inset-0 bg-slate-900/60 z-50 flex items-center justify-center p-4 backdrop-blur-sm animate-in fade-in zoom-in-95 duration-200">
                    <div className="bg-white rounded-3xl w-full max-w-2xl p-8 shadow-2xl border border-white/20">
                        <div className="flex justify-between items-center mb-6 pb-4 border-b border-slate-100">
                            <h3 className="font-black text-2xl text-slate-800 flex items-center"><HelpCircle className="w-6 h-6 mr-3 text-amber-500" />{editingId ? 'Edit FAQ' : 'Tambah FAQ Baru'}</h3>
                            <button type="button" onClick={() => setIsFaqModalOpen(false)} className="p-2 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-full transition-colors"><X className="w-6 h-6" /></button>
                        </div>
                        <form onSubmit={handleSaveFaq} className="space-y-5">
                            <div className="space-y-1.5">
                                <label className="text-xs font-bold text-slate-500 uppercase tracking-wider ml-1">Pertanyaan (Q)</label>
                                <input type="text" placeholder="Masukkan pertanyaan..." className="w-full p-3.5 border border-slate-200 rounded-xl focus:ring-2 focus:ring-[#0D5C35] outline-none font-bold text-slate-800 bg-slate-50 focus:bg-white transition-colors" value={faqForm.question} onChange={e => setFaqForm({ ...faqForm, question: e.target.value })} required />
                            </div>

                            <div className="space-y-1.5 pt-2">
                                <label className="text-xs font-bold text-slate-500 uppercase tracking-wider ml-1">Jawaban (A)</label>
                                <div className="border border-slate-200 rounded-xl overflow-hidden focus-within:ring-2 focus-within:ring-[#0D5C35] focus-within:border-transparent transition-all shadow-sm">
                                    <FormatToolbar target="faq" onInsert={insertFormat} />
                                    <textarea id="faq-editor" placeholder="Ketik jawaban di sini..." rows={8} className="w-full p-5 font-mono text-sm outline-none bg-slate-50 focus:bg-white resize-y" value={faqForm.answer} onChange={e => setFaqForm({ ...faqForm, answer: e.target.value })} required />
                                </div>
                            </div>

                            <div className="flex justify-end gap-3 pt-6 border-t border-slate-100">
                                <button type="button" onClick={() => setIsFaqModalOpen(false)} className="px-6 py-3 font-bold text-slate-500 bg-slate-100 hover:bg-slate-200 rounded-xl transition-colors">Batal</button>
                                <button type="submit" disabled={isSaving} className="px-8 py-3 bg-[#0D5C35] hover:bg-[#0A492A] text-white rounded-xl font-bold shadow-lg shadow-emerald-200 transition-all flex items-center">
                                    {isSaving ? <><RefreshCw className="w-5 h-5 mr-2 animate-spin" /> Menyimpan...</> : 'Simpan FAQ'}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {/* MODAL INPUT (PANDUAN) */}
            {isGuideModalOpen && (
                <div className="fixed inset-0 bg-slate-900/60 z-50 flex items-center justify-center p-4 backdrop-blur-sm animate-in fade-in zoom-in-95 duration-200">
                    <div className="bg-white rounded-3xl w-full max-w-3xl p-8 shadow-2xl border border-white/20">
                        <div className="flex justify-between items-center mb-6 pb-4 border-b border-slate-100">
                            <h3 className="font-black text-2xl text-slate-800 flex items-center"><BookOpen className="w-6 h-6 mr-3 text-blue-500" />{editingId ? 'Edit Panduan Pengguna' : 'Buat Panduan Pengguna'}</h3>
                            <button type="button" onClick={() => setIsGuideModalOpen(false)} className="p-2 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-full transition-colors"><X className="w-6 h-6" /></button>
                        </div>
                        <form onSubmit={handleSaveGuide} className="space-y-5">
                            <div className="space-y-1.5">
                                <label className="text-xs font-bold text-slate-500 uppercase tracking-wider ml-1">Isi Panduan Utama</label>
                                <div className="border border-slate-200 rounded-xl overflow-hidden focus-within:ring-2 focus-within:ring-[#0D5C35] focus-within:border-transparent transition-all shadow-sm">
                                    <FormatToolbar target="guide" onInsert={insertFormat} />
                                    <textarea id="guide-editor" placeholder="Ketik panduan lengkap di sini..." rows={15} className="w-full p-5 font-mono text-sm outline-none bg-slate-50 focus:bg-white resize-y" value={guideForm.content} onChange={e => setGuideForm({ ...guideForm, content: e.target.value })} required />
                                </div>
                            </div>
                            <div className="flex justify-end gap-3 pt-6 border-t border-slate-100">
                                <button type="button" onClick={() => setIsGuideModalOpen(false)} className="px-6 py-3 font-bold text-slate-500 bg-slate-100 hover:bg-slate-200 rounded-xl transition-colors">Batal</button>
                                <button type="submit" disabled={isSaving} className="px-8 py-3 bg-[#0D5C35] hover:bg-[#0A492A] text-white rounded-xl font-bold shadow-lg shadow-emerald-200 transition-all flex items-center">
                                    {isSaving ? <><RefreshCw className="w-5 h-5 mr-2 animate-spin" /> Menyimpan...</> : 'Simpan Panduan'}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
};

export default AdminDashboard;