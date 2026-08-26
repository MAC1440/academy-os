import { PartialType } from '@nestjs/swagger';
import { SubmitAdmissionDto } from './submit-admission.dto';

export class UpdateAdmissionDto extends PartialType(SubmitAdmissionDto) {}
