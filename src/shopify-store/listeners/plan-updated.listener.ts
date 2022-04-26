import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { OnEvent } from '@nestjs/event-emitter';
import { ShopifyService } from '../shopify/shopify.service';
import { AddResourceEvent } from 'src/stores/events/add-resource.event';
import { StoreSavedEvent } from 'src/stores/events/store-saved.event';
import { StorePlanUpdatedEvent } from 'src/stores/events/plan-updated.event';

@Injectable()
export class StoreSavedListener {
  constructor(
    private shopifyapi: ShopifyService,
    private configService: ConfigService,
    private addResourceEvent: AddResourceEvent,
  ) {}

  private shop: string;
  // update Plan In Shopify Billing Subscription
  @OnEvent('plan.updated')
  async updateSubscription(event: StorePlanUpdatedEvent) {
    const { accessToken, shop } = event.store;
    this.shopifyapi.accessToken = accessToken;
    this.shopifyapi.shop = shop;
  }
}
