import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { BillingsService } from 'src/billing/billing.service';
import { CampaignsService } from 'src/campaigns/campaigns.service';
import { GroupshopsService } from 'src/groupshops/groupshops.service';
import { InventoryService } from 'src/inventory/inventory.service';
import { OrdersService } from 'src/inventory/orders.service';
import { ShopifyService } from 'src/shopify-store/shopify/shopify.service';
import { StoresService } from './stores.service';

@Injectable()
export class UninstallService {
  constructor(
    private inventorySrv: InventoryService,
    private campaignSrv: CampaignsService,
    private ordersSrv: OrdersService,
    private groupshopSrv: GroupshopsService,
    private storesService: StoresService,
    private billingService: BillingsService,
    private shopifyService: ShopifyService,
    private configService: ConfigService,
  ) {}

  async deleteStoreByName(shop: string) {
    try {
      //   const shop = 'native-roots-dev.myshopify.com';
      const store = await this.storesService.findOne(shop);
      this.shopifyService.accessToken = store.accessToken;
      this.shopifyService.shop = shop;
      if (store?.resources?.length > 0)
        store?.resources?.map((res) => {
          if (res.type === 'scriptTag') {
            this.shopifyService.scriptTagDelete(res.id);
          }
        });
      await this.inventorySrv.removeShop(shop);
      await this.ordersSrv.removeShop(shop);
      await this.campaignSrv.removeShop(store.id);
      await this.groupshopSrv.removeShop(store.id);
      await this.storesService.removeShop(shop);
      await this.billingService.removeByShop(store.id);
      Logger.debug(`${shop}--uninstalled`, UninstallService.name);
    } catch (error) {
      return error.message;
    }
  }
}
