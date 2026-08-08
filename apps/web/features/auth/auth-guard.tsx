"use client";

import { createContext, useContext, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { getCurrentUser, getAccessToken, clearTokens, type AuthenticatedUser } from "@web/lib/api";

type AuthContextValue = {
  user: AuthenticatedUser;
};

const AuthContext = createContext<AuthContextValue | null>(null);

export function useAuth() {
  const auth = useContext(AuthContext);
  if (!auth) throw new Error("useAuth must be used within AuthGuard");
  return auth;
}

export function AuthGuard({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const [user, setUser] = useState<AuthenticatedUser | null>(null);
  const [checking, setChecking] = useState(true);

  useEffect(() => {
    let active = true;

    async function checkSession() {
      const token = getAccessToken();
      if (!token) {
        router.replace("/login");
        return;
      }

      try {
        // If the access token has expired, apiFetch's internal 401 handler
        // silently refreshes and retries before this ever throws.
        const currentUser = await getCurrentUser();
        if (active) setUser(currentUser);
      } catch {
        clearTokens();
        router.replace("/login");
      } finally {
        if (active) setChecking(false);
      }
    }

    function handleUnauthorized() {
      clearTokens();
      router.replace("/login");
    }

    void checkSession();
    window.addEventListener("auth:unauthorized", handleUnauthorized);
    return () => {
      active = false;
      window.removeEventListener("auth:unauthorized", handleUnauthorized);
    };
  }, [router]);

  if (checking || !user) {
    return (
      <main className="min-h-screen bg-[#fffdf8] px-6 py-16 text-[#470004]">
        <p className="text-center text-sm text-[#5b4a4b]">Checking your session...</p>
      </main>
    );
  }

  return <AuthContext.Provider value={{ user }}>{children}</AuthContext.Provider>;
}
