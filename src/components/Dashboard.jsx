import { useState, useEffect, useCallback, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faPlus, faCircleNotch } from '@fortawesome/free-solid-svg-icons';

import Header    from './dashboard/Header';
import Sidebar   from './dashboard/Sidebar';
import BottomNav from './dashboard/BottomNav';

import SummaryCards from './dashboard/SummaryCards';
import { DashboardView, ChartView, BudgetView, WalletsView } from './dashboard/TableViews';
import ImportView from './dashboard/ImportView';

import {
  TransactionModal, WalletModal, BudgetModal,
  DeleteConfirmModal, ErrorModal, SuccessToast, FilterModal,
} from './dashboard/Modals';

const API = 'https://shifty-carey-pentahydroxy.ngrok-free.dev';

const DEFAULT_WALLETS = [
  { id: 'w1', name: 'Dompet Tunai', type: 'cash',  color: '#10b981', balance: 0 },
  { id: 'w2', name: 'Bank BCA',     type: 'bank',  color: '#6366f1', balance: 0 },
];

function parseCSV(text) {
  const lines = text.trim().split('\n').filter(l => l.trim());
  if (lines.length < 2) return { headers: [], rows: [] };
  const parseRow = (line) => {
    const result = []; let cur = '', inQ = false;
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
    const vals = parseRow(l); const obj = {};
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

function parseNominal(str) {
  if (!str) return 0;
  return parseFloat(str.replace(/[Rp\s.]/g, '').replace(',', '.')) || 0;
}

export default function Dashboard() {
  const navigate = useNavigate();

  const [transactions, setTransactions] = useState([]);
  const [loading, setLoading]           = useState(true);
  const [userName, setUserName]         = useState(() => localStorage.getItem('ft_username') || '');

  const [activeTab, setActiveTab]       = useState('dashboard');
  const [userMenuOpen, setUserMenuOpen] = useState(false);

  const [showModal, setShowModal]             = useState(false);
  const [submitting, setSubmitting]           = useState(false);
  const [showWalletModal, setShowWalletModal] = useState(false);
  const [showBudgetModal, setShowBudgetModal] = useState(false);
  const [showFilterModal, setShowFilterModal] = useState(false);
  const [deleteTarget, setDeleteTarget]       = useState(null);
  const [errorModal, setErrorModal]           = useState({ show: false, message: '' });
  const [successToast, setSuccessToast]       = useState({ show: false, message: '' });

  const [filterType, setFilterType]       = useState('semua');
  const [searchTerm, setSearchTerm]       = useState('');
  const [filterMonth, setFilterMonth]     = useState('');
  const [tempFilterType, setTempFilterType]   = useState('semua');
  const [tempFilterMonth, setTempFilterMonth] = useState('');
  const [tempSearch, setTempSearch]           = useState('');

  const [form, setForm] = useState({
    type: 'pemasukan', category: 'Gaji', description: '',
    amount: '', date: new Date().toISOString().split('T')[0], wallet_id: 'w1',
  });

  const [wallets, setWallets] = useState(() => {
    try { return JSON.parse(localStorage.getItem('ft_wallets')) || DEFAULT_WALLETS; } catch { return DEFAULT_WALLETS; }
  });
  const [walletForm, setWalletForm]   = useState({ name: '', type: 'cash', color: '#10b981', balance: '' });
  const [editingWallet, setEditingWallet] = useState(null);

  const [budgets, setBudgets] = useState(() => {
    try { return JSON.parse(localStorage.getItem('ft_budgets')) || []; } catch { return []; }
  });
  const [budgetForm, setBudgetForm] = useState({ category: 'Makanan', limit: '' });

  const [importStep, setImportStep]       = useState(1);
  const [importBank, setImportBank]       = useState(null);
  const [importFile, setImportFile]       = useState(null);
  const [importCSV, setImportCSV]         = useState({ headers: [], rows: [] });
  const [importMapping, setImportMapping] = useState({ date: '', description: '', debit: '', credit: '' });
  const [importPreview, setImportPreview] = useState([]);
  const [importWalletId, setImportWalletId] = useState('');
  const [importLoading, setImportLoading] = useState(false);

  const token = localStorage.getItem('token');
  const authHeaders = useMemo(() => ({
    'Content-Type': 'application/json',
    'Authorization': `Bearer ${token}`,
    'ngrok-skip-browser-warning': '17317',
  }), [token]);

  const showError   = (msg) => setErrorModal({ show: true, message: msg });
  const showSuccess = (msg) => {
    setSuccessToast({ show: true, message: msg });
    setTimeout(() => setSuccessToast({ show: false, message: '' }), 2800);
  };

  const handleLogout = useCallback(() => {
    localStorage.removeItem('token');
    navigate('/login', { replace: true });
  }, [navigate]);

  const navigateTo = (tab) => setActiveTab(tab);

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch(`${API}/transactions`, { headers: authHeaders });
      if (res.status === 401) { handleLogout(); return; }
      const data = await res.json();
      setTransactions(data.transactions || []);
      if (data.user?.name) {
        setUserName(data.user.name);
        localStorage.setItem('ft_username', data.user.name);
      }
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
      if (userMenuOpen && !e.target.closest('[data-user-menu]')) setUserMenuOpen(false);
    };
    document.addEventListener('mousedown', fn);
    return () => document.removeEventListener('mousedown', fn);
  }, [userMenuOpen]);

  const filteredTx = useMemo(() => transactions.filter(t => {
    const matchType   = filterType === 'semua' || t.type === filterType;
    const kw          = searchTerm.toLowerCase();
    const matchSearch = !kw || t.description?.toLowerCase().includes(kw) || t.category?.toLowerCase().includes(kw);
    const matchMonth  = !filterMonth || t.date.startsWith(filterMonth);
    return matchType && matchSearch && matchMonth;
  }), [transactions, filterType, searchTerm, filterMonth]);

  const dynamicPemasukan  = useMemo(() => filteredTx.filter(t => t.type === 'pemasukan').reduce((s, t)  => s + t.amount, 0), [filteredTx]);
  const dynamicPengeluaran = useMemo(() => filteredTx.filter(t => t.type === 'pengeluaran').reduce((s, t) => s + t.amount, 0), [filteredTx]);
  const dynamicSaldo      = dynamicPemasukan - dynamicPengeluaran;
  const isFiltered        = filterType !== 'semua' || searchTerm || filterMonth;
  const activeFilterCount = (filterType !== 'semua' ? 1 : 0) + (filterMonth ? 1 : 0) + (searchTerm ? 1 : 0);

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

  const monthlyTrend = useMemo(() => Array.from({ length: 6 }, (_, i) => {
    const d = new Date(); d.setMonth(d.getMonth() - (5 - i));
    const key   = d.toISOString().slice(0, 7);
    const label = d.toLocaleDateString('id-ID', { month: 'short', year: '2-digit' });
    const pemasukan    = transactions.filter(t => t.type === 'pemasukan'    && t.date.startsWith(key)).reduce((s, t) => s + t.amount, 0);
    const pengeluaran  = transactions.filter(t => t.type === 'pengeluaran'  && t.date.startsWith(key)).reduce((s, t) => s + t.amount, 0);
    return { label, pemasukan, pengeluaran };
  }), [transactions]);

  const budgetProgress = useMemo(() => {
    const curMonth = new Date().toISOString().slice(0, 7);
    return budgets.map(b => {
      const spent = transactions.filter(t => t.type === 'pengeluaran' && t.category === b.category && t.date.startsWith(curMonth)).reduce((s, t) => s + t.amount, 0);
      const pct   = Math.min((spent / b.limit) * 100, 100);
      return { ...b, spent, pct, over: spent > b.limit, warn: !spent > b.limit && pct >= 80 };
    });
  }, [budgets, transactions]);

  const walletBalances = useMemo(() => wallets.map(w => {
    const income  = transactions.filter(t => t.wallet_id === w.id && t.type === 'pemasukan').reduce((s, t)  => s + t.amount, 0);
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
    const html = `<html xmlns:o="urn:schemas-microsoft-com:office:office" xmlns:x="urn:schemas-microsoft-com:office:excel"><head><meta charset="utf-8"></head><body><table><tr><td colspan="5" style="text-align:center;font-size:20pt;font-weight:900;padding:20px 0 4px">FinTrack</td></tr><tr><th style="background:#0f172a;color:#fff;padding:12px 14px;border:1px solid #1e293b;font-size:11px">Tanggal</th><th style="background:#0f172a;color:#fff;padding:12px 14px;border:1px solid #1e293b;font-size:11px">Jenis</th><th style="background:#0f172a;color:#fff;padding:12px 14px;border:1px solid #1e293b;font-size:11px">Kategori</th><th style="background:#0f172a;color:#fff;padding:12px 14px;border:1px solid #1e293b;font-size:11px">Deskripsi</th><th style="background:#0f172a;color:#fff;padding:12px 14px;border:1px solid #1e293b;font-size:11px">Nominal</th></tr>${rows}</table></body></html>`;
    const blob = new Blob([html], { type: 'application/vnd.ms-excel;charset=utf-8;' });
    const url  = URL.createObjectURL(blob);
    const a    = document.createElement('a'); a.href = url;
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
      const parsed = parseCSV(ev.target.result);
      setImportCSV(parsed);
      if (importBank && importBank.id !== 'custom') {
        const tmpl = importBank.columns;
        setImportMapping({
          date:        parsed.headers.find(h => h === tmpl.date)        || parsed.headers[0] || '',
          description: parsed.headers.find(h => h === tmpl.description) || parsed.headers[1] || '',
          debit:       parsed.headers.find(h => h === tmpl.debit)       || '',
          credit:      parsed.headers.find(h => h === tmpl.credit)      || '',
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
    const preview = importCSV.rows.map((row, i) => {
      const dateStr   = row[importMapping.date] || '';
      const desc      = row[importMapping.description] || '';
      const debit     = parseNominal(importMapping.debit  ? row[importMapping.debit]  || '' : '');
      const credit    = parseNominal(importMapping.credit ? row[importMapping.credit] || '' : '');
      const parsedDate = parseDate(dateStr);
      if (!parsedDate || (debit <= 0 && credit <= 0)) return null;
      return {
        _idx: i, date: parsedDate, description: desc,
        amount: debit > 0 ? debit : credit,
        type: debit > 0 ? 'pengeluaran' : 'pemasukan',
        category: 'Lainnya',
        wallet_id: importWalletId || wallets[0]?.id || 'w1',
        selected: true,
      };
    }).filter(Boolean);
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
  };

  const openFilterModal = () => {
    setTempFilterType(filterType);
    setTempFilterMonth(filterMonth);
    setTempSearch(searchTerm);
    setShowFilterModal(true);
  };

  return (
    <div className="min-h-screen bg-slate-50 font-sans">

      <Header
        userName={userName}
        userMenuOpen={userMenuOpen}
        setUserMenuOpen={setUserMenuOpen}
        handleLogout={handleLogout}
        setShowModal={setShowModal}
        navigateTo={navigateTo}
      />

      <div className="flex">
        <Sidebar activeTab={activeTab} navigateTo={navigateTo} handleLogout={handleLogout} />

        <main className="flex-1 min-w-0 px-6 pt-5 pb-24 md:pb-10 w-full">
          <SummaryCards
            loading={loading}
            dynamicPemasukan={dynamicPemasukan}
            dynamicPengeluaran={dynamicPengeluaran}
            dynamicSaldo={dynamicSaldo}
            isFiltered={isFiltered}
          />

          <div className="mt-6">
            {activeTab === 'dashboard' && (
              <DashboardView
                loading={loading}
                filteredTx={filteredTx}
                wallets={wallets}
                walletBalances={walletBalances}
                filterType={filterType}
                filterMonth={filterMonth}
                searchTerm={searchTerm}
                isFiltered={isFiltered}
                activeFilterCount={activeFilterCount}
                dynamicSaldo={dynamicSaldo}
                setFilterType={setFilterType}
                setFilterMonth={setFilterMonth}
                setSearchTerm={setSearchTerm}
                setShowModal={setShowModal}
                navigateTo={navigateTo}
                handleExport={handleExport}
                openFilterModal={openFilterModal}
                setDeleteTarget={setDeleteTarget}
              />
            )}
            {activeTab === 'chart' && (
              <ChartView
                transactions={transactions}
                pengeluaranByKat={pengeluaranByKat}
                pemasukanByKat={pemasukanByKat}
                monthlyTrend={monthlyTrend}
              />
            )}
            {activeTab === 'budget' && (
              <BudgetView
                budgetProgress={budgetProgress}
                setBudgets={setBudgets}
                setShowBudgetModal={setShowBudgetModal}
              />
            )}
            {activeTab === 'wallets' && (
              <WalletsView
                wallets={wallets}
                walletBalances={walletBalances}
                transactions={transactions}
                setWallets={setWallets}
                setEditingWallet={setEditingWallet}
                setWalletForm={setWalletForm}
                setShowWalletModal={setShowWalletModal}
              />
            )}
            {activeTab === 'import' && (
              <ImportView
                importStep={importStep}       setImportStep={setImportStep}
                importBank={importBank}       setImportBank={setImportBank}
                importFile={importFile}       setImportFile={setImportFile}
                importCSV={importCSV}         setImportCSV={setImportCSV}
                importMapping={importMapping} setImportMapping={setImportMapping}
                importPreview={importPreview} setImportPreview={setImportPreview}
                importWalletId={importWalletId} setImportWalletId={setImportWalletId}
                importLoading={importLoading}
                wallets={wallets}
                handleFileUpload={handleFileUpload}
                handleBuildPreview={handleBuildPreview}
                handleImportSubmit={handleImportSubmit}
                resetImport={resetImport}
                navigateTo={navigateTo}
              />
            )}
          </div>
        </main>
      </div>

      <BottomNav activeTab={activeTab} navigateTo={navigateTo} />

      {activeTab !== 'dashboard' && (
        <button
          onClick={() => setShowModal(true)}
          className="md:hidden fixed bottom-[72px] right-4 bg-emerald-500 hover:bg-emerald-600 text-white rounded-2xl shadow-xl shadow-emerald-500/40 flex items-center justify-center transition-all active:scale-95 z-30"
          style={{ height: 52, width: 52 }}
        >
          <FontAwesomeIcon icon={faPlus} className="text-lg" />
        </button>
      )}

      <TransactionModal
        show={showModal}
        onClose={() => setShowModal(false)}
        form={form}
        setForm={setForm}
        wallets={wallets}
        onSubmit={handleSubmit}
        submitting={submitting}
      />
      <WalletModal
        show={showWalletModal}
        onClose={() => setShowWalletModal(false)}
        walletForm={walletForm}
        setWalletForm={setWalletForm}
        editingWallet={editingWallet}
        onSave={handleSaveWallet}
      />
      <BudgetModal
        show={showBudgetModal}
        onClose={() => setShowBudgetModal(false)}
        budgetForm={budgetForm}
        setBudgetForm={setBudgetForm}
        onSave={handleSaveBudget}
      />
      <FilterModal
        show={showFilterModal}
        onClose={() => setShowFilterModal(false)}
        tempFilterType={tempFilterType}   setTempFilterType={setTempFilterType}
        tempFilterMonth={tempFilterMonth} setTempFilterMonth={setTempFilterMonth}
        tempSearch={tempSearch}           setTempSearch={setTempSearch}
        onApply={() => { setFilterType(tempFilterType); setFilterMonth(tempFilterMonth); setSearchTerm(tempSearch); setShowFilterModal(false); }}
        onReset={() => { setTempFilterType('semua'); setTempFilterMonth(''); setTempSearch(''); }}
      />
      <DeleteConfirmModal
        show={!!deleteTarget}
        onCancel={() => setDeleteTarget(null)}
        onConfirm={executeDelete}
      />
      <ErrorModal
        show={errorModal.show}
        message={errorModal.message}
        onClose={() => setErrorModal({ show: false, message: '' })}
      />
      <SuccessToast show={successToast.show} message={successToast.message} />
    </div>
  );
}