import { Injectable } from '@nestjs/common';
import { OnEvent } from '@nestjs/event-emitter';
import { ShopifyService } from 'src/shopify-store/shopify/shopify.service';
import { StoresService } from 'src/stores/stores.service';
import { CreateInventoryInput } from '../dto/create-inventory.input';
import { ProductMediaObject } from '../events/product-media.event';
import { InventoryService } from '../inventory.service';

@Injectable()
export class ProductMediaListener {
  constructor(
    private storesService: StoresService,
    public shopifyService: ShopifyService,
    private inventryService: InventoryService,
  ) {}
  @OnEvent('product.media')
  async handlePeoductMediaEvent(event: ProductMediaObject) {
    try {
      const { shop, accessToken } = await this.storesService.findOne(
        event.shopName,
      );
      this.shopifyService.accessToken = accessToken;
      this.shopifyService.shop = shop;
      const client = await this.shopifyService.client(shop, accessToken);
      const id = event.productId;
      const qres = await client.query({
        data: {
          query: `query($id: ID!){
            product(id: $id) {
              id,
              title,
              media(first:20) {
                edges {
                  node {
                    mediaContentType,
                    status,
                    ... on Video {
                      filename,
                      id,
                      originalSource {
                        url,
                      }
                    }
                  }
                }
              }
            }
        
      }`,
          variables: {
            id: id,
          },
        },
      });
      const { data }: any = qres.body;
      const videoURL = data?.product.media.edges?.filter(
        (ele) => ele?.node?.mediaContentType === 'VIDEO',
      );
      videoURL?.map(
        async ({
          node: {
            id: vid,
            originalSource: { url },
          },
        }) => {
          const vprod = new CreateInventoryInput();
          vprod.id = vid;
          vprod.parentId = id;
          vprod.recordType = 'ProductVideo';
          vprod.shop = event.shopName;
          vprod.src = url;
          await this.inventryService.create(vprod);
        },
      );
    } catch (err) {
      console.log({ err });
    }
  }
}
