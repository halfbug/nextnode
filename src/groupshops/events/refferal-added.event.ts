import { EventEmitter2 } from '@nestjs/event-emitter';
import { Injectable } from '@nestjs/common';
import { Groupshops } from '../entities/groupshop.modal';

// 1st ref comes
@Injectable()
export class RefAddedEvent {
  public groupshop: Groupshops;
  constructor(private eventEmitter: EventEmitter2) {}
  emit() {
    this.eventEmitter.emit('refferal.added', this);
  }
}
