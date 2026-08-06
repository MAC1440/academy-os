import Link from "next/link";

const highlights = [
  {
    title: "Fast onboarding",
    description: "Create secure access for staff, teachers, and guardians in minutes.",
  },
  {
    title: "Protected experience",
    description: "Every route and request is backed by authentication and role-aware access.",
  },
  {
    title: "School-wide visibility",
    description: "Keep attendance, fees, and communications flowing from a single dashboard.",
  },
];

export default function HomePage() {
  return (
    <main className="min-h-screen bg-[#fffdf8] text-[#470004]">
      <section className="mx-auto flex max-w-7xl flex-col px-6 py-16 sm:px-8 lg:px-10 lg:py-24">
        <div className="rounded-[40px] border border-[#470004]/10 bg-white p-8 shadow-[0_25px_80px_rgba(71,0,4,0.1)] sm:p-12 lg:p-16">
          <div className="flex flex-col gap-10 lg:flex-row lg:items-end lg:justify-between">
            <div className="max-w-2xl">
              <p className="text-sm font-semibold uppercase tracking-[0.35em] text-[#a67c00]">AcademyOS</p>
              <h1 className="mt-4 text-4xl font-semibold leading-tight sm:text-5xl lg:text-6xl">A brighter school management platform for modern institutions.</h1>
              <p className="mt-6 text-lg leading-8 text-[#5b4a4b]">Bring attendance, communications, and operations into one polished experience with secure authentication and intuitive admin tools.</p>
              <div className="mt-8 flex flex-col gap-3 sm:flex-row">
                <Link href="/login" className="rounded-2xl bg-[#470004] px-6 py-3 text-center font-semibold text-white transition hover:bg-[#6a0006]">
                  Open auth portal
                </Link>
                <Link href="/dashboard" className="rounded-2xl border border-[#470004]/15 px-6 py-3 text-center font-semibold text-[#470004] transition hover:bg-[#fff3d0]">
                  View protected dashboard
                </Link>
              </div>
            </div>
            <div className="rounded-[28px] bg-[#470004] p-6 text-white shadow-[0_18px_50px_rgba(71,0,4,0.15)] sm:min-w-[320px]">
              <p className="text-sm uppercase tracking-[0.3em] text-[#f3d58b]">Security</p>
              <p className="mt-4 text-2xl font-semibold">JWT, refresh tokens, and protected routes</p>
              <p className="mt-4 text-sm leading-7 text-white/80">Every API request knows who is making it, and every authenticated route is guarded from the start.</p>
            </div>
          </div>

          <div className="mt-12 grid gap-4 md:grid-cols-3">
            {highlights.map((item) => (
              <div key={item.title} className="rounded-3xl border border-[#470004]/10 bg-[#fffdf8] p-6">
                <h2 className="text-xl font-semibold text-[#470004]">{item.title}</h2>
                <p className="mt-3 text-sm leading-7 text-[#5b4a4b]">{item.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>
    </main>
  );
}
