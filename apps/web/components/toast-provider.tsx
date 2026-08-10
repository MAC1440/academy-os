'use client';

import { createContext, useCallback, useContext, useRef, useState } from 'react';
import { CheckCircle2, X, XCircle } from 'lucide-react';

type ToastTone = 'success' | 'error';
type Toast = { id: number; message: string; tone: ToastTone };
type ToastContextValue = { success: (message: string) => void; error: (message: string) => void };

const ToastContext = createContext<ToastContextValue | null>(null);

export function ToastProvider({ children }: { children: React.ReactNode }) {
  const nextId = useRef(0);
  const [toasts, setToasts] = useState<Toast[]>([]);

  const dismiss = useCallback((id: number) => {
    setToasts((current) => current.filter((toast) => toast.id !== id));
  }, []);

  const show = useCallback(
    (message: string, tone: ToastTone) => {
      const id = ++nextId.current;
      setToasts((current) => [...current, { id, message, tone }].slice(-3));
      window.setTimeout(() => dismiss(id), 4000);
    },
    [dismiss],
  );

  return (
    <ToastContext.Provider
      value={{
        success: (message) => show(message, 'success'),
        error: (message) => show(message, 'error'),
      }}
    >
      {children}
      <div
        aria-live="polite"
        aria-atomic="true"
        className="pointer-events-none fixed right-4 top-4 z-50 grid w-[min(23rem,calc(100vw-2rem))] gap-3"
      >
        {toasts.map((toast) => {
          const isSuccess = toast.tone === 'success';
          return (
            <div
              key={toast.id}
              role="status"
              className={`pointer-events-auto flex items-start gap-3 rounded-xl border p-4 shadow-lg ${isSuccess ? 'border-teal-200 bg-teal-50 text-teal-950' : 'border-rose-200 bg-rose-50 text-rose-950'}`}
            >
              {isSuccess ? (
                <CheckCircle2 className="mt-0.5 shrink-0 text-teal-700" size={19} />
              ) : (
                <XCircle className="mt-0.5 shrink-0 text-rose-700" size={19} />
              )}
              <p className="flex-1 text-sm font-medium leading-5">{toast.message}</p>
              <button
                type="button"
                aria-label="Dismiss notification"
                onClick={() => dismiss(toast.id)}
                className="rounded p-0.5 opacity-70 transition hover:bg-black/5 hover:opacity-100 focus:outline-none focus:ring-2 focus:ring-current"
              >
                <X size={16} />
              </button>
            </div>
          );
        })}
      </div>
    </ToastContext.Provider>
  );
}

export function useToast() {
  const toast = useContext(ToastContext);
  if (!toast) throw new Error('useToast must be used inside ToastProvider.');
  return toast;
}
