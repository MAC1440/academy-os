import {
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { AuditAction, Prisma } from '@prisma/client';
import { AuditService } from '../audit/audit.service';
import { PrismaService } from '../../prisma/prisma.service';
@Injectable()
export class FinanceService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly audit: AuditService,
  ) {}
  async summary(studentId: string, actor: string) {
    const student = await this.prisma.student.findUnique({
      where: { id: studentId },
      include: { payments: true },
    });
    if (!student) throw new NotFoundException('Student not found');
    await this.ensureBranchAccess(actor, student.branchId);
    const paid = student.payments.reduce(
      (sum, p) => sum + Number(p.amount),
      Number(student.amountReceivedWithForm ?? 0),
    );
    return {
      studentId,
      monthlyFeeAmount: student.monthlyFeeAmount,
      openingBalanceAmount: student.openingBalanceAmount,
      paid,
      balance: Number(student.openingBalanceAmount ?? 0) - paid,
      payments: student.payments,
    };
  }
  async createPayment(
    studentId: string,
    dto: {
      amount: number;
      receiptNumber: string;
      receivedOn: string;
      remarks?: string;
    },
    actor: string,
  ) {
    const student = await this.prisma.student.findUnique({
      where: { id: studentId },
    });
    if (!student) throw new NotFoundException('Student not found');
    await this.ensureBranchAccess(actor, student.branchId);
    const payment = await this.prisma.studentPayment.create({
      data: {
        studentId,
        amount: dto.amount,
        receiptNumber: dto.receiptNumber,
        receivedOn: new Date(dto.receivedOn),
        remarks: dto.remarks,
        receivedByUserId: actor,
      },
    });
    const org = await this.prisma.organization.findFirstOrThrow();
    await this.audit.record({
      organizationId: org.id,
      actorUserId: actor,
      action: AuditAction.CREATE,
      entityType: 'StudentPayment',
      entityId: payment.id,
      changes: {
        studentId,
        amount: dto.amount,
        receiptNumber: dto.receiptNumber,
      },
    });
    return payment;
  }
  async updatePayment(
    studentId: string,
    paymentId: string,
    dto: {
      amount?: number;
      receiptNumber?: string;
      receivedOn?: string;
      remarks?: string;
    },
    actor: string,
  ) {
    const payment = await this.paymentForStudent(studentId, paymentId, actor);
    const updated = await this.prisma.studentPayment.update({
      where: { id: payment.id },
      data: {
        ...(dto.amount !== undefined ? { amount: dto.amount } : {}),
        ...(dto.receiptNumber !== undefined
          ? { receiptNumber: dto.receiptNumber.trim() }
          : {}),
        ...(dto.receivedOn !== undefined
          ? { receivedOn: new Date(dto.receivedOn) }
          : {}),
        ...(dto.remarks !== undefined
          ? { remarks: dto.remarks.trim() || null }
          : {}),
      },
    });
    await this.recordAudit(actor, AuditAction.UPDATE, updated.id, {
      studentId,
      ...dto,
    });
    return updated;
  }
  async deletePayment(studentId: string, paymentId: string, actor: string) {
    const payment = await this.paymentForStudent(studentId, paymentId, actor);
    await this.prisma.studentPayment.delete({ where: { id: payment.id } });
    await this.recordAudit(actor, AuditAction.DELETE, payment.id, {
      studentId,
    });
    return { id: payment.id };
  }
  private async paymentForStudent(
    studentId: string,
    paymentId: string,
    actor: string,
  ) {
    const payment = await this.prisma.studentPayment.findFirst({
      where: { id: paymentId, studentId },
      include: { student: true },
    });
    if (!payment) throw new NotFoundException('Payment not found');
    await this.ensureBranchAccess(actor, payment.student.branchId);
    return payment;
  }
  private async recordAudit(
    actor: string,
    action: AuditAction,
    entityId: string,
    changes: Record<string, unknown>,
  ) {
    const org = await this.prisma.organization.findFirstOrThrow();
    await this.audit.record({
      organizationId: org.id,
      actorUserId: actor,
      action,
      entityType: 'StudentPayment',
      entityId,
      changes: changes as Prisma.InputJsonValue,
    });
  }
  private async ensureBranchAccess(actor: string, branchId: string) {
    const access = await this.prisma.roleAssignment.findFirst({
      where: { userId: actor, OR: [{ branchId: null }, { branchId }] },
    });
    if (!access)
      throw new ForbiddenException('You do not have access to this branch');
  }
}
