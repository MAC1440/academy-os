'use client';

import Link from 'next/link';
import {
  ArrowRight,
  BarChart3,
  Bell,
  BookOpen,
  Building2,
  CalendarCheck,
  Check,
  ChevronRight,
  ClipboardCheck,
  GraduationCap,
  LayoutDashboard,
  MessageSquare,
  ShieldCheck,
  Sparkles,
  Users,
  WalletCards,
} from 'lucide-react';
import { ForceTheme } from '@/features/theme/theme-provider';

const modules = [
  {
    icon: Users,
    title: 'People & Staff',
    description: 'Keep students, teachers, guardians, and staff organized in one place.',
  },
  {
    icon: CalendarCheck,
    title: 'Attendance',
    description:
      'Record attendance quickly and give administrators a clear view of daily activity.',
  },
  {
    icon: BookOpen,
    title: 'Academics',
    description:
      'Manage classes, subjects, teachers, and academic information with less paperwork.',
  },
  {
    icon: WalletCards,
    title: 'Fees & Payments',
    description:
      'Keep fee records organized and make it easier to track what is paid and what is due.',
  },
  {
    icon: MessageSquare,
    title: 'Communication',
    description: 'Keep schools, teachers, students, and guardians connected with timely updates.',
  },
  {
    icon: BarChart3,
    title: 'Reports',
    description:
      'Turn school activity into clear information that helps administrators make decisions.',
  },
];

const benefits = [
  'Reduce repetitive administrative work',
  'Keep important school information organized',
  'Give staff a clearer view of daily operations',
  'Make communication easier across the school',
  'Grow without adding unnecessary complexity',
];

const stats = [
  {
    value: '01',
    label: 'Central workspace',
  },
  {
    value: '24/7',
    label: 'Access to school information',
  },
  {
    value: '∞',
    label: 'Room to grow',
  },
];

function SectionLabel({ children }: { children: React.ReactNode }) {
  return (
    <div className="mb-4 inline-flex items-center gap-2 rounded-full border border-primary/10 bg-primary/5 px-3 py-1.5 text-xs font-semibold text-primary">
      <Sparkles className="size-3.5" />
      {children}
    </div>
  );
}

export default function HomePage() {
  return (
    <ForceTheme theme="light">
    <main className="min-h-screen overflow-hidden bg-background text-foreground">
      {/* Background decoration */}
      <div className="pointer-events-none fixed inset-0 -z-10 overflow-hidden">
        <div className="absolute left-1/2 top-[-300px] h-[600px] w-[900px] -translate-x-1/2 rounded-full bg-primary/5 blur-3xl" />

        <div className="absolute right-[-200px] top-[700px] h-[500px] w-[500px] rounded-full bg-secondary/5 blur-3xl" />

        <div
          className="
            absolute
            inset-0
            opacity-[0.025]
            [background-image:linear-gradient(to_right,currentColor_1px,transparent_1px),linear-gradient(to_bottom,currentColor_1px,transparent_1px)]
            [background-size:48px_48px]
          "
        />
      </div>

      {/* Navigation */}
      <header className="sticky top-0 z-50 border-b border-border/50 bg-background/80 backdrop-blur-xl">
        <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-5 sm:px-6 lg:px-8">
          <Link
            href="/"
            className="group flex items-center gap-3 rounded-xl outline-none focus-visible:ring-2 focus-visible:ring-ring"
          >
            <div className="grid size-9 place-items-center rounded-xl bg-primary text-primary-foreground shadow-lg shadow-primary/20 transition-transform duration-300 group-hover:scale-105">
              <GraduationCap className="size-5" />
            </div>

            <div>
              <span className="block text-base font-bold tracking-tight">AcademyOS</span>

              <span className="hidden text-[9px] font-semibold uppercase tracking-[0.2em] text-muted-foreground sm:block">
                School management
              </span>
            </div>
          </Link>

          <nav className="hidden items-center gap-7 md:flex">
            <a
              href="#features"
              className="text-sm font-medium text-muted-foreground transition-colors hover:text-foreground"
            >
              Features
            </a>

            <a
              href="#why-academyos"
              className="text-sm font-medium text-muted-foreground transition-colors hover:text-foreground"
            >
              Why AcademyOS
            </a>

            <a
              href="#modules"
              className="text-sm font-medium text-muted-foreground transition-colors hover:text-foreground"
            >
              Modules
            </a>
          </nav>

          <div className="flex items-center gap-2">
            <Link
              href="/login"
              className="hidden rounded-xl px-3 py-2 text-sm font-semibold text-muted-foreground transition-colors hover:bg-muted hover:text-foreground sm:inline-flex"
            >
              Sign in
            </Link>

            <Link
              href="/login"
              className="
                inline-flex
                items-center
                gap-2
                rounded-xl
                bg-primary
                px-4
                py-2.5
                text-sm
                font-semibold
                text-primary-foreground
                shadow-lg
                shadow-primary/15
                transition-all
                duration-200
                hover:-translate-y-0.5
                hover:shadow-xl
                hover:shadow-primary/20
              "
            >
              Get started
              <ArrowRight className="size-4" />
            </Link>
          </div>
        </div>
      </header>

      {/* Hero */}
      <section className="relative">
        <div className="mx-auto max-w-7xl px-5 pb-20 pt-20 sm:px-6 sm:pt-28 lg:px-8 lg:pb-28">
          <div className="mx-auto max-w-4xl text-center">
            <div className="animate-in fade-in slide-in-from-bottom-2 duration-700">
              <SectionLabel>Built for modern schools</SectionLabel>
            </div>

            <h1
              className="
                mt-5
                text-balance
                text-4xl
                font-bold
                tracking-[-0.04em]
                sm:text-6xl
                lg:text-7xl
              "
            >
              Run your school with <span className="text-primary">less complexity.</span>
            </h1>

            <p
              className="
                mx-auto
                mt-6
                max-w-2xl
                text-balance
                text-base
                leading-7
                text-muted-foreground
                sm:text-lg
                sm:leading-8
              "
            >
              AcademyOS brings the everyday operations of your school into one organized workspace —
              from people and attendance to academics, communication, and reporting.
            </p>

            <div className="mt-9 flex flex-col items-center justify-center gap-3 sm:flex-row">
              <Link
                href="/login"
                className="
                  group
                  inline-flex
                  h-12
                  w-full
                  items-center
                  justify-center
                  gap-2
                  rounded-xl
                  bg-primary
                  px-6
                  text-sm
                  font-semibold
                  text-primary-foreground
                  shadow-xl
                  shadow-primary/20
                  transition-all
                  duration-300
                  hover:-translate-y-1
                  hover:shadow-2xl
                  hover:shadow-primary/25
                  sm:w-auto
                "
              >
                Get started with AcademyOS
                <ArrowRight className="size-4 transition-transform duration-300 group-hover:translate-x-1" />
              </Link>

              <a
                href="#features"
                className="
                  inline-flex
                  h-12
                  w-full
                  items-center
                  justify-center
                  gap-2
                  rounded-xl
                  border
                  border-border
                  bg-card
                  px-6
                  text-sm
                  font-semibold
                  shadow-sm
                  transition-all
                  duration-300
                  hover:-translate-y-0.5
                  hover:border-primary/20
                  hover:bg-muted
                  sm:w-auto
                "
              >
                Explore features
                <ChevronRight className="size-4" />
              </a>
            </div>
          </div>

          {/* Dashboard preview */}
          <div className="relative mx-auto mt-16 max-w-5xl sm:mt-20">
            <div className="absolute -inset-4 -z-10 rounded-[32px] bg-primary/5 blur-2xl" />

            <div
              className="
                overflow-hidden
                rounded-2xl
                border
                border-border/80
                bg-card
                shadow-2xl
                shadow-black/10
                transition-transform
                duration-700
                hover:-translate-y-1
              "
            >
              {/* Browser top */}
              <div className="flex h-11 items-center gap-2 border-b border-border bg-muted/40 px-4">
                <span className="size-2.5 rounded-full bg-muted-foreground/20" />
                <span className="size-2.5 rounded-full bg-muted-foreground/20" />
                <span className="size-2.5 rounded-full bg-muted-foreground/20" />

                <div className="mx-auto hidden h-6 max-w-sm flex-1 rounded-md bg-background/70 sm:block" />
              </div>

              <div className="grid min-h-[380px] md:grid-cols-[190px_1fr]">
                {/* Fake sidebar */}
                <div className="hidden border-r border-border bg-muted/20 p-4 md:block">
                  <div className="flex items-center gap-2 px-2">
                    <div className="grid size-7 place-items-center rounded-lg bg-primary text-primary-foreground">
                      <GraduationCap className="size-4" />
                    </div>

                    <span className="text-sm font-bold">AcademyOS</span>
                  </div>

                  <div className="mt-8 space-y-1.5">
                    {[
                      {
                        value: '1,248',
                        label: 'Students',
                        icon: Users,
                      },
                      {
                        value: '96%',
                        label: 'Attendance',
                        icon: CalendarCheck,
                      },
                      {
                        value: '84',
                        label: 'Staff members',
                        icon: GraduationCap,
                      },
                    ].map((stat) => {
                      const Icon = stat.icon;

                      return (
                        <div
                          key={stat.label}
                          className="rounded-xl border border-border bg-background p-4"
                        >
                          <div className="flex items-center justify-between">
                            <span className="text-[11px] font-medium text-muted-foreground">
                              {stat.label}
                            </span>

                            <Icon className="size-3.5 text-primary" />
                          </div>

                          <p className="mt-3 text-2xl font-bold tracking-tight">{stat.value}</p>
                        </div>
                      );
                    })}
                  </div>
                </div>

                {/* Fake dashboard */}
                <div className="p-5 sm:p-7">
                  <div className="flex items-start justify-between">
                    <div>
                      <p className="text-[10px] font-semibold uppercase tracking-[0.18em] text-muted-foreground">
                        Overview
                      </p>

                      <h3 className="mt-1 text-xl font-bold tracking-tight">
                        Good morning, Administrator
                      </h3>

                      <p className="mt-1 text-xs text-muted-foreground">
                        Here&apos;s what&apos;s happening across your school.
                      </p>
                    </div>

                    <div className="hidden size-9 place-items-center rounded-lg border border-border bg-background sm:grid">
                      <Bell className="size-4 text-muted-foreground" />
                    </div>
                  </div>

                  <div className="mt-7 grid gap-3 sm:grid-cols-3">
                    {[
                      {
                        value: '1,248',
                        label: 'Students',
                        icon: Users,
                      },
                      {
                        value: '96%',
                        label: 'Attendance',
                        icon: CalendarCheck,
                      },
                      {
                        value: '84',
                        label: 'Staff members',
                        icon: GraduationCap,
                      },
                    ].map((stat) => {
                      const Icon = stat.icon;

                      return (
                        <div
                          key={stat.label}
                          className="rounded-xl border border-border bg-background p-4"
                        >
                          <div className="flex items-center justify-between">
                            <span className="text-[11px] font-medium text-muted-foreground">
                              {stat.label}
                            </span>

                            <Icon className="size-3.5 text-primary" />
                          </div>

                          <p className="mt-3 text-2xl font-bold tracking-tight">{stat.value}</p>
                        </div>
                      );
                    })}
                  </div>

                  <div className="mt-4 grid gap-3 sm:grid-cols-[1.5fr_1fr]">
                    <div className="rounded-xl border border-border bg-background p-4">
                      <div className="flex items-center justify-between">
                        <p className="text-xs font-semibold">Attendance overview</p>

                        <span className="text-[10px] text-muted-foreground">This week</span>
                      </div>

                      <div className="mt-6 flex h-28 items-end gap-2">
                        {[58, 72, 64, 86, 76, 92, 81].map((height, index) => (
                          <div key={index} className="flex flex-1 flex-col justify-end gap-1">
                            <div
                              className="w-full rounded-t-md bg-primary/70 transition-all duration-500 hover:bg-primary"
                              style={{ height: `${height}%` }}
                            />
                          </div>
                        ))}
                      </div>

                      <div className="mt-2 flex justify-between text-[9px] text-muted-foreground">
                        <span>Mon</span>
                        <span>Tue</span>
                        <span>Wed</span>
                        <span>Thu</span>
                        <span>Fri</span>
                        <span>Sat</span>
                        <span>Sun</span>
                      </div>
                    </div>

                    <div className="rounded-xl border border-border bg-background p-4">
                      <p className="text-xs font-semibold">Recent activity</p>

                      <div className="mt-4 space-y-3">
                        {['Attendance updated', 'New student enrolled', 'Fee record updated'].map(
                          (activity, index) => (
                            <div key={activity} className="flex items-center gap-2">
                              <span className="grid size-6 place-items-center rounded-full bg-primary/10 text-primary">
                                <Check className="size-3" />
                              </span>

                              <div className="min-w-0">
                                <p className="truncate text-[10px] font-medium">{activity}</p>

                                <p className="text-[9px] text-muted-foreground">{index + 1}h ago</p>
                              </div>
                            </div>
                          ),
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            <div className="pointer-events-none absolute -bottom-5 -right-4 hidden rounded-2xl border border-border bg-card p-3 shadow-xl sm:block">
              <div className="flex items-center gap-3">
                <div className="grid size-9 place-items-center rounded-xl bg-primary/10 text-primary">
                  <ShieldCheck className="size-4" />
                </div>

                <div>
                  <p className="text-xs font-semibold">Everything organized</p>
                  <p className="text-[10px] text-muted-foreground">One place for your school</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Trust / stats */}
      <section className="border-y border-border/60 bg-muted/20">
        <div className="mx-auto grid max-w-5xl gap-px bg-border/60 sm:grid-cols-3">
          {stats.map((stat) => (
            <div key={stat.label} className="bg-background px-6 py-8 text-center">
              <p className="text-2xl font-bold tracking-tight text-primary">{stat.value}</p>

              <p className="mt-1 text-xs font-medium text-muted-foreground">{stat.label}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Features */}
      <section id="features" className="scroll-mt-20">
        <div className="mx-auto max-w-7xl px-5 py-24 sm:px-6 lg:px-8 lg:py-28">
          <div className="max-w-2xl">
            <SectionLabel>Everything in one place</SectionLabel>

            <h2 className="text-3xl font-bold tracking-[-0.03em] sm:text-4xl">
              The tools your school needs to stay organized.
            </h2>

            <p className="mt-4 max-w-xl leading-7 text-muted-foreground">
              AcademyOS brings the most important parts of school administration together so your
              team can spend less time managing systems and more time managing the school.
            </p>
          </div>

          <div id="modules" className="mt-12 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {modules.map((module) => {
              const Icon = module.icon;

              return (
                <div
                  key={module.title}
                  className="
                    group
                    rounded-2xl
                    border
                    border-border
                    bg-card
                    p-6
                    shadow-sm
                    transition-all
                    duration-300
                    hover:-translate-y-1
                    hover:border-primary/20
                    hover:shadow-lg
                    hover:shadow-primary/5
                  "
                >
                  <div className="grid size-11 place-items-center rounded-xl bg-primary/10 text-primary transition-all duration-300 group-hover:scale-105 group-hover:bg-primary group-hover:text-primary-foreground">
                    <Icon className="size-5" />
                  </div>

                  <h3 className="mt-5 text-base font-bold">{module.title}</h3>

                  <p className="mt-2 text-sm leading-6 text-muted-foreground">
                    {module.description}
                  </p>

                  <div className="mt-5 flex items-center gap-1 text-xs font-semibold text-primary opacity-0 transition-opacity duration-300 group-hover:opacity-100">
                    Learn more
                    <ArrowRight className="size-3.5" />
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* Why AcademyOS */}
      <section id="why-academyos" className="scroll-mt-20 border-y border-border/60 bg-muted/20">
        <div className="mx-auto grid max-w-7xl gap-14 px-5 py-24 sm:px-6 lg:grid-cols-2 lg:items-center lg:px-8 lg:py-28">
          <div>
            <SectionLabel>Designed around schools</SectionLabel>

            <h2 className="text-3xl font-bold tracking-[-0.03em] sm:text-4xl">
              Less administration. More time for education.
            </h2>

            <p className="mt-5 max-w-xl leading-7 text-muted-foreground">
              Running a school means dealing with hundreds of small administrative tasks every day.
              AcademyOS gives your team a central place to manage them without adding unnecessary
              complexity.
            </p>

            <div className="mt-8 space-y-4">
              {benefits.map((benefit) => (
                <div key={benefit} className="flex items-start gap-3">
                  <span className="mt-0.5 grid size-5 shrink-0 place-items-center rounded-full bg-primary text-primary-foreground">
                    <Check className="size-3" />
                  </span>

                  <span className="text-sm font-medium">{benefit}</span>
                </div>
              ))}
            </div>

            <Link
              href="/login"
              className="
                mt-9
                inline-flex
                items-center
                gap-2
                rounded-xl
                bg-primary
                px-5
                py-3
                text-sm
                font-semibold
                text-primary-foreground
                shadow-lg
                shadow-primary/15
                transition-all
                duration-300
                hover:-translate-y-0.5
                hover:shadow-xl
              "
            >
              Explore AcademyOS
              <ArrowRight className="size-4" />
            </Link>
          </div>

          {/* Benefits visual */}
          <div className="relative">
            <div className="absolute -inset-6 rounded-[40px] bg-primary/5 blur-2xl" />

            <div className="relative overflow-hidden rounded-3xl border border-border bg-card p-5 shadow-xl sm:p-7">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-[10px] font-semibold uppercase tracking-[0.18em] text-muted-foreground">
                    School operations
                  </p>

                  <h3 className="mt-1 text-lg font-bold">Everything under control</h3>
                </div>

                <div className="grid size-10 place-items-center rounded-xl bg-primary/10 text-primary">
                  <LayoutDashboard className="size-5" />
                </div>
              </div>

              <div className="mt-7 space-y-3">
                {[
                  {
                    icon: Users,
                    title: 'People',
                    detail: 'Students, teachers & guardians',
                    progress: '92%',
                  },
                  {
                    icon: CalendarCheck,
                    title: 'Attendance',
                    detail: 'Daily attendance tracking',
                    progress: '96%',
                  },
                  {
                    icon: BookOpen,
                    title: 'Academics',
                    detail: 'Classes & academic records',
                    progress: '84%',
                  },
                  {
                    icon: MessageSquare,
                    title: 'Communication',
                    detail: 'Keep everyone informed',
                    progress: '78%',
                  },
                ].map((item) => {
                  const Icon = item.icon;

                  return (
                    <div
                      key={item.title}
                      className="rounded-2xl border border-border bg-background p-4"
                    >
                      <div className="flex items-center gap-3">
                        <div className="grid size-9 place-items-center rounded-xl bg-primary/10 text-primary">
                          <Icon className="size-4" />
                        </div>

                        <div className="min-w-0 flex-1">
                          <div className="flex items-center justify-between gap-3">
                            <p className="text-sm font-semibold">{item.title}</p>

                            <span className="text-[10px] font-semibold text-primary">
                              {item.progress}
                            </span>
                          </div>

                          <p className="mt-0.5 truncate text-[10px] text-muted-foreground">
                            {item.detail}
                          </p>

                          <div className="mt-2 h-1 overflow-hidden rounded-full bg-muted">
                            <div
                              className="h-full rounded-full bg-primary"
                              style={{ width: item.progress }}
                            />
                          </div>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Final CTA */}
      <section>
        <div className="mx-auto max-w-7xl px-5 py-24 sm:px-6 lg:px-8 lg:py-28">
          <div className="relative overflow-hidden rounded-[32px] bg-primary px-6 py-16 text-center text-primary-foreground shadow-2xl shadow-primary/20 sm:px-12">
            <div className="absolute left-1/2 top-0 -z-0 h-64 w-64 -translate-x-1/2 -translate-y-1/2 rounded-full bg-primary-foreground/10 blur-3xl" />

            <div className="relative z-10 mx-auto max-w-2xl">
              <div className="mx-auto grid size-12 place-items-center rounded-2xl bg-primary-foreground/10">
                <GraduationCap className="size-6" />
              </div>

              <h2 className="mt-6 text-3xl font-bold tracking-[-0.03em] sm:text-4xl">
                Give your school a better way to operate.
              </h2>

              <p className="mx-auto mt-4 max-w-xl text-sm leading-7 text-primary-foreground/75 sm:text-base">
                Bring your school&apos;s everyday operations together in one simple, organized
                workspace.
              </p>

              <Link
                href="/login"
                className="
                  mt-8
                  inline-flex
                  items-center
                  gap-2
                  rounded-xl
                  bg-background
                  px-6
                  py-3
                  text-sm
                  font-semibold
                  text-foreground
                  shadow-xl
                  transition-all
                  duration-300
                  hover:-translate-y-1
                  hover:shadow-2xl
                "
              >
                Get started with AcademyOS
                <ArrowRight className="size-4" />
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-border">
        <div className="mx-auto flex max-w-7xl flex-col gap-4 px-5 py-8 sm:px-6 md:flex-row md:items-center md:justify-between lg:px-8">
          <div className="flex items-center gap-2">
            <div className="grid size-7 place-items-center rounded-lg bg-primary text-primary-foreground">
              <GraduationCap className="size-4" />
            </div>

            <span className="text-sm font-bold">AcademyOS</span>
          </div>

          <p className="text-xs text-muted-foreground">Modern school management, made simpler.</p>
        </div>
      </footer>
    </main>
    </ForceTheme>
  );
}
