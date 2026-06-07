import React from 'react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faCircleNotch } from '@fortawesome/free-solid-svg-icons';

export default function Button({ 
  children, 
  variant = 'primary', 
  onClick, 
  disabled, 
  isLoading = false, 
  type = 'submit', 
  size = 'md' 
}) {
  
  const base = "relative flex items-center justify-center gap-2 w-full rounded-xl font-bold tracking-wide transition-all duration-300 transform active:scale-[0.98] focus:outline-none focus:ring-2 focus:ring-offset-2 disabled:opacity-65 disabled:cursor-not-allowed disabled:active:scale-100 overflow-hidden";

  const sizes = {
    sm: "py-2 px-4 text-xs",
    md: "py-3 px-4 text-sm",
    lg: "py-3.5 px-6 text-base",
  };

  const styles = {
    primary: "text-white bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-400 hover:to-teal-500 focus:ring-emerald-500 hover:shadow-xl hover:shadow-emerald-500/40 hover:-translate-y-0.5 border border-transparent",
    
    secondary: "text-slate-700 bg-white border border-slate-200 hover:bg-slate-50 focus:ring-slate-400 hover:shadow-lg hover:shadow-slate-200/60 hover:border-slate-300 hover:-translate-y-0.5",
    
    danger: "text-white bg-gradient-to-r from-rose-500 to-pink-600 hover:from-rose-400 hover:to-pink-500 focus:ring-rose-500 hover:shadow-xl hover:shadow-rose-500/40 hover:-translate-y-0.5 border border-transparent",
  };

  return (
    <button
      type={type}
      onClick={onClick}
      disabled={disabled || isLoading} 
      className={`${base} ${sizes[size]} ${styles[variant]}`}
    >
      {isLoading && (
        <FontAwesomeIcon icon={faCircleNotch} spin className="text-current opacity-90 text-lg" />
      )}
      
      <span className={`${isLoading ? 'ml-1' : ''}`}>{children}</span>
    </button>
  );
}