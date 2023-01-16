import { forwardRef, Module } from '@nestjs/common';
import { DropsGroupshopService } from './drops-groupshop.service';
import { DropsGroupshopResolver } from './drops-groupshop.resolver';
import { TypeOrmModule } from '@nestjs/typeorm';
import DropsGroupshop from './entities/dropsgroupshop.model';
import { DefaultColumnsService } from 'src/utils/default-columns/default-columns.service';
import { StoresModule } from 'src/stores/stores.module';
import { InventoryModule } from 'src/inventory/inventory.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([DropsGroupshop]),
    DefaultColumnsService,
    forwardRef(() => StoresModule),
    forwardRef(() => InventoryModule),
  ],
  providers: [DropsGroupshopResolver, DropsGroupshopService],
  exports: [DropsGroupshopService],
})
export class DropsGroupshopModule {}
