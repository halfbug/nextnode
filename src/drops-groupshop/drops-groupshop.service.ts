import { Injectable } from '@nestjs/common';
import { CreateDropsGroupshopInput } from './dto/create-drops-groupshop.input';
import { UpdateDropsGroupshopInput } from './dto/update-drops-groupshop.input';
import { v4 as uuid } from 'uuid';
import DropsGroupshop from './entities/dropsgroupshop.model';
import { getMongoManager, Repository } from 'typeorm';
import { InjectRepository } from '@nestjs/typeorm';
import { MilestoneInput } from 'src/groupshops/dto/create-groupshops.input';
import { StoresService } from 'src/stores/stores.service';

@Injectable()
export class DropsGroupshopService {
  constructor(
    @InjectRepository(DropsGroupshop)
    private DropsGroupshopRepository: Repository<DropsGroupshop>,
    private storesService: StoresService,
  ) {}

  async create(createDropsGroupshopInput: CreateDropsGroupshopInput) {
    console.log(
      '🚀 ~ file: drops-groupshop.service ~ line 19 ~ groupshop.service ~ create ~ createDropsGroupshopInput',
      createDropsGroupshopInput,
    );
    const id = uuid();

    const {
      drops: {
        rewards: { baseline },
      },
    } = await this.storesService.findById(createDropsGroupshopInput.storeId);

    const dropsGroupshop = await this.DropsGroupshopRepository.create({
      id,
      ...createDropsGroupshopInput,
    });

    const dgroupshop = await this.DropsGroupshopRepository.save(dropsGroupshop);

    dgroupshop.milestones = [{ activatedAt: new Date(), discount: baseline }];
    dgroupshop.members = [];

    this.update(id, dgroupshop);
  }

  async findDropsGS(discountCode: string) {
    const agg = [
      {
        $match: {
          'discountCode.title': discountCode,
        },
      },
    ];
    const manager = getMongoManager();
    const gs = await manager.aggregate(DropsGroupshop, agg).toArray();
    return gs[0];
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
        $lookup: {
          from: 'inventory',
          localField: 'bestSeller.parentId',
          foreignField: 'id',
          as: 'bestSellerProducts',
        },
      },
      {
        $addFields: {
          bestSellerProducts: {
            $filter: {
              input: '$bestSellerProducts',
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
      // {
      //   $lookup: {
      //     from: 'inventory',
      //     localField: 'store.drops.spotlightColletionId',
      //     foreignField: 'id',
      //     as: 'spotlight',
      //   },
      // },
      // {
      //   $lookup: {
      //     from: 'inventory',
      //     localField: 'spotlight.parentId',
      //     foreignField: 'id',
      //     as: 'spotlightProducts',
      //   },
      // },
      // {
      //   $addFields: {
      //     spotlightProducts: {
      //       $filter: {
      //         input: '$spotlightProducts',
      //         as: 'j',
      //         cond: {
      //           $and: [
      //             {
      //               $ne: ['$$j.publishedAt', null],
      //             },
      //             {
      //               $eq: ['$$j.status', 'ACTIVE'],
      //             },
      //           ],
      //         },
      //       },
      //     },
      //   },
      // },
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
                                      $ifNull: ['$latestProducts', []],
                                    },
                                    {
                                      $ifNull: ['$allProducts', []],
                                    },
                                    {
                                      $ifNull: ['$spotlightProducts', []],
                                    },
                                    {
                                      $ifNull: ['$bestSellerProducts', []],
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
          obSettings: 1,
          expiredUrl: 1,
          expiredShortUrl: 1,
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

  async updateExpireDate(
    updateGroupshopInput: UpdateDropsGroupshopInput,
    code: string,
  ) {
    const { id } = updateGroupshopInput;

    delete updateGroupshopInput.id;
    await this.DropsGroupshopRepository.update({ id }, updateGroupshopInput);
    return await this.findDropGroupshopByCode(code);
  }

  findOne(id: string) {
    return this.DropsGroupshopRepository.findOne({
      where: {
        id,
      },
    });
  }

  async update(
    id: string,
    updateDropsGroupshopInput: UpdateDropsGroupshopInput,
  ) {
    await this.DropsGroupshopRepository.update(
      { id },
      {
        ...updateDropsGroupshopInput,
      },
    );
    return await this.findOne(id);
  }

  remove(id: string) {
    return `This action removes a #${id} dropsGroupshop`;
  }

  async findExpiredDropGroupshhop() {
    const agg = [
      {
        $match: {
          $and: [
            {
              status: 'active',
            },
            {
              expiredAt: {
                $lte: new Date(),
              },
            },
          ],
        },
      },
    ];
    const manager = getMongoManager();
    const result = await manager.aggregate(DropsGroupshop, agg).toArray();
    return result;
  }

  async findOneByKlaviyoId(klaviyoId: string) {
    return await this.DropsGroupshopRepository.findOne({
      where: {
        'customerDetail.klaviyoId': klaviyoId,
      },
    });
  }

  async findByOrderId(orderId) {
    return await this.DropsGroupshopRepository.findOne({
      where: {
        'members.orderId': { $regex: `${orderId}` },
      },
    });
  }

  async getGroupshopByKlaviyoId(klaviyoId: string) {
    const agg = [
      {
        $match: {
          'customerDetail.klaviyoId': klaviyoId,
          status: 'pending',
        },
      },
    ];
    const manager = getMongoManager();
    const result = await manager.aggregate(DropsGroupshop, agg).toArray();
    return result;
  }
}
