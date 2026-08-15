# Product

<!-- impeccable:product-schema 1 -->

## Platform

web

## Users

School administrators configure academic operations across branches. Teachers and staff consult their daily teaching commitments. Guardians and learners view their own academic information.

## Product Purpose

AcademyOS is a white-label school-management application for Pakistan. It centralizes admissions, academics, attendance, grades, finance, staff operations, and parent/student access for one school deployment with multiple branches.

## Operating Context

Administrators manage class sections, subjects, teachers, and schedules during normal school operations. School days normally run Monday through Saturday. Friday often has a shorter, distinct schedule. Teachers need a fast read-only view of their day, including free, break, arranged, and assigned periods.

## Capabilities and Constraints

- A single deployed app serves one school, with multiple branches.
- `AcademicOffering` represents a branch-level school class or section; courses are not the current timetable focus.
- Administrators can configure editable timetable slots, including optional breaks and day-specific timing.
- A class may replace its branch schedule with a complete override.
- Teachers may only view their own schedules; administrators manage scheduling.
- Currency is PKR and the operating timezone is Asia/Karachi.

## Brand Commitments

AcademyOS uses a maroon-and-gold identity for public/authentication surfaces and a semantic, light/dark operational UI for the application.

## Product Principles

- Keep high-frequency school operations quick and legible.
- Make branch and class context explicit before changing data.
- Prefer reusable, modular modules over role-specific duplication.
- Protect teaching time by preventing conflicting teacher assignments.

