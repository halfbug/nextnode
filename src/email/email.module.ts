import { HttpModule } from '@nestjs/axios';
import { Module } from '@nestjs/common';
import { InventoryModule } from 'src/inventory/inventory.module';
import { CatController } from './connect/connect.controller';
import { GroupshopSavedListener } from './listeners/groupshop-saved.listener';

@Module({
  imports: [HttpModule, InventoryModule],
  providers: [GroupshopSavedListener],
  controllers: [CatController],
})
export class EmailModule {}
