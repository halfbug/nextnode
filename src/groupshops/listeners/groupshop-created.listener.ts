import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { OnEvent } from '@nestjs/event-emitter';
// import moment from 'moment';
import { EventEmitter2 } from '@nestjs/event-emitter';
import { GroupShopCreated } from '../events/groupshop-created.event';
import { GroupshopsService } from '../groupshops.service';
import { StoresService } from '../../stores/stores.service';

@Injectable()
export class GSCreatedListener {
  constructor(
    private configSevice: ConfigService,
    private eventEmitter: EventEmitter2,
    private gsService: GroupshopsService,
    private storeService: StoresService,
  ) {}

  @OnEvent('groupshop.created')
  async updateStore(event: GroupShopCreated) {
    console.log(
      '🚀 ~ file: groupshop-created.listener.ts ~ line 35 ~ GSCreatedListener ~ updateStore ~ event',
      event,
    );
    // update store totalgroupshop after this groupshop created

    // const { storeId } = event;
    // const updatedStore = this.storeService.update(id: storeId, payload);
  }
}
