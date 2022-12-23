import { forwardRef, Module } from '@nestjs/common';
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
import { OrdersResolver } from './orders.resolver';
import { ProductMediaListener } from './listeners/product-media.listner';
import { ProductMediaObject } from './events/product-media.event';
import { StoresModule } from 'src/stores/stores.module';
import { InventoryDoneEvent } from './events/inventory-done.event';
import { ProductOutofstockEvent } from './events/product-outofstock.event';

@Module({
  imports: [
    TypeOrmModule.forFeature([Inventory, Orders]),
    DefaultColumnsService,
    HttpModule,
    forwardRef(() => StoresModule),
  ],
  providers: [
    InventoryResolver,
    InventoryService,
    InventoryReceivedListener,
    OrdersReceivedListener,
    OrdersService,
    OrderSavedListener,
    InventorySavedListener,
    OrdersResolver,
    ProductMediaListener,
    ProductMediaObject,
    InventoryDoneEvent,
    ProductOutofstockEvent,
  ],
  exports: [
    InventoryService,
    OrdersService,
    ProductMediaObject,
    InventoryDoneEvent,
    ProductOutofstockEvent,
  ],
})
export class InventoryModule {}
