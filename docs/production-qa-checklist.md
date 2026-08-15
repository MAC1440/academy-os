# AcademyOS Production QA Checklist

Started: 14 August 2026

## Environment

- Web: `https://academy-os-web-seven.vercel.app`
- API: `https://api-production-dace.up.railway.app`

## Verified

- [x] Web application loads from Vercel.
- [x] API accepts authenticated production requests through the web application.
- [x] Admin login redirects to the protected dashboard.
- [x] Dashboard renders without an authorization or CORS error.
- [x] Seeded academic classes load.
- [x] Academic catalogue tab changes load their own data without a page refresh.
- [x] Organization settings load in production and their tabbed sections render correctly.
- [x] QA campus, organization-wide academic term, and Class 1 offering can be created through the connected workflow.
- [x] Direct enrollment approves a student, assigns a registration number, creates learner access, and records fee setup.
- [x] Staff creation exposes temporary portal credentials and kiosk PIN to administrators.
- [x] Public kiosk records check-in and check-out with the assigned four-digit PIN.
- [x] Staff temporary portal login reaches mandatory password replacement.
- [x] Weekly student attendance loads the roster, cycles a status, and persists it.
- [x] QA defect identified: direct enrollment generated learner credentials but navigated away before displaying them.
- [x] Direct-enrollment credential handoff fix deployed and rechecked.
- [x] QA defect identified: Grades queries were not invalidated after creates/saves, leaving stale assessment data on screen.
- [x] Assessment cache fix deployed and rechecked: assessment list, marks entry, and performance history pass.
- [x] Finance summary shows admission balance and recorded payments correctly; a payment can be recorded against the QA student and the updated paid amount/balance are returned by production.
- [x] Shared notes create, update (including Markdown/math content), and archive correctly in production.
- [x] QA defect identified: announcement endpoints wrapped unresolved service calls, returning an empty object instead of the requested feed.
- [x] Announcement response fix deployed and rechecked: create, audience filtering, update, and delete pass.
- [x] Learner portal API journey passes with a QA guardian: linked student, attendance, performance, finance, notes, and audience-filtered announcements load correctly.
- [x] Staff portal API journey passes with a QA staff account: temporary login, profile overview, staff notes, and staff announcements load correctly.
- [x] Full workspace production build and lint pass (non-blocking lint warnings remain for future polish).
- [x] Announcement lifecycle QA: a dedicated QA announcement was created, edited, and deleted successfully.
- [x] Shared-notes lifecycle QA: a dedicated Markdown/KaTeX note was created, edited, rendered, and deleted successfully.
- [x] Student-attendance lifecycle QA: a weekly attendance cell cycled, saved successfully, and was restored to its original unmarked state.
- [x] Grades lifecycle QA: assessments and marks can be created; assessment edit/delete controls persist correctly, and QA assessments plus their marks were cleaned up.
- [x] Finance lifecycle QA: duplicate receipt numbers are rejected; a PKR 1 QA payment can be created and edited, and deletion restores the student's original finance summary.
- [x] Temporary QA staff account removed after staff-portal and kiosk validation.

## Next QA Scenarios

- [ ] Organization settings and branch setup.
- [ ] Academic groups and branch offerings.
- [ ] Direct student enrollment, edit, search, and delete.
- [ ] Admissions review and approval.
- [ ] Staff credentials, kiosk check-in/out, and attendance reports.
- [ ] Kiosk attendance-state tabs, duplicate-check-in prevention, and admin checkout correction (pending deployment).
- [ ] Student attendance marking, monthly view, and CSV export.
- [ ] Assessments, marks entry, print/PDF report, and performance history.
- [ ] Fees: edit and delete a recorded payment from the interface.
- [ ] Responsive checks on small screens and final error/empty/loading states.
