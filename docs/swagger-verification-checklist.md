# Swagger Verification Checklist

Use the seeded administrator account: `admin` / `Welcome123!`.

1. `POST /auth/login`, then authorize Swagger with the returned access token.
2. Configure organization, branch operating hours, academic term, and admission
   registration settings.
3. Create school classes/courses, subjects, and branch academic offerings.
4. Create staff, save the one-time password/PIN, and verify kiosk check-in/out.
5. Submit a public admission, approve it with an academic term and in-person
   fee details, then save the generated registration number/portal credentials.
6. Verify learner login using `accountType: LEARNER` and
   `GET /learner-portal/students`.
7. Mark student attendance, create an assessment, submit marks, and inspect
   student performance.
8. Record a manual payment and inspect the student finance summary.
9. Add a holiday/off day and inspect the student attendance report response.

Expected rules:

- Unmarked student attendance is not persisted.
- Rejected admissions can be deleted; pending and approved applications cannot.
- Admission numbers are generated only at approval.
- A guardian contact can see multiple students through one learner portal.
- Kiosk operations use PINs; no cron job changes missing checkout records.
