import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import {
  faHouse, faChartPie, faBullseye, faWallet, faFileImport,
} from '@fortawesome/free-solid-svg-icons';

const TABS = [
  { id: 'dashboard', label: 'Beranda',  icon: faHouse },
  { id: 'chart',     label: 'Grafik',   icon: faChartPie },
  { id: 'budget',    label: 'Anggaran', icon: faBullseye },
  { id: 'wallets',   label: 'Dompet',   icon: faWallet },
  { id: 'import',    label: 'Import',   icon: faFileImport },
];

export default function BottomNav({ activeTab, navigateTo }) {
  return (
    <nav className="md:hidden fixed bottom-0 left-0 right-0 bg-white/95 backdrop-blur-xl border-t border-slate-100 z-30">
      <div className="flex items-stretch h-[60px]">
        {TABS.map(tab => {
          const isActive = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => navigateTo(tab.id)}
              className="flex-1 flex flex-col items-center justify-center gap-0.5 relative transition-all active:scale-95"
            >
              {isActive && (
                <div className="absolute top-0 left-1/2 -translate-x-1/2 h-[3px] w-6 bg-emerald-500 rounded-full" />
              )}
              <div className={`flex items-center justify-center w-7 h-7 rounded-xl transition-all ${isActive ? 'bg-emerald-50' : ''}`}>
                <FontAwesomeIcon
                  icon={tab.icon}
                  className={`text-base transition-all ${isActive ? 'text-emerald-600' : 'text-slate-400'}`}
                />
              </div>
              <span className={`text-[9px] font-bold leading-none transition-all ${isActive ? 'text-emerald-600' : 'text-slate-400'}`}>
                {tab.label}
              </span>
            </button>
          );
        })}
      </div>
      <div className="h-safe-b" style={{ height: 'env(safe-area-inset-bottom, 0px)', background: 'white' }} />
    </nav>
  );
}