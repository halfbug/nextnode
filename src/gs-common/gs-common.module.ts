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
import { GsCommonService } from './gs-common.service';
import { DropsGroupshopModule } from 'src/drops-groupshop/drops-groupshop.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([Lifecycle, Visitors]),
    UtilsModule,
    forwardRef(() => GroupshopsModule),
    forwardRef(() => PartnersModule),
    forwardRef(() => BillingModule),
    forwardRef(() => DropsGroupshopModule),
  ],
  providers: [
    VistorsService,
    LifecycleService,
    ViewedInterceptor,
    GSLoadedEvent,
    GSLoadedListener,
    GsCommonService,
  ],
  exports: [VistorsService, LifecycleService, GSLoadedEvent, GSLoadedListener],
})
export class GsCommonModule {}
