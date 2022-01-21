import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { OnEvent } from '@nestjs/event-emitter';
import { TokenReceivedEvent } from '../events/token-received.event';
import { ShopifyService } from '../shopify/shopify.service';
import { EventEmitter2 } from '@nestjs/event-emitter';
import { InventoryReceivedEvent } from '../events/inventory-received.event';

@Injectable()
export class TokenReceivedListener {
  constructor(
    private shopifyapi: ShopifyService,
    private configSevice: ConfigService,
    private eventEmitter: EventEmitter2,
  ) {}
  @OnEvent('token.received')
  async bulkProductsQuery(event: TokenReceivedEvent) {
    const { shop, accessToken } = event.session;
    const client = await this.shopifyapi.client(shop, accessToken);
    const qres = await client.query({
      data: {
        query: `mutation {
          bulkOperationRunQuery(
            query:"""
            {
              products(first: 10000, reverse: true)  {
                    edges {
                      node {
                        id
                        title
                        status
                        description
                        options{
                          id
                          name
                          name
                          position
                          values
                        }
                        featuredImage{
                          src
                        }
                        images(first:10, reverse: true){
                          edges{
                            node{
                              src
                              id
                            }
                          }
                        }
                        priceRangeV2{
                          maxVariantPrice{
                            amount
                            currencyCode
                            
                          }
                          minVariantPrice{
                            amount
                            currencyCode
                          }
                        }
                        totalVariants
                        totalInventory
                        status
                        publishedAt
                        onlineStoreUrl
                        createdAtShopify : createdAt
                        collections(first: 1000, reverse: true){
                          edges{
                            node{
                              id
                              title
                              description
                              productsCount
                              sortOrder
                            }
                          }
                        }
                        variants(first: 1000, reverse: true)  {
                          edges {
                            node {
                              id
                              title
                              displayName
                              inventoryQuantity
                              price
                              selectedOptions{
                                name
                                value
                              }
                              shopifyCreatedAt :createdAt
                              image{
                                src
                                
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
    // console.log(JSON.stringify(qres));
    // console.log(qres.body['data']['bulkOperationRunQuery']['bulkOperation']);
    // const dopoll = true;
    if (
      qres.body['data']['bulkOperationRunQuery']['bulkOperation']['status'] ===
      'CREATED'
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

          const inventoryReceivedEvent = new InventoryReceivedEvent();
          inventoryReceivedEvent.bulkOperationResponse =
            poll.body['data']['currentBulkOperation'];
          inventoryReceivedEvent.shop = shop;
          inventoryReceivedEvent.accessToken = accessToken;

          this.eventEmitter.emit('inventory.received', inventoryReceivedEvent);
        }
      }, 3000);
    } else console.log(JSON.stringify(qres.body['data']));
  }
}
