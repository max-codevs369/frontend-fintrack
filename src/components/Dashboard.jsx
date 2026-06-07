import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { 
  faWallet, 
  faRightFromBracket, 
  faArrowTrendUp, 
  faArrowTrendDown, 
  faPlus, 
  faXmark, 
  faBoxOpen, 
  faTriangleExclamation, 
  faCircleNotch,
  faScaleBalanced
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

export default function Dashboard() {
  const navigate = useNavigate();
  const [summary, setSummary] = useState({ total_pemasukan: 0, total_pengeluaran: 0, saldo: 0 });
  const [transactions, setTransactions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [form, setForm] = useState({ type: 'pemasukan', category: 'Gaji', description: '', amount: '', date: new Date().toISOString().split('T')[0] });
  const [submitting, setSubmitting] = useState(false);
  const [filterType, setFilterType] = useState('semua');

  const token = localStorage.getItem('token');

  const authHeaders = {
    'Content-Type': 'application/json',
    'Authorization': `Bearer ${token}`,
    'ngrok-skip-browser-warning': '17317',
  };

  const handleLogout = () => {
    localStorage.removeItem('token');
    navigate('/login', { replace: true });
  };

  const fetchData = async () => {
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
  };

  useEffect(() => { fetchData(); }, []);

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
      if (!res.ok) throw new Error('Gagal menyimpan');
      setShowModal(false);
      setForm({ type: 'pemasukan', category: 'Gaji', description: '', amount: '', date: new Date().toISOString().split('T')[0] });
      fetchData();
    } catch {
      setError('Gagal menambah transaksi.');
    } finally {
      setSubmitting(false);
    }
  };

  const [deleteTarget, setDeleteTarget] = useState(null);

  const confirmDelete = (id) => {
    setDeleteTarget(id);
  };

  const executeDelete = async () => {
    if (!deleteTarget) return;
    try {
      await fetch(`${API}/transactions/${deleteTarget}`, { method: 'DELETE', headers: authHeaders });
      fetchData();
    } catch {
      setError('Gagal menghapus transaksi.');
    } finally {
      setDeleteTarget(null); 
    }
  };

  const filteredTx = filterType === 'semua' ? transactions : transactions.filter(t => t.type === filterType);

  return (
    <div className="min-h-screen bg-slate-50 text-slate-800 font-sans pb-12">
      
      <nav className="bg-white/80 backdrop-blur-lg border-b border-slate-200/60 px-4 sm:px-6 py-4 sticky top-0 z-20 shadow-sm">
        <div className="max-w-5xl mx-auto flex justify-between items-center">
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 bg-gradient-to-br from-emerald-500 to-teal-600 rounded-xl flex items-center justify-center text-white shadow-lg shadow-emerald-200">
              <FontAwesomeIcon icon={faWallet} className="text-xl" />
            </div>
            <span className="font-extrabold text-xl tracking-tight text-slate-900">FinTrack</span>
          </div>
          <button onClick={handleLogout} className="flex items-center gap-2 text-sm text-slate-500 hover:text-rose-600 font-bold transition-all px-4 py-2 rounded-xl hover:bg-rose-50">
            <span className="hidden sm:inline">Keluar</span>
            <FontAwesomeIcon icon={faRightFromBracket} />
          </button>
        </div>
      </nav>

      <main className="max-w-5xl mx-auto px-4 sm:px-6 py-8 space-y-8">
        
        {error && (
          <div className="flex items-center gap-3 bg-rose-50 text-rose-700 border border-rose-200 px-5 py-4 rounded-2xl text-sm font-semibold shadow-sm animate-fade-in">
            <FontAwesomeIcon icon={faTriangleExclamation} className="text-lg" />
            <p>{error}</p>
          </div>
        )}

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          
          <div className="relative bg-gradient-to-br from-emerald-500 to-teal-600 text-white p-6 rounded-3xl shadow-xl shadow-emerald-500/20 overflow-hidden transform transition hover:-translate-y-1">
            <FontAwesomeIcon icon={faArrowTrendUp} className="absolute -right-4 -bottom-4 text-8xl opacity-10" />
            <div className="relative z-10">
              <p className="text-sm font-bold opacity-80 uppercase tracking-widest mb-1">Pemasukan</p>
              <h3 className="text-3xl font-black tracking-tight">
                {loading ? <FontAwesomeIcon icon={faCircleNotch} spin /> : formatRupiah(summary.total_pemasukan)}
              </h3>
            </div>
          </div>

          <div className="relative bg-gradient-to-br from-rose-500 to-pink-600 text-white p-6 rounded-3xl shadow-xl shadow-rose-500/20 overflow-hidden transform transition hover:-translate-y-1">
            <FontAwesomeIcon icon={faArrowTrendDown} className="absolute -right-4 -bottom-4 text-8xl opacity-10" />
            <div className="relative z-10">
              <p className="text-sm font-bold opacity-80 uppercase tracking-widest mb-1">Pengeluaran</p>
              <h3 className="text-3xl font-black tracking-tight">
                {loading ? <FontAwesomeIcon icon={faCircleNotch} spin /> : formatRupiah(summary.total_pengeluaran)}
              </h3>
            </div>
          </div>

          <div className={`relative p-6 rounded-3xl shadow-xl overflow-hidden transform transition hover:-translate-y-1 ${summary.saldo >= 0 ? 'bg-gradient-to-br from-indigo-600 to-blue-700 shadow-indigo-500/20' : 'bg-gradient-to-br from-orange-500 to-red-600 shadow-orange-500/20'} text-white`}>
            <FontAwesomeIcon icon={faScaleBalanced} className="absolute -right-4 -bottom-4 text-8xl opacity-10" />
            <div className="relative z-10">
              <p className="text-sm font-bold opacity-80 uppercase tracking-widest mb-1">Total Saldo</p>
              <h3 className="text-3xl font-black tracking-tight">
                {loading ? <FontAwesomeIcon icon={faCircleNotch} spin /> : formatRupiah(summary.saldo)}
              </h3>
            </div>
          </div>
        </div>

        <div className="space-y-6">
          <div className="flex flex-col sm:flex-row gap-4 sm:items-center justify-between">
            <h2 className="text-xl font-extrabold text-slate-900">Riwayat Transaksi</h2>
            
            <div className="flex items-center gap-3 flex-wrap">
              {/* Filter Pills */}
              <div className="flex bg-slate-200/50 p-1 rounded-xl">
                {['semua', 'pemasukan', 'pengeluaran'].map(f => (
                  <button key={f} onClick={() => setFilterType(f)}
                    className={`px-4 py-1.5 rounded-lg text-xs font-bold transition-all capitalize ${filterType === f ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}>
                    {f}
                  </button>
                ))}
              </div>
              
              <button onClick={() => setShowModal(true)}
                className="flex items-center gap-2 px-5 py-2 bg-slate-900 hover:bg-slate-800 text-white text-sm font-bold rounded-xl transition-all shadow-lg hover:shadow-xl hover:-translate-y-0.5 ml-auto sm:ml-0">
                <FontAwesomeIcon icon={faPlus} /> Tambah
              </button>
            </div>
          </div>

          {loading ? (
            <div className="py-20 flex flex-col items-center justify-center text-slate-400 gap-3">
              <FontAwesomeIcon icon={faCircleNotch} spin className="text-3xl text-emerald-500" />
              <p className="text-sm font-bold animate-pulse">Menyiapkan data keuangan Anda...</p>
            </div>
          ) : filteredTx.length === 0 ? (
            <div className="py-20 flex flex-col items-center justify-center text-slate-400 bg-white rounded-3xl border border-slate-100 border-dashed">
              <FontAwesomeIcon icon={faBoxOpen} className="text-6xl mb-4 text-slate-200" />
              <p className="text-base font-bold text-slate-600">Belum ada transaksi</p>
              <p className="text-sm mt-1">Mulai catat arus kas Anda hari ini!</p>
            </div>
          ) : (
            <div className="grid gap-3">
              {filteredTx.map(tx => (
                <div key={tx.id} className="flex items-center gap-4 px-5 py-4 bg-white rounded-2xl border border-slate-100 shadow-sm hover:shadow-md hover:border-slate-200 transition-all group">
                  
                  <div className={`h-12 w-12 rounded-2xl flex items-center justify-center text-lg flex-shrink-0 transition-transform group-hover:scale-110 ${tx.type === 'pemasukan' ? 'bg-emerald-100 text-emerald-600' : 'bg-rose-100 text-rose-600'}`}>
                    <FontAwesomeIcon icon={tx.type === 'pemasukan' ? faArrowTrendUp : faArrowTrendDown} />
                  </div>
                  
                  <div className="flex-1 min-w-0">
                    <p className="text-base font-bold text-slate-900 truncate">{tx.description || tx.category}</p>
                    <p className="text-xs font-semibold text-slate-400 mt-0.5">{tx.category} • {formatTanggal(tx.date)}</p>
                  </div>
                  
                  <div className="text-right flex flex-col items-end">
                    <p className={`text-base font-black ${tx.type === 'pemasukan' ? 'text-emerald-600' : 'text-rose-600'}`}>
                      {tx.type === 'pemasukan' ? '+' : '-'}{formatRupiah(tx.amount)}
                    </p>
                    
                    <button 
                      onClick={() => handleDelete(tx.id)}
                      className="text-xs font-bold text-slate-400 hover:text-rose-500 transition-all opacity-100 md:opacity-0 md:group-hover:opacity-100 md:translate-x-2 md:group-hover:translate-x-0 mt-1"
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
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm flex items-center justify-center z-50 p-4 animate-fade-in">
          <div className="bg-white rounded-3xl shadow-2xl w-full max-w-lg overflow-hidden transform transition-all">
            
            <div className="bg-slate-50 px-6 py-4 border-b border-slate-100 flex justify-between items-center">
              <h3 className="text-lg font-extrabold text-slate-900">Catat Transaksi Baru</h3>
              <button onClick={() => setShowModal(false)} className="h-8 w-8 bg-white rounded-full flex items-center justify-center text-slate-400 hover:text-rose-500 hover:bg-rose-50 shadow-sm transition-colors">
                <FontAwesomeIcon icon={faXmark} />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="p-6 space-y-5">
              
              <div>
                <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">Jenis Transaksi</label>
                <div className="flex bg-slate-100 p-1.5 rounded-2xl gap-1">
                  {['pemasukan', 'pengeluaran'].map(t => (
                    <button key={t} type="button" onClick={() => setForm({ ...form, type: t, category: KATEGORI[t][0] })}
                      className={`flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl text-sm font-bold transition-all capitalize ${form.type === t ? (t === 'pemasukan' ? 'bg-emerald-500 text-white shadow-md shadow-emerald-200' : 'bg-rose-500 text-white shadow-md shadow-rose-200') : 'text-slate-500 hover:bg-slate-200/50'}`}>
                      <FontAwesomeIcon icon={t === 'pemasukan' ? faArrowTrendUp : faArrowTrendDown} />
                      {t}
                    </button>
                  ))}
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">Kategori</label>
                  <select value={form.category} onChange={e => setForm({ ...form, category: e.target.value })}
                    className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm font-medium focus:outline-none focus:bg-white focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 transition-all cursor-pointer">
                    {KATEGORI[form.type].map(k => <option key={k} value={k}>{k}</option>)}
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">Tanggal</label>
                  <input type="date" value={form.date} onChange={e => setForm({ ...form, date: e.target.value })}
                    className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm font-medium focus:outline-none focus:bg-white focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 transition-all" />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">Deskripsi <span className="text-slate-400 font-normal lowercase">(opsional)</span></label>
                <input type="text" value={form.description} onChange={e => setForm({ ...form, description: e.target.value })}
                  placeholder="Contoh: Beli kopi senja..."
                  className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm font-medium focus:outline-none focus:bg-white focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 transition-all" />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">Jumlah Nominal (Rp)</label>
                <div className="relative">
                  <span className="absolute left-4 top-1/2 -translate-y-1/2 font-bold text-slate-400">Rp</span>
                  <input type="number" value={form.amount} onChange={e => setForm({ ...form, amount: e.target.value })}
                    placeholder="0" min="1" required
                    className="w-full pl-12 pr-4 py-3.5 bg-slate-50 border border-slate-200 rounded-xl text-lg font-black text-slate-900 focus:outline-none focus:bg-white focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 transition-all" />
                </div>
              </div>

              <div className="flex gap-3 pt-4">
                <button type="button" onClick={() => setShowModal(false)}
                  className="flex-1 py-3 rounded-xl text-sm font-bold bg-white border border-slate-200 text-slate-600 hover:bg-slate-50 hover:border-slate-300 transition-all">
                  Batal
                </button>
                <button type="submit" disabled={submitting}
                  className="flex-1 flex justify-center items-center gap-2 py-3 rounded-xl text-sm font-bold text-white bg-slate-900 hover:bg-slate-800 disabled:opacity-70 transition-all shadow-lg hover:shadow-xl hover:-translate-y-0.5">
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
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm flex items-center justify-center z-50 p-4 animate-fade-in">
          <div className="bg-white rounded-3xl shadow-2xl w-full max-w-sm p-6 text-center">
            <div className="h-16 w-16 bg-rose-100 text-rose-600 rounded-full flex items-center justify-center mx-auto mb-4">
              <FontAwesomeIcon icon={faTriangleExclamation} className="text-2xl" />
            </div>
            <h3 className="text-lg font-black text-slate-900 mb-2">Hapus Transaksi?</h3>
            <p className="text-sm text-slate-500 mb-6">Tindakan ini tidak dapat dibatalkan. Apakah Anda yakin ingin menghapus data ini?</p>
            
            <div className="flex gap-3">
              <button 
                onClick={() => setDeleteTarget(null)}
                className="flex-1 py-3 rounded-xl text-sm font-bold bg-slate-100 text-slate-600 hover:bg-slate-200 transition"
              >
                Batal
              </button>
              <button 
                onClick={executeDelete}
                className="flex-1 py-3 rounded-xl text-sm font-bold bg-rose-600 text-white hover:bg-rose-700 transition shadow-lg shadow-rose-200"
              >
                Ya, Hapus
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}