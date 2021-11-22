import { Module } from '@nestjs/common';
import { InventoryService } from './inventory.service';
import { InventoryResolver } from './inventory.resolver';
import { TypeOrmModule } from '@nestjs/typeorm';
import Inventory from './entities/inventory.modal';
import { DefaultColumnsService } from 'src/utils/default-columns/default-columns.service';
import { HttpModule } from '@nestjs/axios';
import { InventoryReceivedListener } from './listeners/inventory-received.listener';

@Module({
  imports: [
    TypeOrmModule.forFeature([Inventory]),
    DefaultColumnsService,
    HttpModule,
  ],
  providers: [InventoryResolver, InventoryService, InventoryReceivedListener],
  exports: [InventoryService],
})
export class InventoryModule {}
