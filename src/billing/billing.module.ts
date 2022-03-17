import { Module } from '@nestjs/common';
import { BillingsService } from './billing.service';
import { BillingsResolver } from './billing.resolver';
import { TypeOrmModule } from '@nestjs/typeorm';
import Billing from './entities/billing.model';
import { DefaultColumnsService } from 'src/utils/default-columns/default-columns.service';
import { StoresModule } from 'src/stores/stores.module';
import { BillingListener } from './listeners/billing.listener';

@Module({
  imports: [
    TypeOrmModule.forFeature([Billing]),
    DefaultColumnsService,
    StoresModule,
  ],
  providers: [BillingsResolver, BillingsService, BillingListener],
  exports: [BillingsService],
})
export class BillingModule {}
