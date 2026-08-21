# AcademyOS Production QA — Confirmed Bug List

Last updated: 16 August 2026

Only reproducible defects belong in this list. Scenarios that have not yet been exercised are tracked in [production-qa-checklist.md](production-qa-checklist.md).

## Resolved

### QA-001 — A subject can be selected in more than one timetable period

- **Severity:** P1
- **Area:** Admin > Timetable > Class timetable
- **Reproduction:** Select a campus and class, choose a subject for Period 1, then open the subject selector for another period. The same subject remains selectable.
- **Expected:** A subject already selected for one period is hidden from all other period selectors in that class timetable.
- **Status:** Fixed and verified in production on 16 August 2026.
- **Fix location:** `apps/web/features/timetable/timetable-management.tsx`

### QA-007 — Editing assembly or breaks rejects null period numbers

- **Area:** Admin > Timetable > Timing profile
- **Cause:** Non-teaching rows correctly persist `periodNumber` as null, but update validation treated null as a supplied teaching-period value.
- **Expected:** Assembly and break timings remain editable; assembly is optional but first when present, and any number of breaks can appear between periods.
- **Status:** Fixed with regression coverage on 21 August 2026.

### QA-008 — Generic timetable scope drifted to campus-only

- **Area:** Admin > Timetable
- **Expected:** The active organization timing profile is shared by every campus, unless a campus override or class override is active.
- **Status:** Fixed in schema, effective-profile resolution, seed data, and admin UI on 21 August 2026.

### QA-002 — Assessment records cannot be managed after creation

- **Severity:** P1
- **Area:** Admin > Grades > Assessments
- **Reproduction:** Create an assessment. Its card shows the title, type, date, and mark count but provides no Edit or Delete action.
- **Expected:** Administrators can update or delete assessments, including their associated marks, through the Grades interface.
- **Status:** Fixed and verified in production on 16 August 2026.
- **Fix location:** `apps/web/features/grades/management/grades-management.tsx`

### QA-003 — Kiosk does not distinguish today's check-in state

- **Severity:** P1
- **Area:** Public kiosk and Admin > Attendance > Staff reports
- **Reproduction:** Open the kiosk after one or more staff members have checked in. The page lists every staff member together and still presents check-in as an available action.
- **Expected:** The kiosk shows the Pakistan date and separates pending staff, open check-ins, and completed check-outs. An open check-in only permits check-out; an admin can correct a missing or incorrect checkout time in the staff attendance report.
- **Status:** Fixed and verified in production on 16 August 2026.
- **Fix location:** `apps/api/src/modules/kiosk/kiosk.service.ts`, `apps/web/features/kiosk/attendance-kiosk.tsx`, and `apps/web/features/attendance/management/attendance-management.tsx`

### QA-004 — A valid session can open unauthorized portal routes

- **Severity:** P0
- **Area:** Main portal, staff portal, learner portal, and role permissions
- **Reproduction:** Sign in as a staff or learner account, then enter an admin route such as `/admissions` or `/finance` directly. The shared portal guard only requires a valid JWT, while the teacher system role also grants unrelated module permissions.
- **Expected:** Admin routes are Admin-only; teachers can use student attendance, shared notes, and their read-only timetable; learners remain inside `/student/*`.
- **Status:** Fixed and verified in production on 16 August 2026. A QA teacher is redirected away from all admin routes, sees only Attendance, Timetable, and Notes navigation, can create/edit notes, mark student attendance, and view their read-only timetable.
- **Fix location:** `apps/web/features/auth/portal-route-guard.tsx`, `apps/api/prisma/seed.ts`, and the affected portal controllers.

### QA-005 — Teacher timetable request is captured by the staff detail route

- **Severity:** P1
- **Area:** Staff portal > My schedule
- **Reproduction:** Sign in as a teacher and open `/timetable`. The UI reports that the schedule could not be loaded even where the teacher has a timetable assignment.
- **Cause:** The API request path `/staff/my-timetable` is matched by the generic `GET /staff/:staffId` route, which checks `staff.read` instead of the teacher's `timetable.read` permission.
- **Expected:** Teachers can view their assigned periods alongside free periods, breaks, and assembly rows.
- **Status:** Fixed and verified in production on 16 August 2026. The QA teacher can see the assigned Computer period, all free periods, assembly, and breaks across the week.
- **Fix location:** `apps/api/src/modules/timetable/timetable.controller.ts` and `apps/web/features/timetable/timetable.api.ts`.

### QA-006 — Sunday timetable opens the previous school week

- **Severity:** P2
- **Area:** Staff portal > My schedule
- **Reproduction:** Open the staff timetable on Sunday. Since Sunday is not a default school day, the first tab is the Monday from the previous week.
- **Expected:** The timetable opens the next school day, Monday, while Monday–Saturday remain selectable.
- **Status:** Fixed locally; requires deployment and production verification.
- **Fix location:** `apps/api/src/modules/timetable/timetable.service.ts`.

## Verified in this QA pass

- Admin session and all core admin routes load without visible API error states: dashboard, admissions, academics, students, attendance, grades, finance, notes, announcements, staff, settings, and timetable.
- Timetable now shows the campus teacher `QA Teacher One` in assignment selectors.
- At a 390px-wide mobile viewport, Students, Attendance, and Timetable have no page-level horizontal overflow; the navigation menu trigger remains reachable.
- No browser console warnings or errors were captured during the sweep.
