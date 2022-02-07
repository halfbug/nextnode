import { forwardRef, Module } from '@nestjs/common';
import { GroupshopsService } from './groupshops.service';
import { GroupshopsResolver } from './groupshops.resolver';

import { OrderPlacedListener } from './listeners/order-placed.listener';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Groupshops } from './entities/groupshop.modal';
import { DefaultColumnsService } from 'src/utils/default-columns/default-columns.service';

import { ShopifyStoreModule } from 'src/shopify-store/shopify-store.module';
import { UtilsModule } from 'src/utils/utils.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([Groupshops]),
    DefaultColumnsService,
    forwardRef(() => ShopifyStoreModule),
    UtilsModule,
  ],
  providers: [GroupshopsResolver, GroupshopsService, OrderPlacedListener],
  exports: [GroupshopsService],
})
export class GroupshopsModule {}
