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

## Open

### QA-002 — Assessment records cannot be managed after creation

- **Severity:** P1
- **Area:** Admin > Grades > Assessments
- **Reproduction:** Create an assessment. Its card shows the title, type, date, and mark count but provides no Edit or Delete action.
- **Expected:** Administrators can update or delete assessments, including their associated marks, through the Grades interface.
- **Status:** Fixed locally; awaiting push and Vercel deployment.
- **Fix location:** `apps/web/features/grades/management/grades-management.tsx`

## Verified in this QA pass

- Admin session and all core admin routes load without visible API error states: dashboard, admissions, academics, students, attendance, grades, finance, notes, announcements, staff, settings, and timetable.
- Timetable now shows the campus teacher `QA Teacher One` in assignment selectors.
- At a 390px-wide mobile viewport, Students, Attendance, and Timetable have no page-level horizontal overflow; the navigation menu trigger remains reachable.
- No browser console warnings or errors were captured during the sweep.
