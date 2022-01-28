import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { getMongoManager, Repository } from 'typeorm';
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

@Injectable()
export class GroupshopsService {
  constructor(
    @InjectRepository(Groupshops)
    private groupshopRepository: Repository<Groupshops>,
    private shopifyapi: ShopifyService,
  ) {}
  async create(createGroupshopInput: CreateGroupshopInput) {
    console.log(
      '🚀 ~ file: groupshops.service.ts ~ line 8 ~ GroupshopsService ~ create ~ createGroupshopInput',
      createGroupshopInput,
    );
    const groupshop = this.groupshopRepository.create(createGroupshopInput);
    groupshop.dealProducts = [new DealProductsInput()];
    groupshop.id = uuid();
    groupshop.dealProducts = createGroupshopInput.dealProducts;
    groupshop.members = [new MemberInput()];
    groupshop.members = createGroupshopInput.members;
    groupshop.milestones = [new MilestoneInput()];
    groupshop.milestones = createGroupshopInput.milestones;
    // groupshop.members.map

    return this.groupshopRepository.save(groupshop);
  }

  findAll() {
    return this.groupshopRepository.find();
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
                              $eq: ['$$this.orderId', '$$j.id'],
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
                      $arrayElemAt: [
                        {
                          $map: {
                            input: '$$me.lineItems',
                            in: {
                              $filter: {
                                input: '$popularProducts',
                                as: 'j',
                                cond: {
                                  $eq: ['$$this.product.id', '$$j.id'],
                                },
                              },
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
            $concatArrays: ['$campaignProducts', '$dealsProducts'],
          },
        },
      },
      {
        $project: {
          lineItemsDetails: 0,
          orderDetails: 0,
          dealsProducts: 0,
          campaignProducts: 0,
          'members.lineItems': 0,
        },
      },
    ];
    const manager = getMongoManager();
    const gs = await manager.aggregate(Groupshops, agg).toArray();
    console.log('🚀 ~ find one groupshop products', gs);
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
    console.log('🚀 ~ find one groupshop with line items', gs);
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
            $concatArrays: ['$cproducts', '$dproducts'],
          },
        },
      },
    ];

    const manager = getMongoManager();
    const gs = await manager.aggregate(Groupshops, agg).toArray();
    console.log('🚀 ~ find one groupshop with line items', gs);
    return gs[0];
  }

  async update(updateGroupshopInput: UpdateGroupshopInput) {
    const { id, dealProducts } = updateGroupshopInput;
    console.log(
      '🚀 ~ file: groupshops.service.ts ~ line 331 ~ GroupshopsService ~ update ~ updateGroupshopInput',
      updateGroupshopInput,
    );

    updateGroupshopInput.dealProducts = [new DealProductsInput()];
    updateGroupshopInput.dealProducts = dealProducts;
    delete updateGroupshopInput.id;
    // delete updateGroupshopInput['_id'];
    await this.groupshopRepository.update({ id }, updateGroupshopInput);
    const gs = await this.findWithStore(id);
    console.log(
      '🚀 ~ file: groupshops.service.ts ~ line 402 ~ GroupshopsService ~ update ~ gs',
      gs,
    );
    const {
      discountCode: { priceRuleId },
      store: { shop, accessToken },
      gsproducts,
    } = gs;
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
    return gs;
    // return await this.groupshopRepository.findOne({
    //   where: {
    //     id: id,
    //   },
    // });
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
}
