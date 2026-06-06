import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';

const API = 'http://localhost:8080';

function formatRupiah(num) {
  return new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', minimumFractionDigits: 0 }).format(num);
}

function formatTanggal(dateStr) {
  return new Date(dateStr).toLocaleDateString('id-ID', { day: '2-digit', month: 'short', year: 'numeric' });
}

const KATEGORI = {
  pemasukan: ['Gaji', 'Freelance', 'Investasi', 'Bonus', 'Lainnya'],
  pengeluaran: ['Makanan', 'Transportasi', 'Belanja', 'Tagihan', 'Kesehatan', 'Hiburan', 'Lainnya'],
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
      setError('Gagal memuat data.');
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

  const handleDelete = async (id) => {
    if (!confirm('Hapus transaksi ini?')) return;
    try {
      await fetch(`${API}/transactions/${id}`, { method: 'DELETE', headers: authHeaders });
      fetchData();
    } catch {
      setError('Gagal menghapus.');
    }
  };

  const filteredTx = filterType === 'semua' ? transactions : transactions.filter(t => t.type === filterType);

  return (
    <div className="min-h-screen bg-slate-50 text-slate-800">
      {/* Navbar */}
      <nav className="bg-white border-b border-slate-200 px-4 sm:px-6 py-3 sticky top-0 z-20 shadow-sm">
        <div className="max-w-5xl mx-auto flex justify-between items-center">
          <div className="flex items-center gap-2">
            <div className="h-8 w-8 bg-emerald-600 rounded-lg flex items-center justify-center text-white text-base">💰</div>
            <span className="font-bold text-lg text-slate-900">FinTrack</span>
          </div>
          <button onClick={handleLogout} className="text-sm text-slate-500 hover:text-rose-600 font-medium transition px-3 py-1.5 rounded-lg hover:bg-rose-50">
            Keluar
          </button>
        </div>
      </nav>

      <main className="max-w-5xl mx-auto px-4 sm:px-6 py-6 space-y-6">
        {error && (
          <div className="bg-rose-50 text-rose-700 border border-rose-100 px-4 py-3 rounded-xl text-sm font-medium">
            ⚠️ {error}
          </div>
        )}

        {/* Summary Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div className="bg-gradient-to-br from-emerald-500 to-teal-600 text-white p-5 rounded-2xl shadow-md shadow-emerald-100">
            <p className="text-xs font-semibold opacity-75 uppercase tracking-wider">Total Pemasukan</p>
            <p className="text-2xl font-bold mt-1">{loading ? '...' : formatRupiah(summary.total_pemasukan)}</p>
          </div>
          <div className="bg-gradient-to-br from-rose-500 to-pink-600 text-white p-5 rounded-2xl shadow-md shadow-rose-100">
            <p className="text-xs font-semibold opacity-75 uppercase tracking-wider">Total Pengeluaran</p>
            <p className="text-2xl font-bold mt-1">{loading ? '...' : formatRupiah(summary.total_pengeluaran)}</p>
          </div>
          <div className={`p-5 rounded-2xl shadow-md text-white ${summary.saldo >= 0 ? 'bg-gradient-to-br from-blue-500 to-indigo-600 shadow-blue-100' : 'bg-gradient-to-br from-orange-500 to-amber-600 shadow-orange-100'}`}>
            <p className="text-xs font-semibold opacity-75 uppercase tracking-wider">Saldo</p>
            <p className="text-2xl font-bold mt-1">{loading ? '...' : formatRupiah(summary.saldo)}</p>
          </div>
        </div>

        {/* Transactions Section */}
        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
          <div className="px-5 py-4 border-b border-slate-100 flex flex-col sm:flex-row gap-3 sm:items-center justify-between">
            <h2 className="font-bold text-slate-900 text-base">Riwayat Transaksi</h2>
            <div className="flex gap-2 flex-wrap">
              {['semua', 'pemasukan', 'pengeluaran'].map(f => (
                <button key={f} onClick={() => setFilterType(f)}
                  className={`px-3 py-1 rounded-full text-xs font-semibold transition capitalize ${filterType === f ? 'bg-emerald-600 text-white' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'}`}>
                  {f}
                </button>
              ))}
              <button onClick={() => setShowModal(true)}
                className="ml-auto sm:ml-0 px-4 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold rounded-full transition shadow-sm shadow-emerald-100">
                + Tambah
              </button>
            </div>
          </div>

          {loading ? (
            <div className="py-16 text-center text-slate-400 text-sm animate-pulse">Memuat data...</div>
          ) : filteredTx.length === 0 ? (
            <div className="py-16 text-center text-slate-400">
              <p className="text-3xl mb-2">📭</p>
              <p className="text-sm font-medium">Belum ada transaksi</p>
              <p className="text-xs mt-1">Tekan "+ Tambah" untuk mencatat transaksi baru</p>
            </div>
          ) : (
            <ul className="divide-y divide-slate-100">
              {filteredTx.map(tx => (
                <li key={tx.id} className="flex items-center gap-3 px-5 py-3.5 hover:bg-slate-50 transition group">
                  <div className={`h-9 w-9 rounded-xl flex items-center justify-center text-base flex-shrink-0 ${tx.type === 'pemasukan' ? 'bg-emerald-100' : 'bg-rose-100'}`}>
                    {tx.type === 'pemasukan' ? '⬆️' : '⬇️'}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-semibold text-slate-800 truncate">{tx.description || tx.category}</p>
                    <p className="text-xs text-slate-400">{tx.category} · {formatTanggal(tx.date)}</p>
                  </div>
                  <div className="text-right flex-shrink-0">
                    <p className={`text-sm font-bold ${tx.type === 'pemasukan' ? 'text-emerald-600' : 'text-rose-500'}`}>
                      {tx.type === 'pemasukan' ? '+' : '-'}{formatRupiah(tx.amount)}
                    </p>
                    <button onClick={() => handleDelete(tx.id)}
                      className="text-xs text-slate-300 hover:text-rose-500 transition opacity-0 group-hover:opacity-100 mt-0.5">
                      Hapus
                    </button>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </div>
      </main>

      {/* Modal Tambah Transaksi */}
      {showModal && (
        <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md p-6 animate-fade-in">
            <div className="flex justify-between items-center mb-5">
              <h3 className="text-base font-bold text-slate-900">Tambah Transaksi</h3>
              <button onClick={() => setShowModal(false)} className="text-slate-400 hover:text-slate-600 text-lg leading-none">&times;</button>
            </div>
            <form onSubmit={handleSubmit} className="space-y-4">
              {/* Tipe */}
              <div>
                <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1.5">Tipe</label>
                <div className="grid grid-cols-2 gap-2">
                  {['pemasukan', 'pengeluaran'].map(t => (
                    <button key={t} type="button" onClick={() => setForm({ ...form, type: t, category: KATEGORI[t][0] })}
                      className={`py-2 rounded-xl text-sm font-semibold transition capitalize ${form.type === t ? (t === 'pemasukan' ? 'bg-emerald-600 text-white' : 'bg-rose-500 text-white') : 'bg-slate-100 text-slate-600 hover:bg-slate-200'}`}>
                      {t === 'pemasukan' ? '⬆️ Pemasukan' : '⬇️ Pengeluaran'}
                    </button>
                  ))}
                </div>
              </div>
              {/* Kategori */}
              <div>
                <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1.5">Kategori</label>
                <select value={form.category} onChange={e => setForm({ ...form, category: e.target.value })}
                  className="w-full px-3 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-emerald-400 focus:border-emerald-400 transition">
                  {KATEGORI[form.type].map(k => <option key={k}>{k}</option>)}
                </select>
              </div>
              {/* Deskripsi */}
              <div>
                <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1.5">Deskripsi (opsional)</label>
                <input type="text" value={form.description} onChange={e => setForm({ ...form, description: e.target.value })}
                  placeholder="Contoh: Gaji bulan Juni"
                  className="w-full px-3 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-emerald-400 focus:border-emerald-400 transition" />
              </div>
              {/* Jumlah */}
              <div>
                <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1.5">Jumlah (Rp)</label>
                <input type="number" value={form.amount} onChange={e => setForm({ ...form, amount: e.target.value })}
                  placeholder="0" min="1" required
                  className="w-full px-3 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-emerald-400 focus:border-emerald-400 transition" />
              </div>
              {/* Tanggal */}
              <div>
                <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1.5">Tanggal</label>
                <input type="date" value={form.date} onChange={e => setForm({ ...form, date: e.target.value })}
                  className="w-full px-3 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-emerald-400 focus:border-emerald-400 transition" />
              </div>
              <div className="flex gap-2 pt-1">
                <button type="button" onClick={() => setShowModal(false)}
                  className="flex-1 py-2.5 rounded-xl text-sm font-semibold bg-slate-100 text-slate-600 hover:bg-slate-200 transition">
                  Batal
                </button>
                <button type="submit" disabled={submitting}
                  className="flex-1 py-2.5 rounded-xl text-sm font-bold text-white bg-emerald-600 hover:bg-emerald-700 disabled:opacity-60 transition shadow-sm">
                  {submitting ? 'Menyimpan...' : 'Simpan'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
