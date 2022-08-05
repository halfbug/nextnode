import { Injectable } from '@nestjs/common';
import { OnEvent } from '@nestjs/event-emitter';
import { EventType } from 'src/gs-common/entities/lifecycle.modal';
import { LifecycleService } from 'src/gs-common/lifecycle.service';
import { TokenReceivedEvent } from 'src/shopify-store/events/token-received.event';
import { CreateStoreInput } from '../dto/create-store.input';
import { UpdateStoreInput } from '../dto/update-store.input';
import { StoreSavedEvent } from '../events/store-saved.event';
import { StoresService } from '../stores.service';

@Injectable()
export class ShopifyAPIListener {
  constructor(
    private storeService: StoresService,
    private storeSavedEvent: StoreSavedEvent,
    private readonly lifecyclesrv: LifecycleService,
  ) {}
  @OnEvent('token.received')
  async handleTokenReceivedEvent(event: TokenReceivedEvent) {
    const {
      token,
      session: { shop, id },
    } = event;
    const store: CreateStoreInput =
      (await this.storeService.findOne(shop)) ?? new CreateStoreInput();
    store.accessToken = token;
    store.shop = shop;
    store.shopifySessionId = id;
    store.installationStep = 0;
    store.resources = [];
    store.hideProducts = [];

    this.storeService.createORupdate(store).then((sstore) => {
      console.log('store---------------------------saved');
      // console.log(sstore);
      this.storeSavedEvent.accessToken = sstore.accessToken;
      this.storeSavedEvent.shop = sstore.shop;
      this.storeSavedEvent.storeId = sstore.id;
      this.storeSavedEvent.emit();
      console.log('done');
      this.lifecyclesrv.create({
        storeId: store.id,
        event: EventType.installed,
        dateTime: new Date(),
      });
    });
  }
}
