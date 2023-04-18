import { Injectable } from '@nestjs/common';
import { Repository, getMongoManager } from 'typeorm';
import { v4 as uuid } from 'uuid';
import { InjectRepository } from '@nestjs/typeorm';
import {
  CreateAdminActivityLogInput,
  fieldDetails,
} from './dto/create-admin-activity-log.input';
import { UpdateAdminActivityLogInput } from './dto/update-admin-activity-log.input';
import AdminActivityLogs from './entities/admin-activity-log.model';
import { validateOrReject } from 'class-validator';

@Injectable()
export class AdminActivityLogsService {
  constructor(
    @InjectRepository(AdminActivityLogs)
    private adminActivityLogsRepository: Repository<AdminActivityLogs>,
  ) {}
  async create(createAdminActivityLogInput: CreateAdminActivityLogInput) {
    console.log(
      '🚀 ~ file: admin-activity-logs.service.ts:18 ~ AdminActivityLogsService ~ create ~ createAdminActivityLogInput',
      createAdminActivityLogInput,
    );
    try {
      const valid = await validateOrReject(createAdminActivityLogInput);
      console.log(
        '🚀 ~ file: admin-activity-logs.service.ts:20 ~ AdminActivityLogsService ~ create ~ valid',
        valid,
      );

      const adminActivity = this.adminActivityLogsRepository.create(
        createAdminActivityLogInput,
      );
      adminActivity.changes = [new fieldDetails()];
      adminActivity.id = uuid();
      adminActivity.changes = createAdminActivityLogInput.changes;
      return this.adminActivityLogsRepository.save(adminActivity);
    } catch (errors) {
      console.log(
        'Caught promise rejection (validation failed). Errors: ',
        errors,
      );
      return errors;
    }
  }

  findAll() {
    return this.adminActivityLogsRepository.find();
  }

  findOne(id: string) {
    return this.adminActivityLogsRepository.findOne({ id });
  }

  async update(id: string, updateAdminRoleInput: UpdateAdminActivityLogInput) {
    await this.adminActivityLogsRepository.update({ id }, updateAdminRoleInput);
    const adminUser = await this.adminActivityLogsRepository.findOne({
      where: {
        id,
      },
    });
    return adminUser;
  }

  remove(id: string) {
    return this.adminActivityLogsRepository.delete({ id });
  }
}
