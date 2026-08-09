# AcademyOS MVP — Backend Delivery Status

Last updated: 10 August 2026

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
- [x] Admissions: public submission, review queue, approved/rejected lifecycle, physical-document verification, terms, registration-number settings, and approval into a student record.
- [x] Learner/guardian portal account creation and contact-number login handling.
- [x] Student attendance roster and one-request bulk attendance saving. Unmarked values remain `null`/unmarked.
- [x] Assessments, mark entry, and per-student performance history.
- [x] Lightweight student finance: admission fee/balance fields, in-person payments, and finance summary.
- [x] Academic calendar entries for holidays/off days, without attendance enforcement.
- [x] Student and staff attendance report endpoints, including CSV-ready output.
- [x] Prisma migrations for all implemented backend modules.

## Intentionally Deferred / Not Required for This MVP

- [ ] Academic groups for class levels 9–12 (for example Science, Computer, Arts, Pre-Medical, Pre-Engineering, ICS). This is the next backend enhancement after the current testing pass.
- [ ] Calendar-driven attendance enforcement, automatic absence creation, automatic staff checkout completion, or cron jobs. Not desired.
- [ ] Payroll, salary, overtime, or holiday-pay calculations. Manual administration is sufficient.
- [ ] Backend letter-grade scales, grade-boundary configuration, or report-card formatting. Frontend can derive letters from percentage.
- [ ] Payment gateway integration, invoice automation, or digital attachment storage.
- [ ] Fully normalized storage for every historical admission-form field. The current `formData` supports the physical form while the core admission fields are structured. Normalize more fields only when reporting/search needs demand it.
- [ ] Spreadsheet/PDF formatting for exports. Current attendance exports provide report data/CSV; presentation can be completed in the frontend when required.

## Current Checkpoint: Manual API Testing

1. Run the Swagger checklist in [swagger-verification-checklist.md](swagger-verification-checklist.md).
2. Record any API, validation, or permission issue found during real workflows.
3. Add academic groups after that testing pass is accepted.
4. Move to frontend modules, layouts/guards, and shadcn-based UI once backend behavior is signed off.

## Backend Stop Line

The essential backend MVP is implemented for testing. The remaining planned backend work is academic groups plus any defects uncovered during verification; the deliberately deferred items above do not block frontend development.
