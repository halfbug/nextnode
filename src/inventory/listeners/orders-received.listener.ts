import { Injectable } from '@nestjs/common';
import { OnEvent } from '@nestjs/event-emitter';
import { HttpService } from '@nestjs/axios';
import readJsonLines from 'read-json-lines-sync';
import { EventEmitter2 } from '@nestjs/event-emitter';
import { OrdersReceivedEvent } from 'src/shopify-store/events/orders-received.event';
import { OrdersService } from '../orders.service';
import { OrdersSavedEvent } from '../events/orders-saved.event';

@Injectable()
export class OrdersReceivedListener {
  constructor(
    private httpService: HttpService,
    private orderService: OrdersService,
    private eventEmitter: EventEmitter2,
  ) {}

  private reshapeOrders(orderArray, shop) {
    return orderArray.map((order) => {
      //rename order __parentId
      if (order.__parentId) {
        order.parentId = order.__parentId;
        delete order.__parentId;
      }
      // add shop to order
      order.shop = shop;
      order.price =
        order.totalPriceSet?.shopMoney.amount ||
        order.originalUnitPriceSet?.shopMoney.amount;
      order.totalDiscounts =
        order.totalDiscountSet?.shopMoney.amount ||
        order.currentTotalDiscountsSet?.shopMoney.amount;
      // add record type
      // order.recordType = order.id.split('/')[3];

      return order;
    });
  }

  @OnEvent('orders.received')
  async storeOrdersReceived(event: OrdersReceivedEvent) {
    console.log('orders Received ----->>>> ', event.shop);
    console.log(event);
    // const productBulkFile = createReadStream(event.bulkOperationResponse.url);
    this.httpService
      .get(event.bulkOperationResponse.url)
      .subscribe(async (res) => {
        const ordersObj = this.reshapeOrders(
          readJsonLines(res.data),
          event.shop,
        );
        // console.log(ordersObj);
        // const savedorder =
        await this.orderService.insertMany(ordersObj);
        console.log('saved orders for ', event.shop);

        const ordersSavedEvent = new OrdersSavedEvent();
        ordersSavedEvent.shop = event.shop;
        ordersSavedEvent.accessToken = event.accessToken;
        this.eventEmitter.emit('orders.saved', ordersSavedEvent);
      });
  }
}
