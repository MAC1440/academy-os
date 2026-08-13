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
- [ ] Deploy and recheck the direct-enrollment credential handoff fix.
- [x] QA defect identified: grades RTK Query endpoints did not unwrap the API response envelope, leaving new assessments invisible.
- [ ] Deploy and recheck assessment list, marks entry, and performance history.

## Next QA Scenarios

- [ ] Organization settings and branch setup.
- [ ] Academic groups and branch offerings.
- [ ] Direct student enrollment, edit, search, and delete.
- [ ] Admissions review and approval.
- [ ] Staff credentials, kiosk check-in/out, and attendance reports.
- [ ] Student attendance marking, monthly view, and CSV export.
- [ ] Assessments, marks entry, print/PDF report, and performance history.
- [ ] Fees, payments, edits/deletes, and finance summary.
- [ ] Notes, announcements, learner/guardian portal, and staff portal.
- [ ] Responsive checks on small screens and final error/empty/loading states.
