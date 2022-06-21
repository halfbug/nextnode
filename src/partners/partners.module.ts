import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ShopifyStoreModule } from 'src/shopify-store/shopify-store.module';
import { StoresModule } from 'src/stores/stores.module';
import { DefaultColumnsService } from 'src/utils/default-columns/default-columns.service';
import { Partnergroupshop } from './entities/partner.modal';
import { PartnersResolver } from './partners.resolver';
import { PartnerService } from './partners.service';

@Module({
  imports: [
    TypeOrmModule.forFeature([Partnergroupshop]),
    DefaultColumnsService,
    ShopifyStoreModule,
    StoresModule,
  ],
  providers: [PartnersResolver, PartnerService],
  exports: [PartnerService],
})
export class PartnersModule {}
