-- Rename the overloaded branch timing entity without changing its data.
ALTER TABLE "Session" RENAME TO "BranchOperatingHour";
ALTER TABLE "BranchOperatingHour" RENAME COLUMN "name" TO "label";
ALTER TABLE "BranchOperatingHour" RENAME COLUMN "startsAt" TO "opensAt";
ALTER TABLE "BranchOperatingHour" RENAME COLUMN "endsAt" TO "closesAt";
ALTER TABLE "BranchOperatingHour" RENAME CONSTRAINT "Session_pkey" TO "BranchOperatingHour_pkey";
ALTER TABLE "BranchOperatingHour" RENAME CONSTRAINT "Session_branchId_fkey" TO "BranchOperatingHour_branchId_fkey";
ALTER INDEX "Session_branchId_name_key" RENAME TO "BranchOperatingHour_branchId_label_key";

-- Make staff-shift settings explicit and distinct from branch operating hours.
ALTER TABLE "AttendanceKioskSettings" RENAME COLUMN "defaultShiftStart" TO "defaultStaffShiftStart";
ALTER TABLE "AttendanceKioskSettings" RENAME COLUMN "defaultShiftEnd" TO "defaultStaffShiftEnd";
