"use client";

import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { FormEvent, useCallback, useEffect, useState } from "react";
import type { Branch } from "@academy-os/shared";
import {
  createClassSection,
  createSchoolClass,
  deleteBranch,
  deleteSchoolClass,
  getAcademicSettings,
  getBranch,
  listSchoolClasses,
  type AcademicSettings,
  type SchoolClass,
  updateAcademicSettings,
} from "@web/lib/api";

type BranchDetail = Branch & { academy?: { id: string; name: string; slug: string } };

const STANDARD_CLASSES = [
  ["Nursery", "NURSERY"], ["Prep 1", "PREP-1"], ["Prep 2", "PREP-2"],
  ...Array.from({ length: 10 }, (_, index) => [`Grade ${index + 1}`, `GRADE-${index + 1}`]),
  ["HSSC-I", "HSSC-1"], ["HSSC-II", "HSSC-2"],
] as const;

export default function BranchDetailPage() {
  const router = useRouter();
  const { academyId, branchId } = useParams<{ academyId: string; branchId: string }>();
  const [branch, setBranch] = useState<BranchDetail | null>(null);
  const [classes, setClasses] = useState<SchoolClass[]>([]);
  const [settings, setSettings] = useState<AcademicSettings | null>(null);
  const [className, setClassName] = useState("");
  const [classCode, setClassCode] = useState("");
  const [sectionDrafts, setSectionDrafts] = useState<Record<string, { name: string; code: string }>>({});
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const [branchData, schoolClasses, academicSettings] = await Promise.all([
        getBranch(branchId), listSchoolClasses(branchId), getAcademicSettings(academyId),
      ]);
      setBranch(branchData as BranchDetail);
      setClasses(schoolClasses);
      setSettings(academicSettings);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load branch");
    } finally {
      setLoading(false);
    }
  }, [academyId, branchId]);

  useEffect(() => { void load(); }, [load]);

  async function handleDeleteBranch() {
    if (!branch || !confirm(`Delete branch "${branch.name}"?`)) return;
    try { await deleteBranch(branchId); router.push(`/organizations/${academyId}`); }
    catch (err) { setError(err instanceof Error ? err.message : "Failed to delete branch"); }
  }

  async function handleAddClass(event: FormEvent) {
    event.preventDefault();
    setSaving(true); setError(null);
    try {
      await createSchoolClass(branchId, { name: className, code: classCode, sortOrder: classes.length });
      setClassName(""); setClassCode(""); setClasses(await listSchoolClasses(branchId));
    } catch (err) { setError(err instanceof Error ? err.message : "Failed to add class"); }
    finally { setSaving(false); }
  }

  async function handleSections(enabled: boolean) {
    setSaving(true); setError(null);
    try { setSettings(await updateAcademicSettings(academyId, enabled)); }
    catch (err) { setError(err instanceof Error ? err.message : "Failed to update section setting"); }
    finally { setSaving(false); }
  }

  async function handleAddSection(event: FormEvent, schoolClassId: string) {
    event.preventDefault();
    const draft = sectionDrafts[schoolClassId];
    if (!draft?.name || !draft.code) return;
    setSaving(true); setError(null);
    try {
      await createClassSection(schoolClassId, draft);
      setSectionDrafts((current) => ({ ...current, [schoolClassId]: { name: "", code: "" } }));
      setClasses(await listSchoolClasses(branchId));
    } catch (err) { setError(err instanceof Error ? err.message : "Failed to add section"); }
    finally { setSaving(false); }
  }

  async function handleDeleteClass(schoolClass: SchoolClass) {
    if (!confirm(`Remove ${schoolClass.name} and its sections?`)) return;
    try { await deleteSchoolClass(schoolClass.id); setClasses(await listSchoolClasses(branchId)); }
    catch (err) { setError(err instanceof Error ? err.message : "Failed to remove class"); }
  }

  if (loading) return <main className="min-h-screen bg-background px-6 py-16 text-center text-muted-foreground">Loading branch workspace...</main>;
  if (!branch) return <main className="min-h-screen bg-background px-6 py-16 text-center text-red-600">{error ?? "Branch not found"}</main>;

  return (
    <main className="min-h-screen bg-background px-6 py-12 text-foreground transition-colors">
      <div className="mx-auto max-w-6xl">
        <Link href={`/organizations/${academyId}`} className="text-sm font-medium text-secondary hover:underline">← Back to {branch.academy?.name ?? "organization"}</Link>

        <header className="mt-6 rounded-[32px] border border-border bg-card p-8 shadow-[0_20px_60px_rgba(71,0,4,0.12)]">
          <div className="flex flex-col gap-5 sm:flex-row sm:items-start sm:justify-between">
            <div><p className="text-sm font-semibold uppercase tracking-[0.3em] text-secondary">Branch workspace</p><h1 className="mt-2 text-3xl font-semibold">{branch.name}</h1><p className="mt-2 text-sm text-muted-foreground">{[branch.address, branch.city].filter(Boolean).join(" · ") || "Set the branch address in settings."}</p></div>
            <div className="flex flex-wrap gap-3"><Link href={`/organizations/${academyId}/branches/${branchId}/edit`} className="rounded-xl border border-border px-4 py-2 text-sm font-semibold hover:border-ring">Edit branch</Link><button type="button" onClick={() => void handleDeleteBranch()} className="rounded-xl border border-red-200 px-4 py-2 text-sm font-semibold text-red-700 hover:bg-red-50">Delete branch</button></div>
          </div>
        </header>

        {error ? <p className="mt-6 rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-700">{error}</p> : null}

        <section className="mt-6 grid gap-6 lg:grid-cols-[0.9fr_1.1fr]">
          <div className="rounded-[32px] border border-border bg-card p-7 shadow-[0_20px_60px_rgba(71,0,4,0.12)]"><p className="text-sm font-semibold uppercase tracking-[0.3em] text-secondary">Academic setup</p><h2 className="mt-2 text-xl font-semibold">Use sections for parallel classes</h2><p className="mt-2 text-sm leading-6 text-muted-foreground">Turn this on only when this organization runs the same class in separate sections, such as Grade 6-A and Grade 6-B.</p><label className="mt-6 flex cursor-pointer items-center justify-between gap-4 rounded-2xl bg-surface p-4"><span><span className="block font-semibold">Sections {settings?.sectionsEnabled ? "enabled" : "disabled"}</span><span className="mt-1 block text-sm text-muted-foreground">Applies to all branches in this organization.</span></span><input aria-label="Enable sections" type="checkbox" checked={settings?.sectionsEnabled ?? false} disabled={saving} onChange={(event) => void handleSections(event.target.checked)} className="h-5 w-5 accent-[var(--primary)]" /></label></div>
          <div className="rounded-[32px] border border-border bg-card p-7 shadow-[0_20px_60px_rgba(71,0,4,0.12)]"><p className="text-sm font-semibold uppercase tracking-[0.3em] text-secondary">Class register</p><h2 className="mt-2 text-xl font-semibold">Add a school class</h2><p className="mt-2 text-sm text-muted-foreground">Choose a standard level to prefill it, or enter a custom name and code.</p><div className="mt-4 flex flex-wrap gap-2">{STANDARD_CLASSES.map(([name, code]) => <button key={code} type="button" onClick={() => { setClassName(name); setClassCode(code); }} className="rounded-full border border-border px-3 py-1.5 text-xs font-medium hover:border-ring hover:bg-surface">{name}</button>)}</div><form className="mt-5 grid gap-3 sm:grid-cols-[1fr_0.65fr_auto]" onSubmit={handleAddClass}><input className="rounded-xl border border-border bg-surface px-3 py-2.5 text-sm outline-none focus:border-ring" placeholder="Class name" value={className} onChange={(event) => setClassName(event.target.value)} required /><input className="rounded-xl border border-border bg-surface px-3 py-2.5 text-sm uppercase outline-none focus:border-ring" placeholder="Code" value={classCode} onChange={(event) => setClassCode(event.target.value)} required /><button disabled={saving} className="rounded-xl bg-primary px-4 py-2.5 text-sm font-semibold text-primary-foreground disabled:opacity-50">Add class</button></form></div>
        </section>

        <section className="mt-6 rounded-[32px] border border-border bg-card p-8 shadow-[0_20px_60px_rgba(71,0,4,0.12)]"><div><p className="text-sm font-semibold uppercase tracking-[0.3em] text-secondary">Configured classes</p><h2 className="mt-2 text-xl font-semibold">{classes.length} class{classes.length === 1 ? "" : "es"} in {branch.name}</h2></div><div className="mt-6 grid gap-4 md:grid-cols-2">{classes.length === 0 ? <p className="rounded-2xl bg-surface p-6 text-sm text-muted-foreground">No classes yet. Start with Nursery, Prep, a Grade, or a HSSC level.</p> : classes.map((schoolClass) => { const draft = sectionDrafts[schoolClass.id] ?? { name: "", code: "" }; return <article key={schoolClass.id} className="rounded-2xl border border-border bg-surface p-5"><div className="flex items-start justify-between gap-3"><div><p className="font-semibold">{schoolClass.name}</p><p className="mt-1 font-mono text-xs text-muted-foreground">{schoolClass.code}</p></div><button type="button" onClick={() => void handleDeleteClass(schoolClass)} className="text-xs font-semibold text-red-700 hover:underline">Remove</button></div>{settings?.sectionsEnabled ? <><div className="mt-4 flex flex-wrap gap-2">{schoolClass.sections.length === 0 ? <span className="text-sm text-muted-foreground">No sections yet.</span> : schoolClass.sections.map((section) => <span key={section.id} className="rounded-full border border-border bg-card px-3 py-1 text-xs font-medium">{section.name}</span>)}</div><form className="mt-4 grid grid-cols-[1fr_0.55fr_auto] gap-2" onSubmit={(event) => void handleAddSection(event, schoolClass.id)}><input className="min-w-0 rounded-xl border border-border bg-card px-3 py-2 text-sm outline-none focus:border-ring" placeholder="Section name" value={draft.name} onChange={(event) => setSectionDrafts((current) => ({ ...current, [schoolClass.id]: { ...draft, name: event.target.value } }))} required /><input className="min-w-0 rounded-xl border border-border bg-card px-3 py-2 text-sm uppercase outline-none focus:border-ring" placeholder="Code" value={draft.code} onChange={(event) => setSectionDrafts((current) => ({ ...current, [schoolClass.id]: { ...draft, code: event.target.value } }))} required /><button disabled={saving} className="rounded-xl border border-border px-3 py-2 text-xs font-semibold hover:border-ring disabled:opacity-50">Add</button></form></> : <p className="mt-4 text-sm text-muted-foreground">Sections are disabled for this organization.</p>}</article>; })}</div></section>
      </div>
    </main>
  );
}
