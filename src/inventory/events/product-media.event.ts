import { EventEmitter2 } from '@nestjs/event-emitter';
import { Injectable } from '@nestjs/common';

// 1st ref comes
@Injectable()
export class ProductMediaObject {
  public productId: string;
  public shopName: string;
  constructor(private eventEmitter: EventEmitter2) {}
  emit() {
    this.eventEmitter.emit('product.media', this);
  }
}
