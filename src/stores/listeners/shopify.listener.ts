import { Injectable } from '@nestjs/common';
import { OnEvent } from '@nestjs/event-emitter';
import { TokenReceivedEvent } from 'src/shopify-store/events/token-received.event';
import { CreateStoreInput } from '../dto/create-store.input';
import { StoreSavedEvent } from '../events/store-saved.event';
import { StoresService } from '../stores.service';

@Injectable()
export class ShopifyAPIListener {
  constructor(
    private storeService: StoresService,
    private storeSavedEvent: StoreSavedEvent,
  ) {}
  @OnEvent('token.received')
  handleTokenReceivedEvent(event: TokenReceivedEvent) {
    const store = new CreateStoreInput();
    store.accessToken = event.token;
    store.shop = event.session.shop;
    store.shopifySessionId = event.session.id;
    store.installationStep = 0;
    store.resources = [];
    this.storeService.create(store).then((sstore) => {
      console.log('store---------------------------saved');
      console.log(sstore);
      this.storeSavedEvent.accessToken = sstore.accessToken;
      this.storeSavedEvent.shop = sstore.shop;
      this.storeSavedEvent.storeId = sstore.id;
      this.storeSavedEvent.emit();
      console.log('done');
    });
  }
}
