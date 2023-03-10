import { forwardRef, Inject, Injectable } from '@nestjs/common';
import { CreateDropsGroupshopInput } from './dto/create-drops-groupshop.input';
import { UpdateDropsGroupshopInput } from './dto/update-drops-groupshop.input';
import { v4 as uuid } from 'uuid';
import DropsGroupshop from './entities/dropsgroupshop.model';
import { getMongoManager, Repository } from 'typeorm';
import { InjectRepository } from '@nestjs/typeorm';
import { MilestoneInput } from 'src/groupshops/dto/create-groupshops.input';
import { StoresService } from 'src/stores/stores.service';
import { EventType } from 'src/gs-common/entities/lifecycle.modal';
import { ShopifyService } from 'src/shopify-store/shopify/shopify.service';
import { InventoryService } from 'src/inventory/inventory.service';
import { Product } from 'src/inventory/entities/product.entity';
import {
  SPOTLIGHT_SECTION_TITLE,
  VAULT_SECTION_TITLE,
} from 'src/utils/constant';
import { OrderLineItems } from 'src/inventory/entities/orders.entity';

@Injectable()
export class DropsGroupshopService {
  constructor(
    @InjectRepository(DropsGroupshop)
    private DropsGroupshopRepository: Repository<DropsGroupshop>,
    @Inject(forwardRef(() => StoresService))
    private storesService: StoresService,
    private shopifyService: ShopifyService,
    private inventoryService: InventoryService,
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

  async findDropsLifetimeCashback(klaviyoId: string) {
    const agg = [
      {
        $match: {
          'customerDetail.klaviyoId': klaviyoId,
        },
      },
      {
        $addFields: {
          lifetime_referral_count: {
            $subtract: [
              {
                $size: '$members',
              },
              1,
            ],
          },
          refundItems: {
            $reduce: {
              input: '$members.refund',
              initialValue: [],
              in: {
                $concatArrays: ['$$value', '$$this'],
              },
            },
          },
        },
      },
      {
        $match: {
          lifetime_referral_count: {
            $gt: 0,
          },
        },
      },
      {
        $addFields: {
          refund: {
            $sum: '$refundItems.amount',
          },
        },
      },
      {
        $group: {
          _id: null,
          lifetime_referral_count: {
            $sum: '$lifetime_referral_count',
          },
          lifetime_gs_cashback: {
            $sum: '$refund',
          },
        },
      },
    ];
    const manager = getMongoManager();
    const gs = await manager.aggregate(DropsGroupshop, agg).toArray();
    return gs;
  }

  findAll() {
    return this.DropsGroupshopRepository.find();
  }

  async createDropDiscountCode(gs) {
    // console.log('createDropDiscountCode ', gs);
    const {
      shop,
      accessToken,
      drops: {
        rewards: { baseline },
        collections,
      },
    } = await this.storesService.findById(gs.storeId);
    const discountTitle = gs?.discountCode.title;
    const discountCode = await this.shopifyService.setDiscountCode(
      shop,
      'Create',
      accessToken,
      discountTitle,
      parseInt(baseline, 10),
      [
        ...new Set(
          collections
            .filter(
              (c) =>
                c.name !== VAULT_SECTION_TITLE &&
                c.name !== SPOTLIGHT_SECTION_TITLE,
            )
            .map((c) => c.shopifyId),
        ),
      ],
      new Date(),
      null,
      null,
      true,
    );
    return discountCode;
  }

  findAllNullDiscounts() {
    return this.DropsGroupshopRepository.find({
      where: { 'discountCode.title': null },
    });
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
          localField: 'store.drops.collections.shopifyId',
          foreignField: 'id',
          as: 'collections',
        },
      },
      {
        $addFields: {
          sections: {
            $map: {
              input: '$store.drops.collections',
              as: 'col',
              in: {
                $mergeObjects: [
                  '$$col',
                  {
                    products: {
                      $filter: {
                        input: '$collections',
                        as: 'j',
                        cond: {
                          $eq: ['$$col.shopifyId', '$$j.id'],
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
          from: 'inventory',
          localField: 'sections.products.parentId',
          foreignField: 'id',
          as: 'products',
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
                                      $ifNull: ['$products', []],
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
        $addFields: {
          products: {
            $filter: {
              input: '$products',
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
          sections: {
            $map: {
              input: '$sections',
              as: 'me',
              in: {
                $mergeObjects: [
                  '$$me',
                  {
                    products: {
                      $filter: {
                        input: {
                          $map: {
                            input: '$$me.products',
                            as: 'mep',
                            in: {
                              $arrayElemAt: [
                                {
                                  $filter: {
                                    input: '$products',
                                    as: 'j',
                                    cond: {
                                      $eq: ['$$mep.parentId', '$$j.id'],
                                    },
                                  },
                                },
                                0,
                              ],
                            },
                          },
                        },
                        as: 'd',
                        cond: {
                          $ne: ['$$d', null],
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
          createdAt: 1,
          customerDetail: 1,
          storeId: 1,
          totalProducts: 1,
          shortUrl: 1,
          products: 1,
          productObj: 1,
          collections: 1,
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
          partnerRewards: 1,
          partnerDetails: 1,
          memberDetails: 1,
          refferalProducts: 1,
          isActive: 1,
          partnerCommission: 1,
          sections: 1,
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
    return await this.findDropsGS(code);
  }

  async findOne(id: string) {
    const agg = [
      {
        $match: {
          id,
        },
      },
    ];
    const manager = getMongoManager();
    const gs = await manager.aggregate(DropsGroupshop, agg).toArray();
    return gs[0];
  }

  findOneByURL(url: string) {
    return this.DropsGroupshopRepository.findOne({
      where: {
        url,
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

  async findMissingDropShortLinks() {
    const agg = [
      {
        $match: {
          $or: [
            {
              shortUrl: {
                $regex: 'https://app.groupshop.co',
              },
            },
            {
              expiredShortUrl: {
                $regex: 'https://app.groupshop.co',
              },
            },
          ],
        },
      },
      {
        $limit: 10,
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

  async getActiveDrops(storeId: string) {
    const agg = [
      {
        $match: {
          storeId,
          discountCode: {
            $ne: null,
          },
          status: {
            $ne: 'pending',
          },
        },
      },
      {
        $lookup: {
          from: 'lifecycle',
          let: {
            gid: '$id',
          },
          pipeline: [
            {
              $match: {
                $expr: {
                  $and: [
                    {
                      $eq: ['$groupshopId', '$$gid'],
                    },
                    {
                      $eq: ['$event', EventType.revised],
                    },
                  ],
                },
              },
            },
          ],
          as: 'revisedList',
        },
      },
      {
        $addFields: {
          arrayLength: {
            $size: '$revisedList',
          },
        },
      },
      {
        $addFields: {
          isFullyExpired: {
            $cond: {
              if: {
                $and: [
                  {
                    $lt: ['$expiredAt', new Date()],
                  },
                  {
                    $eq: ['$arrayLength', 1],
                  },
                ],
              },
              then: true,
              else: false,
            },
          },
        },
      },
      {
        $project: {
          discountCode: 1,
          isFullyExpired: 1,
        },
      },
    ];
    const manager = getMongoManager();
    const result = await manager.aggregate(DropsGroupshop, agg).toArray();
    return result;
  }

  async getVaultSpotlightProducts(shop: string) {
    const {
      drops: { collections },
    } = await this.storesService.findOne(shop);
    return await (
      await this.inventoryService.getProductsByCollectionIDs(shop, [
        ...collections
          .filter(
            (c) =>
              c.name === VAULT_SECTION_TITLE ||
              c.name === SPOTLIGHT_SECTION_TITLE,
          )
          .map((c) => c.shopifyId),
      ])
    ).map((p: Product) => p.id);
  }

  async getNonVaultSpotlightLineitems(shop: string, lineitems: any) {
    const VSProductIds = await this.getVaultSpotlightProducts(shop);
    return lineitems.filter((l) => !VSProductIds.includes(l.product.id));
  }
}
