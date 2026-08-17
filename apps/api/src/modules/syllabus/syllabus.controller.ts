import {
  Body,
  Controller,
  Delete,
  ForbiddenException,
  Get,
  Param,
  Patch,
  Post,
  UseGuards,
} from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { AccountType } from '@prisma/client';
import { successResponse } from '../../common/api-response';
import { RequirePermissions } from '../access/decorators/require-permissions.decorator';
import { PermissionsGuard } from '../access/guards/permissions.guard';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import type { AuthenticatedUser } from '../auth/decorators/current-user.decorator';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import {
  CreateSessionSyllabusDto,
  UpdateSessionSyllabusDto,
} from './dto/syllabus.dto';
import { SyllabusService } from './syllabus.service';

@ApiTags('Syllabus')
@ApiBearerAuth('JWT-auth')
@UseGuards(JwtAuthGuard, PermissionsGuard)
@Controller('syllabi')
export class SyllabusController {
  constructor(private readonly syllabus: SyllabusService) {}

  @Get()
  @RequirePermissions('syllabus.read')
  async list() {
    return successResponse(
      'Syllabus sessions retrieved',
      await this.syllabus.list(),
    );
  }

  @Get(':id')
  @RequirePermissions('syllabus.read')
  async get(@Param('id') id: string) {
    return successResponse(
      'Syllabus session retrieved',
      await this.syllabus.get(id),
    );
  }

  @Post()
  @RequirePermissions('syllabus.manage')
  async create(
    @Body() dto: CreateSessionSyllabusDto,
    @CurrentUser() user: AuthenticatedUser,
  ) {
    this.requireAdmin(user);
    return successResponse(
      'Syllabus session created',
      await this.syllabus.create(dto, user.id),
    );
  }

  @Patch(':id')
  @RequirePermissions('syllabus.manage')
  async update(
    @Param('id') id: string,
    @Body() dto: UpdateSessionSyllabusDto,
    @CurrentUser() user: AuthenticatedUser,
  ) {
    this.requireAdmin(user);
    return successResponse(
      'Syllabus session updated',
      await this.syllabus.update(id, dto, user.id),
    );
  }

  @Delete(':id')
  @RequirePermissions('syllabus.manage')
  async archive(
    @Param('id') id: string,
    @CurrentUser() user: AuthenticatedUser,
  ) {
    this.requireAdmin(user);
    return successResponse(
      'Syllabus session archived',
      await this.syllabus.archive(id, user.id),
    );
  }

  private requireAdmin(user: AuthenticatedUser) {
    if (user.accountType !== AccountType.ADMIN)
      throw new ForbiddenException(
        'Only administrators can manage syllabus sessions',
      );
  }
}
