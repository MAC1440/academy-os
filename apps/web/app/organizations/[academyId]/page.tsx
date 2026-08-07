"use client";

import Link from "next/link";
import { useParams } from "next/navigation";
import { FormEvent, useCallback, useEffect, useState } from "react";
import type { Academy, Branch } from "@academy-os/shared";
import {
  addOrganizationMember,
  deleteBranch,
  getAcademy,
  listOrganizationMembers,
  type OrganizationMember,
} from "@web/lib/api";

type OrganizationDetail = Academy & {
  branches: Branch[];
  _count?: { branches: number };
};

export default function OrganizationDetailPage() {
  const { academyId } = useParams<{ academyId: string }>();
  const [organization, setOrganization] = useState<OrganizationDetail | null>(null);
  const [members, setMembers] = useState<OrganizationMember[]>([]);
  const [memberEmail, setMemberEmail] = useState("");
  const [branchIds, setBranchIds] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const [data, organizationMembers] = await Promise.all([
        getAcademy(academyId),
        listOrganizationMembers(academyId),
      ]);
      setOrganization(data as OrganizationDetail);
      setMembers(organizationMembers);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load organization");
    } finally {
      setLoading(false);
    }
  }, [academyId]);

  useEffect(() => {
    void load();
  }, [load]);

  async function handleDeleteBranch(branchId: string, name: string) {
    if (!confirm(`Delete branch "${name}"?`)) return;
    try {
      await deleteBranch(branchId);
      await load();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to delete branch");
    }
  }

  async function handleAddMember(event: FormEvent) {
    event.preventDefault();
    setSubmitting(true);
    setError(null);
    try {
      await addOrganizationMember(academyId, { email: memberEmail, branchIds });
      setMemberEmail("");
      setBranchIds([]);
      setMembers(await listOrganizationMembers(academyId));
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to add member");
    } finally {
      setSubmitting(false);
    }
  }

  function toggleBranch(branchId: string) {
    setBranchIds((current) =>
      current.includes(branchId)
        ? current.filter((id) => id !== branchId)
        : [...current, branchId],
    );
  }

  if (loading) {
    return <main className="min-h-screen bg-background px-6 py-16 text-center text-muted-foreground">Loading organization...</main>;
  }

  if (!organization) {
    return <main className="min-h-screen bg-background px-6 py-16 text-center text-red-600">{error ?? "Organization not found"}</main>;
  }

  return (
    <main className="min-h-screen bg-background px-6 py-12 text-foreground transition-colors">
      <div className="mx-auto max-w-6xl">
        <Link href="/organizations" className="text-sm font-medium text-secondary hover:underline">← Back to organizations</Link>

        <div className="mt-6 grid gap-6 lg:grid-cols-[1.2fr_1fr]">
          <section className="rounded-[32px] border border-border bg-card p-8 shadow-[0_20px_60px_rgba(71,0,4,0.12)]">
            <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
              <div className="flex items-start gap-4">
                {organization.logo ? (
                  <img src={organization.logo} alt={`${organization.name} logo`} className="h-16 w-16 rounded-2xl border border-border object-cover" />
                ) : (
                  <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-secondary/30 text-xl font-semibold">{organization.name.charAt(0)}</div>
                )}
                <div>
                  <p className="text-sm font-semibold uppercase tracking-[0.3em] text-secondary">Organization</p>
                  <h1 className="mt-2 text-3xl font-semibold">{organization.name}</h1>
                  <p className="mt-1 text-sm text-muted-foreground">{organization.slug}</p>
                </div>
              </div>
              <Link href={`/organizations/${organization.id}/edit`} className="rounded-2xl border border-border px-4 py-2 text-xs font-semibold hover:border-ring">Edit organization</Link>
            </div>
            <dl className="mt-8 grid gap-4 text-sm sm:grid-cols-2">
              {[["Email", organization.email ?? "—"], ["Phone", organization.phone ?? "—"], ["Timezone", organization.timezone], ["Currency", organization.currency]].map(([label, value]) => (
                <div key={label} className="rounded-2xl bg-surface p-4"><dt className="text-secondary">{label}</dt><dd className="mt-1 font-medium">{value}</dd></div>
              ))}
            </dl>
          </section>

          <section className="rounded-[32px] bg-primary p-8 text-primary-foreground">
            <p className="text-sm font-semibold uppercase tracking-[0.3em] text-secondary">Architecture rule</p>
            <h2 className="mt-3 text-2xl font-semibold">Branch-first design</h2>
            <p className="mt-4 text-sm opacity-80">Every operational module belongs to a branch, never directly to the organization.</p>
            <Link href={`/organizations/${organization.id}/branches/new`} className="mt-6 inline-flex rounded-2xl bg-card px-5 py-3 text-sm font-semibold text-foreground">Add branch</Link>
            <Link href={`/organizations/${organization.id}/calendar`} className="mt-3 inline-flex text-sm font-semibold text-secondary hover:underline">Manage academic calendar</Link>
            <Link href={`/organizations/${organization.id}/staff`} className="mt-3 inline-flex text-sm font-semibold text-secondary hover:underline">Manage teachers and staff</Link>
          </section>
        </div>

        {error ? <p className="mt-6 rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-700">{error}</p> : null}

        <section className="mt-6 rounded-[32px] border border-border bg-card p-8 shadow-[0_20px_60px_rgba(71,0,4,0.12)]">
          <div className="flex items-center justify-between gap-4"><div><h2 className="text-xl font-semibold">Branches</h2><p className="mt-1 text-sm text-muted-foreground">{organization.branches.length} configured</p></div><Link href={`/organizations/${organization.id}/branches/new`} className="rounded-xl bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground">Add branch</Link></div>
          <div className="mt-6 space-y-3">
            {organization.branches.length === 0 ? <p className="rounded-2xl bg-surface p-6 text-sm text-muted-foreground">No branches yet. Add your first campus to start operating.</p> : organization.branches.map((branch) => (
              <article key={branch.id} className="flex flex-col gap-3 rounded-2xl border border-border bg-surface p-5 sm:flex-row sm:items-center sm:justify-between"><div><p className="font-semibold">{branch.name}</p><p className="mt-1 text-sm text-muted-foreground">{[branch.city, branch.country].filter(Boolean).join(", ") || "Location not set"}</p></div><div className="flex flex-wrap gap-2"><Link href={`/organizations/${organization.id}/branches/${branch.id}`} className="rounded-xl border border-border px-3 py-1.5 text-xs font-semibold">View</Link><Link href={`/organizations/${organization.id}/branches/${branch.id}/edit`} className="rounded-xl border border-border px-3 py-1.5 text-xs font-semibold">Edit</Link><button type="button" className="rounded-xl border border-red-200 px-3 py-1.5 text-xs font-semibold text-red-700" onClick={() => void handleDeleteBranch(branch.id, branch.name)}>Delete</button></div></article>
            ))}
          </div>
        </section>

        <section className="mt-6 rounded-[32px] border border-border bg-card p-8 shadow-[0_20px_60px_rgba(71,0,4,0.12)]">
          <p className="text-sm font-semibold uppercase tracking-[0.3em] text-secondary">Access</p>
          <h2 className="mt-2 text-xl font-semibold">Organization members</h2>
          <p className="mt-1 text-sm text-muted-foreground">Add an existing active user and choose their branch access. Owners retain every branch automatically.</p>
          <form className="mt-6 rounded-2xl bg-surface p-5" onSubmit={handleAddMember}>
            <div className="grid gap-4 lg:grid-cols-[minmax(0,1fr)_1.4fr_auto] lg:items-end">
              <label className="block text-sm font-medium">Existing user email<input className="mt-2 w-full rounded-xl border border-border bg-card px-3 py-2.5 text-sm outline-none focus:border-ring" type="email" value={memberEmail} onChange={(event) => setMemberEmail(event.target.value)} placeholder="teacher@example.edu.pk" required /></label>
              <fieldset><legend className="text-sm font-medium">Branch access</legend><div className="mt-2 flex flex-wrap gap-2">{organization.branches.map((branch) => <label key={branch.id} className="inline-flex cursor-pointer items-center gap-2 rounded-xl border border-border bg-card px-3 py-2 text-sm"><input type="checkbox" checked={branchIds.includes(branch.id)} onChange={() => toggleBranch(branch.id)} />{branch.name}</label>)}{organization.branches.length === 0 ? <span className="text-sm text-muted-foreground">Create a branch first.</span> : null}</div></fieldset>
              <button type="submit" disabled={submitting} className="rounded-xl bg-primary px-4 py-2.5 text-sm font-semibold text-primary-foreground disabled:opacity-50">{submitting ? "Adding..." : "Add member"}</button>
            </div>
          </form>
          <div className="mt-5 space-y-3">
            {members.map((member) => <article key={member.id} className="flex flex-col gap-3 rounded-2xl border border-border p-5 sm:flex-row sm:items-center sm:justify-between"><div><p className="font-semibold">{member.user.firstName} {member.user.lastName}</p><p className="mt-1 text-sm text-muted-foreground">{member.user.email}</p></div><div className="flex flex-wrap items-center gap-2">{member.isOwner ? <span className="rounded-full bg-secondary/30 px-3 py-1 text-xs font-semibold">Owner · all branches</span> : null}{!member.isOwner && member.branchAssignments.length === 0 ? <span className="text-sm text-muted-foreground">No branch access</span> : null}{member.branchAssignments.map(({ branch }) => <span key={branch.id} className="rounded-full border border-border px-3 py-1 text-xs">{branch.name}</span>)}</div></article>)}
          </div>
        </section>
      </div>
    </main>
  );
}
