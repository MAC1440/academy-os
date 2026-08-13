'use client';
import { Suspense } from 'react';
import { LoginForm } from '@web/features/auth/login-form';
export default function StaffLoginPage() {
  return (
    <main className="grid min-h-screen place-items-center bg-muted/30 p-5">
      <section className="w-full max-w-md rounded-2xl border border-border bg-card p-6 shadow-sm">
        <h1 className="font-display text-3xl">Staff portal</h1>
        <p className="mt-2 text-sm text-muted-foreground">
          Sign in with the contact number registered by your organization.
        </p>
        <div className="mt-6">
          <Suspense fallback={<p className="text-sm text-muted-foreground">Loading sign in...</p>}>
            <LoginForm portalType="STAFF" />
          </Suspense>
        </div>
      </section>
    </main>
  );
}
