import { ArrayUnique, IsArray, IsString } from 'class-validator';

export class UpdateMemberBranchesDto {
  @IsArray()
  @ArrayUnique()
  @IsString({ each: true })
  branchIds!: string[];
}
