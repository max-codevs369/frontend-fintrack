import { useRef } from 'react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import {
  faWallet, faRightFromBracket, faPlus, faChevronDown, faFileImport,
} from '@fortawesome/free-solid-svg-icons';

function getInitials(name) {
  if (!name) return 'U';
  return name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2);
}

export default function Header({
  userName,
  userMenuOpen,
  setUserMenuOpen,
  handleLogout,
  setShowModal,
  navigateTo,
}) {
  const userMenuRef = useRef(null);

  return (
    <header className="bg-white border-b border-slate-200/60 px-4 sm:px-6 py-0 sticky top-0 z-30 shadow-sm">
      <div className="flex justify-between items-center h-14 sm:h-16 max-w-full">
        <div className="flex items-center gap-2.5">
          <div className="h-8 w-8 bg-gradient-to-br from-emerald-500 to-teal-600 rounded-xl flex items-center justify-center text-white shadow-md shadow-emerald-200">
            <FontAwesomeIcon icon={faWallet} className="text-sm" />
          </div>
          <span className="font-black text-lg tracking-tight text-slate-900">FinTrack</span>
        </div>

        <div className="flex items-center gap-2.5">
          <button
            onClick={() => setShowModal(true)}
            className="md:hidden flex items-center gap-1.5 px-3.5 py-2 bg-emerald-500 hover:bg-emerald-600 text-white text-xs font-bold rounded-xl transition-all shadow-md shadow-emerald-200 active:scale-95"
          >
            <FontAwesomeIcon icon={faPlus} /> Catat
          </button>

          <div className="hidden md:flex items-center gap-2">
            <button
              onClick={() => setShowModal(true)}
              className="flex items-center gap-1.5 px-3.5 py-2 bg-emerald-500 hover:bg-emerald-600 text-white text-xs font-bold rounded-xl transition-all shadow-md shadow-emerald-200"
            >
              <FontAwesomeIcon icon={faPlus} /> Catat
            </button>
            <button
              onClick={() => navigateTo('import')}
              className="flex items-center gap-1.5 px-3.5 py-2 bg-white border-2 border-slate-200 hover:border-slate-300 text-slate-600 text-xs font-bold rounded-xl transition-all"
            >
              <FontAwesomeIcon icon={faFileImport} /> Import
            </button>
          </div>

          <div className="relative" ref={userMenuRef}>
            <button
              onClick={() => setUserMenuOpen(o => !o)}
              className="flex items-center gap-2 pl-1 pr-2.5 py-1 rounded-xl hover:bg-slate-100 transition-all"
            >
              <div className="h-8 w-8 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-xl flex items-center justify-center text-white text-xs font-black shadow-md select-none">
                {getInitials(userName || 'User')}
              </div>
              <div className="hidden sm:block text-left">
                <p className="text-xs font-bold text-slate-800 leading-tight max-w-[80px] truncate">
                  {userName || 'Pengguna'}
                </p>
              </div>
              <FontAwesomeIcon
                icon={faChevronDown}
                className={`text-[10px] text-slate-400 transition-transform duration-200 ${userMenuOpen ? 'rotate-180' : ''}`}
              />
            </button>

            {userMenuOpen && (
              <div className="absolute right-0 top-full mt-2 w-52 bg-white rounded-2xl shadow-2xl border border-slate-200/80 overflow-hidden z-50">
                <div className="px-4 py-3.5 border-b border-slate-100">
                  <div className="flex items-center gap-3">
                    <div className="h-10 w-10 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-xl flex items-center justify-center text-white text-sm font-black shadow-md">
                      {getInitials(userName || 'User')}
                    </div>
                    <div className="min-w-0">
                      <p className="text-sm font-bold text-slate-900 truncate">{userName || 'Pengguna'}</p>
                      <p className="text-[10px] text-slate-400 font-medium">Akun aktif</p>
                    </div>
                  </div>
                </div>
                <div className="p-2">
                  <button
                    onClick={handleLogout}
                    className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-bold text-rose-600 hover:bg-rose-50 transition-all text-left"
                  >
                    <div className="h-7 w-7 bg-rose-100 rounded-lg flex items-center justify-center text-xs">
                      <FontAwesomeIcon icon={faRightFromBracket} />
                    </div>
                    Keluar
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </header>
  );
}