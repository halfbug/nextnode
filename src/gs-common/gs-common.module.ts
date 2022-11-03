import { forwardRef, Module } from '@nestjs/common';
import { VistorsService } from './vistors.service';
import { LifecycleService } from './lifecycle.service';
import { Lifecycle } from './entities/lifecycle.modal';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Visitors } from './entities/visitors.modal';
import { ViewedInterceptor } from './viewed.inceptor';
import { UtilsModule } from 'src/utils/utils.module';
import { GroupshopsModule } from 'src/groupshops/groupshops.module';
import { GSLoadedEvent } from './events/groupshop-loaded.event';
import { GSLoadedListener } from './listeners/groupshop-loaded.listener';
import { PartnersModule } from 'src/partners/partners.module';
import { BillingModule } from 'src/billing/billing.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([Lifecycle, Visitors]),
    UtilsModule,
    forwardRef(() => GroupshopsModule),
    forwardRef(() => PartnersModule),
    forwardRef(() => BillingModule),
  ],
  providers: [
    VistorsService,
    LifecycleService,
    ViewedInterceptor,
    GSLoadedEvent,
    GSLoadedListener,
  ],
  exports: [VistorsService, LifecycleService, GSLoadedEvent, GSLoadedListener],
})
export class GsCommonModule {}
