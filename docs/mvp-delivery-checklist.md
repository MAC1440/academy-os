# AcademyOS MVP Delivery Checklist

## Delivery rules

- One white-label deployment contains exactly one organization and one isolated
  database. There is no platform super-admin or tenant picker.
- Backend modules are completed and verified before their frontend work begins.
- Authorization is enforced by the API; the frontend only reflects permissions.
- Staff and learner accounts use a contact number as their login identifier;
  administrators use a username. Emails are optional.
- Every admission is independent. A person taking another class, course, or
  branch session is a separate learner record and admission.
- Use soft deletion where supported. Avoid cron jobs; attendance is calculated
  from saved daily records and calendar settings when reports are requested.
- Status key: `[x]` verified complete; `[-]` implemented in part; `[ ]` not started.

## Checkpoint 0 — White-label foundation

- [x] Archive the retired SaaS-era modules and migrations without deleting them.
- [x] Replace the schema with a clean one-organization-per-deployment model.
- [x] Apply the initial PostgreSQL migration.
- [x] Seed the default organization, administrator, permissions, and
  Administrator role.
- [x] Restore API production startup and verify the build.

**Exit criteria:** a clean local database can be migrated and seeded repeatedly.

## Checkpoint 1 — Authentication, RBAC, and audit

- [x] Implement login, refresh, and authenticated current-user endpoints.
- [x] Support `ADMIN`, `STAFF`, and `LEARNER` account identities.
- [x] Require active, non-deleted accounts for every authenticated request.
- [x] Establish permission, role, role-permission, and branch-aware role
  assignment tables.
- [ ] Add server-side permission decorators/guards and branch-access checks.
- [ ] Add audit records for mutations, authentication, and attendance overrides.
- [ ] Add password change and profile-completion endpoints.

**Exit criteria:** an administrator can authenticate, roles are enforced by the
server, and users can access only their assigned branch data.

## Checkpoint 2 — Organization, branches, and sessions

- [ ] Add singleton organization settings (PKR and Asia/Karachi defaults).
- [ ] Create, update, archive, and list branches with unique organization
  addresses.
- [ ] Create branch sessions with editable 7:00 AM–2:00 PM defaults.
- [ ] Support future session-specific staff shifts without changing kiosk data.

**Exit criteria:** an administrator can configure the organization, branches,
and usable default sessions.

## Checkpoint 3 — Staff and teacher attendance kiosk

- [ ] Create staff records with required full name and unique contact number.
- [ ] Generate initial staff credentials and four-digit kiosk PINs.
- [ ] Expose profile-completion state without blocking a staff account.
- [ ] Build PIN-protected branch kiosk check-in and checkout endpoints.
- [ ] Add editable late/grace/workday rules and authorised corrections.
- [ ] Treat a missing checkout as a complete day during report calculation.

**Exit criteria:** staff can check in/out at a branch, while administrators can
manage rules and overrides.

## Checkpoint 4 — Academic offerings and shared notes

- [ ] Model regular school classes separately from vocational/academy courses.
- [ ] Add organization-enabled sections for applicable regular classes.
- [ ] Add subjects, class/session offerings, and teacher assignment metadata.
- [ ] Add organization-wide shared notes/materials visible to all teachers.

**Exit criteria:** a branch can run school and academy offerings without mixing
their structures, and teachers can cover one another using shared material.

## Checkpoint 5 — Admissions and learner accounts

- [ ] Create the default organization admission form and public submission API.
- [ ] Store pending applications indefinitely unless explicitly deleted.
- [ ] Approve/reject applications and retain their decision history.
- [ ] On approval, create the independent learner account and enrollment.
- [ ] Allow separate admissions for the same real person across sessions or
  branches without cross-admission coupling.

**Exit criteria:** admissions move cleanly from pending to approved/rejected,
and each approved admission yields its own learner record.

## Checkpoint 6 — Student attendance and reports

- [ ] List enrolled learners by class/session for one-click attendance marking.
- [ ] Permit authorized teachers or administrators to mark attendance.
- [ ] Keep unmarked attendance empty; interpret it as absent only in reports.
- [ ] Configure holidays and working days without creating automatic records.
- [ ] Export student and staff attendance for a date range, with working-day
  totals and highlighted holidays/off days.

**Exit criteria:** daily attendance stays fast to mark, and reports calculate
correctly without cron jobs.

## Checkpoint 7 — Assessments and grades

- [ ] Agree the grade-scale/versioning design before schema implementation.
- [ ] Support regular assessments and festival assessments (midterm, send-ups,
  finals, test series, and custom labels).
- [ ] Record per-subject marks and calculated performance/grades.
- [ ] Allow every branch teacher to view any branch learner's performance.

**Exit criteria:** marks and grades are consistent across subjects and assessment
types, with branch-wide teacher visibility.

## Checkpoint 8 — Lightweight finance

- [ ] Add fees/charges, payments, and minimal balance calculations tied to an
  admission/enrollment.
- [ ] Add lightweight expenses and financial summaries if required by the PRD.
- [ ] Export finance summaries without introducing SaaS-grade accounting logic.

**Exit criteria:** administrators can record core money flows and see reliable
lightweight balances in PKR.

## Checkpoint 9 — Backend hardening and frontend handoff

- [ ] Add module-level API tests for permissions and business rules.
- [ ] Complete Swagger documentation and seed/manual verification paths.
- [ ] Review module boundaries so optional licensing code can be removed safely.
- [ ] Begin frontend modules, route layouts, sidebar, and light/dark/system theme
  only after the backend checkpoint is accepted.

**Exit criteria:** every required backend endpoint is verified and ready for the
frontend implementation.
