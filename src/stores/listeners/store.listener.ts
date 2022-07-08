import { Injectable } from '@nestjs/common';
import { OnEvent } from '@nestjs/event-emitter';
// import moment from 'moment';
import { EventEmitter2 } from '@nestjs/event-emitter';
import { BillingsService } from 'src/billing/billing.service';
import { GroupShopCreated } from 'src/groupshops/events/groupshop-created.event';
import { GroupshopsService } from 'src/groupshops/groupshops.service';
import {
  GS_PLAN1_END_COUNT,
  GS_PLAN2_END_COUNT,
  GS_PLAN3_END_COUNT,
} from 'src/utils/constant';
import { DateFormats, monthsArr } from 'src/utils/functions';
import { BillingPlanEnum } from '../entities/store.entity';
import { StorePlanUpdatedEvent } from '../events/plan-updated.event';
// import { GroupshopsService } from 'src/groupshops/groupshops.service';
import { StoresService } from '../stores.service';

@Injectable()
export class StoreListener {
  constructor(
    private planUpdateEvent: StorePlanUpdatedEvent,
    // private gsService: GroupshopsService,
    private storeService: StoresService,
    private groupshopService: GroupshopsService,
  ) {}

  @OnEvent('groupshop.created')
  async updateStore(event: GroupShopCreated) {
    // console.log(
    //   '🚀 ~ file: store.listener.ts ~ line 21 ~ GSCreatedListener ~ updateStore ~ event',
    //   event,
    // );
    // console.log('................................');
    // update store totalgroupshop after this groupshop created

    const { id, totalGroupShop } = event.store;
    const storeId = id;
    let { plan } = event.store;
    const { createdAt } = event.groupshop;
    const month = (createdAt.getMonth() + 1).toString();
    const year = createdAt.getFullYear().toString();
    const { sdate, edate } = DateFormats(month, year);

    const total = await this.groupshopService.countOfGsMonthly(
      storeId,
      month,
      year,
    );
    console.log('🚀 ~ updateStore ~ createdAt', createdAt);
    console.log('🚀 ~ updateStore ~ sdate', sdate);
    console.log('🚀 ~ updateStore ~ edate', edate);
    const newCount = (total.count ?? 0) + 1;
    // const newCount = 101;

    //check plan
    // check GS count of current month-year
    if (newCount <= GS_PLAN1_END_COUNT) {
      plan = BillingPlanEnum.EXPLORE;
    } else if (
      newCount > GS_PLAN1_END_COUNT &&
      newCount <= GS_PLAN2_END_COUNT
    ) {
      plan = BillingPlanEnum.LAUNCH;
    } else if (
      newCount > GS_PLAN2_END_COUNT &&
      newCount <= GS_PLAN3_END_COUNT
    ) {
      plan = BillingPlanEnum.GROWTH;
    } else {
      plan = BillingPlanEnum.ENTERPRISE;
    }
    const payload = { id, plan, totalGroupShop: (totalGroupShop ?? 0) + 1 };
    const updatedStore = await this.storeService.update(id, payload);
    // console.log(
    //   '🚀 ~ file: store.listener.ts ~ line 32 ~ StoreListener ~ updateStore ~ updatedStore',
    //   updatedStore,
    // );

    this.planUpdateEvent.store = updatedStore;
    this.planUpdateEvent.groupshop = event.groupshop;
    this.planUpdateEvent.revenue = event.revenue;
    this.planUpdateEvent.emit();
  }
}
