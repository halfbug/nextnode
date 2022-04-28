import { forwardRef, Module } from '@nestjs/common';
import { BillingsService } from './billing.service';
import { BillingsResolver } from './billing.resolver';
import { TypeOrmModule } from '@nestjs/typeorm';
import Billing from './entities/billing.model';
import { DefaultColumnsService } from 'src/utils/default-columns/default-columns.service';
import { StoresModule } from 'src/stores/stores.module';
import { BillingListener } from './listeners/billing.listener';
import { BillingUsageCargeCron } from './billing.cron';

@Module({
  imports: [
    TypeOrmModule.forFeature([Billing]),
    DefaultColumnsService,
    forwardRef(() => StoresModule),
  ],
  providers: [
    BillingsResolver,
    BillingsService,
    BillingListener,
    BillingUsageCargeCron,
  ],
  exports: [BillingsService],
})
export class BillingModule {}
