import { Module } from '@nestjs/common';
import { DefaultColumnsService } from './default-columns/default-columns.service';

@Module({
  providers: [DefaultColumnsService],
  exports: [DefaultColumnsService],
})
export class UtilsModule {}
