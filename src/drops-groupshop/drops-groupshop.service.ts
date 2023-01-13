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
    console.log(
      '🚀 ~ file: drops-groupshop.service ~ line 19 ~ groupshop.service ~ create ~ createDropsGroupshopInput',
      createDropsGroupshopInput,
    );
    const id = uuid();
    const drops = this.DropsGroupshopRepository.create({
      id,
      ...createDropsGroupshopInput,
    });
    const newGSP = await this.DropsGroupshopRepository.save(drops);
    console.log('dropsdrops ', newGSP);
  }

  findAll() {
    return this.DropsGroupshopRepository.find();
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
