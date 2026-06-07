import React from 'react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faCircleCheck, faTriangleExclamation } from '@fortawesome/free-solid-svg-icons';

export default function Alert({ type, message }) {
  if (!message) return null;
  
  const isError = type === 'error';

  return (
    <div
      className={`relative flex items-start gap-4 p-4 mb-5 rounded-xl shadow-lg border-l-4 overflow-hidden transform transition-all animate-fade-in ${
        isError
          ? 'bg-white border-rose-500 shadow-rose-100/50'
          : 'bg-white border-emerald-500 shadow-emerald-100/50'
      }`}
    >
      <div
        className={`absolute inset-0 opacity-10 pointer-events-none ${
          isError
            ? 'bg-gradient-to-r from-rose-500 to-transparent'
            : 'bg-gradient-to-r from-emerald-500 to-transparent'
        }`}
      ></div>

      <div
        className={`flex-shrink-0 flex items-center justify-center w-10 h-10 rounded-full z-10 ${
          isError ? 'bg-rose-100 text-rose-600' : 'bg-emerald-100 text-emerald-600'
        }`}
      >
        <FontAwesomeIcon
          icon={isError ? faTriangleExclamation : faCircleCheck}
          className="text-lg"
        />
      </div>

      <div className="flex-1 pt-0.5 z-10">
        <h3
          className={`text-sm font-bold tracking-wide uppercase ${
            isError ? 'text-rose-700' : 'text-emerald-700'
          }`}
        >
          {isError ? 'Peringatan' : 'Berhasil'}
        </h3>
        <p className="text-slate-600 text-sm font-medium mt-1 leading-snug">
          {message}
        </p>
      </div>
    </div>
  );
}