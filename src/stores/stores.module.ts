import { forwardRef, Module } from '@nestjs/common';
import { StoresService } from './stores.service';
import { StoresResolver } from './stores.resolver';
import { DefaultColumnsService } from 'src/utils/default-columns/default-columns.service';
import { TypeOrmModule } from '@nestjs/typeorm';
import Store from './entities/store.model';
import { ShopifyAPIListener } from './listeners/shopify.listener';
import { StoreListener } from './listeners/store.listener';
import { AnyScalar } from 'src/utils/any.scalarType';
import { AddResourceListener } from './listeners/add-resource.listener';
import { AddResourceEvent } from './events/add-resource.event';
import { StoreSavedEvent } from './events/store-saved.event';
import { StorePlanUpdatedEvent } from './events/plan-updated.event';
import { UninstallService } from './uninstall.service';
import { BillingModule } from 'src/billing/billing.module';
// import { CampaignsModule } from 'src/campaigns/campaigns.module';
import { GroupshopsModule } from 'src/groupshops/groupshops.module';
import { InventoryModule } from 'src/inventory/inventory.module';
import { CampaignsModule } from 'src/campaigns/campaigns.module';
import { ShopifyStoreModule } from 'src/shopify-store/shopify-store.module';
import { CampaignInActiveListener } from './listeners/campaign-inactive.listener';
import { GsCommonModule } from 'src/gs-common/gs-common.module';
import { PartnersModule } from 'src/partners/partners.module';
import { RetentiontoolsModule } from 'src/retentiontools/retentiontools.module';
import { StoreUpdatePlanCron } from './store.cron';

@Module({
  imports: [
    TypeOrmModule.forFeature([Store]),
    // AnyScalar,
    DefaultColumnsService,
    forwardRef(() => ShopifyStoreModule),
    InventoryModule,
    forwardRef(() => CampaignsModule),
    forwardRef(() => RetentiontoolsModule),
    GroupshopsModule,
    PartnersModule,
    forwardRef(() => BillingModule),
    GsCommonModule,
  ],
  providers: [
    StoresResolver,
    StoresService,
    ShopifyAPIListener,
    StoreListener,
    AddResourceListener,
    AddResourceEvent,
    StoreSavedEvent,
    StorePlanUpdatedEvent,
    UninstallService,
    CampaignInActiveListener,
    StoreUpdatePlanCron,
  ],
  exports: [
    StoresService,
    AddResourceEvent,
    StoreSavedEvent,
    StorePlanUpdatedEvent,
    UninstallService,
  ],
})
export class StoresModule {}
