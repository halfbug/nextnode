import { EventBase } from 'src/utils/event.base';
import { EventEmitter2 } from '@nestjs/event-emitter';
import { Injectable } from '@nestjs/common';
import Store from '../entities/store.model';
import { Groupshops } from 'src/groupshops/entities/groupshop.modal';

//add.resource
@Injectable()
export class StorePlanUpdatedEvent extends EventBase {
  public store: Store;
  public groupshop: Groupshops;
  public revenue: number;

  constructor(private eventEmitter: EventEmitter2) {
    super();
  }
  emit() {
    this.eventEmitter.emit('plan.updated', this);
  }
}
