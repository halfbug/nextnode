import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { BillingsService } from 'src/billing/billing.service';
import { CampaignsService } from 'src/campaigns/campaigns.service';
import { GroupshopsService } from 'src/groupshops/groupshops.service';
import { EventType } from 'src/gs-common/entities/lifecycle.modal';
import { LifecycleService } from 'src/gs-common/lifecycle.service';
import { VistorsService } from 'src/gs-common/vistors.service';
import { InventoryService } from 'src/inventory/inventory.service';
import { OrdersService } from 'src/inventory/orders.service';
import { PartnerService } from 'src/partners/partners.service';
import { ShopifyService } from 'src/shopify-store/shopify/shopify.service';
import { UpdateStoreInput } from './dto/update-store.input';
import { BillingPlanEnum } from './entities/store.entity';
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
    private readonly lifecyclesrv: LifecycleService,
    private partnerGSSrv: PartnerService,
    private visitorSrv: VistorsService,
  ) {}

  async deleteStoreByName(shop: string) {
    try {
      //   const shop = 'native-roots-dev.myshopify.com';
      const store: UpdateStoreInput = await this.storesService.findOne(shop);
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
      // await this.storesService.removeShop(shop);
      await this.billingService.removeByShop(store.id);
      await this.partnerGSSrv.removeShop(store.id);
      store.status = 'Uninstalled';
      store.installationStep = 0;
      store.totalGroupShop = 0;
      store.plan = BillingPlanEnum.EXPLORE;
      store.logoImage = '';
      store.brandName = '';
      store.settings = null;
      store.subscription.status = 'Zero Trial';
      await this.storesService.update(store.id, store);
      this.lifecyclesrv.create({
        storeId: store.id,
        event: EventType.uninstalled,
        dateTime: new Date(),
      });
      Logger.debug(`${shop}--uninstalled`, UninstallService.name);
    } catch (error) {
      return error.message;
    }
  }
}
