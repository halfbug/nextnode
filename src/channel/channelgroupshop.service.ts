import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { getMongoManager, Repository } from 'typeorm';
import { CreateChannelGroupshopInput } from './dto/create-channel-groupshop.input';
import { v4 as uuid } from 'uuid';
import ChannelGroupshop from './entities/channelgroupshop.model';
import { ChannelService } from './channel.service';
import { UpdateChannelGroupshopInput } from './dto/update-channel-groupshop.input';
import { EncryptDecryptService } from 'src/utils/encrypt-decrypt/encrypt-decrypt.service';
import { ConfigService } from '@nestjs/config';
import { KalavioService } from 'src/email/kalavio.service';
import { ShopifyService } from 'src/shopify-store/shopify/shopify.service';
import { StoresService } from 'src/stores/stores.service';
import { addDays } from 'src/utils/functions';

@Injectable()
export class ChannelGroupshopService {
  constructor(
    @InjectRepository(ChannelGroupshop)
    private channelGroupshopRepository: Repository<ChannelGroupshop>,
    private channelService: ChannelService,
    private crypt: EncryptDecryptService,
    private configSevice: ConfigService,
    private kalavioService: KalavioService,
    private shopifyapi: ShopifyService,
    private storesService: StoresService,
  ) {}

  static formatTitle(name: string) {
    return `GSC${name}`;
  }

  async create(createChannelGroupshopInput: CreateChannelGroupshopInput) {
    console.log(
      '🚀 ~ file: channelgroupshop.service.ts ~ line 34 ~ ChannelGroupshopService ~ create ~ createChannelGroupshopInput',
      createChannelGroupshopInput,
    );
    const id = uuid();
    const temp = this.channelGroupshopRepository.create({
      id,
      expiredAt: addDays(new Date(), 30),
      isActive: createChannelGroupshopInput?.isActive ?? true,
      ...createChannelGroupshopInput,
    });
    const channelGroupshop = await this.channelGroupshopRepository.save(temp);
    const _id = channelGroupshop._id;
    const { shop, accessToken, brandName } = await this.storesService.findById(
      createChannelGroupshopInput.storeId,
    );

    const {
      rewards: { baseline },
      name,
      slugName,
    } = await this.channelService.findOne(channelGroupshop.channelId);

    const title = ChannelGroupshopService.formatTitle(_id);
    const cryptURL = `/${
      shop.split('.')[0]
    }/ch/${slugName}/${this.crypt.encrypt(title)}`;
    const fulllink = `${this.configSevice.get('FRONT')}${cryptURL}`;
    const shortLink = await this.kalavioService.generateShortLink(fulllink);

    let ucg = null;
    ucg = new UpdateChannelGroupshopInput();
    ucg.url = cryptURL;
    ucg.shortUrl = shortLink;
    // bought product + campaign products will go to setDiscount below
    // also add in db
    const campaign = await this.storesService.findOneWithActiveCampaing(shop);
    const {
      activeCampaign: { products, id: activeCampId },
    } = campaign;
    ucg.campaignId = activeCampId;

    ucg.discountCode = await this.shopifyapi.setDiscountCode(
      shop,
      'Create',
      accessToken,
      title,
      parseInt(baseline),
      products,
      new Date(),
      null,
    );

    const gs = await this.update(id, ucg);

    const mdata = {
      firstName: createChannelGroupshopInput.customerDetail.firstName,
      lastName: createChannelGroupshopInput.customerDetail.lastName,
      email: createChannelGroupshopInput.customerDetail.email,
      shortUrl: shortLink,
      percentage: baseline,
      channelName: name,
      brandName: brandName,
    };
    const body = {
      event: 'Groupshop Channel Creation',
      customer_properties: {
        $email: createChannelGroupshopInput.customerDetail.email,
      },
      properties: mdata,
    };
    this.kalavioService.sendKlaviyoEmail(body);

    return gs;
  }

  async findAllSignup(storeId) {
    const agg = [
      {
        $match: {
          storeId: storeId,
        },
      },
      {
        $lookup: {
          from: 'channel',
          localField: 'channelId',
          foreignField: 'id',
          as: 'channel',
        },
      },
      {
        $unwind: {
          path: '$channel',
        },
      },
      {
        $sort: {
          _id: -1,
        },
      },
    ];
    const manager = getMongoManager();
    const gs = await manager.aggregate(ChannelGroupshop, agg).toArray();
    return gs;
  }

  findOne(id: string) {
    return this.channelGroupshopRepository.findOne({
      where: {
        id,
      },
    });
  }

  async update(
    id: string,
    updateChannelGroupshopInput: UpdateChannelGroupshopInput,
  ) {
    await this.channelGroupshopRepository.update(
      { id },
      updateChannelGroupshopInput,
    );
    const gs = await this.findOne(id);
    return gs;
  }

  async findChannelGroupshopByCode(discountCode: string) {
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
          customerDetail: 1,
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
    const gs = await manager.aggregate(ChannelGroupshop, agg).toArray();
    console.log('🛑 🛑 🛑 gs[0]', gs[0].customerDetail);
    return gs[0];
  }

  remove(id: string) {
    return `This action removes a #${id} channel`;
  }
}
