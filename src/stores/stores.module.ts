import { Module } from '@nestjs/common';
import { StoresService } from './stores.service';
import { StoresResolver } from './stores.resolver';
import { DefaultColumnsService } from 'src/utils/default-columns/default-columns.service';
import { TypeOrmModule } from '@nestjs/typeorm';
import Store from './entities/store.model';
import { ShopifyAPIListener } from './listeners/shopify.listener';
import { StoreListener } from './listeners/store.listener';

@Module({
  imports: [TypeOrmModule.forFeature([Store]), DefaultColumnsService],
  providers: [StoresResolver, StoresService, ShopifyAPIListener, StoreListener],
  exports: [StoresService],
})
export class StoresModule {}
