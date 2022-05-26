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

@Module({
  imports: [
    TypeOrmModule.forFeature([Lifecycle, Visitors]),
    UtilsModule,
    forwardRef(() => GroupshopsModule),
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
