import React, { useEffect } from 'react';
import { X } from 'lucide-react';

interface ModalProps {
  open: boolean;
  title: string;
  maxWidthClass?: string;
  onClose: () => void;
  children: React.ReactNode;
}

export function Modal({
  open,
  title,
  maxWidthClass = 'max-w-lg',
  onClose,
  children,
}: ModalProps) {
  useEffect(() => {
    if (!open) return;
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [open, onClose]);

  if (!open) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-xs p-4 overflow-y-auto"
      role="dialog"
      aria-modal="true"
      aria-labelledby="modal-title"
      onMouseDown={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div
        className={`bg-white rounded-2xl shadow-2xl border border-slate-200 w-full ${maxWidthClass} overflow-hidden my-auto`}
      >
        <div className="flex items-center justify-between px-6 py-4 bg-[#0B213A] text-white border-b-2 border-[#D98A1A]">
          <h3 id="modal-title" className="font-bold text-base sm:text-lg tracking-tight truncate pr-4">
            {title}
          </h3>
          <button
            type="button"
            onClick={onClose}
            aria-label="Cerrar ventana"
            className="p-1.5 rounded-lg hover:bg-[#1565A0]/50 text-sky-200 hover:text-white transition-colors focus-visible:outline-2 focus-visible:outline-[#F59E0B] shrink-0"
          >
            <X className="w-5 h-5" />
          </button>
        </div>
        <div className="p-6 max-h-[82vh] overflow-y-auto">{children}</div>
      </div>
    </div>
  );
}
