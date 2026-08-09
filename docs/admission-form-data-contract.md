# Admission Form Data Contract

## Public submission fields

The form filler never sees an admission number, fee calculation, receipt, or
campus-allocation controls.

### Applying for

- Requested school class or requested course.
- Requested academic group/track when the selected school class requires one.
  Examples: Science, Computer, Arts, Pre-Medical, Pre-Engineering, ICS, and
  General Science/Statistics/Economics.

### Student personal information

- Full name as recorded on CNIC/B-Form.
- Father name.
- Date of birth.
- Nationality, defaulting to Pakistan.
- Present and permanent address.
- Residential phone and/or student cell phone.
- Optional email.
- Student CNIC/B-Form number, exactly 13 digits.

### Academic history

Up to two previous class records, each containing school name, class attended,
marks obtained, percentage, completion year, and subjects studied.

### Parent/guardian

- Whether the form is filled by a parent or guardian.
- Guardian relation when the form is filled by a guardian.
- Name, 13-digit CNIC, optional email, residential phone, and cell phone.
- Employment state and, when applicable, sector, designation, organization, or
  business name and description.

### Siblings

Repeatable sibling records. A student sibling includes class and institute;
employed or business siblings include profession, organization, designation,
and/or business details.

## Approval-only fields

- Campus allocation through an `AcademicOffering`.
- Organization-wide academic term.
- Generated admission number.
- Monthly fee, received amount, receipt number, opening balance, and optional
  balance due date.
- Remarks and immutable admission-officer name snapshot.

## Physical documents — frontend note for later

The MVP does not upload documents. The admission form must show a clear
physical-submission checklist:

1. Two passport-size student photographs.
2. Copy of the latest board result card.
3. Copy of the student CNIC/B-Form.
