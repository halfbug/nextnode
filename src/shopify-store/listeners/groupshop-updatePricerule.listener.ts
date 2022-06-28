import { Injectable } from '@nestjs/common';
import { OnEvent } from '@nestjs/event-emitter';
import { ShopifyService } from '../shopify/shopify.service';
import { StoreSavedEvent } from 'src/stores/events/store-saved.event';
import { StoresService } from 'src/stores/stores.service';
import { GSUpdatePriceRuleEvent } from 'src/groupshops/events/groupshop-update-price-rule.event';

@Injectable()
export class GSUpdatePriceRuleListener {
  constructor(
    private shopifyapi: ShopifyService,
    private storeService: StoresService,
  ) {}

  @OnEvent('groupshop.UpdatePriceRule')
  async updatePriceRule(event: GSUpdatePriceRuleEvent) {
    const {
      groupshop: {
        id,
        storeId,
        discountCode: { title, priceRuleId },
        createdAt,
        expiredAt,
      },
    } = event;
    const { shop, accessToken } = await this.storeService.findById(storeId);
    this.shopifyapi.accessToken = accessToken;
    this.shopifyapi.shop = shop;
    await this.shopifyapi.setDiscountCode(
      shop,
      'Update',
      accessToken,
      title,
      null,
      null,
      createdAt,
      expiredAt,
      priceRuleId,
    );
  }
}
