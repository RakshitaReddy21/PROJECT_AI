import React, { useEffect } from 'react';
import { X } from 'lucide-react';

export interface ModalProps {
  isOpen: boolean;
  onClose: () => void;
  title?: string;
  description?: string;
  children: React.ReactNode;
}

export const Modal: React.FC<ModalProps> = ({ isOpen, onClose, title, description, children }) => {
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    if (isOpen) {
      document.addEventListener('keydown', handleKeyDown);
    }
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-stone-900/20 backdrop-blur-sm animate-fade-in">
      <div
        className="relative w-full max-w-lg bg-white rounded-xl shadow-panel border border-[#F1E8E3] p-6 overflow-hidden max-h-[90vh] flex flex-col"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-start justify-between pb-4 border-b border-[#F1E8E3]">
          <div>
            {title && <h2 className="font-sans text-xl font-semibold text-ink">{title}</h2>}
            {description && <p className="text-xs text-ink-faint mt-1">{description}</p>}
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded-md text-ink-faint hover:text-ink hover:bg-[#FFF0E8] transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>
        <div className="py-4 overflow-y-auto flex-1">{children}</div>
      </div>
    </div>
  );
};
