import { Injectable, NotFoundException } from '@nestjs/common';
import { AuditAction } from '@prisma/client';
import { AuditService } from '../audit/audit.service';
import { PrismaService } from '../../prisma/prisma.service';
import { CreateNoteDto } from './dto/create-note.dto';
import { UpdateNoteDto } from './dto/update-note.dto';
import { CreatePersonalNoteDto } from './dto/create-personal-note.dto';
import { UpdatePersonalNoteDto } from './dto/update-personal-note.dto';

@Injectable()
export class NotesService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly auditService: AuditService,
  ) {}

  async listNotes() {
    const organization = await this.organization();
    return this.prisma.sharedNote.findMany({
      where: { organizationId: organization.id, deletedAt: null },
      include: {
        author: { select: { id: true, fullName: true } },
        lastEditedBy: { select: { id: true, fullName: true } },
      },
      orderBy: { updatedAt: 'desc' },
    });
  }

  async getNote(noteId: string) {
    const organization = await this.organization();
    const note = await this.prisma.sharedNote.findFirst({
      where: { id: noteId, organizationId: organization.id, deletedAt: null },
      include: {
        author: { select: { id: true, fullName: true } },
        lastEditedBy: { select: { id: true, fullName: true } },
      },
    });
    if (!note) throw new NotFoundException('Shared note not found');
    return note;
  }

  async createNote(dto: CreateNoteDto, authorUserId: string) {
    const organization = await this.organization();
    const note = await this.prisma.sharedNote.create({
      data: {
        organizationId: organization.id,
        authorUserId,
        lastEditedByUserId: authorUserId,
        title: dto.title.trim(),
        content: dto.content.trim(),
      },
      include: {
        author: { select: { id: true, fullName: true } },
        lastEditedBy: { select: { id: true, fullName: true } },
      },
    });
    await this.audit(authorUserId, AuditAction.CREATE, note.id, dto);
    return note;
  }

  async updateNote(noteId: string, dto: UpdateNoteDto, actorUserId: string) {
    const note = await this.note(noteId);
    const updated = await this.prisma.sharedNote.update({
      where: { id: note.id },
      data: {
        ...(dto.title !== undefined ? { title: dto.title.trim() } : {}),
        ...(dto.content !== undefined ? { content: dto.content.trim() } : {}),
        lastEditedByUserId: actorUserId,
      },
      include: {
        author: { select: { id: true, fullName: true } },
        lastEditedBy: { select: { id: true, fullName: true } },
      },
    });
    await this.audit(actorUserId, AuditAction.UPDATE, note.id, dto);
    return updated;
  }

  async archiveNote(noteId: string, actorUserId: string) {
    const note = await this.note(noteId);
    await this.prisma.sharedNote.update({
      where: { id: note.id },
      data: { deletedAt: new Date() },
    });
    await this.audit(actorUserId, AuditAction.DELETE, note.id);
  }

  async listPersonalNotes(ownerUserId: string) {
    return this.prisma.teacherPersonalNote.findMany({
      where: { ownerUserId, deletedAt: null },
      orderBy: [{ isPinned: 'desc' }, { updatedAt: 'desc' }],
    });
  }

  async createPersonalNote(dto: CreatePersonalNoteDto, ownerUserId: string) {
    return this.prisma.teacherPersonalNote.create({
      data: {
        ownerUserId,
        title: dto.title.trim(),
        content: dto.content.trim(),
        isPinned: dto.isPinned ?? false,
        reminderAt: dto.reminderAt ? new Date(dto.reminderAt) : null,
      },
    });
  }

  async updatePersonalNote(noteId: string, dto: UpdatePersonalNoteDto, ownerUserId: string) {
    const note = await this.personalNote(noteId, ownerUserId);
    return this.prisma.teacherPersonalNote.update({
      where: { id: note.id },
      data: {
        ...(dto.title !== undefined ? { title: dto.title.trim() } : {}),
        ...(dto.content !== undefined ? { content: dto.content.trim() } : {}),
        ...(dto.isPinned !== undefined ? { isPinned: dto.isPinned } : {}),
        ...(dto.reminderAt !== undefined
          ? { reminderAt: dto.reminderAt ? new Date(dto.reminderAt) : null }
          : {}),
      },
    });
  }

  async deletePersonalNote(noteId: string, ownerUserId: string) {
    const note = await this.personalNote(noteId, ownerUserId);
    await this.prisma.teacherPersonalNote.update({
      where: { id: note.id },
      data: { deletedAt: new Date() },
    });
  }

  private async organization() {
    const organization = await this.prisma.organization.findFirst();
    if (!organization)
      throw new NotFoundException('Organization has not been configured');
    return organization;
  }

  private async note(noteId: string) {
    const organization = await this.organization();
    const note = await this.prisma.sharedNote.findFirst({
      where: { id: noteId, organizationId: organization.id, deletedAt: null },
    });
    if (!note) throw new NotFoundException('Shared note not found');
    return note;
  }

  private async personalNote(noteId: string, ownerUserId: string) {
    const note = await this.prisma.teacherPersonalNote.findFirst({
      where: { id: noteId, ownerUserId, deletedAt: null },
    });
    if (!note) throw new NotFoundException('Personal note not found');
    return note;
  }

  private async audit(
    actorUserId: string,
    action: AuditAction,
    entityId: string,
    changes?: object,
  ) {
    const organization = await this.organization();
    await this.auditService.record({
      organizationId: organization.id,
      actorUserId,
      action,
      entityType: 'SharedNote',
      entityId,
      changes: changes,
    });
  }
}
