import { forwardRef, Global, Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ConfigModule } from '@nestjs/config';
import { GsCommonModule } from 'src/gs-common/gs-common.module';
import { DefaultColumnsService } from 'src/utils/default-columns/default-columns.service';
import { HttpModule } from '@nestjs/axios';
import { RetentiontoolsService } from './retentiontools.service';
import { RetentiontoolsResolver } from './retentiontools.resolver';
import { StoresModule } from 'src/stores/stores.module';
import { Retentiontool } from './entities/retention.modal';
import { ShopifyStoreModule } from 'src/shopify-store/shopify-store.module';
import { RTPCreatedEvent } from './events/create-retention-tools.event';
import { RTSSavedListener } from './listeners/retentiontools-groupshop-saved.listener';
import { InventoryModule } from 'src/inventory/inventory.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([Retentiontool]),
    DefaultColumnsService,
    forwardRef(() => ShopifyStoreModule),
    forwardRef(() => StoresModule),
    forwardRef(() => GsCommonModule),
    forwardRef(() => InventoryModule),
    ConfigModule,
    HttpModule,
  ],
  providers: [
    RetentiontoolsResolver,
    RetentiontoolsService,
    RTPCreatedEvent,
    RTSSavedListener,
  ],
})
export class RetentiontoolsModule {}
