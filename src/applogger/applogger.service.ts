import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { LessThan, MoreThan, Repository } from 'typeorm';
import { CreateAppLoggerInput } from './dto/create-applogger.input';
import { UpdateAppLoggerInput } from './dto/update-applogger.input';
import { AppLogger } from './entities/applogger.entity';
import { v4 as uuid } from 'uuid';

@Injectable()
export class AppLoggerService {
  constructor(
    @InjectRepository(AppLogger)
    private errorLogRepository: Repository<AppLogger>,
  ) {}

  async create(createAppLoggerInput: CreateAppLoggerInput) {
    const errlog = this.errorLogRepository.create(createAppLoggerInput);
    const id = uuid();
    return await this.errorLogRepository.save({ id, ...errlog });
  }

  findAll() {
    console.log(
      new Date(new Date().setDate(new Date().getDate() - 30)).toISOString(),
    );
    return this.errorLogRepository.find({
      where: {
        createdAt: {
          $gte: new Date(new Date().setDate(new Date().getDate() - 7)),
        },
      },
    });
  }

  findOne(id: string) {
    return this.errorLogRepository.findOne({ id });
  }

  update(id: string, updateAppLoggerInput: UpdateAppLoggerInput) {
    return `This action updates a #${id} applogger`;
  }

  remove(id: string) {
    return `This action removes a #${id} applogger`;
  }
}
