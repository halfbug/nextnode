import { HttpService } from '@nestjs/axios';
import { Injectable } from '@nestjs/common';
import { OnEvent } from '@nestjs/event-emitter';
import { ShopifyService } from 'src/shopify-store/shopify/shopify.service';
import { StoresService } from 'src/stores/stores.service';
import readJsonLines from 'read-json-lines-sync';
import { UpdateSmartCollectionEvent } from '../events/update-smart-collection.event';
import { InventoryService } from '../inventory.service';

@Injectable()
export class UpdateSmartCollectionListner {
  constructor(
    private shopifyService: ShopifyService,
    private storeService: StoresService,
    private httpService: HttpService,
    private inventoryService: InventoryService,
  ) {}
  @OnEvent('update.smart.collection')
  async updateSmartCollection(event: UpdateSmartCollectionEvent) {
    try {
      const { shop, accessToken } = await this.storeService.findOne(event.shop);
      const client = await this.shopifyService.client(shop, accessToken);
      await client.query({
        data: {
          query: `mutation {
            bulkOperationRunQuery(
              query:"""
              {
        product(id: "${event.productId}") {
          title
          id
          status
          createdAt
          publishedAt
          collections(first: 100) {
            edges {
              node {
                id
                title
                productsCount
                description
                sortOrder
                image {
                    id
                    url
                }
                ruleSet {
                  rules {
                    condition
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

        if (
          poll.body['data']['currentBulkOperation']['status'] === 'COMPLETED'
        ) {
          clearInterval(pollit);
          const url = poll.body['data']['currentBulkOperation'].url;
          this.httpService.get(url).subscribe(async (res) => {
            let collectionArray;
            if (res.data?.length) {
              collectionArray = readJsonLines(res.data);
            } else {
              collectionArray = [res.data];
            }

            const collectionObjs = collectionArray.map((collection) => ({
              id: collection.id,
              title: collection.title,
              type: collection.ruleSet ? 'smart' : 'custom',
              description: collection.description,
              productsCount: collection.productsCount,
              sortOrder: collection.sortOrder.toUpperCase(),
              featuredImage: collection?.image?.url,
              parentId: event.productId,
              shop,
              recordType: 'Collection',
            }));
            await this.inventoryService.removeProductCollections(
              event.productId,
            );
            await this.inventoryService.insertMany(collectionObjs);
            for (const col of collectionArray) {
              await this.inventoryService.updateProductCount(
                col.id,
                col.productsCount,
              );
            }
          });
        }
      }, 4000);
    } catch (err) {}
  }
}
