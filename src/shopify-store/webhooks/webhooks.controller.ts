import {
  Controller,
  Get,
  HttpStatus,
  Logger,
  Post,
  Query,
  Req,
  Res,
} from '@nestjs/common';
import { CreateInventoryInput } from 'src/inventory/dto/create-inventory.input';
import {
  CreateOrderInput,
  Customer,
  DiscountInfo,
  LineProduct,
} from 'src/inventory/dto/create-order.input';
import { UpdateInventoryInput } from 'src/inventory/dto/update-inventory.input';
import { InventoryService } from 'src/inventory/inventory.service';
import { OrdersService } from 'src/inventory/orders.service';
import { UpdateStoreInput } from 'src/stores/dto/update-store.input';
import { StoresService } from 'src/stores/stores.service';
import { ConfigService } from '@nestjs/config';
import { EventEmitter2 } from '@nestjs/event-emitter';
import { OrderPlacedEvent } from '../events/order-placed.envent';
import { ShopifyService } from '../shopify/shopify.service';
import Orders from 'src/inventory/entities/orders.modal';
import { UninstallService } from 'src/stores/uninstall.service';
import { OrderCreatedEvent } from '../events/order-created.event';
import {
  ProductImage,
  SelectedOption,
} from 'src/inventory/entities/product.entity';
import Product from 'src/campaigns/entities/product.model';

@Controller('webhooks')
export class WebhooksController {
  constructor(
    private storesService: StoresService,
    private shopifyService: ShopifyService,
    private inventryService: InventoryService,
    private orderService: OrdersService,
    private eventEmitter: EventEmitter2,
    private configSevice: ConfigService,
    private uninstallSerivice: UninstallService,
    private orderCreatedEvent: OrderCreatedEvent,
  ) {}

  @Get('register')
  async register() {
    try {
      const { shop, accessToken } = await this.storesService.findOne(
        'native-roots-dev.myshopify.com',
      );
      console.log(
        '🚀 ~ file: webhooks.controller.ts ~ line 11 ~ WebhooksController ~ register ~ shop',
        shop,
      );
      console.log('yes register');
      const rhook = await this.shopifyService.registerHook(
        shop,
        accessToken,
        // '/webhooks/product-update',
        // 'PRODUCTS_UPDATE',
        '/webhooks/order-create',
        'ORDERS_CREATE',
      );
      console.log(rhook);
      const client = await this.shopifyService.client(shop, accessToken);
      const qwbh = await client.query({
        data: `{
        webhookSubscription(id: "gid://shopify/WebhookSubscription/1100885262502") {
          id
          topic
          endpoint {
            __typename
            ... on WebhookHttpEndpoint {
              callbackUrl
            }
            ... on WebhookEventBridgeEndpoint {
              arn
            }
          }
        }
      }`,
      });
      console.log(
        '🚀 ~ file: webhooks.controller.ts ~ line 47 ~ WebhooksController ~ register ~ qwbh',
        JSON.stringify(qwbh),
      );

      return 'yes done';
    } catch (err) {
      console.log(JSON.stringify(err));
    }
  }

  @Get('scriptTag')
  async scriptTag(@Query('shopName') shopName: any) {
    try {
      const { shop, accessToken } = await this.storesService.findOne(shopName);
      this.shopifyService.accessToken = accessToken;
      this.shopifyService.shop = shop;
      const st = await this.shopifyService.scriptTagList();
      return st;
    } catch (err) {
      console.log(JSON.stringify(err));
    }
  }

  @Get('delscriptTag')
  async scriptTagDelete(
    @Query('sid') sid: any,
    @Query('shopName') shopName: any,
  ) {
    try {
      console.log(sid);
      const { shop, accessToken } = await this.storesService.findOne(shopName);
      this.shopifyService.accessToken = accessToken;
      this.shopifyService.shop = shop;
      this.shopifyService.scriptTagDelete(sid);
      return 'check console' + sid;
    } catch (err) {
      console.log(JSON.stringify(err));
    }
  }

  @Post('product-create?')
  async createProducts(@Req() req, @Res() res) {
    try {
      const { shop } = req.query;
      const rproduct = req.body;
      // console.log('Webhook : PRODUCT_CREATED, Shop: ', shop);
      const prodinfo = await this.inventryService.findOne(shop, 'Product');
      const nprod = new CreateInventoryInput();

      // add product
      nprod.id = rproduct?.admin_graphql_api_id;
      nprod.createdAtShopify = rproduct?.created_at;
      nprod.publishedAt = rproduct?.published_at;
      nprod.title = rproduct?.title;
      nprod.currencyCode = prodinfo?.currencyCode;
      nprod.shop = shop;
      nprod.recordType = 'Product';
      nprod.status = rproduct?.status?.toUpperCase();
      nprod.price = rproduct?.variants[0]?.price;
      nprod.featuredImage = rproduct?.image?.src;

      await this.inventryService.create(nprod);

      //add variat
      const vprod = nprod;
      rproduct.variants.map(async (variant) => {
        vprod.id = variant.admin_graphql_api_id;
        vprod.title = variant?.title;
        vprod.parentId = rproduct?.admin_graphql_api_id;
        vprod.recordType = 'ProductVariant';
        vprod.createdAtShopify = variant?.created_at;
        vprod.publishedAt = rproduct?.published_at;
        vprod.price = variant?.variants[0]?.price;
        vprod.inventoryQuantity = variant?.inventory_quantity;

        await this.inventryService.create(vprod);
      });
      // console.log(JSON.stringify(req.body));
      // console.log(req.query);
      // res.send('values updated');
    } catch (err) {
      console.log(JSON.stringify(err));
    } finally {
      res.status(HttpStatus.OK).send();
    }
  }

  @Post('uninstalled?')
  async uninstalledApp(@Req() req, @Res() res) {
    try {
      const { shop } = req.query;
      console.log(
        '🚀 ~ file: webhooks.controller.ts ~ line 143 ~ WebhooksController ~ uninstalledApp ~ shop',
        shop,
      );
      const webdata = req.body;
      console.log(
        'WebhooksController ~ uninstalledApp ~ web hook data',
        JSON.stringify(webdata),
      );
      this.uninstallSerivice.deleteStoreByName(shop);
      // const storeInfo = await this.storesService.findOneByName(shop);
      // const updateStore = new UpdateStoreInput();
      // updateStore.status = 'Unistalled';
      // await this.storesService.update(storeInfo.id, updateStore);
      // res.send('store updated..');
    } catch (err) {
      console.log(JSON.stringify(err));
    } finally {
      res.status(HttpStatus.OK).send();
    }
  }

  @Post('product-update?')
  async productUpdate(@Req() req, @Res() res) {
    try {
      const { shop } = req.query;
      const rproduct = req.body;
      console.log(
        'WebhooksController ~ productUpdate ~ rproduct',
        JSON.stringify(rproduct),
      );
      const nprod = new UpdateInventoryInput();
      // nprod.id = rproduct.id;
      nprod.id = rproduct?.admin_graphql_api_id;
      nprod.createdAtShopify = rproduct?.created_at;
      nprod.publishedAt = rproduct?.published_at;
      nprod.title = rproduct?.title;
      nprod.status = rproduct?.status?.toUpperCase();
      nprod.price = rproduct?.variants[0]?.price; //
      nprod.featuredImage = rproduct?.image?.src;
      let qDifference: number;
      const isAvailable = rproduct.variants.some(
        (item) => item.inventory_quantity > 0,
      );
      nprod.outofstock = !isAvailable;
      nprod.options = rproduct.options.map(
        ({ id, name, position, values }) => ({
          id,
          name,
          position,
          values,
        }),
      );

      await this.inventryService.removeVariants(rproduct?.admin_graphql_api_id);
      rproduct.variants.map(async (variant) => {
        const vprod = new CreateInventoryInput();
        vprod.id = variant.admin_graphql_api_id;
        vprod.title = variant?.title;
        vprod.parentId = rproduct?.admin_graphql_api_id;
        vprod.recordType = 'ProductVariant';
        vprod.createdAtShopify = variant?.created_at;
        vprod.publishedAt = rproduct?.published_at;
        vprod.featuredImage = rproduct?.image?.src;
        const img = new ProductImage();
        img.src =
          rproduct?.image && rproduct?.image.src ? rproduct?.image.src : null;

        vprod.image = img;
        vprod.price = variant?.price;
        vprod.inventoryQuantity = variant?.inventory_quantity;
        // const seOptions = [];
        // console.log(seOptions, 'seOptions');
        // vprod.selectedOptions = [new SelectedOption()];
        vprod.selectedOptions = rproduct.options.map((item, index) => {
          const sOpt = new SelectedOption();
          sOpt.name = item.name;
          sOpt.value = variant[`option${index + 1}`];
          return sOpt;
        });

        await this.inventryService.create(vprod);
      });

      await this.inventryService.update(nprod);

      // res.send('product updated..');
    } catch (err) {
      console.log(JSON.stringify(err));
    } finally {
      res.status(HttpStatus.OK).send();
    }
  }

  @Get('product')
  async product(@Query('shopName') shopName: any, @Query('id') id: any) {
    try {
      const { shop, accessToken } = await this.storesService.findOne(shopName);
      this.shopifyService.accessToken = accessToken;
      // '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';
      this.shopifyService.shop = shop;
      const client = await this.shopifyService.client(shop, accessToken);
      const Prd = await client.query({
        data: {
          query: `query product($id: ID!){
            product(id: $id) {
              title
              id
              status
              createdAt
              publishedAt
              featuredImage {
                src
              }
              images(first:10, reverse: true){
                edges{
                  node{
                    src
                    id
                    originalSrc
                  }
                }
              }
            options{
                id
                name
                values
                position
              }
              variants(first: 25) {
                edges {
                  node {
                    selectedOptions {
                      name
                      value
                    }
                    image {
                      src
                    }
                    title
                    price
                    inventoryQuantity
                    id
                    createdAt
                    image {
                      src
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
      const data1: any = Prd.body;
      const prod = data1.data.product;
      const variants = data1.data.product.variants.edges;
      const images = data1.data.product.images.edges;
      const pid = data1.data.product.id;

      const nprod = new UpdateInventoryInput();
      // nprod.id = rproduct.id;
      nprod.id = id;
      nprod.createdAtShopify = prod?.createdAt;
      nprod.publishedAt = prod?.publishedAt;
      nprod.title = prod?.title;
      nprod.status = prod?.status?.toUpperCase();
      nprod.price = variants[0].node?.price; //
      nprod.featuredImage = prod?.featuredImage?.src;
      let qDifference: number;
      const isAvailable = variants.some(
        ({ node: { inventoryQuantity } }) => inventoryQuantity > 0,
      );
      nprod.outofstock = !isAvailable;
      nprod.options = prod.options.map(({ id, name, position, values }) => ({
        id,
        name,
        position,
        values,
      }));
      await this.inventryService.update(nprod);

      await this.inventryService.removeVariants(pid);

      variants.map(
        async ({
          node: {
            selectedOptions,
            title,
            inventoryQuantity,
            price,
            id: vid,
            createdAt,
            image,
          },
        }) => {
          const vprod = new CreateInventoryInput();
          vprod.id = vid;
          vprod.title = title;
          vprod.displayName = `${prod.title} Variant ${title}`;
          vprod.parentId = id;
          vprod.recordType = 'ProductVariant';
          vprod.createdAtShopify = createdAt;
          // vprod.publishedAt = rproduct?.published_at;
          vprod.price = price;
          vprod.shop = shopName;
          // image
          const img = new ProductImage();
          img.src = image && image.src ? image.src : null;

          vprod.image = img;
          vprod.featuredImage = image && image.src ? image.src : null;
          vprod.inventoryQuantity = inventoryQuantity;
          vprod.selectedOptions = selectedOptions.map((item, index) => {
            const sOpt = new SelectedOption();
            sOpt.name = item.name;
            sOpt.value = item.value;
            return sOpt;
          });
          await this.inventryService.create(vprod);
        },
      );

      images.map(async ({ node: { id: vid, src } }) => {
        const vprod = new CreateInventoryInput();
        vprod.id = vid;
        vprod.parentId = id;
        vprod.recordType = 'ProductImage';
        vprod.shop = shopName;
        // image
        vprod.src = src;

        await this.inventryService.create(vprod);
      });

      return `${JSON.stringify(Prd)}
      this product reloaded successfully in groupshop inventory`;
    } catch (err) {
      console.log(JSON.stringify(err));
    }
  }

  @Post('order-create?')
  async orderCreate(@Req() req, @Res() res) {
    try {
      const { shop } = req.query;
      console.log(
        'WebhooksController ~ orderCreate ~ webhookData',
        JSON.stringify(req.body),
      );
      // const webhook = req.body;
      this.orderCreatedEvent.webhook = req.body;
      this.orderCreatedEvent.shop = shop;
      this.orderCreatedEvent.emit();

      // res.send('order created..');
    } catch (err) {
      console.log(JSON.stringify(err));
    } finally {
      res.status(HttpStatus.OK).send();
    }
  }

  @Post('product-delete?')
  async productDelete(@Req() req, @Res() res) {
    try {
      const { shop } = req.query;
      const rproduct = req.body;
      console.log(
        'WebhooksController ~ productDelete ~ rproduct',
        JSON.stringify(rproduct),
      );

      const { result } = await this.inventryService.remove(
        JSON.stringify(rproduct.id),
      );
      // res.send(result.deletedCount);
    } catch (err) {
      console.log(JSON.stringify(err));
    } finally {
      res.status(HttpStatus.OK).send();
    }
  }
  // for future use
  // @Post('order-update?')
  // async orderUpdate(@Req() req, @Res() res) {
  //   try {
  //     const { shop } = req.query;
  //     const rorders = req.body;
  //     console.log(
  //       'WebhooksController ~ orderUpdate ~ rorders',
  //       JSON.stringify(rorders),
  //     );
  //     res.status(HttpStatus.OK).send();
  //   } catch (err) {
  //     console.log(JSON.stringify(err));
  //   } finally {
  //     res.status(HttpStatus.OK).send();
  //   }
  // }
}
