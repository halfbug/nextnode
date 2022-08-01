import { EventEmitter2 } from '@nestjs/event-emitter';
import { Injectable } from '@nestjs/common';
import { Partnergroupshop } from '../entities/partner.modal';

// 1st ref comes
@Injectable()
export class GSPCreatedEvent {
  public groupshop: Partnergroupshop;
  public email: string;
  public shop: string;
  public brandName: string;
  public brandLogo: string;
  public accessToken: string;
  constructor(private eventEmitter: EventEmitter2) {}
  emit() {
    this.eventEmitter.emit('groupshop-partner.saved', this);
  }
}
