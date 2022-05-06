import { Controller, Get, Logger, Post, Query, Req, Res } from '@nestjs/common';
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
  }

  @Get('scriptTag')
  async scriptTag(@Query('shopName') shopName: any) {
    const { shop, accessToken } = await this.storesService.findOne(shopName);
    this.shopifyService.accessToken = accessToken;
    this.shopifyService.shop = shop;
    const st = await this.shopifyService.scriptTagList();
    return st;
  }

  @Get('delscriptTag')
  async scriptTagDelete(@Query('sid') sid: any) {
    console.log(sid);
    const { shop, accessToken } = await this.storesService.findOne(
      'native-roots-dev.myshopify.com',
    );
    this.shopifyService.accessToken = accessToken;
    this.shopifyService.shop = shop;
    this.shopifyService.scriptTagDelete(sid);
    return 'check console' + sid;
  }

  @Post('product-create?')
  async createProducts(@Req() req, @Res() res) {
    const { shop } = req.query;
    const rproduct = req.body;
    console.log('Webhook : PRODUCT_CREATED, Shop: ', shop);
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
    res.send('values updated');
  }

  @Post('uninstalled?')
  async uninstalledApp(@Req() req, @Res() res) {
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
    res.send('store updated..');
  }

  @Post('product-update?')
  async productUpdate(@Req() req, @Res() res) {
    const { shop } = req.query;
    const rproduct = req.body;
    console.log(
      'WebhooksController ~ productUpdate ~ rproduct',
      JSON.stringify(rproduct),
    );
    console.log(
      'WebhooksController ~ productUpdate ~ rproduct variants',
      JSON.stringify(rproduct.variants),
    );
    const nprod = new UpdateInventoryInput();
    nprod.id = rproduct.id;
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

    rproduct.variants.map(async (variant) => {
      const preVariant = await this.inventryService.findId(
        variant.admin_graphql_api_id,
      );
      qDifference = Math.abs(
        variant.inventory_quantity - preVariant?.inventoryQuantity,
      );
      preVariant.price = variant.price;

      preVariant.inventoryQuantity = variant.inventory_quantity;
      await this.inventryService.update(preVariant);
      await this.inventryService.updateInventory(
        rproduct.admin_graphql_api_id,
        qDifference,
      );
    });
    await this.inventryService.update(nprod);

    res.send('product updated..');
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

      res.send('order created..');
    } catch (err) {
      console.log(JSON.stringify(err));
    }
  }

  @Post('product-delete?')
  async productDelete(@Req() req, @Res() res) {
    const { shop } = req.query;
    const rproduct = req.body;
    console.log(
      'WebhooksController ~ productDelete ~ rproduct',
      JSON.stringify(rproduct),
    );

    const { result } = await this.inventryService.remove(
      JSON.stringify(rproduct.id),
    );
    res.send(result.deletedCount);
  }
}
