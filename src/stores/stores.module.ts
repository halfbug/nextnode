import { Module } from '@nestjs/common';
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

@Module({
  imports: [
    TypeOrmModule.forFeature([Store]),
    // AnyScalar,
    DefaultColumnsService,
  ],
  providers: [
    StoresResolver,
    StoresService,
    ShopifyAPIListener,
    StoreListener,
    AddResourceListener,
    AddResourceEvent,
    StoreSavedEvent,
  ],
  exports: [StoresService, AddResourceEvent, StoreSavedEvent],
})
export class StoresModule {}
