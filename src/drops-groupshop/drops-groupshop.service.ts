import { Injectable } from '@nestjs/common';
import { CreateDropsGroupshopInput } from './dto/create-drops-groupshop.input';
import { UpdateDropsGroupshopInput } from './dto/update-drops-groupshop.input';
import { v4 as uuid } from 'uuid';
import DropsGroupshop from './entities/dropsgroupshop.model';
import { Repository } from 'typeorm';
import { InjectRepository } from '@nestjs/typeorm';

@Injectable()
export class DropsGroupshopService {
  constructor(
    @InjectRepository(DropsGroupshop)
    private DropsGroupshopRepository: Repository<DropsGroupshop>,
  ) {}

  async create(createDropsGroupshopInput: CreateDropsGroupshopInput) {
    const id = uuid();
    const dropsGroupshop = await this.DropsGroupshopRepository.create({
      id,
      ...createDropsGroupshopInput,
    });
    await this.DropsGroupshopRepository.save(dropsGroupshop);
    return dropsGroupshop;
  }

  findAll() {
    return `This action returns all dropsGroupshop`;
  }

  findOne(id: number) {
    return `This action returns a #${id} dropsGroupshop`;
  }

  update(id: number, updateDropsGroupshopInput: UpdateDropsGroupshopInput) {
    return `This action updates a #${id} dropsGroupshop`;
  }

  remove(id: number) {
    return `This action removes a #${id} dropsGroupshop`;
  }
}
