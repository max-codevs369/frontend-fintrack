import { useRef } from 'react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import {
  faAngleLeft, faRotateLeft, faCloudArrowUp, faCheck,
  faCircleNotch, faTriangleExclamation, faCheckCircle, faCircleInfo,
  faArrowTrendUp, faArrowTrendDown,
} from '@fortawesome/free-solid-svg-icons';

const IMPORT_TEMPLATES = [
  {
    id: 'bca', name: 'BCA', color: '#003f7f', logo: '',
    hint: 'Export mutasi dari m-BCA / KlikBCA → Format CSV',
    columns: { date: 'Tanggal', description: 'Keterangan', debit: 'Debet', credit: 'Kredit' },
    example: `Tanggal,Keterangan,Debet,Kredit\n01/06/2025,TRANSFER GAJI PT ABC,,5000000\n03/06/2025,TOKOPEDIA PAYMENT,250000,`,
  },
  {
    id: 'mandiri', name: 'Mandiri', color: '#003087', logo: '',
    hint: 'Export mutasi dari Livin by Mandiri → Format Excel/CSV',
    columns: { date: 'Tanggal Transaksi', description: 'Deskripsi', debit: 'Debit', credit: 'Kredit' },
    example: `Tanggal Transaksi,Deskripsi,Debit,Kredit\n01/06/2025,GAJI JUNI 2025,,8000000\n02/06/2025,LISTRIK PLN,300000,`,
  },
  {
    id: 'gopay', name: 'GoPay', color: '#00AA13', logo: '',
    hint: 'Export riwayat dari GoPay → Fitur Export (akun verified)',
    columns: { date: 'Tanggal', description: 'Keterangan', debit: 'Keluar', credit: 'Masuk' },
    example: `Tanggal,Keterangan,Keluar,Masuk\n01 Jun 2025,Top Up GoPay,,200000\n02 Jun 2025,GoFood - Ayam Geprek,35000,`,
  },
  {
    id: 'dana', name: 'DANA', color: '#118EEA', logo: '',
    hint: 'Export riwayat dari DANA → Menu Riwayat → Export',
    columns: { date: 'Tanggal', description: 'Keterangan', debit: 'Pengeluaran', credit: 'Pemasukan' },
    example: `Tanggal,Keterangan,Pengeluaran,Pemasukan\n01/06/2025 08:00,Top Up DANA,,100000`,
  },
  {
    id: 'ovo', name: 'OVO', color: '#4C2A86', logo: '',
    hint: 'Export dari OVO → Riwayat → Download Statement',
    columns: { date: 'Date', description: 'Description', debit: 'Amount Out', credit: 'Amount In' },
    example: `Date,Description,Amount Out,Amount In\n01/06/2025,Top Up OVO,,300000`,
  },
  {
    id: 'custom', name: 'Format Lain', color: '#64748b', logo: '',
    hint: 'Upload CSV dengan format kolom bebas — kamu mapping manual',
    columns: { date: '', description: '', debit: '', credit: '' },
    example: '',
  },
];

const KATEGORI = {
  pemasukan: ['Gaji', 'Uang Bulanan' ,'Freelance', 'Investasi', 'Bonus', 'Lainnya'],
  pengeluaran: ['Makanan', 'Minuman', 'Transportasi', 'Belanja', 'Tagihan', 'Kesehatan', 'Hiburan', 'Lainnya'],
};

function formatRupiah(num) {
  return new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', minimumFractionDigits: 0 }).format(num ?? 0);
}

export default function ImportView({
  importStep, setImportStep,
  importBank, setImportBank,
  importFile, setImportFile,
  importCSV, setImportCSV,
  importMapping, setImportMapping,
  importPreview, setImportPreview,
  importWalletId, setImportWalletId,
  importLoading,
  wallets,
  handleFileUpload,
  handleBuildPreview,
  handleImportSubmit,
  resetImport,
  navigateTo,
}) {
  const fileInputRef = useRef(null);
  const stepLabels = ['Pilih Sumber', 'Upload File', 'Mapping Kolom', 'Cek & Import', 'Selesai'];

  return (
    <div className="space-y-5">
      <div className="flex items-center gap-3">
        {importStep > 1 && importStep < 5 && (
          <button onClick={() => setImportStep(s => s - 1)}
            className="h-9 w-9 bg-white border-2 border-slate-200 rounded-xl flex items-center justify-center text-slate-500 hover:border-slate-300 transition-all">
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
          <div key={i} className="flex items-center gap-1 flex-1">
            <div className={`h-2 rounded-full transition-all duration-300 w-full ${i + 1 <= importStep ? 'bg-emerald-500' : 'bg-slate-200'} ${i + 1 === importStep ? 'opacity-100' : ''}`} />
          </div>
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
                  className={`flex items-center gap-2.5 px-3.5 py-2.5 rounded-xl border-2 text-xs font-bold transition-all ${
                    importWalletId === w.id ? 'border-emerald-400 bg-emerald-50 text-emerald-700' : 'border-slate-200 text-slate-600 hover:border-slate-300'
                  }`}>
                  <div className="h-6 w-6 rounded-lg flex items-center justify-center text-white text-[10px] font-black flex-shrink-0" style={{ background: w.color }}>
                    {w.name.slice(0,2).toUpperCase()}
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
          <input ref={fileInputRef} type="file" accept=".csv,.xlsx,.xls,.txt" className="hidden"
            onChange={(e) => handleFileUpload(e, fileInputRef)} />
          {importFile && <p className="text-xs text-slate-500 font-medium text-center">📄 {importFile.name}</p>}
        </div>
      )}

      {importStep === 3 && (
        <div className="space-y-4">
          <div className="bg-white border-2 border-slate-100 rounded-2xl p-4">
            <p className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-3">
              Kolom yang ditemukan ({importCSV.headers.length})
            </p>
            <div className="flex flex-wrap gap-2">
              {importCSV.headers.map(h => (
                <span key={h} className="px-3 py-1 bg-slate-100 text-slate-700 text-xs font-bold rounded-lg">{h}</span>
              ))}
            </div>
          </div>
          <div className="space-y-3">
            {[
              { key: 'date',        label: 'Kolom Tanggal',                   required: true },
              { key: 'description', label: 'Kolom Keterangan/Deskripsi',      required: true },
              { key: 'debit',       label: 'Kolom Debit/Keluar (pengeluaran)', required: false },
              { key: 'credit',      label: 'Kolom Kredit/Masuk (pemasukan)',   required: false },
            ].map(field => (
              <div key={field.key}>
                <label className="block text-xs font-bold text-slate-600 mb-1.5">
                  {field.label} {field.required && <span className="text-rose-500">*</span>}
                </label>
                <select value={importMapping[field.key]}
                  onChange={e => setImportMapping(m => ({ ...m, [field.key]: e.target.value }))}
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
                <thead>
                  <tr>{importCSV.headers.map(h => <th key={h} className="text-left font-bold text-slate-600 pb-2 pr-3 whitespace-nowrap">{h}</th>)}</tr>
                </thead>
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
            <p className="text-xs font-bold text-slate-600">
              {importPreview.filter(r => r.selected).length} dari {importPreview.length} transaksi dipilih
            </p>
            <div className="flex gap-2">
              <button onClick={() => setImportPreview(p => p.map(r => ({ ...r, selected: true })))}
                className="text-xs font-bold text-emerald-600 px-3 py-1.5 bg-emerald-50 rounded-lg">
                Pilih Semua
              </button>
              <button onClick={() => setImportPreview(p => p.map(r => ({ ...r, selected: false })))}
                className="text-xs font-bold text-slate-500 px-3 py-1.5 bg-slate-100 rounded-lg">
                Batal Semua
              </button>
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
                  <div key={i}
                    onClick={() => setImportPreview(p => p.map((r, idx) => idx === i ? { ...r, selected: !r.selected } : r))}
                    className={`flex items-center gap-3 px-4 py-3 rounded-2xl border-2 cursor-pointer transition-all ${
                      row.selected ? 'border-emerald-200 bg-emerald-50/50' : 'border-slate-200 bg-white opacity-50'
                    }`}>
                    <div className={`h-5 w-5 rounded-md border-2 flex items-center justify-center flex-shrink-0 transition-all ${row.selected ? 'bg-emerald-500 border-emerald-500' : 'border-slate-300'}`}>
                      {row.selected && <FontAwesomeIcon icon={faCheck} className="text-white text-[9px]" />}
                    </div>
                    <div className={`h-8 w-8 rounded-xl flex items-center justify-center text-xs flex-shrink-0 ${row.type === 'pemasukan' ? 'bg-emerald-100 text-emerald-600' : 'bg-rose-100 text-rose-600'}`}>
                      <FontAwesomeIcon icon={row.type === 'pemasukan' ? faArrowTrendUp : faArrowTrendDown} />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-xs font-bold text-slate-800 truncate">{row.description}</p>
                      <div className="flex items-center gap-1.5 mt-0.5">
                        <select value={row.category} onClick={e => e.stopPropagation()}
                          onChange={e => setImportPreview(p => p.map((r, idx) => idx === i ? { ...r, category: e.target.value } : r))}
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
                {importLoading
                  ? <><FontAwesomeIcon icon={faCircleNotch} spin /> Mengimpor...</>
                  : `Import ${importPreview.filter(r => r.selected).length} Transaksi`
                }
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
            <button onClick={() => { navigateTo('dashboard'); resetImport(); }}
              className="flex-1 py-3 rounded-2xl text-xs font-bold bg-slate-900 text-white hover:bg-slate-700 transition-all">
              Lihat Transaksi →
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
