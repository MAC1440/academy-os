# AcademyOS MVP Delivery Checklist

## Delivery rules

- Complete one checkpoint before beginning the next.
- Every checkpoint includes migration, API validation, authorization, Swagger,
  automated tests, and a manual verification path.
- Business rules are enforced in the API; frontend permissions are only UI.
- Operational data is Branch-scoped. Owners have organization-wide access;
  everyone else has access only to assigned branches.
- Use soft deletion where deletion is supported. Do not use cron jobs for MVP
  attendance calculation.
- Status key: `[x]` verified complete; `[-]` implemented in part; `[ ]` not started.

## Checkpoint 0 — Baseline and guardrails

- [x] Resolve the ESLint flat-config error.
- [x] Confirm API, web, database, and test commands in the README.
- [x] Standardize errors, pagination, migrations, seed data, and test data.

**Exit criteria:** API and web build, lint runs, and local setup is documented.

## Checkpoint 1 — Identity and tenant membership

- [x] Persist User accounts instead of using development-only login.
- [x] Securely hash passwords and teacher PINs.
- [-] Implement login, refresh, logout, account status, and current-user data.
- [x] Create organization membership and branch assignment records.
- [x] Create Platform Super Admin creation of organizations and initial owners.
- [x] Enforce organization and branch isolation in the API.

**Exit criteria:** an owner has organization-wide access; branch users cannot
access another branch's records.

## Checkpoint 2 — RBAC and audit trail

- [ ] Seed system roles: Owner, Administrator, Manager, Teacher, Receptionist,
  Accountant, Student, Parent.
- [ ] Seed grouped permission keys and create organization-custom roles.
- [ ] Assign roles by organization or branch, never direct user permissions.
- [ ] Add a permission decorator and server-side permission guard.
- [ ] Record auditable create, update, delete, role, and attendance overrides.
- [ ] Build role list, permission matrix, and role-assignment interfaces.

**Exit criteria:** server-side permission tests return `403` for unauthorized
requests, while owners can manage organization roles.

## Checkpoint 3 — Organization and branch hardening

- [ ] Replace academy and branch hard deletion with soft deletion.
- [ ] Fix PKR and Asia/Karachi as MVP business rules.
- [ ] Add normalized address fields and organization-scoped uniqueness.
- [ ] Add branch activation/deactivation and branch assignment management.

**Exit criteria:** only Platform Super Admin creates organizations; owners manage
their own branches without crossing organization boundaries.

## Checkpoint 4 — Academic calendar and structure

- [x] Add optional section support and organization academic settings.
- [x] Add academic years, configured working weekdays, holidays, and off days.
- [x] Add school classes: Nursery, Prep, grades, and HSSC levels.
- [-] Add optional sections and class subjects. Sections are complete; subjects remain.
- [x] Keep vocational courses out of the school MVP data model.

**Exit criteria:** a branch can configure its academic calendar, classes,
sections, and subjects.

## Checkpoint 5 — Teachers and staff

- [x] Create teacher/staff profiles linked to users and branches.
- [-] Support activation, deactivation, search, filters, and pagination.
- [-] Add teacher PIN setup/reset and class/subject assignments. PIN setup/reset is complete; class/subject assignments remain.
- [x] Do not restrict branch-wide student-performance viewing by assignment.

**Exit criteria:** teachers have access only to assigned branches.

## Checkpoint 6 — Admissions and students

- [ ] Create the default public admission form per organization.
- [ ] Store applications as `PENDING` applicants.
- [ ] Build pending, approved, and rejected admissions queues.
- [ ] Approve into a selected branch/class/section while retaining application
  history.
- [ ] Keep rejected applications unless authorized staff explicitly delete them.
- [ ] Add guardian data, student profiles, deactivation, search, and filters.

**Exit criteria:** applications can be submitted, approved, or rejected; branch
users cannot access another branch's students.

## Checkpoint 7 — Student attendance

- [ ] Let permitted branch teachers and administrators mark attendance.
- [ ] Show the class/section list without modal-based marking.
- [ ] Add one-click "Mark all present" and exceptions: Absent, Late, Leave.
- [ ] Store one record per student, branch, and school day.
- [ ] Keep students unmarked; never create automatic absence records or jobs.
- [ ] Prevent marking on configured holidays and off days.
- [ ] Audit who marked or edited attendance.

**Exit criteria:** attendance can be quickly marked, amended by authorized staff,
and verified by API and UI tests.

## Checkpoint 8 — Teacher attendance kiosk

- [ ] Build a branch-specific teacher attendance portal.
- [ ] Support teacher selection and four-digit PIN verification.
- [ ] Record check-in and checkout in Pakistan local time.
- [ ] Apply configured workdays, start time, grace period, and late rules.
- [ ] Treat missing checkout as complete day; permit authorized override.
- [ ] Exclude overtime and off-day attendance calculations.

**Exit criteria:** only valid branch teachers can check in/out; invalid PIN,
duplicate action, and holiday cases are tested.

## Checkpoint 9 — Assessments and performance

- [ ] Configure a grade scale.
- [ ] Support dated regular assessments with maximum marks.
- [ ] Support festival periods: Midterm, Send-ups, Finals, Test Series, and
  custom labels.
- [ ] Record subject marks and calculate percentage/grade consistently.
- [ ] Show each student's subject performance history.
- [ ] Permit every branch teacher to view branch student performance.

**Exit criteria:** authorized staff can enter marks and see correct performance
by student, subject, and selected assessment period.

## Checkpoint 10 — Attendance exports and MVP dashboard

- [ ] Generate downloadable teacher and student attendance for a date range.
- [ ] Calculate working days from weekdays minus holidays/off days.
- [ ] Treat unmarked students as absent only during report calculation.
- [ ] Highlight holidays and off days in reports.
- [ ] Add MVP dashboard counts for branches, teachers, students, attendance.

**Exit criteria:** reports match daily source data and calendar configuration,
without cron-generated attendance data.

## Deferred after the MVP

- [ ] Fees, invoices, payments, expenses, and payroll.
- [ ] Timetable, rooms, and clash detection.
- [ ] Parent portal and messaging.
- [ ] Dynamic admission form builder.
- [ ] Vocational courses and AI features.
