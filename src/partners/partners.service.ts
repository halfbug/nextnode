import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { getMongoManager, Like, Repository } from 'typeorm';
import {
  CreatePartnersInput,
  PartnerDetailsInput,
  PartnerRewardsInput,
} from './dto/create-partners.input';
import { UpdatePartnersInput } from './dto/update-partners.input';
import { partnerDetails, Partnergroupshop } from './entities/partner.modal';
import { v4 as uuid } from 'uuid';
import { ShopifyService } from 'src/shopify-store/shopify/shopify.service';
import {
  DealProductsInput,
  DiscountCodeInput,
} from 'src/groupshops/dto/create-groupshops.input';
import { StoresService } from 'src/stores/stores.service';
import { GSPCreatedEvent } from './events/create-partner-groupshop.event';

@Injectable()
export class PartnerService {
  constructor(
    @InjectRepository(Partnergroupshop)
    private partnerRepository: Repository<Partnergroupshop>,
    private shopifyapi: ShopifyService,
    private storesService: StoresService,
    private gspEvent: GSPCreatedEvent, // private gspListener: GSPSavedListener,
  ) {}

  async findOne(discountCode: string) {
    console.log(
      '🚀 ~ file: partners.service.ts ~ line 31 ~ PartnerService ~ findOne ~ discountCode',
      discountCode,
    );
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
                ],
              },
            },
          },
        },
      },
      {
        $lookup: {
          from: 'partnermember',
          localField: 'id',
          foreignField: 'groupshopId',
          as: 'memberDetails',
        },
      },
      {
        $lookup: {
          from: 'inventory',
          localField: 'memberDetails.lineItems.product.id',
          foreignField: 'id',
          as: 'popularProducts',
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
          refferalProducts: {
            $filter: {
              input: '$dealProducts',
              as: 'j',
              cond: {
                $and: [
                  {
                    $eq: ['$$j.isInfluencer', false],
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
          localField: 'refferalProducts.productId',
          foreignField: 'id',
          as: 'refferalProducts',
        },
      },
      {
        $addFields: {
          influencerProducts: {
            $filter: {
              input: '$dealProducts',
              as: 'j',
              cond: {
                $and: [
                  {
                    $eq: ['$$j.isInfluencer', true],
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
          localField: 'influencerProducts.productId',
          foreignField: 'id',
          as: 'influencerProducts',
        },
      },
      {
        $addFields: {
          allProducts: {
            $concatArrays: ['$dealsProducts', '$campaignProducts'],
          },
        },
      },
      {
        $addFields: {
          popularProducts: {
            $concatArrays: [
              {
                $ifNull: ['$refferalProducts', []],
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
        $sort: {
          'bestSeller.purchaseCount': -1,
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
          from: 'visitors',
          localField: 'id',
          foreignField: 'groupshopId',
          as: 'visitors',
        },
      },
      {
        $project: {
          bestSeller: {
            $slice: ['$bestSeller', 0, 20],
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
          partnerRewards: 1,
          partnerDetails: 1,
          memberDetails: 1,
          refferalProducts: 1,
          influencerProducts: 1,
          isActive: 1,
          partnerCommission: 1,
          visitors: {
            $size: '$visitors',
          },
        },
      },
    ];
    const manager = getMongoManager();
    const gs = await manager.aggregate(Partnergroupshop, agg).toArray();
    return gs[0];
  }

  async findById(id: string) {
    const agg = [
      {
        $match: {
          id: id,
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
                ],
              },
            },
          },
        },
      },
      {
        $addFields: {
          allProducts: {
            $concatArrays: ['$dealsProducts', '$campaignProducts'],
          },
        },
      },
      {
        $addFields: {
          popularProducts: {
            $concatArrays: [
              {
                $ifNull: ['$dealsProducts', []],
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
        $sort: {
          'bestSeller.purchaseCount': -1,
        },
      },
      {
        $lookup: {
          from: 'visitors',
          localField: 'id',
          foreignField: 'groupshopId',
          as: 'visitors',
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
          partnerRewards: 1,
          partnerDetails: 1,
          visitors: {
            $size: '$visitors',
          },
        },
      },
    ];
    const manager = getMongoManager();
    const gs = await manager.aggregate(Partnergroupshop, agg).toArray();
    return gs[0];
  }

  async create(createPartnersInput: CreatePartnersInput) {
    // console.log(
    //   'createGroupshopInput : ' + JSON.stringify(createPartnersInput),
    // );
    const partner = this.partnerRepository.create(createPartnersInput);

    const { shop, accessToken, brandName, logoImage } =
      await this.storesService.findById(createPartnersInput.storeId);
    // console.log(shop);
    // console.log(accessToken);
    const customerDetails = await this.shopifyapi.getCustomerByEmail(
      shop,
      accessToken,
      createPartnersInput.partnerDetails['email'],
    );

    const parDetail: partnerDetails = {
      fname:
        customerDetails?.body?.['data']['customers']['edges'].length > 0
          ? customerDetails?.body?.['data']['customers']['edges'][0]['node'][
              'firstName'
            ]
          : null,
      lname:
        customerDetails?.body?.['data']['customers']['edges'].length > 0
          ? customerDetails?.body?.['data']['customers']['edges'][0]['node'][
              'lastName'
            ]
          : null,
      email: createPartnersInput.partnerDetails['email'],
      shopifyCustomerId:
        customerDetails?.body?.['data']['customers']['edges'].length > 0
          ? customerDetails?.body?.['data']['customers']['edges'][0]['node'][
              'id'
            ]
          : null,
    };

    partner.dealProducts = [new DealProductsInput()];
    partner.partnerDetails = new PartnerDetailsInput();
    partner.partnerRewards = new PartnerRewardsInput();
    partner.discountCode = new DiscountCodeInput();
    partner.id = uuid();
    partner.campaignId = createPartnersInput.campaignId;
    partner.storeId = createPartnersInput.storeId;
    partner.url = createPartnersInput.url;
    partner.shortUrl = createPartnersInput.shortUrl;
    partner.dealProducts = createPartnersInput?.dealProducts || [];
    partner.discountCode = createPartnersInput.discountCode;
    partner.partnerDetails = parDetail;
    partner.partnerRewards = createPartnersInput.partnerRewards;
    partner.partnerCommission = createPartnersInput.partnerCommission;
    partner.isActive = true;
    partner.createdAt = createPartnersInput.createdAt;
    partner.updatedAt = createPartnersInput.updatedAt;
    const newGSP = await this.partnerRepository.save(partner);
    this.gspEvent.groupshop = newGSP;
    this.gspEvent.shop = shop;
    this.gspEvent.accessToken = accessToken;
    this.gspEvent.brandName = brandName;
    this.gspEvent.brandLogo = logoImage;
    this.gspEvent.email = createPartnersInput.partnerDetails['email'];
    this.gspEvent.emit();
    return newGSP;
  }

  findWithId(id: string) {
    return this.partnerRepository.findOne({ id });
  }

  async findAll(storeId: string) {
    const agg = [
      {
        $match: {
          storeId: storeId,
        },
      },
      {
        $lookup: {
          from: 'partnermember',
          localField: 'id',
          foreignField: 'groupshopId',
          as: 'members',
        },
      },
      {
        $project: {
          purchases: {
            $size: '$members',
          },
          id: 1,
          members: 1,
          campaignId: 1,
          discountCode: 1,
          partnerRewards: 1,
          partnerDetails: 1,
          isActive: 1,
          partnerCommission: 1,
          shortUrl: 1,
          url: 1,
          updatedAt: 1,
        },
      },
      {
        $unwind: {
          path: '$members',
          includeArrayIndex: 'typeIndex',
          preserveNullAndEmptyArrays: true,
        },
      },
      {
        $group: {
          _id: '$id',
          revenue: {
            $sum: '$members.orderAmount',
          },
          comissionAmount: {
            $sum: '$members.comissionAmount',
          },
          partnerRewards: {
            $first: '$partnerRewards',
          },
          partnerDetails: {
            $first: '$partnerDetails',
          },
          discountCode: {
            $first: '$discountCode',
          },
          purchases: {
            $first: '$purchases',
          },
          shortUrl: {
            $first: '$shortUrl',
          },
          url: {
            $first: '$url',
          },
          partnerCommission: {
            $first: '$partnerCommission',
          },
          campaignId: {
            $first: '$campaignId',
          },
          isActive: {
            $first: '$isActive',
          },
          id: {
            $first: '$id',
          },
          updatedAt: {
            $first: '$updatedAt',
          },
        },
      },
      {
        $sort: {
          updatedAt: -1,
        },
      },
    ];
    const manager = getMongoManager();
    const gs = await manager.aggregate(Partnergroupshop, agg).toArray();
    return gs;
  }

  async update(id: string, updatePartnersInput: UpdatePartnersInput) {
    updatePartnersInput.updatedAt = new Date();

    console.log(
      '🚀 ~ file:PartnerService updatePartnersInput',
      updatePartnersInput,
    );
    const {
      storeId,
      partnerCommission,
      // partnerRewards: { baseline },
    } = updatePartnersInput;
    if (updatePartnersInput.isActive) {
      const res = await this.partnerRepository.update(
        { id },
        updatePartnersInput,
      );
      return this.findWithId(id);
    }
    if (
      updatePartnersInput?.dealProducts &&
      updatePartnersInput?.dealProducts?.length > 0
    ) {
      const gsp = await this.findById(id);
      const {
        discountCode: { priceRuleId },
        store: { shop, accessToken },
        allProducts,
      } = gsp;
      const allNewProducts = [
        ...allProducts,
        ...updatePartnersInput.dealProducts.map((item) => ({
          id: item.productId,
        })),
      ].map((item) => item.id);
      console.log(
        '🚀 ~ file: partners.service.ts ~ line 738 ~ PartnerService ~ update ~ allNewProducts',
        allNewProducts,
      );
      console.log(
        '🚀 ~ file: partners.service.ts ~ line 738 ~ PartnerService ~ update ~ updatePartnersInput.dealProducts',
        updatePartnersInput.dealProducts,
      );

      await this.shopifyapi.setDiscountCode(
        shop,
        'Update',
        accessToken,
        null,
        null,
        [...new Set(allNewProducts)],
        null,
        null,
        priceRuleId,
      );
    }
    if (
      updatePartnersInput?.partnerRewards &&
      updatePartnersInput?.partnerRewards?.baseline
    ) {
      const gsp = await this.findById(id);
      const {
        discountCode: { priceRuleId, percentage, title },
        store: { shop, accessToken },
        partnerRewards: { baseline },
        allProducts,
      } = gsp;
      // console.log(
      //   '🚀 ~ file: partners.service.ts ~ line 751 ~ PartnerService ~ update ~ gsp',
      //   gsp,
      // );
      // const allNewProducts = allProducts.map((item) => item.id);
      // const { shop, accessToken } = await this.storesService.findById(
      //   updatePartnersInput.storeId,
      // );
      updatePartnersInput.discountCode = new DiscountCodeInput();
      updatePartnersInput.discountCode = await this.shopifyapi.setDiscountCode(
        shop,
        'Update',
        accessToken,
        null,
        parseInt(updatePartnersInput?.partnerRewards?.baseline ?? baseline),
        null,
        null,
        null,
        priceRuleId,
      );
      console.log(
        '🚀 ~ file: partners.service.ts ~ line 759 ~ PartnerService ~ update ~ updatePartnersInput.discountCode',
        updatePartnersInput.discountCode,
      );
    }
    const res = await this.partnerRepository.update(
      { id },
      updatePartnersInput,
    );

    return updatePartnersInput;
  }

  async existPartnerGroupshop(email: string, storeId: string) {
    const response = await this.partnerRepository.find({
      where: { storeId: storeId, 'partnerDetails.email': email },
    });
    const res = {
      isActive: response[0]?.shortUrl ? true : false,
    };
    return res;
  }

  async getpartnerDetail(pid: string) {
    return await this.partnerRepository.findOne(pid);
  }

  async removeShop(storeId: string) {
    return await this.partnerRepository.delete({ storeId });
  }
  findAllByDate(sdate: Date, edate: Date) {
    return this.partnerRepository.find({
      where: {
        createdAt: {
          $gte: new Date(sdate),
          $lt: new Date(edate),
        },
      },
    });
  }
}
