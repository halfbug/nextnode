import { forwardRef, Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { EmailModule } from 'src/email/email.module';
import { GsCommonModule } from 'src/gs-common/gs-common.module';
import { ShopifyStoreModule } from 'src/shopify-store/shopify-store.module';
import { StoresModule } from 'src/stores/stores.module';
import { DefaultColumnsService } from 'src/utils/default-columns/default-columns.service';
import { Partnergroupshop, Partnermember } from './entities/partner.modal';
import { GSPCreatedEvent } from './events/create-partner-groupshop.event';
import { PMemberArrivedEvent } from './events/pmember-arrived.event';
import { GSPSavedListener } from './listeners/groupshop-partner-saved.listener';
import { PMemberArrivedListener } from './listeners/pmember-arrived.listener';
import { PartnersResolver } from './partners.resolver';
import { PartnerService } from './partners.service';
import { PMemberService } from './pmember.service';

@Module({
  imports: [
    TypeOrmModule.forFeature([Partnergroupshop, Partnermember]),
    DefaultColumnsService,
    forwardRef(() => ShopifyStoreModule),
    forwardRef(() => StoresModule),
    forwardRef(() => EmailModule),
    forwardRef(() => GsCommonModule),
  ],
  providers: [
    PartnersResolver,
    PartnerService,
    GSPSavedListener,
    GSPCreatedEvent,
    PMemberArrivedEvent,
    PMemberArrivedListener,
    PMemberService,
  ],
  exports: [PartnerService, PMemberService, PMemberArrivedEvent],
})
export class PartnersModule {}
