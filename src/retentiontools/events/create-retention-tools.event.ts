import { EventEmitter2 } from '@nestjs/event-emitter';
import { Injectable } from '@nestjs/common';
import { Retentiontool } from '../entities/retention.modal';

// 1st ref comes
@Injectable()
export class RTPCreatedEvent {
  public storeId: string;
  public shop: string;
  public startDate: string;
  public endDate: string;
  public minOrderValue: string;
  constructor(private eventEmitter: EventEmitter2) {}
  emit() {
    this.eventEmitter.emit('retention-tools-groupshop.saved', this);
  }
}
