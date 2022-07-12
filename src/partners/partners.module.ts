import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { EmailModule } from 'src/email/email.module';
import { ShopifyStoreModule } from 'src/shopify-store/shopify-store.module';
import { StoresModule } from 'src/stores/stores.module';
import { DefaultColumnsService } from 'src/utils/default-columns/default-columns.service';
import { Partnergroupshop } from './entities/partner.modal';
import { GSPCreatedEvent } from './events/create-partner-groupshop.event';
import { GSPSavedListener } from './listeners/groupshop-partner-saved.listener';
import { PartnersResolver } from './partners.resolver';
import { PartnerService } from './partners.service';

@Module({
  imports: [
    TypeOrmModule.forFeature([Partnergroupshop]),
    DefaultColumnsService,
    ShopifyStoreModule,
    StoresModule,
    EmailModule,
  ],
  providers: [
    PartnersResolver,
    PartnerService,
    GSPSavedListener,
    GSPCreatedEvent,
  ],
  exports: [PartnerService],
})
export class PartnersModule {}
