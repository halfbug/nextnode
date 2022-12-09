import { Module } from '@nestjs/common';
import { AppLoggerService } from './applogger.service';
import { AppLoggerResolver } from './applogger.resolver';
import { AppLogger } from './entities/applogger.entity';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Gslogger } from './gslogger';

@Module({
  imports: [TypeOrmModule.forFeature([AppLogger])],
  providers: [AppLoggerResolver, AppLoggerService, Gslogger],
  exports: [Gslogger],
})
export class AppLoggerModule {}
