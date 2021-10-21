import { Global, Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { StoreService } from './store/store.service';
import { ShopifyStoreController } from './shopify-store.controller';
import { ProductService } from './product/product.service';
import { ShopifyService } from './shopify/shopify.service';
import { HttpModule } from '@nestjs/axios';

@Global()
@Module({
  imports: [ConfigModule, HttpModule],
  providers: [StoreService, ProductService, ShopifyService],
  controllers: [ShopifyStoreController],
  exports: [StoreService, ProductService, ShopifyService],
})
export class ShopifyStoreModule {}
