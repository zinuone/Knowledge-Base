// File: src/pages/AdminDashboard.tsx
import React, { useEffect, useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { signOut } from 'firebase/auth';
import {
    collection, addDoc, deleteDoc, updateDoc, doc, onSnapshot,
    serverTimestamp, query, orderBy
} from 'firebase/firestore';
import { auth, db } from '../firebase';
import {
    LogOut, Plus, Trash2, FileText, HelpCircle, LayoutList, Edit, BookOpen, Quote,
    Eye, ThumbsUp, BarChart3, PieChart as PieChartIcon, TrendingUp, FileSpreadsheet,
    AlertTriangle, X, List as ListIcon, Type, Hash, Search, Filter, RefreshCw,
    Menu, ChevronRight, Home,
} from 'lucide-react';
import {
    BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
    Cell, PieChart, Pie, Legend
} from 'recharts';
import * as XLSX from 'xlsx';
import toast, { Toaster } from 'react-hot-toast';

/* ─── TIPE DATA ───────────────────────────────────────────────── */
interface ContentData {
    id: string; title: string; category: string; description: string;
    content: string; imageBase64?: string; pdfUrl?: string; videoUrl?: string;
    views?: number; likes?: number; updatedAt?: any;
}
interface FAQData { id: string; question: string; answer: string; }
interface GuideData { id: string; content: string; updatedAt?: any; }

/* ─── HELPERS ─────────────────────────────────────────────────── */
const getCategoryColor = (cat: string) => {
    const map: Record<string, string> = {
        'psp': 'bg-emerald-100 text-emerald-800 border-emerald-200',
        'penjualan': 'bg-amber-100   text-amber-800   border-amber-200',
        'sewa': 'bg-blue-100    text-blue-800    border-blue-200',
        'penghapusan': 'bg-rose-100    text-rose-800    border-rose-200',
        'pinjam-pakai': 'bg-indigo-100  text-indigo-800  border-indigo-200',
        'penggunaan-sementara': 'bg-purple-100  text-purple-800  border-purple-200',
        'alih-status': 'bg-teal-100    text-teal-800    border-teal-200',
        'hibah': 'bg-orange-100  text-orange-800  border-orange-200',
    };
    return map[cat] ?? 'bg-slate-100 text-slate-800 border-slate-200';
};
const CHART_COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884d8', '#82ca9d', '#ffc658', '#f97316'];

/* ─── FORMAT TOOLBAR (di luar komponen agar tidak unmount) ─────── */
const FormatToolbar = ({
    target, onInsert
}: {
    target: 'sop' | 'faq' | 'guide';
    onInsert: (t: 'sop' | 'faq' | 'guide', tag: string) => void;
}) => (
    <div className="flex flex-wrap gap-2 p-2 bg-slate-100 border-b rounded-t-lg">
        <button type="button" onClick={() => onInsert(target, 'bold')} className="p-1.5 hover:bg-white rounded text-slate-600 transition" title="Tebal"><Type className="w-4 h-4" /></button>
        <button type="button" onClick={() => onInsert(target, 'list')} className="p-1.5 hover:bg-white rounded text-slate-600 transition" title="List"><ListIcon className="w-4 h-4" /></button>
        <button type="button" onClick={() => onInsert(target, 'number')} className="p-1.5 hover:bg-white rounded text-slate-600 transition" title="Nomor"><Hash className="w-4 h-4" /></button>
        <button type="button" onClick={() => onInsert(target, 'h2')} className="px-2 py-1 bg-white border rounded text-xs font-bold hover:bg-slate-50">H2</button>
        <button type="button" onClick={() => onInsert(target, 'h3')} className="px-2 py-1 bg-white border rounded text-xs font-bold hover:bg-slate-50">H3</button>
        <button type="button" onClick={() => onInsert(target, 'quote')} className="p-1.5 hover:bg-white rounded text-slate-600 transition" title="Kutipan"><Quote className="w-4 h-4" /></button>
    </div>
);

/* ═══════════════════════════════════════════════════════════════
   ADMIN DASHBOARD
═══════════════════════════════════════════════════════════════ */
const AdminDashboard: React.FC = () => {
    const navigate = useNavigate();
    const [activeTab, setActiveTab] = useState<'overview' | 'sop' | 'faq' | 'guide'>('overview');
    const [sidebarOpen, setSidebarOpen] = useState(false); // mobile sidebar

    const [contents, setContents] = useState<ContentData[]>([]);
    const [faqs, setFaqs] = useState<FAQData[]>([]);
    const [guides, setGuides] = useState<GuideData[]>([]);

    const [searchTerm, setSearchTerm] = useState('');
    const [filterCategory, setFilterCategory] = useState('all');

    const [isModalOpen, setIsModalOpen] = useState(false);
    const [isFaqModalOpen, setIsFaqModalOpen] = useState(false);
    const [isGuideModalOpen, setIsGuideModalOpen] = useState(false);

    const [confirmModal, setConfirmModal] = useState<{
        isOpen: boolean; type: 'delete' | 'logout';
        title: string; message: string; onConfirm: () => void;
    }>({ isOpen: false, type: 'delete', title: '', message: '', onConfirm: () => { } });

    const [isSaving, setIsSaving] = useState(false);
    const [editingId, setEditingId] = useState<string | null>(null);

    const [formData, setFormData] = useState({ title: '', category: 'psp', description: '', content: '', imageBase64: '', pdfUrl: '', videoUrl: '' });
    const [faqForm, setFaqForm] = useState({ question: '', answer: '' });
    const [guideForm, setGuideForm] = useState({ content: '' });

    /* ── Firebase ── */
    const formatTime = (ts: any) => ts?.seconds ? new Date(ts.seconds * 1000).toLocaleDateString('id-ID') : '-';

    useEffect(() => {
        const qSop = query(collection(db, 'knowledge-base'), orderBy('updatedAt', 'desc'));
        const qFaq = query(collection(db, 'faqs'), orderBy('createdAt', 'desc'));
        const qGuide = query(collection(db, 'guides'), orderBy('updatedAt', 'desc'));
        const u1 = onSnapshot(qSop, s => setContents(s.docs.map(d => ({ id: d.id, ...d.data() })) as ContentData[]));
        const u2 = onSnapshot(qFaq, s => setFaqs(s.docs.map(d => ({ id: d.id, ...d.data() })) as FAQData[]));
        const u3 = onSnapshot(qGuide, s => setGuides(s.docs.map(d => ({ id: d.id, ...d.data() })) as GuideData[]));
        return () => { u1(); u2(); u3(); };
    }, []);

    /* ── Stats ── */
    const stats = useMemo(() => {
        const totalViews = contents.reduce((a, c) => a + (c.views || 0), 0);
        const totalLikes = contents.reduce((a, c) => a + (c.likes || 0), 0);
        const topViewed = [...contents].sort((a, b) => (b.views || 0) - (a.views || 0)).slice(0, 5).map(i => {
            const t = i.title || 'Tanpa Judul';
            return { name: t.length > 20 ? t.substring(0, 20) + '...' : t, views: i.views || 0 };
        });
        const catDist: Record<string, number> = {};
        contents.forEach(i => {
            const k = (i.category || 'psp').toUpperCase().replace('-', ' ');
            catDist[k] = (catDist[k] || 0) + 1;
        });
        const pieData = Object.entries(catDist).map(([name, value]) => ({ name, value }));
        return { totalViews, totalLikes, topViewed, pieData };
    }, [contents]);

    const filteredContents = useMemo(() => {
        return contents.filter(i => {
            const ms = (i.title || '').toLowerCase().includes(searchTerm.toLowerCase()) || (i.description || '').toLowerCase().includes(searchTerm.toLowerCase());
            const mc = filterCategory === 'all' || i.category === filterCategory;
            return ms && mc;
        });
    }, [contents, searchTerm, filterCategory]);

    /* ── Handlers ── */
    const handleExportExcel = () => {
        const data = contents.map((i, idx) => ({
            No: idx + 1, Judul: i.title,
            Kategori: (i.category || '').toUpperCase().replace('-', ' '),
            'Dilihat (Views)': i.views || 0, 'Disukai (Likes)': i.likes || 0,
            'Terakhir Update': formatTime(i.updatedAt), Deskripsi: i.description,
        }));
        const ws = XLSX.utils.json_to_sheet(data);
        const wb = XLSX.utils.book_new();
        XLSX.utils.book_append_sheet(wb, ws, 'Laporan SOP');
        XLSX.writeFile(wb, `Laporan_KPKNL_KnowledgeBase_${new Date().toISOString().split('T')[0]}.xlsx`);
        toast.success('Laporan berhasil didownload!');
    };

    const confirmDelete = (col: string, id: string) => {
        setConfirmModal({
            isOpen: true, type: 'delete', title: 'Hapus Data?',
            message: 'Tindakan ini tidak dapat dibatalkan. Data akan hilang permanen.',
            onConfirm: async () => {
                toast.promise(deleteDoc(doc(db, col, id)), { loading: 'Menghapus...', success: 'Data dihapus!', error: 'Gagal menghapus.' });
                setConfirmModal(p => ({ ...p, isOpen: false }));
            },
        });
    };

    const confirmLogout = () => {
        setConfirmModal({
            isOpen: true, type: 'logout', title: 'Konfirmasi Keluar',
            message: 'Apakah Anda yakin ingin keluar dari sesi Admin?',
            onConfirm: async () => {
                await signOut(auth);
                toast('Sampai jumpa!', { icon: '👋' });
                navigate('/login');
                setConfirmModal(p => ({ ...p, isOpen: false }));
            },
        });
    };

    const handleEditSop = (i: ContentData) => { setEditingId(i.id); setFormData({ ...i, imageBase64: i.imageBase64 || '', pdfUrl: i.pdfUrl || '', videoUrl: i.videoUrl || '' }); setIsModalOpen(true); };
    const handleEditFaq = (i: FAQData) => { setEditingId(i.id); setFaqForm({ ...i }); setIsFaqModalOpen(true); };
    const handleEditGuide = (i: GuideData) => { setEditingId(i.id); setGuideForm({ content: i.content }); setIsGuideModalOpen(true); };
    const handleAddSop = () => { setEditingId(null); setFormData({ title: '', category: 'psp', description: '', content: '', imageBase64: '', pdfUrl: '', videoUrl: '' }); setIsModalOpen(true); };
    const handleAddFaq = () => { setEditingId(null); setFaqForm({ question: '', answer: '' }); setIsFaqModalOpen(true); };
    const handleAddGuide = () => { setEditingId(null); setGuideForm({ content: '' }); setIsGuideModalOpen(true); };

    const handleSaveSop = async (e: React.FormEvent) => {
        e.preventDefault(); setIsSaving(true);
        try {
            const p = editingId
                ? updateDoc(doc(db, 'knowledge-base', editingId), { ...formData, updatedAt: serverTimestamp() })
                : addDoc(collection(db, 'knowledge-base'), { ...formData, updatedAt: serverTimestamp(), views: 0, likes: 0, dislikes: 0 });
            await toast.promise(p, { loading: 'Menyimpan SOP...', success: 'SOP berhasil disimpan!', error: 'Gagal menyimpan SOP.' });
            setIsModalOpen(false);
        } catch (_) { } finally { setIsSaving(false); }
    };

    const handleSaveFaq = async (e: React.FormEvent) => {
        e.preventDefault(); setIsSaving(true);
        try {
            const p = editingId
                ? updateDoc(doc(db, 'faqs', editingId), { ...faqForm, createdAt: serverTimestamp() })
                : addDoc(collection(db, 'faqs'), { ...faqForm, createdAt: serverTimestamp() });
            await toast.promise(p, { loading: 'Menyimpan FAQ...', success: 'FAQ berhasil disimpan!', error: 'Gagal menyimpan FAQ.' });
            setIsFaqModalOpen(false);
        } catch (_) { } finally { setIsSaving(false); }
    };

    const handleSaveGuide = async (e: React.FormEvent) => {
        e.preventDefault(); setIsSaving(true);
        try {
            const p = editingId
                ? updateDoc(doc(db, 'guides', editingId), { ...guideForm, updatedAt: serverTimestamp() })
                : addDoc(collection(db, 'guides'), { ...guideForm, updatedAt: serverTimestamp() });
            await toast.promise(p, { loading: 'Menyimpan Panduan...', success: 'Panduan berhasil disimpan!', error: 'Gagal menyimpan Panduan.' });
            setIsGuideModalOpen(false);
        } catch (_) { } finally { setIsSaving(false); }
    };

    const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;
        if (file.size > 800000) { toast.error('Maksimal ukuran gambar 800KB'); return; }
        const reader = new FileReader();
        reader.onloadend = () => setFormData({ ...formData, imageBase64: reader.result as string });
        reader.readAsDataURL(file);
    };

    const insertFormat = (target: 'sop' | 'faq' | 'guide', tag: string) => {
        const idMap = { sop: 'content-editor', faq: 'faq-editor', guide: 'guide-editor' };
        const textarea = document.getElementById(idMap[target]) as HTMLTextAreaElement;
        if (!textarea) return;
        const s = textarea.selectionStart, end = textarea.selectionEnd;
        const cur = target === 'sop' ? formData.content : target === 'faq' ? faqForm.answer : guideForm.content;
        const before = cur.substring(0, s), after = cur.substring(end);
        const inserts: Record<string, string> = {
            bold: `${before}**Teks Tebal**${after}`,
            list: `${before}\n- Poin 1\n- Poin 2${after}`,
            number: `${before}\n1. Langkah 1\n2. Langkah 2${after}`,
            h2: `${before}\n## Judul Besar${after}`,
            h3: `${before}\n### Sub Judul${after}`,
            quote: `${before}\n> "Catatan"${after}`,
        };
        const newText = inserts[tag] ?? cur;
        if (target === 'sop') setFormData({ ...formData, content: newText });
        else if (target === 'faq') setFaqForm({ ...faqForm, answer: newText });
        else setGuideForm({ ...guideForm, content: newText });
        setTimeout(() => textarea.focus(), 100);
    };

    /* ─── Navigasi sidebar ─────────────────────────────────────── */
    const navItems = [
        { id: 'overview' as const, label: 'Dashboard', icon: <BarChart3 className="w-5 h-5" />, badge: null },
        { id: 'sop' as const, label: 'Data SOP', icon: <LayoutList className="w-5 h-5" />, badge: contents.length },
        { id: 'faq' as const, label: 'Data FAQ', icon: <HelpCircle className="w-5 h-5" />, badge: faqs.length },
        { id: 'guide' as const, label: 'Data Panduan', icon: <BookOpen className="w-5 h-5" />, badge: guides.length },
    ];

    const handleTabChange = (id: typeof activeTab) => {
        setActiveTab(id);
        setSidebarOpen(false); // tutup drawer di mobile
    };

    /* ══════════════════════════════════════════════════════════════
       RENDER — layout sidebar kiri + konten kanan
    ══════════════════════════════════════════════════════════════ */
    return (
        <div className="min-h-screen bg-[#F0F4F2] font-sans flex flex-col">
            <Toaster position="top-right" />

            {/* ── TOP BAR (narrow, only for mobile hamburger + brand) ── */}
            <header className="bg-white border-b border-slate-200 px-4 py-3 flex items-center justify-between sticky top-0 z-40 shadow-sm lg:pl-[272px]">
                {/* Mobile: hamburger */}
                <button
                    className="lg:hidden p-2 rounded-xl hover:bg-slate-100 text-slate-600 transition"
                    onClick={() => setSidebarOpen(!sidebarOpen)}
                >
                    <Menu className="w-5 h-5" />
                </button>

                {/* Brand — hanya tampil di desktop (sidebar handle di mobile) */}
                <div className="hidden lg:flex items-center gap-2 text-slate-500 text-sm">
                    <Home className="w-4 h-4" />
                    <ChevronRight className="w-3 h-3" />
                    <span className="font-bold text-slate-800 capitalize">{navItems.find(n => n.id === activeTab)?.label}</span>
                </div>

                {/* Mobile brand */}
                <div className="lg:hidden flex items-center gap-2">
                    <div className="bg-gradient-to-br from-[#0D5C35] to-[#0A492A] p-2 rounded-xl shadow-md">
                        <FileText className="text-white w-4 h-4" />
                    </div>
                    <div>
                        <p className="font-black text-slate-800 text-sm leading-none">Admin Panel</p>
                        <span className="text-[10px] font-bold text-[#D4AF37] uppercase tracking-widest">KPKNL Kendari</span>
                    </div>
                </div>

                <button
                    onClick={confirmLogout}
                    className="flex items-center gap-1.5 text-rose-600 hover:text-white font-bold text-xs transition-all hover:bg-rose-500 hover:shadow-lg hover:shadow-rose-200 px-3 py-2 rounded-xl border border-rose-100"
                >
                    <LogOut className="w-3.5 h-3.5" /> <span className="hidden sm:inline">Keluar</span>
                </button>
            </header>

            <div className="flex flex-1 relative">

                {/* ── SIDEBAR KIRI ── */}
                {/* Mobile: fixed overlay drawer; Desktop: fixed sidebar */}
                <>
                    {/* Overlay gelap saat mobile sidebar terbuka */}
                    {sidebarOpen && (
                        <div
                            className="fixed inset-0 bg-slate-900/50 z-30 lg:hidden"
                            onClick={() => setSidebarOpen(false)}
                        />
                    )}

                    <aside className={`
                        fixed top-0 left-0 h-full w-64 bg-gradient-to-b from-[#0D5C35] to-[#0A492A]
                        flex flex-col z-40 transition-transform duration-300 ease-in-out
                        ${sidebarOpen ? 'translate-x-0' : '-translate-x-full'}
                        lg:translate-x-0 lg:top-0 lg:h-screen
                    `}>
                        {/* Logo area */}
                        <div className="px-6 py-6 border-b border-white/10 flex-shrink-0">
                            <div className="flex items-center gap-3">
                                <div className="bg-white/10 backdrop-blur-sm p-2.5 rounded-xl border border-white/10 shadow-md">
                                    <FileText className="text-white w-5 h-5" />
                                </div>
                                <div>
                                    <p className="font-black text-white text-base leading-none">Admin Panel</p>
                                    <span className="text-[10px] font-bold text-[#D4AF37] uppercase tracking-widest">KPKNL Kendari</span>
                                </div>
                            </div>
                            {/* Tombol tutup di mobile */}
                            <button
                                className="lg:hidden absolute top-5 right-4 p-1.5 text-white/60 hover:text-white hover:bg-white/10 rounded-lg transition"
                                onClick={() => setSidebarOpen(false)}
                            >
                                <X className="w-5 h-5" />
                            </button>
                        </div>

                        {/* Nav items */}
                        <nav className="flex-1 px-4 py-5 space-y-1.5 overflow-y-auto">
                            <p className="text-white/30 text-[10px] font-bold uppercase tracking-widest px-3 mb-3">Menu Utama</p>
                            {navItems.map(item => {
                                const isActive = activeTab === item.id;
                                return (
                                    <button
                                        key={item.id}
                                        onClick={() => handleTabChange(item.id)}
                                        className={`
                                            w-full flex items-center gap-3 px-3 py-3 rounded-xl font-bold text-sm
                                            transition-all duration-200 group relative
                                            ${isActive
                                                ? 'bg-white text-[#0D5C35] shadow-lg shadow-black/20'
                                                : 'text-white/70 hover:text-white hover:bg-white/10'
                                            }
                                        `}
                                    >
                                        <span className={`transition-transform ${isActive ? 'scale-110' : 'group-hover:scale-110'}`}>
                                            {item.icon}
                                        </span>
                                        <span className="flex-1 text-left">{item.label}</span>
                                        {item.badge !== null && (
                                            <span className={`text-[10px] font-black px-2 py-0.5 rounded-full min-w-[1.4rem] text-center
                                                ${isActive ? 'bg-[#0D5C35] text-white' : 'bg-white/15 text-white/80'}`}>
                                                {item.badge}
                                            </span>
                                        )}
                                        {isActive && (
                                            <div className="absolute left-0 top-1/2 -translate-y-1/2 w-1 h-6 bg-[#D4AF37] rounded-r-full" />
                                        )}
                                    </button>
                                );
                            })}
                        </nav>

                        {/* Statistik ringkas di bawah nav */}
                        <div className="px-4 py-4 border-t border-white/10 flex-shrink-0">
                            <div className="bg-white/5 rounded-2xl border border-white/10 p-4 space-y-2">
                                <p className="text-white/40 text-[10px] font-bold uppercase tracking-widest mb-3">Ringkasan</p>
                                {[
                                    { label: 'Dokumen', val: contents.length, color: 'text-emerald-300' },
                                    { label: 'FAQ', val: faqs.length, color: 'text-amber-300' },
                                    { label: 'Panduan', val: guides.length, color: 'text-blue-300' },
                                    { label: 'Total View', val: stats.totalViews, color: 'text-purple-300' },
                                ].map(s => (
                                    <div key={s.label} className="flex items-center justify-between">
                                        <span className="text-white/50 text-xs">{s.label}</span>
                                        <span className={`font-black text-sm ${s.color}`}>{s.val}</span>
                                    </div>
                                ))}
                            </div>

                            {/* Tombol ke halaman utama */}
                            <button
                                onClick={() => navigate('/')}
                                className="mt-3 w-full flex items-center justify-center gap-2 px-3 py-2.5 bg-white/5 hover:bg-white/10 border border-white/10 text-white/60 hover:text-white text-xs font-bold rounded-xl transition-all"
                            >
                                <Home className="w-3.5 h-3.5" /> Lihat Website
                            </button>
                        </div>
                    </aside>
                </>

                {/* ── KONTEN KANAN ── */}
                <main className="flex-1 lg:pl-64 min-h-screen">
                    <div className="max-w-6xl mx-auto p-6 md:p-8">

                        {/* ── TAB: OVERVIEW / DASHBOARD ── */}
                        {activeTab === 'overview' && (
                            <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
                                {/* Header */}
                                <div>
                                    <h2 className="text-2xl font-black text-slate-800 tracking-tight">Dashboard</h2>
                                    <p className="text-slate-500 text-sm mt-1">Ringkasan data dan statistik knowledge base KPKNL Kendari</p>
                                </div>

                                {/* Stat cards */}
                                <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
                                    {[
                                        { label: 'Total Dokumen', val: contents.length, icon: <FileText className="w-8 h-8" />, bg: 'bg-blue-50   text-blue-600', border: 'border-blue-100' },
                                        { label: 'Total Dilihat', val: stats.totalViews, icon: <Eye className="w-8 h-8" />, bg: 'bg-emerald-50 text-emerald-600', border: 'border-emerald-100' },
                                        { label: 'Total Apresiasi', val: stats.totalLikes, icon: <ThumbsUp className="w-8 h-8" />, bg: 'bg-amber-50  text-amber-600', border: 'border-amber-100' },
                                    ].map(s => (
                                        <div key={s.label} className={`bg-white p-7 rounded-3xl shadow-sm border ${s.border} flex items-center gap-5 hover:-translate-y-1 hover:shadow-lg transition-all`}>
                                            <div className={`p-3.5 rounded-2xl ${s.bg}`}>{s.icon}</div>
                                            <div>
                                                <p className="text-slate-400 text-sm font-bold uppercase tracking-wider">{s.label}</p>
                                                <h3 className="text-4xl font-black text-slate-800">{s.val}</h3>
                                            </div>
                                        </div>
                                    ))}
                                </div>

                                {/* Charts */}
                                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                                    <div className="bg-white p-7 rounded-3xl shadow-sm border border-slate-100">
                                        <h3 className="font-bold text-slate-800 mb-6 flex items-center text-base"><TrendingUp className="w-5 h-5 mr-2.5 text-[#0D5C35]" /> Dokumen Terpopuler (Top 5)</h3>
                                        <div className="h-72 w-full">
                                            <ResponsiveContainer width="100%" height="100%">
                                                <BarChart data={stats.topViewed} layout="vertical" margin={{ top: 5, right: 30, left: 20, bottom: 5 }}>
                                                    <CartesianGrid strokeDasharray="3 3" horizontal vertical={false} stroke="#f1f5f9" />
                                                    <XAxis type="number" hide />
                                                    <YAxis dataKey="name" type="category" width={120} tick={{ fontSize: 11, fontWeight: 600, fill: '#64748b' }} axisLine={false} tickLine={false} />
                                                    <Tooltip cursor={{ fill: '#f8fafc' }} contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)' }} />
                                                    <Bar dataKey="views" fill="#0D5C35" radius={[0, 8, 8, 0]} barSize={22} />
                                                </BarChart>
                                            </ResponsiveContainer>
                                        </div>
                                    </div>
                                    <div className="bg-white p-7 rounded-3xl shadow-sm border border-slate-100">
                                        <h3 className="font-bold text-slate-800 mb-6 flex items-center text-base"><PieChartIcon className="w-5 h-5 mr-2.5 text-[#0D5C35]" /> Distribusi Kategori</h3>
                                        <div className="h-72 w-full">
                                            <ResponsiveContainer width="100%" height="100%">
                                                <PieChart>
                                                    <Pie data={stats.pieData} cx="50%" cy="50%" innerRadius={65} outerRadius={85} paddingAngle={5} dataKey="value">
                                                        {stats.pieData.map((_, i) => <Cell key={i} fill={CHART_COLORS[i % CHART_COLORS.length]} />)}
                                                    </Pie>
                                                    <Tooltip contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)' }} />
                                                    <Legend verticalAlign="bottom" height={60} iconType="circle" wrapperStyle={{ fontSize: '11px', fontWeight: 600, color: '#64748b' }} />
                                                </PieChart>
                                            </ResponsiveContainer>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        )}

                        {/* ── TAB: DATA SOP ── */}
                        {activeTab === 'sop' && (
                            <div className="animate-in fade-in zoom-in duration-300">
                                {/* Header */}
                                <div className="flex items-center justify-between mb-6">
                                    <div>
                                        <h2 className="text-2xl font-black text-slate-800 tracking-tight">Data SOP</h2>
                                        <p className="text-slate-500 text-sm mt-1">{contents.length} dokumen tersimpan</p>
                                    </div>
                                </div>

                                {/* Toolbar */}
                                <div className="bg-white p-5 rounded-2xl shadow-sm border border-slate-200 mb-5 flex flex-col md:flex-row justify-between items-center gap-4">
                                    <div className="flex flex-col sm:flex-row gap-3 w-full md:flex-grow">
                                        <div className="relative w-full sm:max-w-xs">
                                            <Search className="w-4 h-4 absolute left-3.5 top-3 text-slate-400" />
                                            <input type="text" placeholder="Cari judul SOP..."
                                                className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-slate-200 focus:ring-2 focus:ring-[#0D5C35] outline-none text-sm font-medium"
                                                value={searchTerm} onChange={e => setSearchTerm(e.target.value)} />
                                        </div>
                                        <div className="relative w-full sm:w-48">
                                            <Filter className="w-4 h-4 absolute left-3.5 top-3 text-slate-400" />
                                            <select className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-slate-200 focus:ring-2 focus:ring-[#0D5C35] outline-none text-sm font-medium appearance-none cursor-pointer"
                                                value={filterCategory} onChange={e => setFilterCategory(e.target.value)}>
                                                <option value="all">Semua Kategori</option>
                                                {['psp', 'sewa', 'penjualan', 'penghapusan', 'pinjam-pakai', 'penggunaan-sementara', 'alih-status', 'hibah'].map(c => (
                                                    <option key={c} value={c}>{c.toUpperCase().replace('-', ' ')}</option>
                                                ))}
                                            </select>
                                        </div>
                                    </div>
                                    <div className="flex gap-3 w-full md:w-auto flex-shrink-0">
                                        <button onClick={handleExportExcel} className="flex-1 md:flex-none flex items-center justify-center bg-white border-2 border-[#00A3C8] text-[#00A3C8] px-4 py-2.5 rounded-xl font-bold hover:bg-[#00A3C8] hover:text-white transition-colors text-sm">
                                            <FileSpreadsheet className="w-4 h-4 mr-1.5" /> Export
                                        </button>
                                        <button onClick={handleAddSop} className="flex-1 md:flex-none flex items-center justify-center bg-[#0D5C35] text-white px-4 py-2.5 rounded-xl font-bold shadow-lg shadow-emerald-200 hover:bg-[#0A492A] hover:-translate-y-0.5 transition-all text-sm">
                                            <Plus className="w-4 h-4 mr-1.5" /> Tambah
                                        </button>
                                    </div>
                                </div>

                                <div className="bg-white rounded-3xl shadow-sm border border-slate-200 overflow-hidden overflow-x-auto">
                                    <div className="max-h-[600px] overflow-y-auto">
                                        <table className="w-full text-left border-collapse min-w-[700px]">
                                            <thead className="bg-slate-50 text-slate-500 text-xs uppercase font-black tracking-wider sticky top-0 z-10 shadow-sm border-b border-slate-200">
                                                <tr>
                                                    <th className="p-5">Judul & Info</th>
                                                    <th className="p-5">Kategori</th>
                                                    <th className="p-5 text-center">Statistik</th>
                                                    <th className="p-5 text-center w-32">Aksi</th>
                                                </tr>
                                            </thead>
                                            <tbody className="divide-y divide-slate-100">
                                                {filteredContents.length > 0 ? filteredContents.map(item => (
                                                    <tr key={item.id} className="hover:bg-slate-50 transition-colors group">
                                                        <td className="p-5">
                                                            <p className="font-bold text-slate-800 mb-1">{item.title}</p>
                                                            <p className="text-xs text-slate-400">Update: {formatTime(item.updatedAt)}</p>
                                                        </td>
                                                        <td className="p-5">
                                                            <span className={`px-3 py-1.5 rounded-full text-[10px] font-black uppercase tracking-wider border shadow-sm ${getCategoryColor(item.category || 'psp')}`}>
                                                                {(item.category || 'psp').replace('-', ' ')}
                                                            </span>
                                                        </td>
                                                        <td className="p-5 text-center">
                                                            <div className="flex items-center justify-center gap-2 text-xs font-bold">
                                                                <span className="flex items-center bg-blue-50 px-2.5 py-1.5 rounded-lg text-blue-600 border border-blue-100"><Eye className="w-3.5 h-3.5 mr-1" />{item.views || 0}</span>
                                                                <span className="flex items-center bg-emerald-50 px-2.5 py-1.5 rounded-lg text-emerald-600 border border-emerald-100"><ThumbsUp className="w-3.5 h-3.5 mr-1" />{item.likes || 0}</span>
                                                            </div>
                                                        </td>
                                                        <td className="p-5 text-center">
                                                            <div className="flex justify-center gap-2">
                                                                <button onClick={() => handleEditSop(item)} className="p-2.5 text-amber-600 bg-amber-50 hover:bg-amber-500 hover:text-white rounded-xl border border-amber-100 transition-all"><Edit className="w-4 h-4" /></button>
                                                                <button onClick={() => confirmDelete('knowledge-base', item.id)} className="p-2.5 text-rose-600 bg-rose-50 hover:bg-rose-500 hover:text-white rounded-xl border border-rose-100 transition-all"><Trash2 className="w-4 h-4" /></button>
                                                            </div>
                                                        </td>
                                                    </tr>
                                                )) : (
                                                    <tr><td colSpan={4} className="p-16 text-center">
                                                        <FileText className="w-14 h-14 text-slate-200 mx-auto mb-3" />
                                                        <p className="text-slate-400 font-bold">Tidak ada data yang cocok.</p>
                                                    </td></tr>
                                                )}
                                            </tbody>
                                        </table>
                                    </div>
                                </div>
                            </div>
                        )}

                        {/* ── TAB: DATA FAQ ── */}
                        {activeTab === 'faq' && (
                            <div className="animate-in fade-in zoom-in duration-300">
                                <div className="flex items-center justify-between mb-6">
                                    <div>
                                        <h2 className="text-2xl font-black text-slate-800 tracking-tight">Data FAQ</h2>
                                        <p className="text-slate-500 text-sm mt-1">{faqs.length} pertanyaan tersimpan</p>
                                    </div>
                                    <button onClick={handleAddFaq} className="flex items-center bg-[#0D5C35] text-white px-5 py-2.5 rounded-xl font-bold shadow-lg shadow-emerald-200 hover:bg-[#0A492A] hover:-translate-y-0.5 transition-all text-sm">
                                        <Plus className="w-4 h-4 mr-1.5" /> Tambah FAQ
                                    </button>
                                </div>

                                <div className="space-y-4">
                                    {faqs.length > 0 ? faqs.map(item => (
                                        <div key={item.id} className="bg-white p-7 rounded-3xl border border-slate-200 shadow-sm hover:shadow-md transition-shadow flex justify-between items-start group">
                                            <div className="flex-grow pr-6 min-w-0">
                                                <div className="flex items-start gap-3 mb-3">
                                                    <span className="flex-shrink-0 bg-amber-100 text-amber-700 font-black px-2.5 py-1 rounded-lg text-xs">Q</span>
                                                    <h3 className="font-bold text-slate-800">{item.question}</h3>
                                                </div>
                                                <div className="flex items-start gap-3">
                                                    <span className="flex-shrink-0 bg-emerald-100 text-emerald-700 font-black px-2.5 py-1 rounded-lg text-xs mt-0.5">A</span>
                                                    <p className="text-slate-600 text-sm whitespace-pre-line leading-relaxed">{item.answer}</p>
                                                </div>
                                            </div>
                                            <div className="flex flex-col gap-2 flex-shrink-0 opacity-0 group-hover:opacity-100 transition-opacity">
                                                <button onClick={() => handleEditFaq(item)} className="p-2.5 text-amber-600 bg-amber-50 hover:bg-amber-500 hover:text-white rounded-xl border border-amber-100 transition-all"><Edit className="w-4 h-4" /></button>
                                                <button onClick={() => confirmDelete('faqs', item.id)} className="p-2.5 text-rose-600 bg-rose-50 hover:bg-rose-500 hover:text-white rounded-xl border border-rose-100 transition-all"><Trash2 className="w-4 h-4" /></button>
                                            </div>
                                        </div>
                                    )) : (
                                        <div className="bg-white p-16 rounded-3xl border border-slate-200 text-center">
                                            <HelpCircle className="w-14 h-14 text-slate-200 mx-auto mb-4" />
                                            <p className="text-slate-500 font-bold text-lg">Belum ada FAQ yang dibuat.</p>
                                        </div>
                                    )}
                                </div>
                            </div>
                        )}

                        {/* ── TAB: DATA PANDUAN ── */}
                        {activeTab === 'guide' && (
                            <div className="animate-in fade-in zoom-in duration-300">
                                <div className="flex items-center justify-between mb-6">
                                    <div>
                                        <h2 className="text-2xl font-black text-slate-800 tracking-tight">Data Panduan</h2>
                                        <p className="text-slate-500 text-sm mt-1">{guides.length} panduan tersimpan</p>
                                    </div>
                                    {guides.length === 0 && (
                                        <button onClick={handleAddGuide} className="flex items-center bg-[#0D5C35] text-white px-5 py-2.5 rounded-xl font-bold shadow-lg shadow-emerald-200 hover:bg-[#0A492A] hover:-translate-y-0.5 transition-all text-sm">
                                            <Plus className="w-4 h-4 mr-1.5" /> Buat Panduan
                                        </button>
                                    )}
                                </div>

                                <div className="bg-white rounded-3xl shadow-sm border border-slate-200 overflow-hidden overflow-x-auto">
                                    <table className="w-full text-left border-collapse min-w-[700px]">
                                        <thead className="bg-slate-50 text-slate-500 text-xs uppercase font-black tracking-wider border-b border-slate-200">
                                            <tr>
                                                <th className="p-5 w-16">#</th>
                                                <th className="p-5">Isi Panduan (Preview)</th>
                                                <th className="p-5 w-36 text-center">Update</th>
                                                <th className="p-5 text-center w-36">Aksi</th>
                                            </tr>
                                        </thead>
                                        <tbody className="divide-y divide-slate-100">
                                            {guides.map((item, i) => (
                                                <tr key={item.id} className="hover:bg-slate-50 transition-colors">
                                                    <td className="p-5 font-black text-slate-400">{i + 1}</td>
                                                    <td className="p-5">
                                                        <p className="text-slate-600 text-sm line-clamp-2 font-medium bg-slate-50 p-3 rounded-xl border border-slate-100">{item.content}</p>
                                                    </td>
                                                    <td className="p-5 text-center text-xs font-bold text-slate-400">{formatTime(item.updatedAt)}</td>
                                                    <td className="p-5 text-center">
                                                        <div className="flex justify-center gap-2">
                                                            <button onClick={() => handleEditGuide(item)} className="p-2.5 text-amber-600 bg-amber-50 hover:bg-amber-500 hover:text-white rounded-xl border border-amber-100 transition-all"><Edit className="w-4 h-4" /></button>
                                                            <button onClick={() => confirmDelete('guides', item.id)} className="p-2.5 text-rose-600 bg-rose-50 hover:bg-rose-500 hover:text-white rounded-xl border border-rose-100 transition-all"><Trash2 className="w-4 h-4" /></button>
                                                        </div>
                                                    </td>
                                                </tr>
                                            ))}
                                            {guides.length === 0 && (
                                                <tr><td colSpan={4} className="p-16 text-center text-slate-400 font-bold italic">Belum ada panduan yang dibuat.</td></tr>
                                            )}
                                        </tbody>
                                    </table>
                                </div>
                            </div>
                        )}

                    </div>
                </main>
            </div>

            {/* ══════════════════════════════════════════════════════════
                MODALS (tidak berubah dari versi sebelumnya)
            ══════════════════════════════════════════════════════════ */}

            {/* Konfirmasi */}
            {confirmModal.isOpen && (
                <div className="fixed inset-0 bg-slate-900/60 z-[60] flex items-center justify-center p-4 backdrop-blur-sm animate-in fade-in duration-200">
                    <div className="bg-white rounded-3xl w-full max-w-sm p-8 shadow-2xl border border-white/20">
                        <div className="flex flex-col items-center text-center">
                            <div className={`w-20 h-20 rounded-full flex items-center justify-center mb-6 shadow-inner ${confirmModal.type === 'delete' ? 'bg-rose-50 text-rose-500 border-4 border-rose-100' : 'bg-amber-50 text-amber-500 border-4 border-amber-100'}`}>
                                <AlertTriangle className="w-10 h-10" />
                            </div>
                            <h3 className="text-2xl font-black text-slate-800 mb-3">{confirmModal.title}</h3>
                            <p className="text-slate-500 mb-8 leading-relaxed font-medium">{confirmModal.message}</p>
                            <div className="flex w-full gap-3">
                                <button onClick={() => setConfirmModal(p => ({ ...p, isOpen: false }))} className="flex-1 py-3 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold rounded-xl transition-colors">Batal</button>
                                <button onClick={confirmModal.onConfirm} className={`flex-1 py-3 text-white font-bold rounded-xl shadow-lg transition-all ${confirmModal.type === 'delete' ? 'bg-rose-600 hover:bg-rose-700 shadow-rose-200' : 'bg-amber-500 hover:bg-amber-600 shadow-amber-200'}`}>
                                    {confirmModal.type === 'delete' ? 'Ya, Hapus' : 'Ya, Keluar'}
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* Modal SOP */}
            {isModalOpen && (
                <div className="fixed inset-0 bg-slate-900/60 z-50 flex items-center justify-center p-4 backdrop-blur-sm animate-in fade-in zoom-in-95 duration-200">
                    <div className="bg-white rounded-3xl w-full max-w-3xl p-8 overflow-y-auto max-h-[90vh] shadow-2xl border border-white/20">
                        <div className="flex justify-between items-center mb-6 pb-4 border-b border-slate-100">
                            <h3 className="font-black text-2xl text-slate-800 flex items-center">
                                <FileText className="w-6 h-6 mr-3 text-[#0D5C35]" />{editingId ? 'Edit SOP / Layanan' : 'Tambah SOP Baru'}
                            </h3>
                            <button onClick={() => setIsModalOpen(false)} className="p-2 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-full transition-colors"><X className="w-6 h-6" /></button>
                        </div>
                        <form onSubmit={handleSaveSop} className="space-y-5">
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                                <div className="space-y-1.5">
                                    <label className="text-xs font-bold text-slate-500 uppercase tracking-wider">Judul Dokumen</label>
                                    <input type="text" placeholder="Masukkan judul..." className="w-full p-3.5 border border-slate-200 rounded-xl focus:ring-2 focus:ring-[#0D5C35] outline-none font-medium bg-slate-50 focus:bg-white" required value={formData.title} onChange={e => setFormData({ ...formData, title: e.target.value })} />
                                </div>
                                <div className="space-y-1.5">
                                    <label className="text-xs font-bold text-slate-500 uppercase tracking-wider">Kategori</label>
                                    <select className="w-full p-3.5 border border-slate-200 rounded-xl focus:ring-2 focus:ring-[#0D5C35] outline-none font-bold text-slate-700 bg-slate-50 focus:bg-white cursor-pointer" value={formData.category} onChange={e => setFormData({ ...formData, category: e.target.value })}>
                                        {['psp', 'sewa', 'penjualan', 'penghapusan', 'pinjam-pakai', 'penggunaan-sementara', 'alih-status', 'hibah'].map(c => (
                                            <option key={c} value={c}>{c.toUpperCase().replace('-', ' ')}</option>
                                        ))}
                                    </select>
                                </div>
                            </div>
                            <div className="space-y-1.5">
                                <label className="text-xs font-bold text-slate-500 uppercase tracking-wider">Deskripsi Singkat (Preview)</label>
                                <input type="text" placeholder="Kalimat pendek untuk halaman awal..." className="w-full p-3.5 border border-slate-200 rounded-xl focus:ring-2 focus:ring-[#0D5C35] outline-none font-medium bg-slate-50 focus:bg-white" required value={formData.description} onChange={e => setFormData({ ...formData, description: e.target.value })} />
                            </div>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                                <div className="space-y-1.5">
                                    <label className="text-xs font-bold text-slate-500 uppercase tracking-wider">Gambar / Diagram (Opsional)</label>
                                    <input type="file" accept="image/*" onChange={handleImageUpload} className="block w-full text-sm text-slate-500 file:mr-4 file:py-3 file:px-4 file:rounded-lg file:border-0 file:text-sm file:font-bold file:bg-emerald-50 file:text-emerald-700 hover:file:bg-emerald-100 cursor-pointer border border-slate-200 rounded-xl bg-slate-50" />
                                </div>
                                <div className="space-y-1.5">
                                    <label className="text-xs font-bold text-slate-500 uppercase tracking-wider flex justify-between"><span>Link Video Tutorial</span><span className="text-slate-400 normal-case font-normal">(Opsional)</span></label>
                                    <input type="url" placeholder="Link YouTube / Google Drive..." className="w-full p-3.5 border border-slate-200 rounded-xl focus:ring-2 focus:ring-[#0D5C35] outline-none font-medium bg-slate-50 focus:bg-white" value={formData.videoUrl} onChange={e => setFormData({ ...formData, videoUrl: e.target.value })} />
                                </div>
                            </div>
                            <div className="space-y-1.5">
                                <label className="text-xs font-bold text-slate-500 uppercase tracking-wider flex justify-between"><span>Link File Excel / PDF</span><span className="text-slate-400 normal-case font-normal">(Opsional)</span></label>
                                <input type="url" placeholder="https://drive.google.com/..." className="w-full p-3.5 border border-slate-200 rounded-xl focus:ring-2 focus:ring-[#0D5C35] outline-none font-medium bg-slate-50 focus:bg-white" value={formData.pdfUrl} onChange={e => setFormData({ ...formData, pdfUrl: e.target.value })} />
                            </div>
                            <div className="space-y-1.5 pt-1">
                                <label className="text-xs font-bold text-slate-500 uppercase tracking-wider">Isi Dokumen (Mendukung Markdown)</label>
                                <div className="border border-slate-200 rounded-xl overflow-hidden focus-within:ring-2 focus-within:ring-[#0D5C35] shadow-sm">
                                    <FormatToolbar target="sop" onInsert={insertFormat} />
                                    <textarea id="content-editor" placeholder="Ketik isi SOP di sini..." rows={12} className="w-full p-5 font-mono text-sm outline-none bg-slate-50 focus:bg-white resize-y" required value={formData.content} onChange={e => setFormData({ ...formData, content: e.target.value })} />
                                </div>
                            </div>
                            <div className="flex justify-end gap-3 pt-4 border-t border-slate-100">
                                <button type="button" onClick={() => setIsModalOpen(false)} className="px-6 py-3 font-bold text-slate-500 bg-slate-100 hover:bg-slate-200 rounded-xl transition-colors">Batal</button>
                                <button type="submit" disabled={isSaving} className="px-8 py-3 bg-[#0D5C35] hover:bg-[#0A492A] text-white rounded-xl font-bold shadow-lg shadow-emerald-200 transition-all flex items-center gap-2">
                                    {isSaving ? <><RefreshCw className="w-4 h-4 animate-spin" /> Menyimpan...</> : 'Simpan Data'}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {/* Modal FAQ */}
            {isFaqModalOpen && (
                <div className="fixed inset-0 bg-slate-900/60 z-50 flex items-center justify-center p-4 backdrop-blur-sm animate-in fade-in zoom-in-95 duration-200">
                    <div className="bg-white rounded-3xl w-full max-w-2xl p-8 shadow-2xl border border-white/20">
                        <div className="flex justify-between items-center mb-6 pb-4 border-b border-slate-100">
                            <h3 className="font-black text-2xl text-slate-800 flex items-center"><HelpCircle className="w-6 h-6 mr-3 text-amber-500" />{editingId ? 'Edit FAQ' : 'Tambah FAQ Baru'}</h3>
                            <button onClick={() => setIsFaqModalOpen(false)} className="p-2 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-full transition-colors"><X className="w-6 h-6" /></button>
                        </div>
                        <form onSubmit={handleSaveFaq} className="space-y-5">
                            <div className="space-y-1.5">
                                <label className="text-xs font-bold text-slate-500 uppercase tracking-wider">Pertanyaan (Q)</label>
                                <input type="text" placeholder="Masukkan pertanyaan..." className="w-full p-3.5 border border-slate-200 rounded-xl focus:ring-2 focus:ring-[#0D5C35] outline-none font-bold text-slate-800 bg-slate-50 focus:bg-white" value={faqForm.question} onChange={e => setFaqForm({ ...faqForm, question: e.target.value })} required />
                            </div>
                            <div className="space-y-1.5 pt-1">
                                <label className="text-xs font-bold text-slate-500 uppercase tracking-wider">Jawaban (A)</label>
                                <div className="border border-slate-200 rounded-xl overflow-hidden focus-within:ring-2 focus-within:ring-[#0D5C35] shadow-sm">
                                    <FormatToolbar target="faq" onInsert={insertFormat} />
                                    <textarea id="faq-editor" placeholder="Ketik jawaban di sini..." rows={8} className="w-full p-5 font-mono text-sm outline-none bg-slate-50 focus:bg-white resize-y" value={faqForm.answer} onChange={e => setFaqForm({ ...faqForm, answer: e.target.value })} required />
                                </div>
                            </div>
                            <div className="flex justify-end gap-3 pt-4 border-t border-slate-100">
                                <button type="button" onClick={() => setIsFaqModalOpen(false)} className="px-6 py-3 font-bold text-slate-500 bg-slate-100 hover:bg-slate-200 rounded-xl transition-colors">Batal</button>
                                <button type="submit" disabled={isSaving} className="px-8 py-3 bg-[#0D5C35] hover:bg-[#0A492A] text-white rounded-xl font-bold shadow-lg shadow-emerald-200 transition-all flex items-center gap-2">
                                    {isSaving ? <><RefreshCw className="w-4 h-4 animate-spin" /> Menyimpan...</> : 'Simpan FAQ'}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {/* Modal Panduan */}
            {isGuideModalOpen && (
                <div className="fixed inset-0 bg-slate-900/60 z-50 flex items-center justify-center p-4 backdrop-blur-sm animate-in fade-in zoom-in-95 duration-200">
                    <div className="bg-white rounded-3xl w-full max-w-3xl p-8 shadow-2xl border border-white/20">
                        <div className="flex justify-between items-center mb-6 pb-4 border-b border-slate-100">
                            <h3 className="font-black text-2xl text-slate-800 flex items-center"><BookOpen className="w-6 h-6 mr-3 text-blue-500" />{editingId ? 'Edit Panduan' : 'Buat Panduan Pengguna'}</h3>
                            <button onClick={() => setIsGuideModalOpen(false)} className="p-2 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-full transition-colors"><X className="w-6 h-6" /></button>
                        </div>
                        <form onSubmit={handleSaveGuide} className="space-y-5">
                            <div className="space-y-1.5">
                                <label className="text-xs font-bold text-slate-500 uppercase tracking-wider">Isi Panduan Utama</label>
                                <div className="border border-slate-200 rounded-xl overflow-hidden focus-within:ring-2 focus-within:ring-[#0D5C35] shadow-sm">
                                    <FormatToolbar target="guide" onInsert={insertFormat} />
                                    <textarea id="guide-editor" placeholder="Ketik panduan lengkap di sini..." rows={15} className="w-full p-5 font-mono text-sm outline-none bg-slate-50 focus:bg-white resize-y" value={guideForm.content} onChange={e => setGuideForm({ ...guideForm, content: e.target.value })} required />
                                </div>
                            </div>
                            <div className="flex justify-end gap-3 pt-4 border-t border-slate-100">
                                <button type="button" onClick={() => setIsGuideModalOpen(false)} className="px-6 py-3 font-bold text-slate-500 bg-slate-100 hover:bg-slate-200 rounded-xl transition-colors">Batal</button>
                                <button type="submit" disabled={isSaving} className="px-8 py-3 bg-[#0D5C35] hover:bg-[#0A492A] text-white rounded-xl font-bold shadow-lg shadow-emerald-200 transition-all flex items-center gap-2">
                                    {isSaving ? <><RefreshCw className="w-4 h-4 animate-spin" /> Menyimpan...</> : 'Simpan Panduan'}
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