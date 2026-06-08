import React, { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { 
  faFilter,
  faWallet, 
  faRightFromBracket, 
  faArrowTrendUp, 
  faArrowTrendDown, 
  faPlus, 
  faXmark, 
  faBoxOpen, 
  faTriangleExclamation, 
  faCircleNotch,
  faScaleBalanced,
  faCheckCircle,
  faMagnifyingGlass,
  faChevronDown,
  faFileExport
} from '@fortawesome/free-solid-svg-icons';

const API = 'https://shifty-carey-pentahydroxy.ngrok-free.dev';

function formatRupiah(num) {
  return new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', minimumFractionDigits: 0 }).format(num);
}

function formatTanggal(dateStr) {
  return new Date(dateStr).toLocaleDateString('id-ID', { day: '2-digit', month: 'short', year: 'numeric' });
}

const KATEGORI = {
  pemasukan: ['Gaji', 'Freelance', 'Investasi', 'Bonus', 'Lainnya'],
  pengeluaran: ['Makanan', 'Minuman', 'Transportasi', 'Belanja', 'Tagihan', 'Kesehatan', 'Hiburan', 'Lainnya'],
};

const FILTER_LABEL = { semua: 'Semua', pemasukan: 'Pemasukan', pengeluaran: 'Pengeluaran' };

export default function Dashboard() {
  const navigate = useNavigate();
  const filterRef = useRef(null);
  const [summary, setSummary] = useState({ total_pemasukan: 0, total_pengeluaran: 0, saldo: 0 });
  const [transactions, setTransactions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [successModal, setSuccessModal] = useState({ show: false, message: '' });
  const [showModal, setShowModal] = useState(false);
  const [form, setForm] = useState({ type: 'pemasukan', category: 'Gaji', description: '', amount: '', date: new Date().toISOString().split('T')[0] });
  const [submitting, setSubmitting] = useState(false);
  const [filterType, setFilterType] = useState('semua');
  const [showFilter, setShowFilter] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [deleteTarget, setDeleteTarget] = useState(null);

  const token = localStorage.getItem('token');

  const authHeaders = useMemo(() => ({
    'Content-Type': 'application/json',
    'Authorization': `Bearer ${token}`,
    'ngrok-skip-browser-warning': '17317',
  }), [token]);

  const showSuccess = (message) => {
    setSuccessModal({ show: true, message });
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
      if (summaryRes.status === 401 || txRes.status === 401) {
        handleLogout();
        return;
      }
      const summaryData = await summaryRes.json();
      const txData = await txRes.json();
      setSummary(summaryData);
      setTransactions(txData.transactions || []);
    } catch {
      setError('Gagal memuat data. Periksa koneksi Anda.');
    } finally {
      setLoading(false);
    }
  }, [authHeaders, handleLogout]);

  useEffect(() => { fetchData(); }, [fetchData]);

  useEffect(() => {
    function handleClickOutside(e) {
      if (filterRef.current && !filterRef.current.contains(e.target)) {
        setShowFilter(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.amount || parseFloat(form.amount) <= 0) return;
    setSubmitting(true);
    setError('');
    try {
      const res = await fetch(`${API}/transactions`, {
        method: 'POST',
        headers: authHeaders,
        body: JSON.stringify({ ...form, amount: parseFloat(form.amount) }),
      });
      if (!res.ok) throw new Error('Gagal menyimpan');
      setShowModal(false);
      setForm({ type: 'pemasukan', category: 'Gaji', description: '', amount: '', date: new Date().toISOString().split('T')[0] });
      fetchData();
      showSuccess('Transaksi baru berhasil dicatat!');
    } catch {
      setError('Gagal menambah transaksi.');
    } finally {
      setSubmitting(false);
    }
  };

  const executeDelete = async () => {
    if (!deleteTarget) return;
    setError('');
    try {
      await fetch(`${API}/transactions/${deleteTarget}`, { method: 'DELETE', headers: authHeaders });
      fetchData();
      showSuccess('Transaksi berhasil dihapus!');
    } catch {
      setError('Gagal menghapus transaksi.');
    } finally {
      setDeleteTarget(null);
    }
  };

  const handleExportExcel = () => {
    if (filteredTx.length === 0) {
      setError('Tidak ada data transaksi untuk diekspor.');
      setTimeout(() => setError(''), 3000);
      return;
    }

    const tglCetak = new Date().toLocaleDateString('id-ID', { day: '2-digit', month: 'long', year: 'numeric' });

    const tableRows = filteredTx.map(tx => {
      const formattedDate = new Date(tx.date).toISOString().split('T')[0];
      const warnaTeks = tx.type === 'pemasukan' ? '#10b981' : '#f43f5e'; 
      
      return `
        <tr>
          <td style="border: 1px solid #cbd5e1; padding: 6px; text-align: center;">${formattedDate}</td>
          <td style="border: 1px solid #cbd5e1; padding: 6px; text-align: center; font-weight: bold; color: ${warnaTeks};">${tx.type.toUpperCase()}</td>
          <td style="border: 1px solid #cbd5e1; padding: 6px;">${tx.category}</td>
          <td style="border: 1px solid #cbd5e1; padding: 6px;">${tx.description || '-'}</td>
          <td style="border: 1px solid #cbd5e1; padding: 6px; text-align: right;">${tx.amount}</td>
        </tr>
      `;
    }).join('');

    const excelTemplate = `
      <html xmlns:o="urn:schemas-microsoft-com:office:office" xmlns:x="urn:schemas-microsoft-com:office:excel" xmlns="http://www.w3.org/TR/REC-html40">
      <head>
        <meta charset="utf-8">
        <style>
          body { font-family: 'Segoe UI', Arial, sans-serif; }
          .title { font-size: 16pt; font-weight: bold; color: #0f172a; }
          .subtitle { font-size: 10pt; color: #64748b; font-style: italic; }
          th { background-color: #10b981; color: white; font-weight: bold; border: 1px solid #cbd5e1; padding: 8px; text-align: center; }
        </style>
      </head>
      <body>
        <table>
          <tr><td colspan="5" class="title">LAPORAN KEUANGAN FINTRACK MONEY</td></tr>
          <tr><td colspan="5" class="subtitle">Dicetak otomatis pada: ${tglCetak}</td></tr>
          <tr><td colspan="5"></td></tr> <thead>
            <tr>
              <th>Tanggal</th>
              <th>Jenis</th>
              <th>Kategori</th>
              <th>Deskripsi</th>
              <th>Nominal (Rp)</th>
            </tr>
          </thead>
          
          <tbody>
            ${tableRows}
          </tbody>
        </table>
      </body>
      </html>
    `;

    const blob = new Blob([excelTemplate], { type: 'application/vnd.ms-excel;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    
    link.setAttribute('download', `Laporan_FinTrack_${new Date().toISOString().split('T')[0]}.xls`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    
    setSuccessMsg('Laporan Excel berhasil diunduh!');
    setTimeout(() => setSuccessMsg(''), 3000);
  };

  const filteredTx = transactions.filter(t => {
    const matchType = filterType === 'semua' || t.type === filterType;
    const keyword = searchTerm.toLowerCase();
    const matchSearch = (t.description && t.description.toLowerCase().includes(keyword)) || (t.category && t.category.toLowerCase().includes(keyword));
    return matchType && matchSearch;
  });

  const totalFiltered = filteredTx.length;

  return (
    <div className="min-h-screen bg-slate-50 text-slate-800 font-sans pb-16">

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
          <button onClick={handleLogout} className="flex items-center gap-2 text-sm text-slate-500 hover:text-rose-600 font-bold transition-all px-4 py-2 rounded-xl hover:bg-rose-50 border border-transparent hover:border-rose-100">
            <span className="hidden sm:inline">Keluar</span>
            <FontAwesomeIcon icon={faRightFromBracket} />
          </button>
        </div>
      </nav>

      <main className="max-w-5xl mx-auto px-4 sm:px-6 py-8 space-y-8">

        {error && (
          <div className="flex items-center gap-3 bg-rose-50 text-rose-700 border border-rose-200 px-5 py-4 rounded-2xl text-sm font-semibold shadow-sm">
            <div className="h-8 w-8 bg-rose-100 rounded-xl flex items-center justify-center flex-shrink-0">
              <FontAwesomeIcon icon={faTriangleExclamation} />
            </div>
            <p>{error}</p>
            <button onClick={() => setError('')} className="ml-auto text-rose-400 hover:text-rose-600">
              <FontAwesomeIcon icon={faXmark} />
            </button>
          </div>
        )}

        <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
          <div className="relative bg-gradient-to-br from-emerald-500 to-teal-600 text-white p-6 rounded-3xl shadow-xl shadow-emerald-500/25 overflow-hidden group cursor-default select-none">
            <div className="absolute inset-0 bg-white/5 opacity-0 group-hover:opacity-100 transition-opacity" />
            <FontAwesomeIcon icon={faArrowTrendUp} className="absolute -right-3 -bottom-3 text-7xl opacity-10" />
            <div className="relative z-10">
              <div className="flex items-center gap-2 mb-3">
                <div className="h-7 w-7 bg-white/20 rounded-lg flex items-center justify-center text-sm">
                  <FontAwesomeIcon icon={faArrowTrendUp} />
                </div>
                <p className="text-xs font-bold opacity-80 uppercase tracking-widest">Pemasukan</p>
              </div>
              <h3 className="text-2xl font-black tracking-tight">
                {loading ? <FontAwesomeIcon icon={faCircleNotch} spin /> : formatRupiah(summary.total_pemasukan)}
              </h3>
            </div>
          </div>

          <div className="relative bg-gradient-to-br from-rose-500 to-pink-600 text-white p-6 rounded-3xl shadow-xl shadow-rose-500/25 overflow-hidden group cursor-default select-none">
            <div className="absolute inset-0 bg-white/5 opacity-0 group-hover:opacity-100 transition-opacity" />
            <FontAwesomeIcon icon={faArrowTrendDown} className="absolute -right-3 -bottom-3 text-7xl opacity-10" />
            <div className="relative z-10">
              <div className="flex items-center gap-2 mb-3">
                <div className="h-7 w-7 bg-white/20 rounded-lg flex items-center justify-center text-sm">
                  <FontAwesomeIcon icon={faArrowTrendDown} />
                </div>
                <p className="text-xs font-bold opacity-80 uppercase tracking-widest">Pengeluaran</p>
              </div>
              <h3 className="text-2xl font-black tracking-tight">
                {loading ? <FontAwesomeIcon icon={faCircleNotch} spin /> : formatRupiah(summary.total_pengeluaran)}
              </h3>
            </div>
          </div>

          <div className={`relative text-white p-6 rounded-3xl shadow-xl overflow-hidden group cursor-default select-none ${summary.saldo >= 0 ? 'bg-gradient-to-br from-indigo-600 to-blue-700 shadow-indigo-500/25' : 'bg-gradient-to-br from-orange-500 to-red-600 shadow-orange-500/25'}`}>
            <div className="absolute inset-0 bg-white/5 opacity-0 group-hover:opacity-100 transition-opacity" />
            <FontAwesomeIcon icon={faScaleBalanced} className="absolute -right-3 -bottom-3 text-7xl opacity-10" />
            <div className="relative z-10">
              <div className="flex items-center gap-2 mb-3">
                <div className="h-7 w-7 bg-white/20 rounded-lg flex items-center justify-center text-sm">
                  <FontAwesomeIcon icon={faScaleBalanced} />
                </div>
                <p className="text-xs font-bold opacity-80 uppercase tracking-widest">Total Saldo</p>
              </div>
              <h3 className="text-2xl font-black tracking-tight">
                {loading ? <FontAwesomeIcon icon={faCircleNotch} spin /> : formatRupiah(summary.saldo)}
              </h3>
            </div>
          </div>
        </div>

        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-xl font-extrabold text-slate-900">Riwayat Transaksi</h2>
              {!loading && (
                <p className="text-xs text-slate-400 font-medium mt-0.5">
                  {totalFiltered} transaksi {filterType !== 'semua' ? `· ${FILTER_LABEL[filterType]}` : ''}
                </p>
              )}
            </div>
            <div className="flex items-center gap-2">
              <button
                onClick={handleExportExcel}
                className="flex items-center gap-2 px-4 py-2.5 bg-white border-2 border-slate-200 hover:bg-slate-50 hover:border-slate-300 text-slate-700 text-sm font-bold rounded-2xl transition-all shadow-sm hover:shadow-md"
              >
                <FontAwesomeIcon icon={faFileExport} className="text-emerald-600" />
                <span className="hidden sm:inline">Ekspor</span>
              </button>
              <button
                onClick={() => setShowModal(true)}
                className="flex items-center gap-2 px-5 py-2.5 bg-slate-900 hover:bg-slate-700 text-white text-sm font-bold rounded-2xl transition-all shadow-lg shadow-slate-900/20 hover:-translate-y-0.5 active:translate-y-0"
              >
                <FontAwesomeIcon icon={faPlus} />
                <span className="hidden sm:inline">Tambah</span>
              </button>
            </div>
          </div>

          <div className="flex gap-3">
            <div className="relative" ref={filterRef}>
              <button
                onClick={() => setShowFilter(!showFilter)}
                className={`sm:hidden flex items-center gap-2 h-11 px-4 rounded-2xl text-xs font-bold transition-all border-2 ${filterType !== 'semua' ? 'bg-slate-900 text-white border-slate-900' : 'bg-white text-slate-600 border-slate-200 hover:border-slate-300'}`}
              >
                <FontAwesomeIcon icon={faFilter} className="text-xs" />
                <span className="capitalize">{FILTER_LABEL[filterType]}</span>
                <FontAwesomeIcon icon={faChevronDown} className={`text-xs transition-transform ${showFilter ? 'rotate-180' : ''}`} />
              </button>

              <div className={`sm:hidden absolute top-13 left-0 z-10 bg-white border border-slate-200 rounded-2xl shadow-2xl shadow-slate-200 p-1.5 flex flex-col gap-0.5 min-w-40 transition-all origin-top-left ${showFilter ? 'opacity-100 scale-100 pointer-events-auto' : 'opacity-0 scale-95 pointer-events-none'}`}>
                {['semua', 'pemasukan', 'pengeluaran'].map(f => (
                  <button key={f} onClick={() => { setFilterType(f); setShowFilter(false); }}
                    className={`px-4 py-2.5 rounded-xl text-xs font-bold transition-all text-left flex items-center gap-2 ${filterType === f ? 'bg-slate-900 text-white' : 'text-slate-600 hover:bg-slate-100'}`}>
                    {f === 'pemasukan' && <FontAwesomeIcon icon={faArrowTrendUp} className="text-emerald-500 w-3" />}
                    {f === 'pengeluaran' && <FontAwesomeIcon icon={faArrowTrendDown} className="text-rose-500 w-3" />}
                    {f === 'semua' && <FontAwesomeIcon icon={faScaleBalanced} className="text-slate-400 w-3" />}
                    <span className="capitalize">{FILTER_LABEL[f]}</span>
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

            <div className="relative flex-1">
              <FontAwesomeIcon icon={faMagnifyingGlass} className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 text-sm" />
              <input
                type="text"
                placeholder="Cari deskripsi atau kategori..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full h-11 pl-10 pr-10 bg-white border-2 border-slate-200 rounded-2xl text-sm font-medium focus:outline-none focus:border-emerald-400 focus:ring-4 focus:ring-emerald-500/10 transition-all placeholder:text-slate-400"
              />
              {searchTerm && (
                <button onClick={() => setSearchTerm('')} className="absolute right-3 top-1/2 -translate-y-1/2 h-6 w-6 bg-slate-100 hover:bg-slate-200 rounded-lg flex items-center justify-center text-slate-400 hover:text-slate-600 transition-all">
                  <FontAwesomeIcon icon={faXmark} className="text-xs" />
                </button>
              )}
            </div>
          </div>

          {loading ? (
            <div className="py-24 flex flex-col items-center justify-center text-slate-400 gap-4">
              <div className="h-14 w-14 bg-emerald-50 rounded-2xl flex items-center justify-center">
                <FontAwesomeIcon icon={faCircleNotch} spin className="text-2xl text-emerald-500" />
              </div>
              <p className="text-sm font-bold text-slate-500">Menyiapkan data keuangan Anda...</p>
            </div>
          ) : filteredTx.length === 0 ? (
            <div className="py-24 flex flex-col items-center justify-center text-slate-400 bg-white rounded-3xl border-2 border-dashed border-slate-200">
              <div className="h-16 w-16 bg-slate-100 rounded-2xl flex items-center justify-center mb-4">
                <FontAwesomeIcon icon={searchTerm ? faMagnifyingGlass : faBoxOpen} className="text-2xl text-slate-300" />
              </div>
              <p className="text-base font-bold text-slate-600">
                {searchTerm ? 'Transaksi tidak ditemukan' : 'Belum ada transaksi'}
              </p>
              <p className="text-sm mt-1 text-slate-400">
                {searchTerm ? `Tidak ada hasil untuk "${searchTerm}"` : 'Mulai catat arus kas Anda hari ini!'}
              </p>
              {searchTerm && (
                <button onClick={() => setSearchTerm('')} className="mt-4 px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-600 text-xs font-bold rounded-xl transition-all">
                  Hapus pencarian
                </button>
              )}
            </div>
          ) : (
          <div className="grid gap-2.5">
            {filteredTx.map(tx => (
              <div key={tx.id} className="flex items-center gap-3 px-3 py-3 sm:px-5 sm:py-4 bg-white rounded-2xl border-2 border-slate-100 hover:border-slate-200 shadow-sm hover:shadow-md transition-all group">
                <div className={`h-10 w-10 sm:h-11 sm:w-11 rounded-2xl flex items-center justify-center text-sm flex-shrink-0 transition-all group-hover:scale-110 group-hover:rotate-3 ${tx.type === 'pemasukan' ? 'bg-emerald-100 text-emerald-600' : 'bg-rose-100 text-rose-600'}`}>
                  <FontAwesomeIcon icon={tx.type === 'pemasukan' ? faArrowTrendUp : faArrowTrendDown} />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-bold text-slate-900 truncate">{tx.description || tx.category}</p>
                  <div className="flex items-center gap-1.5 mt-0.5 flex-wrap">
                    <span className={`inline-flex items-center px-2 py-0.5 rounded-md text-xs font-bold ${tx.type === 'pemasukan' ? 'bg-emerald-50 text-emerald-600' : 'bg-rose-50 text-rose-600'}`}>
                      {tx.category}
                    </span>
                    <span className="text-xs text-slate-400 font-medium">· {formatTanggal(tx.date)}</span>
                  </div>
                </div>
                <div className="text-right flex flex-col items-end gap-1 flex-shrink-0">
                  <p className={`text-xs sm:text-sm font-black ${tx.type === 'pemasukan' ? 'text-emerald-600' : 'text-rose-600'}`}>
                    {tx.type === 'pemasukan' ? '+' : '-'}{formatRupiah(tx.amount)}
                  </p>
                  <button
                    onClick={() => setDeleteTarget(tx.id)}
                    className="text-xs font-bold text-slate-300 hover:text-rose-500 transition-all opacity-100 md:opacity-0 md:group-hover:opacity-100 px-2 py-0.5 rounded-lg hover:bg-rose-50"
                  >
                    Hapus
                  </button>
                </div>
              </div>
            ))}
          </div>
          )}
        </div>
      </main>

      {showModal && (
        <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm flex items-end sm:items-center justify-center z-50 p-0 sm:p-4">
          <div className="bg-white rounded-t-3xl sm:rounded-3xl shadow-2xl w-full sm:max-w-lg overflow-hidden">
            <div className="px-6 py-5 border-b border-slate-100 flex justify-between items-center">
              <div>
                <h3 className="text-lg font-extrabold text-slate-900">Catat Transaksi</h3>
                <p className="text-xs text-slate-400 font-medium mt-0.5">Isi detail transaksi di bawah ini</p>
              </div>
              <button onClick={() => setShowModal(false)} className="h-9 w-9 bg-slate-100 rounded-xl flex items-center justify-center text-slate-400 hover:text-rose-500 hover:bg-rose-50 transition-all">
                <FontAwesomeIcon icon={faXmark} />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="p-6 space-y-5">
              <div>
                <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">Jenis Transaksi</label>
                <div className="flex bg-slate-100 p-1.5 rounded-2xl gap-1">
                  {['pemasukan', 'pengeluaran'].map(t => (
                    <button key={t} type="button" onClick={() => setForm({ ...form, type: t, category: KATEGORI[t][0] })}
                      className={`flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl text-sm font-bold transition-all capitalize ${form.type === t ? (t === 'pemasukan' ? 'bg-emerald-500 text-white shadow-md shadow-emerald-200' : 'bg-rose-500 text-white shadow-md shadow-rose-200') : 'text-slate-500 hover:bg-white/60'}`}>
                      <FontAwesomeIcon icon={t === 'pemasukan' ? faArrowTrendUp : faArrowTrendDown} className="text-sm" />
                      {t}
                    </button>
                  ))}
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">Kategori</label>
                  <select value={form.category} onChange={e => setForm({ ...form, category: e.target.value })}
                    className="w-full px-4 py-3 bg-slate-50 border-2 border-slate-200 rounded-xl text-sm font-medium focus:outline-none focus:bg-white focus:border-emerald-400 transition-all cursor-pointer">
                    {KATEGORI[form.type].map(k => <option key={k} value={k}>{k}</option>)}
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">Tanggal</label>
                  <input type="date" value={form.date} onChange={e => setForm({ ...form, date: e.target.value })}
                    className="w-full px-4 py-3 bg-slate-50 border-2 border-slate-200 rounded-xl text-sm font-medium focus:outline-none focus:bg-white focus:border-emerald-400 transition-all" />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">
                  Deskripsi <span className="text-slate-400 font-normal normal-case">(opsional)</span>
                </label>
                <input type="text" value={form.description} onChange={e => setForm({ ...form, description: e.target.value })}
                  placeholder="Contoh: Beli kopi senja..."
                  className="w-full px-4 py-3 bg-slate-50 border-2 border-slate-200 rounded-xl text-sm font-medium focus:outline-none focus:bg-white focus:border-emerald-400 transition-all placeholder:text-slate-300" />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">Jumlah Nominal</label>
                <div className="relative">
                  <span className="absolute left-4 top-1/2 -translate-y-1/2 font-bold text-slate-400 text-sm">Rp</span>
                  <input type="number" value={form.amount} onChange={e => setForm({ ...form, amount: e.target.value })}
                    placeholder="0" min="1" required
                    className="w-full pl-12 pr-4 py-4 bg-slate-50 border-2 border-slate-200 rounded-xl text-xl font-black text-slate-900 focus:outline-none focus:bg-white focus:border-emerald-400 transition-all placeholder:text-slate-300 placeholder:font-bold" />
                </div>
              </div>

              <div className="flex gap-3 pt-2">
                <button type="button" onClick={() => setShowModal(false)}
                  className="flex-1 py-3.5 rounded-2xl text-sm font-bold bg-slate-100 text-slate-600 hover:bg-slate-200 transition-all">
                  Batal
                </button>
                <button type="submit" disabled={submitting}
                  className="flex-1 flex justify-center items-center gap-2 py-3.5 rounded-2xl text-sm font-bold text-white bg-slate-900 hover:bg-slate-700 disabled:opacity-60 transition-all shadow-lg shadow-slate-900/20 hover:-translate-y-0.5 active:translate-y-0">
                  {submitting ? (
                    <><FontAwesomeIcon icon={faCircleNotch} spin /> Menyimpan...</>
                  ) : 'Simpan Transaksi'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {deleteTarget && (
        <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-3xl shadow-2xl w-full max-w-sm p-7 text-center">
            <div className="h-16 w-16 bg-rose-100 text-rose-500 rounded-2xl flex items-center justify-center mx-auto mb-5">
              <FontAwesomeIcon icon={faTriangleExclamation} className="text-2xl" />
            </div>
            <h3 className="text-lg font-black text-slate-900 mb-2">Hapus Transaksi?</h3>
            <p className="text-sm text-slate-500 leading-relaxed mb-6">Tindakan ini tidak dapat dibatalkan. Data transaksi akan hilang selamanya.</p>
            <div className="flex gap-3">
              <button onClick={() => setDeleteTarget(null)}
                className="flex-1 py-3.5 rounded-2xl text-sm font-bold bg-slate-100 text-slate-600 hover:bg-slate-200 transition-all">
                Batal
              </button>
              <button onClick={executeDelete}
                className="flex-1 py-3.5 rounded-2xl text-sm font-bold bg-rose-600 text-white hover:bg-rose-700 transition-all shadow-lg shadow-rose-200">
                Ya, Hapus
              </button>
            </div>
          </div>
        </div>
      )}

      {successModal.show && (
        <div className="fixed inset-0 flex items-center justify-center z-50 p-4 pointer-events-none">
          <div className="bg-white rounded-3xl shadow-2xl shadow-slate-200 w-full max-w-xs p-7 text-center pointer-events-auto border border-slate-100">
            <div className="h-16 w-16 bg-emerald-100 text-emerald-500 rounded-2xl flex items-center justify-center mx-auto mb-4">
              <FontAwesomeIcon icon={faCheckCircle} className="text-3xl" />
            </div>
            <h3 className="text-lg font-black text-slate-900 mb-1">Berhasil!</h3>
            <p className="text-sm text-slate-500">{successModal.message}</p>
          </div>
        </div>
      )}
    </div>
  );
}