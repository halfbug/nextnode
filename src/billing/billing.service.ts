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
          'totalCashBack': {
            '$sum': '$totalCashBack'
          }, 
          'revenue': {
            '$sum': '$revenue'
          }, 
          'amount': {
            '$sum': '$amount'
          }, 
          'count': {
            '$count': {}
          }
        }
      }
    ];
    console.log("🚀 findMonthlyBilling ~ agg", agg)
    const manager = getMongoManager();
    const gs = await manager.aggregate(Billing, agg).toArray();
    console.log("🚀 findMonthlyBilling ~ gs", gs)
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
}
