import { Suspense } from "react";
import { LoginScreen } from "@web/features/auth";
export default function LoginPage() { return <Suspense fallback={<main className="grid min-h-screen place-items-center bg-background text-sm text-muted-foreground">Loading sign-in…</main>}><LoginScreen /></Suspense>; }
