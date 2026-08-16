# AcademyOS MVP — Backend Delivery Status

Last updated: 13 August 2026

This is the working PRD/status record for the backend-first MVP. It records both implemented work and intentional product decisions, so deferred behavior is not mistaken for a missing feature.

## Confirmed Product Rules

- One white-labelled deployment serves one organization and its branches; this is not a multi-tenant SaaS deployment.
- Regular school classes and external courses are separate offerings. A learner can have separate admissions across offerings and branches.
- Admins sign in with a username and password. Staff and learner/guardian portals sign in with a contact number and password.
- Staff use a unique contact number; learner/guardian contact numbers may be shared by multiple students.
- Default staff working schedule is Monday–Saturday, 7:00 AM–2:00 PM, with a 15-minute grace period. Administrators can change it.
- There are no cron jobs for attendance. An unmarked learner is not automatically written as absent.
- Holidays and off days remain unmarked by design. They are informational for reports only; no calendar rule blocks or changes attendance records.
- Staff members who do not check out are left as recorded; no automatic completion or payroll consequence is applied.
- Salary and payroll calculations are manual and outside the current MVP.
- Grade letters and display rules are frontend responsibilities for now; the backend stores assessments, marks, totals, and percentages.
- Admission payments are recorded as in-person transactions. There are no payment gateways or digital document uploads in this MVP.
- Required admission attachments are collected physically: photographs, latest result card, and CNIC/B-Form copy.
- Academic terms are organization-wide, not branch-specific.

## Completed Backend Modules

- [x] White-label organization foundation, branches, users, authentication, refresh tokens, profile completion, and Swagger JWT support.
- [x] Permission roles, scoped role assignments, branch access checks in core services, and audit records for key mutations.
- [x] Branch operating hours and editable attendance-kiosk settings.
- [x] Staff profiles, secure initial credentials/PIN, PIN reset, public check-in/check-out kiosk, and administrator overrides.
- [x] Shared notes library for staff.
- [x] School classes, courses, subjects, academic offerings, offering subjects, and offering teachers.
- [x] Organization-wide academic groups, eligible-school-class mapping, and group selection on school-class offerings.
- [x] Admissions: public submission, review queue, approved/rejected lifecycle, physical-document verification, mandatory academic term, registration-number settings, and approval into a student record.
- [x] Learner/guardian portal account creation, contact-number login, and ownership-protected views for linked students' attendance, performance, fees, and payments.
- [x] Student attendance roster and one-request bulk attendance saving. Unmarked values remain `null`/unmarked; branch access is enforced without teacher-to-offering assignment restrictions.
- [x] Assessments, mark entry, and per-student performance history, with marks validated against the assessment offering's students and subjects.
- [x] Lightweight student finance: admission fee/balance fields, in-person payments, and finance summary.
- [x] Academic calendar entries for holidays/off days, without attendance enforcement.
- [x] Student and staff attendance report endpoints, including CSV-ready output.
- [x] Prisma migrations for all implemented backend modules.

## Intentionally Deferred / Not Required for This MVP

- [ ] Calendar-driven attendance enforcement, automatic absence creation, automatic staff checkout completion, or cron jobs. Not desired.
- [ ] Payroll, salary, overtime, or holiday-pay calculations. Manual administration is sufficient.
- [ ] Backend letter-grade scales, grade-boundary configuration, or report-card formatting. Frontend can derive letters from percentage.
- [ ] Payment gateway integration, invoice automation, or digital attachment storage.
- [ ] Fully normalized storage for every historical admission-form field. The current `formData` supports the physical form while the core admission fields are structured. Normalize more fields only when reporting/search needs demand it.
- [ ] Organization-wide report-card templates, letter-grade scales, and advanced OCR (handwritten/Urdu/scanned-PDF extraction). Deferred until after MVP validation.

## Current Checkpoint: Manual API Testing

1. Run the Swagger checklist in [swagger-verification-checklist.md](swagger-verification-checklist.md).
2. Record any API, validation, or permission issue found during real workflows.
3. Configure academic groups for classes 9–12 and verify grouped academic offerings.
4. Move to frontend modules, layouts/guards, and shadcn-based UI once backend behavior is signed off.

## Frontend Foundation

- [x] Fresh Next.js route foundation, landing page, login, guarded dashboard shell, and light/dark/system theme.
- [x] Redux Toolkit store and RTK Query base API with bearer-token refresh/retry handling.
- [x] Feature-owned RTK Query endpoint modules registered for every exposed backend endpoint.
- [x] Organization setup: profile, branches with unique addresses, editable branch operating hours, organization-wide academic terms, and admission registration-number settings.
- [x] Academic catalogue: tabbed management for school classes, external courses, subjects, and academic groups.
- [x] Branch academic offerings: campus-specific school-class/course availability, optional groups and sections, plus offering-subject assignment.
- [x] Seed defaults: a Main Campus plus every standard school-class offering with its curriculum subjects; newly created branches receive the same default class offerings.
- [x] Student management: branch-scoped directory, editable student records with class/campus reassignment, and direct enrollment for pre-existing students using the same admission-approval workflow.
- [x] Administrator self-service profile: editable sign-in username, contact details, and password.
- [x] Admissions operations: tabbed pending/approved/rejected queues, application review, physical-document verification, and approval allocation into term/offering/fees.
- [x] Staff management: tabbed directory, staff-account creation with campus assignment, profile maintenance, and one-time portal/kiosk credentials.
- [x] Attendance operations: one-click student roster marking, staff attendance reports with CSV download, and editable kiosk default shift/workday settings.
- [x] Public teacher-attendance kiosk: campus selection, staff-name selection, private four-digit PIN verification, and check-in/check-out recording.
- [x] Grades and performance: regular/festival assessments, subject-based mark entry, and student performance history.
- [x] Grades polish: class-tabbed roster table, planned/impromptu test entry, persisted-mark editing, and printable/PDF student performance reports.
- [x] Finance operations: per-student fee summary, payment history, receipt-numbered payment recording in PKR, plus payment edit/delete.
- [x] Shared notes: organization-wide CRUD, search, Markdown rendering with KaTeX equations, and client-side text extraction from images, text PDFs, and DOCX files.
- [x] Operations table foundation: responsive, horizontally scrollable data tables for academic catalogues/groups, student and staff directories, and finance payment history.
- [x] Shared UI hardening: password visibility controls, theme-safe notifications, portal-aware landing links, and confirmation dialogs before destructive actions.
- [x] All planned admin feature screens have been implemented.
- [ ] Final admin pass: dashboard utility, cross-module empty/error/loading states, responsive QA, and manual browser verification.
- [x] Learner/guardian portal core: contact-number sign-in, linked-student dashboard, attendance, performance, finance, announcements, shared notes, and forced temporary-password replacement.
- [x] Staff portal core: contact-number sign-in, forced temporary-password replacement, todayâ€™s attendance status, assigned-class reference, announcements, and shared notes.
- [x] Staff timetable: today-first weekday tabs with read-only assigned, free, assembly, and break periods; administrators can add or remove one-day teacher cover overrides without altering the regular timetable.
- [x] Admin announcement management: audience targeting, optional event dates, full CRUD, search, and staff/learner portal delivery.
- [ ] Final cross-portal responsive/manual QA.
- [ ] Advanced OCR (handwritten/Urdu/scanned-PDF extraction) after MVP validation.

## Backend Stop Line

The essential backend MVP is implemented. Remaining backend work is limited to defects found during manual verification; deferred items do not block admin MVP acceptance.
