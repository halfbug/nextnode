import { Injectable } from '@nestjs/common';
import { v4 as uuid } from 'uuid';
import { validateOrReject } from 'class-validator';
import { Repository } from 'typeorm';
import { InjectRepository } from '@nestjs/typeorm';
import AdminUserRole from './entities/admin-role.model';
import {
  CreateAdminRoleInput,
  PermissionInput,
} from './dto/create-admin-role.input';
import { UpdateAdminRoleInput } from './dto/update-admin-role.input';

@Injectable()
export class AdminRolesService {
  constructor(
    @InjectRepository(AdminUserRole)
    private adminUserRoleRepository: Repository<AdminUserRole>,
  ) {}
  async create(createAdminRoleInput: CreateAdminRoleInput) {
    console.log(
      '🚀 ~ file: admin-roles.service.ts:18 ~ AdminRolesService ~ create ~ createAdminRoleInput',
      createAdminRoleInput,
    );
    try {
      const valid = await validateOrReject(createAdminRoleInput);
      console.log(
        '🚀 ~ file: admin-roles.service.ts:20 ~ AdminRolesService ~ create ~ valid',
        valid,
      );

      const adminRole =
        this.adminUserRoleRepository.create(createAdminRoleInput);
      adminRole.permission = [new PermissionInput()];
      adminRole.id = uuid();
      adminRole.permission = createAdminRoleInput.permission;
      return this.adminUserRoleRepository.save(adminRole);
    } catch (errors) {
      console.log(
        'Caught promise rejection (validation failed). Errors: ',
        errors,
      );
      return errors;
    }
  }

  findAll() {
    return this.adminUserRoleRepository.find();
  }

  findOne(id: string) {
    return this.adminUserRoleRepository.findOne({ id });
  }

  findRoleByName(userRole: string) {
    return this.adminUserRoleRepository.findOne({
      where: {
        roleName: userRole,
      },
    });
  }

  async update(id: string, updateAdminRoleInput: UpdateAdminRoleInput) {
    await this.adminUserRoleRepository.update({ id }, updateAdminRoleInput);
    const adminUser = await this.adminUserRoleRepository.findOne({
      where: {
        id,
      },
    });
    return adminUser;
  }

  remove(id: string) {
    return this.adminUserRoleRepository.delete({ id });
  }
}
