import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import {
  faRightFromBracket,
  faHouse,
  faChartPie,
  faBullseye,
} from '@fortawesome/free-solid-svg-icons';

const TABS = [
  { id: 'dashboard', label: 'Beranda',  icon: faHouse },
  { id: 'chart',     label: 'Grafik',   icon: faChartPie },
  { id: 'budget',    label: 'Anggaran', icon: faBullseye },
];

export default function Sidebar({ activeTab, navigateTo, handleLogout }) {
  return (
    <aside className="hidden md:flex flex-col w-60 shrink-0 bg-white border-r border-slate-200 h-[calc(100vh-57px)] sticky top-[57px] overflow-y-auto">
      <nav className="flex-1 p-3 space-y-0.5">
        <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest px-3 py-2 mt-1">
          Menu
        </p>
        {TABS.map(tab => {
          const isActive = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => navigateTo(tab.id)}
              className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-bold transition-all text-left group ${
                isActive
                  ? 'bg-emerald-50 text-emerald-700'
                  : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900'
              }`}
            >
              <div
                className={`h-8 w-8 rounded-xl flex items-center justify-center text-xs transition-all ${
                  isActive
                    ? 'bg-emerald-500 text-white shadow-md shadow-emerald-200'
                    : 'bg-slate-100 text-slate-500 group-hover:bg-slate-200'
                }`}
              >
                <FontAwesomeIcon icon={tab.icon} />
              </div>
              {tab.label}
              {isActive && (
                <div className="ml-auto h-1.5 w-1.5 rounded-full bg-emerald-500" />
              )}
            </button>
          );
        })}
      </nav>

      <div className="p-3 border-t border-slate-100">
        <button
          onClick={handleLogout}
          className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-bold text-slate-500 hover:bg-rose-50 hover:text-rose-600 transition-all group"
        >
          <div className="h-8 w-8 rounded-xl bg-slate-100 flex items-center justify-center text-xs text-slate-500 group-hover:bg-rose-100 group-hover:text-rose-500 transition-all">
            <FontAwesomeIcon icon={faRightFromBracket} />
          </div>
          Keluar
        </button>
      </div>
    </aside>
  );
}