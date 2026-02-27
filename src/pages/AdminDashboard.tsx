// File: src/pages/AdminDashboard.tsx
// ─── CATATAN ──────────────────────────────────────────────────────────────────
// Requires: npm install react-markdown  (likely already installed)
// tailwind.config.js: darkMode: 'class'
// ─────────────────────────────────────────────────────────────────────────────
import React, { useEffect, useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { signOut } from 'firebase/auth';
import {
    collection, addDoc, deleteDoc, updateDoc, doc, onSnapshot,
    serverTimestamp, query, orderBy
} from 'firebase/firestore';
import { auth, db } from '../firebase';
import ReactMarkdown from 'react-markdown';
import {
    LogOut, Plus, Trash2, FileText, HelpCircle, LayoutList, Edit, BookOpen, Quote,
    Eye, ThumbsUp, BarChart3, PieChart as PieChartIcon, TrendingUp, FileSpreadsheet,
    AlertTriangle, X, List as ListIcon, Type, Hash, Search, Filter, RefreshCw,
    Menu, ChevronRight, Home, ChevronDown, ChevronUp, Calendar, BookMarked,
    Moon, Sun, ChevronLeft, User, Clock as ClockIcon, AlertCircle,
    Tag, Italic, Code, Minus, Link as LinkIcon, Columns, Bold,
} from 'lucide-react';
import {
    BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
    Cell, PieChart, Pie, Legend, AreaChart, Area,
} from 'recharts';
import * as XLSX from 'xlsx';
import toast, { Toaster } from 'react-hot-toast';

/* ─── TIPE DATA ───────────────────────────────────────────────── */
interface ContentData {
    id: string; title: string; category: string; description: string;
    content: string; imageBase64?: string; pdfUrl?: string; videoUrl?: string;
    views?: number; likes?: number; updatedAt?: any; tags?: string[]; updatedBy?: string;
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
        'user-siman': 'bg-cyan-100 text-cyan-800 border-cyan-200',
    };
    return map[cat] ?? 'bg-slate-100 text-slate-800 border-slate-200';
};
const CHART_COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884d8', '#82ca9d', '#ffc658', '#f97316', '#00FFFF'];

/* ─── FORMAT TOOLBAR ──────────────────────────────────────────── */
const FormatToolbar = ({
    target, onInsert, isSplitView, onToggleSplit,
}: {
    target: 'sop' | 'faq' | 'guide';
    onInsert: (t: 'sop' | 'faq' | 'guide', tag: string) => void;
    isSplitView?: boolean;
    onToggleSplit?: () => void;
}) => (
    <div className="flex flex-wrap gap-1 p-2 bg-slate-100 dark:bg-slate-700 border-b border-slate-200 dark:border-slate-600 items-center">
        {[
            { tag: 'bold', title: 'Tebal', icon: <Bold className="w-3.5 h-3.5" /> },
            { tag: 'italic', title: 'Miring', icon: <Italic className="w-3.5 h-3.5" /> },
            { tag: 'code', title: 'Kode inline', icon: <Code className="w-3.5 h-3.5" /> },
            { tag: 'list', title: 'Bullet list', icon: <ListIcon className="w-3.5 h-3.5" /> },
            { tag: 'number', title: 'Numbered list', icon: <Hash className="w-3.5 h-3.5" /> },
            { tag: 'quote', title: 'Kutipan', icon: <Quote className="w-3.5 h-3.5" /> },
            { tag: 'link', title: 'Tautan', icon: <LinkIcon className="w-3.5 h-3.5" /> },
            { tag: 'hr', title: 'Garis pemisah', icon: <Minus className="w-3.5 h-3.5" /> },
        ].map(b => (
            <button key={b.tag} type="button" onClick={() => onInsert(target, b.tag)}
                className="p-1.5 hover:bg-white dark:hover:bg-slate-600 rounded-lg text-slate-600 dark:text-slate-300 transition-colors" title={b.title}>
                {b.icon}
            </button>
        ))}
        <span className="w-px h-4 bg-slate-300 dark:bg-slate-500 mx-0.5" />
        {['H2', 'H3'].map(h => (
            <button key={h} type="button" onClick={() => onInsert(target, h.toLowerCase())}
                className="px-2 py-0.5 bg-white dark:bg-slate-600 border border-slate-200 dark:border-slate-500 rounded-md text-xs font-black hover:bg-slate-50 dark:hover:bg-slate-500 transition-colors text-slate-600 dark:text-slate-200">
                {h}
            </button>
        ))}
        {onToggleSplit && (
            <>
                <span className="w-px h-4 bg-slate-300 dark:bg-slate-500 mx-0.5" />
                <button type="button" onClick={onToggleSplit}
                    title="Split view (editor + preview)"
                    className={`flex items-center gap-1 px-2 py-1 rounded-lg text-xs font-bold transition-colors ${isSplitView ? 'bg-[#0D5C35] text-white' : 'hover:bg-white dark:hover:bg-slate-600 text-slate-500 dark:text-slate-400'}`}>
                    <Columns className="w-3.5 h-3.5" />
                    <span className="hidden sm:inline">Split</span>
                </button>
            </>
        )}
    </div>
);

/* ─── GUIDE CARD ──────────────────────────────────────────────── */
interface GuideCardProps {
    item: GuideData;
    index: number;
    onEdit: () => void;
    onDelete: () => void;
    formatTime: (ts: any) => string;
}
const GuideCard: React.FC<GuideCardProps> = ({
    item, index, onEdit, onDelete, formatTime,
}) => {
    const [isExpanded, setIsExpanded] = useState(false);
    const lineCount = (item.content || '').split('\n').length;
    const charCount = (item.content || '').length;
    const isLong = lineCount > 8 || charCount > 400;
    const firstLine = (item.content || '').split('\n')[0].replace(/^#+\s*/, '').trim();

    return (
        <div className="bg-white dark:bg-[#162918] rounded-3xl border border-slate-200 dark:border-slate-700 shadow-sm hover:shadow-lg transition-all duration-300 overflow-hidden">
            <div className="flex items-start justify-between p-5 md:p-6 border-b border-slate-100 dark:border-slate-700 bg-gradient-to-r from-white dark:from-[#1a3021] to-slate-50/60 dark:to-transparent">
                <div className="flex items-center gap-3 min-w-0">
                    <span className="flex-shrink-0 w-9 h-9 rounded-xl bg-[#0D5C35]/10 dark:bg-[#0D5C35]/20 border border-[#0D5C35]/15 dark:border-[#0D5C35]/30 flex items-center justify-center font-black text-[#0D5C35] dark:text-emerald-400 text-sm">
                        {index + 1}
                    </span>
                    <div className="min-w-0">
                        <p className="font-black text-slate-800 dark:text-slate-100 text-sm leading-snug truncate max-w-[220px] sm:max-w-xs md:max-w-sm">
                            {firstLine || 'Panduan Pengguna'}
                        </p>
                        <div className="flex items-center gap-2 mt-0.5">
                            <Calendar className="w-3 h-3 text-slate-400" />
                            <span className="text-xs text-slate-400 font-medium">{formatTime(item.updatedAt)}</span>
                            <span className="w-1 h-1 rounded-full bg-slate-300 dark:bg-slate-600" />
                            <span className="text-xs text-slate-400 dark:text-slate-500">{charCount} karakter</span>
                        </div>
                    </div>
                </div>
                <div className="flex items-center gap-2 flex-shrink-0 ml-3">
                    <button onClick={onEdit} className="p-2.5 text-amber-600 bg-amber-50 dark:bg-amber-900/20 hover:bg-amber-500 hover:text-white rounded-xl border border-amber-100 dark:border-amber-700/30 transition-all" title="Edit"><Edit className="w-4 h-4" /></button>
                    <button onClick={onDelete} className="p-2.5 text-rose-600 bg-rose-50 dark:bg-rose-900/20 hover:bg-rose-500 hover:text-white rounded-xl border border-rose-100 dark:border-rose-700/30 transition-all" title="Hapus"><Trash2 className="w-4 h-4" /></button>
                </div>
            </div>
            <div className="p-5 md:p-6">
                <div className={`relative overflow-hidden transition-all duration-500 ${isExpanded ? '' : 'max-h-48'}`}>
                    <pre className="whitespace-pre-wrap font-sans text-slate-700 dark:text-slate-300 text-sm leading-relaxed bg-slate-50 dark:bg-[#0f1f16] border border-slate-200 dark:border-slate-700 rounded-2xl p-4 md:p-5">
                        {item.content}
                    </pre>
                    {!isExpanded && isLong && (
                        <div className="absolute bottom-0 left-0 right-0 h-16 bg-gradient-to-t from-white dark:from-[#162918] to-transparent pointer-events-none" />
                    )}
                </div>
                {isLong && (
                    <button onClick={() => setIsExpanded(p => !p)}
                        className="mt-3 w-full flex items-center justify-center gap-2 py-2.5 text-[#0D5C35] dark:text-emerald-400 text-xs font-bold rounded-xl bg-[#0D5C35]/5 dark:bg-[#0D5C35]/10 hover:bg-[#0D5C35]/10 dark:hover:bg-[#0D5C35]/20 border border-[#0D5C35]/10 dark:border-[#0D5C35]/20 transition-all">
                        {isExpanded ? <><ChevronUp className="w-4 h-4" /> Sembunyikan</> : <><ChevronDown className="w-4 h-4" /> Tampilkan Selengkapnya</>}
                    </button>
                )}
            </div>
        </div>
    );
};

/* ══════════════════════════════════════════════════════════════
   ADMIN DASHBOARD
══════════════════════════════════════════════════════════════ */
const AdminDashboard: React.FC = () => {
    const navigate = useNavigate();
    const [activeTab, setActiveTab] = useState<'overview' | 'sop' | 'faq' | 'guide'>('overview');
    const [sidebarOpen, setSidebarOpen] = useState(false);

    /* ── Dark Mode ── */
    const [isDark, setIsDark] = useState(() => {
        try { return localStorage.getItem('pkn-theme') === 'dark'; } catch { return false; }
    });
    useEffect(() => {
        document.documentElement.classList.toggle('dark', isDark);
        try { localStorage.setItem('pkn-theme', isDark ? 'dark' : 'light'); } catch { }
    }, [isDark]);

    const [contents, setContents] = useState<ContentData[]>([]);
    const [faqs, setFaqs] = useState<FAQData[]>([]);
    const [guides, setGuides] = useState<GuideData[]>([]);

    const [searchTerm, setSearchTerm] = useState('');
    const [filterCategory, setFilterCategory] = useState('all');

    /* ── Pagination SOP ── */
    const [sopPage, setSopPage] = useState(1);
    const [sopPerPage, setSopPerPage] = useState(10);

    const [isModalOpen, setIsModalOpen] = useState(false);
    const [isFaqModalOpen, setIsFaqModalOpen] = useState(false);
    const [isGuideModalOpen, setIsGuideModalOpen] = useState(false);

    /* ── Preview tab di modal SOP ── */
    const [sopModalTab, setSopModalTab] = useState<'editor' | 'preview'>('editor');

    /* ── Unsaved changes tracking ── */
    const [isDirty, setIsDirty] = useState(false);
    const [pendingCloseModal, setPendingCloseModal] = useState<'sop' | 'faq' | 'guide' | null>(null);

    const [confirmModal, setConfirmModal] = useState<{
        isOpen: boolean; type: 'delete' | 'logout' | 'unsaved' | 'info';
        title: string; message: string; onConfirm: () => void;
    }>({ isOpen: false, type: 'delete', title: '', message: '', onConfirm: () => { } });

    const [isSaving, setIsSaving] = useState(false);
    const [editingId, setEditingId] = useState<string | null>(null);

    const emptyForm = { title: '', category: 'psp', description: '', content: '', imageBase64: '', pdfUrl: '', videoUrl: '', tagsRaw: '' };
    const [formData, setFormData] = useState(emptyForm);
    const [faqForm, setFaqForm] = useState({ question: '', answer: '' });
    const [guideForm, setGuideForm] = useState({ content: '' });
    const [isSplitView, setIsSplitView] = useState(false);
    const [tagInput, setTagInput] = useState('');

    /* ── Current admin user info ── */
    const adminEmail = auth.currentUser?.email ?? 'Admin';
    const adminDisplay = adminEmail.split('@')[0];

    /* ── Firebase ── */
    const formatTime = (ts: any) => ts?.seconds
        ? new Date(ts.seconds * 1000).toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric' })
        : '-';
    const formatTimeDetailed = (ts: any) => ts?.seconds
        ? new Date(ts.seconds * 1000).toLocaleString('id-ID', { day: 'numeric', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' })
        : '-';

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
        const topViewed = [...contents]
            .sort((a, b) => (b.views || 0) - (a.views || 0))
            .slice(0, 5)
            .map(i => {
                const t = i.title || 'Tanpa Judul';
                return { name: t.length > 22 ? t.substring(0, 22) + '…' : t, views: i.views || 0 };
            });
        const catDist: Record<string, number> = {};
        contents.forEach(i => {
            const k = (i.category || 'psp').toUpperCase().replace(/-/g, ' ');
            catDist[k] = (catDist[k] || 0) + 1;
        });
        const pieData = Object.entries(catDist).map(([name, value]) => ({ name, value }));

        /* ── Trend: dokumen ditambah per 7 hari terakhir ── */
        const trendData = Array.from({ length: 7 }, (_, i) => {
            const d = new Date(); d.setDate(d.getDate() - (6 - i));
            const label = d.toLocaleDateString('id-ID', { day: 'numeric', month: 'short' });
            const count = contents.filter(c => {
                if (!c.updatedAt?.seconds) return false;
                return new Date(c.updatedAt.seconds * 1000)
                    .toLocaleDateString('id-ID', { day: 'numeric', month: 'short' }) === label;
            }).length;
            return { hari: label, dokumen: count };
        });

        /* ── Views per kategori ── */
        const catViews: Record<string, number> = {};
        contents.forEach(i => {
            const k = (i.category || 'psp').replace(/-/g, ' ').toUpperCase();
            catViews[k] = (catViews[k] || 0) + (i.views || 0);
        });
        const catViewsData = Object.entries(catViews)
            .map(([name, views]) => ({ name, views }))
            .sort((a, b) => b.views - a.views);

        return { totalViews, totalLikes, topViewed, pieData, trendData, catViewsData };
    }, [contents]);

    const filteredContents = useMemo(() =>
        contents.filter(i => {
            const ms = (i.title || '').toLowerCase().includes(searchTerm.toLowerCase())
                || (i.description || '').toLowerCase().includes(searchTerm.toLowerCase());
            const mc = filterCategory === 'all' || i.category === filterCategory;
            return ms && mc;
        }), [contents, searchTerm, filterCategory]);

    /* ── Pagination logic ── */
    const sopTotalPages = Math.ceil(filteredContents.length / sopPerPage);
    const sopIndexFirst = (sopPage - 1) * sopPerPage;
    const sopIndexLast = sopIndexFirst + sopPerPage;
    const currentSopPage = filteredContents.slice(sopIndexFirst, sopIndexLast);

    /* ── Unsaved changes helper ── */
    const requestClose = (modal: 'sop' | 'faq' | 'guide') => {
        if (isDirty) {
            setConfirmModal({
                isOpen: true, type: 'unsaved',
                title: 'Perubahan Belum Disimpan',
                message: 'Anda memiliki perubahan yang belum disimpan. Menutup form akan menghapus semua perubahan tersebut.',
                onConfirm: () => {
                    setIsDirty(false);
                    if (modal === 'sop') setIsModalOpen(false);
                    if (modal === 'faq') setIsFaqModalOpen(false);
                    if (modal === 'guide') setIsGuideModalOpen(false);
                    setConfirmModal(p => ({ ...p, isOpen: false }));
                },
            });
        } else {
            if (modal === 'sop') setIsModalOpen(false);
            if (modal === 'faq') setIsFaqModalOpen(false);
            if (modal === 'guide') setIsGuideModalOpen(false);
        }
    };

    /* ── Handlers ── */
    const handleExportExcel = () => {
        const data = contents.map((i, idx) => ({
            No: idx + 1, Judul: i.title,
            Kategori: (i.category || '').toUpperCase().replace(/-/g, ' '),
            'Dilihat (Views)': i.views || 0,
            'Disukai (Likes)': i.likes || 0,
            'Terakhir Update': formatTimeDetailed(i.updatedAt),
            Deskripsi: i.description,
        }));
        const ws = XLSX.utils.json_to_sheet(data);
        const wb = XLSX.utils.book_new();
        XLSX.utils.book_append_sheet(wb, ws, 'Laporan SOP');
        XLSX.writeFile(wb, `Laporan_KPKNL_KnowledgeBase_${new Date().toISOString().split('T')[0]}.xlsx`);
        toast.success('Laporan berhasil didownload!');
    };

    const confirmDelete = (col: string, id: string) => {
        setConfirmModal({
            isOpen: true, type: 'delete',
            title: 'Hapus Data?',
            message: 'Tindakan ini tidak dapat dibatalkan. Data akan hilang permanen.',
            onConfirm: async () => {
                toast.promise(deleteDoc(doc(db, col, id)), { loading: 'Menghapus…', success: 'Data dihapus!', error: 'Gagal menghapus.' });
                setConfirmModal(p => ({ ...p, isOpen: false }));
            },
        });
    };

    const confirmLogout = () => {
        setConfirmModal({
            isOpen: true, type: 'logout',
            title: 'Konfirmasi Keluar',
            message: 'Apakah Anda yakin ingin keluar dari sesi Admin?',
            onConfirm: async () => {
                await signOut(auth);
                toast('Sampai jumpa!', { icon: '👋' });
                navigate('/login');
                setConfirmModal(p => ({ ...p, isOpen: false }));
            },
        });
    };

    const handleEditSop = (i: ContentData) => { setEditingId(i.id); setFormData({ ...i, imageBase64: i.imageBase64 || '', pdfUrl: i.pdfUrl || '', videoUrl: i.videoUrl || '', tagsRaw: (i.tags || []).join(', ') }); setSopModalTab('editor'); setIsDirty(false); setTagInput(''); setIsModalOpen(true); };
    const handleEditFaq = (i: FAQData) => { setEditingId(i.id); setFaqForm({ ...i }); setIsDirty(false); setIsFaqModalOpen(true); };
    const handleEditGuide = (i: GuideData) => { setEditingId(i.id); setGuideForm({ content: i.content }); setIsDirty(false); setIsGuideModalOpen(true); };
    const handleAddSop = () => { setEditingId(null); setFormData({ ...emptyForm }); setSopModalTab('editor'); setIsSplitView(false); setIsDirty(false); setTagInput(''); setIsModalOpen(true); };
    const handleAddFaq = () => { setEditingId(null); setFaqForm({ question: '', answer: '' }); setIsDirty(false); setIsFaqModalOpen(true); };
    const handleAddGuide = () => { setEditingId(null); setGuideForm({ content: '' }); setIsDirty(false); setIsGuideModalOpen(true); };

    const handleSaveSop = async (e: React.FormEvent) => {
        e.preventDefault();
        /* ── Validasi form ── */
        if (!formData.title.trim()) { toast.error('⚠️ Judul dokumen tidak boleh kosong.'); return; }
        if (formData.title.trim().length < 5) { toast.error('⚠️ Judul minimal 5 karakter.'); return; }
        if (!formData.description.trim()) { toast.error('⚠️ Deskripsi tidak boleh kosong.'); return; }
        if (formData.description.trim().length < 10) { toast.error('⚠️ Deskripsi minimal 10 karakter.'); return; }
        if (!formData.content.trim()) { toast.error('⚠️ Isi dokumen tidak boleh kosong.'); return; }
        if (formData.content.trim().length < 20) { toast.error('⚠️ Isi dokumen minimal 20 karakter.'); return; }
        if (formData.pdfUrl && !/^https?:\/\/.+/.test(formData.pdfUrl.trim())) { toast.error('⚠️ URL PDF tidak valid. Harus dimulai https://'); return; }
        if (formData.videoUrl && !/^https?:\/\/.+/.test(formData.videoUrl.trim())) { toast.error('⚠️ URL Video tidak valid. Harus dimulai https://'); return; }
        setIsSaving(true);
        try {
            const tags = formData.tagsRaw
                ? formData.tagsRaw.split(',').map((t: string) => t.trim()).filter(Boolean)
                : [];
            const { tagsRaw, ...rest } = formData;
            const payload = { ...rest, tags };
            const updatedBy = auth.currentUser?.email ?? 'admin';
            const p: Promise<void> = editingId
                ? updateDoc(doc(db, 'knowledge-base', editingId), { ...payload, updatedAt: serverTimestamp(), updatedBy })
                : addDoc(collection(db, 'knowledge-base'), { ...payload, updatedAt: serverTimestamp(), updatedBy, views: 0, likes: 0, dislikes: 0 }).then(() => {});
            await toast.promise(p, { loading: 'Menyimpan SOP…', success: 'SOP berhasil disimpan!', error: 'Gagal menyimpan SOP.' });
            setIsDirty(false);
            setIsModalOpen(false);
        } catch (_) { } finally { setIsSaving(false); }
    };

    const handleSaveFaq = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!faqForm.question.trim()) { toast.error('⚠️ Pertanyaan tidak boleh kosong.'); return; }
        if (faqForm.question.trim().length < 10) { toast.error('⚠️ Pertanyaan minimal 10 karakter.'); return; }
        if (!faqForm.answer.trim()) { toast.error('⚠️ Jawaban tidak boleh kosong.'); return; }
        if (faqForm.answer.trim().length < 10) { toast.error('⚠️ Jawaban minimal 10 karakter.'); return; }
        setIsSaving(true);
        try {
            const p: Promise<void> = editingId
                ? updateDoc(doc(db, 'faqs', editingId), { ...faqForm, createdAt: serverTimestamp() })
                : addDoc(collection(db, 'faqs'), { ...faqForm, createdAt: serverTimestamp() }).then(() => {});
            await toast.promise(p, { loading: 'Menyimpan FAQ…', success: 'FAQ berhasil disimpan!', error: 'Gagal menyimpan FAQ.' });
            setIsDirty(false);
            setIsFaqModalOpen(false);
        } catch (_) { } finally { setIsSaving(false); }
    };

    const handleSaveGuide = async (e: React.FormEvent) => {
        e.preventDefault(); setIsSaving(true);
        try {
            const p: Promise<void> = editingId
                ? updateDoc(doc(db, 'guides', editingId), { ...guideForm, updatedAt: serverTimestamp() })
                : addDoc(collection(db, 'guides'), { ...guideForm, updatedAt: serverTimestamp() }).then(() => {});
            await toast.promise(p, { loading: 'Menyimpan Panduan…', success: 'Panduan berhasil disimpan!', error: 'Gagal menyimpan Panduan.' });
            setIsDirty(false);
            setIsGuideModalOpen(false);
        } catch (_) { } finally { setIsSaving(false); }
    };

    const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;
        if (file.size > 800000) { toast.error('Maksimal ukuran gambar 800KB'); return; }
        const reader = new FileReader();
        reader.onloadend = () => { setFormData(p => ({ ...p, imageBase64: reader.result as string })); setIsDirty(true); };
        reader.readAsDataURL(file);
    };

    const insertFormat = (target: 'sop' | 'faq' | 'guide', tag: string) => {
        const idMap = { sop: 'content-editor', faq: 'faq-editor', guide: 'guide-editor' };
        const textarea = document.getElementById(idMap[target]) as HTMLTextAreaElement;
        if (!textarea) return;
        const s = textarea.selectionStart, end = textarea.selectionEnd;
        const cur = target === 'sop' ? formData.content : target === 'faq' ? faqForm.answer : guideForm.content;
        const before = cur.substring(0, s), sel = cur.substring(s, end), after = cur.substring(end);
        const inserts: Record<string, string> = {
            bold: `${before}**${sel || 'Teks Tebal'}**${after}`,
            italic: `${before}_${sel || 'Teks Miring'}_${after}`,
            code: `${before}\`${sel || 'kode'}\`${after}`,
            list: `${before}\n- ${sel || 'Poin 1'}\n- Poin 2${after}`,
            number: `${before}\n1. ${sel || 'Langkah 1'}\n2. Langkah 2${after}`,
            h2: `${before}\n## ${sel || 'Judul Besar'}${after}`,
            h3: `${before}\n### ${sel || 'Sub Judul'}${after}`,
            quote: `${before}\n> "${sel || 'Catatan penting'}"${after}`,
            link: `${before}[${sel || 'Teks Link'}](https://contoh.com)${after}`,
            hr: `${before}\n\n---\n\n${after}`,
        };
        const newText = inserts[tag] ?? cur;
        if (target === 'sop') { setFormData(p => ({ ...p, content: newText })); setIsDirty(true); }
        else if (target === 'faq') { setFaqForm(p => ({ ...p, answer: newText })); setIsDirty(true); }
        else { setGuideForm({ content: newText }); setIsDirty(true); }
        setTimeout(() => textarea.focus(), 50);
    };

    /* ── Nav items ── */
    const navItems = [
        { id: 'overview' as const, label: 'Dashboard', icon: <BarChart3 className="w-5 h-5" />, badge: null },
        { id: 'sop' as const, label: 'Data SOP', icon: <LayoutList className="w-5 h-5" />, badge: contents.length },
        { id: 'faq' as const, label: 'Data FAQ', icon: <HelpCircle className="w-5 h-5" />, badge: faqs.length },
        { id: 'guide' as const, label: 'Data Panduan', icon: <BookOpen className="w-5 h-5" />, badge: guides.length },
    ];

    const handleTabChange = (id: typeof activeTab) => { setActiveTab(id); setSidebarOpen(false); };

    /* ══════════════════════════════════════════════════════════════
       RENDER
    ══════════════════════════════════════════════════════════════ */
    return (
        <div className="min-h-screen bg-[#F0F4F2] dark:bg-[#0d1a12] font-sans flex flex-col transition-colors duration-300">
            <Toaster position="top-right" toastOptions={{ style: { borderRadius: '12px', fontWeight: 600 } }} />

            {/* ── TOP BAR ── */}
            <header className="bg-white dark:bg-[#162918] border-b border-slate-200 dark:border-slate-700 px-4 py-3 flex items-center justify-between sticky top-0 z-40 shadow-sm lg:pl-[272px]">
                <button className="lg:hidden p-2 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-700 text-slate-600 dark:text-slate-300 transition" onClick={() => setSidebarOpen(!sidebarOpen)} aria-label="Buka sidebar">
                    <Menu className="w-5 h-5" />
                </button>

                {/* Breadcrumb — desktop */}
                <div className="hidden lg:flex items-center gap-1.5 text-slate-500 dark:text-slate-400 text-sm">
                    <Home className="w-4 h-4 text-slate-400 dark:text-slate-500" />
                    <ChevronRight className="w-3 h-3 text-slate-300 dark:text-slate-600" />
                    <span className="font-bold text-slate-800 dark:text-slate-100 capitalize">
                        {navItems.find(n => n.id === activeTab)?.label}
                    </span>
                </div>

                {/* Brand — mobile */}
                <div className="lg:hidden flex items-center gap-2">
                    <div className="bg-gradient-to-br from-[#0D5C35] to-[#0A492A] p-2 rounded-xl shadow-md">
                        <FileText className="text-white w-4 h-4" />
                    </div>
                    <div>
                        <p className="font-black text-slate-800 dark:text-slate-100 text-sm leading-tight">Admin Panel</p>
                        <span className="text-[10px] font-bold text-[#D4AF37] uppercase tracking-widest">KPKNL Kendari</span>
                    </div>
                </div>

                {/* Kanan: admin info + dark toggle + logout */}
                <div className="flex items-center gap-2">
                    {/* Admin badge - desktop only */}
                    <div className="hidden sm:flex items-center gap-2 px-3 py-1.5 bg-slate-100 dark:bg-slate-700 rounded-xl border border-slate-200 dark:border-slate-600 mr-1">
                        <User className="w-3.5 h-3.5 text-slate-400 dark:text-slate-400" />
                        <span className="text-xs font-bold text-slate-600 dark:text-slate-300 max-w-[120px] truncate">{adminDisplay}</span>
                    </div>

                    {/* Dark mode toggle */}
                    <button
                        onClick={() => setIsDark(p => !p)}
                        className="p-2 rounded-xl bg-slate-100 dark:bg-slate-700 hover:bg-slate-200 dark:hover:bg-slate-600 text-slate-600 dark:text-slate-300 border border-slate-200 dark:border-slate-600 transition-all"
                        aria-label={isDark ? 'Mode Terang' : 'Mode Gelap'}
                        title={isDark ? 'Mode Terang' : 'Mode Gelap'}
                    >
                        {isDark ? <Sun className="w-4 h-4 text-amber-500" /> : <Moon className="w-4 h-4" />}
                    </button>

                    {/* Logout */}
                    <button onClick={confirmLogout}
                        className="flex items-center gap-1.5 text-rose-600 hover:text-white font-bold text-xs transition-all hover:bg-rose-500 hover:shadow-lg hover:shadow-rose-200 px-3 py-2 rounded-xl border border-rose-100 dark:border-rose-800/40">
                        <LogOut className="w-3.5 h-3.5" />
                        <span className="hidden sm:inline">Keluar</span>
                    </button>
                </div>
            </header>

            <div className="flex flex-1 relative">

                {/* ── SIDEBAR ── */}
                <>
                    {sidebarOpen && <div className="fixed inset-0 bg-slate-900/50 z-30 lg:hidden" onClick={() => setSidebarOpen(false)} />}
                    <aside className={`
                        fixed top-0 left-0 h-full w-64 bg-gradient-to-b from-[#0D5C35] to-[#0A492A]
                        flex flex-col z-40 transition-transform duration-300 ease-in-out
                        ${sidebarOpen ? 'translate-x-0' : '-translate-x-full'}
                        lg:translate-x-0 lg:top-0 lg:h-screen
                    `}>
                        <div className="px-5 py-6 border-b border-white/10 flex-shrink-0 relative">
                            <div className="flex items-center gap-3">
                                <div className="bg-white/10 backdrop-blur-sm p-2.5 rounded-xl border border-white/10 shadow-md">
                                    <FileText className="text-white w-5 h-5" />
                                </div>
                                <div>
                                    <p className="font-black text-white text-base leading-none">Admin Panel</p>
                                    <span className="text-[10px] font-bold text-[#D4AF37] uppercase tracking-widest">KPKNL Kendari</span>
                                </div>
                            </div>
                            <button className="lg:hidden absolute top-5 right-4 p-1.5 text-white/60 hover:text-white hover:bg-white/10 rounded-lg transition" onClick={() => setSidebarOpen(false)}>
                                <X className="w-5 h-5" />
                            </button>
                        </div>

                        <nav className="flex-1 px-4 py-5 space-y-1.5 overflow-y-auto">
                            <p className="text-white/30 text-[10px] font-bold uppercase tracking-widest px-3 mb-3">Menu Utama</p>
                            {navItems.map(item => {
                                const isActive = activeTab === item.id;
                                return (
                                    <button key={item.id} onClick={() => handleTabChange(item.id)}
                                        className={`w-full flex items-center gap-3 px-3 py-3 rounded-xl font-bold text-sm transition-all duration-200 group relative
                                            ${isActive ? 'bg-white text-[#0D5C35] shadow-lg shadow-black/20' : 'text-white/70 hover:text-white hover:bg-white/10'}`}>
                                        {isActive && <div className="absolute left-0 top-1/2 -translate-y-1/2 w-1 h-6 bg-[#D4AF37] rounded-r-full" />}
                                        <span className={`transition-transform ${isActive ? 'scale-110' : 'group-hover:scale-110'}`}>{item.icon}</span>
                                        <span className="flex-1 text-left">{item.label}</span>
                                        {item.badge !== null && (
                                            <span className={`text-[10px] font-black px-2 py-0.5 rounded-full min-w-[1.4rem] text-center
                                                ${isActive ? 'bg-[#0D5C35] text-white' : 'bg-white/15 text-white/80'}`}>
                                                {item.badge}
                                            </span>
                                        )}
                                    </button>
                                );
                            })}
                        </nav>

                        {/* Statistik ringkas + last login */}
                        <div className="px-4 py-4 border-t border-white/10 flex-shrink-0">
                            <div className="bg-white/5 rounded-2xl border border-white/10 p-4 space-y-2 mb-3">
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

                            {/* Last login info */}
                            <div className="bg-white/5 rounded-xl border border-white/10 px-3 py-2 mb-3 flex items-center gap-2">
                                <ClockIcon className="w-3 h-3 text-white/30 flex-shrink-0" />
                                <div className="min-w-0">
                                    <p className="text-white/30 text-[9px] uppercase tracking-widest">Login sebagai</p>
                                    <p className="text-white/60 text-[10px] font-bold truncate">{adminEmail}</p>
                                </div>
                            </div>

                            <button onClick={() => navigate('/')}
                                className="w-full flex items-center justify-center gap-2 px-3 py-2.5 bg-white/5 hover:bg-white/10 border border-white/10 text-white/60 hover:text-white text-xs font-bold rounded-xl transition-all">
                                <Home className="w-3.5 h-3.5" /> Lihat Website
                            </button>
                        </div>
                    </aside>
                </>

                {/* ── KONTEN KANAN ── */}
                <main className="flex-1 lg:pl-64 min-h-screen">
                    <div className="max-w-6xl mx-auto p-4 md:p-6 lg:p-8">

                        {/* ── TAB: OVERVIEW ── */}
                        {activeTab === 'overview' && (
                            <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
                                <div>
                                    <h2 className="text-2xl font-black text-slate-800 dark:text-slate-100 tracking-tight">Dashboard</h2>
                                    <p className="text-slate-500 dark:text-slate-400 text-sm mt-1">Ringkasan data dan statistik knowledge base KPKNL Kendari</p>
                                </div>

                                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 md:gap-5">
                                    {[
                                        { label: 'Total Dokumen', val: contents.length, icon: <FileText className="w-7 h-7" />, bg: 'bg-blue-50    text-blue-600', border: 'border-blue-100    dark:border-blue-900/30' },
                                        { label: 'Total Dilihat', val: stats.totalViews, icon: <Eye className="w-7 h-7" />, bg: 'bg-emerald-50 text-emerald-600', border: 'border-emerald-100 dark:border-emerald-900/30' },
                                        { label: 'Total Apresiasi', val: stats.totalLikes, icon: <ThumbsUp className="w-7 h-7" />, bg: 'bg-amber-50   text-amber-600', border: 'border-amber-100   dark:border-amber-900/30' },
                                    ].map(s => (
                                        <div key={s.label} className={`bg-white dark:bg-[#162918] p-6 rounded-3xl shadow-sm border ${s.border} flex items-center gap-5 hover:-translate-y-1 hover:shadow-lg transition-all`}>
                                            <div className={`p-3.5 rounded-2xl flex-shrink-0 ${s.bg}`}>{s.icon}</div>
                                            <div className="min-w-0">
                                                <p className="text-slate-400 dark:text-slate-500 text-xs font-bold uppercase tracking-wider truncate">{s.label}</p>
                                                <h3 className="text-3xl md:text-4xl font-black text-slate-800 dark:text-slate-100">{s.val}</h3>
                                            </div>
                                        </div>
                                    ))}
                                </div>

                                <div className="grid grid-cols-1 lg:grid-cols-2 gap-5 md:gap-6">
                                    <div className="bg-white dark:bg-[#162918] p-5 md:p-7 rounded-3xl shadow-sm border border-slate-100 dark:border-slate-700">
                                        <h3 className="font-bold text-slate-800 dark:text-slate-100 mb-5 flex items-center text-sm md:text-base">
                                            <TrendingUp className="w-5 h-5 mr-2.5 text-[#0D5C35] flex-shrink-0" /> Dokumen Terpopuler (Top 5)
                                        </h3>
                                        <div className="h-64 md:h-72 w-full">
                                            <ResponsiveContainer width="100%" height="100%">
                                                <BarChart data={stats.topViewed} layout="vertical" margin={{ top: 5, right: 30, left: 10, bottom: 5 }}>
                                                    <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke={isDark ? '#2d4a35' : '#f1f5f9'} />
                                                    <XAxis type="number" hide />
                                                    <YAxis dataKey="name" type="category" width={110} tick={{ fontSize: 10, fontWeight: 600, fill: isDark ? '#94a3b8' : '#64748b' }} axisLine={false} tickLine={false} />
                                                    <Tooltip contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.2)', background: isDark ? '#162918' : '#fff', color: isDark ? '#f1f5f9' : '#1e293b', fontSize: '12px' }} />
                                                    <Bar dataKey="views" fill="#0D5C35" radius={[0, 8, 8, 0]} barSize={20} />
                                                </BarChart>
                                            </ResponsiveContainer>
                                        </div>
                                    </div>
                                    <div className="bg-white dark:bg-[#162918] p-5 md:p-7 rounded-3xl shadow-sm border border-slate-100 dark:border-slate-700">
                                        <h3 className="font-bold text-slate-800 dark:text-slate-100 mb-5 flex items-center text-sm md:text-base">
                                            <PieChartIcon className="w-5 h-5 mr-2.5 text-[#0D5C35] flex-shrink-0" /> Distribusi Kategori
                                        </h3>
                                        <div className="h-64 md:h-72 w-full">
                                            <ResponsiveContainer width="100%" height="100%">
                                                <PieChart>
                                                    <Pie data={stats.pieData} cx="50%" cy="45%" innerRadius={55} outerRadius={80} paddingAngle={4} dataKey="value">
                                                        {stats.pieData.map((_, i) => <Cell key={i} fill={CHART_COLORS[i % CHART_COLORS.length]} />)}
                                                    </Pie>
                                                    <Tooltip contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.2)', background: isDark ? '#162918' : '#fff', color: isDark ? '#f1f5f9' : '#1e293b', fontSize: '12px' }} />
                                                    <Legend verticalAlign="bottom" height={56} iconType="circle" wrapperStyle={{ fontSize: '10px', fontWeight: 600, color: isDark ? '#94a3b8' : '#64748b' }} />
                                                </PieChart>
                                            </ResponsiveContainer>
                                        </div>
                                    </div>
                                </div>

                                {/* ── 2 Chart Baru ── */}
                                <div className="grid grid-cols-1 lg:grid-cols-2 gap-5 md:gap-6">
                                    {/* Trend 7 hari */}
                                    <div className="bg-white dark:bg-[#162918] p-5 md:p-7 rounded-3xl shadow-sm border border-slate-100 dark:border-slate-700">
                                        <div className="mb-4">
                                            <h3 className="font-bold text-slate-800 dark:text-slate-100 flex items-center text-sm md:text-base">
                                                <BarChart3 className="w-5 h-5 mr-2.5 text-[#D4AF37] flex-shrink-0" /> Aktivitas 7 Hari Terakhir
                                            </h3>
                                            <p className="text-xs text-slate-400 dark:text-slate-500 mt-0.5 ml-7">Dokumen yang diupdate per hari</p>
                                        </div>
                                        <div className="h-52 w-full">
                                            <ResponsiveContainer width="100%" height="100%">
                                                <AreaChart data={stats.trendData} margin={{ top: 5, right: 10, left: -20, bottom: 0 }}>
                                                    <defs>
                                                        <linearGradient id="trendGrad" x1="0" y1="0" x2="0" y2="1">
                                                            <stop offset="5%" stopColor="#0D5C35" stopOpacity={0.35} />
                                                            <stop offset="95%" stopColor="#0D5C35" stopOpacity={0} />
                                                        </linearGradient>
                                                    </defs>
                                                    <CartesianGrid strokeDasharray="3 3" stroke={isDark ? '#2d4a35' : '#f1f5f9'} />
                                                    <XAxis dataKey="hari" tick={{ fontSize: 9, fontWeight: 700, fill: isDark ? '#94a3b8' : '#64748b' }} axisLine={false} tickLine={false} />
                                                    <YAxis tick={{ fontSize: 10, fill: isDark ? '#94a3b8' : '#64748b' }} axisLine={false} tickLine={false} allowDecimals={false} />
                                                    <Tooltip contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.2)', background: isDark ? '#162918' : '#fff', color: isDark ? '#f1f5f9' : '#1e293b', fontSize: '12px' }} />
                                                    <Area type="monotone" dataKey="dokumen" stroke="#0D5C35" strokeWidth={2.5} fill="url(#trendGrad)" dot={{ fill: '#0D5C35', r: 4, strokeWidth: 2, stroke: '#fff' }} activeDot={{ r: 6 }} />
                                                </AreaChart>
                                            </ResponsiveContainer>
                                        </div>
                                    </div>
                                    {/* Views per kategori */}
                                    <div className="bg-white dark:bg-[#162918] p-5 md:p-7 rounded-3xl shadow-sm border border-slate-100 dark:border-slate-700">
                                        <div className="mb-4">
                                            <h3 className="font-bold text-slate-800 dark:text-slate-100 flex items-center text-sm md:text-base">
                                                <Eye className="w-5 h-5 mr-2.5 text-blue-500 flex-shrink-0" /> Views per Kategori
                                            </h3>
                                            <p className="text-xs text-slate-400 dark:text-slate-500 mt-0.5 ml-7">Total tampilan berdasarkan kategori</p>
                                        </div>
                                        <div className="h-52 w-full">
                                            <ResponsiveContainer width="100%" height="100%">
                                                <BarChart data={stats.catViewsData} layout="vertical" margin={{ top: 0, right: 20, left: 5, bottom: 0 }}>
                                                    <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke={isDark ? '#2d4a35' : '#f1f5f9'} />
                                                    <XAxis type="number" hide />
                                                    <YAxis dataKey="name" type="category" width={90} tick={{ fontSize: 9, fontWeight: 700, fill: isDark ? '#94a3b8' : '#64748b' }} axisLine={false} tickLine={false} />
                                                    <Tooltip contentStyle={{ borderRadius: '12px', border: 'none', background: isDark ? '#162918' : '#fff', color: isDark ? '#f1f5f9' : '#1e293b', fontSize: '12px' }} />
                                                    <Bar dataKey="views" radius={[0, 6, 6, 0]} barSize={14}>
                                                        {stats.catViewsData.map((_, i) => <Cell key={i} fill={CHART_COLORS[i % CHART_COLORS.length]} />)}
                                                    </Bar>
                                                </BarChart>
                                            </ResponsiveContainer>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        )}

                        {/* ── TAB: DATA SOP ── */}
                        {activeTab === 'sop' && (
                            <div className="animate-in fade-in zoom-in duration-300">
                                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
                                    <div>
                                        <h2 className="text-2xl font-black text-slate-800 dark:text-slate-100 tracking-tight">Data SOP</h2>
                                        <p className="text-slate-500 dark:text-slate-400 text-sm mt-1">{contents.length} dokumen tersimpan</p>
                                    </div>
                                </div>

                                {/* Toolbar */}
                                <div className="bg-white dark:bg-[#162918] p-4 md:p-5 rounded-2xl shadow-sm border border-slate-200 dark:border-slate-700 mb-5">
                                    <div className="flex flex-col gap-3">
                                        <div className="flex flex-col sm:flex-row gap-3">
                                            <div className="relative flex-1">
                                                <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
                                                <input type="text" placeholder="Cari judul atau deskripsi SOP…"
                                                    className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-600 dark:bg-[#0f1f16] dark:text-slate-200 focus:ring-2 focus:ring-[#0D5C35] outline-none text-sm font-medium"
                                                    value={searchTerm} onChange={e => { setSearchTerm(e.target.value); setSopPage(1); }} />
                                            </div>
                                            <div className="relative sm:w-44">
                                                <Filter className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
                                                <select className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-600 dark:bg-[#0f1f16] dark:text-slate-200 focus:ring-2 focus:ring-[#0D5C35] outline-none text-sm font-medium appearance-none cursor-pointer"
                                                    value={filterCategory} onChange={e => { setFilterCategory(e.target.value); setSopPage(1); }}>
                                                    <option value="all">Semua Kategori</option>
                                                    {['psp', 'sewa', 'penjualan', 'penghapusan', 'pinjam-pakai', 'penggunaan-sementara', 'alih-status', 'hibah', 'user-siman'].map(c => (
                                                        <option key={c} value={c}>{c.toUpperCase().replace(/-/g, ' ')}</option>
                                                    ))}
                                                </select>
                                            </div>
                                        </div>
                                        <div className="flex gap-3">
                                            <button onClick={handleExportExcel} className="flex-1 sm:flex-none flex items-center justify-center gap-1.5 bg-white dark:bg-[#0f1f16] border-2 border-[#00A3C8] text-[#00A3C8] px-4 py-2.5 rounded-xl font-bold hover:bg-[#00A3C8] hover:text-white transition-colors text-sm">
                                                <FileSpreadsheet className="w-4 h-4" /> Export
                                            </button>
                                            <button onClick={handleAddSop} className="flex-1 sm:flex-none flex items-center justify-center gap-1.5 bg-[#0D5C35] text-white px-4 py-2.5 rounded-xl font-bold shadow-lg shadow-emerald-200 hover:bg-[#0A492A] hover:-translate-y-0.5 transition-all text-sm">
                                                <Plus className="w-4 h-4" /> Tambah SOP
                                            </button>
                                        </div>
                                    </div>
                                </div>

                                {/* Tabel */}
                                <div className="bg-white dark:bg-[#162918] rounded-3xl shadow-sm border border-slate-200 dark:border-slate-700 overflow-hidden">
                                    <div className="overflow-x-auto">
                                        <table className="w-full text-left border-collapse" style={{ minWidth: '680px' }}>
                                            <thead className="bg-slate-50 dark:bg-[#1a3021] text-slate-500 dark:text-slate-400 text-xs uppercase font-black tracking-wider border-b border-slate-200 dark:border-slate-700">
                                                <tr>
                                                    <th className="px-5 py-4">Judul & Info</th>
                                                    <th className="px-5 py-4 w-36">Kategori</th>
                                                    <th className="px-5 py-4 w-44 hidden lg:table-cell">Tags</th>
                                                    <th className="px-5 py-4 text-center w-32">Statistik</th>
                                                    <th className="px-5 py-4 text-center w-28">Aksi</th>
                                                </tr>
                                            </thead>
                                            <tbody className="divide-y divide-slate-100 dark:divide-slate-700/50">
                                                {currentSopPage.length > 0 ? currentSopPage.map(item => (
                                                    <tr key={item.id} className="hover:bg-slate-50/70 dark:hover:bg-[#1a3021]/50 transition-colors">
                                                        <td className="px-5 py-4">
                                                            <p className="font-bold text-slate-800 dark:text-slate-100 mb-1 leading-snug">{item.title}</p>
                                                            <div className="flex items-center gap-2 text-xs text-slate-400 dark:text-slate-500 flex-wrap">
                                                                <ClockIcon className="w-3 h-3" />
                                                                <span>{formatTime(item.updatedAt)}</span>
                                                                {item.updatedBy && (
                                                                    <>
                                                                        <span className="w-1 h-1 rounded-full bg-slate-300 dark:bg-slate-600" />
                                                                        <span className="flex items-center gap-1 text-[10px] bg-[#0D5C35]/10 dark:bg-emerald-900/20 text-[#0D5C35] dark:text-emerald-400 px-1.5 py-0.5 rounded-md font-bold border border-[#0D5C35]/15 dark:border-emerald-700/30">
                                                                            <User className="w-2.5 h-2.5" />{item.updatedBy.split('@')[0]}
                                                                        </span>
                                                                    </>
                                                                )}
                                                            </div>
                                                        </td>
                                                        <td className="px-5 py-4">
                                                            <span className={`px-3 py-1.5 rounded-full text-[10px] font-black uppercase tracking-wider border shadow-sm ${getCategoryColor(item.category || 'psp')}`}>
                                                                {(item.category || 'psp').replace(/-/g, ' ')}
                                                            </span>
                                                        </td>
                                                        <td className="px-5 py-4 hidden lg:table-cell">
                                                            {(item.tags || []).length > 0 ? (
                                                                <div className="flex flex-wrap gap-1">
                                                                    {(item.tags || []).slice(0, 3).map(tag => (
                                                                        <span key={tag} className="inline-flex items-center gap-0.5 px-2 py-0.5 rounded-full text-[9px] font-bold bg-slate-100 dark:bg-slate-700 text-slate-500 dark:text-slate-400 border border-slate-200 dark:border-slate-600">
                                                                            <Tag className="w-2.5 h-2.5" />{tag}
                                                                        </span>
                                                                    ))}
                                                                    {(item.tags || []).length > 3 && <span className="text-[9px] text-slate-400">+{(item.tags || []).length - 3}</span>}
                                                                </div>
                                                            ) : <span className="text-[10px] text-slate-300 dark:text-slate-600 italic">—</span>}
                                                        </td>
                                                        <td className="px-5 py-4 text-center">
                                                            <div className="flex items-center justify-center gap-1.5 text-xs font-bold flex-wrap">
                                                                <span className="flex items-center bg-blue-50 dark:bg-blue-900/20 px-2 py-1.5 rounded-lg text-blue-600 dark:text-blue-400 border border-blue-100 dark:border-blue-800/30 gap-1"><Eye className="w-3.5 h-3.5" />{item.views || 0}</span>
                                                                <span className="flex items-center bg-emerald-50 dark:bg-emerald-900/20 px-2 py-1.5 rounded-lg text-emerald-600 dark:text-emerald-400 border border-emerald-100 dark:border-emerald-800/30 gap-1"><ThumbsUp className="w-3.5 h-3.5" />{item.likes || 0}</span>
                                                            </div>
                                                        </td>
                                                        <td className="px-5 py-4 text-center">
                                                            <div className="flex justify-center gap-2">
                                                                <button onClick={() => handleEditSop(item)} className="p-2.5 text-amber-600 bg-amber-50 dark:bg-amber-900/20 hover:bg-amber-500 hover:text-white rounded-xl border border-amber-100 dark:border-amber-700/30 transition-all" title="Edit"><Edit className="w-4 h-4" /></button>
                                                                <button
                                                                    onClick={() => setConfirmModal({
                                                                        isOpen: true, type: 'info',
                                                                        title: 'Reset Statistik?',
                                                                        message: `Reset views, likes & dislikes untuk "${item.title}" menjadi 0?`,
                                                                        onConfirm: async () => {
                                                                            await updateDoc(doc(db, 'knowledge-base', item.id), { views: 0, likes: 0, dislikes: 0 });
                                                                            toast.success('✅ Statistik berhasil direset!');
                                                                            setConfirmModal(p => ({ ...p, isOpen: false }));
                                                                        }
                                                                    })}
                                                                    className="p-2.5 text-blue-600 bg-blue-50 dark:bg-blue-900/20 hover:bg-blue-500 hover:text-white rounded-xl border border-blue-100 dark:border-blue-700/30 transition-all"
                                                                    title="Reset Statistik">
                                                                    <RefreshCw className="w-4 h-4" />
                                                                </button>
                                                                <button onClick={() => confirmDelete('knowledge-base', item.id)} className="p-2.5 text-rose-600 bg-rose-50 dark:bg-rose-900/20 hover:bg-rose-500 hover:text-white rounded-xl border border-rose-100 dark:border-rose-700/30 transition-all" title="Hapus"><Trash2 className="w-4 h-4" /></button>
                                                            </div>
                                                        </td>
                                                    </tr>
                                                )) : (
                                                    <tr>
                                                        <td colSpan={5} className="py-16 text-center">
                                                            <FileText className="w-12 h-12 text-slate-200 dark:text-slate-600 mx-auto mb-3" />
                                                            <p className="text-slate-400 dark:text-slate-500 font-bold">Tidak ada data yang cocok.</p>
                                                        </td>
                                                    </tr>
                                                )}
                                            </tbody>
                                        </table>
                                    </div>

                                    {/* Pagination SOP */}
                                    <div className="p-4 border-t border-slate-100 dark:border-slate-700 flex flex-col sm:flex-row justify-between items-center gap-3 bg-slate-50/30 dark:bg-[#1a3021]/30">
                                        <div className="flex items-center gap-3 text-sm text-slate-500 dark:text-slate-400">
                                            <span>Tampil</span>
                                            <select value={sopPerPage} onChange={e => { setSopPerPage(Number(e.target.value)); setSopPage(1); }}
                                                className="border border-slate-200 dark:border-slate-600 rounded-lg px-2 py-1 bg-white dark:bg-[#0f1f16] dark:text-slate-200 text-sm outline-none cursor-pointer">
                                                {[5, 10, 20, 50].map(n => <option key={n} value={n}>{n}</option>)}
                                            </select>
                                            <span>dari <strong className="text-slate-700 dark:text-slate-200">{filteredContents.length}</strong> data</span>
                                        </div>
                                        <div className="flex items-center gap-2">
                                            <button onClick={() => setSopPage(p => Math.max(p - 1, 1))} disabled={sopPage === 1}
                                                className="p-2 border border-slate-200 dark:border-slate-600 rounded-lg hover:bg-slate-50 dark:hover:bg-slate-700 dark:text-slate-300 disabled:opacity-40 disabled:cursor-not-allowed transition-colors">
                                                <ChevronLeft className="w-4 h-4" />
                                            </button>
                                            {/* Page buttons */}
                                            {Array.from({ length: Math.min(sopTotalPages, 5) }, (_, i) => {
                                                const page = sopTotalPages <= 5 ? i + 1 : sopPage <= 3 ? i + 1 : sopPage >= sopTotalPages - 2 ? sopTotalPages - 4 + i : sopPage - 2 + i;
                                                return (
                                                    <button key={page} onClick={() => setSopPage(page)}
                                                        className={`w-8 h-8 rounded-lg text-sm font-bold transition-all ${sopPage === page ? 'bg-[#0D5C35] text-white shadow-md' : 'border border-slate-200 dark:border-slate-600 hover:bg-slate-50 dark:hover:bg-slate-700 text-slate-600 dark:text-slate-300'}`}>
                                                        {page}
                                                    </button>
                                                );
                                            })}
                                            <button onClick={() => setSopPage(p => Math.min(p + 1, sopTotalPages))} disabled={sopPage === sopTotalPages || sopTotalPages === 0}
                                                className="p-2 border border-slate-200 dark:border-slate-600 rounded-lg hover:bg-slate-50 dark:hover:bg-slate-700 dark:text-slate-300 disabled:opacity-40 disabled:cursor-not-allowed transition-colors">
                                                <ChevronRight className="w-4 h-4" />
                                            </button>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        )}

                        {/* ── TAB: DATA FAQ ── */}
                        {activeTab === 'faq' && (
                            <div className="animate-in fade-in zoom-in duration-300">
                                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
                                    <div>
                                        <h2 className="text-2xl font-black text-slate-800 dark:text-slate-100 tracking-tight">Data FAQ</h2>
                                        <p className="text-slate-500 dark:text-slate-400 text-sm mt-1">{faqs.length} pertanyaan tersimpan</p>
                                    </div>
                                    <button onClick={handleAddFaq} className="self-start sm:self-auto flex items-center gap-1.5 bg-[#0D5C35] text-white px-5 py-2.5 rounded-xl font-bold shadow-lg shadow-emerald-200 hover:bg-[#0A492A] hover:-translate-y-0.5 transition-all text-sm">
                                        <Plus className="w-4 h-4" /> Tambah FAQ
                                    </button>
                                </div>
                                <div className="space-y-4">
                                    {faqs.length > 0 ? faqs.map(item => (
                                        <div key={item.id} className="bg-white dark:bg-[#162918] p-5 md:p-7 rounded-3xl border border-slate-200 dark:border-slate-700 shadow-sm hover:shadow-md transition-shadow">
                                            <div className="flex items-start justify-between gap-4">
                                                <div className="flex-grow min-w-0 space-y-3">
                                                    <div className="flex items-start gap-3">
                                                        <span className="flex-shrink-0 bg-amber-100 dark:bg-amber-900/30 text-amber-700 dark:text-amber-400 font-black px-2.5 py-1 rounded-lg text-xs mt-0.5">Q</span>
                                                        <h3 className="font-bold text-slate-800 dark:text-slate-100 leading-snug">{item.question}</h3>
                                                    </div>
                                                    <div className="flex items-start gap-3">
                                                        <span className="flex-shrink-0 bg-emerald-100 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-400 font-black px-2.5 py-1 rounded-lg text-xs mt-0.5">A</span>
                                                        <p className="text-slate-600 dark:text-slate-300 text-sm whitespace-pre-line leading-relaxed">{item.answer}</p>
                                                    </div>
                                                </div>
                                                <div className="flex flex-col gap-2 flex-shrink-0">
                                                    <button onClick={() => handleEditFaq(item)} className="p-2.5 text-amber-600 bg-amber-50 dark:bg-amber-900/20 hover:bg-amber-500 hover:text-white rounded-xl border border-amber-100 dark:border-amber-700/30 transition-all" title="Edit"><Edit className="w-4 h-4" /></button>
                                                    <button onClick={() => confirmDelete('faqs', item.id)} className="p-2.5 text-rose-600 bg-rose-50 dark:bg-rose-900/20 hover:bg-rose-500 hover:text-white rounded-xl border border-rose-100 dark:border-rose-700/30 transition-all" title="Hapus"><Trash2 className="w-4 h-4" /></button>
                                                </div>
                                            </div>
                                        </div>
                                    )) : (
                                        <div className="bg-white dark:bg-[#162918] py-20 rounded-3xl border border-slate-200 dark:border-slate-700 text-center">
                                            <HelpCircle className="w-14 h-14 text-slate-200 dark:text-slate-600 mx-auto mb-4" />
                                            <p className="text-slate-500 dark:text-slate-400 font-bold text-lg mb-1">Belum ada FAQ</p>
                                            <p className="text-slate-400 dark:text-slate-500 text-sm">Klik tombol "Tambah FAQ" untuk mulai.</p>
                                        </div>
                                    )}
                                </div>
                            </div>
                        )}

                        {/* ── TAB: DATA PANDUAN ── */}
                        {activeTab === 'guide' && (
                            <div className="animate-in fade-in zoom-in duration-300">
                                <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4 mb-6">
                                    <div>
                                        <h2 className="text-2xl font-black text-slate-800 dark:text-slate-100 tracking-tight">Data Panduan</h2>
                                        <p className="text-slate-500 dark:text-slate-400 text-sm mt-1">{guides.length} panduan tersimpan</p>
                                    </div>
                                    <button onClick={handleAddGuide} className="self-start sm:self-auto flex items-center gap-1.5 bg-[#0D5C35] text-white px-5 py-2.5 rounded-xl font-bold shadow-lg shadow-emerald-200 hover:bg-[#0A492A] hover:-translate-y-0.5 transition-all text-sm">
                                        <Plus className="w-4 h-4" /> Buat Panduan
                                    </button>
                                </div>
                                {guides.length > 0 ? (
                                    <div className="space-y-5">
                                        {guides.map((item, i) => (
                                            <GuideCard key={item.id} item={item} index={i}
                                                onEdit={() => handleEditGuide(item)}
                                                onDelete={() => confirmDelete('guides', item.id)}
                                                formatTime={formatTime} />
                                        ))}
                                    </div>
                                ) : (
                                    <div className="bg-white dark:bg-[#162918] py-20 rounded-3xl border-2 border-dashed border-slate-200 dark:border-slate-700 text-center">
                                        <div className="w-20 h-20 mx-auto mb-5 rounded-2xl bg-blue-50 dark:bg-blue-900/20 flex items-center justify-center">
                                            <BookMarked className="w-10 h-10 text-blue-300 dark:text-blue-500" />
                                        </div>
                                        <p className="text-slate-600 dark:text-slate-300 font-bold text-lg mb-1">Belum ada panduan</p>
                                        <p className="text-slate-400 dark:text-slate-500 text-sm mb-8 px-6">Buat panduan pengguna untuk membantu pengunjung memahami cara menggunakan knowledge base.</p>
                                        <button onClick={handleAddGuide} className="inline-flex items-center gap-2 bg-[#0D5C35] text-white px-6 py-3 rounded-xl font-bold shadow-lg shadow-emerald-200 hover:bg-[#0A492A] hover:-translate-y-0.5 transition-all">
                                            <Plus className="w-4 h-4" /> Buat Panduan Pertama
                                        </button>
                                    </div>
                                )}
                            </div>
                        )}
                    </div>
                </main>
            </div>

            {/* ══════════════════════════════════════════════════════════
                MODALS
            ══════════════════════════════════════════════════════════ */}

            {/* Konfirmasi (delete / logout / unsaved / info) */}
            {confirmModal.isOpen && (
                <div className="fixed inset-0 bg-slate-900/60 z-[60] flex items-center justify-center p-4 backdrop-blur-sm animate-in fade-in duration-200">
                    <div className="bg-white dark:bg-[#162918] rounded-3xl w-full max-w-sm p-7 md:p-8 shadow-2xl dark:border dark:border-slate-700">
                        <div className="flex flex-col items-center text-center">
                            <div className={`w-16 h-16 md:w-20 md:h-20 rounded-full flex items-center justify-center mb-5 shadow-inner
                                ${confirmModal.type === 'delete' ? 'bg-rose-50 text-rose-500 border-4 border-rose-100'
                                    : confirmModal.type === 'unsaved' ? 'bg-amber-50 text-amber-500 border-4 border-amber-100'
                                        : confirmModal.type === 'info' ? 'bg-blue-50 text-blue-500 border-4 border-blue-100'
                                            : 'bg-amber-50 text-amber-500 border-4 border-amber-100'}`}>
                                {confirmModal.type === 'unsaved' ? <AlertCircle className="w-8 h-8 md:w-10 md:h-10" />
                                    : confirmModal.type === 'info' ? <RefreshCw className="w-8 h-8 md:w-10 md:h-10" />
                                        : <AlertTriangle className="w-8 h-8 md:w-10 md:h-10" />}
                            </div>
                            <h3 className="text-xl md:text-2xl font-black text-slate-800 dark:text-slate-100 mb-2">{confirmModal.title}</h3>
                            <p className="text-slate-500 dark:text-slate-400 mb-7 leading-relaxed font-medium text-sm md:text-base">{confirmModal.message}</p>
                            <div className="flex w-full gap-3">
                                <button onClick={() => setConfirmModal(p => ({ ...p, isOpen: false }))}
                                    className="flex-1 py-3 bg-slate-100 dark:bg-slate-700 hover:bg-slate-200 dark:hover:bg-slate-600 text-slate-700 dark:text-slate-200 font-bold rounded-xl transition-colors">
                                    {confirmModal.type === 'unsaved' ? 'Tetap Edit' : 'Batal'}
                                </button>
                                <button onClick={confirmModal.onConfirm}
                                    className={`flex-1 py-3 text-white font-bold rounded-xl shadow-lg transition-all
                                    ${confirmModal.type === 'delete' ? 'bg-rose-600 hover:bg-rose-700 shadow-rose-200'
                                            : confirmModal.type === 'unsaved' ? 'bg-amber-500 hover:bg-amber-600 shadow-amber-200'
                                                : confirmModal.type === 'info' ? 'bg-blue-600 hover:bg-blue-700 shadow-blue-200'
                                                    : 'bg-amber-500 hover:bg-amber-600 shadow-amber-200'}`}>
                                    {confirmModal.type === 'delete' ? 'Ya, Hapus'
                                        : confirmModal.type === 'unsaved' ? 'Buang Perubahan'
                                            : confirmModal.type === 'info' ? 'Ya, Reset'
                                                : 'Ya, Keluar'}
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* ── Modal SOP — dengan tab Editor / Preview ── */}
            {isModalOpen && (
                <div className="fixed inset-0 bg-slate-900/60 z-50 flex items-center justify-center p-3 md:p-4 backdrop-blur-sm animate-in fade-in zoom-in-95 duration-200">
                    <div className="bg-white dark:bg-[#162918] rounded-3xl w-full max-w-3xl shadow-2xl flex flex-col max-h-[95vh] md:max-h-[90vh] dark:border dark:border-slate-700">
                        {/* Header */}
                        <div className="flex justify-between items-center p-6 md:p-8 pb-4 border-b border-slate-100 dark:border-slate-700 flex-shrink-0">
                            <h3 className="font-black text-xl md:text-2xl text-slate-800 dark:text-slate-100 flex items-center gap-3">
                                <FileText className="w-6 h-6 text-[#0D5C35] flex-shrink-0" />
                                {editingId ? 'Edit SOP / Layanan' : 'Tambah SOP Baru'}
                            </h3>
                            <div className="flex items-center gap-2">
                                {isDirty && (
                                    <span className="hidden sm:flex items-center gap-1 text-amber-600 dark:text-amber-400 text-xs font-bold bg-amber-50 dark:bg-amber-900/20 px-2.5 py-1.5 rounded-lg border border-amber-200 dark:border-amber-700/30 animate-pulse">
                                        <AlertCircle className="w-3 h-3" /> Belum disimpan
                                    </span>
                                )}
                                <button onClick={() => requestClose('sop')} className="p-2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-700 rounded-full transition-colors"><X className="w-6 h-6" /></button>
                            </div>
                        </div>

                        {/* Body */}
                        <div className="overflow-y-auto flex-1 p-6 md:p-8 pt-5">
                            <form id="sop-form" onSubmit={handleSaveSop} className="space-y-5">
                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                                    <div className="space-y-1.5">
                                        <label className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">Judul Dokumen</label>
                                        <input type="text" placeholder="Masukkan judul…"
                                            className="w-full p-3.5 border border-slate-200 dark:border-slate-600 dark:bg-[#0f1f16] dark:text-slate-200 rounded-xl focus:ring-2 focus:ring-[#0D5C35] outline-none font-medium bg-slate-50 focus:bg-white dark:focus:bg-[#0f1f16]"
                                            required value={formData.title} onChange={e => { setFormData(p => ({ ...p, title: e.target.value })); setIsDirty(true); }} />
                                    </div>
                                    <div className="space-y-1.5">
                                        <label className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">Kategori</label>
                                        <select className="w-full p-3.5 border border-slate-200 dark:border-slate-600 dark:bg-[#0f1f16] dark:text-slate-200 rounded-xl focus:ring-2 focus:ring-[#0D5C35] outline-none font-bold text-slate-700 bg-slate-50 focus:bg-white cursor-pointer"
                                            value={formData.category} onChange={e => { setFormData(p => ({ ...p, category: e.target.value })); setIsDirty(true); }}>
                                            {['psp', 'sewa', 'penjualan', 'penghapusan', 'pinjam-pakai', 'penggunaan-sementara', 'alih-status', 'hibah', 'user-siman'].map(c => (
                                                <option key={c} value={c}>{c.toUpperCase().replace(/-/g, ' ')}</option>
                                            ))}
                                        </select>
                                    </div>
                                </div>

                                <div className="space-y-1.5">
                                    <label className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">Deskripsi Singkat (Preview)</label>
                                    <input type="text" placeholder="Kalimat pendek untuk halaman awal…"
                                        className="w-full p-3.5 border border-slate-200 dark:border-slate-600 dark:bg-[#0f1f16] dark:text-slate-200 rounded-xl focus:ring-2 focus:ring-[#0D5C35] outline-none font-medium bg-slate-50 focus:bg-white dark:focus:bg-[#0f1f16]"
                                        required value={formData.description} onChange={e => { setFormData(p => ({ ...p, description: e.target.value })); setIsDirty(true); }} />
                                </div>

                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                                    <div className="space-y-1.5">
                                        <label className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">Gambar / Diagram <span className="text-slate-400 normal-case font-normal">(Opsional)</span></label>
                                        <input type="file" accept="image/*" onChange={handleImageUpload}
                                            className="block w-full text-sm text-slate-500 file:mr-3 file:py-2.5 file:px-4 file:rounded-lg file:border-0 file:text-sm file:font-bold file:bg-emerald-50 file:text-emerald-700 hover:file:bg-emerald-100 cursor-pointer border border-slate-200 dark:border-slate-600 rounded-xl bg-slate-50 dark:bg-[#0f1f16]" />
                                    </div>
                                    <div className="space-y-1.5">
                                        <label className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">Link Video Tutorial <span className="text-slate-400 normal-case font-normal">(Opsional)</span></label>
                                        <input type="url" placeholder="YouTube / Google Drive…"
                                            className="w-full p-3.5 border border-slate-200 dark:border-slate-600 dark:bg-[#0f1f16] dark:text-slate-200 rounded-xl focus:ring-2 focus:ring-[#0D5C35] outline-none font-medium bg-slate-50 focus:bg-white dark:focus:bg-[#0f1f16]"
                                            value={formData.videoUrl} onChange={e => { setFormData(p => ({ ...p, videoUrl: e.target.value })); setIsDirty(true); }} />
                                    </div>
                                </div>

                                <div className="space-y-1.5">
                                    <label className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">Link File PDF / Excel <span className="text-slate-400 normal-case font-normal">(Opsional)</span></label>
                                    <input type="url" placeholder="https://drive.google.com/…"
                                        className="w-full p-3.5 border border-slate-200 dark:border-slate-600 dark:bg-[#0f1f16] dark:text-slate-200 rounded-xl focus:ring-2 focus:ring-[#0D5C35] outline-none font-medium bg-slate-50 focus:bg-white dark:focus:bg-[#0f1f16]"
                                        value={formData.pdfUrl} onChange={e => { setFormData(p => ({ ...p, pdfUrl: e.target.value })); setIsDirty(true); }} />
                                </div>

                                <div className="space-y-1.5">
                                    <label className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider flex items-center gap-1.5">
                                        <Tag className="w-3.5 h-3.5" /> Tags / Label
                                        <span className="text-slate-400 normal-case font-normal text-[10px] ml-1">(Opsional — tekan Enter atau , untuk menambah)</span>
                                    </label>
                                    {/* ── Chip input ── */}
                                    <div
                                        className="min-h-[46px] w-full flex flex-wrap gap-1.5 p-2.5 border border-slate-200 dark:border-slate-600 rounded-xl bg-slate-50 dark:bg-[#0f1f16] focus-within:ring-2 focus-within:ring-[#0D5C35] focus-within:bg-white dark:focus-within:bg-[#0f1f16] transition-all cursor-text"
                                        onClick={() => document.getElementById('tag-chip-input')?.focus()}>
                                        {formData.tagsRaw.split(',').map(t => t.trim()).filter(Boolean).map(tag => (
                                            <span key={tag} className="inline-flex items-center gap-1 pl-2.5 pr-1.5 py-1 rounded-full text-xs font-bold bg-[#0D5C35]/10 dark:bg-emerald-900/25 text-[#0D5C35] dark:text-emerald-400 border border-[#0D5C35]/20 dark:border-emerald-700/30">
                                                <Tag className="w-2.5 h-2.5" />{tag}
                                                <button type="button"
                                                    onClick={e => {
                                                        e.stopPropagation();
                                                        const newTags = formData.tagsRaw.split(',').map(t => t.trim()).filter(t => t && t !== tag).join(', ');
                                                        setFormData(p => ({ ...p, tagsRaw: newTags }));
                                                        setIsDirty(true);
                                                    }}
                                                    className="w-4 h-4 rounded-full bg-[#0D5C35]/20 hover:bg-rose-100 hover:text-rose-600 flex items-center justify-center transition-colors ml-0.5">
                                                    <X className="w-2.5 h-2.5" />
                                                </button>
                                            </span>
                                        ))}
                                        <input
                                            id="tag-chip-input"
                                            type="text"
                                            placeholder={formData.tagsRaw ? '' : 'Ketik tag lalu tekan Enter…'}
                                            className="flex-1 min-w-[140px] bg-transparent outline-none text-sm text-slate-700 dark:text-slate-200 placeholder:text-slate-400 font-medium py-0.5"
                                            value={tagInput}
                                            onChange={e => setTagInput(e.target.value.replace(',', ''))}
                                            onKeyDown={e => {
                                                if ((e.key === 'Enter' || e.key === ',') && tagInput.trim()) {
                                                    e.preventDefault();
                                                    const newTag = tagInput.trim();
                                                    const existing = formData.tagsRaw.split(',').map(t => t.trim()).filter(Boolean);
                                                    if (!existing.includes(newTag)) {
                                                        setFormData(p => ({ ...p, tagsRaw: [...existing, newTag].join(', ') }));
                                                        setIsDirty(true);
                                                    }
                                                    setTagInput('');
                                                }
                                                if (e.key === 'Backspace' && !tagInput) {
                                                    const tags = formData.tagsRaw.split(',').map(t => t.trim()).filter(Boolean);
                                                    if (tags.length > 0) {
                                                        setFormData(p => ({ ...p, tagsRaw: tags.slice(0, -1).join(', ') }));
                                                        setIsDirty(true);
                                                    }
                                                }
                                            }}
                                        />
                                    </div>
                                    <p className="text-[10px] text-slate-400 dark:text-slate-500">Tekan <kbd className="px-1 py-0.5 bg-slate-100 dark:bg-slate-700 rounded text-[9px] font-bold">Enter</kbd> atau <kbd className="px-1 py-0.5 bg-slate-100 dark:bg-slate-700 rounded text-[9px] font-bold">,</kbd> untuk menambah · <kbd className="px-1 py-0.5 bg-slate-100 dark:bg-slate-700 rounded text-[9px] font-bold">Backspace</kbd> untuk hapus terakhir</p>
                                </div>

                            {/* ── Editor / Preview Tab ── */}
                                <div className="space-y-1.5">
                                    <div className="flex items-center justify-between">
                                        <label className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">Isi Dokumen (Markdown)</label>
                                        <div className="flex items-center gap-2">
                                            {!isSplitView && (
                                                <div className="flex bg-slate-100 dark:bg-slate-700 rounded-lg p-0.5 gap-0.5">
                                                    <button type="button" onClick={() => setSopModalTab('editor')}
                                                        className={`px-3 py-1.5 rounded-md text-xs font-bold transition-all ${sopModalTab === 'editor' ? 'bg-white dark:bg-slate-600 text-slate-800 dark:text-slate-100 shadow-sm' : 'text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-200'}`}>
                                                        ✏️ Editor
                                                    </button>
                                                    <button type="button" onClick={() => setSopModalTab('preview')}
                                                        className={`px-3 py-1.5 rounded-md text-xs font-bold transition-all ${sopModalTab === 'preview' ? 'bg-white dark:bg-slate-600 text-slate-800 dark:text-slate-100 shadow-sm' : 'text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-200'}`}>
                                                        👁 Preview
                                                    </button>
                                                </div>
                                            )}
                                        </div>
                                    </div>

                                    {isSplitView ? (
                                        /* ── Split View: editor + preview side by side ── */
                                        <div className="border border-slate-200 dark:border-slate-600 rounded-xl overflow-hidden shadow-sm">
                                            <FormatToolbar target="sop" onInsert={insertFormat} isSplitView={isSplitView} onToggleSplit={() => setIsSplitView(false)} />
                                            <div className="grid grid-cols-2 divide-x divide-slate-200 dark:divide-slate-600">
                                                <div>
                                                    <div className="px-3 py-1.5 bg-slate-50 dark:bg-slate-800 border-b border-slate-200 dark:border-slate-600 text-[10px] font-bold text-slate-400 uppercase tracking-wider">Editor</div>
                                                    <textarea id="content-editor" rows={16}
                                                        className="w-full p-4 font-mono text-sm outline-none bg-slate-50 dark:bg-[#0f1f16] dark:text-slate-200 resize-none"
                                                        required value={formData.content} onChange={e => { setFormData(p => ({ ...p, content: e.target.value })); setIsDirty(true); }} />
                                                </div>
                                                <div>
                                                    <div className="px-3 py-1.5 bg-slate-50 dark:bg-slate-800 border-b border-slate-200 dark:border-slate-600 text-[10px] font-bold text-slate-400 uppercase tracking-wider">Preview</div>
                                                    <div className="p-4 bg-white dark:bg-[#0f1f16] h-[calc(16*1.5rem+2rem)] overflow-y-auto">
                                                        {formData.content ? (
                                                            <div className="prose prose-sm prose-slate dark:prose-invert max-w-none prose-p:text-slate-600 dark:prose-p:text-slate-300 prose-headings:text-slate-800 dark:prose-headings:text-slate-100 prose-li:marker:text-[#0D5C35]">
                                                                <ReactMarkdown>{formData.content}</ReactMarkdown>
                                                            </div>
                                                        ) : (
                                                            <p className="text-slate-300 dark:text-slate-600 italic text-xs text-center mt-8">Preview tampil di sini…</p>
                                                        )}
                                                    </div>
                                                </div>
                                            </div>
                                        </div>
                                    ) : sopModalTab === 'editor' ? (
                                        <div className="border border-slate-200 dark:border-slate-600 rounded-xl overflow-hidden focus-within:ring-2 focus-within:ring-[#0D5C35] shadow-sm">
                                            <FormatToolbar target="sop" onInsert={insertFormat} isSplitView={isSplitView} onToggleSplit={() => setIsSplitView(true)} />
                                            <textarea id="content-editor" placeholder="Ketik isi SOP di sini…" rows={14}
                                                className="w-full p-5 font-mono text-sm outline-none bg-slate-50 dark:bg-[#0f1f16] dark:text-slate-200 focus:bg-white dark:focus:bg-[#0f1f16] resize-y"
                                                required value={formData.content} onChange={e => { setFormData(p => ({ ...p, content: e.target.value })); setIsDirty(true); }} />
                                        </div>
                                    ) : (
                                        <div className="border border-slate-200 dark:border-slate-600 rounded-xl overflow-hidden min-h-[280px]">
                                            <div className="px-4 py-2.5 bg-slate-50 dark:bg-slate-700 border-b border-slate-200 dark:border-slate-600 flex items-center gap-2">
                                                <Eye className="w-3.5 h-3.5 text-slate-400" />
                                                <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">Preview Markdown</span>
                                            </div>
                                            <div className="p-5 bg-white dark:bg-[#0f1f16]">
                                                {formData.content ? (
                                                    <div className="prose prose-sm prose-slate dark:prose-invert max-w-none prose-p:text-slate-600 dark:prose-p:text-slate-300 prose-headings:text-slate-800 dark:prose-headings:text-slate-100 prose-li:marker:text-[#0D5C35] prose-strong:text-slate-800 dark:prose-strong:text-slate-100">
                                                        <ReactMarkdown>{formData.content}</ReactMarkdown>
                                                    </div>
                                                ) : (
                                                    <p className="text-slate-400 dark:text-slate-500 italic text-sm text-center py-8">Ketik sesuatu di Editor untuk melihat preview…</p>
                                                )}
                                            </div>
                                        </div>
                                    )}
                                    <div className="flex items-center justify-between text-xs text-slate-400 dark:text-slate-500 px-1">
                                        <span><strong className="text-slate-600 dark:text-slate-300">{formData.content.length}</strong> karakter · <strong className="text-slate-600 dark:text-slate-300">{formData.content.split('\n').length}</strong> baris</span>
                                        <span className="flex items-center gap-1"><ClockIcon className="w-3 h-3" /> Dikelola oleh: <strong className="text-slate-600 dark:text-slate-300">{adminDisplay}</strong></span>
                                    </div>
                                </div>
                            </form>
                        </div>

                        {/* Footer */}
                        <div className="flex justify-end gap-3 p-6 md:p-8 pt-4 border-t border-slate-100 dark:border-slate-700 flex-shrink-0">
                            <button type="button" onClick={() => requestClose('sop')}
                                className="px-6 py-3 font-bold text-slate-500 dark:text-slate-300 bg-slate-100 dark:bg-slate-700 hover:bg-slate-200 dark:hover:bg-slate-600 rounded-xl transition-colors">
                                Batal
                            </button>
                            <button type="submit" form="sop-form" disabled={isSaving}
                                className="px-8 py-3 bg-[#0D5C35] hover:bg-[#0A492A] text-white rounded-xl font-bold shadow-lg shadow-emerald-200 transition-all flex items-center gap-2 disabled:opacity-60">
                                {isSaving ? <><RefreshCw className="w-4 h-4 animate-spin" /> Menyimpan…</> : 'Simpan Data'}
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* ── Modal FAQ ── */}
            {isFaqModalOpen && (
                <div className="fixed inset-0 bg-slate-900/60 z-50 flex items-center justify-center p-3 md:p-4 backdrop-blur-sm animate-in fade-in zoom-in-95 duration-200">
                    <div className="bg-white dark:bg-[#162918] rounded-3xl w-full max-w-2xl shadow-2xl flex flex-col max-h-[95vh] md:max-h-[90vh] dark:border dark:border-slate-700">
                        <div className="flex justify-between items-center p-6 md:p-8 pb-4 border-b border-slate-100 dark:border-slate-700 flex-shrink-0">
                            <h3 className="font-black text-xl md:text-2xl text-slate-800 dark:text-slate-100 flex items-center gap-3">
                                <HelpCircle className="w-6 h-6 text-amber-500 flex-shrink-0" />
                                {editingId ? 'Edit FAQ' : 'Tambah FAQ Baru'}
                            </h3>
                            <div className="flex items-center gap-2">
                                {isDirty && <span className="hidden sm:flex items-center gap-1 text-amber-600 dark:text-amber-400 text-xs font-bold bg-amber-50 dark:bg-amber-900/20 px-2.5 py-1.5 rounded-lg border border-amber-200 dark:border-amber-700/30 animate-pulse"><AlertCircle className="w-3 h-3" /> Belum disimpan</span>}
                                <button onClick={() => requestClose('faq')} className="p-2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-700 rounded-full transition-colors"><X className="w-6 h-6" /></button>
                            </div>
                        </div>
                        <div className="overflow-y-auto flex-1 p-6 md:p-8 pt-5">
                            <form id="faq-form" onSubmit={handleSaveFaq} className="space-y-5">
                                <div className="space-y-1.5">
                                    <label className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">Pertanyaan (Q)</label>
                                    <input type="text" placeholder="Masukkan pertanyaan…"
                                        className="w-full p-3.5 border border-slate-200 dark:border-slate-600 dark:bg-[#0f1f16] dark:text-slate-200 rounded-xl focus:ring-2 focus:ring-[#0D5C35] outline-none font-bold text-slate-800 bg-slate-50 focus:bg-white dark:focus:bg-[#0f1f16]"
                                        value={faqForm.question} onChange={e => { setFaqForm(p => ({ ...p, question: e.target.value })); setIsDirty(true); }} required />
                                </div>
                                <div className="space-y-1.5">
                                    <label className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">Jawaban (A)</label>
                                    <div className="border border-slate-200 dark:border-slate-600 rounded-xl overflow-hidden focus-within:ring-2 focus-within:ring-[#0D5C35] shadow-sm">
                                        <FormatToolbar target="faq" onInsert={insertFormat} />
                                        <textarea id="faq-editor" placeholder="Ketik jawaban di sini…" rows={9}
                                            className="w-full p-5 font-mono text-sm outline-none bg-slate-50 dark:bg-[#0f1f16] dark:text-slate-200 focus:bg-white dark:focus:bg-[#0f1f16] resize-y"
                                            value={faqForm.answer} onChange={e => { setFaqForm(p => ({ ...p, answer: e.target.value })); setIsDirty(true); }} required />
                                    </div>
                                    <p className="text-xs text-slate-400 dark:text-slate-500 px-1">
                                        <strong className="text-slate-600 dark:text-slate-300">{faqForm.answer.length}</strong> karakter · <strong className="text-slate-600 dark:text-slate-300">{faqForm.answer.split('\n').length}</strong> baris
                                    </p>
                                </div>
                            </form>
                        </div>
                        <div className="flex justify-end gap-3 p-6 md:p-8 pt-4 border-t border-slate-100 dark:border-slate-700 flex-shrink-0">
                            <button type="button" onClick={() => requestClose('faq')} className="px-6 py-3 font-bold text-slate-500 dark:text-slate-300 bg-slate-100 dark:bg-slate-700 hover:bg-slate-200 dark:hover:bg-slate-600 rounded-xl transition-colors">Batal</button>
                            <button type="submit" form="faq-form" disabled={isSaving} className="px-8 py-3 bg-[#0D5C35] hover:bg-[#0A492A] text-white rounded-xl font-bold shadow-lg shadow-emerald-200 transition-all flex items-center gap-2 disabled:opacity-60">
                                {isSaving ? <><RefreshCw className="w-4 h-4 animate-spin" /> Menyimpan…</> : 'Simpan FAQ'}
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* ── Modal Panduan ── */}
            {isGuideModalOpen && (
                <div className="fixed inset-0 bg-slate-900/60 z-50 flex items-center justify-center p-3 md:p-4 backdrop-blur-sm animate-in fade-in zoom-in-95 duration-200">
                    <div className="bg-white dark:bg-[#162918] rounded-3xl w-full max-w-3xl shadow-2xl flex flex-col max-h-[95vh] md:max-h-[90vh] dark:border dark:border-slate-700">
                        <div className="flex justify-between items-center p-6 md:p-8 pb-4 border-b border-slate-100 dark:border-slate-700 flex-shrink-0">
                            <h3 className="font-black text-xl md:text-2xl text-slate-800 dark:text-slate-100 flex items-center gap-3">
                                <BookOpen className="w-6 h-6 text-blue-500 flex-shrink-0" />
                                {editingId ? 'Edit Panduan' : 'Buat Panduan Pengguna'}
                            </h3>
                            <div className="flex items-center gap-2">
                                {isDirty && <span className="hidden sm:flex items-center gap-1 text-amber-600 dark:text-amber-400 text-xs font-bold bg-amber-50 dark:bg-amber-900/20 px-2.5 py-1.5 rounded-lg border border-amber-200 dark:border-amber-700/30 animate-pulse"><AlertCircle className="w-3 h-3" /> Belum disimpan</span>}
                                <button onClick={() => requestClose('guide')} className="p-2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-700 rounded-full transition-colors"><X className="w-6 h-6" /></button>
                            </div>
                        </div>
                        <div className="overflow-y-auto flex-1 p-6 md:p-8 pt-5">
                            <form id="guide-form" onSubmit={handleSaveGuide} className="space-y-5">
                                <div className="space-y-1.5">
                                    <label className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">Isi Panduan Utama</label>
                                    <p className="text-xs text-slate-400 dark:text-slate-500 leading-relaxed">Tulis panduan lengkap di sini. Gunakan toolbar untuk heading, list, dan kutipan. Mendukung Markdown.</p>
                                    <div className="border border-slate-200 dark:border-slate-600 rounded-xl overflow-hidden focus-within:ring-2 focus-within:ring-[#0D5C35] shadow-sm">
                                        <FormatToolbar target="guide" onInsert={insertFormat} />
                                        <textarea id="guide-editor" placeholder="Contoh:&#10;## Cara Menggunakan Knowledge Base&#10;&#10;### 1. Pencarian Dokumen&#10;- Ketik kata kunci di kolom pencarian&#10;..." rows={18}
                                            className="w-full p-5 font-mono text-sm outline-none bg-slate-50 dark:bg-[#0f1f16] dark:text-slate-200 focus:bg-white dark:focus:bg-[#0f1f16] resize-y"
                                            value={guideForm.content} onChange={e => { setGuideForm({ content: e.target.value }); setIsDirty(true); }} required />
                                    </div>
                                    <div className="flex items-center justify-between text-xs text-slate-400 dark:text-slate-500 px-1">
                                        <span><strong className="text-slate-600 dark:text-slate-300">{guideForm.content.length}</strong> karakter · <strong className="text-slate-600 dark:text-slate-300">{guideForm.content.split('\n').length}</strong> baris</span>
                                        <span className="flex items-center gap-1"><ClockIcon className="w-3 h-3" /> Dikelola oleh: <strong className="text-slate-600 dark:text-slate-300">{adminDisplay}</strong></span>
                                    </div>
                                </div>
                            </form>
                        </div>
                        <div className="flex justify-end gap-3 p-6 md:p-8 pt-4 border-t border-slate-100 dark:border-slate-700 flex-shrink-0">
                            <button type="button" onClick={() => requestClose('guide')} className="px-6 py-3 font-bold text-slate-500 dark:text-slate-300 bg-slate-100 dark:bg-slate-700 hover:bg-slate-200 dark:hover:bg-slate-600 rounded-xl transition-colors">Batal</button>
                            <button type="submit" form="guide-form" disabled={isSaving} className="px-8 py-3 bg-[#0D5C35] hover:bg-[#0A492A] text-white rounded-xl font-bold shadow-lg shadow-emerald-200 transition-all flex items-center gap-2 disabled:opacity-60">
                                {isSaving ? <><RefreshCw className="w-4 h-4 animate-spin" /> Menyimpan…</> : 'Simpan Panduan'}
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default AdminDashboard;