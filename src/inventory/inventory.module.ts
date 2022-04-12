import { Module } from '@nestjs/common';
import { InventoryService } from './inventory.service';
import { InventoryResolver } from './inventory.resolver';
import { TypeOrmModule } from '@nestjs/typeorm';
import Inventory from './entities/inventory.modal';
import { DefaultColumnsService } from 'src/utils/default-columns/default-columns.service';
import { HttpModule } from '@nestjs/axios';
import { InventoryReceivedListener } from './listeners/inventory-received.listener';
import { OrdersService } from './orders.service';
import { OrdersReceivedListener } from './listeners/orders-received.listener';
import Orders from './entities/orders.modal';
import { OrderSavedListener } from './listeners/orders-saved.listener';
import { InventorySavedListener } from './listeners/inventory-saved.listener';

@Module({
  imports: [
    TypeOrmModule.forFeature([Inventory, Orders]),
    DefaultColumnsService,
    HttpModule,
  ],
  providers: [
    InventoryResolver,
    InventoryService,
    InventoryReceivedListener,
    OrdersReceivedListener,
    OrdersService,
    OrderSavedListener,
    InventorySavedListener,
  ],
  exports: [InventoryService, OrdersService],
})
export class InventoryModule {}
