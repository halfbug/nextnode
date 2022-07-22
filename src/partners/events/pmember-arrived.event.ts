import { EventEmitter2 } from '@nestjs/event-emitter';
import { Injectable } from '@nestjs/common';
import { Partnergroupshop } from '../entities/partner.modal';
import Orders from 'src/inventory/entities/orders.modal';
import Store from 'src/stores/entities/store.model';
import { CreateOrderInput as LineItem } from 'src/inventory/dto/create-order.input';

// 1st ref comes
@Injectable()
export class PMemberArrivedEvent {
  public pgroupshop: Partnergroupshop;
  public order: Orders;
  public store: Store;
  public lineItems: LineItem[];
  constructor(private eventEmitter: EventEmitter2) {}
  emit() {
    this.eventEmitter.emit('pmember.arrived', this);
  }
}
