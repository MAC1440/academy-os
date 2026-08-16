import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  Post,
  UseGuards,
  ForbiddenException,
} from '@nestjs/common';
import { AccountType } from '@prisma/client';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { successResponse } from '../../common/api-response';
import { RequirePermissions } from '../access/decorators/require-permissions.decorator';
import { PermissionsGuard } from '../access/guards/permissions.guard';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import type { AuthenticatedUser } from '../auth/decorators/current-user.decorator';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { CreateNoteDto } from './dto/create-note.dto';
import { UpdateNoteDto } from './dto/update-note.dto';
import { NotesService } from './notes.service';

@ApiTags('Shared Notes')
@ApiBearerAuth('JWT-auth')
@UseGuards(JwtAuthGuard, PermissionsGuard)
@Controller('notes')
export class NotesController {
  constructor(private readonly notesService: NotesService) {}

  @Get()
  @RequirePermissions('notes.read')
  async listNotes() {
    return successResponse(
      'Shared notes retrieved',
      await this.notesService.listNotes(),
    );
  }
  @Get('learner')
  @UseGuards(JwtAuthGuard)
  async learnerNotes(@CurrentUser() user: AuthenticatedUser) {
    this.requireAccountType(user, AccountType.LEARNER);
    return successResponse(
      'Shared notes retrieved',
      await this.notesService.listNotes(),
    );
  }
  @Get('staff')
  @UseGuards(JwtAuthGuard)
  async staffNotes(@CurrentUser() user: AuthenticatedUser) {
    this.requireAccountType(user, AccountType.STAFF);
    return successResponse(
      'Shared notes retrieved',
      await this.notesService.listNotes(),
    );
  }

  @Post()
  @RequirePermissions('notes.create')
  async createNote(
    @Body() dto: CreateNoteDto,
    @CurrentUser() user: AuthenticatedUser,
  ) {
    return successResponse(
      'Shared note created',
      await this.notesService.createNote(dto, user.id),
    );
  }

  @Patch(':noteId')
  @RequirePermissions('notes.update')
  async updateNote(
    @Param('noteId') noteId: string,
    @Body() dto: UpdateNoteDto,
    @CurrentUser() user: AuthenticatedUser,
  ) {
    return successResponse(
      'Shared note updated',
      await this.notesService.updateNote(noteId, dto, user.id),
    );
  }

  @Delete(':noteId')
  @RequirePermissions('notes.delete')
  async archiveNote(
    @Param('noteId') noteId: string,
    @CurrentUser() user: AuthenticatedUser,
  ) {
    this.requireAccountType(user, AccountType.ADMIN);
    await this.notesService.archiveNote(noteId, user.id);
    return successResponse('Shared note archived', { id: noteId });
  }

  private requireAccountType(
    user: AuthenticatedUser,
    accountType: AccountType,
  ) {
    if (user.accountType !== accountType)
      throw new ForbiddenException(
        'This portal endpoint is not available for this account',
      );
  }
}
