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
import { GsCommonModule } from 'src/gs-common/gs-common.module';
import { GSUpdatePriceRuleEvent } from './events/groupshop-update-price-rule.event';
import { PartnersModule } from 'src/partners/partners.module';

@Module({
  imports: [
    EmailModule,
    TypeOrmModule.forFeature([Groupshops]),
    DefaultColumnsService,
    forwardRef(() => ShopifyStoreModule),
    UtilsModule,
    forwardRef(() => GsCommonModule),
    forwardRef(() => PartnersModule),
  ],
  providers: [
    GroupshopsResolver,
    GroupshopsService,
    OrderPlacedListener,
    RefAddedEvent,
    GSUpdatePriceRuleEvent,
  ],
  exports: [
    GroupshopsService,
    RefAddedEvent,
    GSUpdatePriceRuleEvent,
    OrderPlacedListener,
  ],
})
export class GroupshopsModule {}
