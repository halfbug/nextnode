import { Global, Module } from '@nestjs/common';
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

@Global()
@Module({
  imports: [
    ConfigModule,
    HttpModule,
    TypeOrmModule.forFeature([Store]),
    StoresModule,
  ],
  providers: [
    StoreService,
    ShopifyService,
    TokenReceivedListener,
    InvenotrySavedListener,
  ],
  controllers: [ShopifyStoreController, WebhooksController],
  exports: [StoreService, ShopifyService],
})
export class ShopifyStoreModule {}
