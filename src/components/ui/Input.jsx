import React from 'react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';

export default function Input({ 
  label, 
  type = 'text', 
  value, 
  onChange, 
  rightIcon,
  onRightIconClick, 
  placeholder, 
  icon,       
  error,      
  required = false 
}) {
  return (
    <div className="mb-5 relative">
      {label && (
        <label className="block text-xs font-bold text-slate-600 uppercase tracking-wide mb-2">
          {label} {required && <span className="text-rose-500 ml-0.5">*</span>}
        </label>
      )}
      
      <div className="relative flex items-center group">
        {icon && (
          <div className={`absolute left-4 transition-colors duration-300 z-10 ${
            error ? 'text-rose-400' : 'text-slate-400 group-focus-within:text-emerald-500'
          }`}>
            <FontAwesomeIcon icon={icon} className="text-sm" />
          </div>
        )}
        
        <input
          type={type}
          value={value}
          onChange={onChange}
          placeholder={placeholder}
          required={required}
          className={`
            w-full bg-slate-50/50 text-sm text-slate-800 placeholder-slate-400
            border rounded-xl transition-all duration-300 shadow-sm
            focus:outline-none focus:bg-white focus:ring-4
            
            /* FIX 2: Atur padding kiri dan kanan secara dinamis agar tidak tabrakan dengan ikon */
            ${icon ? 'pl-11' : 'pl-4'}
            ${rightIcon ? 'pr-11' : 'pr-4'}
            py-3

            ${
              error
                ? 'border-rose-300 focus:border-rose-500 focus:ring-rose-500/20 bg-rose-50/30'
                : 'border-slate-200 hover:border-slate-300 focus:border-emerald-500 focus:ring-emerald-500/20'
            }
          `}
        />

        {rightIcon && (
          <button
            type="button" 
            onClick={onRightIconClick}
            className={`absolute right-4 transition-colors duration-300 z-10 focus:outline-none ${
              error ? 'text-rose-400' : 'text-slate-400 hover:text-emerald-500'
            }`}
          >
            <FontAwesomeIcon icon={rightIcon} className="text-sm" />
          </button>
        )}
      </div>

      {error && (
        <p className="mt-1.5 text-xs font-semibold text-rose-500 animate-fade-in flex items-center gap-1">
          <span>⚠️</span> {error}
        </p>
      )}
    </div>
  );
}