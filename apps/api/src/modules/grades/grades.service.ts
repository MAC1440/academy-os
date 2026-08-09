import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { CreateAssessmentDto, SaveMarksDto } from './dto/grades.dto';
@Injectable() export class GradesService {
 constructor(private readonly prisma: PrismaService) {}
 async create(offeringId: string, dto: CreateAssessmentDto) { return this.prisma.assessment.create({ data: { academicOfferingId: offeringId, title: dto.title.trim(), assessmentType: dto.assessmentType, heldOn: new Date(dto.heldOn) } }); }
 async list(offeringId: string) { return this.prisma.assessment.findMany({ where: { academicOfferingId: offeringId }, include: { _count: { select: { marks: true } } }, orderBy: { heldOn: 'desc' } }); }
 async saveMarks(assessmentId: string, dto: SaveMarksDto) { const assessment = await this.prisma.assessment.findUnique({ where: { id: assessmentId } }); if (!assessment) throw new NotFoundException('Assessment not found'); if (dto.marks.some(m => m.obtainedMarks > m.maximumMarks)) throw new BadRequestException('Obtained marks cannot exceed maximum marks'); await this.prisma.$transaction(dto.marks.map(m => this.prisma.studentAssessmentMark.upsert({ where: { assessmentId_studentId_subjectId: { assessmentId, studentId: m.studentId, subjectId: m.subjectId } }, update: { maximumMarks: m.maximumMarks, obtainedMarks: m.obtainedMarks }, create: { assessmentId, studentId: m.studentId, subjectId: m.subjectId, maximumMarks: m.maximumMarks, obtainedMarks: m.obtainedMarks } }))); return { saved: dto.marks.length }; }
 async history(studentId: string) { const marks = await this.prisma.studentAssessmentMark.findMany({ where: { studentId }, include: { assessment: true, subject: true }, orderBy: { assessment: { heldOn: 'desc' } } }); return marks.map(m => ({ ...m, percentage: Number(m.obtainedMarks) * 100 / Number(m.maximumMarks) })); }
}
