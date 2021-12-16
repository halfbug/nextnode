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
          let: {
            store_id: '$id',
          },
          pipeline: [
            {
              $match: {
                $expr: {
                  $eq: ['$storeId', '$$store_id'],
                },
              },
            },
            {
              $sort: {
                'campaign.createdAt': -1,
              },
            },
            {
              $limit: 10,
            },
            {
              $lookup: {
                from: 'appsetting',
                localField: 'rewards',
                foreignField: 'salestargets.id',
                as: 'salesTarget',
              },
            },
            { $unwind: '$salesTarget' },
            { $addFields: { salesTarget: '$salesTarget.salestargets' } },
            { $unwind: '$salesTarget' },
          ],
          as: 'campaigns',
        },
      },
    ];
    const res = await manager.aggregate(Store, agg).toArray();
    console.log(
      '🚀 ~ file: stores.service.ts ~ line 69 ~ StoresService ~ findOneByName ~ res',
      res,
    );
    // const salesTarget = res[0].salesTarget[0].salesTargets[0];
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

  remove(id: string) {
    return this.storeRepository.delete({ id });
  }

  async removeShop(shop: string) {
    return await this.storeRepository.delete({ shop });
  }

  isExist(shop: string) {
    return this.storeRepository.findOne({ shop });
  }
}
