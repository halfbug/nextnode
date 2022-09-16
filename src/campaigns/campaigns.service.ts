/* eslint-disable prettier/prettier */
import { Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { getMongoManager, Repository } from 'typeorm';
import { CreateCampaignInput } from './dto/create-campaign.input';
import { UpdateCampaignInput } from './dto/update-campaign.input';
import Campaign from './entities/campaign.model';
import { v4 as uuid } from 'uuid';
import { InventoryService } from 'src/inventory/inventory.service';
import { GroupshopsService } from 'src/groupshops/groupshops.service';
import { StoresService } from 'src/stores/stores.service';
import { ShopifyService } from 'src/shopify-store/shopify/shopify.service';
import { ProductQueryInput } from 'src/inventory/dto/product-query.input';
import {
  Reward,
} from 'src/appsettings/entities/sales-target.model';
import { CampaignInactiveEvent } from 'src/billing/events/campaign-inactive.event';
import { EventEmitter2 } from '@nestjs/event-emitter';
import { PartnerService } from 'src/partners/partners.service';

@Injectable()
export class CampaignsService {
  constructor(
    @InjectRepository(Campaign)
    private campaignRepository: Repository<Campaign>,
    private readonly inventoryService: InventoryService,
    private readonly sotresService: StoresService,
    private eventEmitter: EventEmitter2,

    private shopifyapi: ShopifyService,
    private groupshopsService: GroupshopsService,
    private partnerGsService: PartnerService,
  ) {}

  async setProducts(shop, criteria, prevProducts) {
    let newProducts: string[] = [];
    switch (criteria) {
      case 'newest':
        const npQuery = new ProductQueryInput();
        npQuery.limit = 80;
        npQuery.shop = shop;
        npQuery.sort = -1;
        const nproducts = await this.inventoryService.findStoreProducts(
          npQuery,
        );

        newProducts = nproducts.map((prod) => prod.id);
        break;

      case 'bestseller':
        const bsproducts = await this.inventoryService.getBestSellerProducts(
          shop,
        );
        newProducts = bsproducts.map((prod) => prod.id);
        break;

      default:
        newProducts = [...new Set(prevProducts)] as string[];
        break;
    }
    return newProducts;
  }

  async create(createCampaignInput: CreateCampaignInput) {
    // console.log(
    //   '🚀 ~ file: campaigns.service.ts ~ line 19 ~ CampaignsService ~ create ~ createCampaignInput',
    //   createCampaignInput,
    // );
    const { storeId, criteria, isActive } = createCampaignInput;
    const { shop } = await this.sotresService.findOneById(storeId);
   
    const prevProducts = createCampaignInput.products;
    const products: string[] = await this.setProducts(
      shop,
      criteria,
      prevProducts,
    );

    /// update all campaign
    if (isActive === true) await this.campaignRepository.update({ isActive: true, storeId }, { isActive: false, expiredAt: new Date() });
    
    createCampaignInput.products = products;
    // const campaign = this.campaignRepository.create(createCampaignInput);

    const id = uuid();
    const campaign = await this.campaignRepository.create({
      id,
      ...createCampaignInput,
      products,
    });
    
    const savedCampaign = await this.campaignRepository.save(campaign);
    console.log("🚀 ~ savedCampaign", savedCampaign)

    const { id: campaign_id } = savedCampaign;

    if(createCampaignInput.rewards)
    {
    const {
      salesTarget: { rewards },
    } = createCampaignInput;
    
    delete createCampaignInput.salesTarget.rewards;
   
     
    const nrewards = rewards.map((rew) => {
        
            const { id:rid, discount, customerCount } = rew;
           
            return new Reward(rid, discount, customerCount);
          });

          await this.campaignRepository.update({id: campaign_id}, { ...savedCampaign, salesTarget: { ...savedCampaign.salesTarget, rewards:nrewards}});
              // console.log(await this.campaignRepository.findOne(campaign_id))
        }
              return await this.findOneById(campaign_id);
   
  }

  findAll(storeId: string) {
    return this.campaignRepository.find({ storeId });
  }

  findOne(id: string) {
    return this.campaignRepository.findOne({ id });
  }

  async findOneById(id: string) {
    return await this.campaignRepository.findOne({
      where: {
        id: id,
      },
    });
  }

  async findActiveOneById(storeId: string) {
    return await this.campaignRepository.findOne({
      where: {
        storeId: storeId,
        isActive: true,
      },
    });
  }

  async update(id: string, updateCampaignInput: UpdateCampaignInput) {
    console.log(
      '🚀 ~ file:CampaignsService updateCampaignInput',
      updateCampaignInput,
    );
    const {
      criteria,
      products,
      collections,
      storeId,
      settings,
      socialLinks,
      salesTarget,
      isActive,
    } = updateCampaignInput;

    const { shop, accessToken } = await this.sotresService.findOneById(storeId); 
    const prevCampaign = await this.findOneById(id);
    // console.log("🚀 ~ file: campaigns.service.ts ~ line 163 ~ CampaignsService ~ update ~ prevCampaign", prevCampaign)
    const prevProducts = prevCampaign.products;

    if (products && criteria === 'custom') {
      updateCampaignInput.products = [...new Set(products)];
    } else {
     
      const updatedProducts: string[] = await this.setProducts(
        shop,
        criteria,
        prevProducts,
      );
      updateCampaignInput.products = updatedProducts;
      
    }
    if (isActive === true) {
      await this.campaignRepository.update(
        { isActive: true, storeId },
        { isActive: false, expiredAt: new Date() },
      );
    }
    updateCampaignInput.expiredAt = (isActive === false) ? new Date() : null ;   

    await this.campaignRepository.update({ id }, updateCampaignInput);    
    
    const campEvent = new CampaignInactiveEvent();
    campEvent.id = id;
    campEvent.storeId = storeId;
    campEvent.isActive = isActive;
  if (isActive === false) {
      this.eventEmitter.emit('campaign.inactive', campEvent);
    } else {
      this.eventEmitter.emit('campaign.active', campEvent);
    }
    if (updateCampaignInput.criteria && (prevCampaign.products?.length !== updateCampaignInput.products?.length)) await this.updateDiscountCode({ id }, updateCampaignInput.products, shop, accessToken);    
    

    return await this.findOneById(id);
  }

  remove(id: string) {
    return this.campaignRepository.delete(id);
  }

  async removeShop(storeId: string) {
    return await this.campaignRepository.delete({ storeId });
  }

  async updateDiscountCode(campaignId, products, shop, accessToken) {   
    try{
    console.log("🚀 ~ campaignId", campaignId);    
    const allGS = await this.groupshopsService.getCampaignGS(campaignId);
    // console.log("🚀 ~ file: campaigns.service.ts ~ line 215 === ~ CampaignsService ~ updateDiscountCode ~ allGS", allGS)
    const allPartnerGS = await this.partnerGsService.getCampaignGS(campaignId);
    // console.log("🚀 ~ file: campaigns.service.ts ~ line 216 === ~ CampaignsService ~ updateDiscountCode ~ allPartnerGS", allPartnerGS)
    for (const key in allGS) {  
      const priceRuleId = allGS[key].discountCode.priceRuleId; 
      // get all deal products
      const gsDealProduucts = allGS[key].dealProducts?.map(prd => prd.productId) ?? []

      await this.shopifyapi.setDiscountCode(
        shop,
        'Update',
        accessToken,
        null,
        null,
        [...new Set([...products, ...gsDealProduucts, ...allGS[key]?.boughtProducts])],
        null,
        null,
        priceRuleId,
      );
    }
    if (allPartnerGS && allPartnerGS.length) {
      for (const key in allPartnerGS) {  
      const priceRuleId = allPartnerGS[key].discountCode.priceRuleId; 
      // get all deal products
      const gsDealProduucts = allPartnerGS[key].dealProducts?.map(prd => prd.productId) ?? []
      console.log("campaigns.service.ts ~ line 238 updateDiscountCode ~ allProduucts", [...products, ...gsDealProduucts, ...allPartnerGS[key]?.boughtProducts].map((item) => item.title))
      await this.shopifyapi.setDiscountCode(
        shop,
        'Update',
        accessToken,
        null,
        null,
        [...new Set([...products, ...gsDealProduucts, ...allPartnerGS[key]?.boughtProducts])],
        null,
        null,
        priceRuleId,
      );
    }
  
  }
} 
catch (err) { 
  console.log(
    '%ccampaigns.service.ts line:253 err',
    'color: #007acc;',
    JSON.stringify(err, null, "\t" )
  );
Logger.error(err.message, CampaignsService.name)
}

  } // end update 
 
  // this funtion will return best seller product of running active campaign
  async getBestSellerProducts(shop: string) {
    const manager = getMongoManager();
    const agg = [
      {
        '$match': {
          '$and': [
            {
              'isActive': true
            }, {
              'storeId': '86c67716-d137-4f95-a095-ac6cedc32e43'
            }
          ]
        }
      }, {
        '$lookup': {
          'from': 'inventory', 
          'localField': 'products', 
          'foreignField': 'id', 
          'as': 'pobj'
        }
      }
    ];
    return await manager.aggregate(Campaign, agg).toArray();
  }
  async findOneWithProducts(id: string) {
    const manager = getMongoManager();
    const agg = [{
      $match: {
          id: id
      }
  }, {
      $lookup: {
          from: 'inventory',
          localField: 'products',
          foreignField: 'id',
          as: 'products'
      }
  }, {
      $addFields: {
          products: {
              $filter: {
                  input: '$products',
                  as: 'j',
                  cond: {
                      $gte: [
                          '$$j.price',
                          '1.0'
                      ]
                  }
              }
          }
      }
  }];
  // console.log(agg);
  const res =await manager.aggregate(Campaign, agg).toArray();
  return res[0];
  }

  async findAllWithDetails(storeId: string) {
    const manager = getMongoManager();
    const agg = [
      {
        '$match': {
          'storeId': storeId,
        }
      }, {
        '$lookup': {
          'from': 'groupshops', 
          'localField': 'id', 
          'foreignField': 'campaignId', 
          'as': 'groupshops'
        }
      }, {
        '$addFields': {
          'totalGroupshops': {
            '$reduce': {
              'input': '$groupshops', 
              'initialValue': 0, 
              'in': {
                '$add': [
                  '$$value', 1
                ]
              }
            }
          }
        }
      }, {
        '$lookup': {
          'from': 'billing', 
          'localField': 'groupshops.id', 
          'foreignField': 'groupShopId', 
          'as': 'billings'
        }
      }, {
        '$addFields': {
          'detail': {
            '$reduce': {
              'input': '$billings', 
              'initialValue': {
                'tcashback': 0, 
                'trevenue': 0
              }, 
              'in': {
                'tcashback': {
                  '$add': [
                    '$$value.tcashback', {$ifNull: ['$$this.cashBack', 0]}
                  ]
                }, 
                'trevenue': {
                  '$add': [
                    '$$value.trevenue', {$ifNull: ['$$this.revenue', 0]}
                  ]
                }
              }
            }
          }
        }
      }, {
        '$set': {
          'details': {
            'totalGroupshops': {
              '$ifNull': [
                '$totalGroupshops', 0
              ]
            }, 
            'totalCashback': {
              '$ifNull': [
                '$detail.tcashback', 0
              ]
            }, 
            'totalRevenue': {
              '$ifNull': [
                '$detail.trevenue', 0
              ]
            }
          }
        }
      }, {
        '$project': {
          'billings': 0, 
          'groupshops': 0, 
          'totalGroupshops': 0, 
          'detail': 0
        }
      }, {
        '$sort': {
          'createdAt': -1
          }
      }
    ];
  // console.log(agg);
  const res =await manager.aggregate(Campaign, agg).toArray();
  // Logger.debug({res}, CampaignsService.name)
  return res;
  }

  async findOverviewDetails(storeId: string) {
    const manager = getMongoManager();
    const agg = [
      {
        '$match': {
          '$and': [
            {
              'isActive': true
            }, {
              'storeId': storeId
            }
          ]
        }
      }
    ];
  const res = await manager.aggregate(Campaign, agg).toArray();
  return res;
  }


  async overviewCampaignMetric(storeId: string, startFrom, toDate) {
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
        '$match': {
          '$and': [
            {
              'storeId': storeId
            }, {
              'createdAt': {
                '$gte': new Date(`${startFrom}${'T00:00:01'}`)
              }
            }, {
              '$or': [
                {
                  'expiredAt': {
                    '$lte': new Date(`${toDate}${'T23:59:59'}`)
                  }
                }, {
                  'expiredAt': fullDate === toDate ? null : '',
                }
              ]
            }
          ]
        }
      }, {
        '$lookup': {
          'from': 'groupshops', 
          'localField': 'id', 
          'foreignField': 'campaignId', 
          'as': 'groupshops'
        }
      }, {
        '$lookup': {
          'from': 'billing', 
          'localField': 'groupshops.id', 
          'foreignField': 'groupShopId', 
          'as': 'billings'
        }
      }, {
        '$unwind': {
          'path': '$billings'
        }
      }, {
        '$group': {
          '_id': null, 
          'cashBack': {
            '$sum': '$billings.cashBack'
          }, 
          'revenue': {
            '$sum': '$billings.revenue'
          }
        }
      }
    ];
    const manager = getMongoManager();
    const gs = await manager.aggregate(Campaign, agg).toArray();
    return gs;
  }

  async getUniqueCampaignClicks(storeId: string, startFrom, toDate) {
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
        '$match': {
          '$and': [
            {
              'storeId': storeId
            }, {
              'createdAt': {
                '$gte': new Date(`${startFrom}${'T00:00:01'}`)
              }
            }, {
              '$or': [
                {
                  'expiredAt': {
                    '$lte': new Date(`${toDate}${'T23:59:59'}`)
                  }
                }, {
                  'expiredAt': fullDate === toDate ? null : '',
                }
              ]
            }
          ]
        }
      }, {
        '$lookup': {
          'from': 'groupshops', 
          'localField': 'id', 
          'foreignField': 'campaignId', 
          'as': 'groupshops'
        }
      }, {
        '$unwind': {
          'path': '$groupshops'
        }
      }, {
        '$lookup': {
          'from': 'visitors', 
          'localField': 'groupshops.id', 
          'foreignField': 'groupshopId', 
          'as': 'result'
        }
      }, {
        '$project': {
          'uniqueClicks': {
            '$size': '$result'
          }, 
          'numOrders': {
            '$cond': {
              'if': {
                '$gt': [
                  {
                    '$size': '$groupshops.members'
                  }, 1
                ]
              }, 
              'then': {
                '$size': '$groupshops.members'
              }, 
              'else': 0
            }
          }
        }
      }, {
        '$group': {
          '_id': null, 
          'uniqueClicks': {
            '$sum': '$uniqueClicks'
          }, 
          'totalOrderCount': {
            '$sum': '$numOrders'
          }
        }
      }
    ];
    const manager = getMongoManager();
    const gs = await manager.aggregate(Campaign, agg).toArray();
    const response = {
      uniqueVisitors: gs[0]?.uniqueClicks || 0,
      totalOrders: gs[0]?.totalOrderCount || 0,
    }; 
    return response;
  }

} 
