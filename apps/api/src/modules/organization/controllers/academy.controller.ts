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
import { CreateAcademyDto } from '../dto/create-academy.dto';
import { ListQueryDto } from '../dto/list-query.dto';
import { UpdateAcademyDto } from '../dto/update-academy.dto';
import { AcademyService } from '../services/academy.service';

@ApiTags('Academies')
@ApiBearerAuth('JWT-auth')
@Controller('academies')
@UseGuards(JwtAuthGuard)
export class AcademyController {
  constructor(private readonly academyService: AcademyService) {}

  @Post()
  async create(@Body() dto: CreateAcademyDto) {
    const academy = await this.academyService.create(dto);
    return successResponse('Academy created', academy);
  }

  @Get()
  async findAll(@Query() query: ListQueryDto) {
    const result = await this.academyService.findAll(query);
    return successResponse('Academies retrieved', result.items, result.meta);
  }

  @Get(':id')
  async findOne(@Param('id') id: string) {
    const academy = await this.academyService.findOne(id);
    return successResponse('Academy retrieved', academy);
  }

  @Patch(':id')
  async update(@Param('id') id: string, @Body() dto: UpdateAcademyDto) {
    const academy = await this.academyService.update(id, dto);
    return successResponse('Academy updated', academy);
  }

  @Delete(':id')
  async remove(@Param('id') id: string) {
    const result = await this.academyService.remove(id);
    return successResponse('Academy deleted', result);
  }
}
