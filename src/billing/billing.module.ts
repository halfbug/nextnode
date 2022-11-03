import { forwardRef, Module } from '@nestjs/common';
import { BillingsService } from './billing.service';
import { BillingsResolver } from './billing.resolver';
import { TypeOrmModule } from '@nestjs/typeorm';
import Billing from './entities/billing.model';
import { DefaultColumnsService } from 'src/utils/default-columns/default-columns.service';
import { StoresModule } from 'src/stores/stores.module';
import { BillingListener } from './listeners/billing.listener';
import { BillingUsageCargeCron } from './billing.cron';
import { HttpModule } from '@nestjs/axios';
import { GroupshopsModule } from 'src/groupshops/groupshops.module';
import { GsCommonModule } from 'src/gs-common/gs-common.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([Billing]),
    DefaultColumnsService,
    forwardRef(() => StoresModule),
    HttpModule,
    GroupshopsModule,
    GsCommonModule,
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
