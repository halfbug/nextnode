/* eslint-disable prettier/prettier */
import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { getMongoManager, Repository } from 'typeorm';
import { CreateBillingInput } from './dto/create-billing.input';
import { UpdateBillingInput } from './dto/update-billing.input';
import { v4 as uuid } from 'uuid';
import Billing from './entities/billing.model';
import { StoresService } from 'src/stores/stores.service';
import { Groupshops } from 'src/groupshops/entities/groupshop.modal';

@Injectable()
export class BillingsService {
  constructor(
    @InjectRepository(Billing)
    private billingRepository: Repository<Billing>,
    private readonly sotresService: StoresService,
  ) {}

  async create(createBillingInput: CreateBillingInput) {
    const billing = await this.billingRepository.create(createBillingInput);
    const id = uuid();

      const savedBilling = await this.billingRepository.save({id, ...billing});
      console.log("🚀 ~ savedBilling", savedBilling)
      return savedBilling;
  
  }

  findAll() {
    return this.billingRepository.find();
  }

  findOne(id: string) {
    return this.billingRepository.findOne({ id });
  }

  async findOneById(id: string) {
    return await this.billingRepository.findOne({
      where: {
        id: id,
      },
    });
  }
  async findMonthlyBilling(storeId: string) {
    const agg = [
      {
        '$match': {
          'storeId': storeId
        }
      }, {
        '$group': {
          '_id': {
            'year': {
              '$year': '$createdAt'
            }, 
            'month': {
              '$month': '$createdAt'
            }
          }, 
          'cashBack': {
            '$sum': '$cashBack'
          }, 
          'revenue': {
            '$sum': '$revenue'
          }, 
          'feeCharges': {
            '$sum': '$feeCharges'
          }, 
          'count': {
            '$count': {}
          }
        }
      }, {
        '$sort': {
          '_id': -1
        }
      }
    ];
    console.log("🚀 findMonthlyBilling ~ agg", agg)
    const manager = getMongoManager();
    const gs = await manager.aggregate(Billing, agg).toArray();
    console.log("🚀 findMonthlyBilling ~ gs", gs)
    return gs;
  }

  async findTotalGSMonthly(storeId: string) {
    const agg = [
      {
        '$match': {
          'storeId': storeId
        }
      }, {
        '$group': {
          '_id': {
            'year': {
              '$year': '$createdAt'
            }, 
            'month': {
              '$month': '$createdAt'
            }
          }, 
          'count': {
            '$count': {}
          }
        }
      }
    ];
    const manager = getMongoManager();
    const gs = await manager.aggregate(Groupshops, agg).toArray();
    console.log("🚀 total GSs in month ~ gs", gs)
    return gs;

  }

  async findTotalRevenue(storeId: string) {
    const agg = [
      {
        '$match': {
          'storeId': storeId
        }
      }, {
        '$group': {
          '_id': '$storeId', 
          'revenue': {
            '$sum': '$revenue'
          }
        }
      }
    ];
    console.log("🚀 findMonthlyBilling ~ agg", agg)
    const manager = getMongoManager();
    const TotalRev = await manager.aggregate(Billing, agg).toArray();
    console.log("🚀 findMonthlyBilling ~ TotalRevenue", TotalRev)
    return TotalRev[0];
  }

  async update(id: string, updateBillingInput: UpdateBillingInput) {
    console.log(
      '🚀 ~ file:BillingsService updateBillingInput',
      updateBillingInput,
    );

    await this.billingRepository.update({ id }, updateBillingInput);
    return await this.findOneById(id);
  }

  remove(id: string) {
    return this.billingRepository.delete(id);
  }

  async removeByShop(storeId: string) {
    return await this.billingRepository.delete({ storeId });
  }

  async getBillingByDate(storeId: string, startDate: any, endDate: any) {
//   console.log("🚀 endDate", endDate)
//   console.log("🚀 startDate", startDate)
//   console.log("🚀 ~ storeId", storeId)
// //     const d = new Date('4/19/2022');
// // new Date(d.setDate(d.getDate() - 1));

    const agg = [
      {
        '$match': {
          storeId
        }
      }, {
        '$match': {
          'createdAt': {
            '$gte': startDate , 
            '$lte': endDate 
          }
        }
      }, {
        '$lookup': {
          'from': 'store', 
          'localField': 'storeId', 
          'foreignField': 'id', 
          'as': 'store'
        }
      }, {
        '$unwind': {
          'path': '$store'
        }
      }, {
        '$project': {
          'id': 1, 
          'type': 1, 
          'feeCharges': 1, 
          'cashBack': 1, 
          'groupShopId': 1, 
          'storeId': 1, 
          'revenue': 1, 
          'createdAt': 1, 
          'updatedAt': 1, 
          'store': 1, 
          'createdTodayGS': {
            '$cond': {
              'if': {
                '$eq': [
                  '$type', 1
                ]
              }, 
              'then': '$groupShopId', 
              'else': null
            }
          }
        }
      }, {
        '$group': {
          '_id': {
            'year': {
              '$year': '$createdAt'
            }, 
            'month': {
              '$month': '$createdAt'
            }, 
            'date': {
              '$dayOfMonth': '$createdAt'
            }
          }, 
          'totalCashback': {
            '$sum': '$cashBack'
          }, 
          'revenue': {
            '$sum': '$revenue'
          }, 
          'amountFeeCharge': {
            '$sum': '$feeCharges'
          }, 
          'plan': {
            '$first': '$store.plan'
          }, 
          'uniqueGroupshop': {
            '$addToSet': '$createdTodayGS'
          }, 
          'badgeIds':{
            '$addToSet': '$id'
          },
          'storeTotalGS': {
            '$first': '$store.totalGroupShop'
          }
        }
      }, {
        '$addFields': {
          'todaysGS': {
            '$filter': {
              'input': '$uniqueGroupshop', 
              'as': 'd', 
              'cond': {
                '$ne': [
                  '$$d', null
                ]
              }
            }
          }
        }
      }, {
        '$project': {
          'totalCashback': 1, 
          'revenue': 1, 
          'amountFeeCharge': 1, 
          'plan': 1, 
          'todaysTotalGS': {
            '$size': '$todaysGS'
          }, 
          'storeTotalGS': 1,
          'badgeIds':1,
        }
      }
    ];
    // console.log("🚀 findMonthlyBilling ~ agg", agg)
    const manager = getMongoManager();
    const TotalRev = await manager.aggregate(Billing, agg).toArray();
    // console.log("🚀 get billing by date", TotalRev)
    return TotalRev;
  }

  async bulkUpdate(billiingRecords: any) {
    const manager = getMongoManager();

    return await manager.bulkWrite(Billing, billiingRecords);
  }

  
}
