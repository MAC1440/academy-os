import Link from 'next/link';
export default function Page() {
  return (
    <main className="academy-landing">
      <header className="academy-header">
        <span className="brand-mark">
          Vision <span>Preparation</span> Academy
        </span>
        <Link href="/login" className="button-primary">
          Admin sign in
        </Link>
      </header>
      <section className="academy-hero">
        <div className="academy-hero-copy">
          <p className="eyebrow">Federal Board results · 2026</p>
          <h1 className="font-display">Prepared for the result. Ready for what comes next.</h1>
          <p>
            Vision Preparation Academy is a place for focused learning, dependable teaching, and
            outcomes families can be proud of. This year, every one of our Federal Board students
            passed.
          </p>
          <div className="academy-actions">
            <Link href="/login" className="button-primary">
              Admin portal
            </Link>
            <Link href="/staff/login">Staff portal</Link>
            <Link href="/student/login">Student &amp; guardian portal</Link>
            <Link href="/kiosk">Attendance kiosk</Link>
            <a href="#our-story">Meet the academy</a>
          </div>
        </div>
        <aside
          className="result-plaque"
          aria-label="Federal Board 2026 result: 100 percent pass rate"
        >
          <div className="result-plaque-inner">
            <p className="eyebrow">Federal Board</p>
            <p className="result-number">100%</p>
            <p className="result-caption">Pass rate in our latest Federal Board result</p>
          </div>
          <span className="result-ribbon">
            <i /> A result worth celebrating
          </span>
        </aside>
      </section>
      <section id="our-story" className="academy-proof">
        <article>
          <strong>3 branches</strong>
          <span>One academy community across three campuses.</span>
        </article>
        <article>
          <strong>100% pass rate</strong>
          <span>A successful Federal Board result for our students.</span>
        </article>
        <article>
          <strong>Teacher-led</strong>
          <span>Guidance from educators who stay close to the work.</span>
        </article>
      </section>
      <section className="academy-proof" aria-label="Portal access">
        <article>
          <strong>Admin portal</strong>
          <span>Run academics, attendance, fees, staff, and communication.</span>
          <Link href="/login">Sign in as admin</Link>
        </article>
        <article>
          <strong>Staff portal</strong>
          <span>View today’s schedule, shared notes, and student attendance.</span>
          <Link href="/staff/login">Staff sign in</Link>
        </article>
        <article>
          <strong>Student &amp; guardian</strong>
          <span>Follow classes, results, attendance, notes, fees, and updates.</span>
          <Link href="/student/login">Open family portal</Link>
        </article>
      </section>
    </main>
  );
}
