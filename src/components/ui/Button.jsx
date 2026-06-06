import React from 'react';

export default function Button({ children, variant = 'primary', onClick, disabled, type = 'submit', size = 'md' }) {
  const base = "w-full rounded-xl text-sm font-semibold tracking-wide shadow-sm focus:outline-none focus:ring-2 focus:ring-offset-2 transition-all duration-200 transform active:scale-[0.98] disabled:opacity-60 disabled:cursor-not-allowed";
  const sizes = {
    sm: "py-1.5 px-3",
    md: "py-2.5 px-4",
  };
  const styles = {
    primary: "text-white bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 focus:ring-emerald-500 shadow-emerald-100",
    secondary: "text-slate-700 bg-slate-100 hover:bg-slate-200 focus:ring-slate-400 shadow-slate-100",
    danger: "text-white bg-gradient-to-r from-rose-600 to-pink-600 hover:from-rose-700 hover:to-pink-700 focus:ring-rose-500 shadow-rose-100",
  };
  return (
    <button type={type} onClick={onClick} disabled={disabled} className={`${base} ${sizes[size]} ${styles[variant]}`}>
      {children}
    </button>
  );
}
