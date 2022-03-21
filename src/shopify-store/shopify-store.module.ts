import { forwardRef, Global, Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { StoreService } from './store/store.service';
import { ShopifyStoreController } from './shopify-store.controller';
import { ShopifyService } from './shopify/shopify.service';
import { HttpModule } from '@nestjs/axios';
import { TokenReceivedListener } from './listeners/token-received.listener';
import { WebhooksController } from './webhooks/webhooks.controller';
// import { StoresModule } from 'src/stores/stores.module';
import { TypeOrmModule } from '@nestjs/typeorm';
import Store from 'src/stores/entities/store.model';
import { StoresModule } from 'src/stores/stores.module';
import { InvenotrySavedListener } from './listeners/inventory-saved.listener';
import { InventoryModule } from 'src/inventory/inventory.module';

// import { AwsService } from './aws.service';
import { UploadImageModule } from './ImageUpload/uploadimage.module';
import { CampaignsModule } from 'src/campaigns/campaigns.module';
import { GroupshopsModule } from 'src/groupshops/groupshops.module';
import { BillingModule } from 'src/billing/billing.module';
// import { GroupshopsModule } from 'src/groupshops/groupshops.module';
import { ThemeAppExtensionController } from './theme-app-extension/theme-app-extension.controller';
@Global()
@Module({
  imports: [
    ConfigModule,
    HttpModule,
    TypeOrmModule.forFeature([Store]),
    StoresModule,
    InventoryModule,
    CampaignsModule,
    forwardRef(() => GroupshopsModule),
    UploadImageModule,
    BillingModule,
  ],
  providers: [
    StoreService,
    ShopifyService,
    TokenReceivedListener,
    InvenotrySavedListener,
    StoresModule,
  ],
  controllers: [ShopifyStoreController, WebhooksController, ThemeAppExtensionController],
  exports: [StoreService, ShopifyService],
})
export class ShopifyStoreModule {}
