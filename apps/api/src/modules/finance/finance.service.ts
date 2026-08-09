import { Injectable, NotFoundException } from '@nestjs/common';
import { AuditAction } from '@prisma/client';
import { AuditService } from '../audit/audit.service';
import { PrismaService } from '../../prisma/prisma.service';
@Injectable() export class FinanceService { constructor(private readonly prisma:PrismaService,private readonly audit:AuditService){} async createPayment(studentId:string,dto:{amount:number;receiptNumber:string;receivedOn:string;remarks?:string},actor:string){const payment=await this.prisma.studentPayment.create({data:{studentId,amount:dto.amount,receiptNumber:dto.receiptNumber,receivedOn:new Date(dto.receivedOn),remarks:dto.remarks,receivedByUserId:actor}});const org=await this.prisma.organization.findFirstOrThrow();await this.audit.record({organizationId:org.id,actorUserId:actor,action:AuditAction.CREATE,entityType:'StudentPayment',entityId:payment.id,changes:{studentId,amount:dto.amount,receiptNumber:dto.receiptNumber}});return payment;} }
