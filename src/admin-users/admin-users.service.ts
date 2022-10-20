import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { CreateAdminUserInput } from './dto/create-admin-user.input';
import { UpdateAdminUserInput } from './dto/update-admin-user.input';
import AdminUser from './entities/admin-user.model';
import { v4 as uuid } from 'uuid';

@Injectable()
export class AdminUsersService {
  constructor(
    @InjectRepository(AdminUser)
    private adminUserRepository: Repository<AdminUser>,
  ) {}

  create(createAdminUserInput: CreateAdminUserInput) {
    const id = uuid();
    const adminUser = this.adminUserRepository.create({
      id,
      ...createAdminUserInput,
    });
    return this.adminUserRepository.save(adminUser);
  }

  findAll() {
    return this.adminUserRepository.find();
  }

  findOne(id: string) {
    return this.adminUserRepository.findOne({
      where: {
        id,
      },
    });
  }

  findOneByUserName(username: string) {
    return this.adminUserRepository.findOne({
      where: {
        username,
      },
    });
  }

  async update(id: string, updateAdminUserInput: UpdateAdminUserInput) {
    await this.adminUserRepository.update({ id }, updateAdminUserInput);
    const adminUser = await this.adminUserRepository.findOne({
      where: {
        id,
      },
    });
    return adminUser;
  }

  remove(id: string) {
    return this.adminUserRepository.delete({ id });
  }
}
