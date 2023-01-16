import { Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { getMongoManager, Like, Repository } from 'typeorm';
import { CreateStoreInput } from './dto/create-store.input';
import { UpdateStoreInput } from './dto/update-store.input';
import Store from './entities/store.model';
import { v4 as uuid } from 'uuid';
import { Resource } from './entities/store.entity';
import { ShopifyService } from 'src/shopify-store/shopify/shopify.service';
import { InventoryService } from 'src/inventory/inventory.service';
import { Product } from 'src/inventory/entities/product.entity';

@Injectable()
export class StoresService {
  constructor(
    @InjectRepository(Store) private storeRepository: Repository<Store>,
    private shopifyapi: ShopifyService,
    private inventoryService: InventoryService,
  ) {}

  static formatSpotlightDiscountTitle(name: string) {
    return `GSL${name}`;
  }

  create(createStoreInput: CreateStoreInput): Promise<Store> {
    const id = uuid();
    const store = this.storeRepository.create({ id, ...createStoreInput });
    return this.storeRepository.save(store);
  }

  async createORupdate(createStoreInput: UpdateStoreInput): Promise<Store> {
    const { id } = createStoreInput;
    console.log(
      '🚀 ~ file: stores.service.ts ~ line 23 ~ StoresService ~ createORupdate ~ id',
      id,
    );
    // return await this.inventoryRepository.update({ id }, updateInvenotryInput);
    // return await this.inventoryRepository.save(updateInvenotryInput);

    const sid = id ?? uuid();
    console.log(
      '🚀 ~ file: stores.service.ts ~ line 31 ~ StoresService ~ createORupdate ~ sid',
      sid,
    );

    const dates = sid
      ? { createdAt: new Date(), updatedAt: new Date() }
      : { updatedAt: new Date() };
    const manager = getMongoManager();
    try {
      await manager.updateOne(
        Store,
        { id },
        { $set: { id: sid, ...createStoreInput, ...dates } },
        {
          upsert: true,
        },
      );
      return this.findById(sid);
    } catch (err) {
      console.log(err);
    }
  }

  findAll() {
    return this.storeRepository.find();
  }

  findActiveAll() {
    return this.storeRepository.find({ where: { status: 'Active' } });
  }

  async findById(id: string) {
    return this.storeRepository.findOne({ id });
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
      res[0],
    );
    if (typeof res[0]?.industry === 'string') {
      return { ...res[0], industry: [res[0].industry] };
    } else {
      return { ...res[0] };
    }
  }

  async findOneByName(shop: string) {
    const result = await this.storeRepository.findOne({
      where: {
        shop: { $regex: `^${shop}*` },
      },
    });
    console.log(JSON.stringify(result));
    if (typeof result.industry === 'string') {
      return { ...result, industry: [result.industry] };
    } else {
      return result;
    }
  }

  async findOneById(id: string) {
    return await this.storeRepository.findOne({
      where: {
        id: id,
      },
    });
  }

  async update(id: string, updateStoreInput: UpdateStoreInput) {
    if (updateStoreInput?.settings?.layout?.bannerDesign) {
      const bannerDesi = updateStoreInput?.settings?.layout?.bannerDesign;
      if (bannerDesi === '002') {
        updateStoreInput.settings.layout.bannerColor = '#F2F2F1';
      } else if (bannerDesi === '003') {
        updateStoreInput.settings.layout.bannerColor = '#000000';
      } else if (bannerDesi === '004') {
        updateStoreInput.settings.layout.bannerColor = '#FFFFFF';
      } else if (bannerDesi === '101') {
        updateStoreInput.settings.layout.bannerColor = '#FFFFFF';
      } else if (bannerDesi === '102') {
        updateStoreInput.settings.layout.bannerColor = '#171717';
      } else if (bannerDesi === '103') {
        updateStoreInput.settings.layout.bannerColor = '#D3DEDC';
      } else if (bannerDesi === '104') {
        updateStoreInput.settings.layout.bannerColor =
          updateStoreInput?.settings?.layout?.bannerCustomColor;
      } else {
        updateStoreInput.settings.layout.bannerColor = '#EEFF5C';
      }
    }
    await this.storeRepository.update({ id }, updateStoreInput);
    return await this.findOneById(id);
  }

  async updateField(criteria: any, updateLiteral: any) {
    const manager = getMongoManager();
    manager.updateOne(Store, criteria, {
      $set: { ...updateLiteral, updatedAt: new Date() },
    });
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
      Logger.error(err, StoresService.name);
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

  async findOneWithActiveCampaing(shop: string): Promise<Store> {
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

  async findOneWithActiveCampaingProducts(shop: string): Promise<Store> {
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
        $lookup: {
          from: 'inventory',
          localField: 'activeCampaign.products',
          foreignField: 'id',
          as: 'allProducts',
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

  async updateRecentGS(gs: any) {
    try {
      const manager = getMongoManager();
      await manager.updateOne(
        Store,
        { id: gs.storeId },
        { $set: { recentgs: gs.id } },
      );
    } catch (err) {
      console.log(err);
    }
  }

  async updateDiscoveryTool(storeId: any, updateDiscoveryTool: any) {
    await this.storeRepository.update(
      { id: updateDiscoveryTool.id },
      updateDiscoveryTool,
    );
    return await this.findOneById(updateDiscoveryTool.id);
  }

  async removeDiscoveryToolsInStoreName(storeId: string) {
    const stores = await this.storeRepository.find();

    const bulkwrite = stores.map((store) => {
      return {
        updateOne: {
          filter: { id: store.id },
          update: {
            $set: {
              discoveryTool: {
                status: store.discoveryTool.status,
                matchingBrandName: store.discoveryTool.matchingBrandName.filter(
                  (storematching) => storematching.id !== storeId,
                ),
              },
            },
          },
        },
      };
    });

    try {
      const manager = getMongoManager();
      return await manager.bulkWrite(Store, bulkwrite);
    } catch (error) {
      console.error(error);
    }
  }

  async findMatchingGS(storeId: string[]) {
    const agg = [
      {
        $match: {
          id: {
            $in: storeId,
          },
        },
      },
      {
        $lookup: {
          from: 'groupshops',
          localField: 'recentgs',
          foreignField: 'id',
          as: 'groupshops',
        },
      },
      {
        $unwind: {
          path: '$groupshops',
        },
      },
      {
        $lookup: {
          from: 'orders',
          localField: 'groupshops.members.orderId',
          foreignField: 'parentId',
          as: 'lineItemsDetails',
        },
      },
      {
        $addFields: {
          lineItemsDetails: {
            $filter: {
              input: '$lineItemsDetails',
              as: 'j',
              cond: {
                $and: [
                  {
                    $gte: ['$$j.price', '1.01'],
                  },
                  {
                    $not: {
                      $in: ['$$j.product.id', '$hideProducts'],
                    },
                  },
                  {
                    $ne: ['$$j.product', null],
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
          localField: 'lineItemsDetails.product.id',
          foreignField: 'id',
          as: 'popularProducts',
        },
      },
      {
        $lookup: {
          from: 'campaign',
          localField: 'groupshops.campaignId',
          foreignField: 'id',
          as: 'campaign',
        },
      },
      {
        $unwind: {
          path: '$campaign',
        },
      },
      {
        $addFields: {
          members: {
            $map: {
              input: '$groupshops.members',
              in: {
                $mergeObjects: [
                  '$$this',
                  {
                    lineItems: {
                      $filter: {
                        input: '$lineItemsDetails',
                        as: 'j',
                        cond: {
                          $eq: ['$$this.orderId', '$$j.parentId'],
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
          as: 'orderDetails',
        },
      },
      {
        $addFields: {
          members: {
            $map: {
              input: '$members',
              in: {
                $mergeObjects: [
                  '$$this',
                  {
                    orderDetail: {
                      $arrayElemAt: [
                        {
                          $filter: {
                            input: '$orderDetails',
                            as: 'j',
                            cond: {
                              $and: [
                                {
                                  $eq: ['$$this.orderId', '$$j.id'],
                                },
                                {
                                  $not: {
                                    $in: [
                                      '$$this.lineItemsDetails.product.id',
                                      '$hideProducts',
                                    ],
                                  },
                                },
                              ],
                            },
                          },
                        },
                        0,
                      ],
                    },
                  },
                  {
                    products: {
                      $map: {
                        input: '$$this.lineItems',
                        in: {
                          $arrayElemAt: [
                            {
                              $filter: {
                                input: '$popularProducts',
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
          popularProducts: {
            $map: {
              input: '$popularProducts',
              in: {
                $mergeObjects: [
                  '$$this',
                  {
                    lineItems: {
                      $filter: {
                        input: '$lineItemsDetails',
                        as: 'j',
                        cond: {
                          $eq: ['$$this.id', '$$j.product.id'],
                        },
                      },
                    },
                  },
                  {
                    orders: {
                      $filter: {
                        input: '$lineItemsDetails',
                        as: 'j',
                        cond: {
                          $eq: ['$$this.id', '$$j.product.id'],
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
          localField: 'campaign.products',
          foreignField: 'id',
          as: 'campaignProducts',
        },
      },
      {
        $addFields: {
          campaignProducts: {
            $filter: {
              input: '$campaignProducts',
              as: 'j',
              cond: {
                $and: [
                  {
                    $gte: ['$$j.price', '1.01'],
                  },
                  {
                    $not: {
                      $in: ['$$j.id', '$hideProducts'],
                    },
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
          localField: 'groupshops.dealProducts.productId',
          foreignField: 'id',
          as: 'dealsProducts',
        },
      },
      {
        $addFields: {
          dealsProducts: {
            $filter: {
              input: '$dealsProducts',
              as: 'j',
              cond: {
                $and: [
                  {
                    $gte: ['$$j.price', '1.01'],
                  },
                  {
                    $not: {
                      $in: ['$$j.id', '$hideProducts'],
                    },
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
          bestSeller: {
            $filter: {
              input: '$campaignProducts',
              as: 'j',
              cond: {
                $gte: ['$$j.purchaseCount', 1],
              },
            },
          },
        },
      },
    ];
    const manager = getMongoManager();
    const storeWithGS = await manager.aggregate(Store, agg).toArray();
    return storeWithGS;
  }

  async loadRecentGS() {
    const agg = [
      {
        $lookup: {
          from: 'groupshops',
          let: { recentgs: '$id' },
          pipeline: [
            {
              $match: {
                $expr: {
                  $and: [{ $eq: ['$storeId', '$$recentgs'] }],
                },
              },
            },
            {
              $sort: {
                createdAt: -1,
              },
            },
            {
              $limit: 1,
            },
          ],
          as: 'recentgs',
        },
      },
      {
        $unwind: {
          path: '$recentgs',
        },
      },
      {
        $addFields: {
          recentgs: '$recentgs.id',
        },
      },
    ];
    const manager = getMongoManager();
    const updateRecentGS = await manager.aggregate(Store, agg).toArray();
    for (let i = 0; i < updateRecentGS.length; i++) {
      await manager.updateOne(
        Store,
        { id: updateRecentGS[i].id },
        { $set: { recentgs: updateRecentGS[i].recentgs } },
      );
    }
    return updateRecentGS;
  }

  async createspotlightDiscount(storeId: string) {
    const {
      shop,
      accessToken,
      _id,
      drops: {
        spotlightDiscount: { percentage },
        spotlightColletionId,
      },
    } = await this.findById(storeId);
    const spotlightProducts =
      await this.inventoryService.getProductsByCollectionIDs(shop, [
        spotlightColletionId,
      ]);
    const discountCode = await this.shopifyapi.setDiscountCode(
      shop,
      'Create',
      accessToken,
      StoresService.formatSpotlightDiscountTitle(_id),
      parseInt(percentage, 10),
      spotlightProducts?.length > 100
        ? spotlightProducts.slice(0, 100).map((p: Product) => p.id)
        : spotlightProducts?.map((p: Product) => p.id) ?? [],
      new Date(),
      null,
    );
    return discountCode;
  }
}
