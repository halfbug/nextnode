import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { getMongoManager, Repository } from 'typeorm';
import { CreateDropsCategoryInput } from './dto/create-drops-category.input';
import DropsCategory from './entities/drops-category.model';

@Injectable()
export class DropsCategoryService {
  constructor(
    @InjectRepository(DropsCategory)
    private DropsCategoryRepository: Repository<DropsCategory>,
  ) {}
  create(createDropsCategoryInput: CreateDropsCategoryInput) {
    return 'This action adds a new dropsCategory';
  }

  findAll() {
    return `This action returns all dropsCategory`;
  }

  findOne(id: number) {
    return `This action returns a #${id} dropsCategory`;
  }

  async findByStoreId(storeId: string) {
    return await this.DropsCategoryRepository.find({
      where: { storeId: storeId },
    });
  }

  async update(
    id: string,
    updateDropsCategoryInput: CreateDropsCategoryInput[],
  ) {
    const blukWrite = updateDropsCategoryInput.map((item) => {
      return {
        updateOne: {
          filter: { categoryId: item.categoryId },
          update: {
            $setOnInsert: { createdAt: new Date() },
            $set: { ...item, updatedAt: new Date() },
          },
          upsert: true,
        },
      };
    });
    const manager = getMongoManager();
    await manager.bulkWrite(DropsCategory, blukWrite);
    const temp = await this.findByStoreId(id);
    return temp;
  }

  async remove(categoryId: [string]) {
    const manager = getMongoManager();
    return await manager.deleteMany(DropsCategory, {
      categoryId: { $in: categoryId },
    });
  }

  async removeMany(id: any) {
    const manager = getMongoManager();
    return await manager.deleteMany(DropsCategory, { storeId: id });
  }
}
