import { HttpException, HttpStatus, Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { CreateAdminUserInput } from './dto/create-admin-user.input';
import { UpdateAdminUserInput } from './dto/update-admin-user.input';
import AdminUser from './entities/admin-user.model';
import { v4 as uuid } from 'uuid';
import { validate, validateOrReject, isEmail } from 'class-validator';
import * as bcrypt from 'bcrypt';

@Injectable()
export class AdminUsersService {
  constructor(
    @InjectRepository(AdminUser)
    private adminUserRepository: Repository<AdminUser>,
  ) {}

  async create(createAdminUserInput: CreateAdminUserInput) {
    console.log(
      '🚀 ~ file: admin-users.service.ts:18 ~ AdminUsersService ~ create ~ createAdminUserInput',
      createAdminUserInput,
    );
    try {
      const valid = await validateOrReject(createAdminUserInput);
      console.log(isEmail(createAdminUserInput.email));
      console.log(
        '🚀 ~ file: admin-users.service.ts:20 ~ AdminUsersService ~ create ~ valid',
        valid,
      );
      const id = uuid();
      const adminUser = this.adminUserRepository.create({
        id,
        ...createAdminUserInput,
      });
      return this.adminUserRepository.save(adminUser);
    } catch (errors) {
      console.log(
        'Caught promise rejection (validation failed). Errors: ',
        errors,
      );
      return errors;
    }
  }

  findAll() {
    return this.adminUserRepository.find();
  }

  findOne(fieldname: string, value: any) {
    return this.adminUserRepository.findOne({
      where: {
        [fieldname]: value,
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

  async verify(user: { email: string; password: string }) {
    console.log(
      '🚀 ~ file: admin-users.service.ts:65 ~ AdminUsersService ~ verify ~ user',
      user,
    );
    // find user by email
    const realUser = await this.findOne('email', user.email);
    console.log(
      '🚀 ~ file: admin-users.service.ts:66 ~ AdminUsersService ~ verify ~ realUser',
      realUser,
    );
    if (!realUser) {
      // Check if user exists
      // User not found
      return false;
    }
    // check if password is correct
    const passworMatch = await bcrypt.compare(user.password, realUser.password);
    console.log(
      '🚀 ~ file: admin-users.service.ts:83 ~ AdminUsersService ~ verify ~ passworMatch',
      passworMatch,
    );

    if (!passworMatch) {
      // Invalid credentials
      return false;
    }
    // return the user
    return realUser;
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
