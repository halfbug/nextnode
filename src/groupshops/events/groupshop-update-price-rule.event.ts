import { EventEmitter2 } from '@nestjs/event-emitter';
import { Injectable } from '@nestjs/common';
import { Groupshops } from 'src/groupshops/entities/groupshop.modal';

// 1st ref comes
@Injectable()
export class GSUpdatePriceRuleEvent {
  public groupshop?: Groupshops;
  public endDate?: Date;
  constructor(private eventEmitter: EventEmitter2) {}
  emit() {
    this.eventEmitter.emit('groupshop.UpdatePriceRule', this);
  }
}
