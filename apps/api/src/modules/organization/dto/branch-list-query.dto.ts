import { IsOptional, IsString } from 'class-validator';
import { ListQueryDto } from './list-query.dto';

export class BranchListQueryDto extends ListQueryDto {
  @IsOptional()
  @IsString()
  academyId?: string;
}
