import { Injectable } from '@nestjs/common';
import { OnEvent } from '@nestjs/event-emitter';
import { RefAddedEvent } from 'src/groupshops/events/refferal-added.event';
import { StorePlanUpdatedEvent } from 'src/stores/events/plan-updated.event';
import { GS_CHARGE_CASHBACK, GS_FEES } from 'src/utils/constant';
// import { EventEmitter2 } from '@nestjs/event-emitter';
import { GroupShopCreated } from '../../groupshops/events/groupshop-created.event';
import { BillingsService } from '../billing.service';
import { CreateBillingInput } from '../dto/create-billing.input';
import { UpdateBillingInput } from '../dto/update-billing.input';
import { BillingTypeEnum } from '../entities/billing.entity';
import { CashBackEvent } from '../events/cashback.event';

@Injectable()
export class BillingListener {
  constructor(
    // private configSevice: ConfigService,
    // private eventEmitter: EventEmitter2,
    // private gsService: GroupshopsService,
    // private storeService: StoresService,
    private billingService: BillingsService,
  ) {}

  @OnEvent('plan.updated')
  async createBillingRecord(event: StorePlanUpdatedEvent) {
    const { id: storeId, plan, appTrialEnd } = event.store;
    const { id, members } = event.groupshop;
    // console.log(
    //   '🚀 ~ file: billing.listener.ts ~ line 28 ~ BillingListener ~ createBilling ~ members',
    //   members,
    // );

    const payload: CreateBillingInput = {
      type: BillingTypeEnum.ON_GS_CREATION,
      plan,
      feeCharges: GS_FEES[plan],
      revenue: 0,
      groupShopId: id,
      storeId,
      isPaid: plan === 0 || Date.now() < appTrialEnd.getTime() ? true : false,
    };
    console.log('🚀 ~ fileBillingListener  ~ payload', payload);
    const newBilling = await this.billingService.create(payload);
    // console.log(
    //   '🚀 ~ file: billing.listener.ts ~ line 35 ~ BillingListener ~ createBilling ~ newBilling',
    //   newBilling,
    // );
  }
  @OnEvent('cashback.generated')
  async createBillingForCashBack(event: CashBackEvent) {
    const { id, storeId } = event.groupshop;
    const { cashbackAmount, revenue, cashbackCharge } = event;
    console.log('🚀 ~ fileBillingListener  ~ event', event);

    const payload: CreateBillingInput = {
      type: BillingTypeEnum.ON_CASHBACK,
      cashBack: +cashbackAmount.toFixed(2),
      feeCharges: cashbackCharge,
      groupShopId: id,
      revenue,
      storeId,
      isPaid: false,
    };
    const newBilling = await this.billingService.create(payload);
    // console.log(
    //   '🚀 ~ file: billing.listener.ts ~ line 57 ~ BillingListener ~ createBillingForCashBack ~ newBilling',
    //   newBilling,
    // );
  }
  @OnEvent('refferal.added')
  async updateBillingForRevenue(event: RefAddedEvent) {
    // console.log('=========refferal added==========');
    // console.log(JSON.stringify(event));
    let totalPrice;
    const { groupshop } = event;
    console.log('🚀 ~ fileBillingListener  ~ event', event);
    const memLength = groupshop.members.length;
    // calculate owner product price and update revenue when first referral comes
    if (memLength === 2) {
      const owner = groupshop.members[0];
      totalPrice = owner.lineItems?.reduce(
        (priceSum: number, { price, quantity }) =>
          priceSum + quantity * parseFloat(price),
        0,
      );
      const payload: any = { revenue: totalPrice };
      const newBilling = await this.billingService.updateOne(
        { groupShopId: groupshop.id, type: 1 },
        payload,
      );
    }
    const availedDiscount = groupshop.members[memLength - 1].availedDiscount;
    console.log('groupshop.id', groupshop);
    const totalPr = groupshop.members[memLength - 1].lineItems?.reduce(
      (priceSum: number, { price, quantity }) => {
        const thisPrice = priceSum + quantity * parseFloat(price);
        console.log({ thisPrice });
        return thisPrice - (+thisPrice * availedDiscount) / 100;
      },
      0,
    );
    const payload1: CreateBillingInput = {
      type: BillingTypeEnum.ON_REFFERRAL_ADDED,
      groupShopId: event.groupshopId,
      storeId: groupshop.storeId,
      feeCharges: 0,
      revenue: +totalPr,
    };
    // console.log(
    //   '🚀 ~ file: billing.listener.ts ~ line 99 ~ BillingListener ~ updateBillingForRevenue ~ event.groupshopId',
    //   event.groupshopId,
    // );
    const newBilling = await this.billingService.create(payload1);
    console.log('🚀 BillingForRevenue', newBilling);
  }
}
