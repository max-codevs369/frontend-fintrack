import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import {
  faArrowTrendUp, faArrowTrendDown, faBoxOpen, faMagnifyingGlass,
  faCircleNotch, faPlus, faFileImport, faChartPie, faFileExport,
  faArrowRight, faSliders, faXmark, faBullseye, faTrash, faPencil,
  faCircleInfo,
} from '@fortawesome/free-solid-svg-icons';
import {
  PieChart, Pie, Cell, Tooltip, ResponsiveContainer,
  BarChart, Bar, XAxis, YAxis, CartesianGrid,
} from 'recharts';

const CHART_COLORS = ['#10b981','#6366f1','#f59e0b','#f43f5e','#8b5cf6','#0ea5e9','#ec4899','#14b8a6'];

function formatRupiah(num) {
  return new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', minimumFractionDigits: 0 }).format(num ?? 0);
}
function formatTanggal(dateStr) {
  return new Date(dateStr).toLocaleDateString('id-ID', { day: '2-digit', month: 'short', year: 'numeric' });
}
function walletTypeLabel(type) {
  return { cash: 'Tunai', bank: 'Bank', ewallet: 'E-Wallet', card: 'Kartu Kredit' }[type] || type;
}

const CustomTooltip = ({ active, payload }) => {
  if (!active || !payload?.length) return null;
  return (
    <div className="bg-white border border-slate-100 rounded-2xl shadow-xl px-4 py-3 text-sm">
      <p className="font-bold text-slate-700">{payload[0].name}</p>
      <p className="font-black text-emerald-600 mt-0.5">{formatRupiah(payload[0].value)}</p>
    </div>
  );
};

export function DashboardView({
  loading, filteredTx, wallets, walletBalances,
  filterType, filterMonth, searchTerm,
  isFiltered, activeFilterCount, dynamicSaldo,
  setFilterType, setFilterMonth, setSearchTerm,
  setShowModal, navigateTo, handleExport, openFilterModal,
  setDeleteTarget,
}) {
  return (
    <div className="space-y-5">
      <div className="grid grid-cols-4 gap-2 sm:gap-3">
        {[
          { label: 'Catat',  icon: faPlus,       color: 'bg-emerald-500', action: () => setShowModal(true) },
          { label: 'Grafik', icon: faChartPie,    color: 'bg-amber-500',   action: () => navigateTo('chart') },
          { label: 'Ekspor', icon: faFileExport,  color: 'bg-slate-600',   action: handleExport },
        ].map(a => (
          <button key={a.label} onClick={a.action}
            className="flex flex-col items-center gap-2 py-3.5 sm:py-4 bg-white rounded-2xl border-2 border-slate-100 hover:border-slate-200 shadow-sm hover:shadow-md transition-all active:scale-95">
            <div className={`h-9 w-9 sm:h-10 sm:w-10 ${a.color} rounded-xl flex items-center justify-center text-white text-sm shadow-md`}>
              <FontAwesomeIcon icon={a.icon} />
            </div>
            <span className="text-[10px] sm:text-[11px] font-bold text-slate-600">{a.label}</span>
          </button>
        ))}
      </div>

      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <h2 className="text-sm font-extrabold text-slate-900">Riwayat Transaksi</h2>
          <div className="flex items-center gap-2">
            {!loading && <span className="text-xs text-slate-400 font-medium">{filteredTx.length} transaksi</span>}
            <button onClick={openFilterModal}
              className={`relative flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold border-2 transition-all ${
                activeFilterCount > 0
                  ? 'bg-emerald-50 border-emerald-300 text-emerald-700'
                  : 'bg-white border-slate-200 text-slate-500 hover:border-slate-300'
              }`}>
              <FontAwesomeIcon icon={faSliders} />
              <span className="hidden sm:inline">Filter</span>
              {activeFilterCount > 0 && (
                <span className="absolute -top-1.5 -right-1.5 h-4 w-4 bg-emerald-500 text-white text-[9px] font-black rounded-full flex items-center justify-center">
                  {activeFilterCount}
                </span>
              )}
            </button>
          </div>
        </div>

        {isFiltered && (
          <div className="flex flex-wrap gap-1.5">
            {filterType !== 'semua' && (
              <span className="flex items-center gap-1 px-2.5 py-1 bg-emerald-50 border border-emerald-200 text-emerald-700 text-[10px] font-bold rounded-lg">
                {filterType === 'pemasukan' ? 'Pemasukan' : 'Pengeluaran'}
                <button onClick={() => setFilterType('semua')} className="hover:text-emerald-900"><FontAwesomeIcon icon={faXmark} /></button>
              </span>
            )}
            {filterMonth && (
              <span className="flex items-center gap-1 px-2.5 py-1 bg-indigo-50 border border-indigo-200 text-indigo-700 text-[10px] font-bold rounded-lg">
                {new Date(filterMonth + '-01').toLocaleDateString('id-ID', { month: 'long', year: 'numeric' })}
                <button onClick={() => setFilterMonth('')} className="hover:text-indigo-900"><FontAwesomeIcon icon={faXmark} /></button>
              </span>
            )}
            {searchTerm && (
              <span className="flex items-center gap-1 px-2.5 py-1 bg-amber-50 border border-amber-200 text-amber-700 text-[10px] font-bold rounded-lg">
                "{searchTerm}"
                <button onClick={() => setSearchTerm('')} className="hover:text-amber-900"><FontAwesomeIcon icon={faXmark} /></button>
              </span>
            )}
            <button onClick={() => { setFilterType('semua'); setFilterMonth(''); setSearchTerm(''); }}
              className="px-2.5 py-1 text-slate-400 text-[10px] font-bold hover:text-rose-500 transition-colors">
              Reset semua
            </button>
          </div>
        )}

        {loading ? (
          <div className="py-16 flex flex-col items-center gap-3">
            <FontAwesomeIcon icon={faCircleNotch} spin className="text-2xl text-emerald-500" />
            <p className="text-xs font-bold text-slate-500">Memuat data...</p>
          </div>
        ) : filteredTx.length === 0 ? (
          <div className="py-16 flex flex-col items-center bg-white rounded-2xl border-2 border-dashed border-slate-200">
            <FontAwesomeIcon icon={isFiltered ? faMagnifyingGlass : faBoxOpen} className="text-3xl text-slate-300 mb-3" />
            <p className="text-sm font-bold text-slate-600">{isFiltered ? 'Tidak ditemukan' : 'Belum ada transaksi'}</p>
            <p className="text-xs mt-1 text-slate-400">{isFiltered ? 'Coba ubah filter kamu' : 'Mulai catat hari ini!'}</p>
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
                      <span className={`text-[10px] font-bold px-2 py-0.5 rounded-md ${tx.type === 'pemasukan' ? 'bg-emerald-50 text-emerald-600' : 'bg-rose-50 text-rose-600'}`}>
                        {tx.category}
                      </span>
                      {wallet && <span className="text-[10px] font-semibold px-2 py-0.5 rounded-md bg-slate-100 text-slate-500">{wallet.name}</span>}
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
}

export function ChartView({ transactions, pengeluaranByKat, pemasukanByKat, monthlyTrend }) {
  return (
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
        {[
          { data: pengeluaranByKat, title: 'Pengeluaran per Kategori' },
          { data: pemasukanByKat,   title: 'Pemasukan per Kategori' },
        ].map(({ data, title }) => (
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
                      <div className="flex items-center gap-2">
                        <div className="h-2 w-2 rounded-full" style={{ background: CHART_COLORS[i % CHART_COLORS.length] }} />
                        <span className="text-slate-600">{item.name}</span>
                      </div>
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
}

export function BudgetView({ budgetProgress, setBudgets, setShowBudgetModal }) {
  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-base font-extrabold text-slate-900">Anggaran</h2>
          <p className="text-xs text-slate-400 mt-0.5">
            {new Date().toLocaleDateString('id-ID', { month: 'long', year: 'numeric' })}
          </p>
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
          <button onClick={() => setShowBudgetModal(true)} className="mt-4 px-5 py-2.5 bg-slate-900 text-white text-xs font-bold rounded-xl">
            Mulai sekarang
          </button>
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
                <div className={`h-full rounded-full transition-all duration-700 ${b.over ? 'bg-rose-500 animate-pulse' : b.warn ? 'bg-amber-400' : 'bg-emerald-500'}`}
                  style={{ width: `${b.pct}%` }} />
              </div>
              <div className="flex justify-between mt-2">
                <span className="text-xs text-slate-400">
                  Sisa: <span className={`font-bold ${b.over ? 'text-rose-500' : 'text-slate-700'}`}>
                    {b.over ? `-${formatRupiah(b.spent - b.limit)}` : formatRupiah(b.limit - b.spent)}
                  </span>
                </span>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

export function WalletsView({ wallets, walletBalances, transactions, setWallets, setEditingWallet, setWalletForm, setShowWalletModal }) {
  return (
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
          <p className="text-xs text-blue-600 leading-relaxed">Saldo dihitung dari transaksi yang kamu catat. Gunakan fitur <span className="font-bold">Import Mutasi</span> untuk mempercepat pencatatan.</p>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        {walletBalances.map(w => (
          <div key={w.id} className="bg-white rounded-2xl border-2 border-slate-100 p-5 group transition-all hover:border-slate-200">
            <div className="flex items-start justify-between mb-4">
              <div className="flex items-center gap-3">
                <div className="h-10 w-10 rounded-xl flex items-center justify-center text-white text-xs font-black shadow-md" style={{ background: w.color }}>
                  {w.name.slice(0,2).toUpperCase()}
                </div>
                <div>
                  <p className="text-sm font-extrabold text-slate-900">{w.name}</p>
                  <p className="text-xs text-slate-400">{walletTypeLabel(w.type)}</p>
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
            <p className={`text-xl font-black tracking-tight ${w.balance >= 0 ? 'text-slate-900' : 'text-rose-600'}`}>
              {formatRupiah(w.balance)}
            </p>
            <div className="flex gap-3 mt-3 pt-3 border-t border-slate-100">
              <div className="flex-1">
                <p className="text-[10px] text-slate-400 mb-0.5">Masuk</p>
                <p className="text-xs font-black text-emerald-600">
                  +{formatRupiah(transactions.filter(t => t.wallet_id === w.id && t.type === 'pemasukan').reduce((s, t) => s + t.amount, 0))}
                </p>
              </div>
              <div className="w-px bg-slate-100" />
              <div className="flex-1">
                <p className="text-[10px] text-slate-400 mb-0.5">Keluar</p>
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
}
