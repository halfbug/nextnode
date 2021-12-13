import { Module } from '@nestjs/common';
import { GroupshopsService } from './groupshops.service';
import { GroupshopsResolver } from './groupshops.resolver';
import { ShopifyStoreModule } from 'src/shopify-store/shopify-store.module';
import { OrderPlacedListener } from './listeners/order-placed.listener';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Groupshops } from './entities/groupshop.modal';
import { DefaultColumnsService } from 'src/utils/default-columns/default-columns.service';

@Module({
  imports: [
    TypeOrmModule.forFeature([Groupshops]),
    DefaultColumnsService,
    ShopifyStoreModule,
  ],
  providers: [GroupshopsResolver, GroupshopsService, OrderPlacedListener],
})
export class GroupshopsModule {}
