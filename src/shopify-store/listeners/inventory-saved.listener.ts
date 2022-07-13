import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { OnEvent } from '@nestjs/event-emitter';
import { ShopifyService } from '../shopify/shopify.service';
import { EventEmitter2 } from '@nestjs/event-emitter';
import { InventorySavedEvent } from 'src/inventory/events/inventory-saved.event';
import { OrdersReceivedEvent } from '../events/orders-received.event';

@Injectable()
export class InvenotrySavedListener {
  constructor(
    private shopifyapi: ShopifyService,
    private configSevice: ConfigService,
    private eventEmitter: EventEmitter2,
  ) {}
  @OnEvent('inventory.saved')
  async bulkOrdersQuery(event: InventorySavedEvent) {
    console.log('inventory----saved ---> fetching Orders Data');
    try {
      const { shop, accessToken } = event;
      const client = await this.shopifyapi.client(shop, accessToken);
      const qres = await client.query({
        data: {
          query: `mutation {
            bulkOperationRunQuery(
             query:"""
              {
                 orders(first:10000, reverse:true){
                          edges{
                            node{
                              name
                              id
                              shopifyCreateAt:createdAt
                              confirmed
                              cancelledAt
                              currencyCode
                              
                              customer{
                                
                                firstName
                                lastName
                                email
                                  
                              }
                              discountCode
                              totalPriceSet{
                                shopMoney{
                                  amount
                                  currencyCode
                                }
                              }
                              lineItems(first:100){
                                edges{
                                  node{
                                    id
                                    originalUnitPriceSet{
                                      shopMoney{
                                        amount
                                        currencyCode
                                      }
                                    }
                                    totalDiscountSet{
                                      shopMoney{
                                        amount
                                        currencyCode
                                      }}
                                    quantity
                                    product{
                                      id
                                      priceRangeV2{
                                        maxVariantPrice{
                                          amount
                                          currencyCode
                                        }
                                      }
                                    }
                                    variant{
                                      id,
                                      price
                                      }
                                  }
                                }
                              }
                              
                            }
                          }
                        }
              }
              """
            ) {
              bulkOperation {
                id
                status
              }
              userErrors {
                field
                message
              }
            }
          }`,
        },
      });

      // console.log(event);
      console.log(JSON.stringify(qres));
      // console.log(qres.body['data']['bulkOperationRunQuery']['bulkOperation']);
      // const dopoll = true;
      if (
        qres.body['data']['bulkOperationRunQuery']['bulkOperation'][
          'status'
        ] === 'CREATED'
      ) {
        const pollit = setInterval(async () => {
          const poll = await client.query({
            data: {
              query: `query {
            currentBulkOperation {
              id
              status
              errorCode
              createdAt
              completedAt
              objectCount
              fileSize
              url
              partialDataUrl
            }
          }`,
            },
          });

          console.log(poll.body['data']['currentBulkOperation']);
          if (
            poll.body['data']['currentBulkOperation']['status'] === 'COMPLETED'
          ) {
            clearInterval(pollit);

            // fire inventory received event

            const ordersReceivedEvent = new OrdersReceivedEvent();
            ordersReceivedEvent.bulkOperationResponse =
              poll.body['data']['currentBulkOperation'];
            ordersReceivedEvent.shop = shop;
            ordersReceivedEvent.accessToken = accessToken;

            this.eventEmitter.emit('orders.received', ordersReceivedEvent);
          }
        }, 3000);
      } else console.log(JSON.stringify(qres.body['data']));
    } catch (err) {
      console.log(JSON.stringify(err));
    }
  }

  @OnEvent('inventory.saved')
  async registerWebhooks(event: InventorySavedEvent) {
    try {
      const { shop, accessToken } = event;
      this.shopifyapi
        .registerHook(
          shop,
          accessToken,
          '/webhooks/product-create',
          'PRODUCTS_CREATE',
        )
        .then(() => {
          console.log('webhook PRODUCTS_CREATE-> registered for shop', shop);
        });

      this.shopifyapi
        .registerHook(
          shop,
          accessToken,
          '/webhooks/uninstalled',
          'APP_UNINSTALLED',
        )
        .then(() => {
          console.log('webhook APP_UNINSTALLED-> registered for shop', shop);
        });

      this.shopifyapi
        .registerHook(
          shop,
          accessToken,
          '/webhooks/product-update',
          'PRODUCTS_UPDATE',
        )
        .then(() => {
          console.log('webhook PRODUCTS_UPDATE-> registered for shop', shop);
        });

      this.shopifyapi
        .registerHook(
          shop,
          accessToken,
          '/webhooks/order-create',
          'ORDERS_CREATE',
        )
        .then(() => {
          console.log('webhook ORDERS_CREATE-> registered for shop', shop);
        });
      this.shopifyapi
        .registerHook(
          shop,
          accessToken,
          '/webhooks/product-delete',
          'PRODUCTS_DELETE',
        )
        .then(() => {
          console.log('webhook PRODUCTS_DELETE-> registered for shop', shop);
        });
      this.shopifyapi
        .registerHook(
          shop,
          accessToken,
          '/webhooks/customer-update',
          'CUSTOMERS_UPDATE',
        )
        .then(() => {
          console.log('webhook CUSTOMERS_UPDATE -> registered for shop', shop);
        });
      console.log('webhook registered');
    } catch (err) {
      console.log(JSON.stringify(err));
    }
  }
}
