import { Injectable } from '@nestjs/common';
import { OnEvent } from '@nestjs/event-emitter';
// import moment from 'moment';
import { EventEmitter2 } from '@nestjs/event-emitter';
import { GroupShopCreated } from 'src/groupshops/events/groupshop-created.event';
import {
  GS_PLAN1_END_COUNT,
  GS_PLAN2_END_COUNT,
  GS_PLAN3_END_COUNT,
} from 'src/utils/constant';
import { BillingPlanEnum } from '../entities/store.entity';
// import { GroupshopsService } from 'src/groupshops/groupshops.service';
import { StoresService } from '../stores.service';

@Injectable()
export class StoreListener {
  constructor(
    private eventEmitter: EventEmitter2,
    // private gsService: GroupshopsService,
    private storeService: StoresService,
  ) {}

  @OnEvent('groupshop.created')
  async updateStore(event: GroupShopCreated) {
    console.log(
      '🚀 ~ file: store.listener.ts ~ line 21 ~ GSCreatedListener ~ updateStore ~ event',
      event,
    );
    console.log('................................');
    // update store totalgroupshop after this groupshop created

    const { id, totalGroupShop } = event.store;
    let { plan } = event.store;
    //check plan
    const newCount = totalGroupShop + 1;
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
    const payload = { id, plan, totalGroupShop: newCount };
    const updatedStore = await this.storeService.update(id, payload);
    console.log(
      '🚀 ~ file: store.listener.ts ~ line 32 ~ StoreListener ~ updateStore ~ updatedStore',
      updatedStore,
    );
  }
}
