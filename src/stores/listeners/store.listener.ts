import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { OnEvent } from '@nestjs/event-emitter';
// import moment from 'moment';
import { EventEmitter2 } from '@nestjs/event-emitter';
import { GroupShopCreated } from 'src/groupshops/events/groupshop-created.event';
// import { GroupshopsService } from 'src/groupshops/groupshops.service';
import { StoresService } from '../stores.service';

@Injectable()
export class StoreListener {
  constructor(
    private configSevice: ConfigService,
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

    const { id, plan, totalGroupShop } = event.store;
    const newCount = totalGroupShop + 1;
    const payload = { id, plan, totalGroupShop: newCount };
    const updatedStore = await this.storeService.update(id, payload);
    console.log(
      '🚀 ~ file: store.listener.ts ~ line 32 ~ StoreListener ~ updateStore ~ updatedStore',
      updatedStore,
    );
  }
}
