import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  Post,
  Query,
  UseGuards,
} from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { JwtAuthGuard } from '../../auth/guards/jwt-auth.guard';
import { successResponse } from '../../../common/api-response';
import { BranchListQueryDto } from '../dto/branch-list-query.dto';
import { CreateBranchDto } from '../dto/create-branch.dto';
import { UpdateBranchDto } from '../dto/update-branch.dto';
import { BranchService } from '../services/branch.service';

@ApiTags('Branches')
@ApiBearerAuth('JWT-auth')
@Controller('branches')
@UseGuards(JwtAuthGuard)
export class BranchController {
  constructor(private readonly branchService: BranchService) {}

  @Post()
  async create(@Body() dto: CreateBranchDto) {
    const branch = await this.branchService.create(dto);
    return successResponse('Branch created', branch);
  }

  @Get()
  async findAll(@Query() query: BranchListQueryDto) {
    const result = await this.branchService.findAll(query);
    return successResponse('Branches retrieved', result.items, result.meta);
  }

  @Get(':id')
  async findOne(@Param('id') id: string) {
    const branch = await this.branchService.findOne(id);
    return successResponse('Branch retrieved', branch);
  }

  @Patch(':id')
  async update(@Param('id') id: string, @Body() dto: UpdateBranchDto) {
    const branch = await this.branchService.update(id, dto);
    return successResponse('Branch updated', branch);
  }

  @Delete(':id')
  async remove(@Param('id') id: string) {
    const result = await this.branchService.remove(id);
    return successResponse('Branch deleted', result);
  }
}
