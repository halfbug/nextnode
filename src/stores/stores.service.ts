import { Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { getMongoManager, Like, Repository } from 'typeorm';
import { CreateStoreInput } from './dto/create-store.input';
import { UpdateStoreInput } from './dto/update-store.input';
import Store from './entities/store.model';
import { v4 as uuid } from 'uuid';
import { Resource } from './entities/store.entity';

@Injectable()
export class StoresService {
  constructor(
    @InjectRepository(Store) private storeRepository: Repository<Store>,
  ) {}
  create(createStoreInput: CreateStoreInput): Promise<Store> {
    const id = uuid();
    const store = this.storeRepository.create({ id, ...createStoreInput });
    return this.storeRepository.save(store);
  }

  findAll() {
    return this.storeRepository.find();
  }

  findActiveAll() {
    return this.storeRepository.find({ where: { status: 'Active' } });
  }

  findOne(shop: string) {
    return this.storeRepository.findOne({ shop });
  }

  async findOneWithCampaings(shop: string) {
    const manager = getMongoManager();
    const agg = [
      {
        $match: {
          shop: {
            $regex: `^${shop}*`,
          },
        },
      },
      {
        $lookup: {
          from: 'campaign',
          localField: 'id',
          foreignField: 'storeId',
          as: 'campaigns',
        },
      },
    ];
    const res = await manager.aggregate(Store, agg).toArray();
    console.log(
      '🚀 ~ file: stores.service.ts ~ line 69 ~ StoresService ~ findOneByName ~ res',
      res[0].campaigns,
    );
    return { ...res[0] };
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
    await this.storeRepository.update({ id }, updateStoreInput);
    return await this.findOneById(id);
  }

  async updateField(criteria: any, updateLiteral: any) {
    const manager = getMongoManager();
    manager.updateOne(Store, criteria, { $set: updateLiteral });
  }

  async updateResource(shop: string, resource: Resource) {
    // console.log('🚀 ~ ~ shop', shop);
    // console.log('🚀 ~ ~ resource', resource);
    try {
      const manager = getMongoManager();
      await manager.updateOne(
        Store,
        { shop },
        { $push: { resources: resource } },
      );

      return true;
    } catch (err) {
      Logger.error(err);
      return false;
    }
  }
  remove(id: string) {
    return this.storeRepository.delete({ id });
  }

  async removeShop(shop: string) {
    return await this.storeRepository.delete({ shop });
  }

  isExist(shop: string) {
    return this.storeRepository.findOne({ shop });
  }

  async findOneWithActiveCampaing(shop: string) {
    const manager = getMongoManager();
    const agg = [
      {
        $match: {
          shop: {
            $regex: shop,
          },
        },
      },
      {
        $lookup: {
          from: 'campaign',
          let: {
            store_id: '$id',
          },
          pipeline: [
            {
              $match: {
                $expr: {
                  $and: [
                    {
                      $eq: ['$storeId', '$$store_id'],
                    },
                    {
                      $eq: ['$isActive', true],
                    },
                  ],
                },
              },
            },
            {
              $sort: {
                'campaign.createdAt': -1,
              },
            },
            {
              $limit: 1,
            },
          ],
          as: 'activeCampaign',
        },
      },
      {
        $unwind: {
          path: '$activeCampaign',
        },
      },
    ];
    const res = await manager.aggregate(Store, agg).toArray();
    // console.log(
    //   '🚀 ~ file: stores.service.ts ~ line 69 ~ StoresService ~ findOneByName ~ res',
    //   res,
    // );
    // const salesTarget = res[0].salesTarget[0].salesTargets[0];
    return { ...res[0] };
  }

  async findOneWithActiveCampaignByStoreId(storeId: string) {
    const manager = getMongoManager();
    const agg = [
      {
        $match: {
          id: storeId,
        },
      },
      {
        $lookup: {
          from: 'campaign',
          let: {
            store_id: '$id',
          },
          pipeline: [
            {
              $match: {
                $expr: {
                  $and: [
                    {
                      $eq: ['$storeId', '$$store_id'],
                    },
                    {
                      $eq: ['$isActive', true],
                    },
                  ],
                },
              },
            },
            {
              $sort: {
                'campaign.createdAt': -1,
              },
            },
          ],
          as: 'activeCampaign',
        },
      },
    ];
    const res = await manager.aggregate(Store, agg).toArray();
    // console.log(
    //   '🚀 ~ file: stores.service.ts ~ line 69 ~ StoresService ~ findOneByName ~ res',
    //   res,
    // );
    // const salesTarget = res[0].salesTarget[0].salesTargets[0];
    return { ...res[0] };
  }
}
