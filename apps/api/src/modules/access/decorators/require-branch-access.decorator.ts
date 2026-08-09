import { SetMetadata } from '@nestjs/common';

export const BRANCH_ACCESS_KEY = 'branchAccess';

/** Declares the request field containing the branch id to authorize. */
export const RequireBranchAccess = (field = 'branchId') =>
  SetMetadata(BRANCH_ACCESS_KEY, field);
