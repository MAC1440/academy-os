import { Module } from '@nestjs/common';
import { PrismaModule } from '../../prisma/prisma.module';
import { AccessModule } from '../access/access.module';
import { AuditModule } from '../audit/audit.module';
import { AuthModule } from '../auth/auth.module';
import {
  PublicWebsiteController,
  WebsiteController,
} from './website.controller';
import { WebsiteService } from './website.service';

@Module({
  imports: [PrismaModule, AuthModule, AccessModule, AuditModule],
  controllers: [PublicWebsiteController, WebsiteController],
  providers: [WebsiteService],
})
export class WebsiteModule {}
