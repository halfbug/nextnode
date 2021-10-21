import { Global, Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { StoreService } from './store/store.service';
import { ShopifyStoreController } from './shopify-store.controller';
import { ConfigService } from '@nestjs/config';
import Shopify, { ApiVersion, AuthQuery } from '@shopify/shopify-api';

@Global()
@Module({
  imports: [ConfigModule],
  providers: [StoreService],
  controllers: [ShopifyStoreController],
})
export class ShopifyStoreModule {
  protected shopify;
  constructor(private configService: ConfigService) {
    this.shopify = Shopify.Context.initialize({
      API_KEY: configService.get('SHOPIFY_API_KEY'),
      API_SECRET_KEY: configService.get('SHOPIFY_API_SECRET'),
      SCOPES: configService.get('SCOPES').split(','),
      HOST_NAME: configService.get('HOST').replace(/https:\/\//, ''),
      API_VERSION: ApiVersion.October20,
      IS_EMBEDDED_APP: false,
      // This should be replaced with your preferred storage strategy
      SESSION_STORAGE: new Shopify.Session.MemorySessionStorage(),
    });
  }
}
