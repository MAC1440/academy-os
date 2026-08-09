-- AddForeignKey
ALTER TABLE "RoleAssignment"
ADD CONSTRAINT "RoleAssignment_branchId_fkey"
FOREIGN KEY ("branchId") REFERENCES "Branch"("id") ON DELETE CASCADE ON UPDATE CASCADE;
