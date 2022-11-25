import { Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { getMongoManager, Repository } from 'typeorm';
import { CreateBillingInput } from './dto/create-billing.input';
import { UpdateBillingInput } from './dto/update-billing.input';
import { v4 as uuid } from 'uuid';
import Billing from './entities/billing.model';
import { StoresService } from 'src/stores/stores.service';
import { Groupshops } from 'src/groupshops/entities/groupshop.modal';
import { HttpService } from '@nestjs/axios';
import { lastValueFrom, map } from 'rxjs';
import { ConfigService } from '@nestjs/config';
import { TotalGS } from './dto/monthly-billing.input';

@Injectable()
export class BillingsService {
  constructor(
    @InjectRepository(Billing)
    private billingRepository: Repository<Billing>,
    private readonly sotresService: StoresService,
    private httpService: HttpService,
    private configService: ConfigService,
  ) {}

  async create(createBillingInput: CreateBillingInput) {
    const billing = await this.billingRepository.create(createBillingInput);
    const id = uuid();

    const savedBilling = await this.billingRepository.save({ id, ...billing });
    // console.log('🚀 ~ savedBilling', savedBilling);
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
        $match: {
          storeId,
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
          feeTotalCB: {
            $cond: {
              if: {
                $eq: ['$type', 0],
              },
              then: '$feeCharges',
              else: 0,
            },
          },
          feeTotalGS: {
            $cond: {
              if: {
                $eq: ['$type', 1],
              },
              then: '$feeCharges',
              else: 0,
            },
          },
          createdMonthGS: {
            $cond: {
              if: {
                $eq: ['$type', 1],
              },
              then: 1,
              else: 0,
            },
          },
          trialDate: '$store.appTrialEnd',
        },
      },
      {
        $group: {
          _id: {
            year: {
              $year: '$createdAt',
            },
            month: {
              $month: '$createdAt',
            },
          },
          cashBack: {
            $sum: '$cashBack',
          },
          revenue: {
            $sum: '$revenue',
          },
          feeCharges: {
            $sum: '$feeTotalCB',
          },
          feeChargesGS: {
            $sum: {
              $cond: {
                if: {
                  $gt: ['$createdAt', '$trialDate'],
                },
                then: '$feeTotalGS',
                else: 0,
              },
            },
          },
          count: {
            $count: {},
          },
          totalGS: {
            $sum: '$createdMonthGS',
          },
        },
      },
      {
        $project: {
          totalCharges: {
            $add: ['$feeCharges', '$feeChargesGS'],
          },
          cashBack: 1,
          revenue: 1,
          feeCharges: 1,
          feeChargesGS: 1,
          count: 1,
          totalGS: 1,
        },
      },
      {
        $sort: {
          _id: -1,
        },
      },
    ];
    // console.log("🚀 findMonthlyBilling ~ agg", agg)
    const manager = getMongoManager();
    const gs = await manager.aggregate(Billing, agg).toArray();
    // console.log("🚀 findMonthlyBilling ~ gs", gs)
    return gs;
  }

  async findTotalGSMonthly(storeId: string) {
    const agg = [
      {
        $match: {
          storeId: storeId,
        },
      },
      {
        $group: {
          _id: {
            year: {
              $year: '$createdAt',
            },
            month: {
              $month: '$createdAt',
            },
          },
          count: {
            $count: {},
          },
        },
      },
    ];
    const manager = getMongoManager();
    const gs = await manager.aggregate(Groupshops, agg).toArray();
    // console.log('🚀 total GSs in month ~ gs', gs);
    return gs;
  }

  async findGraphRevenue(storeId: string) {
    let fullDate = '';
    const d = new Date();
    const year = d.getFullYear();
    fullDate = `${year}${'-01-01'}`;
    const agg = [
      {
        $match: {
          storeId: storeId,
          createdAt: {
            $gte: new Date(fullDate),
          },
        },
      },
      {
        $group: {
          _id: {
            year: {
              $year: '$createdAt',
            },
            month: {
              $month: '$createdAt',
            },
          },
          revenue: {
            $sum: '$revenue',
          },
        },
      },
      {
        $sort: {
          _id: -1,
        },
      },
    ];
    const manager = getMongoManager();
    const gs = await manager.aggregate(Billing, agg).toArray();
    return gs;
  }

  async findGraphRevenueByDate(storeId: string, startDate: any, endDate: any) {
    const date1 = new Date(startDate);
    const date2 = new Date(endDate);
    const timeDiff = date2.getTime() - date1.getTime();
    // To calculate the no. of days between two dates
    const numDays = timeDiff / (1000 * 3600 * 24) + 1;
    let graphView = 'Month';
    if (numDays <= 31) {
      graphView = 'Day';
    }
    if (numDays > 365) {
      graphView = 'Year';
    }
    const agg: any = [
      {
        $match: {
          storeId: storeId,
          createdAt: {
            $gte: new Date(`${startDate}${'T00:00:01'}`),
            $lte: new Date(`${endDate}${'T23:59:59'}`),
          },
        },
      },
      {
        $project: {
          createdAt: 1,
          revenue: 1,
        },
      },
    ];
    if (graphView === 'Day') {
      agg?.push({
        $group: {
          _id: {
            month: {
              $month: '$createdAt',
            },
            day: {
              $dayOfMonth: '$createdAt',
            },
          },
          revenue: {
            $sum: '$revenue',
          },
        },
      });
    }
    if (graphView === 'Month') {
      agg?.push({
        $group: {
          _id: {
            year: {
              $year: '$createdAt',
            },
            month: {
              $month: '$createdAt',
            },
          },
          revenue: {
            $sum: '$revenue',
          },
        },
      });
    }
    if (graphView === 'Year') {
      agg?.push({
        $group: {
          _id: {
            year: {
              $year: '$createdAt',
            },
          },
          revenue: {
            $sum: '$revenue',
          },
        },
      });
    }
    agg?.push(
      {
        $addFields: {
          graphView: graphView,
        },
      },
      {
        $sort: {
          _id: 1,
        },
      },
    );

    const manager = getMongoManager();
    const result = await manager.aggregate(Billing, agg).toArray();
    console.log(JSON.stringify(result));
    return result;
  }

  async campaignMetric(storeId: string, campaignId: string) {
    const agg = [
      {
        $match: {
          storeId: storeId,
        },
      },
      {
        $lookup: {
          from: 'groupshops',
          localField: 'groupShopId',
          foreignField: 'id',
          as: 'result',
        },
      },
      {
        $match: {
          'result.campaignId': campaignId,
        },
      },
      {
        $addFields: {
          feeCharges: {
            $cond: {
              if: {
                $ne: ['$type', 1],
              },
              then: {
                $ceil: '$feeCharges',
              },
              else: 0,
            },
          },
        },
      },
      {
        $group: {
          _id: null,
          cashBack: {
            $sum: '$cashBack',
          },
          feeCharges: {
            $sum: '$feeCharges',
          },
          revenue: {
            $sum: '$revenue',
          },
        },
      },
    ];
    const manager = getMongoManager();
    const gs = await manager.aggregate(Billing, agg).toArray();
    return gs;
  }

  async overviewMetrics(storeId: string, startFrom, toDate) {
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
          storeId: storeId,
        },
      },
      {
        $lookup: {
          from: 'groupshops',
          localField: 'groupShopId',
          foreignField: 'id',
          as: 'result',
        },
      },
      {
        $match: {
          $and: [
            {
              'result.createdAt': {
                $gte: new Date(`${startFrom}${'T00:00:01'}`),
              },
            },
            {
              $or: [
                {
                  'result.createdAt': {
                    $lte: new Date(`${toDate}${'T23:59:59'}`),
                  },
                },
                {
                  'result.expiredAt': fullDate === toDate ? null : '',
                },
              ],
            },
          ],
        },
      },
      {
        $addFields: {
          feeCharges: {
            $cond: {
              if: {
                $ne: ['$type', 1],
              },
              then: {
                $ceil: '$feeCharges',
              },
              else: 0,
            },
          },
        },
      },
      {
        $group: {
          _id: null,
          cashBack: {
            $sum: '$cashBack',
          },
          feeCharges: {
            $sum: '$feeCharges',
          },
          revenue: {
            $sum: '$revenue',
          },
        },
      },
    ];
    const manager = getMongoManager();
    const gs = await manager.aggregate(Billing, agg).toArray();
    console.log(gs);
    return gs;
  }

  async findTotalRevenue(storeId: string) {
    const agg = [
      {
        $match: {
          storeId: storeId,
        },
      },
      {
        $group: {
          _id: '$storeId',
          revenue: {
            $sum: '$revenue',
          },
        },
      },
    ];
    // console.log("🚀 findMonthlyBilling ~ agg", agg)
    const manager = getMongoManager();
    const TotalRev = await manager.aggregate(Billing, agg).toArray();
    // console.log('🚀 findMonthlyBilling ~ TotalRevenue', TotalRev);
    const value = TotalRev.length > 0 ? TotalRev[0] : { _id: '', revenue: 0 };
    return value;
  }

  async update(id: string, updateBillingInput: UpdateBillingInput) {
    // console.log(
    //   '🚀 ~ file:BillingsService updateBillingInput',
    //   updateBillingInput,
    // );

    await this.billingRepository.update({ id }, updateBillingInput);
    return await this.findOneById(id);
  }

  async updateOne(criteria: any, updateLiteral: any) {
    const manager = getMongoManager();
    manager.updateOne(Billing, criteria, { $set: updateLiteral });
  }

  remove(id: string) {
    return this.billingRepository.delete(id);
  }

  async removeByShop(storeId: string) {
    return await this.billingRepository.delete({ storeId });
  }

  async getBillingByDate(storeId: string, sdate: any, edate: any) {
    const agg = [
      {
        $match: {
          storeId: storeId,
        },
      },
      {
        $match: {
          createdAt: {
            $gte: sdate, //new Date('Fri, 01 Apr 2022 19:00:00 GMT'),
            $lte: edate, //new Date('Mon, 25 Apr 2022 23:59:00 GMT')
          },
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
        $project: {
          id: 1,
          type: 1,
          feeCharges: 1,
          cashBack: 1,
          groupShopId: 1,
          storeId: 1,
          revenue: 1,
          createdAt: 1,
          updatedAt: 1,
          store: 1,
          plan: 1,
          createdTodayGS: {
            $cond: {
              if: {
                $eq: ['$type', 1],
              },
              then: '$groupShopId',
              else: null,
            },
          },
          feeByGS: {
            $cond: {
              if: {
                $eq: ['$type', 1],
              },
              then: '$feeCharges',
              else: 0,
            },
          },
          feeByCashback: {
            $cond: {
              if: {
                $eq: ['$type', 0],
              },
              then: '$feeCharges',
              else: 0,
            },
          },
        },
      },
      {
        $group: {
          _id: {
            year: {
              $year: '$createdAt',
            },
            month: {
              $month: '$createdAt',
            },
            date: {
              $dayOfMonth: '$createdAt',
            },
          },
          totalCashback: {
            $sum: '$cashBack',
          },
          revenue: {
            $sum: '$revenue',
          },
          totalfeeByGS: {
            $sum: '$feeByGS',
          },
          totalfeeByCashback: {
            $sum: '$feeByCashback',
          },
          storePlan: {
            $first: '$store.plan',
          },
          feeplan: {
            $push: {
              _id: '$id',
              plan: '$plan',
              fee: '$feeCharges',
              type: '$type',
            },
          },
          uniquePlan: {
            $addToSet: '$plan',
          },
          uniqueGroupshop: {
            $addToSet: '$createdTodayGS',
          },
          badgeIds: {
            $addToSet: '$id',
          },
          store: {
            $first: '$store',
          },
          storeTotalGS: {
            $first: '$store.totalGroupShop',
          },
        },
      },
      {
        $addFields: {
          uniquePlan: {
            $cond: {
              if: {
                $gt: [
                  {
                    $size: '$uniquePlan',
                  },
                  0,
                ],
              },
              then: '$uniquePlan',
              else: ['$storePlan'],
            },
          },
        },
      },
      {
        $addFields: {
          todaysGS: {
            $filter: {
              input: '$uniqueGroupshop',
              as: 'd',
              cond: {
                $ne: ['$$d', null],
              },
            },
          },
        },
      },
      {
        $project: {
          totalCashback: 1,
          revenue: 1,
          uctotalfeeByCashback: 1,
          storePlan: 1,
          totalfeeByCashback: 1,
          totalfeeByGS: 1,
          store: 1,
          todaysTotalGS: {
            $size: '$todaysGS',
          },
          storeTotalGS: 1,
          badgeIds: 1,
          feeformGroupshop: {
            $map: {
              input: '$uniquePlan',
              as: 'plans',
              in: {
                $mergeObjects: [
                  {
                    plan: '$$plans',
                  },
                  {
                    totalGS: {
                      $size: {
                        $filter: {
                          input: '$feeplan',
                          cond: {
                            $eq: ['$$this.plan', '$$plans'],
                          },
                        },
                      },
                    },
                  },
                  {
                    totalCharged: {
                      $reduce: {
                        input: {
                          $filter: {
                            input: '$feeplan',
                            cond: {
                              $eq: ['$$this.plan', '$$plans'],
                            },
                          },
                        },
                        initialValue: 0,
                        in: {
                          $add: ['$$value', '$$this.fee'],
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
        $sort: {
          _id: 1,
        },
      },
    ];
    // console.log("🚀 findBillingBydate ~ agg", agg)
    const manager = getMongoManager();
    const TotalRev = await manager.aggregate(Billing, agg).toArray();
    // console.log('🚀 get billing by date', TotalRev);
    return TotalRev;
  }

  async bulkUpdate(billiingRecords: any) {
    const manager = getMongoManager();

    return await manager.bulkWrite(Billing, billiingRecords);
  }

  async currencyConversion(curfrom: string, amount: number) {
    try {
      const URL = `?access_key=${this.configService.get(
        'FIXER_API_KEY',
      )}&from=${curfrom}&to=USD&amount=${amount}&date=${
        new Date().toISOString().split('T')[0]
      }`;
      const apiUrl = `${this.configService.get('FIXER_API_URL')}${URL}`;

      const res = await lastValueFrom(
        this.httpService.get(apiUrl).pipe(map((res) => res.data)),
      );

      Logger.warn(res, BillingsService.name);
      // console.log('shortUrl : ' + res);
      return parseFloat(res['result'].toFixed(2)) ?? 0;
    } catch (err) {
      return 0;
      Logger.error(err, BillingsService.name);
    }
  }

  async findTotalGS(storeId: string) {
    const agg = [
      {
        $match: {
          storeId: storeId,
          type: 1,
        },
      },
      {
        $group: {
          _id: '$storeId',
          count: {
            $count: {},
          },
        },
      },
    ];
    const manager = getMongoManager();
    const TotalGS = await manager.aggregate(Billing, agg).toArray();
    console.log('🚀 TotalGSBilling ~ TotalGS', TotalGS);
    return TotalGS[0];
  }

  async getAllStoreBilling() {
    const agg = [
      {
        $match: {
          isPaid: false,
        },
      },
      {
        $project: {
          id: 1,
          type: 1,
          feeCharges: 1,
          cashBack: 1,
          groupShopId: 1,
          storeId: 1,
          feeByGS: {
            $cond: {
              if: {
                $eq: ['$type', 1],
              },
              then: '$feeCharges',
              else: 0,
            },
          },
          feeByCashback: {
            $cond: {
              if: {
                $eq: ['$type', 0],
              },
              then: '$feeCharges',
              else: 0,
            },
          },
        },
      },
      {
        $group: {
          _id: '$storeId',
          totalfeeByGS: {
            $sum: '$feeByGS',
          },
          totalfeeByCashback: {
            $sum: '$feeByCashback',
          },
          badgeIds: {
            $addToSet: '$id',
          },
          store: {
            $first: '$storeId',
          },
        },
      },
    ];
    // console.log("🚀 findMonthlyBilling ~ agg", agg)
    const manager = getMongoManager();
    const allStoreBilling = await manager.aggregate(Billing, agg).toArray();
    // console.log('🚀 all store billing', allStoreBilling);
    return allStoreBilling;
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
        $match: {
          $and: [
            {
              type: 1,
            },
            {
              plan: {
                $ne: 0,
              },
            },
          ],
        },
      },
      {
        $count: 'total',
      },
    ];

    const manager = getMongoManager();
    const gs = await manager.aggregate(Billing, agg).toArray();
    console.log({ gs }, 'total gss');
    return gs[0] ?? { total: 0 };
  }
  async getStoreMonthsCount(storeId: string) {
    const agg = [
      {
        $match: {
          storeId,
        },
      },
      {
        $group: {
          _id: {
            year: {
              $year: '$createdAt',
            },
            month: {
              $month: '$createdAt',
            },
          },
        },
      },
      {
        $count: 'count',
      },
    ];
    const manager = getMongoManager();
    const TotalGS = await manager.aggregate(Billing, agg).toArray();
    console.log('🚀 TotalGSBilling ~ TotalGS', TotalGS);
    return TotalGS[0];
  }
}
