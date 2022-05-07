import { forwardRef, Module } from '@nestjs/common';
import { GroupshopsService } from './groupshops.service';
import { GroupshopsResolver } from './groupshops.resolver';

import { OrderPlacedListener } from './listeners/order-placed.listener';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Groupshops } from './entities/groupshop.modal';
import { DefaultColumnsService } from 'src/utils/default-columns/default-columns.service';
import { EmailModule } from 'src/email/email.module';
import { ShopifyStoreModule } from 'src/shopify-store/shopify-store.module';
import { UtilsModule } from 'src/utils/utils.module';
import { RefAddedEvent } from './events/refferal-added.event';

@Module({
  imports: [
    EmailModule,
    TypeOrmModule.forFeature([Groupshops]),
    DefaultColumnsService,
    forwardRef(() => ShopifyStoreModule),
    UtilsModule,
  ],
  providers: [
    GroupshopsResolver,
    GroupshopsService,
    OrderPlacedListener,
    RefAddedEvent,
  ],
  exports: [GroupshopsService, RefAddedEvent],
})
export class GroupshopsModule {}
