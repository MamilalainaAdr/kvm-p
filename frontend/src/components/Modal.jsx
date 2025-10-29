import React from 'react';

export default function Modal({ open, title, children, onClose }) {
  if (!open) return null;
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      <div className="absolute inset-0 bg-black/40" onClick={onClose} />
      <div className="relative z-10 w-full max-w-3xl mx-4">
        <div className="bg-white rounded shadow-lg overflow-hidden">
          <div className="flex items-center justify-between px-4 py-3 border-b">
            <h3 className="text-lg font-semibold text-slate-800">{title}</h3>
            <button onClick={onClose} className="text-slate-500 hover:text-slate-800">✕</button>
          </div>
          <div className="p-4 max-h-[70vh] overflow-auto text-slate-700">
            {children}
          </div>
        </div>
      </div>
    </div>
  );
}