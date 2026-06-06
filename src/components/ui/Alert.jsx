import React from 'react';

export default function Alert({ type, message }) {
  if (!message) return null;
  const isError = type === 'error';
  return (
    <div className={`flex items-center gap-2 p-3.5 rounded-xl text-sm mb-5 border animate-fade-in ${
      isError ? 'bg-rose-50 text-rose-700 border-rose-100' : 'bg-emerald-50 text-emerald-700 border-emerald-100'
    }`}>
      <span className="font-bold">{isError ? '⚠️' : '✅'}</span>
      <p className="font-medium">{message}</p>
    </div>
  );
}