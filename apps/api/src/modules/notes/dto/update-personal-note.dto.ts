import { PartialType } from '@nestjs/swagger';
import { CreatePersonalNoteDto } from './create-personal-note.dto';

export class UpdatePersonalNoteDto extends PartialType(CreatePersonalNoteDto) {}
