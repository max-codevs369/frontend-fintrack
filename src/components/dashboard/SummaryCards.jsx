import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import {
  faArrowTrendUp, faArrowTrendDown, faScaleBalanced, faCircleNotch,
} from '@fortawesome/free-solid-svg-icons';

function formatRupiah(num) {
  return new Intl.NumberFormat('id-ID', {
    style: 'currency', currency: 'IDR', minimumFractionDigits: 0,
  }).format(num ?? 0);
}

export default function SummaryCards({
  loading,
  dynamicPemasukan,
  dynamicPengeluaran,
  dynamicSaldo,
  isFiltered,
}) {
  return (
    <div className="grid grid-cols-3 gap-2 sm:gap-4">
      <div className="bg-gradient-to-br from-emerald-500 to-teal-600 text-white p-3 sm:p-5 rounded-2xl shadow-lg shadow-emerald-500/20 overflow-hidden relative cursor-default">
        <div className="absolute -right-3 -bottom-3 text-6xl opacity-[0.08]">
          <FontAwesomeIcon icon={faArrowTrendUp} />
        </div>
        <p className="text-[9px] sm:text-xs font-bold opacity-70 uppercase tracking-widest mb-1.5">Pemasukan</p>
        <h3 className="text-xs sm:text-lg font-black leading-tight">
          {loading ? <FontAwesomeIcon icon={faCircleNotch} spin /> : formatRupiah(dynamicPemasukan)}
        </h3>
      </div>

      <div className="bg-gradient-to-br from-rose-500 to-pink-600 text-white p-3 sm:p-5 rounded-2xl shadow-lg shadow-rose-500/20 overflow-hidden relative cursor-default">
        <div className="absolute -right-3 -bottom-3 text-6xl opacity-[0.08]">
          <FontAwesomeIcon icon={faArrowTrendDown} />
        </div>
        <p className="text-[9px] sm:text-xs font-bold opacity-70 uppercase tracking-widest mb-1.5">Pengeluaran</p>
        <h3 className="text-xs sm:text-lg font-black leading-tight">
          {loading ? <FontAwesomeIcon icon={faCircleNotch} spin /> : formatRupiah(dynamicPengeluaran)}
        </h3>
      </div>

      <div
        className={`text-white p-3 sm:p-5 rounded-2xl shadow-lg overflow-hidden relative cursor-default transition-all duration-500 ${
          dynamicSaldo >= 0
            ? 'bg-gradient-to-br from-indigo-600 to-blue-700 shadow-indigo-500/20'
            : 'bg-gradient-to-br from-orange-500 to-red-600 shadow-orange-500/20'
        }`}
      >
        <div className="absolute -right-3 -bottom-3 text-6xl opacity-[0.08]">
          <FontAwesomeIcon icon={faScaleBalanced} />
        </div>
        <p className="text-[9px] sm:text-xs font-bold opacity-70 uppercase tracking-widest mb-1.5">
          {isFiltered ? 'Selisih' : 'Saldo'}
        </p>
        <h3 className="text-xs sm:text-lg font-black leading-tight">
          {loading ? <FontAwesomeIcon icon={faCircleNotch} spin /> : formatRupiah(dynamicSaldo)}
        </h3>
      </div>
    </div>
  );
}