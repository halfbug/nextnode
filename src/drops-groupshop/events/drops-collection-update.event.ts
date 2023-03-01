import { EventBase } from 'src/utils/event.base';
import { EventEmitter2 } from '@nestjs/event-emitter';
import { Injectable } from '@nestjs/common';
import { Collections, Drops } from '../../stores/entities/store.entity';

@Injectable()
export class DropsCollectionUpdatedEvent extends EventBase {
  constructor(private eventEmitter: EventEmitter2) {
    super();
  }
  public collections: Collections[];
  public dropsGroupshops: any;
  public storeId: string;
  public drops: any;
  emit() {
    this.eventEmitter.emit('dropsCollection.updated', this);
  }
}
