import Link from 'next/link';
import { LoginForm } from './login-form';
export function LoginScreen() {
  return (
    <main className="auth-shell">
      <div className="auth-panel">
        <section className="auth-story">
          <p className="eyebrow" style={{ color: 'var(--brand-contrast)' }}>
            Vision Preparation Academy
          </p>
          <div className="auth-story-copy">
            <h1 className="font-display">A better day begins with a prepared team.</h1>
            <p>
              One place for the people and details that keep your academy moving—from admissions and
              classes to attendance and results.
            </p>
            <div className="auth-result">
              <span className="eyebrow" style={{ color: 'var(--brand-contrast)' }}>
                Our latest result
              </span>
              <strong>100% Federal Board pass rate</strong>
              <p>Across our three branches, our students made us proud.</p>
            </div>
          </div>
          <p className="text-sm">Vision Preparation Academy · Staff and family portals</p>
        </section>
        <section className="auth-form-panel">
          <div className="auth-form">
            <Link href="/" className="brand-mark">
              Vision Preparation Academy
            </Link>
            <div>
              <p className="eyebrow mt-16">Welcome back</p>
              <h2 className="font-display">Sign in to your workspace</h2>
              <p className="description mt-3">
                Administrators use a username. Staff and families use their registered contact
                number.
              </p>
            </div>
            <div className="mt-9">
              <LoginForm />
            </div>
          </div>
        </section>
      </div>
    </main>
  );
}
