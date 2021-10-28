import { Injectable } from '@nestjs/common';
import { OnEvent } from '@nestjs/event-emitter';
import { TokenReceivedEvent } from 'src/shopify-store/events/token-received.event';
import { CreateStoreInput } from '../dto/create-store.input';
import { StoresService } from '../stores.service';

@Injectable()
export class ShopifyAPIListener {
  constructor(private storeService: StoresService) {}
  @OnEvent('token.received')
  handleTokenReceivedEvent(event: TokenReceivedEvent) {
    const store = new CreateStoreInput();
    store.accessToken = event.token;
    store.shop = event.session.shop;
    store.shopifySessionId = event.session.id;
    store.installationStep = 0;
    this.storeService.create(store).then((res) => {
      console.log(res);
      console.log('done');
    });
  }
}
