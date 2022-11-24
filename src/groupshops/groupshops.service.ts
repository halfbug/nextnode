import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { getMongoManager, Like, Repository } from 'typeorm';
import {
  CreateGroupshopInput,
  DealProductsInput,
  MemberInput,
  MilestoneInput,
} from './dto/create-groupshops.input';
import { UpdateGroupshopInput } from './dto/update-groupshops.input';
import { Groupshops } from './entities/groupshop.modal';
import { v4 as uuid } from 'uuid';
import { AddDealProductInput } from './dto/add-deal-product.input';
import { ShopifyService } from 'src/shopify-store/shopify/shopify.service';
import Orders from 'src/inventory/entities/orders.modal';
import { DateFormats } from 'src/utils/functions';

@Injectable()
export class GroupshopsService {
  constructor(
    @InjectRepository(Groupshops)
    private groupshopRepository: Repository<Groupshops>,
    private shopifyapi: ShopifyService,
  ) {}
  async create(createGroupshopInput: CreateGroupshopInput) {
    console.log(
      'createGroupshopInput : ' + JSON.stringify(createGroupshopInput),
    );
    const groupshop = this.groupshopRepository.create(createGroupshopInput);
    groupshop.dealProducts = [new DealProductsInput()];
    groupshop.id = uuid();
    groupshop.shortUrl = createGroupshopInput.shortUrl;
    groupshop.dealProducts = createGroupshopInput.dealProducts;
    groupshop.members = [new MemberInput()];
    groupshop.members = createGroupshopInput.members;
    groupshop.milestones = [new MilestoneInput()];
    groupshop.milestones = createGroupshopInput.milestones;
    // groupshop.members.map...

    return this.groupshopRepository.save(groupshop);
  }
  async findByOrderId(orderId: string) {
    const res = await this.groupshopRepository.findOne({
      where: {
        'members.orderId': { $regex: `${orderId}` },
        // `gid://shopify/Order/${orderId}`, //{ $regex: `${orderId}` },
      },
    });

    return res;
  }
  findAll() {
    return this.groupshopRepository.find();
  }
  find(code: string) {
    return this.groupshopRepository.findOne({
      where: {
        'discountCode.title': code,
      },
    });
  }

  async findAllByDate(sdate: Date, edate: Date, shop: string) {
    const agg: any = [
      {
        $match: {
          createdAt: {
            $gte: new Date(sdate),
            $lt: new Date(edate),
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
                              ],
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
    ];

    if (shop)
      agg?.push({
        $match: {
          $or: [
            {
              'store.shop': {
                $regex: `^${shop}*`,
              },
            },
            {
              'store.brandname': {
                $regex: `^${shop}*`,
              },
            },
          ],
        },
      });
    const manager = getMongoManager();
    const gs = await manager.aggregate(Groupshops, agg).toArray();
    // console.log({ gs });
    return gs;
  }

  async getRunningGroupshop(campaignId, productId) {
    const agg = [
      {
        $match: {
          $and: [
            {
              campaignId,
            },
            {
              expiredAt: {
                $gte: new Date(),
              },
            },
          ],
        },
      },
      {
        $lookup: {
          from: 'campaign',
          localField: 'campaignId',
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
        $lookup: {
          from: 'inventory',
          localField: 'campaign.products',
          foreignField: 'id',
          as: 'campaignProducts',
        },
      },
      {
        $lookup: {
          from: 'inventory',
          localField: 'dealProducts.productId',
          foreignField: 'id',
          as: 'dealsProducts',
        },
      },
      {
        $addFields: {
          allProducts: {
            $concatArrays: [
              {
                $ifNull: ['$campaignProducts', []],
              },
              {
                $ifNull: ['$dealsProducts', []],
              },
            ],
          },
        },
      },
      {
        $match: {
          'allProducts.id': `gid://shopify/Product/${productId}`,
        },
      },
      {
        $sort: {
          'discountCode.percent': 1,
        },
      },
    ];
    const manager = getMongoManager();
    const gs = await manager.aggregate(Groupshops, agg).toArray();
    // console.log({ gs });
    return gs[0];
  }

  async getActiveGroupshop(storeId) {
    const agg = [
      {
        $match: {
          $and: [
            {
              storeId: storeId,
            },
            {
              expiredAt: {
                $gte: new Date(),
              },
            },
          ],
        },
      },
      {
        $project: {
          memberLength: {
            $size: '$members',
          },
          url: 1,
          shortUrl: 1,
        },
      },
      {
        $sort: {
          memberLength: -1,
        },
      },
      {
        $limit: 1,
      },
    ];
    const manager = getMongoManager();
    const gs = await manager.aggregate(Groupshops, agg).toArray();
    return gs[0];
  }

  async getActiveGroupshops(email: string) {
    const agg = [
      {
        $match: {
          $and: [
            {
              'customer.email': email,
            },
            {
              confirmed: true,
            },
          ],
        },
      },
      {
        $lookup: {
          from: 'groupshops',
          localField: 'id',
          foreignField: 'members.orderId',
          as: 'groupshop',
        },
      },
      {
        $lookup: {
          from: 'store',
          localField: 'shop',
          foreignField: 'shop',
          as: 'shop',
        },
      },
      {
        $unwind: '$groupshop',
      },
      {
        $addFields: {
          isExpired: {
            $cond: {
              if: { $gt: ['$groupshop.expiredAt', new Date()] },
              then: false,
              else: true,
            },
          },
        },
      },
      {
        $unwind: '$shop',
      },
      {
        $sort: {
          createdAt: -1,
        },
      },
    ];
    const manager = getMongoManager();
    const gs = await manager.aggregate(Orders, agg).toArray();
    console.log(
      '🚀 ~ file: groupshops.service.ts ~ line 305 ~ GroupshopsService ~ getActiveGroupshops ~ gs',
      gs,
    );
    return gs;
  }

  async totalGs(storeId: string) {
    const agg = [
      {
        $match: {
          storeId: storeId,
        },
      },
    ];
    const manager = getMongoManager();
    const totalGS = await manager.aggregate(Groupshops, agg).toArray();

    return totalGS;
  }

  async getCampaignUniqueClicks(campaignId: string) {
    const agg = [
      {
        $match: {
          campaignId: campaignId,
        },
      },
      {
        $lookup: {
          from: 'visitors',
          localField: 'id',
          foreignField: 'groupshopId',
          as: 'result',
        },
      },
      {
        $project: {
          uniqueClicks: {
            $size: '$result',
          },
          numOrders: {
            $cond: {
              if: {
                $gt: [
                  {
                    $size: '$members',
                  },
                  1,
                ],
              },
              then: {
                $size: '$members',
              },
              else: 0,
            },
          },
        },
      },
      {
        $group: {
          _id: null,
          uniqueClicks: {
            $sum: '$uniqueClicks',
          },
          totalOrderCount: {
            $sum: '$numOrders',
          },
        },
      },
    ];
    const manager = getMongoManager();
    const gs = await manager.aggregate(Groupshops, agg).toArray();
    const response = {
      uniqueVisitors: gs[0]?.uniqueClicks || 0,
      totalOrders: gs[0]?.totalOrderCount || 0,
    };
    return response;
  }

  async findfindQrDealLinkAll(email: string) {
    const agg = [
      {
        $match: {
          'customer.email': email,
        },
      },
      {
        $lookup: {
          from: 'groupshops',
          localField: 'id',
          foreignField: 'members.orderId',
          as: 'groupshops',
        },
      },
      {
        $lookup: {
          from: 'store',
          localField: 'shop',
          foreignField: 'shop',
          as: 'shops',
        },
      },
    ];
    const manager = getMongoManager();
    const gs = await manager.aggregate(Orders, agg).toArray();
    const response = {
      url: gs[0]?.groupshops[0].url,
      brandname: gs[0]?.shops[0].logoImage,
    };
    return response;
  }

  async findActiveGroupshops(email: string) {
    const agg = [
      {
        $match: {
          'customer.email': email,
        },
      },
      {
        $lookup: {
          from: 'groupshops',
          localField: 'id',
          foreignField: 'members.orderId',
          as: 'groupshops',
        },
      },
      // {
      //   $lookup: {
      //     from: 'store',
      //     localField: 'shop',
      //     foreignField: 'shop',
      //     as: 'shops',
      //   },
      // },
    ];
    const manager = getMongoManager();
    const gs = await manager.aggregate(Orders, agg).toArray();
    const response = {
      url: gs[0]?.groupshops[0].url,
      brandname: gs[0]?.shops[0].logoImage,
    };
    return response;
  }

  async findOne(discountCode: string) {
    const agg = [
      {
        $match: {
          'discountCode.title': discountCode,
        },
      },
      {
        $sort: {
          'milestones.activatedAt': -1,
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
          from: 'orders',
          localField: 'members.orderId',
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
                      $in: ['$$j.product.id', '$store.hideProducts'],
                    },
                  },
                  { $ne: ['$$j.product', null] },
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
        $addFields: {
          members: {
            $map: {
              input: '$members',
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
                                      '$$this.lineItems.product.id',
                                      '$store.hideProducts',
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
        $lookup: {
          from: 'campaign',
          localField: 'campaignId',
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
                      $in: ['$$j.id', '$store.hideProducts'],
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
          localField: 'dealProducts.productId',
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
                      $in: ['$$j.id', '$store.hideProducts'],
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
          ownerDealsProducts: {
            $filter: {
              input: '$dealProducts',
              as: 'j',
              cond: {
                $and: [
                  {
                    $eq: ['$$j.type', 1],
                  },
                ],
              },
            },
          },
        },
      },
      {
        $addFields: {
          ownerDeals: {
            $map: {
              input: '$ownerDealsProducts',
              in: {
                $arrayElemAt: [
                  {
                    $filter: {
                      input: '$dealsProducts',
                      as: 'j',
                      cond: {
                        $eq: ['$$this.productId', '$$j.id'],
                      },
                    },
                  },
                  0,
                ],
              },
            },
          },
        },
      },
      {
        $addFields: {
          refferalDealsProducts: {
            $filter: {
              input: '$dealProducts',
              as: 'j',
              cond: {
                $and: [
                  {
                    $eq: ['$$j.type', 0],
                  },
                ],
              },
            },
          },
        },
      },
      {
        $addFields: {
          reffDeals: {
            $map: {
              input: '$refferalDealsProducts',
              in: {
                $arrayElemAt: [
                  {
                    $filter: {
                      input: '$dealsProducts',
                      as: 'j',
                      cond: {
                        $eq: ['$$this.productId', '$$j.id'],
                      },
                    },
                  },
                  0,
                ],
              },
            },
          },
        },
      },
      {
        $addFields: {
          allProducts: {
            $concatArrays: [
              {
                $ifNull: ['$dealsProducts', []],
              },
              {
                $ifNull: ['$campaignProducts', []],
              },
            ],
          },
        },
      },
      {
        $addFields: {
          popularProducts: {
            $concatArrays: [
              {
                $ifNull: ['$reffDeals', []],
              },
              {
                $ifNull: ['$popularProducts', []],
              },
            ],
          },
        },
      },
      {
        $addFields: {
          bestSeller: {
            $filter: {
              input: '$allProducts',
              as: 'j',
              cond: {
                $gte: ['$$j.purchaseCount', 1],
              },
            },
          },
        },
      },
      {
        $project: {
          lineItemsDetails: 0,
          orderDetails: 0,
          dealsProducts: 0,
          campaignProducts: 0,
          // ownerDealsProducts: 0,
          // refferalDealsProducts: 0,
        },
      },
      {
        $project: {
          bestSeller: {
            $slice: ['$bestSeller', 0, 15],
          },
          createdAt: 1,
          campaignId: 1,
          storeId: 1,
          totalProducts: 1,
          shortUrl: 1,
          url: 1,
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
          allProducts: 1,
          obSettings: 1,
          exipredShortLink: 1,
          ownerDeals: 1,
          reffDeals: 1,
          ownerDealsProducts: 1,
          refferalDealsProducts: 1,
        },
      },
    ];
    const manager = getMongoManager();
    const gs = await manager.aggregate(Groupshops, agg).toArray();
    // console.log(
    //   '🚀 ~ file: groupshops.service.ts ~ line 917 ~ GroupshopsService ~ findOne ~ gs',
    //   gs,
    // );
    if (gs.length) {
      const popular = gs[0].popularProducts;
      const dPopular = [];

      popular
        ?.filter((item) => item !== null)
        .map((item, ind) => {
          if (item.status.toUpperCase() !== 'ACTIVE') item.outofstock = true; // if product is draft so make it out of stock so that it is not purchaseable
          if (ind === 0) {
            dPopular.push(item);
          } else {
            if (!dPopular.find((prd) => prd.id === item.id)) {
              // console.log(!dPopular.find((prd) => prd.id !== item.id));
              // console.log('item here', item.id);

              dPopular.push(item);
            }
          }
        });
      gs[0].popularProducts = dPopular;
      gs[0].members = gs[0].members.map((member) => {
        member.products.map((item) => {
          if (item.status.toUpperCase() !== 'ACTIVE') item.outofstock = true;
          return item;
        });
        return member;
      });
    }
    console.log(
      '🚀 ~ file: groupshops.service.ts ~ line 975 ~ GroupshopsService ~ findOne ~ gs[0]',
      gs[0],
    );

    return gs[0];
  }

  async findOneWithLineItems(discountCode: string) {
    const agg = [
      {
        $match: {
          'discountCode.title': discountCode,
        },
      },
      {
        $sort: {
          'milestones.activatedAt': -1,
        },
      },
      {
        $lookup: {
          from: 'orders',
          localField: 'members.orderId',
          foreignField: 'parentId',
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
                    lineItems: {
                      $filter: {
                        input: '$orderDetails',
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
        $project: {
          orderDetails: 0,
        },
      },
    ];

    const manager = getMongoManager();
    const gs = await manager.aggregate(Groupshops, agg).toArray();
    return gs[0];
  }

  async findWithStore(id: string) {
    const agg = [
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
        $match: {
          id,
        },
      },
      {
        $lookup: {
          from: 'campaign',
          localField: 'campaignId',
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
          cproducts: '$campaign.products',
        },
      },
      {
        $addFields: {
          dproducts: '$dealProducts.productId',
        },
      },
      {
        $addFields: {
          gsproducts: {
            $concatArrays: [
              {
                $ifNull: ['$cproducts', []],
              },
              {
                $ifNull: ['$dproducts', []],
              },
            ],
          },
        },
      },
    ];

    const manager = getMongoManager();
    const gs = await manager.aggregate(Groupshops, agg).toArray();
    // console.log('🚀 ~ find one groupshop with line items', gs);
    return gs[0];
  }

  async update(updateGroupshopInput: UpdateGroupshopInput) {
    const { id, dealProducts } = updateGroupshopInput;
    if (dealProducts && dealProducts.length) {
      updateGroupshopInput.dealProducts = [new DealProductsInput()];
      updateGroupshopInput.dealProducts = dealProducts;
    }
    // console.log('🚀 ~ ~ update ~ dealProducts', dealProducts);
    delete updateGroupshopInput.id;
    // delete updateGroupshopInput['_id'];
    await this.groupshopRepository.update({ id }, updateGroupshopInput);
    const gs = await this.findWithStore(id);
    const {
      discountCode: { priceRuleId },
      store: { shop, accessToken },
      gsproducts,
    } = gs;

    if (dealProducts && dealProducts.length > 0) {
      await this.shopifyapi.setDiscountCode(
        shop,
        'Update',
        accessToken,
        null,
        null,
        gsproducts,
        null,
        null,
        priceRuleId,
      );

      await this.groupshopRepository.update(
        { id },
        { totalProducts: gsproducts.length },
      );
    }
    return gs;
  }

  async updateExpireDate(
    updateGroupshopInput: UpdateGroupshopInput,
    code: string,
  ) {
    const { id } = updateGroupshopInput;

    delete updateGroupshopInput.id;
    await this.groupshopRepository.update({ id }, updateGroupshopInput);
    const gs = await this.findWithStore(id);
    return await this.findOne(code);
  }

  // updateDealProducts(addDealProductInput: AddDealProductInput) {
  //   const { id, dealProducts } = addDealProductInput;
  //   // const  dealProducts = [new DealProductsInput()];
  //   // updateGroupshopInput.dealProducts = dealProducts;

  //   return this.groupshopRepository.update(id, dealProducts);
  // }

  remove(id: number) {
    return `This action removes a #${id} Groupshop`;
  }

  async removeShop(storeId: string) {
    return await this.groupshopRepository.delete({ storeId });
  }

  async getCampaignGS(campaignId) {
    // console.log('🚀 ~ getAllCampaignById', campaignId.id);
    const manager = getMongoManager();
    const agg = [
      {
        $match: {
          campaignId: campaignId.id,
        },
      },
      {
        $addFields: {
          boughtProducts: '$members.lineItems.product.id',
        },
      },
      {
        $unwind: {
          path: '$boughtProducts',
        },
      },
    ];
    return await manager.aggregate(Groupshops, agg).toArray();
  }

  async findGsOrders(groupshopUrl: string) {
    const response = await this.groupshopRepository.findOne({
      where: {
        url: groupshopUrl,
      },
    });
    // console.log(JSON.stringify(response));
    return response.members;
  }

  async getuniqueClicks(storeId: string, startFrom, toDate) {
    let fullDate = '';
    const d = new Date();
    const year = d.getFullYear();
    const month = ('0' + (d.getMonth() + 1)).slice(-2);
    const day = ('0' + d.getDate()).slice(-2);
    fullDate = `${year}${'-'}${month}${'-'}${day}`;
    if (startFrom === '-') {
      startFrom = '2021-01-21';
      toDate = fullDate;
    }
    const agg = [
      {
        $match: {
          $and: [
            {
              storeId: storeId,
            },
            {
              createdAt: {
                $gte: new Date(`${startFrom}${'T00:00:01'}`),
              },
            },
            {
              $or: [
                {
                  createdAt: {
                    $lte: new Date(`${toDate}${'T23:59:59'}`),
                  },
                },
                {
                  expiredAt: fullDate === toDate ? null : '',
                },
              ],
            },
          ],
        },
      },
      {
        $lookup: {
          from: 'visitors',
          localField: 'id',
          foreignField: 'groupshopId',
          as: 'result',
        },
      },
      {
        $project: {
          uniqueClicks: {
            $size: '$result',
          },
          numOrders: {
            $cond: {
              if: {
                $gt: [
                  {
                    $size: '$members',
                  },
                  1,
                ],
              },
              then: {
                $size: '$members',
              },
              else: 0,
            },
          },
        },
      },
      {
        $group: {
          _id: null,
          uniqueClicks: {
            $sum: '$uniqueClicks',
          },
          totalOrderCount: {
            $sum: '$numOrders',
          },
        },
      },
    ];
    const manager = getMongoManager();
    const gs = await manager.aggregate(Groupshops, agg).toArray();
    const response = {
      uniqueVisitors: gs[0]?.uniqueClicks || 0,
      totalOrders: gs[0]?.totalOrderCount || 0,
    };
    return response;
  }

  async campaignMetric(storeId: string, startFrom, toDate) {
    let fullDate = '';
    const d = new Date();
    const year = d.getFullYear();
    const month = ('0' + (d.getMonth() + 1)).slice(-2);
    const day = ('0' + d.getDate()).slice(-2);
    fullDate = `${year}${'-'}${month}${'-'}${day}`;
    if (startFrom === '-') {
      startFrom = '2021-01-21';
      toDate = fullDate;
    }
    const agg = [
      {
        $match: {
          $and: [
            {
              storeId: storeId,
            },
            {
              createdAt: {
                $gte: new Date(`${startFrom}${'T00:00:01'}`),
              },
            },
            {
              $or: [
                {
                  createdAt: {
                    $lte: new Date(`${toDate}${'T23:59:59'}`),
                  },
                },
                {
                  expiredAt: fullDate === toDate ? null : '',
                },
              ],
            },
          ],
        },
      },
      {
        $lookup: {
          from: 'billing',
          localField: 'id',
          foreignField: 'groupShopId',
          as: 'billings',
        },
      },
      {
        $unwind: {
          path: '$billings',
        },
      },
      {
        $group: {
          _id: null,
          cashBack: {
            $sum: '$billings.cashBack',
          },
          revenue: {
            $sum: '$billings.revenue',
          },
        },
      },
    ];
    const manager = getMongoManager();
    const gs = await manager.aggregate(Groupshops, agg).toArray();
    return gs;
  }

  async getOrderDetails(orderid: string) {
    const agg = [
      {
        $match: {
          'members.orderId': `gid://shopify/Order/${orderid}`,
        },
      },
      {
        $lookup: {
          from: 'store',
          localField: 'storeId',
          foreignField: 'id',
          as: 'storeData',
        },
      },
      {
        $unwind: {
          path: '$storeData',
        },
      },
    ];
    const manager = getMongoManager();
    return await manager.aggregate(Groupshops, agg).toArray();
  }
  async countOfGsMonthly(storeId: string, month, year) {
    const { sdate, edate } = DateFormats(month, year);

    const agg = [
      {
        $match: {
          $and: [
            {
              storeId: storeId,
            },
            {
              createdAt: {
                // $gte: new Date('Wed, 01 Jul 2022 19:00:00 GMT'),
                // $lte: new Date('Thu, 30 Jul 2022 23:59:00 GMT'),
                $gte: sdate,
                $lte: edate,
              },
            },
          ],
        },
      },
      {
        $count: 'count',
      },
    ];
    const manager = getMongoManager();
    const gs = await manager.aggregate(Groupshops, agg).toArray();
    return gs[0];
  }

  async CountGSByRange(sdate: Date, edate: Date, storeId: string) {
    const agg: any = [
      {
        $match: {
          storeId,
        },
      },
      {
        $match: {
          createdAt: {
            $gte: sdate,
            $lte: edate,
          },
        },
      },
      {
        $count: 'total',
      },
    ];

    const manager = getMongoManager();
    const gs = await manager.aggregate(Groupshops, agg).toArray();
    console.log({ gs }, 'total gss');
    return gs[0] ?? { total: 0 };
  }

  async findMostViralCustomers(
    storeId: string,
    startDate: string,
    endDate: string,
  ) {
    let fullDate = '';
    const d = new Date();
    const year = d.getFullYear();
    const month = ('0' + (d.getMonth() + 1)).slice(-2);
    const day = ('0' + d.getDate()).slice(-2);
    fullDate = `${year}${'-'}${month}${'-'}${day}`;
    if (startDate === '-') {
      startDate = '2021-01-21';
      endDate = fullDate;
    }
    const agg = [
      {
        $match: {
          $and: [
            {
              storeId: storeId,
            },
            {
              createdAt: {
                $gte: new Date(`${startDate}${'T00:00:01'}`),
                $lte: new Date(`${endDate}${'T23:59:59'}`),
              },
            },
          ],
        },
      },
      {
        $lookup: {
          from: 'visitors',
          localField: 'id',
          foreignField: 'groupshopId',
          as: 'result',
        },
      },
      {
        $project: {
          members: 1,
          shortUrl: 1,
          url: 1,
          uniqueClicks: {
            $size: '$result',
          },
          numMembers: {
            $cond: {
              if: {
                $gt: [
                  {
                    $size: '$members',
                  },
                  1,
                ],
              },
              then: {
                $size: '$members',
              },
              else: 0,
            },
          },
        },
      },
      {
        $match: {
          numMembers: {
            $ne: 0,
          },
        },
      },
      {
        $addFields: {
          lineItems: {
            $reduce: {
              input: '$members.lineItems',
              initialValue: [],
              in: {
                $concatArrays: ['$$value', '$$this'],
              },
            },
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
        $lookup: {
          from: 'orders',
          localField: 'members.orderId',
          foreignField: 'id',
          as: 'members',
        },
      },
      {
        $addFields: {
          refund: {
            $sum: '$refundItems.amount',
          },
          lineItemsCount: {
            $size: '$lineItems',
          },
        },
      },
      {
        $project: {
          revenue: {
            $sum: {
              $map: {
                input: '$lineItems',
                in: {
                  $multiply: ['$$this.discountedPrice', '$$this.quantity'],
                },
              },
            },
          },
          url: 1,
          shortUrl: 1,
          members: 1,
          uniqueClicks: 1,
          numMembers: 1,
          lineItems: 1,
          refundItems: 1,
          refund: 1,
          lineItemsCount: 1,
        },
      },
      {
        $sort: {
          _id: -1,
        },
      },
    ];
    const manager = getMongoManager();
    const gs = await manager.aggregate(Groupshops, agg).toArray();
    return gs;
  }
}
