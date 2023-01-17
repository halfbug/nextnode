import { Injectable } from '@nestjs/common';
import { CreateDropsGroupshopInput } from './dto/create-drops-groupshop.input';
import { UpdateDropsGroupshopInput } from './dto/update-drops-groupshop.input';
import { v4 as uuid } from 'uuid';
import DropsGroupshop from './entities/dropsgroupshop.model';
import { getMongoManager, Repository } from 'typeorm';
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
    const dropsGroupshop = await this.DropsGroupshopRepository.create({
      id,
      ...createDropsGroupshopInput,
    });
    await this.DropsGroupshopRepository.save(dropsGroupshop);
  }

  findAll() {
    return this.DropsGroupshopRepository.find();
  }

  async findDropGroupshopByCode(discountCode: string) {
    const agg = [
      {
        $match: {
          'discountCode.title': discountCode,
        },
      },
      {
        $lookup: {
          from: 'store',
          localField: 'storeId',
          foreignField: 'id',
          as: 'store',
        },
      },
      {
        $unwind: {
          path: '$store',
        },
      },
      {
        $lookup: {
          from: 'inventory',
          localField: 'store.drops.bestSellerCollectionId',
          foreignField: 'id',
          as: 'bestSeller',
        },
      },
      {
        $addFields: {
          bestSeller: {
            $filter: {
              input: '$bestSeller',
              as: 'j',
              cond: {
                $and: [
                  {
                    $ne: ['$$j.publishedAt', null],
                  },
                  {
                    $eq: ['$$j.status', 'ACTIVE'],
                  },
                ],
              },
            },
          },
        },
      },
      {
        $lookup: {
          from: 'inventory',
          localField: 'bestSeller.parentId',
          foreignField: 'id',
          as: 'bestSellerProducts',
        },
      },
      {
        $lookup: {
          from: 'inventory',
          localField: 'store.drops.spotlightColletionId',
          foreignField: 'id',
          as: 'spotlight',
        },
      },
      {
        $lookup: {
          from: 'inventory',
          localField: 'spotlight.parentId',
          foreignField: 'id',
          as: 'spotlightProducts',
        },
      },
      {
        $addFields: {
          spotlightProducts: {
            $filter: {
              input: '$spotlightProducts',
              as: 'j',
              cond: {
                $and: [
                  {
                    $ne: ['$$j.publishedAt', null],
                  },
                  {
                    $eq: ['$$j.status', 'ACTIVE'],
                  },
                ],
              },
            },
          },
        },
      },
      {
        $lookup: {
          from: 'inventory',
          localField: 'store.drops.latestCollectionId',
          foreignField: 'id',
          as: 'latestCollection',
        },
      },
      {
        $lookup: {
          from: 'inventory',
          localField: 'latestCollection.parentId',
          foreignField: 'id',
          as: 'latestProducts',
        },
      },
      {
        $addFields: {
          latestProducts: {
            $filter: {
              input: '$latestProducts',
              as: 'j',
              cond: {
                $and: [
                  {
                    $ne: ['$$j.publishedAt', null],
                  },
                  {
                    $eq: ['$$j.status', 'ACTIVE'],
                  },
                ],
              },
            },
          },
        },
      },
      {
        $lookup: {
          from: 'inventory',
          localField: 'store.drops.allProductsCollectionId',
          foreignField: 'id',
          as: 'allProducts',
        },
      },
      {
        $lookup: {
          from: 'inventory',
          localField: 'allProducts.parentId',
          foreignField: 'id',
          as: 'allProducts',
        },
      },
      {
        $addFields: {
          allProducts: {
            $filter: {
              input: '$allProducts',
              as: 'j',
              cond: {
                $and: [
                  {
                    $ne: ['$$j.publishedAt', null],
                  },
                  {
                    $eq: ['$$j.status', 'ACTIVE'],
                  },
                ],
              },
            },
          },
        },
      },
      {
        $addFields: {
          members: {
            $map: {
              input: '$members',
              as: 'me',
              in: {
                $mergeObjects: [
                  '$$me',
                  {
                    products: {
                      $map: {
                        input: '$$me.lineItems',
                        in: {
                          $arrayElemAt: [
                            {
                              $filter: {
                                input: {
                                  $concatArrays: [
                                    {
                                      $ifNull: ['$popularProducts', []],
                                    },
                                    {
                                      $ifNull: ['$allProducts', []],
                                    },
                                  ],
                                },
                                as: 'j',
                                cond: {
                                  $eq: ['$$this.product.id', '$$j.id'],
                                },
                              },
                            },
                            0,
                          ],
                        },
                      },
                    },
                  },
                ],
              },
            },
          },
        },
      },
      {
        $lookup: {
          from: 'orders',
          localField: 'members.orderId',
          foreignField: 'id',
          as: 'orders',
        },
      },
      {
        $addFields: {
          members: {
            $map: {
              input: '$members',
              as: 'me',
              in: {
                $mergeObjects: [
                  '$$me',
                  {
                    orderDetail: {
                      $arrayElemAt: [
                        {
                          $filter: {
                            input: '$orders',
                            as: 'j',
                            cond: {
                              $eq: ['$$me.orderId', '$$j.id'],
                            },
                          },
                        },
                        0,
                      ],
                    },
                  },
                ],
              },
            },
          },
        },
      },
      {
        $project: {
          bestSellerProducts: 1,
          spotlightProducts: 1,
          allProducts: 1,
          latestProducts: 1,
          createdAt: 1,
          customerDetail: 1,
          storeId: 1,
          totalProducts: 1,
          shortUrl: 1,
          url: 1,
          expiredUrl: 1,
          expiredShortLink: 1,
          expiredAt: 1,
          dealProducts: 1,
          discountCode: 1,
          members: 1,
          milestones: 1,
          id: 1,
          updatedAt: 1,
          store: 1,
          popularProducts: 1,
          campaign: 1,
          partnerRewards: 1,
          partnerDetails: 1,
          memberDetails: 1,
          refferalProducts: 1,
          ownerProducts: 1,
          isActive: 1,
          partnerCommission: 1,
        },
      },
    ];
    const manager = getMongoManager();
    const gs = await manager.aggregate(DropsGroupshop, agg).toArray();
    return gs[0];
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
