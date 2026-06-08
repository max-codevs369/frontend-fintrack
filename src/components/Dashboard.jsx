import React, { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import {
  faWallet, faRightFromBracket, faArrowTrendUp, faArrowTrendDown,
  faPlus, faXmark, faBoxOpen, faTriangleExclamation, faCircleNotch,
  faScaleBalanced, faCheckCircle, faMagnifyingGlass, faChevronDown,
  faFileExport, faChartPie, faBullseye, faCreditCard, faTrash,
  faPencil, faCheck, faCoins, faBuildingColumns, faMoneyBillWave,
  faBars, faFileImport, faCloudArrowUp, faTableCells,
  faHouse, faBell, faUser, faFilter, faArrowRight,
  faAngleLeft, faRotateLeft, faInfo, faCircleInfo
} from '@fortawesome/free-solid-svg-icons';
import {
  PieChart, Pie, Cell, Tooltip, ResponsiveContainer,
  BarChart, Bar, XAxis, YAxis, CartesianGrid
} from 'recharts';

const API = 'https://shifty-carey-pentahydroxy.ngrok-free.dev';

function formatRupiah(num) {
  return new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', minimumFractionDigits: 0 }).format(num ?? 0);
}
function formatTanggal(dateStr) {
  return new Date(dateStr).toLocaleDateString('id-ID', { day: '2-digit', month: 'short', year: 'numeric' });
}
function parseNominal(str) {
  if (!str) return 0;
  const cleaned = str.replace(/[Rp\s.]/g, '').replace(',', '.');
  return parseFloat(cleaned) || 0;
}

const KATEGORI = {
  pemasukan: ['Gaji', 'Freelance', 'Investasi', 'Bonus', 'Lainnya'],
  pengeluaran: ['Makanan', 'Minuman', 'Transportasi', 'Belanja', 'Tagihan', 'Kesehatan', 'Hiburan', 'Lainnya'],
};
const CHART_COLORS = ['#10b981','#6366f1','#f59e0b','#f43f5e','#8b5cf6','#0ea5e9','#ec4899','#14b8a6'];
const WALLET_ICONS = { cash: faMoneyBillWave, bank: faBuildingColumns, ewallet: faCoins, card: faCreditCard };
const DEFAULT_WALLETS = [
  { id: 'w1', name: 'Dompet Tunai', type: 'cash', color: '#10b981', balance: 0 },
  { id: 'w2', name: 'Bank BCA', type: 'bank', color: '#6366f1', balance: 0 },
];

const IMPORT_TEMPLATES = [
  {
    id: 'bca', name: 'BCA', color: '#003f7f', logo: '🏦',
    hint: 'Export mutasi dari m-BCA / KlikBCA → Format CSV',
    columns: { date: 'Tanggal', description: 'Keterangan', debit: 'Debet', credit: 'Kredit' },
    dateFormat: 'DD/MM/YYYY',
    example: `Tanggal,Keterangan,Debet,Kredit\n01/06/2025,TRANSFER GAJI PT ABC,,5000000\n03/06/2025,TOKOPEDIA PAYMENT,250000,\n05/06/2025,GRAB FOOD,85000,`
  },
  {
    id: 'mandiri', name: 'Mandiri', color: '#003087', logo: '🏛️',
    hint: 'Export mutasi dari Livin by Mandiri → Format Excel/CSV',
    columns: { date: 'Tanggal Transaksi', description: 'Deskripsi', debit: 'Debit', credit: 'Kredit' },
    dateFormat: 'DD/MM/YYYY',
    example: `Tanggal Transaksi,Deskripsi,Debit,Kredit\n01/06/2025,GAJI JUNI 2025,,8000000\n02/06/2025,LISTRIK PLN,300000,`
  },
  {
    id: 'gopay', name: 'GoPay', color: '#00AA13', logo: '💚',
    hint: 'Export riwayat dari GoPay → Fitur Export (akun verified)',
    columns: { date: 'Tanggal', description: 'Keterangan', debit: 'Keluar', credit: 'Masuk' },
    dateFormat: 'DD MMM YYYY',
    example: `Tanggal,Keterangan,Keluar,Masuk\n01 Jun 2025,Top Up GoPay,,200000\n02 Jun 2025,GoFood - Ayam Geprek,35000,`
  },
  {
    id: 'dana', name: 'DANA', color: '#118EEA', logo: '💙',
    hint: 'Export riwayat dari DANA → Menu Riwayat → Export',
    columns: { date: 'Tanggal', description: 'Keterangan', debit: 'Pengeluaran', credit: 'Pemasukan' },
    dateFormat: 'DD/MM/YYYY HH:mm',
    example: `Tanggal,Keterangan,Pengeluaran,Pemasukan\n01/06/2025 08:00,Top Up DANA,,100000\n02/06/2025 12:30,Pembayaran Shopee,150000,`
  },
  {
    id: 'ovo', name: 'OVO', color: '#4C2A86', logo: '💜',
    hint: 'Export dari OVO → Riwayat → Download Statement',
    columns: { date: 'Date', description: 'Description', debit: 'Amount Out', credit: 'Amount In' },
    dateFormat: 'DD/MM/YYYY',
    example: `Date,Description,Amount Out,Amount In\n01/06/2025,Top Up OVO,,300000\n03/06/2025,OVO Payment Indomaret,50000,`
  },
  {
    id: 'custom', name: 'Format Lain', color: '#64748b', logo: '📄',
    hint: 'Upload CSV dengan format kolom bebas — kamu mapping manual',
    columns: { date: '', description: '', debit: '', credit: '' },
    dateFormat: '',
    example: ''
  },
];

function parseCSV(text) {
  const lines = text.trim().split('\n').filter(l => l.trim());
  if (lines.length < 2) return { headers: [], rows: [] };
  const parseRow = (line) => {
    const result = [];
    let cur = '', inQ = false;
    for (let i = 0; i < line.length; i++) {
      const ch = line[i];
      if (ch === '"') { inQ = !inQ; continue; }
      if (ch === ',' && !inQ) { result.push(cur.trim()); cur = ''; continue; }
      cur += ch;
    }
    result.push(cur.trim());
    return result;
  };
  const headers = parseRow(lines[0]);
  const rows = lines.slice(1).map(l => {
    const vals = parseRow(l);
    const obj = {};
    headers.forEach((h, i) => { obj[h] = vals[i] || ''; });
    return obj;
  });
  return { headers, rows };
}

function parseDate(str) {
  if (!str) return null;
  const datePart = str.split(' ')[0];
  const dmy = datePart.match(/^(\d{1,2})[\/\-](\d{1,2})[\/\-](\d{4})$/);
  if (dmy) return `${dmy[3]}-${dmy[2].padStart(2,'0')}-${dmy[1].padStart(2,'0')}`;
  const ymd = datePart.match(/^(\d{4})-(\d{2})-(\d{2})$/);
  if (ymd) return datePart;
  const months = { jan:'01',feb:'02',mar:'03',apr:'04',mei:'05',may:'05',jun:'06',jul:'07',agu:'08',aug:'08',sep:'09',okt:'10',oct:'10',nov:'11',des:'12',dec:'12' };
  const dmy2 = str.match(/^(\d{1,2})\s+([A-Za-z]+)\s+(\d{4})/);
  if (dmy2) {
    const m = months[dmy2[2].toLowerCase().slice(0,3)];
    if (m) return `${dmy2[3]}-${m}-${dmy2[1].padStart(2,'0')}`;
  }
  const d = new Date(str);
  if (!isNaN(d)) return d.toISOString().split('T')[0];
  return null;
}

const TABS = [
  { id: 'dashboard', label: 'Beranda', icon: faHouse },
  { id: 'chart',     label: 'Grafik',  icon: faChartPie },
  { id: 'budget',    label: 'Anggaran',icon: faBullseye },
  { id: 'wallets',   label: 'Dompet',  icon: faWallet },
  { id: 'import',    label: 'Import',  icon: faFileImport },
];

const CustomTooltip = ({ active, payload }) => {
  if (!active || !payload?.length) return null;
  return (
    <div className="bg-white border border-slate-100 rounded-2xl shadow-xl px-4 py-3 text-sm">
      <p className="font-bold text-slate-700">{payload[0].name}</p>
      <p className="font-black text-emerald-600 mt-0.5">{formatRupiah(payload[0].value)}</p>
    </div>
  );
};

export default function Dashboard() {
  const navigate = useNavigate();

  const [transactions, setTransactions] = useState([]);
  const [loading, setLoading] = useState(true);

  const [activeTab, setActiveTab] = useState('dashboard');
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [errorModal, setErrorModal] = useState({ show: false, message: '' });
  const [successToast, setSuccessToast] = useState({ show: false, message: '' });
  const [showModal, setShowModal] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [filterType, setFilterType] = useState('semua');
  const [searchTerm, setSearchTerm] = useState('');
  const [filterMonth, setFilterMonth] = useState('');
  const [deleteTarget, setDeleteTarget] = useState(null);

  const [form, setForm] = useState({
    type: 'pemasukan', category: 'Gaji', description: '',
    amount: '', date: new Date().toISOString().split('T')[0], wallet_id: 'w1',
  });

  const [wallets, setWallets] = useState(() => {
    try { return JSON.parse(localStorage.getItem('ft_wallets')) || DEFAULT_WALLETS; } catch { return DEFAULT_WALLETS; }
  });
  const [showWalletModal, setShowWalletModal] = useState(false);
  const [walletForm, setWalletForm] = useState({ name: '', type: 'cash', color: '#10b981', balance: '' });
  const [editingWallet, setEditingWallet] = useState(null);

  const [budgets, setBudgets] = useState(() => {
    try { return JSON.parse(localStorage.getItem('ft_budgets')) || []; } catch { return []; }
  });
  const [showBudgetModal, setShowBudgetModal] = useState(false);
  const [budgetForm, setBudgetForm] = useState({ category: 'Makanan', limit: '' });

  const [importStep, setImportStep] = useState(1); 
  const [importBank, setImportBank] = useState(null);
  const [importFile, setImportFile] = useState(null);
  const [importCSV, setImportCSV] = useState({ headers: [], rows: [] });
  const [importMapping, setImportMapping] = useState({ date: '', description: '', debit: '', credit: '' });
  const [importPreview, setImportPreview] = useState([]);
  const [importWalletId, setImportWalletId] = useState('');
  const [importLoading, setImportLoading] = useState(false);
  const fileInputRef = useRef(null);

  const token = localStorage.getItem('token');
  const authHeaders = useMemo(() => ({
    'Content-Type': 'application/json',
    'Authorization': `Bearer ${token}`,
    'ngrok-skip-browser-warning': '17317',
  }), [token]);

  const showError = (msg) => setErrorModal({ show: true, message: msg });
  const showSuccess = (msg) => {
    setSuccessToast({ show: true, message: msg });
    setTimeout(() => setSuccessToast({ show: false, message: '' }), 2800);
  };

  const handleLogout = useCallback(() => {
    localStorage.removeItem('token');
    navigate('/login', { replace: true });
  }, [navigate]);

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const [txRes] = await Promise.all([
        fetch(`${API}/transactions`, { headers: authHeaders }),
      ]);
      if (txRes.status === 401) { handleLogout(); return; }
      const txData = await txRes.json();
      setTransactions(txData.transactions || []);
    } catch {
      showError('Gagal memuat data. Periksa koneksi Anda.');
    } finally {
      setLoading(false);
    }
  }, [authHeaders, handleLogout]);

  useEffect(() => { fetchData(); }, [fetchData]);
  useEffect(() => { localStorage.setItem('ft_wallets', JSON.stringify(wallets)); }, [wallets]);
  useEffect(() => { localStorage.setItem('ft_budgets', JSON.stringify(budgets)); }, [budgets]);

  useEffect(() => {
    const fn = (e) => {
      if (sidebarOpen && !e.target.closest('#sidebar') && !e.target.closest('#hamburger')) {
        setSidebarOpen(false);
      }
    };
    document.addEventListener('mousedown', fn);
    return () => document.removeEventListener('mousedown', fn);
  }, [sidebarOpen]);

  const filteredTx = useMemo(() => transactions.filter(t => {
    const matchType = filterType === 'semua' || t.type === filterType;
    const kw = searchTerm.toLowerCase();
    const matchSearch = !kw || t.description?.toLowerCase().includes(kw) || t.category?.toLowerCase().includes(kw);
    const matchMonth = !filterMonth || t.date.startsWith(filterMonth);
    return matchType && matchSearch && matchMonth;
  }), [transactions, filterType, searchTerm, filterMonth]);

  const dynamicPemasukan = useMemo(() => filteredTx.filter(t => t.type === 'pemasukan').reduce((s, t) => s + t.amount, 0), [filteredTx]);
  const dynamicPengeluaran = useMemo(() => filteredTx.filter(t => t.type === 'pengeluaran').reduce((s, t) => s + t.amount, 0), [filteredTx]);
  const dynamicSaldo = dynamicPemasukan - dynamicPengeluaran;
  const isFiltered = filterType !== 'semua' || searchTerm || filterMonth;

  const pengeluaranByKat = useMemo(() => {
    const map = {};
    filteredTx.filter(t => t.type === 'pengeluaran').forEach(t => { map[t.category] = (map[t.category] || 0) + t.amount; });
    return Object.entries(map).map(([name, value]) => ({ name, value })).sort((a, b) => b.value - a.value);
  }, [filteredTx]);

  const pemasukanByKat = useMemo(() => {
    const map = {};
    filteredTx.filter(t => t.type === 'pemasukan').forEach(t => { map[t.category] = (map[t.category] || 0) + t.amount; });
    return Object.entries(map).map(([name, value]) => ({ name, value })).sort((a, b) => b.value - a.value);
  }, [filteredTx]);

  const monthlyTrend = useMemo(() => {
    return Array.from({ length: 6 }, (_, i) => {
      const d = new Date(); d.setMonth(d.getMonth() - (5 - i));
      const key = d.toISOString().slice(0, 7);
      const label = d.toLocaleDateString('id-ID', { month: 'short', year: '2-digit' });
      const pemasukan = transactions.filter(t => t.type === 'pemasukan' && t.date.startsWith(key)).reduce((s, t) => s + t.amount, 0);
      const pengeluaran = transactions.filter(t => t.type === 'pengeluaran' && t.date.startsWith(key)).reduce((s, t) => s + t.amount, 0);
      return { label, pemasukan, pengeluaran };
    });
  }, [transactions]);

  const budgetProgress = useMemo(() => {
    const curMonth = new Date().toISOString().slice(0, 7);
    return budgets.map(b => {
      const spent = transactions.filter(t => t.type === 'pengeluaran' && t.category === b.category && t.date.startsWith(curMonth)).reduce((s, t) => s + t.amount, 0);
      const pct = Math.min((spent / b.limit) * 100, 100);
      return { ...b, spent, pct, over: spent > b.limit, warn: !spent > b.limit && pct >= 80 };
    });
  }, [budgets, transactions]);

  const walletBalances = useMemo(() => wallets.map(w => {
    const income = transactions.filter(t => t.wallet_id === w.id && t.type === 'pemasukan').reduce((s, t) => s + t.amount, 0);
    const expense = transactions.filter(t => t.wallet_id === w.id && t.type === 'pengeluaran').reduce((s, t) => s + t.amount, 0);
    return { ...w, balance: (parseFloat(w.balance) || 0) + income - expense };
  }), [wallets, transactions]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.amount || parseFloat(form.amount) <= 0) return;
    setSubmitting(true);
    try {
      const res = await fetch(`${API}/transactions`, {
        method: 'POST', headers: authHeaders,
        body: JSON.stringify({ ...form, amount: parseFloat(form.amount) }),
      });
      if (!res.ok) throw new Error();
      setShowModal(false);
      setForm({ type: 'pemasukan', category: 'Gaji', description: '', amount: '', date: new Date().toISOString().split('T')[0], wallet_id: wallets[0]?.id || 'w1' });
      fetchData();
      showSuccess('Transaksi berhasil dicatat!');
    } catch { showError('Gagal menambah transaksi.'); }
    finally { setSubmitting(false); }
  };

  const executeDelete = async () => {
    if (!deleteTarget) return;
    try {
      await fetch(`${API}/transactions/${deleteTarget}`, { method: 'DELETE', headers: authHeaders });
      fetchData(); showSuccess('Transaksi dihapus.');
    } catch { showError('Gagal menghapus.'); }
    finally { setDeleteTarget(null); }
  };

  const handleSaveWallet = () => {
    if (!walletForm.name.trim()) return;
    if (editingWallet) {
      setWallets(prev => prev.map(w => w.id === editingWallet ? { ...w, ...walletForm, balance: parseFloat(walletForm.balance) || 0 } : w));
      showSuccess('Dompet diperbarui!');
    } else {
      setWallets(prev => [...prev, { id: `w${Date.now()}`, ...walletForm, balance: parseFloat(walletForm.balance) || 0 }]);
      showSuccess('Dompet ditambahkan!');
    }
    setShowWalletModal(false); setEditingWallet(null);
    setWalletForm({ name: '', type: 'cash', color: '#10b981', balance: '' });
  };

  const handleSaveBudget = () => {
    if (!budgetForm.limit || parseFloat(budgetForm.limit) <= 0) return;
    const idx = budgets.findIndex(b => b.category === budgetForm.category);
    if (idx >= 0) setBudgets(prev => prev.map((b, i) => i === idx ? { ...b, limit: parseFloat(budgetForm.limit) } : b));
    else setBudgets(prev => [...prev, { ...budgetForm, limit: parseFloat(budgetForm.limit) }]);
    setShowBudgetModal(false);
    showSuccess('Anggaran disimpan!');
  };

  const handleExport = () => {
    if (!filteredTx.length) { showError('Tidak ada data untuk diekspor.'); return; }
    const rows = filteredTx.map((tx, i) => {
      const inc = tx.type === 'pemasukan';
      return `<tr style="background:${i%2===0?'#fff':'#f8fafc'}"><td style="border:1px solid #e2e8f0;padding:10px 14px;font-size:12px">${new Date(tx.date).toISOString().split('T')[0]}</td><td style="border:1px solid #e2e8f0;padding:10px 14px;text-align:center"><span style="background:${inc?'#d1fae5':'#ffe4e6'};color:${inc?'#065f46':'#9f1239'};font-weight:700;font-size:11px;padding:3px 10px;border-radius:20px">${inc?'PEMASUKAN':'PENGELUARAN'}</span></td><td style="border:1px solid #e2e8f0;padding:10px 14px;font-size:12px">${tx.category}</td><td style="border:1px solid #e2e8f0;padding:10px 14px;font-size:12px">${tx.description||'-'}</td><td style="border:1px solid #e2e8f0;padding:10px 14px;text-align:right;font-weight:700;color:${inc?'#059669':'#e11d48'};font-size:12px">${inc?'+':'-'}${new Intl.NumberFormat('id-ID').format(tx.amount)}</td></tr>`;
    }).join('');
    const html = `<html xmlns:o="urn:schemas-microsoft-com:office:office" xmlns:x="urn:schemas-microsoft-com:office:excel"><head><meta charset="utf-8"></head><body><table><tr><td colspan="5" style="text-align:center;font-size:20pt;font-weight:900;padding:20px 0 4px">FinTrack</td></tr><tr><td colspan="5" style="text-align:center;font-size:13pt;font-weight:700">Laporan Keuangan</td></tr><tr><th style="background:#0f172a;color:#fff;padding:12px 14px;border:1px solid #1e293b;font-size:11px">Tanggal</th><th style="background:#0f172a;color:#fff;padding:12px 14px;border:1px solid #1e293b;font-size:11px">Jenis</th><th style="background:#0f172a;color:#fff;padding:12px 14px;border:1px solid #1e293b;font-size:11px">Kategori</th><th style="background:#0f172a;color:#fff;padding:12px 14px;border:1px solid #1e293b;font-size:11px">Deskripsi</th><th style="background:#0f172a;color:#fff;padding:12px 14px;border:1px solid #1e293b;font-size:11px">Nominal</th></tr>${rows}<tr><td colspan="4" style="border:1px solid #e2e8f0;padding:12px;text-align:right;font-weight:700;background:#f8fafc">SALDO</td><td style="border:1px solid #e2e8f0;padding:12px;text-align:right;font-weight:900;background:#f8fafc;color:${dynamicSaldo>=0?'#059669':'#e11d48'}">${dynamicSaldo>=0?'+':'-'}Rp ${new Intl.NumberFormat('id-ID').format(Math.abs(dynamicSaldo))}</td></tr></table></body></html>`;
    const blob = new Blob([html], { type: 'application/vnd.ms-excel;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a'); a.href = url;
    a.download = `Laporan_FinTrack_${new Date().toISOString().split('T')[0]}.xls`;
    document.body.appendChild(a); a.click(); document.body.removeChild(a);
    showSuccess('Laporan diunduh!');
  };

  const handleFileUpload = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    setImportFile(file);
    const reader = new FileReader();
    reader.onload = (ev) => {
      const text = ev.target.result;
      const parsed = parseCSV(text);
      setImportCSV(parsed);
      if (importBank && importBank.id !== 'custom') {
        const tmpl = importBank.columns;
        setImportMapping({
          date: parsed.headers.find(h => h === tmpl.date) || parsed.headers[0] || '',
          description: parsed.headers.find(h => h === tmpl.description) || parsed.headers[1] || '',
          debit: parsed.headers.find(h => h === tmpl.debit) || '',
          credit: parsed.headers.find(h => h === tmpl.credit) || '',
        });
      } else {
        setImportMapping({ date: parsed.headers[0]||'', description: parsed.headers[1]||'', debit: parsed.headers[2]||'', credit: parsed.headers[3]||'' });
      }
      setImportStep(3);
    };
    reader.readAsText(file, 'UTF-8');
  };

  const handleBuildPreview = () => {
    if (!importMapping.date || !importMapping.description) {
      showError('Pilih kolom Tanggal dan Keterangan minimal.'); return;
    }
    const preview = importCSV.rows
      .map((row, i) => {
        const dateStr = row[importMapping.date] || '';
        const desc = row[importMapping.description] || '';
        const debitRaw = importMapping.debit ? row[importMapping.debit] || '' : '';
        const creditRaw = importMapping.credit ? row[importMapping.credit] || '' : '';
        const debit = parseNominal(debitRaw);
        const credit = parseNominal(creditRaw);
        const parsedDate = parseDate(dateStr);
        if (!parsedDate) return null;
        if (debit <= 0 && credit <= 0) return null;
        return {
          _idx: i,
          date: parsedDate,
          description: desc,
          amount: debit > 0 ? debit : credit,
          type: debit > 0 ? 'pengeluaran' : 'pemasukan',
          category: debit > 0 ? 'Lainnya' : 'Lainnya',
          wallet_id: importWalletId || wallets[0]?.id || 'w1',
          selected: true,
        };
      })
      .filter(Boolean);
    setImportPreview(preview);
    setImportStep(4);
  };

  const handleImportSubmit = async () => {
    const selected = importPreview.filter(r => r.selected);
    if (!selected.length) { showError('Tidak ada transaksi dipilih.'); return; }
    setImportLoading(true);
    let success = 0, fail = 0;
    for (const row of selected) {
      try {
        const res = await fetch(`${API}/transactions`, {
          method: 'POST', headers: authHeaders,
          body: JSON.stringify({ type: row.type, category: row.category, description: row.description, amount: row.amount, date: row.date, wallet_id: row.wallet_id }),
        });
        if (res.ok) success++; else fail++;
      } catch { fail++; }
    }
    setImportLoading(false);
    fetchData();
    setImportStep(5);
    showSuccess(`${success} transaksi berhasil diimpor!`);
  };

  const resetImport = () => {
    setImportStep(1); setImportBank(null); setImportFile(null);
    setImportCSV({ headers: [], rows: [] });
    setImportMapping({ date: '', description: '', debit: '', credit: '' });
    setImportPreview([]); setImportWalletId('');
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const navigateTo = (tab) => {
    setActiveTab(tab);
    setSidebarOpen(false);
  };


  const SummaryCards = () => (
    <div className="grid grid-cols-3 gap-3 sm:gap-4">
      <div className="bg-gradient-to-br from-emerald-500 to-teal-600 text-white p-4 sm:p-5 rounded-2xl shadow-lg shadow-emerald-500/20 overflow-hidden relative group cursor-default">
        <div className="absolute -right-3 -bottom-3 text-7xl opacity-[0.07]"><FontAwesomeIcon icon={faArrowTrendUp} /></div>
        <p className="text-[10px] sm:text-xs font-bold opacity-75 uppercase tracking-widest mb-2">Pemasukan</p>
        <h3 className="text-sm sm:text-xl font-black leading-tight">
          {loading ? <FontAwesomeIcon icon={faCircleNotch} spin /> : formatRupiah(dynamicPemasukan)}
        </h3>
        {isFiltered && !loading && <p className="text-[10px] opacity-60 mt-1 font-medium hidden sm:block">dari filter</p>}
      </div>
      <div className="bg-gradient-to-br from-rose-500 to-pink-600 text-white p-4 sm:p-5 rounded-2xl shadow-lg shadow-rose-500/20 overflow-hidden relative group cursor-default">
        <div className="absolute -right-3 -bottom-3 text-7xl opacity-[0.07]"><FontAwesomeIcon icon={faArrowTrendDown} /></div>
        <p className="text-[10px] sm:text-xs font-bold opacity-75 uppercase tracking-widest mb-2">Pengeluaran</p>
        <h3 className="text-sm sm:text-xl font-black leading-tight">
          {loading ? <FontAwesomeIcon icon={faCircleNotch} spin /> : formatRupiah(dynamicPengeluaran)}
        </h3>
      </div>
      <div className={`text-white p-4 sm:p-5 rounded-2xl shadow-lg overflow-hidden relative cursor-default transition-all duration-500 ${dynamicSaldo >= 0 ? 'bg-gradient-to-br from-indigo-600 to-blue-700 shadow-indigo-500/20' : 'bg-gradient-to-br from-orange-500 to-red-600 shadow-orange-500/20'}`}>
        <div className="absolute -right-3 -bottom-3 text-7xl opacity-[0.07]"><FontAwesomeIcon icon={faScaleBalanced} /></div>
        <p className="text-[10px] sm:text-xs font-bold opacity-75 uppercase tracking-widest mb-2">{isFiltered ? 'Selisih' : 'Saldo'}</p>
        <h3 className="text-sm sm:text-xl font-black leading-tight">
          {loading ? <FontAwesomeIcon icon={faCircleNotch} spin /> : formatRupiah(dynamicSaldo)}
        </h3>
      </div>
    </div>
  );

  const renderDashboard = () => (
    <div className="space-y-5">
      <div className="grid grid-cols-4 gap-2 sm:gap-3">
        {[
          { label: 'Catat', icon: faPlus, color: 'bg-emerald-500', action: () => setShowModal(true) },
          { label: 'Import', icon: faFileImport, color: 'bg-indigo-500', action: () => navigateTo('import') },
          { label: 'Grafik', icon: faChartPie, color: 'bg-amber-500', action: () => navigateTo('chart') },
          { label: 'Ekspor', icon: faFileExport, color: 'bg-slate-600', action: handleExport },
        ].map(a => (
          <button key={a.label} onClick={a.action}
            className="flex flex-col items-center gap-2 py-4 bg-white rounded-2xl border-2 border-slate-100 hover:border-slate-200 shadow-sm hover:shadow-md transition-all active:scale-95">
            <div className={`h-10 w-10 ${a.color} rounded-xl flex items-center justify-center text-white text-sm shadow-md`}>
              <FontAwesomeIcon icon={a.icon} />
            </div>
            <span className="text-[11px] font-bold text-slate-600">{a.label}</span>
          </button>
        ))}
      </div>

      {walletBalances.length > 0 && (
        <div>
          <div className="flex items-center justify-between mb-2.5">
            <h3 className="text-sm font-extrabold text-slate-800">Dompet Saya</h3>
            <button onClick={() => navigateTo('wallets')} className="text-xs font-bold text-emerald-600 flex items-center gap-1">
              Lihat semua <FontAwesomeIcon icon={faArrowRight} className="text-[10px]" />
            </button>
          </div>
          <div className="flex gap-3 overflow-x-auto pb-1 scrollbar-hide">
            {walletBalances.map(w => (
              <div key={w.id} className="flex-shrink-0 flex items-center gap-3 bg-white border-2 border-slate-100 rounded-2xl px-4 py-3 min-w-[160px]">
                <div className="h-9 w-9 rounded-xl flex items-center justify-center text-white text-sm flex-shrink-0 shadow-md" style={{ background: w.color }}>
                  <FontAwesomeIcon icon={WALLET_ICONS[w.type] || faWallet} />
                </div>
                <div className="min-w-0">
                  <p className="text-xs font-bold text-slate-800 truncate">{w.name}</p>
                  <p className={`text-sm font-black ${w.balance >= 0 ? 'text-slate-900' : 'text-rose-600'}`}>{formatRupiah(w.balance)}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <h2 className="text-sm font-extrabold text-slate-900">Riwayat Transaksi</h2>
          {!loading && (
            <span className="text-xs text-slate-400 font-medium">{filteredTx.length} transaksi</span>
          )}
        </div>

        <div className="flex gap-2 overflow-x-auto scrollbar-hide pb-0.5">
          {['semua','pemasukan','pengeluaran'].map(f => (
            <button key={f} onClick={() => setFilterType(f)}
              className={`flex-shrink-0 px-4 py-1.5 rounded-xl text-xs font-bold transition-all capitalize ${filterType === f ? 'bg-slate-900 text-white' : 'bg-white border-2 border-slate-200 text-slate-500 hover:border-slate-300'}`}>
              {f === 'semua' ? 'Semua' : f === 'pemasukan' ? 'Pemasukan' : 'Pengeluaran'}
            </button>
          ))}
          <input type="month" value={filterMonth} onChange={e => setFilterMonth(e.target.value)}
            className="flex-shrink-0 h-8 px-3 bg-white border-2 border-slate-200 rounded-xl text-xs font-medium text-slate-700 focus:outline-none focus:border-emerald-400 transition-all cursor-pointer" />
          {filterMonth && (
            <button onClick={() => setFilterMonth('')}
              className="flex-shrink-0 h-8 px-3 bg-rose-50 border-2 border-rose-200 text-rose-600 text-xs font-bold rounded-xl">Reset</button>
          )}
        </div>

        <div className="relative">
          <FontAwesomeIcon icon={faMagnifyingGlass} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 text-xs" />
          <input type="text" placeholder="Cari transaksi..." value={searchTerm} onChange={e => setSearchTerm(e.target.value)}
            className="w-full h-10 pl-9 pr-8 bg-white border-2 border-slate-200 rounded-xl text-xs font-medium focus:outline-none focus:border-emerald-400 focus:ring-4 focus:ring-emerald-500/10 transition-all placeholder:text-slate-400" />
          {searchTerm && (
            <button onClick={() => setSearchTerm('')} className="absolute right-3 top-1/2 -translate-y-1/2 h-5 w-5 bg-slate-100 rounded-md flex items-center justify-center text-slate-400">
              <FontAwesomeIcon icon={faXmark} className="text-xs" />
            </button>
          )}
        </div>

        {loading ? (
          <div className="py-16 flex flex-col items-center gap-3">
            <FontAwesomeIcon icon={faCircleNotch} spin className="text-2xl text-emerald-500" />
            <p className="text-xs font-bold text-slate-500">Memuat data...</p>
          </div>
        ) : filteredTx.length === 0 ? (
          <div className="py-16 flex flex-col items-center bg-white rounded-2xl border-2 border-dashed border-slate-200">
            <FontAwesomeIcon icon={searchTerm ? faMagnifyingGlass : faBoxOpen} className="text-3xl text-slate-300 mb-3" />
            <p className="text-sm font-bold text-slate-600">{searchTerm ? 'Tidak ditemukan' : 'Belum ada transaksi'}</p>
            <p className="text-xs mt-1 text-slate-400">{searchTerm ? `"${searchTerm}"` : 'Mulai catat hari ini!'}</p>
          </div>
        ) : (
          <div className="grid gap-2">
            {filteredTx.map(tx => {
              const wallet = wallets.find(w => w.id === tx.wallet_id);
              return (
                <div key={tx.id} className="flex items-center gap-3 px-4 py-3.5 bg-white rounded-2xl border-2 border-slate-100 hover:border-slate-200 transition-all group shadow-sm">
                  <div className={`h-10 w-10 rounded-xl flex items-center justify-center text-sm flex-shrink-0 ${tx.type === 'pemasukan' ? 'bg-emerald-50 text-emerald-600' : 'bg-rose-50 text-rose-600'}`}>
                    <FontAwesomeIcon icon={tx.type === 'pemasukan' ? faArrowTrendUp : faArrowTrendDown} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-bold text-slate-900 truncate">{tx.description || tx.category}</p>
                    <div className="flex items-center gap-1.5 mt-0.5 flex-wrap">
                      <span className={`text-[10px] font-bold px-2 py-0.5 rounded-md ${tx.type === 'pemasukan' ? 'bg-emerald-50 text-emerald-600' : 'bg-rose-50 text-rose-600'}`}>{tx.category}</span>
                      {wallet && <span className="text-[10px] font-semibold px-2 py-0.5 rounded-md bg-slate-100 text-slate-500 flex items-center gap-1"><FontAwesomeIcon icon={WALLET_ICONS[wallet.type] || faWallet} className="text-[8px]" />{wallet.name}</span>}
                      <span className="text-[10px] text-slate-400">{formatTanggal(tx.date)}</span>
                    </div>
                  </div>
                  <div className="flex flex-col items-end gap-1">
                    <p className={`text-sm font-black ${tx.type === 'pemasukan' ? 'text-emerald-600' : 'text-rose-600'}`}>
                      {tx.type === 'pemasukan' ? '+' : '-'}{formatRupiah(tx.amount)}
                    </p>
                    <button onClick={() => setDeleteTarget(tx.id)}
                      className="text-[10px] font-bold text-slate-300 hover:text-rose-500 transition-all opacity-100 md:opacity-0 md:group-hover:opacity-100 px-2 py-0.5 rounded-lg hover:bg-rose-50">
                      Hapus
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );

  const renderChart = () => (
    <div className="space-y-5">
      <h2 className="text-base font-extrabold text-slate-900">Grafik Keuangan</h2>
      <div className="bg-white rounded-2xl border-2 border-slate-100 p-5">
        <h3 className="text-xs font-extrabold text-slate-600 uppercase tracking-wider mb-4">Tren 6 Bulan</h3>
        {transactions.length === 0 ? (
          <div className="h-40 flex items-center justify-center text-slate-400 text-xs">Belum ada data</div>
        ) : (
          <ResponsiveContainer width="100%" height={200}>
            <BarChart data={monthlyTrend} barCategoryGap="30%" barGap={4}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" vertical={false} />
              <XAxis dataKey="label" tick={{ fontSize: 10, fill: '#94a3b8', fontWeight: 600 }} axisLine={false} tickLine={false} />
              <YAxis tickFormatter={v => `${(v/1e6).toFixed(1)}M`} tick={{ fontSize: 9, fill: '#94a3b8' }} axisLine={false} tickLine={false} width={36} />
              <Tooltip content={<CustomTooltip />} cursor={{ fill: '#f8fafc', radius: 6 }} />
              <Bar dataKey="pemasukan" name="Pemasukan" fill="#10b981" radius={[5,5,0,0]} />
              <Bar dataKey="pengeluaran" name="Pengeluaran" fill="#f43f5e" radius={[5,5,0,0]} />
            </BarChart>
          </ResponsiveContainer>
        )}
        <div className="flex gap-4 mt-2 justify-center">
          <div className="flex items-center gap-1.5"><div className="h-2.5 w-2.5 rounded-full bg-emerald-500"/><span className="text-xs text-slate-500 font-medium">Pemasukan</span></div>
          <div className="flex items-center gap-1.5"><div className="h-2.5 w-2.5 rounded-full bg-rose-500"/><span className="text-xs text-slate-500 font-medium">Pengeluaran</span></div>
        </div>
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        {[{ data: pengeluaranByKat, title: 'Pengeluaran per Kategori' }, { data: pemasukanByKat, title: 'Pemasukan per Kategori' }].map(({ data, title }) => (
          <div key={title} className="bg-white rounded-2xl border-2 border-slate-100 p-5">
            <h3 className="text-xs font-extrabold text-slate-600 uppercase tracking-wider mb-4">{title}</h3>
            {data.length === 0 ? (
              <div className="h-32 flex items-center justify-center text-slate-400 text-xs">Belum ada data</div>
            ) : (
              <>
                <ResponsiveContainer width="100%" height={160}>
                  <PieChart>
                    <Pie data={data} cx="50%" cy="50%" innerRadius={45} outerRadius={70} paddingAngle={3} dataKey="value">
                      {data.map((_, i) => <Cell key={i} fill={CHART_COLORS[i % CHART_COLORS.length]} />)}
                    </Pie>
                    <Tooltip content={<CustomTooltip />} />
                  </PieChart>
                </ResponsiveContainer>
                <div className="space-y-1.5 mt-2">
                  {data.slice(0, 4).map((item, i) => (
                    <div key={i} className="flex items-center justify-between text-xs">
                      <div className="flex items-center gap-2"><div className="h-2 w-2 rounded-full" style={{ background: CHART_COLORS[i % CHART_COLORS.length] }} /><span className="text-slate-600">{item.name}</span></div>
                      <span className="font-bold text-slate-800">{formatRupiah(item.value)}</span>
                    </div>
                  ))}
                </div>
              </>
            )}
          </div>
        ))}
      </div>
    </div>
  );

  const renderBudget = () => (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-base font-extrabold text-slate-900">Anggaran</h2>
          <p className="text-xs text-slate-400 mt-0.5">{new Date().toLocaleDateString('id-ID', { month: 'long', year: 'numeric' })}</p>
        </div>
        <button onClick={() => setShowBudgetModal(true)}
          className="flex items-center gap-2 px-4 py-2.5 bg-slate-900 hover:bg-slate-700 text-white text-xs font-bold rounded-2xl transition-all shadow-lg shadow-slate-900/20">
          <FontAwesomeIcon icon={faPlus} /> Atur
        </button>
      </div>
      {budgetProgress.length === 0 ? (
        <div className="py-16 flex flex-col items-center bg-white rounded-2xl border-2 border-dashed border-slate-200">
          <FontAwesomeIcon icon={faBullseye} className="text-3xl text-slate-300 mb-3" />
          <p className="text-sm font-bold text-slate-600">Belum ada anggaran</p>
          <p className="text-xs mt-1 text-slate-400">Atur batas pengeluaran per kategori</p>
          <button onClick={() => setShowBudgetModal(true)} className="mt-4 px-5 py-2.5 bg-slate-900 text-white text-xs font-bold rounded-xl">Mulai sekarang</button>
        </div>
      ) : (
        <div className="grid gap-3">
          {budgetProgress.map((b, i) => (
            <div key={i} className={`bg-white rounded-2xl border-2 p-4 ${b.over ? 'border-rose-200' : b.warn ? 'border-amber-200' : 'border-slate-100'}`}>
              <div className="flex items-center justify-between mb-3">
                <div>
                  <p className="text-sm font-extrabold text-slate-900">{b.category}</p>
                  <p className="text-xs text-slate-400 mt-0.5">{formatRupiah(b.spent)} / {formatRupiah(b.limit)}</p>
                </div>
                <div className="flex items-center gap-2">
                  <span className={`text-xs font-black px-3 py-1 rounded-lg ${b.over ? 'bg-rose-100 text-rose-700' : b.warn ? 'bg-amber-100 text-amber-700' : 'bg-emerald-50 text-emerald-700'}`}>
                    {b.over ? 'Overbudget!' : `${Math.round(b.pct)}%`}
                  </span>
                  <button onClick={() => setBudgets(prev => prev.filter((_, idx) => idx !== i))}
                    className="h-7 w-7 bg-slate-100 hover:bg-rose-100 text-slate-400 hover:text-rose-500 rounded-lg flex items-center justify-center text-xs transition-all">
                    <FontAwesomeIcon icon={faXmark} />
                  </button>
                </div>
              </div>
              <div className="h-2.5 bg-slate-100 rounded-full overflow-hidden">
                <div className={`h-full rounded-full transition-all duration-700 ${b.over ? 'bg-rose-500 animate-pulse' : b.warn ? 'bg-amber-400' : 'bg-emerald-500'}`} style={{ width: `${b.pct}%` }} />
              </div>
              <div className="flex justify-between mt-2">
                <span className="text-xs text-slate-400">Sisa: <span className={`font-bold ${b.over ? 'text-rose-500' : 'text-slate-700'}`}>{b.over ? `-${formatRupiah(b.spent - b.limit)}` : formatRupiah(b.limit - b.spent)}</span></span>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );

  const renderWallets = () => (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-base font-extrabold text-slate-900">Dompet</h2>
          <p className="text-xs text-slate-400 mt-0.5">Pencatatan manual per sumber dana</p>
        </div>
        <button onClick={() => { setEditingWallet(null); setWalletForm({ name: '', type: 'cash', color: '#10b981', balance: '' }); setShowWalletModal(true); }}
          className="flex items-center gap-2 px-4 py-2.5 bg-slate-900 hover:bg-slate-700 text-white text-xs font-bold rounded-2xl transition-all shadow-lg shadow-slate-900/20">
          <FontAwesomeIcon icon={faPlus} /> Tambah
        </button>
      </div>

      <div className="flex gap-3 bg-blue-50 border border-blue-200 rounded-2xl p-4">
        <FontAwesomeIcon icon={faCircleInfo} className="text-blue-500 mt-0.5 flex-shrink-0" />
        <div>
          <p className="text-xs font-bold text-blue-800 mb-0.5">Dompet adalah catatan manual</p>
          <p className="text-xs text-blue-600 leading-relaxed">Saldo dompet dihitung dari transaksi yang kamu catat di FinTrack. Ini bukan koneksi langsung ke bank/e-wallet. Gunakan fitur <span className="font-bold">Import Mutasi</span> untuk mempercepat pencatatan.</p>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        {walletBalances.map(w => (
          <div key={w.id} className="bg-white rounded-2xl border-2 border-slate-100 p-5 group transition-all hover:border-slate-200">
            <div className="flex items-start justify-between mb-4">
              <div className="flex items-center gap-3">
                <div className="h-11 w-11 rounded-2xl flex items-center justify-center text-white shadow-md" style={{ background: w.color }}>
                  <FontAwesomeIcon icon={WALLET_ICONS[w.type] || faWallet} />
                </div>
                <div>
                  <p className="text-sm font-extrabold text-slate-900">{w.name}</p>
                  <p className="text-xs text-slate-400 capitalize">{w.type === 'cash' ? 'Uang Tunai' : w.type === 'bank' ? 'Rekening Bank' : w.type === 'ewallet' ? 'E-Wallet' : 'Kartu Kredit'}</p>
                </div>
              </div>
              <div className="flex gap-1">
                <button onClick={() => { setEditingWallet(w.id); setWalletForm({ name: w.name, type: w.type, color: w.color, balance: w.balance }); setShowWalletModal(true); }}
                  className="h-7 w-7 bg-slate-100 hover:bg-slate-200 rounded-lg flex items-center justify-center text-slate-400 text-xs">
                  <FontAwesomeIcon icon={faPencil} />
                </button>
                <button onClick={() => setWallets(prev => prev.filter(x => x.id !== w.id))}
                  className="h-7 w-7 bg-slate-100 hover:bg-rose-100 rounded-lg flex items-center justify-center text-slate-400 hover:text-rose-500 text-xs">
                  <FontAwesomeIcon icon={faTrash} />
                </button>
              </div>
            </div>
            <p className={`text-xl font-black tracking-tight ${w.balance >= 0 ? 'text-slate-900' : 'text-rose-600'}`}>{formatRupiah(w.balance)}</p>
            <div className="flex gap-3 mt-3 pt-3 border-t border-slate-100">
              <div className="flex-1"><p className="text-[10px] text-slate-400 mb-0.5">Masuk</p><p className="text-xs font-black text-emerald-600">+{formatRupiah(transactions.filter(t => t.wallet_id === w.id && t.type === 'pemasukan').reduce((s, t) => s + t.amount, 0))}</p></div>
              <div className="w-px bg-slate-100" />
              <div className="flex-1"><p className="text-[10px] text-slate-400 mb-0.5">Keluar</p><p className="text-xs font-black text-rose-600">-{formatRupiah(transactions.filter(t => t.wallet_id === w.id && t.type === 'pengeluaran').reduce((s, t) => s + t.amount, 0))}</p></div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );

  const renderImport = () => {
    const stepLabels = ['Pilih Sumber', 'Upload File', 'Mapping Kolom', 'Cek & Import', 'Selesai'];
    return (
      <div className="space-y-5">
        <div className="flex items-center gap-3">
          {importStep > 1 && importStep < 5 && (
            <button onClick={() => setImportStep(s => s - 1)} className="h-9 w-9 bg-white border-2 border-slate-200 rounded-xl flex items-center justify-center text-slate-500 hover:border-slate-300 transition-all">
              <FontAwesomeIcon icon={faAngleLeft} />
            </button>
          )}
          <div>
            <h2 className="text-base font-extrabold text-slate-900">Import Mutasi</h2>
            <p className="text-xs text-slate-400 mt-0.5">Langkah {importStep} dari 5 — {stepLabels[importStep - 1]}</p>
          </div>
        </div>

        <div className="flex items-center gap-1">
          {stepLabels.map((_, i) => (
            <React.Fragment key={i}>
              <div className={`h-2 rounded-full transition-all duration-300 ${i + 1 <= importStep ? 'bg-emerald-500' : 'bg-slate-200'} ${i + 1 === importStep ? 'flex-[3]' : 'flex-1'}`} />
              {i < stepLabels.length - 1 && <div className="w-1" />}
            </React.Fragment>
          ))}
        </div>

        {importStep === 1 && (
          <div className="space-y-3">
            <div className="bg-amber-50 border border-amber-200 rounded-2xl p-4 flex gap-3">
              <FontAwesomeIcon icon={faCircleInfo} className="text-amber-500 mt-0.5 flex-shrink-0" />
              <div>
                <p className="text-xs font-bold text-amber-800 mb-0.5">Cara kerja Import Mutasi</p>
                <p className="text-xs text-amber-700 leading-relaxed">Download file mutasi dari aplikasi bank/e-wallet kamu (biasanya format CSV atau Excel), lalu upload di sini. FinTrack akan membaca dan mengimpor transaksinya otomatis.</p>
              </div>
            </div>
            <p className="text-xs font-bold text-slate-500 uppercase tracking-wider">Pilih sumber mutasi</p>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
              {IMPORT_TEMPLATES.map(bank => (
                <button key={bank.id} onClick={() => { setImportBank(bank); setImportStep(2); }}
                  className="flex items-center gap-3 p-4 bg-white border-2 border-slate-200 hover:border-slate-300 rounded-2xl transition-all text-left active:scale-95 hover:shadow-md">
                  <span className="text-2xl">{bank.logo}</span>
                  <div>
                    <p className="text-sm font-extrabold text-slate-900">{bank.name}</p>
                    <p className="text-[10px] text-slate-400 font-medium mt-0.5">CSV/Excel</p>
                  </div>
                </button>
              ))}
            </div>
          </div>
        )}

        {importStep === 2 && importBank && (
          <div className="space-y-4">
            <div className="bg-white border-2 border-slate-100 rounded-2xl p-4">
              <div className="flex items-center gap-3 mb-3">
                <span className="text-2xl">{importBank.logo}</span>
                <div>
                  <p className="text-sm font-extrabold text-slate-900">{importBank.name}</p>
                  <p className="text-xs text-slate-500">{importBank.hint}</p>
                </div>
              </div>
              {importBank.example && (
                <div className="mt-3">
                  <p className="text-xs font-bold text-slate-500 mb-2">Contoh format file:</p>
                  <pre className="text-[10px] bg-slate-50 border border-slate-200 rounded-xl p-3 text-slate-600 overflow-x-auto leading-relaxed font-mono">{importBank.example}</pre>
                </div>
              )}
            </div>

            <div>
              <p className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">Dompet tujuan</p>
              <div className="grid grid-cols-2 gap-2">
                {wallets.map(w => (
                  <button key={w.id} onClick={() => setImportWalletId(w.id)}
                    className={`flex items-center gap-2.5 px-3.5 py-2.5 rounded-xl border-2 text-xs font-bold transition-all ${importWalletId === w.id ? 'border-emerald-400 bg-emerald-50 text-emerald-700' : 'border-slate-200 text-slate-600 hover:border-slate-300'}`}>
                    <div className="h-6 w-6 rounded-lg flex items-center justify-center text-white text-xs" style={{ background: w.color }}>
                      <FontAwesomeIcon icon={WALLET_ICONS[w.type] || faWallet} />
                    </div>
                    <span className="truncate">{w.name}</span>
                    {importWalletId === w.id && <FontAwesomeIcon icon={faCheck} className="ml-auto text-emerald-500" />}
                  </button>
                ))}
              </div>
            </div>

            <button onClick={() => fileInputRef.current?.click()}
              className="w-full border-2 border-dashed border-emerald-300 hover:border-emerald-400 bg-emerald-50 hover:bg-emerald-100 rounded-2xl py-10 flex flex-col items-center gap-3 transition-all cursor-pointer">
              <div className="h-14 w-14 bg-white rounded-2xl flex items-center justify-center shadow-md">
                <FontAwesomeIcon icon={faCloudArrowUp} className="text-2xl text-emerald-500" />
              </div>
              <div className="text-center">
                <p className="text-sm font-extrabold text-emerald-700">Klik untuk upload file</p>
                <p className="text-xs text-emerald-600 mt-1">Format CSV atau Excel (.csv, .xlsx, .xls)</p>
              </div>
            </button>
            <input ref={fileInputRef} type="file" accept=".csv,.xlsx,.xls,.txt" className="hidden" onChange={handleFileUpload} />
            {importFile && <p className="text-xs text-slate-500 font-medium text-center">📄 {importFile.name}</p>}
          </div>
        )}

        {importStep === 3 && (
          <div className="space-y-4">
            <div className="bg-white border-2 border-slate-100 rounded-2xl p-4">
              <p className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-3">Kolom yang ditemukan ({importCSV.headers.length})</p>
              <div className="flex flex-wrap gap-2">
                {importCSV.headers.map(h => (
                  <span key={h} className="px-3 py-1 bg-slate-100 text-slate-700 text-xs font-bold rounded-lg">{h}</span>
                ))}
              </div>
            </div>

            <div className="space-y-3">
              {[
                { key: 'date', label: 'Kolom Tanggal', required: true },
                { key: 'description', label: 'Kolom Keterangan/Deskripsi', required: true },
                { key: 'debit', label: 'Kolom Debit/Keluar (pengeluaran)', required: false },
                { key: 'credit', label: 'Kolom Kredit/Masuk (pemasukan)', required: false },
              ].map(field => (
                <div key={field.key}>
                  <label className="block text-xs font-bold text-slate-600 mb-1.5">
                    {field.label} {field.required && <span className="text-rose-500">*</span>}
                  </label>
                  <select value={importMapping[field.key]} onChange={e => setImportMapping(m => ({ ...m, [field.key]: e.target.value }))}
                    className="w-full px-4 py-2.5 bg-slate-50 border-2 border-slate-200 rounded-xl text-xs font-medium focus:outline-none focus:border-emerald-400 transition-all">
                    <option value="">— Pilih kolom —</option>
                    {importCSV.headers.map(h => <option key={h} value={h}>{h}</option>)}
                  </select>
                </div>
              ))}
            </div>

            {importCSV.rows.length > 0 && (
              <div className="bg-white border-2 border-slate-100 rounded-2xl p-4 overflow-x-auto">
                <p className="text-xs font-bold text-slate-500 mb-3">Preview 3 baris pertama</p>
                <table className="w-full text-[10px]">
                  <thead><tr>{importCSV.headers.map(h => <th key={h} className="text-left font-bold text-slate-600 pb-2 pr-3 whitespace-nowrap">{h}</th>)}</tr></thead>
                  <tbody>
                    {importCSV.rows.slice(0, 3).map((row, i) => (
                      <tr key={i} className="border-t border-slate-100">
                        {importCSV.headers.map(h => <td key={h} className="py-1.5 pr-3 text-slate-600 whitespace-nowrap">{row[h]}</td>)}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}

            <button onClick={handleBuildPreview}
              className="w-full py-3.5 bg-slate-900 hover:bg-slate-700 text-white text-sm font-bold rounded-2xl transition-all shadow-lg">
              Lanjut ke Preview →
            </button>
          </div>
        )}

        {importStep === 4 && (
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <p className="text-xs font-bold text-slate-600">{importPreview.filter(r => r.selected).length} dari {importPreview.length} transaksi dipilih</p>
              <div className="flex gap-2">
                <button onClick={() => setImportPreview(p => p.map(r => ({ ...r, selected: true })))}
                  className="text-xs font-bold text-emerald-600 px-3 py-1.5 bg-emerald-50 rounded-lg">Pilih Semua</button>
                <button onClick={() => setImportPreview(p => p.map(r => ({ ...r, selected: false })))}
                  className="text-xs font-bold text-slate-500 px-3 py-1.5 bg-slate-100 rounded-lg">Batal Semua</button>
              </div>
            </div>

            {importPreview.length === 0 ? (
              <div className="py-12 flex flex-col items-center bg-white rounded-2xl border-2 border-dashed border-slate-200">
                <FontAwesomeIcon icon={faTriangleExclamation} className="text-2xl text-amber-400 mb-3" />
                <p className="text-sm font-bold text-slate-600">Tidak ada transaksi terdeteksi</p>
                <p className="text-xs text-slate-400 mt-1">Coba periksa mapping kolom kembali</p>
                <button onClick={() => setImportStep(3)} className="mt-4 px-4 py-2 bg-slate-100 text-slate-600 text-xs font-bold rounded-xl">← Kembali</button>
              </div>
            ) : (
              <>
                <div className="grid gap-2 max-h-[50vh] overflow-y-auto pr-1">
                  {importPreview.map((row, i) => (
                    <div key={i} onClick={() => setImportPreview(p => p.map((r, idx) => idx === i ? { ...r, selected: !r.selected } : r))}
                      className={`flex items-center gap-3 px-4 py-3 rounded-2xl border-2 cursor-pointer transition-all ${row.selected ? 'border-emerald-200 bg-emerald-50/50' : 'border-slate-200 bg-white opacity-50'}`}>
                      <div className={`h-5 w-5 rounded-md border-2 flex items-center justify-center flex-shrink-0 transition-all ${row.selected ? 'bg-emerald-500 border-emerald-500' : 'border-slate-300'}`}>
                        {row.selected && <FontAwesomeIcon icon={faCheck} className="text-white text-[9px]" />}
                      </div>
                      <div className={`h-8 w-8 rounded-xl flex items-center justify-center text-xs flex-shrink-0 ${row.type === 'pemasukan' ? 'bg-emerald-100 text-emerald-600' : 'bg-rose-100 text-rose-600'}`}>
                        <FontAwesomeIcon icon={row.type === 'pemasukan' ? faArrowTrendUp : faArrowTrendDown} />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-xs font-bold text-slate-800 truncate">{row.description}</p>
                        <div className="flex items-center gap-1.5 mt-0.5">
                          <select value={row.category} onClick={e => e.stopPropagation()} onChange={e => setImportPreview(p => p.map((r, idx) => idx === i ? { ...r, category: e.target.value } : r))}
                            className="text-[10px] font-bold bg-transparent border-none outline-none cursor-pointer text-slate-500 py-0">
                            {KATEGORI[row.type].map(k => <option key={k} value={k}>{k}</option>)}
                          </select>
                          <span className="text-[10px] text-slate-400">{row.date}</span>
                        </div>
                      </div>
                      <p className={`text-xs font-black flex-shrink-0 ${row.type === 'pemasukan' ? 'text-emerald-600' : 'text-rose-600'}`}>
                        {row.type === 'pemasukan' ? '+' : '-'}{formatRupiah(row.amount)}
                      </p>
                    </div>
                  ))}
                </div>

                <button onClick={handleImportSubmit} disabled={importLoading || !importPreview.some(r => r.selected)}
                  className="w-full py-3.5 bg-emerald-600 hover:bg-emerald-700 disabled:opacity-60 text-white text-sm font-bold rounded-2xl transition-all shadow-lg shadow-emerald-500/20 flex items-center justify-center gap-2">
                  {importLoading ? <><FontAwesomeIcon icon={faCircleNotch} spin /> Mengimpor...</> : `Import ${importPreview.filter(r => r.selected).length} Transaksi`}
                </button>
              </>
            )}
          </div>
        )}

        {importStep === 5 && (
          <div className="py-10 flex flex-col items-center text-center">
            <div className="h-20 w-20 bg-emerald-100 rounded-3xl flex items-center justify-center mb-5 shadow-lg shadow-emerald-100">
              <FontAwesomeIcon icon={faCheckCircle} className="text-4xl text-emerald-500" />
            </div>
            <h3 className="text-xl font-black text-slate-900 mb-2">Import Berhasil!</h3>
            <p className="text-sm text-slate-500 mb-8">Transaksi sudah masuk ke riwayat keuangan kamu.</p>
            <div className="flex gap-3 w-full">
              <button onClick={resetImport} className="flex-1 py-3 rounded-2xl text-xs font-bold bg-slate-100 text-slate-600 hover:bg-slate-200 transition-all flex items-center justify-center gap-2">
                <FontAwesomeIcon icon={faRotateLeft} /> Import Lagi
              </button>
              <button onClick={() => { navigateTo('dashboard'); resetImport(); }} className="flex-1 py-3 rounded-2xl text-xs font-bold bg-slate-900 text-white hover:bg-slate-700 transition-all">
                Lihat Transaksi →
              </button>
            </div>
          </div>
        )}
      </div>
    );
  };

  return (
    <div className="min-h-screen bg-slate-50 font-sans">

      <header className="bg-white border-b border-slate-200/60 px-4 sm:px-6 py-4 sticky top-0 z-30 shadow-sm">
        <div className="max-w-2xl mx-auto flex justify-between items-center">
          <div className="flex items-center gap-3">
            <button id="hamburger" onClick={() => setSidebarOpen(s => !s)}
              className="hidden md:flex h-9 w-9 items-center justify-center rounded-xl text-slate-500 hover:bg-slate-100 hover:text-slate-800 transition-all">
              <FontAwesomeIcon icon={faBars} />
            </button>
            <div className="flex items-center gap-2.5">
              <div className="h-9 w-9 bg-gradient-to-br from-emerald-500 to-teal-600 rounded-xl flex items-center justify-center text-white shadow-md shadow-emerald-200">
                <FontAwesomeIcon icon={faWallet} className="text-sm" />
              </div>
              <span className="font-black text-lg tracking-tight text-slate-900">FinTrack</span>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <button onClick={() => setShowModal(true)}
              className="md:hidden flex items-center gap-2 px-4 py-2 bg-emerald-500 hover:bg-emerald-600 text-white text-xs font-bold rounded-xl transition-all shadow-md shadow-emerald-200">
              <FontAwesomeIcon icon={faPlus} /> Catat
            </button>
            <button onClick={handleLogout}
              className="hidden md:flex items-center gap-2 px-3.5 py-2 text-xs text-slate-500 hover:text-rose-600 font-bold rounded-xl hover:bg-rose-50 border border-transparent hover:border-rose-100 transition-all">
              <FontAwesomeIcon icon={faRightFromBracket} />
              <span>Keluar</span>
            </button>
          </div>
        </div>
      </header>

      <div id="sidebar"
        className={`hidden md:block fixed top-[73px] left-0 h-[calc(100vh-73px)] w-64 bg-white border-r border-slate-200 z-20 transition-transform duration-300 shadow-xl shadow-slate-200/60 ${sidebarOpen ? 'translate-x-0' : '-translate-x-full'}`}>
        <div className="p-4 space-y-1">
          <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest px-3 py-2">Menu</p>
          {TABS.map(tab => (
            <button key={tab.id} onClick={() => navigateTo(tab.id)}
              className={`w-full flex items-center gap-3 px-3 py-3 rounded-xl text-sm font-bold transition-all text-left ${activeTab === tab.id ? 'bg-emerald-50 text-emerald-700' : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900'}`}>
              <div className={`h-8 w-8 rounded-xl flex items-center justify-center text-xs ${activeTab === tab.id ? 'bg-emerald-100 text-emerald-600' : 'bg-slate-100 text-slate-500'}`}>
                <FontAwesomeIcon icon={tab.icon} />
              </div>
              {tab.label}
            </button>
          ))}
          <div className="pt-4 mt-4 border-t border-slate-100">
            <button onClick={handleLogout}
              className="w-full flex items-center gap-3 px-3 py-3 rounded-xl text-sm font-bold text-slate-600 hover:bg-rose-50 hover:text-rose-600 transition-all">
              <div className="h-8 w-8 rounded-xl bg-slate-100 flex items-center justify-center text-xs text-slate-500">
                <FontAwesomeIcon icon={faRightFromBracket} />
              </div>
              Keluar
            </button>
          </div>
        </div>
      </div>

      {sidebarOpen && (
        <div className="hidden md:block fixed inset-0 bg-slate-900/20 z-10 top-[73px]" onClick={() => setSidebarOpen(false)} />
      )}

      <main className="max-w-2xl mx-auto px-4 sm:px-5 pt-5 pb-28">
        <SummaryCards />
        <div className="mt-6">
          {activeTab === 'dashboard' && renderDashboard()}
          {activeTab === 'chart' && renderChart()}
          {activeTab === 'budget' && renderBudget()}
          {activeTab === 'wallets' && renderWallets()}
          {activeTab === 'import' && renderImport()}
        </div>
      </main>

      <nav className="md:hidden fixed bottom-0 left-0 right-0 bg-white/95 backdrop-blur-xl border-t border-slate-200/80 z-30 safe-b">
        <div className="flex items-stretch h-16 px-2">
          {TABS.map((tab, i) => {
            const isCenter = i === 0; 
            const isActive = activeTab === tab.id;
            return (
              <button key={tab.id} onClick={() => navigateTo(tab.id)}
                className={`flex-1 flex flex-col items-center justify-center gap-1 relative transition-all ${isActive ? 'text-emerald-600' : 'text-slate-400 hover:text-slate-600'}`}>
                {isActive && (
                  <div className="absolute top-0 left-1/2 -translate-x-1/2 h-0.5 w-8 bg-emerald-500 rounded-full" />
                )}
                <div className={`h-7 w-7 flex items-center justify-center rounded-xl transition-all ${isActive ? 'bg-emerald-50' : ''}`}>
                  <FontAwesomeIcon icon={tab.icon} className={`text-sm ${isActive ? 'text-emerald-600' : 'text-slate-400'}`} />
                </div>
                <span className={`text-[10px] font-bold leading-none ${isActive ? 'text-emerald-600' : 'text-slate-400'}`}>{tab.label}</span>
              </button>
            );
          })}
        </div>
      </nav>

      {activeTab !== 'dashboard' && (
        <button onClick={() => setShowModal(true)}
          className="md:hidden fixed bottom-20 right-4 h-14 w-14 bg-emerald-500 hover:bg-emerald-600 text-white rounded-2xl shadow-xl shadow-emerald-500/40 flex items-center justify-center text-lg transition-all active:scale-95 z-30">
          <FontAwesomeIcon icon={faPlus} />
        </button>
      )}

      {showModal && (
        <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm flex items-end sm:items-center justify-center z-50 p-0 sm:p-4">
          <div className="bg-white rounded-t-3xl sm:rounded-3xl shadow-2xl w-full sm:max-w-lg overflow-hidden">
            <div className="px-6 py-5 border-b border-slate-100 flex justify-between items-center">
              <div>
                <h3 className="text-base font-extrabold text-slate-900">Catat Transaksi</h3>
                <p className="text-xs text-slate-400 mt-0.5">Isi detail transaksi di bawah ini</p>
              </div>
              <button onClick={() => setShowModal(false)} className="h-9 w-9 bg-slate-100 rounded-xl flex items-center justify-center text-slate-400 hover:text-rose-500 hover:bg-rose-50 transition-all">
                <FontAwesomeIcon icon={faXmark} />
              </button>
            </div>
            <form onSubmit={handleSubmit} className="p-5 space-y-4 overflow-y-auto max-h-[80vh]">
              <div>
                <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">Jenis</label>
                <div className="flex bg-slate-100 p-1.5 rounded-2xl gap-1">
                  {['pemasukan','pengeluaran'].map(t => (
                    <button key={t} type="button" onClick={() => setForm({ ...form, type: t, category: KATEGORI[t][0] })}
                      className={`flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl text-xs font-bold transition-all capitalize ${form.type === t ? (t === 'pemasukan' ? 'bg-emerald-500 text-white shadow-md shadow-emerald-200' : 'bg-rose-500 text-white shadow-md shadow-rose-200') : 'text-slate-500 hover:bg-white/60'}`}>
                      <FontAwesomeIcon icon={t === 'pemasukan' ? faArrowTrendUp : faArrowTrendDown} />
                      {t}
                    </button>
                  ))}
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">Kategori</label>
                  <select value={form.category} onChange={e => setForm({ ...form, category: e.target.value })}
                    className="w-full px-3.5 py-2.5 bg-slate-50 border-2 border-slate-200 rounded-xl text-xs font-medium focus:outline-none focus:border-emerald-400 transition-all">
                    {KATEGORI[form.type].map(k => <option key={k} value={k}>{k}</option>)}
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">Tanggal</label>
                  <input type="date" value={form.date} onChange={e => setForm({ ...form, date: e.target.value })}
                    className="w-full px-3.5 py-2.5 bg-slate-50 border-2 border-slate-200 rounded-xl text-xs font-medium focus:outline-none focus:border-emerald-400 transition-all" />
                </div>
              </div>
              <div>
                <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">Dari / Ke Dompet</label>
                <div className="grid grid-cols-2 gap-2">
                  {wallets.map(w => (
                    <button key={w.id} type="button" onClick={() => setForm({ ...form, wallet_id: w.id })}
                      className={`flex items-center gap-2 px-3 py-2.5 rounded-xl border-2 text-xs font-bold transition-all ${form.wallet_id === w.id ? 'border-emerald-400 bg-emerald-50 text-emerald-700' : 'border-slate-200 text-slate-600 hover:border-slate-300'}`}>
                      <div className="h-6 w-6 rounded-lg flex items-center justify-center text-white text-[10px] flex-shrink-0" style={{ background: w.color }}>
                        <FontAwesomeIcon icon={WALLET_ICONS[w.type] || faWallet} />
                      </div>
                      <span className="truncate">{w.name}</span>
                      {form.wallet_id === w.id && <FontAwesomeIcon icon={faCheck} className="ml-auto text-emerald-500 flex-shrink-0 text-[10px]" />}
                    </button>
                  ))}
                </div>
              </div>
              <div>
                <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">Deskripsi <span className="text-slate-400 font-normal normal-case">(opsional)</span></label>
                <input type="text" value={form.description} onChange={e => setForm({ ...form, description: e.target.value })}
                  placeholder="Contoh: Beli kopi senja..."
                  className="w-full px-3.5 py-2.5 bg-slate-50 border-2 border-slate-200 rounded-xl text-xs font-medium focus:outline-none focus:border-emerald-400 transition-all placeholder:text-slate-300" />
              </div>
              <div>
                <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">Jumlah</label>
                <div className="relative">
                  <span className="absolute left-4 top-1/2 -translate-y-1/2 font-bold text-slate-400 text-sm">Rp</span>
                  <input type="number" value={form.amount} onChange={e => setForm({ ...form, amount: e.target.value })}
                    placeholder="0" min="1" required
                    className="w-full pl-12 pr-4 py-3.5 bg-slate-50 border-2 border-slate-200 rounded-xl text-xl font-black text-slate-900 focus:outline-none focus:border-emerald-400 transition-all placeholder:text-slate-300" />
                </div>
              </div>
              <div className="flex gap-3 pt-1">
                <button type="button" onClick={() => setShowModal(false)} className="flex-1 py-3 rounded-2xl text-xs font-bold bg-slate-100 text-slate-600 hover:bg-slate-200 transition-all">Batal</button>
                <button type="submit" disabled={submitting}
                  className="flex-1 flex justify-center items-center gap-2 py-3 rounded-2xl text-xs font-bold text-white bg-slate-900 hover:bg-slate-700 disabled:opacity-60 transition-all shadow-lg shadow-slate-900/20">
                  {submitting ? <><FontAwesomeIcon icon={faCircleNotch} spin /> Menyimpan...</> : 'Simpan'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {showWalletModal && (
        <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm flex items-end sm:items-center justify-center z-50 p-0 sm:p-4">
          <div className="bg-white rounded-t-3xl sm:rounded-3xl shadow-2xl w-full sm:max-w-md overflow-hidden">
            <div className="px-6 py-5 border-b border-slate-100 flex justify-between items-center">
              <h3 className="text-base font-extrabold text-slate-900">{editingWallet ? 'Edit Dompet' : 'Dompet Baru'}</h3>
              <button onClick={() => setShowWalletModal(false)} className="h-9 w-9 bg-slate-100 rounded-xl flex items-center justify-center text-slate-400 hover:text-rose-500 hover:bg-rose-50 transition-all">
                <FontAwesomeIcon icon={faXmark} />
              </button>
            </div>
            <div className="p-5 space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">Nama Dompet</label>
                <input type="text" value={walletForm.name} onChange={e => setWalletForm({ ...walletForm, name: e.target.value })}
                  placeholder="e.g. Bank BCA, Gopay..."
                  className="w-full px-4 py-3 bg-slate-50 border-2 border-slate-200 rounded-xl text-sm font-medium focus:outline-none focus:border-emerald-400 transition-all" />
              </div>
              <div>
                <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">Tipe</label>
                <div className="grid grid-cols-4 gap-2">
                  {[{ val:'cash',label:'Tunai',icon:faMoneyBillWave},{val:'bank',label:'Bank',icon:faBuildingColumns},{val:'ewallet',label:'E-Wallet',icon:faCoins},{val:'card',label:'Kartu',icon:faCreditCard}].map(t => (
                    <button key={t.val} type="button" onClick={() => setWalletForm({ ...walletForm, type: t.val })}
                      className={`flex flex-col items-center gap-1.5 py-3 rounded-xl border-2 text-xs font-bold transition-all ${walletForm.type === t.val ? 'border-emerald-400 bg-emerald-50 text-emerald-700' : 'border-slate-200 text-slate-500 hover:border-slate-300'}`}>
                      <FontAwesomeIcon icon={t.icon} />
                      {t.label}
                    </button>
                  ))}
                </div>
              </div>
              <div>
                <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">Warna</label>
                <div className="flex gap-2 flex-wrap">
                  {['#10b981','#6366f1','#f59e0b','#f43f5e','#8b5cf6','#0ea5e9','#14b8a6','#ec4899'].map(c => (
                    <button key={c} type="button" onClick={() => setWalletForm({ ...walletForm, color: c })}
                      className={`h-8 w-8 rounded-xl transition-all ${walletForm.color === c ? 'ring-2 ring-offset-2 ring-slate-800 scale-110' : 'hover:scale-105'}`}
                      style={{ background: c }} />
                  ))}
                </div>
              </div>
              <div>
                <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">Saldo Awal</label>
                <div className="relative">
                  <span className="absolute left-4 top-1/2 -translate-y-1/2 font-bold text-slate-400 text-sm">Rp</span>
                  <input type="number" value={walletForm.balance} onChange={e => setWalletForm({ ...walletForm, balance: e.target.value })}
                    placeholder="0" min="0"
                    className="w-full pl-12 pr-4 py-3 bg-slate-50 border-2 border-slate-200 rounded-xl text-base font-bold focus:outline-none focus:border-emerald-400 transition-all" />
                </div>
              </div>
              <div className="flex gap-3 pt-1">
                <button type="button" onClick={() => setShowWalletModal(false)} className="flex-1 py-3 rounded-2xl text-xs font-bold bg-slate-100 text-slate-600 hover:bg-slate-200 transition-all">Batal</button>
                <button type="button" onClick={handleSaveWallet} className="flex-1 py-3 rounded-2xl text-xs font-bold text-white bg-slate-900 hover:bg-slate-700 transition-all shadow-lg">
                  {editingWallet ? 'Simpan' : 'Tambah'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {showBudgetModal && (
        <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm flex items-end sm:items-center justify-center z-50 p-0 sm:p-4">
          <div className="bg-white rounded-t-3xl sm:rounded-3xl shadow-2xl w-full sm:max-w-sm overflow-hidden">
            <div className="px-6 py-5 border-b border-slate-100 flex justify-between items-center">
              <h3 className="text-base font-extrabold text-slate-900">Atur Anggaran</h3>
              <button onClick={() => setShowBudgetModal(false)} className="h-9 w-9 bg-slate-100 rounded-xl flex items-center justify-center text-slate-400 hover:text-rose-500 hover:bg-rose-50 transition-all"><FontAwesomeIcon icon={faXmark} /></button>
            </div>
            <div className="p-5 space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">Kategori</label>
                <select value={budgetForm.category} onChange={e => setBudgetForm({ ...budgetForm, category: e.target.value })}
                  className="w-full px-4 py-3 bg-slate-50 border-2 border-slate-200 rounded-xl text-sm font-medium focus:outline-none focus:border-emerald-400 transition-all">
                  {KATEGORI.pengeluaran.map(k => <option key={k} value={k}>{k}</option>)}
                </select>
              </div>
              <div>
                <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">Batas / Bulan</label>
                <div className="relative">
                  <span className="absolute left-4 top-1/2 -translate-y-1/2 font-bold text-slate-400 text-sm">Rp</span>
                  <input type="number" value={budgetForm.limit} onChange={e => setBudgetForm({ ...budgetForm, limit: e.target.value })}
                    placeholder="0" min="1"
                    className="w-full pl-12 pr-4 py-3.5 bg-slate-50 border-2 border-slate-200 rounded-xl text-xl font-black focus:outline-none focus:border-emerald-400 transition-all" />
                </div>
              </div>
              <div className="flex gap-3 pt-1">
                <button onClick={() => setShowBudgetModal(false)} className="flex-1 py-3 rounded-2xl text-xs font-bold bg-slate-100 text-slate-600 hover:bg-slate-200 transition-all">Batal</button>
                <button onClick={handleSaveBudget} className="flex-1 py-3 rounded-2xl text-xs font-bold text-white bg-slate-900 hover:bg-slate-700 transition-all shadow-lg">Simpan</button>
              </div>
            </div>
          </div>
        </div>
      )}

      {deleteTarget && (
        <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-3xl shadow-2xl w-full max-w-sm p-7 text-center">
            <div className="h-16 w-16 bg-rose-100 text-rose-500 rounded-2xl flex items-center justify-center mx-auto mb-5">
              <FontAwesomeIcon icon={faTriangleExclamation} className="text-2xl" />
            </div>
            <h3 className="text-base font-black text-slate-900 mb-2">Hapus Transaksi?</h3>
            <p className="text-sm text-slate-500 mb-6">Tindakan ini tidak dapat dibatalkan.</p>
            <div className="flex gap-3">
              <button onClick={() => setDeleteTarget(null)} className="flex-1 py-3 rounded-2xl text-xs font-bold bg-slate-100 text-slate-600 hover:bg-slate-200 transition-all">Batal</button>
              <button onClick={executeDelete} className="flex-1 py-3 rounded-2xl text-xs font-bold bg-rose-600 text-white hover:bg-rose-700 transition-all">Hapus</button>
            </div>
          </div>
        </div>
      )}

      {errorModal.show && (
        <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-3xl shadow-2xl w-full max-w-sm p-7 text-center">
            <div className="h-16 w-16 bg-rose-100 text-rose-500 rounded-2xl flex items-center justify-center mx-auto mb-5">
              <FontAwesomeIcon icon={faTriangleExclamation} className="text-2xl" />
            </div>
            <h3 className="text-base font-black text-slate-900 mb-2">Terjadi Kesalahan</h3>
            <p className="text-sm text-slate-500 mb-6">{errorModal.message}</p>
            <button onClick={() => setErrorModal({ show: false, message: '' })}
              className="w-full py-3 rounded-2xl text-xs font-bold bg-slate-900 text-white hover:bg-slate-700 transition-all">Mengerti</button>
          </div>
        </div>
      )}

      {successToast.show && (
        <div className="fixed bottom-24 md:bottom-6 left-1/2 -translate-x-1/2 z-50 pointer-events-none">
          <div className="bg-slate-900 text-white rounded-2xl shadow-2xl px-5 py-3 flex items-center gap-3 pointer-events-auto animate-in fade-in slide-in-from-bottom-2 duration-300">
            <div className="h-7 w-7 bg-emerald-500 rounded-lg flex items-center justify-center flex-shrink-0">
              <FontAwesomeIcon icon={faCheckCircle} className="text-xs" />
            </div>
            <p className="text-xs font-bold">{successToast.message}</p>
          </div>
        </div>
      )}

    </div>
  );
}