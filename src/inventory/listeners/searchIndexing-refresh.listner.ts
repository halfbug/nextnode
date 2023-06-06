import { Injectable, Logger } from '@nestjs/common';
import { OnEvent } from '@nestjs/event-emitter';
import { ShopifyService } from 'src/shopify-store/shopify/shopify.service';
import { StoresService } from 'src/stores/stores.service';
import { InventoryService } from '../inventory.service';
import { SearchIndexingRefreshEvent } from '../events/searchIndexing-refresh.event';

@Injectable()
export class SearchIndexingListener {
  constructor(
    private storesService: StoresService,
    public shopifyService: ShopifyService,
    private inventryService: InventoryService,
  ) {}
  @OnEvent('searchIndexing.refresh')
  async handleSearchIndexingEvent(event: SearchIndexingRefreshEvent) {
    try {
      console.log('searchIndexing.refresh', event.shopName);
      const store = await this.storesService.findOne(event.shopName);
      if (store?.drops?.status === 'Active') {
        await this.inventryService.createSearchIndex(event.shopName);
      }
    } catch (err) {
      console.log({ err });
      Logger.error(err, SearchIndexingListener.name);
    }
  }
}
