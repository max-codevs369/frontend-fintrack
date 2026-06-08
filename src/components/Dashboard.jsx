import React, { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import {
  faFilter, faWallet, faRightFromBracket, faArrowTrendUp, faArrowTrendDown,
  faPlus, faXmark, faBoxOpen, faTriangleExclamation, faCircleNotch,
  faScaleBalanced, faCheckCircle, faMagnifyingGlass, faChevronDown,
  faFileExport, faChartPie, faBullseye, faCreditCard, faTrash,
  faPencil, faCheck, faCoins, faBuildingColumns, faMoneyBillWave,
  faEllipsisVertical, faArrowRight, faBell
} from '@fortawesome/free-solid-svg-icons';
import { PieChart, Pie, Cell, Tooltip, ResponsiveContainer, BarChart, Bar, XAxis, YAxis, CartesianGrid } from 'recharts';

const API = 'https://shifty-carey-pentahydroxy.ngrok-free.dev';

function formatRupiah(num) {
  return new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', minimumFractionDigits: 0 }).format(num ?? 0);
}

function formatTanggal(dateStr) {
  return new Date(dateStr).toLocaleDateString('id-ID', { day: '2-digit', month: 'short', year: 'numeric' });
}

const KATEGORI = {
  pemasukan: ['Gaji', 'Freelance', 'Investasi', 'Bonus', 'Lainnya'],
  pengeluaran: ['Makanan', 'Minuman', 'Transportasi', 'Belanja', 'Tagihan', 'Kesehatan', 'Hiburan', 'Lainnya'],
};

const FILTER_LABEL = { semua: 'Semua', pemasukan: 'Pemasukan', pengeluaran: 'Pengeluaran' };

const CHART_COLORS = ['#10b981', '#6366f1', '#f59e0b', '#f43f5e', '#8b5cf6', '#0ea5e9', '#ec4899', '#14b8a6'];

const WALLET_ICONS = {
  cash: faMoneyBillWave,
  bank: faBuildingColumns,
  ewallet: faCoins,
  card: faCreditCard,
};

const DEFAULT_WALLETS = [
  { id: 'w1', name: 'Dompet Tunai', type: 'cash', color: '#10b981', balance: 0 },
  { id: 'w2', name: 'Bank BCA', type: 'bank', color: '#6366f1', balance: 0 },
];

const TABS = [
  { id: 'dashboard', label: 'Dashboard', icon: faScaleBalanced },
  { id: 'chart', label: 'Grafik', icon: faChartPie },
  { id: 'budget', label: 'Anggaran', icon: faBullseye },
  { id: 'wallets', label: 'Dompet', icon: faWallet },
];

const CustomTooltip = ({ active, payload }) => {
  if (active && payload && payload.length) {
    return (
      <div className="bg-white border border-slate-100 rounded-2xl shadow-xl px-4 py-3 text-sm">
        <p className="font-bold text-slate-800">{payload[0].name}</p>
        <p className="font-black text-emerald-600 mt-0.5">{formatRupiah(payload[0].value)}</p>
      </div>
    );
  }
  return null;
};

export default function Dashboard() {
  const navigate = useNavigate();
  const filterRef = useRef(null);

  const [summary, setSummary] = useState({ total_pemasukan: 0, total_pengeluaran: 0, saldo: 0 });
  const [transactions, setTransactions] = useState([]);
  const [loading, setLoading] = useState(true);

  const [activeTab, setActiveTab] = useState('dashboard');
  const [errorModal, setErrorModal] = useState({ show: false, message: '' });
  const [successModal, setSuccessModal] = useState({ show: false, message: '' });
  const [showModal, setShowModal] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [filterType, setFilterType] = useState('semua');
  const [showFilter, setShowFilter] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterMonth, setFilterMonth] = useState('');
  const [deleteTarget, setDeleteTarget] = useState(null);

  const [form, setForm] = useState({
    type: 'pemasukan',
    category: 'Gaji',
    description: '',
    amount: '',
    date: new Date().toISOString().split('T')[0],
    wallet_id: 'w1',
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

  const token = localStorage.getItem('token');

  const authHeaders = useMemo(() => ({
    'Content-Type': 'application/json',
    'Authorization': `Bearer ${token}`,
    'ngrok-skip-browser-warning': '17317',
  }), [token]);

  const showError = (msg) => setErrorModal({ show: true, message: msg });
  const showSuccess = (msg) => {
    setSuccessModal({ show: true, message: msg });
    setTimeout(() => setSuccessModal({ show: false, message: '' }), 2500);
  };

  const handleLogout = useCallback(() => {
    localStorage.removeItem('token');
    navigate('/login', { replace: true });
  }, [navigate]);

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const [summaryRes, txRes] = await Promise.all([
        fetch(`${API}/summary`, { headers: authHeaders }),
        fetch(`${API}/transactions`, { headers: authHeaders }),
      ]);
      if (summaryRes.status === 401 || txRes.status === 401) { handleLogout(); return; }
      const summaryData = await summaryRes.json();
      const txData = await txRes.json();
      setSummary(summaryData);
      setTransactions(txData.transactions || []);
    } catch {
      showError('Gagal memuat data. Periksa koneksi Anda.');
    } finally {
      setLoading(false);
    }
  }, [authHeaders, handleLogout]);

  useEffect(() => { fetchData(); }, [fetchData]);

  useEffect(() => {
    localStorage.setItem('ft_wallets', JSON.stringify(wallets));
  }, [wallets]);

  useEffect(() => {
    localStorage.setItem('ft_budgets', JSON.stringify(budgets));
  }, [budgets]);

  useEffect(() => {
    function handleClickOutside(e) {
      if (filterRef.current && !filterRef.current.contains(e.target)) setShowFilter(false);
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const filteredTx = useMemo(() => transactions.filter(t => {
    const matchType = filterType === 'semua' || t.type === filterType;
    const keyword = searchTerm.toLowerCase();
    const matchSearch = !keyword || (t.description?.toLowerCase().includes(keyword)) || (t.category?.toLowerCase().includes(keyword));
    const matchMonth = !filterMonth || t.date.startsWith(filterMonth);
    return matchType && matchSearch && matchMonth;
  }), [transactions, filterType, searchTerm, filterMonth]);

  const dynamicPemasukan = useMemo(() => filteredTx.filter(t => t.type === 'pemasukan').reduce((s, t) => s + t.amount, 0), [filteredTx]);
  const dynamicPengeluaran = useMemo(() => filteredTx.filter(t => t.type === 'pengeluaran').reduce((s, t) => s + t.amount, 0), [filteredTx]);
  const dynamicSaldo = dynamicPemasukan - dynamicPengeluaran;

  const isFiltered = filterType !== 'semua' || searchTerm || filterMonth;

  const pengeluaranByKat = useMemo(() => {
    const map = {};
    filteredTx.filter(t => t.type === 'pengeluaran').forEach(t => {
      map[t.category] = (map[t.category] || 0) + t.amount;
    });
    return Object.entries(map).map(([name, value]) => ({ name, value })).sort((a, b) => b.value - a.value);
  }, [filteredTx]);

  const pemasukanByKat = useMemo(() => {
    const map = {};
    filteredTx.filter(t => t.type === 'pemasukan').forEach(t => {
      map[t.category] = (map[t.category] || 0) + t.amount;
    });
    return Object.entries(map).map(([name, value]) => ({ name, value })).sort((a, b) => b.value - a.value);
  }, [filteredTx]);

  const monthlyTrend = useMemo(() => {
    const months = [];
    for (let i = 5; i >= 0; i--) {
      const d = new Date();
      d.setMonth(d.getMonth() - i);
      const key = d.toISOString().slice(0, 7);
      const label = d.toLocaleDateString('id-ID', { month: 'short', year: '2-digit' });
      const pemasukan = transactions.filter(t => t.type === 'pemasukan' && t.date.startsWith(key)).reduce((s, t) => s + t.amount, 0);
      const pengeluaran = transactions.filter(t => t.type === 'pengeluaran' && t.date.startsWith(key)).reduce((s, t) => s + t.amount, 0);
      months.push({ label, pemasukan, pengeluaran });
    }
    return months;
  }, [transactions]);

  const budgetProgress = useMemo(() => {
    const currentMonth = new Date().toISOString().slice(0, 7);
    return budgets.map(b => {
      const spent = transactions
        .filter(t => t.type === 'pengeluaran' && t.category === b.category && t.date.startsWith(currentMonth))
        .reduce((s, t) => s + t.amount, 0);
      const pct = Math.min((spent / b.limit) * 100, 100);
      const over = spent > b.limit;
      const warn = !over && pct >= 80;
      return { ...b, spent, pct, over, warn };
    });
  }, [budgets, transactions]);

  const walletBalances = useMemo(() => {
    return wallets.map(w => {
      const income = transactions.filter(t => t.wallet_id === w.id && t.type === 'pemasukan').reduce((s, t) => s + t.amount, 0);
      const expense = transactions.filter(t => t.wallet_id === w.id && t.type === 'pengeluaran').reduce((s, t) => s + t.amount, 0);
      return { ...w, balance: w.balance + income - expense };
    });
  }, [wallets, transactions]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.amount || parseFloat(form.amount) <= 0) return;
    setSubmitting(true);
    try {
      const res = await fetch(`${API}/transactions`, {
        method: 'POST',
        headers: authHeaders,
        body: JSON.stringify({ ...form, amount: parseFloat(form.amount) }),
      });
      if (!res.ok) throw new Error();
      setShowModal(false);
      setForm({ type: 'pemasukan', category: 'Gaji', description: '', amount: '', date: new Date().toISOString().split('T')[0], wallet_id: wallets[0]?.id || 'w1' });
      fetchData();
      showSuccess('Transaksi baru berhasil dicatat!');
    } catch {
      showError('Gagal menambah transaksi. Silakan coba lagi.');
    } finally {
      setSubmitting(false);
    }
  };

  const executeDelete = async () => {
    if (!deleteTarget) return;
    try {
      await fetch(`${API}/transactions/${deleteTarget}`, { method: 'DELETE', headers: authHeaders });
      fetchData();
      showSuccess('Transaksi berhasil dihapus!');
    } catch {
      showError('Gagal menghapus transaksi.');
    } finally {
      setDeleteTarget(null);
    }
  };

  const handleSaveWallet = () => {
    if (!walletForm.name.trim()) return;
    if (editingWallet) {
      setWallets(prev => prev.map(w => w.id === editingWallet ? { ...w, ...walletForm, balance: parseFloat(walletForm.balance) || w.balance } : w));
      showSuccess('Dompet berhasil diperbarui!');
    } else {
      const newWallet = { id: `w${Date.now()}`, ...walletForm, balance: parseFloat(walletForm.balance) || 0 };
      setWallets(prev => [...prev, newWallet]);
      showSuccess('Dompet baru ditambahkan!');
    }
    setShowWalletModal(false);
    setEditingWallet(null);
    setWalletForm({ name: '', type: 'cash', color: '#10b981', balance: '' });
  };

  const handleDeleteWallet = (id) => {
    setWallets(prev => prev.filter(w => w.id !== id));
    showSuccess('Dompet dihapus.');
  };

  const handleSaveBudget = () => {
    if (!budgetForm.limit || parseFloat(budgetForm.limit) <= 0) return;
    const existing = budgets.findIndex(b => b.category === budgetForm.category);
    if (existing >= 0) {
      setBudgets(prev => prev.map((b, i) => i === existing ? { ...b, limit: parseFloat(budgetForm.limit) } : b));
    } else {
      setBudgets(prev => [...prev, { ...budgetForm, limit: parseFloat(budgetForm.limit) }]);
    }
    setShowBudgetModal(false);
    setBudgetForm({ category: 'Makanan', limit: '' });
    showSuccess('Anggaran berhasil disimpan!');
  };

  const handleExportExcel = () => {
    if (filteredTx.length === 0) { showError('Tidak ada data untuk diekspor.'); return; }
    const tglCetak = new Date().toLocaleDateString('id-ID', { day: '2-digit', month: 'long', year: 'numeric' });
    const tableRows = filteredTx.map((tx, i) => {
      const isIncome = tx.type === 'pemasukan';
      return `<tr style="background:${i % 2 === 0 ? '#fff' : '#f8fafc'}">
        <td style="border:1px solid #e2e8f0;padding:10px 14px;font-size:12px;color:#475569">${new Date(tx.date).toISOString().split('T')[0]}</td>
        <td style="border:1px solid #e2e8f0;padding:10px 14px;text-align:center"><span style="background:${isIncome ? '#d1fae5' : '#ffe4e6'};color:${isIncome ? '#065f46' : '#9f1239'};font-weight:700;font-size:11px;padding:3px 10px;border-radius:20px">${isIncome ? 'PEMASUKAN' : 'PENGELUARAN'}</span></td>
        <td style="border:1px solid #e2e8f0;padding:10px 14px;font-size:12px">${tx.category}</td>
        <td style="border:1px solid #e2e8f0;padding:10px 14px;font-size:12px">${tx.description || '-'}</td>
        <td style="border:1px solid #e2e8f0;padding:10px 14px;text-align:right;font-weight:700;color:${isIncome ? '#059669' : '#e11d48'};font-size:12px">${isIncome ? '+' : '-'}${new Intl.NumberFormat('id-ID').format(tx.amount)}</td>
      </tr>`;
    }).join('');
    const html = `<html xmlns:o="urn:schemas-microsoft-com:office:office" xmlns:x="urn:schemas-microsoft-com:office:excel"><head><meta charset="utf-8"></head><body><table>
      <tr><td colspan="5" style="text-align:center;font-size:20pt;font-weight:900;padding:20px 0 4px">FinTrack</td></tr>
      <tr><td colspan="5" style="text-align:center;font-size:13pt;font-weight:700">Laporan Keuangan</td></tr>
      <tr><td colspan="5" style="text-align:center;font-size:10pt;color:#94a3b8;padding-bottom:16px">Dicetak pada ${tglCetak}</td></tr>
      <tr><th style="background:#0f172a;color:#fff;padding:12px 14px;border:1px solid #1e293b;font-size:11px;text-transform:uppercase">Tanggal</th><th style="background:#0f172a;color:#fff;padding:12px 14px;border:1px solid #1e293b;font-size:11px;text-transform:uppercase">Jenis</th><th style="background:#0f172a;color:#fff;padding:12px 14px;border:1px solid #1e293b;font-size:11px;text-transform:uppercase">Kategori</th><th style="background:#0f172a;color:#fff;padding:12px 14px;border:1px solid #1e293b;font-size:11px;text-transform:uppercase">Deskripsi</th><th style="background:#0f172a;color:#fff;padding:12px 14px;border:1px solid #1e293b;font-size:11px;text-transform:uppercase">Nominal (Rp)</th></tr>
      ${tableRows}
      <tr><td colspan="4" style="border:1px solid #e2e8f0;padding:12px 14px;text-align:right;font-weight:700;background:#f8fafc">SALDO AKHIR</td><td style="border:1px solid #e2e8f0;padding:12px 14px;text-align:right;font-weight:900;background:#f8fafc;color:${dynamicSaldo >= 0 ? '#059669' : '#e11d48'}">${dynamicSaldo >= 0 ? '+' : '-'}Rp ${new Intl.NumberFormat('id-ID').format(Math.abs(dynamicSaldo))}</td></tr>
    </table></body></html>`;
    const blob = new Blob([html], { type: 'application/vnd.ms-excel;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url; a.download = `Laporan_FinTrack_${new Date().toISOString().split('T')[0]}.xls`;
    document.body.appendChild(a); a.click(); document.body.removeChild(a);
    showSuccess('Laporan berhasil diunduh!');
  };

  const renderSummaryCards = () => (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
      <div className="relative bg-gradient-to-br from-emerald-500 to-teal-600 text-white p-6 rounded-3xl shadow-lg shadow-emerald-500/20 overflow-hidden group cursor-default select-none">
        <div className="absolute inset-0 bg-white/5 opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
        <div className="absolute -right-4 -bottom-4 text-8xl opacity-[0.08]"><FontAwesomeIcon icon={faArrowTrendUp} /></div>
        <div className="relative z-10">
          <div className="flex items-center gap-2 mb-4">
            <div className="h-8 w-8 bg-white/20 rounded-xl flex items-center justify-center text-xs">
              <FontAwesomeIcon icon={faArrowTrendUp} />
            </div>
            <p className="text-xs font-bold opacity-75 uppercase tracking-widest">Pemasukan</p>
          </div>
          <h3 className="text-2xl font-black tracking-tight leading-tight">
            {loading ? <FontAwesomeIcon icon={faCircleNotch} spin /> : formatRupiah(dynamicPemasukan)}
          </h3>
          {isFiltered && !loading && (
            <p className="text-xs opacity-60 mt-1.5 font-medium">dari filter aktif</p>
          )}
        </div>
      </div>

      <div className="relative bg-gradient-to-br from-rose-500 to-pink-600 text-white p-6 rounded-3xl shadow-lg shadow-rose-500/20 overflow-hidden group cursor-default select-none">
        <div className="absolute inset-0 bg-white/5 opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
        <div className="absolute -right-4 -bottom-4 text-8xl opacity-[0.08]"><FontAwesomeIcon icon={faArrowTrendDown} /></div>
        <div className="relative z-10">
          <div className="flex items-center gap-2 mb-4">
            <div className="h-8 w-8 bg-white/20 rounded-xl flex items-center justify-center text-xs">
              <FontAwesomeIcon icon={faArrowTrendDown} />
            </div>
            <p className="text-xs font-bold opacity-75 uppercase tracking-widest">Pengeluaran</p>
          </div>
          <h3 className="text-2xl font-black tracking-tight leading-tight">
            {loading ? <FontAwesomeIcon icon={faCircleNotch} spin /> : formatRupiah(dynamicPengeluaran)}
          </h3>
          {isFiltered && !loading && (
            <p className="text-xs opacity-60 mt-1.5 font-medium">dari filter aktif</p>
          )}
        </div>
      </div>

      <div className={`relative text-white p-6 rounded-3xl shadow-lg overflow-hidden group cursor-default select-none transition-all duration-500 ${dynamicSaldo >= 0 ? 'bg-gradient-to-br from-indigo-600 to-blue-700 shadow-indigo-500/20' : 'bg-gradient-to-br from-orange-500 to-red-600 shadow-orange-500/20'}`}>
        <div className="absolute inset-0 bg-white/5 opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
        <div className="absolute -right-4 -bottom-4 text-8xl opacity-[0.08]"><FontAwesomeIcon icon={faScaleBalanced} /></div>
        <div className="relative z-10">
          <div className="flex items-center gap-2 mb-4">
            <div className="h-8 w-8 bg-white/20 rounded-xl flex items-center justify-center text-xs">
              <FontAwesomeIcon icon={faScaleBalanced} />
            </div>
            <p className="text-xs font-bold opacity-75 uppercase tracking-widest">
              {isFiltered ? 'Selisih' : 'Total Saldo'}
            </p>
          </div>
          <h3 className="text-2xl font-black tracking-tight leading-tight">
            {loading ? <FontAwesomeIcon icon={faCircleNotch} spin /> : formatRupiah(dynamicSaldo)}
          </h3>
          {isFiltered && !loading && (
            <p className="text-xs opacity-60 mt-1.5 font-medium">pemasukan − pengeluaran</p>
          )}
        </div>
      </div>
    </div>
  );

  const renderTransactions = () => (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-lg font-extrabold text-slate-900">Riwayat Transaksi</h2>
          {!loading && (
            <p className="text-xs text-slate-400 font-medium mt-0.5">
              {filteredTx.length} transaksi{filterType !== 'semua' ? ` · ${FILTER_LABEL[filterType]}` : ''}
              {filterMonth ? ` · ${new Date(filterMonth + '-01').toLocaleDateString('id-ID', { month: 'long', year: 'numeric' })}` : ''}
            </p>
          )}
        </div>
        <div className="flex items-center gap-2">
          <button onClick={handleExportExcel}
            className="flex items-center gap-2 px-4 py-2.5 bg-white border-2 border-slate-200 hover:bg-slate-50 hover:border-slate-300 text-slate-700 text-xs font-bold rounded-2xl transition-all shadow-sm">
            <FontAwesomeIcon icon={faFileExport} className="text-emerald-600" />
            <span className="hidden sm:inline">Ekspor</span>
          </button>
          <button onClick={() => setShowModal(true)}
            className="flex items-center gap-2 px-4 py-2.5 bg-slate-900 hover:bg-slate-700 text-white text-xs font-bold rounded-2xl transition-all shadow-lg shadow-slate-900/20 hover:-translate-y-0.5 active:translate-y-0">
            <FontAwesomeIcon icon={faPlus} />
            <span className="hidden sm:inline">Tambah</span>
          </button>
        </div>
      </div>

      <div className="flex gap-2.5 flex-wrap">
        <div className="relative" ref={filterRef}>
          <button onClick={() => setShowFilter(!showFilter)}
            className={`sm:hidden flex items-center gap-2 h-10 px-3.5 rounded-2xl text-xs font-bold transition-all border-2 ${filterType !== 'semua' ? 'bg-slate-900 text-white border-slate-900' : 'bg-white text-slate-600 border-slate-200'}`}>
            <FontAwesomeIcon icon={faFilter} />
            <span>{FILTER_LABEL[filterType]}</span>
            <FontAwesomeIcon icon={faChevronDown} className={`transition-transform text-xs ${showFilter ? 'rotate-180' : ''}`} />
          </button>
          <div className={`sm:hidden absolute top-12 left-0 z-10 bg-white border border-slate-200 rounded-2xl shadow-2xl p-1.5 flex flex-col gap-0.5 min-w-40 transition-all origin-top-left ${showFilter ? 'opacity-100 scale-100 pointer-events-auto' : 'opacity-0 scale-95 pointer-events-none'}`}>
            {['semua', 'pemasukan', 'pengeluaran'].map(f => (
              <button key={f} onClick={() => { setFilterType(f); setShowFilter(false); }}
                className={`px-4 py-2.5 rounded-xl text-xs font-bold text-left flex items-center gap-2 transition-all ${filterType === f ? 'bg-slate-900 text-white' : 'text-slate-600 hover:bg-slate-100'}`}>
                <FontAwesomeIcon icon={f === 'pemasukan' ? faArrowTrendUp : f === 'pengeluaran' ? faArrowTrendDown : faScaleBalanced}
                  className={f === 'pemasukan' ? 'text-emerald-500 w-3' : f === 'pengeluaran' ? 'text-rose-500 w-3' : 'text-slate-400 w-3'} />
                {FILTER_LABEL[f]}
              </button>
            ))}
          </div>
          <div className="hidden sm:flex bg-white border-2 border-slate-200 p-1 rounded-2xl gap-0.5">
            {['semua', 'pemasukan', 'pengeluaran'].map(f => (
              <button key={f} onClick={() => setFilterType(f)}
                className={`px-4 py-1.5 rounded-xl text-xs font-bold transition-all capitalize ${filterType === f ? 'bg-slate-900 text-white shadow-sm' : 'text-slate-500 hover:text-slate-800 hover:bg-slate-100'}`}>
                {FILTER_LABEL[f]}
              </button>
            ))}
          </div>
        </div>

        <div className="relative flex-1 min-w-[160px]">
          <FontAwesomeIcon icon={faMagnifyingGlass} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 text-xs" />
          <input type="text" placeholder="Cari transaksi..." value={searchTerm} onChange={e => setSearchTerm(e.target.value)}
            className="w-full h-10 pl-9 pr-8 bg-white border-2 border-slate-200 rounded-2xl text-xs font-medium focus:outline-none focus:border-emerald-400 focus:ring-4 focus:ring-emerald-500/10 transition-all placeholder:text-slate-400" />
          {searchTerm && (
            <button onClick={() => setSearchTerm('')} className="absolute right-3 top-1/2 -translate-y-1/2 h-5 w-5 bg-slate-100 hover:bg-slate-200 rounded-md flex items-center justify-center text-slate-400">
              <FontAwesomeIcon icon={faXmark} className="text-xs" />
            </button>
          )}
        </div>

        <input type="month" value={filterMonth} onChange={e => setFilterMonth(e.target.value)}
          className="h-10 px-3 bg-white border-2 border-slate-200 rounded-2xl text-xs font-medium text-slate-700 focus:outline-none focus:border-emerald-400 transition-all cursor-pointer" />
        {filterMonth && (
          <button onClick={() => setFilterMonth('')}
            className="h-10 px-3.5 bg-rose-50 border-2 border-rose-200 text-rose-600 hover:bg-rose-100 font-bold text-xs rounded-2xl transition-all">
            Reset
          </button>
        )}
      </div>

      {loading ? (
        <div className="py-20 flex flex-col items-center justify-center gap-3 text-slate-400">
          <div className="h-14 w-14 bg-emerald-50 rounded-2xl flex items-center justify-center">
            <FontAwesomeIcon icon={faCircleNotch} spin className="text-2xl text-emerald-500" />
          </div>
          <p className="text-sm font-bold text-slate-500">Menyiapkan data...</p>
        </div>
      ) : filteredTx.length === 0 ? (
        <div className="py-20 flex flex-col items-center justify-center bg-white rounded-3xl border-2 border-dashed border-slate-200">
          <div className="h-16 w-16 bg-slate-100 rounded-2xl flex items-center justify-center mb-4">
            <FontAwesomeIcon icon={searchTerm ? faMagnifyingGlass : faBoxOpen} className="text-2xl text-slate-300" />
          </div>
          <p className="text-base font-bold text-slate-600">{searchTerm ? 'Transaksi tidak ditemukan' : 'Belum ada transaksi'}</p>
          <p className="text-sm mt-1 text-slate-400">{searchTerm ? `Tidak ada hasil untuk "${searchTerm}"` : 'Mulai catat arus kas Anda!'}</p>
          {searchTerm && (
            <button onClick={() => setSearchTerm('')} className="mt-4 px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-600 text-xs font-bold rounded-xl transition-all">
              Hapus pencarian
            </button>
          )}
        </div>
      ) : (
        <div className="grid gap-2">
          {filteredTx.map(tx => {
            const wallet = wallets.find(w => w.id === tx.wallet_id);
            return (
              <div key={tx.id} className="flex items-center gap-3 px-4 py-3.5 bg-white rounded-2xl border-2 border-slate-100 hover:border-slate-200 shadow-sm hover:shadow-md transition-all group">
                <div className={`h-10 w-10 rounded-2xl flex items-center justify-center text-sm flex-shrink-0 transition-transform group-hover:scale-110 ${tx.type === 'pemasukan' ? 'bg-emerald-50 text-emerald-600' : 'bg-rose-50 text-rose-600'}`}>
                  <FontAwesomeIcon icon={tx.type === 'pemasukan' ? faArrowTrendUp : faArrowTrendDown} />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-bold text-slate-900 truncate">{tx.description || tx.category}</p>
                  <div className="flex items-center gap-1.5 mt-0.5 flex-wrap">
                    <span className={`inline-flex items-center px-2 py-0.5 rounded-md text-xs font-bold ${tx.type === 'pemasukan' ? 'bg-emerald-50 text-emerald-600' : 'bg-rose-50 text-rose-600'}`}>
                      {tx.category}
                    </span>
                    {wallet && (
                      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-xs font-semibold bg-slate-100 text-slate-500">
                        <FontAwesomeIcon icon={WALLET_ICONS[wallet.type] || faWallet} className="text-[10px]" />
                        {wallet.name}
                      </span>
                    )}
                    <span className="text-xs text-slate-400 font-medium">· {formatTanggal(tx.date)}</span>
                  </div>
                </div>
                <div className="text-right flex flex-col items-end gap-1 flex-shrink-0">
                  <p className={`text-sm font-black ${tx.type === 'pemasukan' ? 'text-emerald-600' : 'text-rose-600'}`}>
                    {tx.type === 'pemasukan' ? '+' : '-'}{formatRupiah(tx.amount)}
                  </p>
                  <button onClick={() => setDeleteTarget(tx.id)}
                    className="text-xs font-bold text-slate-300 hover:text-rose-500 transition-all opacity-100 md:opacity-0 md:group-hover:opacity-100 px-2 py-0.5 rounded-lg hover:bg-rose-50">
                    Hapus
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );

  const renderChart = () => (
    <div className="space-y-6">
      <div>
        <h2 className="text-lg font-extrabold text-slate-900">Grafik Keuangan</h2>
        <p className="text-xs text-slate-400 font-medium mt-0.5">Berdasarkan data yang difilter</p>
      </div>

      <div className="bg-white rounded-3xl border-2 border-slate-100 p-6">
        <h3 className="text-sm font-extrabold text-slate-700 mb-5">Tren 6 Bulan Terakhir</h3>
        {transactions.length === 0 ? (
          <div className="h-48 flex items-center justify-center text-slate-400 text-sm font-medium">Belum ada data</div>
        ) : (
          <ResponsiveContainer width="100%" height={220}>
            <BarChart data={monthlyTrend} barCategoryGap="30%" barGap={4}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" vertical={false} />
              <XAxis dataKey="label" tick={{ fontSize: 11, fill: '#94a3b8', fontWeight: 600 }} axisLine={false} tickLine={false} />
              <YAxis tickFormatter={v => `${(v / 1e6).toFixed(1)}M`} tick={{ fontSize: 10, fill: '#94a3b8' }} axisLine={false} tickLine={false} width={40} />
              <Tooltip content={<CustomTooltip />} cursor={{ fill: '#f8fafc', radius: 8 }} />
              <Bar dataKey="pemasukan" name="Pemasukan" fill="#10b981" radius={[6, 6, 0, 0]} />
              <Bar dataKey="pengeluaran" name="Pengeluaran" fill="#f43f5e" radius={[6, 6, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        )}
        <div className="flex items-center gap-4 mt-2 justify-center">
          <div className="flex items-center gap-1.5"><div className="h-3 w-3 rounded-full bg-emerald-500" /><span className="text-xs text-slate-500 font-medium">Pemasukan</span></div>
          <div className="flex items-center gap-1.5"><div className="h-3 w-3 rounded-full bg-rose-500" /><span className="text-xs text-slate-500 font-medium">Pengeluaran</span></div>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="bg-white rounded-3xl border-2 border-slate-100 p-6">
          <h3 className="text-sm font-extrabold text-slate-700 mb-4">Pengeluaran per Kategori</h3>
          {pengeluaranByKat.length === 0 ? (
            <div className="h-40 flex items-center justify-center text-slate-400 text-xs font-medium">Belum ada data pengeluaran</div>
          ) : (
            <>
              <ResponsiveContainer width="100%" height={180}>
                <PieChart>
                  <Pie data={pengeluaranByKat} cx="50%" cy="50%" innerRadius={50} outerRadius={80} paddingAngle={3} dataKey="value">
                    {pengeluaranByKat.map((_, i) => <Cell key={i} fill={CHART_COLORS[i % CHART_COLORS.length]} />)}
                  </Pie>
                  <Tooltip content={<CustomTooltip />} />
                </PieChart>
              </ResponsiveContainer>
              <div className="space-y-1.5 mt-2">
                {pengeluaranByKat.slice(0, 5).map((item, i) => (
                  <div key={i} className="flex items-center justify-between text-xs">
                    <div className="flex items-center gap-2">
                      <div className="h-2.5 w-2.5 rounded-full flex-shrink-0" style={{ background: CHART_COLORS[i % CHART_COLORS.length] }} />
                      <span className="font-medium text-slate-600">{item.name}</span>
                    </div>
                    <span className="font-bold text-slate-800">{formatRupiah(item.value)}</span>
                  </div>
                ))}
              </div>
            </>
          )}
        </div>

        <div className="bg-white rounded-3xl border-2 border-slate-100 p-6">
          <h3 className="text-sm font-extrabold text-slate-700 mb-4">Pemasukan per Kategori</h3>
          {pemasukanByKat.length === 0 ? (
            <div className="h-40 flex items-center justify-center text-slate-400 text-xs font-medium">Belum ada data pemasukan</div>
          ) : (
            <>
              <ResponsiveContainer width="100%" height={180}>
                <PieChart>
                  <Pie data={pemasukanByKat} cx="50%" cy="50%" innerRadius={50} outerRadius={80} paddingAngle={3} dataKey="value">
                    {pemasukanByKat.map((_, i) => <Cell key={i} fill={CHART_COLORS[i % CHART_COLORS.length]} />)}
                  </Pie>
                  <Tooltip content={<CustomTooltip />} />
                </PieChart>
              </ResponsiveContainer>
              <div className="space-y-1.5 mt-2">
                {pemasukanByKat.slice(0, 5).map((item, i) => (
                  <div key={i} className="flex items-center justify-between text-xs">
                    <div className="flex items-center gap-2">
                      <div className="h-2.5 w-2.5 rounded-full flex-shrink-0" style={{ background: CHART_COLORS[i % CHART_COLORS.length] }} />
                      <span className="font-medium text-slate-600">{item.name}</span>
                    </div>
                    <span className="font-bold text-slate-800">{formatRupiah(item.value)}</span>
                  </div>
                ))}
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );

  const renderBudget = () => (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-lg font-extrabold text-slate-900">Anggaran Bulanan</h2>
          <p className="text-xs text-slate-400 font-medium mt-0.5">
            Berdasarkan pengeluaran bulan {new Date().toLocaleDateString('id-ID', { month: 'long', year: 'numeric' })}
          </p>
        </div>
        <button onClick={() => setShowBudgetModal(true)}
          className="flex items-center gap-2 px-4 py-2.5 bg-slate-900 hover:bg-slate-700 text-white text-xs font-bold rounded-2xl transition-all shadow-lg shadow-slate-900/20">
          <FontAwesomeIcon icon={faPlus} />
          <span>Atur Anggaran</span>
        </button>
      </div>

      {budgetProgress.length === 0 ? (
        <div className="py-20 flex flex-col items-center justify-center bg-white rounded-3xl border-2 border-dashed border-slate-200">
          <div className="h-16 w-16 bg-indigo-50 rounded-2xl flex items-center justify-center mb-4">
            <FontAwesomeIcon icon={faBullseye} className="text-2xl text-indigo-300" />
          </div>
          <p className="text-base font-bold text-slate-600">Belum ada anggaran</p>
          <p className="text-sm mt-1 text-slate-400">Atur batas pengeluaran per kategori</p>
          <button onClick={() => setShowBudgetModal(true)}
            className="mt-4 px-5 py-2.5 bg-slate-900 hover:bg-slate-700 text-white text-xs font-bold rounded-xl transition-all">
            Mulai sekarang
          </button>
        </div>
      ) : (
        <div className="grid gap-3">
          {budgetProgress.map((b, i) => (
            <div key={i} className={`bg-white rounded-2xl border-2 p-5 transition-all ${b.over ? 'border-rose-200' : b.warn ? 'border-amber-200' : 'border-slate-100'}`}>
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-2.5">
                  <div className={`h-9 w-9 rounded-xl flex items-center justify-center text-sm ${b.over ? 'bg-rose-100 text-rose-600' : b.warn ? 'bg-amber-100 text-amber-600' : 'bg-slate-100 text-slate-600'}`}>
                    <FontAwesomeIcon icon={b.over ? faTriangleExclamation : b.warn ? faBell : faCheckCircle} />
                  </div>
                  <div>
                    <p className="text-sm font-extrabold text-slate-900">{b.category}</p>
                    <p className="text-xs text-slate-400 font-medium mt-0.5">
                      {formatRupiah(b.spent)} / {formatRupiah(b.limit)}
                    </p>
                  </div>
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
                <div
                  className={`h-full rounded-full transition-all duration-700 ${b.over ? 'bg-rose-500 animate-pulse' : b.warn ? 'bg-amber-400' : 'bg-emerald-500'}`}
                  style={{ width: `${b.pct}%` }}
                />
              </div>
              <div className="flex justify-between mt-2">
                <span className="text-xs text-slate-400 font-medium">
                  Sisa: <span className={`font-bold ${b.over ? 'text-rose-500' : 'text-slate-700'}`}>
                    {b.over ? `-${formatRupiah(b.spent - b.limit)}` : formatRupiah(b.limit - b.spent)}
                  </span>
                </span>
                <span className="text-xs text-slate-400 font-medium">Limit: {formatRupiah(b.limit)}</span>
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
          <h2 className="text-lg font-extrabold text-slate-900">Multi-Dompet</h2>
          <p className="text-xs text-slate-400 font-medium mt-0.5">Pisahkan sumber keuangan Anda</p>
        </div>
        <button onClick={() => { setEditingWallet(null); setWalletForm({ name: '', type: 'cash', color: '#10b981', balance: '' }); setShowWalletModal(true); }}
          className="flex items-center gap-2 px-4 py-2.5 bg-slate-900 hover:bg-slate-700 text-white text-xs font-bold rounded-2xl transition-all shadow-lg shadow-slate-900/20">
          <FontAwesomeIcon icon={faPlus} />
          <span>Tambah Dompet</span>
        </button>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        {walletBalances.map(w => (
          <div key={w.id} className="bg-white rounded-2xl border-2 border-slate-100 hover:border-slate-200 p-5 transition-all group">
            <div className="flex items-start justify-between mb-4">
              <div className="flex items-center gap-3">
                <div className="h-11 w-11 rounded-2xl flex items-center justify-center text-white text-base shadow-lg" style={{ background: `linear-gradient(135deg, ${w.color}, ${w.color}cc)` }}>
                  <FontAwesomeIcon icon={WALLET_ICONS[w.type] || faWallet} />
                </div>
                <div>
                  <p className="text-sm font-extrabold text-slate-900">{w.name}</p>
                  <p className="text-xs text-slate-400 font-medium capitalize mt-0.5">
                    {w.type === 'cash' ? 'Uang Tunai' : w.type === 'bank' ? 'Rekening Bank' : w.type === 'ewallet' ? 'E-Wallet' : 'Kartu Kredit'}
                  </p>
                </div>
              </div>
              <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-all">
                <button onClick={() => { setEditingWallet(w.id); setWalletForm({ name: w.name, type: w.type, color: w.color, balance: w.balance }); setShowWalletModal(true); }}
                  className="h-7 w-7 bg-slate-100 hover:bg-slate-200 rounded-lg flex items-center justify-center text-slate-400 text-xs transition-all">
                  <FontAwesomeIcon icon={faPencil} />
                </button>
                <button onClick={() => handleDeleteWallet(w.id)}
                  className="h-7 w-7 bg-slate-100 hover:bg-rose-100 rounded-lg flex items-center justify-center text-slate-400 hover:text-rose-500 text-xs transition-all">
                  <FontAwesomeIcon icon={faTrash} />
                </button>
              </div>
            </div>
            <div>
              <p className="text-xs text-slate-400 font-medium uppercase tracking-wider mb-1">Saldo</p>
              <p className={`text-xl font-black tracking-tight ${w.balance >= 0 ? 'text-slate-900' : 'text-rose-600'}`}>
                {formatRupiah(w.balance)}
              </p>
            </div>
            <div className="flex gap-3 mt-4 pt-4 border-t border-slate-100">
              <div className="flex-1">
                <p className="text-xs text-slate-400 font-medium mb-0.5">Masuk</p>
                <p className="text-xs font-black text-emerald-600">
                  +{formatRupiah(transactions.filter(t => t.wallet_id === w.id && t.type === 'pemasukan').reduce((s, t) => s + t.amount, 0))}
                </p>
              </div>
              <div className="w-px bg-slate-100" />
              <div className="flex-1">
                <p className="text-xs text-slate-400 font-medium mb-0.5">Keluar</p>
                <p className="text-xs font-black text-rose-600">
                  -{formatRupiah(transactions.filter(t => t.wallet_id === w.id && t.type === 'pengeluaran').reduce((s, t) => s + t.amount, 0))}
                </p>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-slate-50 font-sans pb-20">

      <nav className="bg-white/80 backdrop-blur-xl border-b border-slate-200/60 px-4 sm:px-6 py-4 sticky top-0 z-20 shadow-sm">
        <div className="max-w-5xl mx-auto flex justify-between items-center">
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 bg-gradient-to-br from-emerald-500 to-teal-600 rounded-xl flex items-center justify-center text-white shadow-lg shadow-emerald-200">
              <FontAwesomeIcon icon={faWallet} />
            </div>
            <div>
              <span className="font-black text-xl tracking-tight text-slate-900">FinTrack</span>
              <p className="text-xs text-slate-400 font-medium -mt-0.5 hidden sm:block">Kelola keuangan Anda</p>
            </div>
          </div>
          <button onClick={handleLogout}
            className="flex items-center gap-2 text-sm text-slate-500 hover:text-rose-600 font-bold transition-all px-3.5 py-2 rounded-xl hover:bg-rose-50 border border-transparent hover:border-rose-100">
            <span className="hidden sm:inline text-xs">Keluar</span>
            <FontAwesomeIcon icon={faRightFromBracket} />
          </button>
        </div>
      </nav>

      <div className="bg-white border-b border-slate-200/60 sticky top-[73px] z-10">
        <div className="max-w-5xl mx-auto px-4 sm:px-6">
          <div className="flex gap-0.5 overflow-x-auto scrollbar-hide">
            {TABS.map(tab => (
              <button key={tab.id} onClick={() => setActiveTab(tab.id)}
                className={`flex items-center gap-2 px-4 py-3.5 text-xs font-bold whitespace-nowrap border-b-2 transition-all ${activeTab === tab.id ? 'border-emerald-500 text-emerald-600' : 'border-transparent text-slate-500 hover:text-slate-700 hover:bg-slate-50'}`}>
                <FontAwesomeIcon icon={tab.icon} className="text-xs" />
                {tab.label}
              </button>
            ))}
          </div>
        </div>
      </div>

      <main className="max-w-5xl mx-auto px-4 sm:px-6 py-7 space-y-6">
        {renderSummaryCards()}
        <div className="h-px bg-slate-200" />
        {activeTab === 'dashboard' && renderTransactions()}
        {activeTab === 'chart' && renderChart()}
        {activeTab === 'budget' && renderBudget()}
        {activeTab === 'wallets' && renderWallets()}
      </main>

      {showModal && (
        <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm flex items-end sm:items-center justify-center z-50 p-0 sm:p-4">
          <div className="bg-white rounded-t-3xl sm:rounded-3xl shadow-2xl w-full sm:max-w-lg overflow-hidden">
            <div className="px-6 py-5 border-b border-slate-100 flex justify-between items-center">
              <div>
                <h3 className="text-base font-extrabold text-slate-900">Catat Transaksi</h3>
                <p className="text-xs text-slate-400 mt-0.5">Isi detail transaksi di bawah ini</p>
              </div>
              <button onClick={() => setShowModal(false)}
                className="h-9 w-9 bg-slate-100 rounded-xl flex items-center justify-center text-slate-400 hover:text-rose-500 hover:bg-rose-50 transition-all">
                <FontAwesomeIcon icon={faXmark} />
              </button>
            </div>
            <form onSubmit={handleSubmit} className="p-6 space-y-4">
              {/* Type toggle */}
              <div>
                <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">Jenis</label>
                <div className="flex bg-slate-100 p-1.5 rounded-2xl gap-1">
                  {['pemasukan', 'pengeluaran'].map(t => (
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
                    className="w-full px-3.5 py-2.5 bg-slate-50 border-2 border-slate-200 rounded-xl text-xs font-medium focus:outline-none focus:bg-white focus:border-emerald-400 transition-all cursor-pointer">
                    {KATEGORI[form.type].map(k => <option key={k} value={k}>{k}</option>)}
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">Tanggal</label>
                  <input type="date" value={form.date} onChange={e => setForm({ ...form, date: e.target.value })}
                    className="w-full px-3.5 py-2.5 bg-slate-50 border-2 border-slate-200 rounded-xl text-xs font-medium focus:outline-none focus:bg-white focus:border-emerald-400 transition-all" />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">Dari / Ke Dompet</label>
                <div className="grid grid-cols-2 gap-2">
                  {wallets.map(w => (
                    <button key={w.id} type="button" onClick={() => setForm({ ...form, wallet_id: w.id })}
                      className={`flex items-center gap-2.5 px-3.5 py-2.5 rounded-xl border-2 text-xs font-bold transition-all text-left ${form.wallet_id === w.id ? 'border-emerald-400 bg-emerald-50 text-emerald-700' : 'border-slate-200 bg-white text-slate-600 hover:border-slate-300'}`}>
                      <div className="h-6 w-6 rounded-lg flex items-center justify-center text-white text-xs flex-shrink-0" style={{ background: w.color }}>
                        <FontAwesomeIcon icon={WALLET_ICONS[w.type] || faWallet} />
                      </div>
                      <span className="truncate">{w.name}</span>
                      {form.wallet_id === w.id && <FontAwesomeIcon icon={faCheck} className="ml-auto text-emerald-500 flex-shrink-0" />}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">
                  Deskripsi <span className="text-slate-400 font-normal normal-case">(opsional)</span>
                </label>
                <input type="text" value={form.description} onChange={e => setForm({ ...form, description: e.target.value })}
                  placeholder="Contoh: Beli kopi senja..."
                  className="w-full px-3.5 py-2.5 bg-slate-50 border-2 border-slate-200 rounded-xl text-xs font-medium focus:outline-none focus:bg-white focus:border-emerald-400 transition-all placeholder:text-slate-300" />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">Jumlah</label>
                <div className="relative">
                  <span className="absolute left-4 top-1/2 -translate-y-1/2 font-bold text-slate-400 text-sm">Rp</span>
                  <input type="number" value={form.amount} onChange={e => setForm({ ...form, amount: e.target.value })}
                    placeholder="0" min="1" required
                    className="w-full pl-12 pr-4 py-3.5 bg-slate-50 border-2 border-slate-200 rounded-xl text-xl font-black text-slate-900 focus:outline-none focus:bg-white focus:border-emerald-400 transition-all placeholder:text-slate-300" />
                </div>
              </div>

              <div className="flex gap-3 pt-1">
                <button type="button" onClick={() => setShowModal(false)}
                  className="flex-1 py-3 rounded-2xl text-xs font-bold bg-slate-100 text-slate-600 hover:bg-slate-200 transition-all">
                  Batal
                </button>
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
              <button onClick={() => setShowWalletModal(false)}
                className="h-9 w-9 bg-slate-100 rounded-xl flex items-center justify-center text-slate-400 hover:text-rose-500 hover:bg-rose-50 transition-all">
                <FontAwesomeIcon icon={faXmark} />
              </button>
            </div>
            <div className="p-6 space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">Nama Dompet</label>
                <input type="text" value={walletForm.name} onChange={e => setWalletForm({ ...walletForm, name: e.target.value })}
                  placeholder="e.g. Bank BCA, Gopay..."
                  className="w-full px-4 py-3 bg-slate-50 border-2 border-slate-200 rounded-xl text-sm font-medium focus:outline-none focus:bg-white focus:border-emerald-400 transition-all" />
              </div>
              <div>
                <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">Tipe</label>
                <div className="grid grid-cols-4 gap-2">
                  {[{ val: 'cash', label: 'Tunai', icon: faMoneyBillWave }, { val: 'bank', label: 'Bank', icon: faBuildingColumns }, { val: 'ewallet', label: 'E-Wallet', icon: faCoins }, { val: 'card', label: 'Kartu', icon: faCreditCard }].map(t => (
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
                  {['#10b981', '#6366f1', '#f59e0b', '#f43f5e', '#8b5cf6', '#0ea5e9', '#14b8a6', '#ec4899'].map(c => (
                    <button key={c} type="button" onClick={() => setWalletForm({ ...walletForm, color: c })}
                      className={`h-8 w-8 rounded-xl transition-all ${walletForm.color === c ? 'ring-2 ring-offset-2 ring-slate-800 scale-110' : 'hover:scale-105'}`}
                      style={{ background: c }} />
                  ))}
                </div>
              </div>
              <div>
                <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">Saldo Awal (Rp)</label>
                <div className="relative">
                  <span className="absolute left-4 top-1/2 -translate-y-1/2 font-bold text-slate-400 text-sm">Rp</span>
                  <input type="number" value={walletForm.balance} onChange={e => setWalletForm({ ...walletForm, balance: e.target.value })}
                    placeholder="0" min="0"
                    className="w-full pl-12 pr-4 py-3 bg-slate-50 border-2 border-slate-200 rounded-xl text-base font-bold text-slate-900 focus:outline-none focus:bg-white focus:border-emerald-400 transition-all" />
                </div>
              </div>
              <div className="flex gap-3 pt-1">
                <button type="button" onClick={() => setShowWalletModal(false)}
                  className="flex-1 py-3 rounded-2xl text-xs font-bold bg-slate-100 text-slate-600 hover:bg-slate-200 transition-all">Batal</button>
                <button type="button" onClick={handleSaveWallet}
                  className="flex-1 py-3 rounded-2xl text-xs font-bold text-white bg-slate-900 hover:bg-slate-700 transition-all shadow-lg shadow-slate-900/20">
                  {editingWallet ? 'Simpan Perubahan' : 'Tambah Dompet'}
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
              <button onClick={() => setShowBudgetModal(false)}
                className="h-9 w-9 bg-slate-100 rounded-xl flex items-center justify-center text-slate-400 hover:text-rose-500 hover:bg-rose-50 transition-all">
                <FontAwesomeIcon icon={faXmark} />
              </button>
            </div>
            <div className="p-6 space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">Kategori Pengeluaran</label>
                <select value={budgetForm.category} onChange={e => setBudgetForm({ ...budgetForm, category: e.target.value })}
                  className="w-full px-4 py-3 bg-slate-50 border-2 border-slate-200 rounded-xl text-sm font-medium focus:outline-none focus:bg-white focus:border-emerald-400 transition-all">
                  {KATEGORI.pengeluaran.map(k => <option key={k} value={k}>{k}</option>)}
                </select>
              </div>
              <div>
                <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">Batas Maksimal / Bulan</label>
                <div className="relative">
                  <span className="absolute left-4 top-1/2 -translate-y-1/2 font-bold text-slate-400 text-sm">Rp</span>
                  <input type="number" value={budgetForm.limit} onChange={e => setBudgetForm({ ...budgetForm, limit: e.target.value })}
                    placeholder="0" min="1"
                    className="w-full pl-12 pr-4 py-3.5 bg-slate-50 border-2 border-slate-200 rounded-xl text-xl font-black focus:outline-none focus:bg-white focus:border-emerald-400 transition-all" />
                </div>
              </div>
              <div className="flex gap-3 pt-1">
                <button type="button" onClick={() => setShowBudgetModal(false)}
                  className="flex-1 py-3 rounded-2xl text-xs font-bold bg-slate-100 text-slate-600 hover:bg-slate-200 transition-all">Batal</button>
                <button type="button" onClick={handleSaveBudget}
                  className="flex-1 py-3 rounded-2xl text-xs font-bold text-white bg-slate-900 hover:bg-slate-700 transition-all shadow-lg">
                  Simpan Anggaran
                </button>
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
            <p className="text-sm text-slate-500 leading-relaxed mb-6">Tindakan ini tidak dapat dibatalkan.</p>
            <div className="flex gap-3">
              <button onClick={() => setDeleteTarget(null)} className="flex-1 py-3 rounded-2xl text-xs font-bold bg-slate-100 text-slate-600 hover:bg-slate-200 transition-all">Batal</button>
              <button onClick={executeDelete} className="flex-1 py-3 rounded-2xl text-xs font-bold bg-rose-600 text-white hover:bg-rose-700 transition-all">Ya, Hapus</button>
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
              className="w-full py-3 rounded-2xl text-xs font-bold bg-slate-900 text-white hover:bg-slate-700 transition-all shadow-lg">
              Mengerti
            </button>
          </div>
        </div>
      )}

      {successModal.show && (
        <div className="fixed bottom-24 left-1/2 -translate-x-1/2 z-50 pointer-events-none">
          <div className="bg-slate-900 text-white rounded-2xl shadow-2xl px-5 py-3.5 flex items-center gap-3 pointer-events-auto">
            <div className="h-7 w-7 bg-emerald-500 rounded-lg flex items-center justify-center flex-shrink-0">
              <FontAwesomeIcon icon={faCheckCircle} className="text-xs" />
            </div>
            <p className="text-xs font-bold">{successModal.message}</p>
          </div>
        </div>
      )}
    </div>
  );
}