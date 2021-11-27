import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { getMongoManager, Like, Repository } from 'typeorm';
import { CreateStoreInput } from './dto/create-store.input';
import { UpdateStoreInput } from './dto/update-store.input';
import Store from './entities/store.model';
import { v4 as uuid } from 'uuid';

@Injectable()
export class StoresService {
  constructor(
    @InjectRepository(Store) private storeRepository: Repository<Store>,
  ) {}
  create(createStoreInput: CreateStoreInput): Promise<Store> {
    const id = uuid();
    const store = this.storeRepository.create({ id, ...createStoreInput });
    // const store = this.storeRepository.create(createStoreInput);
    //
    return this.storeRepository.save(store);
  }

  findAll() {
    return this.storeRepository.find();
  }

  findOne(shop: string) {
    return this.storeRepository.findOne({ shop });
  }

  async findOneByName(shop: string) {
    return await this.storeRepository.findOne({
      where: {
        shop: { $regex: `^${shop}*` },
      },
    });
  }

  async findOneById(id: string) {
    return await this.storeRepository.findOne({
      where: {
        id: id,
      },
    });
  }

  async update(id: string, updateStoreInput: UpdateStoreInput) {
    console.log(
      '🚀 ~ file: stores.service.ts ~ line 46 ~ StoresService ~ update ~ updateStoreInput',
      updateStoreInput,
    );
    console.log(
      '🚀 ~ file: stores.service.ts ~ line 46 ~ StoresService ~ update ~ id',
      id,
    );

    await this.storeRepository.update({ id }, updateStoreInput);
    return await this.findOneById(id);
  }

  remove(id: number) {
    return `This action removes a #${id} store`;
  }

  isExist(shop: string) {
    return this.storeRepository.findOne({ shop });
  }
}
