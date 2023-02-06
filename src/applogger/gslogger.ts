import { Injectable } from '@nestjs/common';
import { ConsoleLogger } from '@nestjs/common';
import { CreateAppLoggerInput } from './dto/create-applogger.input';
import { LogEventTypeEnum } from './entities/applogger.entity';
import { AppLoggerService } from './applogger.service';

@Injectable()
export class Gslogger extends ConsoleLogger {
  constructor(private readonly apploggerService: AppLoggerService) {
    super();
  }
  log(message: any, context?: string, save2db?: boolean): void {
    super.log(message, context);
    if (save2db) {
      const elog = new CreateAppLoggerInput();
      elog.context = context.toUpperCase();
      elog.message = message;
      elog.level = 'log';
      this.apploggerService.create(elog);
    }
    // console.log({ message });
  }
  error(exception: any, stack?: string, context?: string) {
    super.error(exception.message, context);
    const elog = new CreateAppLoggerInput();
    elog.stack = stack.length < 30 ? exception.stack : stack;
    elog.context = context ? context.toUpperCase() : stack.toUpperCase();
    elog.message = exception.message ?? exception;
    elog.level = 'error';
    this.apploggerService.create(elog);
  }
  warn(message: any, context?: string) {
    super.warn(message, context);
    const elog = new CreateAppLoggerInput();
    elog.context = context?.toUpperCase();
    elog.message = message;
    elog.level = 'warn';
    this.apploggerService.create(elog);
  }
  debug(message: any, context?: string) {
    super.debug(message, context);
  }
}
