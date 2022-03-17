import { Injectable } from '@nestjs/common';
import { OnEvent } from '@nestjs/event-emitter';
import { GS_CHARGE_CASHBACK } from 'src/utils/constant';
// import { EventEmitter2 } from '@nestjs/event-emitter';
import { GroupShopCreated } from '../../groupshops/events/groupshop-created.event';
import { BillingsService } from '../billing.service';
import { CreateBillingInput } from '../dto/create-billing.input';
import { BillingTypeEnum } from '../entities/billing.entity';

@Injectable()
export class BillingListener {
  constructor(
    // private configSevice: ConfigService,
    // private eventEmitter: EventEmitter2,
    // private gsService: GroupshopsService,
    // private storeService: StoresService,
    private billingService: BillingsService,
  ) {}

  @OnEvent('groupshop.created')
  async createBilling(event: GroupShopCreated) {
    const { id: storeId, plan, totalGroupShop } = event.store;
    const { id, members } = event.groupshop;
    console.log(
      '🚀 ~ file: billing.listener.ts ~ line 28 ~ BillingListener ~ createBilling ~ members',
      members,
    );
    // let totalRefund = 0;
    // const totalCashBack = members.map((item) => {
    //   totalRefund = totalRefund + item.refund;
    // })
    const payload: CreateBillingInput = {
      type: BillingTypeEnum.ON_GS_CREATION,
      totalCashBack: 0,
      amount: 0,
      groupShopId: id,
      storeId,
    };
    const newBilling = await this.billingService.create(payload);
    console.log(
      '🚀 ~ file: billing.listener.ts ~ line 35 ~ BillingListener ~ createBilling ~ newBilling',
      newBilling,
    );
  }
}
