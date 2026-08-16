'use client';
import '@web/store/api/register-endpoints';
import { Provider } from 'react-redux';
import { useEffect, useState } from 'react';
import { makeStore, type AppStore } from '@web/store';
import { hydrateSession } from '@web/store/slices/auth-slice';
import { ThemeProvider } from '@web/features/theme/theme-provider';
import { ToastProvider } from '@web/components/toast-provider';
import { ConfirmationProvider } from '@web/components/confirmation-dialog';
export function AppProviders({ children }: { children: React.ReactNode }) {
  const [store] = useState<AppStore>(makeStore);
  useEffect(() => {
    store.dispatch(hydrateSession());
  }, [store]);
  return (
    <Provider store={store}>
      <ThemeProvider>
        <ToastProvider>
          <ConfirmationProvider>{children}</ConfirmationProvider>
        </ToastProvider>
      </ThemeProvider>
    </Provider>
  );
}
