'use client';

import { AlertTriangle } from 'lucide-react';
import { createContext, useContext, useState } from 'react';

type ConfirmationOptions = { title?: string; description: string; confirmLabel?: string };
type ConfirmationContextValue = { confirm: (options: ConfirmationOptions) => Promise<boolean> };
const ConfirmationContext = createContext<ConfirmationContextValue | null>(null);

export function ConfirmationProvider({ children }: { children: React.ReactNode }) {
  const [pending, setPending] = useState<
    (ConfirmationOptions & { resolve: (confirmed: boolean) => void }) | null
  >(null);

  function confirm(options: ConfirmationOptions) {
    return new Promise<boolean>((resolve) => setPending({ ...options, resolve }));
  }

  function close(confirmed: boolean) {
    pending?.resolve(confirmed);
    setPending(null);
  }

  return (
    <ConfirmationContext.Provider value={{ confirm }}>
      {children}
      {pending ? (
        <div
          className="fixed inset-0 z-[60] grid place-items-center bg-black/45 p-4"
          role="presentation"
        >
          <section
            role="alertdialog"
            aria-modal="true"
            aria-labelledby="confirmation-title"
            aria-describedby="confirmation-description"
            className="w-full max-w-md rounded-2xl bg-card p-6 text-card-foreground shadow-2xl"
          >
            <div className="flex items-start gap-3">
              <span className="grid h-10 w-10 shrink-0 place-items-center rounded-full bg-destructive/10 text-destructive">
                <AlertTriangle size={20} aria-hidden="true" />
              </span>
              <div>
                <h2 id="confirmation-title" className="text-lg font-semibold">
                  {pending.title ?? 'Confirm deletion'}
                </h2>
                <p
                  id="confirmation-description"
                  className="mt-2 text-sm leading-6 text-muted-foreground"
                >
                  {pending.description}
                </p>
              </div>
            </div>
            <div className="mt-6 flex justify-end gap-3">
              <button
                type="button"
                className="button-secondary"
                onClick={() => close(false)}
                autoFocus
              >
                Cancel
              </button>
              <button type="button" className="button-destructive" onClick={() => close(true)}>
                {pending.confirmLabel ?? 'Delete'}
              </button>
            </div>
          </section>
        </div>
      ) : null}
    </ConfirmationContext.Provider>
  );
}

export function useConfirmation() {
  const value = useContext(ConfirmationContext);
  if (!value) throw new Error('useConfirmation must be used inside ConfirmationProvider.');
  return value;
}
