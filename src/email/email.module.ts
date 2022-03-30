import { HttpModule } from '@nestjs/axios';
import { Module } from '@nestjs/common';
import { InventoryModule } from 'src/inventory/inventory.module';
import { CatController } from './connect/connect.controller';
import { GroupshopCashbackListener } from './listeners/groupshop-cashback.listener';
import { GroupshopSavedListener } from './listeners/groupshop-saved.listener';
import { KalavioService } from './kalavio.service';

@Module({
  imports: [HttpModule, InventoryModule],
  providers: [
    GroupshopSavedListener,
    GroupshopCashbackListener,
    KalavioService,
  ],
  controllers: [CatController],
})
export class EmailModule {}
