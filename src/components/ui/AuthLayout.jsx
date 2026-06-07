import React from 'react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faWallet } from '@fortawesome/free-solid-svg-icons';

export default function AuthLayout({ title, subtitle, children }) {
  return (
    <div className="relative min-h-screen bg-slate-50 flex flex-col justify-center py-12 px-4 sm:px-6 lg:px-8 overflow-hidden">
      
      <div className="absolute top-[-10%] left-[-10%] w-96 h-96 bg-emerald-300 rounded-full mix-blend-multiply filter blur-[100px] opacity-40"></div>
      <div className="absolute top-[20%] right-[-5%] w-96 h-96 bg-teal-300 rounded-full mix-blend-multiply filter blur-[100px] opacity-40"></div>
      <div className="absolute bottom-[-10%] left-[20%] w-96 h-96 bg-sky-200 rounded-full mix-blend-multiply filter blur-[100px] opacity-40"></div>

      <div className="relative z-10 sm:mx-auto sm:w-full sm:max-w-md">
        
        <div className="mx-auto h-16 w-16 bg-gradient-to-br from-emerald-500 to-teal-600 rounded-2xl flex items-center justify-center shadow-xl shadow-emerald-500/30 mb-6 transform transition hover:-translate-y-1 hover:shadow-emerald-500/50 duration-300">
          <FontAwesomeIcon icon={faWallet} className="text-white text-3xl" />
        </div>
        
        <h2 className="text-center text-3xl font-extrabold text-slate-900 tracking-tight">
          {title}
        </h2>
        <p className="mt-2 text-center text-sm font-medium text-slate-500">
          {subtitle}
        </p>
      </div>

      <div className="relative z-10 mt-8 sm:mx-auto sm:w-full sm:max-w-md">
        <div className="bg-white/70 backdrop-blur-xl py-8 px-4 shadow-2xl shadow-slate-200/50 rounded-3xl sm:px-10 border border-white">
          {children}
        </div>
      </div>
      
    </div>
  );
}