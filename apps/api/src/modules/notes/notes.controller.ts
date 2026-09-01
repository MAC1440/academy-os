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
import { CreatePersonalNoteDto } from './dto/create-personal-note.dto';
import { UpdatePersonalNoteDto } from './dto/update-personal-note.dto';
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

  @Get('personal/mine')
  @UseGuards(JwtAuthGuard)
  async personalNotes(@CurrentUser() user: AuthenticatedUser) {
    this.requireAccountType(user, AccountType.STAFF);
    return successResponse(
      'Personal notes retrieved',
      await this.notesService.listPersonalNotes(user.id),
    );
  }

  @Post('personal')
  @UseGuards(JwtAuthGuard)
  async createPersonalNote(
    @Body() dto: CreatePersonalNoteDto,
    @CurrentUser() user: AuthenticatedUser,
  ) {
    this.requireAccountType(user, AccountType.STAFF);
    return successResponse(
      'Personal note created',
      await this.notesService.createPersonalNote(dto, user.id),
    );
  }

  @Patch('personal/:noteId')
  @UseGuards(JwtAuthGuard)
  async updatePersonalNote(
    @Param('noteId') noteId: string,
    @Body() dto: UpdatePersonalNoteDto,
    @CurrentUser() user: AuthenticatedUser,
  ) {
    this.requireAccountType(user, AccountType.STAFF);
    return successResponse(
      'Personal note updated',
      await this.notesService.updatePersonalNote(noteId, dto, user.id),
    );
  }

  @Delete('personal/:noteId')
  @UseGuards(JwtAuthGuard)
  async deletePersonalNote(
    @Param('noteId') noteId: string,
    @CurrentUser() user: AuthenticatedUser,
  ) {
    this.requireAccountType(user, AccountType.STAFF);
    await this.notesService.deletePersonalNote(noteId, user.id);
    return successResponse('Personal note removed', { id: noteId });
  }

  @Get(':noteId')
  @RequirePermissions('notes.read')
  async getNote(@Param('noteId') noteId: string) {
    return successResponse(
      'Shared note retrieved',
      await this.notesService.getNote(noteId),
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
