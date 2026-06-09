import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import {
  faXmark, faArrowTrendUp, faArrowTrendDown, faCheck,
  faCircleNotch, faTriangleExclamation, faCheckCircle,
  faCalendarDays, faMagnifyingGlass,
} from '@fortawesome/free-solid-svg-icons';

const KATEGORI = {
  pemasukan: ['Gaji', 'Freelance', 'Investasi', 'Bonus', 'Lainnya'],
  pengeluaran: ['Makanan', 'Minuman', 'Transportasi', 'Belanja', 'Tagihan', 'Kesehatan', 'Hiburan', 'Lainnya'],
};

export function TransactionModal({ show, onClose, form, setForm, wallets, onSubmit, submitting }) {
  if (!show) return null;
  return (
    <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm flex items-end sm:items-center justify-center z-50 p-0 sm:p-4">
      <div className="bg-white rounded-t-3xl sm:rounded-3xl shadow-2xl w-full sm:max-w-lg overflow-hidden">
        <div className="px-6 py-5 border-b border-slate-100 flex justify-between items-center">
          <div>
            <h3 className="text-base font-extrabold text-slate-900">Catat Transaksi</h3>
            <p className="text-xs text-slate-400 mt-0.5">Isi detail transaksi di bawah ini</p>
          </div>
          <button onClick={onClose} className="h-9 w-9 bg-slate-100 rounded-xl flex items-center justify-center text-slate-400 hover:text-rose-500 hover:bg-rose-50 transition-all">
            <FontAwesomeIcon icon={faXmark} />
          </button>
        </div>
        <form onSubmit={onSubmit} className="p-5 space-y-4 overflow-y-auto max-h-[80vh]">
          <div>
            <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">Jenis</label>
            <div className="flex bg-slate-100 p-1.5 rounded-2xl gap-1">
              {['pemasukan','pengeluaran'].map(t => (
                <button key={t} type="button"
                  onClick={() => setForm({ ...form, type: t, category: KATEGORI[t][0] })}
                  className={`flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl text-xs font-bold transition-all capitalize ${
                    form.type === t
                      ? t === 'pemasukan'
                        ? 'bg-emerald-500 text-white shadow-md shadow-emerald-200'
                        : 'bg-rose-500 text-white shadow-md shadow-rose-200'
                      : 'text-slate-500 hover:bg-white/60'
                  }`}>
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
            <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">
              Deskripsi <span className="text-slate-400 font-normal normal-case">(opsional)</span>
            </label>
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
            <button type="button" onClick={onClose}
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
  );
}

export function BudgetModal({ show, onClose, budgetForm, setBudgetForm, onSave }) {
  if (!show) return null;
  return (
    <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm flex items-end sm:items-center justify-center z-50 p-0 sm:p-4">
      <div className="bg-white rounded-t-3xl sm:rounded-3xl shadow-2xl w-full sm:max-w-sm overflow-hidden">
        <div className="px-6 py-5 border-b border-slate-100 flex justify-between items-center">
          <h3 className="text-base font-extrabold text-slate-900">Atur Anggaran</h3>
          <button onClick={onClose} className="h-9 w-9 bg-slate-100 rounded-xl flex items-center justify-center text-slate-400 hover:text-rose-500 hover:bg-rose-50 transition-all">
            <FontAwesomeIcon icon={faXmark} />
          </button>
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
            <button onClick={onClose} className="flex-1 py-3 rounded-2xl text-xs font-bold bg-slate-100 text-slate-600 hover:bg-slate-200 transition-all">Batal</button>
            <button onClick={onSave} className="flex-1 py-3 rounded-2xl text-xs font-bold text-white bg-slate-900 hover:bg-slate-700 transition-all shadow-lg">Simpan</button>
          </div>
        </div>
      </div>
    </div>
  );
}

export function DeleteConfirmModal({ show, onCancel, onConfirm }) {
  if (!show) return null;
  return (
    <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-3xl shadow-2xl w-full max-w-sm p-7 text-center">
        <div className="h-16 w-16 bg-rose-100 text-rose-500 rounded-2xl flex items-center justify-center mx-auto mb-5">
          <FontAwesomeIcon icon={faTriangleExclamation} className="text-2xl" />
        </div>
        <h3 className="text-base font-black text-slate-900 mb-2">Hapus Transaksi?</h3>
        <p className="text-sm text-slate-500 mb-6">Tindakan ini tidak dapat dibatalkan.</p>
        <div className="flex gap-3">
          <button onClick={onCancel} className="flex-1 py-3 rounded-2xl text-xs font-bold bg-slate-100 text-slate-600 hover:bg-slate-200 transition-all">Batal</button>
          <button onClick={onConfirm} className="flex-1 py-3 rounded-2xl text-xs font-bold bg-rose-600 text-white hover:bg-rose-700 transition-all">Hapus</button>
        </div>
      </div>
    </div>
  );
}

export function ErrorModal({ show, message, onClose }) {
  if (!show) return null;
  return (
    <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-3xl shadow-2xl w-full max-w-sm p-7 text-center">
        <div className="h-16 w-16 bg-rose-100 text-rose-500 rounded-2xl flex items-center justify-center mx-auto mb-5">
          <FontAwesomeIcon icon={faTriangleExclamation} className="text-2xl" />
        </div>
        <h3 className="text-base font-black text-slate-900 mb-2">Terjadi Kesalahan</h3>
        <p className="text-sm text-slate-500 mb-6">{message}</p>
        <button onClick={onClose} className="w-full py-3 rounded-2xl text-xs font-bold bg-slate-900 text-white hover:bg-slate-700 transition-all">
          Mengerti
        </button>
      </div>
    </div>
  );
}

export function SuccessToast({ show, message }) {
  if (!show) return null;
  return (
    <div className="fixed bottom-20 md:bottom-6 left-1/2 -translate-x-1/2 z-50 pointer-events-none">
      <div className="bg-slate-900 text-white rounded-2xl shadow-2xl px-5 py-3 flex items-center gap-3 pointer-events-auto">
        <div className="h-7 w-7 bg-emerald-500 rounded-lg flex items-center justify-center flex-shrink-0">
          <FontAwesomeIcon icon={faCheckCircle} className="text-xs" />
        </div>
        <p className="text-xs font-bold">{message}</p>
      </div>
    </div>
  );
}

export function FilterModal({
  show, onClose,
  tempFilterType, setTempFilterType,
  tempFilterMonth, setTempFilterMonth,
  tempSearch, setTempSearch,
  onApply, onReset,
}) {
  if (!show) return null;
  return (
    <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm flex items-end sm:items-center justify-center z-50 p-0 sm:p-4">
      <div className="bg-white rounded-t-3xl sm:rounded-3xl shadow-2xl w-full sm:max-w-md overflow-hidden">
        <div className="px-6 py-5 border-b border-slate-100 flex justify-between items-center">
          <div>
            <h3 className="text-base font-extrabold text-slate-900">Filter Transaksi</h3>
            <p className="text-xs text-slate-400 mt-0.5">Saring riwayat sesuai kebutuhan</p>
          </div>
          <button onClick={onClose} className="h-9 w-9 bg-slate-100 rounded-xl flex items-center justify-center text-slate-400 hover:text-rose-500 hover:bg-rose-50 transition-all">
            <FontAwesomeIcon icon={faXmark} />
          </button>
        </div>
        <div className="p-5 space-y-5">
          <div>
            <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2.5">Jenis Transaksi</label>
            <div className="flex gap-2">
              {['semua', 'pemasukan', 'pengeluaran'].map(f => (
                <button key={f} onClick={() => setTempFilterType(f)}
                  className={`flex-1 py-2.5 rounded-xl text-xs font-bold transition-all capitalize border-2 ${
                    tempFilterType === f
                      ? f === 'pemasukan' ? 'bg-emerald-500 text-white border-emerald-500'
                      : f === 'pengeluaran' ? 'bg-rose-500 text-white border-rose-500'
                      : 'bg-slate-900 text-white border-slate-900'
                      : 'border-slate-200 text-slate-500 hover:border-slate-300 bg-white'
                  }`}>
                  {f === 'semua' ? 'Semua' : f === 'pemasukan' ? 'Pemasukan' : 'Pengeluaran'}
                </button>
              ))}
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2.5">
              <FontAwesomeIcon icon={faCalendarDays} className="mr-1.5" /> Bulan
            </label>
            <input type="month" value={tempFilterMonth} onChange={e => setTempFilterMonth(e.target.value)}
              className="w-full h-11 px-4 bg-slate-50 border-2 border-slate-200 rounded-xl text-sm font-medium text-slate-700 focus:outline-none focus:border-emerald-400 transition-all cursor-pointer" />
            {tempFilterMonth && (
              <button onClick={() => setTempFilterMonth('')} className="mt-1.5 text-xs text-rose-500 font-bold">
                Hapus pilihan bulan
              </button>
            )}
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2.5">
              <FontAwesomeIcon icon={faMagnifyingGlass} className="mr-1.5" /> Kata Kunci
            </label>
            <div className="relative">
              <input type="text" placeholder="Cari deskripsi atau kategori..." value={tempSearch}
                onChange={e => setTempSearch(e.target.value)}
                className="w-full h-11 pl-4 pr-9 bg-slate-50 border-2 border-slate-200 rounded-xl text-sm font-medium focus:outline-none focus:border-emerald-400 transition-all placeholder:text-slate-300" />
              {tempSearch && (
                <button onClick={() => setTempSearch('')} className="absolute right-3 top-1/2 -translate-y-1/2 h-5 w-5 bg-slate-200 rounded-md flex items-center justify-center text-slate-400">
                  <FontAwesomeIcon icon={faXmark} className="text-xs" />
                </button>
              )}
            </div>
          </div>

          <div className="flex gap-3 pt-1">
            <button onClick={onReset} className="flex-1 py-3 rounded-2xl text-xs font-bold bg-slate-100 text-slate-600 hover:bg-slate-200 transition-all">Reset</button>
            <button onClick={onApply} className="flex-[2] py-3 rounded-2xl text-xs font-bold text-white bg-slate-900 hover:bg-slate-700 transition-all shadow-lg">Terapkan Filter</button>
          </div>
        </div>
      </div>
    </div>
  );
}
