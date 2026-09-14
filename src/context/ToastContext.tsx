import React, { createContext, useContext, useState, useCallback } from 'react';
import { CheckCircle2, AlertCircle, Info, AlertTriangle, X } from 'lucide-react';

export type ToastType = 'success' | 'error' | 'info' | 'warning';

export interface ToastItem {
  id: string;
  type: ToastType;
  title: string;
  message?: string;
  duration?: number;
}

interface ToastContextType {
  toasts: ToastItem[];
  addToast: (toast: Omit<ToastItem, 'id'>) => void;
  removeToast: (id: string) => void;
  success: (title: string, message?: string) => void;
  error: (title: string, message?: string) => void;
  info: (title: string, message?: string) => void;
  warning: (title: string, message?: string) => void;
}

const ToastContext = createContext<ToastContextType | undefined>(undefined);

export const ToastProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [toasts, setToasts] = useState<ToastItem[]>([]);

  const removeToast = useCallback((id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  const addToast = useCallback(
    (toast: Omit<ToastItem, 'id'>) => {
      const id = `toast-${Date.now()}-${Math.random().toString(36).substr(2, 4)}`;
      const duration = toast.duration ?? 4000;
      setToasts((prev) => [...prev, { ...toast, id }]);

      if (duration > 0) {
        setTimeout(() => {
          removeToast(id);
        }, duration);
      }
    },
    [removeToast]
  );

  const success = useCallback((title: string, message?: string) => {
    addToast({ type: 'success', title, message });
  }, [addToast]);

  const error = useCallback((title: string, message?: string) => {
    addToast({ type: 'error', title, message, duration: 6000 });
  }, [addToast]);

  const info = useCallback((title: string, message?: string) => {
    addToast({ type: 'info', title, message });
  }, [addToast]);

  const warning = useCallback((title: string, message?: string) => {
    addToast({ type: 'warning', title, message });
  }, [addToast]);

  return (
    <ToastContext.Provider value={{ toasts, addToast, removeToast, success, error, info, warning }}>
      {children}
      {/* Toast Notification Container */}
      <div
        aria-live="polite"
        className="fixed bottom-5 right-5 z-50 flex flex-col gap-2 max-w-sm w-full pointer-events-none"
      >
        {toasts.map((toast) => {
          const icons = {
            success: <CheckCircle2 className="w-4 h-4 text-signal flex-shrink-0" />,
            error: <AlertCircle className="w-4 h-4 text-rust flex-shrink-0" />,
            warning: <AlertTriangle className="w-4 h-4 text-amber flex-shrink-0" />,
            info: <Info className="w-4 h-4 text-indigo flex-shrink-0" />,
          };

          const borderColors = {
            success: 'border-signal/30 bg-paper-raised text-ink',
            error: 'border-rust/30 bg-paper-raised text-ink',
            warning: 'border-amber/30 bg-paper-raised text-ink',
            info: 'border-indigo/30 bg-paper-raised text-ink',
          };

          return (
            <div
              key={toast.id}
              className={`pointer-events-auto p-3.5 rounded-xl border shadow-float backdrop-blur-md flex items-start justify-between gap-3 animate-slide-up transition-all ${borderColors[toast.type]}`}
            >
              <div className="flex items-start gap-2.5">
                <div className="mt-0.5">{icons[toast.type]}</div>
                <div>
                  <h5 className="text-xs font-semibold leading-snug">{toast.title}</h5>
                  {toast.message && (
                    <p className="text-[11px] text-ink-soft mt-0.5 leading-relaxed">
                      {toast.message}
                    </p>
                  )}
                </div>
              </div>
              <button
                onClick={() => removeToast(toast.id)}
                className="text-ink-faint hover:text-ink p-1 rounded transition-colors"
                aria-label="Close notification"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            </div>
          );
        })}
      </div>
    </ToastContext.Provider>
  );
};

export const useToast = (): ToastContextType => {
  const context = useContext(ToastContext);
  if (!context) {
    throw new Error('useToast must be used within a ToastProvider');
  }
  return context;
};
