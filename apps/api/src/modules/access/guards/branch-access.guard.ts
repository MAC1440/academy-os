import {
  CanActivate,
  ExecutionContext,
  ForbiddenException,
  Injectable,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import type { AuthenticatedUser } from '../../auth/decorators/current-user.decorator';
import { AccessService } from '../access.service';
import { BRANCH_ACCESS_KEY } from '../decorators/require-branch-access.decorator';

@Injectable()
export class BranchAccessGuard implements CanActivate {
  constructor(
    private readonly reflector: Reflector,
    private readonly accessService: AccessService,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const field = this.reflector.getAllAndOverride<string>(BRANCH_ACCESS_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);
    if (!field) return true;

    const request = context.switchToHttp().getRequest<{
      user?: AuthenticatedUser;
      params: Record<string, string>;
      body?: Record<string, unknown>;
      query: Record<string, string>;
    }>();
    const branchId =
      request.params[field] ?? request.body?.[field] ?? request.query[field];
    if (typeof branchId !== 'string' || !branchId) {
      throw new ForbiddenException('A branch is required for this operation');
    }
    if (!request.user)
      throw new ForbiddenException('Authentication is required');
    if (
      !(await this.accessService.canAccessBranch(request.user.id, branchId))
    ) {
      throw new ForbiddenException('You do not have access to this branch');
    }
    return true;
  }
}
