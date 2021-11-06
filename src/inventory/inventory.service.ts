import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { getMongoManager, Repository } from 'typeorm';
import { CreateInventoryInput } from './dto/create-inventory.input';
import { UpdateInventoryInput } from './dto/update-inventory.input';
import Inventory from './entities/inventory.modal';

@Injectable()
export class InventoryService {
  constructor(
    @InjectRepository(Inventory)
    private inventoryRepository: Repository<Inventory>,
  ) {}

  // create(createInventoryInput: CreateInventoryInput) {
  //   const inventory = this.inventoryRepository.create(createInventoryInput);

  //   return this.inventoryRepository.save(inventory);
  // }

  findAll() {
    return `This action returns all inventory`;
  }

  findOne(id: number) {
    return `This action returns a #${id} inventory`;
  }

  // update(id: number, updateInventoryInput: UpdateInventoryInput) {
  //   return `This action updates a #${id} inventory`;
  // }

  remove(id: number) {
    return `This action removes a #${id} inventory`;
  }

  async insertMany(inventory: []) {
    const manager = getMongoManager();

    return await manager.insertMany(Inventory, inventory);
  }
}
