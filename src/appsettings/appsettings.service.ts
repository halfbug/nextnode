import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { CreateAppsettingInput } from './dto/create-appsetting.input';
import { Appsetting } from './entities/appsetting.model';
import { v4 as uuid } from 'uuid';

@Injectable()
export class AppsettingsService {
  constructor(
    @InjectRepository(Appsetting) private appRepository: Repository<Appsetting>,
  ) {}

  create(createAppsettingInput: CreateAppsettingInput) {
    const id = uuid();
    const appsetting = this.appRepository.create({
      id,
      ...createAppsettingInput,
    });
    return this.appRepository.save(appsetting);
  }

  findAll() {
    return this.appRepository.find();
  }

  // findOne(id: string) {
  //   return `This action returns a #${id} appsetting`;
  // }

  // update(id: string, updateAppsettingInput: UpdateAppsettingInput) {
  //   return `This action updates a #${id} appsetting`;
  // }

  // remove(id: string) {
  //   return `This action removes a #${id} appsetting`;
  // }
}
