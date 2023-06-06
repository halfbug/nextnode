import { forwardRef, Inject, Injectable, Logger } from '@nestjs/common';
import { CreateDropsGroupshopInput } from './dto/create-drops-groupshop.input';
import { UpdateDropsGroupshopInput } from './dto/update-drops-groupshop.input';
import { v4 as uuid } from 'uuid';
import DropsGroupshop from './entities/dropsgroupshop.model';
import { getMongoManager, Repository } from 'typeorm';
import { InjectRepository } from '@nestjs/typeorm';
import { StoresService } from 'src/stores/stores.service';
import { EventType } from 'src/gs-common/entities/lifecycle.modal';
import { ShopifyService } from 'src/shopify-store/shopify/shopify.service';
import { FilterOption } from './dto/paginationArgs.input';
import { PaginationService } from 'src/utils/pagination.service';
import { InventoryService } from 'src/inventory/inventory.service';
import { Product } from 'src/inventory/entities/product.entity';
import { OrderLineItems } from 'src/inventory/entities/orders.entity';
import DropsCategory from 'src/drops-category/entities/drops-category.model';
import { DropsCategoryService } from 'src/drops-category/drops-category.service';

@Injectable()
export class DropsGroupshopService {
  constructor(
    @InjectRepository(DropsGroupshop)
    @InjectRepository(DropsCategory)
    private DropsGroupshopRepository: Repository<DropsGroupshop>,
    @Inject(forwardRef(() => StoresService))
    private storesService: StoresService,
    private shopifyService: ShopifyService,
    private paginateService: PaginationService,
    @Inject(forwardRef(() => InventoryService))
    private inventoryService: InventoryService,
    @Inject(forwardRef(() => DropsCategoryService))
    private dropsCategoryService: DropsCategoryService,
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

  async getdrops({ pagination, filters, sorting }) {
    try {
      const { skip, take } = pagination;

      let criteria = {};
      let agg: any[] = [
        {
          $skip: skip,
        },
        {
          $limit: take,
        },
      ];
      const dateField = {
        $addFields: {
          strDate: {
            $dateToString: {
              format: '%m/%d/%Y',
              date: '$createdAt',
            },
          },
        },
      };

      if (sorting.length) {
        agg = [
          {
            $sort: {
              [sorting[0].field]: sorting[0].sort === 'asc' ? 1 : -1,
            },
          },
          ...agg,
        ];
      }
      if (filters.length) {
        if (filters[0].columnField === 'createdAt') {
          filters[0].columnField = 'strDate';
        }
        switch (filters[0].operatorValue) {
          case FilterOption.CONTAINS:
            criteria = {
              $regex: `(?i)${filters[0].value}`,
            };
            break;
          case FilterOption.STARTS_WITH:
            criteria = {
              $regex: `^(?i)${filters[0].value}`,
            };
            break;
          case FilterOption.ENDS_WITH:
            criteria = {
              $regex: `${filters[0].value}$`,
            };
            break;
          case FilterOption.EQUALS:
            criteria = {
              $regex: `^${filters[0].value}$`,
            };
            break;
          case FilterOption.IS_EMPTY:
            criteria = {
              $eq: '',
            };
            break;
          case FilterOption.IS_NOT_EMPTY:
            criteria = {
              $ne: '',
            };
            break;
          case FilterOption.IS_ANY_OF:
            criteria = { $in: filters[0].value };
            break;
          default:
            break;
        }
        agg = [
          dateField,
          {
            $match: {
              [filters[0].columnField]: criteria,
            },
          },
          ...agg,
        ];
      }

      agg = [
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
        ...agg,
      ];

      const manager = getMongoManager();
      const gs = await manager.aggregate(DropsGroupshop, agg).toArray();
      console.log(
        '🚀 ~ file: drops-groupshop.service.ts:221 ~ DropsGroupshopService ~ getdrops ~ agg:',
        JSON.stringify(agg),
      );
      const result = gs;
      agg.pop();
      agg.pop();
      agg.push({
        $count: 'total',
      });
      const gscount = await manager.aggregate(DropsGroupshop, agg).toArray();
      const total = gscount[0]?.total;
      return {
        result,
        pageInfo: this.paginateService.paginate(result, total, take, skip),
      };
    } catch (err) {
      console.log(
        '🚀 ~ file: drops-groupshop.service.ts:227 ~ DropsGroupshopService ~ getdrops ~ err:',
        err,
      );
      Logger.error(err, DropsCategoryService.name);
    }
  }
  async createDropDiscountCode(gs) {
    // console.log('createDropDiscountCode ', gs);
    const {
      shop,
      accessToken,
      drops: {
        rewards: { baseline },
      },
    } = await this.storesService.findById(gs.storeId);
    const discountTitle = gs?.discountCode.title;
    const collections = await this.dropsCategoryService.getNonSVCollectionIDs(
      gs.storeId,
    );
    const discountCode = await this.shopifyService.setDiscountCode(
      shop,
      'Create',
      accessToken,
      discountTitle,
      parseInt(baseline, 10),
      [...new Set(collections)],
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
        $addFields: {
          bestseller: {
            $arrayElemAt: [
              {
                $filter: {
                  input: '$store.drops.collections',
                  cond: {
                    $eq: ['$$this.name', 'bestsellers'],
                  },
                },
              },
              0,
            ],
          },
        },
      },
      {
        $lookup: {
          from: 'inventory',
          localField: 'bestseller.shopifyId',
          foreignField: 'id',
          as: 'bestseller',
        },
      },
      {
        $lookup: {
          from: 'inventory',
          localField: 'bestseller.parentId',
          foreignField: 'id',
          as: 'cartSuggested',
        },
      },
      {
        $lookup: {
          from: 'drops_category',
          localField: 'store.id',
          foreignField: 'storeId',
          as: 'categories',
        },
      },
      {
        $addFields: {
          firstCategory: {
            $filter: {
              input: '$categories',
              as: 'cat',
              cond: {
                $and: [
                  {
                    $eq: ['$$cat.parentId', null],
                  },
                  {
                    $eq: ['$$cat.status', 'active'],
                  },
                ],
              },
            },
          },
        },
      },
      {
        $addFields: {
          firstCategory: {
            $arrayElemAt: [
              '$firstCategory',
              {
                $indexOfArray: [
                  '$firstCategory.sortOrder',
                  {
                    $min: '$firstCategory.sortOrder',
                  },
                ],
              },
            ],
          },
        },
      },
      {
        $lookup: {
          from: 'inventory',
          localField: 'firstCategory.collections.shopifyId',
          foreignField: 'id',
          as: 'collections',
        },
      },
      {
        $addFields: {
          sections: {
            $map: {
              input: '$firstCategory.collections',
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
        $addFields: {
          categories: {
            $map: {
              input: '$categories',
              as: 'cat',
              in: {
                $mergeObjects: [
                  '$$cat',
                  {
                    subCategories: {
                      $filter: {
                        input: '$categories',
                        as: 'sub',
                        cond: {
                          $and: [
                            {
                              $ne: ['$$sub.status', 'draft'],
                            },
                            {
                              $eq: ['$$cat.categoryId', '$$sub.parentId'],
                            },
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
          categories: {
            $filter: {
              input: '$categories',
              as: 'cat',
              cond: {
                $and: [
                  {
                    $eq: ['$$cat.status', 'active'],
                  },
                  {
                    $eq: ['$$cat.parentId', null],
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
          cartSuggested: 1,
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
          firstCategory: 1,
          categories: 1,
        },
      },
    ];
    const manager = getMongoManager();
    const gs = await manager.aggregate(DropsGroupshop, agg).toArray();
    return gs[0];
  }

  async findProductsByCategory(categoryId: string) {
    const agg = [
      {
        $match: {
          categoryId: categoryId,
        },
      },
      {
        $lookup: {
          from: 'inventory',
          localField: 'collections.shopifyId',
          foreignField: 'id',
          as: 'result',
        },
      },
      {
        $addFields: {
          sections: {
            $map: {
              input: '$collections',
              as: 'col',
              in: {
                $mergeObjects: [
                  '$$col',
                  {
                    products: {
                      $filter: {
                        input: '$result',
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
    ];
    const manager = getMongoManager();
    const gs = await manager.aggregate(DropsCategory, agg).toArray();
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

  async getActiveDropsNonFullyExpired(storeId: string) {
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
                      $eq: ['$event', EventType.ended],
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
        $match: {
          isFullyExpired: false,
        },
      },
      {
        $project: {
          discountCode: 1,
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
          status: 'active',
        },
      },
      {
        $project: {
          discountCode: 1,
        },
      },
    ];
    const manager = getMongoManager();
    const result = await manager.aggregate(DropsGroupshop, agg).toArray();
    return result;
  }

  async getVaultSpotlightProducts(shop: string) {
    const { id } = await this.storesService.findOne(shop);
    const collections = await this.dropsCategoryService.getSVCollectionIDs(id);
    return await (
      await this.inventoryService.getProductsByCollectionIDs(shop, [
        ...new Set(collections),
      ])
    ).map((p: Product) => p.id);
  }

  async getNonVaultSpotlightLineitems(shop: string, lineitems: any) {
    const VSProductIds = await this.getVaultSpotlightProducts(shop);
    return lineitems.filter((l) => !VSProductIds.includes(l.product.id));
  }

  async getLastMilestoneDrops(storeId: string) {
    return this.DropsGroupshopRepository.find({
      where: { storeId, milestones: { $size: 3 } },
    });
  }
}
