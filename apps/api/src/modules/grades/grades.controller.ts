import {
  Body,
  Controller,
  Get,
  Param,
  Post,
  Put,
  UseGuards,
} from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { RequirePermissions } from '../access/decorators/require-permissions.decorator';
import { PermissionsGuard } from '../access/guards/permissions.guard';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import type { AuthenticatedUser } from '../auth/decorators/current-user.decorator';
import { GradesService } from './grades.service';
import { CreateAssessmentDto, SaveMarksDto } from './dto/grades.dto';
@ApiTags('Grades')
@ApiBearerAuth('JWT-auth')
@UseGuards(JwtAuthGuard, PermissionsGuard)
@Controller()
export class GradesController {
  constructor(private readonly service: GradesService) {}
  @Get('academic-offerings/:offeringId/assessments')
  @RequirePermissions('grades.read')
  list(
    @Param('offeringId') id: string,
    @CurrentUser() user: AuthenticatedUser,
  ) {
    return this.service.list(id, user.id);
  }
  @Post('academic-offerings/:offeringId/assessments')
  @RequirePermissions('grades.manage')
  create(
    @Param('offeringId') id: string,
    @Body() dto: CreateAssessmentDto,
    @CurrentUser() user: AuthenticatedUser,
  ) {
    return this.service.create(id, dto, user.id);
  }
  @Put('assessments/:assessmentId/marks')
  @RequirePermissions('grades.manage')
  save(
    @Param('assessmentId') id: string,
    @Body() dto: SaveMarksDto,
    @CurrentUser() user: AuthenticatedUser,
  ) {
    return this.service.saveMarks(id, dto, user.id);
  }
  @Get('students/:studentId/performance')
  @RequirePermissions('grades.read')
  history(
    @Param('studentId') id: string,
    @CurrentUser() user: AuthenticatedUser,
  ) {
    return this.service.history(id, user.id);
  }
}
