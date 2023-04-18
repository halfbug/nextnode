import { Module } from '@nestjs/common';
import { AdminActivityLogsService } from './admin-activity-logs.service';
import { AdminActivityLogsResolver } from './admin-activity-logs.resolver';
import { TypeOrmModule } from '@nestjs/typeorm';
import AdminActivityLogs from './entities/admin-activity-log.model';
import { DefaultColumnsService } from 'src/utils/default-columns/default-columns.service';

@Module({
  imports: [
    TypeOrmModule.forFeature([AdminActivityLogs]),
    DefaultColumnsService,
  ],
  providers: [AdminActivityLogsResolver, AdminActivityLogsService],
  exports: [AdminActivityLogsService],
})
export class AdminActivityLogsModule {}
