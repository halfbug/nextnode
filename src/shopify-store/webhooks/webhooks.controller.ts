import { Controller, Get, Post, Req, Res } from '@nestjs/common';
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

@Controller('webhooks')
export class WebhooksController {
  constructor(
    private storesService: StoresService,
    private shopifyService: ShopifyService,
    private inventryService: InventoryService,
    private orderService: OrdersService,
    private eventEmitter: EventEmitter2,
    private configSevice: ConfigService,
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
    vprod.id = rproduct.variants[0]?.admin_graphql_api_id;
    vprod.title = rproduct.variants[0]?.title;
    vprod.parentId = rproduct?.admin_graphql_api_id;
    vprod.recordType = 'ProductVariant';
    vprod.createdAtShopify = rproduct?.variants[0]?.created_at;
    vprod.publishedAt = rproduct?.published_at;
    vprod.price = rproduct?.variants[0]?.price;

    await this.inventryService.create(vprod);

    // console.log(JSON.stringify(req.body));
    // console.log(req.query);
    res.send('values updated');
  }

  @Post('uninstalled?')
  async uninstalledApp(@Req() req, @Res() res) {
    const { shop } = req.query;
    const webdata = req.body;
    console.log(
      'WebhooksController ~ uninstalledApp ~ web hook data',
      JSON.stringify(webdata),
    );
    const storeInfo = await this.storesService.findOneByName(shop);
    const updateStore = new UpdateStoreInput();
    updateStore.status = 'Unistalled';
    await this.storesService.update(storeInfo.id, updateStore);
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
    const nprod = new UpdateInventoryInput();
    nprod.id = rproduct.id;
    nprod.id = rproduct?.admin_graphql_api_id;
    nprod.createdAtShopify = rproduct?.created_at;
    nprod.publishedAt = rproduct?.published_at;
    nprod.title = rproduct?.title;
    nprod.status = rproduct?.status?.toUpperCase();
    nprod.price = rproduct?.variants[0]?.price;
    nprod.featuredImage = rproduct?.image?.src;
    let qDifference: number;
    rproduct.variants.map(async (variant) => {
      const preVariant = await this.inventryService.findId(
        variant.admin_graphql_api_id,
      );
      qDifference = variant.inventory_quantity - preVariant.inventory_quantity;

      preVariant.inventory_quantity = variant.inventory_quantity;
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
      const whOrder = req.body;
      console.log(
        'WebhooksController ~ orderCreate ~ webhookData',
        JSON.stringify(whOrder),
      );
      const newOrder = new CreateOrderInput();
      newOrder.id = whOrder.admin_graphql_api_id;
      newOrder.name = '#' + JSON.stringify(whOrder.order_number);
      newOrder.shop = shop;
      newOrder.confirmed = whOrder.confirmed;
      newOrder.shopifyCreatedAt = whOrder.created_at;
      newOrder.price = whOrder.current_subtotal_price;
      newOrder.currencyCode = whOrder.currency;
      newOrder.totalDiscounts = whOrder.total_discounts;
      // newOrder.discountCode = whOrder.discount_codes[0].code || null;
      const dc = whOrder.discount_codes.filter((itm) =>
        itm.code.startsWith(this.configSevice.get('DC_PREFIX')),
      );
      newOrder.discountCode =
        dc[0]?.code || whOrder.discount_codes[0]?.code || null;
      // newOrder.discountInfo = [new DiscountInfo()];
      // newOrder.discountInfo = whOrder.discount_codes?.map(
      //   (dc: DiscountInfo) => new DiscountInfo(dc),
      // );
      newOrder.discountInfo = whOrder.discount_codes;
      newOrder.customer = new Customer();
      newOrder.customer.firstName = whOrder.customer.first_name;
      newOrder.customer.lastName = whOrder.customer.last_name;
      newOrder.customer.email = whOrder.customer.email;
      newOrder.customer.ip = whOrder.browser_ip;
      newOrder.customer.phone =
        whOrder.customer.phone || whOrder.shipping_address.phone;
      const newOrderSaved = await this.orderService.create(newOrder);

      const lineItems = await Promise.all(
        whOrder?.line_items?.map(async (item: any) => {
          const newItem = new CreateOrderInput();
          newItem.id = item.admin_graphql_api_id;
          newItem.parentId = whOrder.admin_graphql_api_id;
          newItem.shop = shop;
          newItem.product = new LineProduct();
          newItem.product.id = `gid://shopify/Product/${item.product_id}`;
          newItem.price = item.price;
          newItem.quantity = item.quantity;
          newItem.totalDiscounts = item.total_discount;
          newItem.shopifyCreatedAt = whOrder.created_at;
          return await this.orderService.create(newItem);
          // return newItem;
        }),
      );

      const newOrderPlaced = new OrderPlacedEvent();
      newOrderPlaced.order = newOrderSaved;
      newOrderPlaced.store = await this.storesService.findOneWithActiveCampaing(
        shop,
      );
      newOrderPlaced.lineItems = lineItems;
      this.eventEmitter.emit('order.placed', newOrderPlaced);
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
