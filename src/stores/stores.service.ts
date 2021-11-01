import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { CreateStoreInput } from './dto/create-store.input';
import { UpdateStoreInput } from './dto/update-store.input';
import Store from './entities/store.model';

@Injectable()
export class StoresService {
  constructor(
    @InjectRepository(Store) private storeRepository: Repository<Store>,
  ) {}
  create(createStoreInput: CreateStoreInput) {
    const store = this.storeRepository.create(createStoreInput);
    return this.storeRepository.save(store);
  }

  findAll() {
    return this.storeRepository.find();
  }

  findOne(shop: string) {
    return this.storeRepository.findOne({ shop });
  }

  update(id: number, updateStoreInput: UpdateStoreInput) {
    return `This action updates a #${id} store`;
  }

  remove(id: number) {
    return `This action removes a #${id} store`;
  }

  isExist(shop: string) {
    return this.storeRepository.findOne({ shop });
  }
}
