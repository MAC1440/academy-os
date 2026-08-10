"use client";
import { Provider } from "react-redux";
import { useEffect, useRef } from "react";
import { makeStore, type AppStore } from "@web/store";
import { hydrateSession } from "@web/store/slices/auth-slice";
import { ThemeProvider } from "@web/features/theme/theme-provider";
export function AppProviders({ children }: { children: React.ReactNode }) { const storeRef = useRef<AppStore | null>(null); if (!storeRef.current) storeRef.current = makeStore(); useEffect(() => { storeRef.current?.dispatch(hydrateSession()); }, []); return <Provider store={storeRef.current}><ThemeProvider>{children}</ThemeProvider></Provider>; }
