import { Inject, Injectable, Logger, forwardRef } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { getMongoManager, Repository } from 'typeorm';
import { CreateDropsCategoryInput } from './dto/create-drops-category.input';
import DropsCategory from './entities/drops-category.model';
import { CollectionType } from './entities/drops-category.entity';
import { DropsGroupshopService } from 'src/drops-groupshop/drops-groupshop.service';
import { DropsCollectionUpdatedEvent } from 'src/drops-groupshop/events/drops-collection-update.event';
import { StoresService } from 'src/stores/stores.service';
import { UpdateStoreInput } from 'src/stores/dto/update-store.input';
import { CodeUpdateStatusTypeEnum } from 'src/stores/entities/store.entity';

@Injectable()
export class DropsCategoryService {
  constructor(
    @InjectRepository(DropsCategory)
    private DropsCategoryRepository: Repository<DropsCategory>,
    @Inject(forwardRef(() => DropsGroupshopService))
    private dropsService: DropsGroupshopService,
    private dropsCollectionUpdatedEvent: DropsCollectionUpdatedEvent,
    @Inject(forwardRef(() => StoresService))
    private storesService: StoresService,
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
    collectionUpdateMsg: string,
  ) {
    if (collectionUpdateMsg !== '') {
      Logger.log(collectionUpdateMsg, 'DROPS_COLLECTION_UPDATED', true);
    }
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

  async remove(categoryId: [string], collectionUpdateMsg: string) {
    const manager = getMongoManager();
    Logger.log(collectionUpdateMsg, 'DROPS_COLLECTION_UPDATED', true);
    return await manager.deleteMany(DropsCategory, {
      categoryId: { $in: categoryId },
    });
  }

  async removeMany(id: any) {
    const manager = getMongoManager();
    return await manager.deleteMany(DropsCategory, { storeId: id });
  }

  async getNonSVCollectionIDs(storeId: string): Promise<[string]> {
    const agg = [
      {
        $match: {
          storeId,
        },
      },
      {
        $addFields: {
          ids: {
            $filter: {
              input: '$collections',
              as: 'c',
              cond: {
                $and: [
                  {
                    $ne: ['$$c.type', CollectionType.VAULT],
                  },
                  {
                    $ne: ['$$c.type', CollectionType.SPOTLIGHT],
                  },
                ],
              },
            },
          },
        },
      },
      {
        $unwind: {
          path: '$ids',
        },
      },
      {
        $group: {
          _id: '$storeId',
          ids: {
            $push: '$ids.shopifyId',
          },
        },
      },
    ];
    const manager = getMongoManager();
    const gs = await manager.aggregate(DropsCategory, agg).toArray();
    return gs[0].ids;
  }

  async getSVCollectionIDs(storeId: string): Promise<[string]> {
    const agg = [
      {
        $match: {
          storeId,
        },
      },
      {
        $addFields: {
          ids: {
            $filter: {
              input: '$collections',
              as: 'c',
              cond: {
                $or: [
                  {
                    $eq: ['$$c.type', CollectionType.VAULT],
                  },
                  {
                    $eq: ['$$c.type', CollectionType.SPOTLIGHT],
                  },
                ],
              },
            },
          },
        },
      },
      {
        $unwind: {
          path: '$ids',
        },
      },
      {
        $group: {
          _id: '$storeId',
          ids: {
            $push: '$ids.shopifyId',
          },
        },
      },
    ];
    const manager = getMongoManager();
    const gs = await manager.aggregate(DropsCategory, agg).toArray();
    return gs[0].ids;
  }

  async syncDiscountCodes(storeId: string) {
    // Bulk Discount Code Update
    const { shop, accessToken, drops } = await this.storesService.findById(
      storeId,
    );
    const ids = await this.getNonSVCollectionIDs(storeId);
    const dropsGroupshops = await this.dropsService.getActiveDrops(storeId);
    const arr = dropsGroupshops.filter(
      (dg) =>
        dg.discountCode !== null &&
        dg.discountCode.title !== null &&
        dg.discountCode.priceRuleId !== null,
    );

    this.dropsCollectionUpdatedEvent.shop = shop;
    this.dropsCollectionUpdatedEvent.accessToken = accessToken;
    this.dropsCollectionUpdatedEvent.collections = ids;
    this.dropsCollectionUpdatedEvent.dropsGroupshops = arr;
    this.dropsCollectionUpdatedEvent.storeId = storeId;
    this.dropsCollectionUpdatedEvent.drops = drops ?? {};

    if (arr.length) {
      this.dropsCollectionUpdatedEvent.emit();
      const updateStoreInput = new UpdateStoreInput();
      updateStoreInput.drops = {
        ...drops,
        codeUpdateStatus: CodeUpdateStatusTypeEnum.inprogress,
      };
      await this.storesService.updateStore(storeId, updateStoreInput);
      return {
        codeUpdateStatus: CodeUpdateStatusTypeEnum.inprogress,
      };
    }
    return {
      codeUpdateStatus: CodeUpdateStatusTypeEnum.none,
    };
  }
}