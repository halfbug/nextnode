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
import { UpdateOrderInput } from 'src/inventory/dto/update-order.input';
import { StoresService } from 'src/stores/stores.service';
import { ConfigService } from '@nestjs/config';
import { EventEmitter2 } from '@nestjs/event-emitter';
import { OrderPlacedEvent } from '../events/order-placed.envent';
import { ShopifyService } from '../shopify/shopify.service';
import { KalavioService } from 'src/email/kalavio.service';
import Orders from 'src/inventory/entities/orders.modal';
import { UninstallService } from 'src/stores/uninstall.service';
import { OrderCreatedEvent } from '../events/order-created.event';
import {
  Product,
  ProductImage,
  SelectedOption,
} from 'src/inventory/entities/product.entity';
// import Product from 'src/campaigns/entities/product.model';
import { HttpService } from '@nestjs/axios';
import readJsonLines from 'read-json-lines-sync';
import { Inventory } from 'src/inventory/entities/inventory.entity';
import InventoryModal from 'src/inventory/entities/inventory.modal';
import { InventorySavedEvent } from 'src/inventory/events/inventory-saved.event';
import { OrdersSavedEvent } from 'src/inventory/events/orders-saved.event';
import { RequestReturn } from '@shopify/shopify-api';
import { UpdateFullOrderInput } from 'src/inventory/dto/update-fullorder.input';
import { ProductMediaObject } from 'src/inventory/events/product-media.event';
import { ProductMediaListener } from 'src/inventory/listeners/product-media.listner';
import { LifecycleService } from 'src/gs-common/lifecycle.service';
import { EventType } from 'src/gs-common/entities/lifecycle.modal';
import { BillingPlanEnum } from 'src/stores/entities/store.entity';
import { Public } from 'src/auth/public.decorator';
@Public()
@Controller('webhooks')
export class WebhooksController {
  constructor(
    private storesService: StoresService,
    private shopifyService: ShopifyService,
    private inventryService: InventoryService,
    private orderService: OrdersService,
    private kalavioService: KalavioService,
    private eventEmitter: EventEmitter2,
    private configSevice: ConfigService,
    private uninstallSerivice: UninstallService,
    private orderCreatedEvent: OrderCreatedEvent,
    private httpService: HttpService,
    public productMedia: ProductMediaObject,
    private lifecyclesrv: LifecycleService,
  ) {}
  async refreshSingleProduct(shop, accessToken, id, shopName) {
    try {
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
            variants(first: 30, reverse: true) {
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
      // const isAvailable = variants.some(
      //   ({ node: { inventoryQuantity } }) => inventoryQuantity > 0,
      // );
      // nprod.outofstock = !isAvailable;
      nprod.options = prod.options.map(({ id, name, position, values }) => ({
        id,
        name,
        position,
        values,
      }));
      nprod.outofstock = this.inventryService.calculateOutOfStock(variants);
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
  @Get('register')
  async register(@Query('shopName') shopName: any) {
    try {
      const { shop, accessToken } = await this.storesService.findOne(shopName);
      console.log(
        '🚀 ~ file: webhooks.controller.ts ~ line 11 ~ WebhooksController ~ register ~ shop',
        shop,
      );
      const rhook = await this.shopifyService.registerHook(
        shop,
        accessToken,
        // '/webhooks/product-update',
        // 'PRODUCTS_UPDATE',
        '/webhooks/customer-update',
        'CUSTOMERS_UPDATE',
      );
      console.log('yes register');
      console.log(rhook);

      return 'yes done';
    } catch (err) {
      console.log(JSON.stringify(err));
    }
  }

  // http://localhost:5000/webhooks/storeswh?topic=COLLECTIONS_CREATE&path=collection-listing-update
  @Get('storeswh')
  async registerWebHookForAllStores(
    @Query('topic') topic: any,
    @Query('path') path: any,
  ) {
    try {
      const stores = await this.storesService.findAll();

      stores.map(async (store) => {
        const { shop, accessToken } = store;
        const client = await this.shopifyService.client(shop, accessToken);
        console.log(
          '🚀 ~ file: webhooks.controller.ts ~ line 11 ~ WebhooksController ~ register ~ shop',
          shop,
        );
        const rhook = await this.shopifyService.registerHook(
          shop,
          accessToken,
          // '/webhooks/product-update',
          // 'PRODUCTS_UPDATE',
          '/webhooks/' + path,
          topic,
        );
        const id =
          rhook['result']['data']['webhookSubscriptionUpdate'][
            'webhookSubscription'
          ]['id'];
        // console.log('yes register');
        console.log(
          'color: #007acc;',
          '%c rhook ->',
          JSON.stringify(
            rhook['result']['data']['webhookSubscriptionUpdate'][
              'webhookSubscription'
            ]['id'],
            null,
            '\t',
          ),
        );
        console.log(rhook);
        const qres = await client.query({
          data: {
            query: `query webhookSubscription($id: ID!){
            
              webhookSubscription(id: $id) {
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
            variables: {
              id: id,
            },
          },
        });
        console.log('🚀 ~ hook detail', JSON.stringify(qres));
        console.log(
          '-hook detail',
          'color: #007acc;',
          JSON.stringify(qres, null, '\t'),
        );
      });
      return 'done-check console for detail';
    } catch (err) {
      console.log(JSON.stringify(err));
    }
  }

  @Get('price-rule')
  async getPriceRuleById(
    @Query('shopName') shopName: any,
    @Query('id') id: any,
  ) {
    // return 'yes inside';
    try {
      const { shop, accessToken } = await this.storesService.findOne(shopName);
      this.shopifyService.accessToken = accessToken;
      // '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';
      this.shopifyService.shop = shop;
      const client = await this.shopifyService.client(shop, accessToken);
      const qres = await client.query({
        data: {
          query: `query priceRule($id: ID!){
          
            priceRule(id: $id) {
              id
            title
            target
            startsAt
            endsAt
            status
            summary
            }
        
      }`,
          variables: {
            id: id,
          },
        },
      });
      console.log('🚀 ~ price rule detail', JSON.stringify(qres));

      return qres;
    } catch (err) {
      console.log(JSON.stringify(err));
    }
  }
  @Get('price-rule-edit')
  async updatePriceRuleById(
    @Query('shopName') shopName: any,
    @Query('id') id: any,
  ) {
    // return 'yes inside';
    try {
      const { shop, accessToken } = await this.storesService.findOne(shopName);
      this.shopifyService.accessToken = accessToken;
      // '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';
      this.shopifyService.shop = shop;
      return await this.shopifyService.setDiscountCode(
        shop,
        'Update',
        accessToken,
        'GS7966642363',
        null,
        null,
        new Date('2022-06-08T00:55:27.781+00:00'),
        new Date('2022-07-01T17:29:04.929+00:00'),
        id,
      );

      // return qres;
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
    // try {
    // console.log(sid);
    const { shop, accessToken } = await this.storesService.findOne(shopName);
    this.shopifyService.accessToken = accessToken;
    this.shopifyService.shop = shop;
    return await this.shopifyService.scriptTagDelete(sid);
    // return 'check console' + sid;
    // } catch (err) {
    // console.log(JSON.stringify(err));
    // }
  }

  @Post('product-create?')
  async createProducts(@Req() req, @Res() res) {
    try {
      const { shop } = req.query;
      const rproduct = req.body;
      console.log('Webhook : PRODUCT_CREATED : ', JSON.stringify(rproduct));
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
      // nprod.description = rproduct.body_html.replace(/<\/?[^>]+(>|$)/g, '');
      nprod.description = rproduct.body_html;
      // if product is not active then it will be not purchaseable.
      if (nprod.status !== 'ACTIVE') nprod.outofstock = true;
      await this.inventryService.create(nprod);

      //add variat
      const vprod = nprod;
      rproduct.variants?.map(async (variant) => {
        vprod.id = variant.admin_graphql_api_id;
        vprod.title = variant?.title;
        vprod.parentId = rproduct?.admin_graphql_api_id;
        vprod.recordType = 'ProductVariant';
        vprod.createdAtShopify = variant?.created_at;
        vprod.publishedAt = rproduct?.published_at;
        vprod.inventoryManagement = variant?.inventory_management;
        vprod.inventoryPolicy = variant?.inventory_policy;
        vprod.price = variant.price;
        vprod.inventoryQuantity = variant?.inventory_quantity;
        const img = new ProductImage();
        img.src = variant.image_id
          ? rproduct.images.filter((img) => img.id === variant.image_id)?.[0]
              .src
          : rproduct?.image.src;
        vprod.image = img;
        vprod.selectedOptions = rproduct.options.map((item, index) => {
          const sOpt = new SelectedOption();
          sOpt.name = item.name;
          sOpt.value = variant[`option${index + 1}`];
          return sOpt;
        });

        await this.inventryService.create(vprod);
      });
      rproduct.images.map((img) => {
        const vprod = new CreateInventoryInput();
        vprod.id = img.admin_graphql_api_id;
        vprod.parentId = rproduct.admin_graphql_api_id;
        vprod.recordType = 'ProductImage';
        vprod.shop = shop;
        // image
        vprod.src = img.src;

        this.inventryService.create(vprod);
      });
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
      this.productMedia.productId = rproduct.admin_graphql_api_id;
      this.productMedia.shopName = shop;
      // const ProductMedia = new ProductMediaObject();
      // console.log(
      //   'WebhooksController ~ productUpdate ~ rproduct',
      //   JSON.stringify(rproduct),
      // );
      const nprod = new UpdateInventoryInput();
      // nprod.id = rproduct.id;
      nprod.id = rproduct?.admin_graphql_api_id;
      nprod.createdAtShopify = rproduct?.created_at;
      nprod.publishedAt = rproduct?.published_at;
      nprod.title = rproduct?.title;
      nprod.status = rproduct?.status?.toUpperCase();
      nprod.price = rproduct?.variants[0]?.price; //
      nprod.featuredImage = rproduct?.image?.src;
      // nprod.description = rproduct.body_html.replace(/<\/?[^>]+(>|$)/g, '');
      nprod.description = rproduct.body_html;
      // let qDifference: number;
      // const isAvailable = rproduct.variants.some(
      //   (item) => item.inventory_quantity > 0,
      // );

      // !isAvailable;
      nprod.options = rproduct.options.map(
        ({ id, name, position, values }) => ({
          id,
          name,
          position,
          values,
        }),
      );

      await this.inventryService.removeVariants(rproduct?.admin_graphql_api_id);
      this.productMedia.emit();
      const videoURL = await this.inventryService.findOne(shop, 'ProductVideo');
      console.log('videoURL', videoURL);
      const variants = [];
      rproduct.variants?.map(async (variant) => {
        const vprod = new CreateInventoryInput();
        vprod.id = variant.admin_graphql_api_id;
        vprod.title = variant?.title;
        vprod.parentId = rproduct?.admin_graphql_api_id;
        vprod.recordType = 'ProductVariant';
        vprod.createdAtShopify = variant?.created_at;
        vprod.publishedAt = rproduct?.published_at;
        vprod.featuredImage = rproduct?.image?.src;
        vprod.shop = shop;
        vprod.inventoryManagement = variant?.inventory_management;
        vprod.inventoryPolicy = variant?.inventory_policy;
        const img = new ProductImage();
        img.src = variant.image_id
          ? rproduct.images.filter((img) => img.id === variant.image_id)?.[0]
              .src
          : rproduct?.image?.src;
        // rproduct?.image && rproduct?.image.src ? rproduct?.image.src : null;

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
        variants.push(vprod);
        await this.inventryService.create(vprod);
      });

      rproduct.images.map((img) => {
        const vprod = new CreateInventoryInput();
        vprod.id = img.admin_graphql_api_id;
        vprod.parentId = rproduct.admin_graphql_api_id;
        vprod.recordType = 'ProductImage';
        vprod.shop = shop;
        // image
        vprod.src = img.src;

        this.inventryService.create(vprod);
      });

      nprod.outofstock =
        nprod.status !== 'ACTIVE'
          ? true
          : this.inventryService.calculateOutOfStock(variants);
      await this.inventryService.update(nprod);
      // console.log(
      //   '🚀 ~ file: webhooks.controller.ts ~ line 590 ~ WebhooksController ~ productUpdate ~ nprod',
      //   nprod,
      // );

      // res.send('product updated..');
    } catch (err) {
      console.log(JSON.stringify(err));
    } finally {
      res.status(HttpStatus.OK).send();
    }
  }
  // http://localhost:5000/webhooks/product?shopName=youngandrecklessdev.myshopify.com&id=gid://shopify/Product/3990782902375
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
              variants(first: 30, reverse: true) {
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
      // const isAvailable = variants.some(
      //   ({ node: { inventoryQuantity } }) => inventoryQuantity > 0,
      // );
      // nprod.outofstock = !isAvailable;
      nprod.options = prod.options.map(({ id, name, position, values }) => ({
        id,
        name,
        position,
        values,
      }));
      nprod.outofstock = this.inventryService.calculateOutOfStock(variants);
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

      return `${JSON.stringify(Prd)}`;
    } catch (err) {
      console.log(JSON.stringify(err));
    }
  }

  @Post('order-create?')
  async orderCreate(@Req() req, @Res() res) {
    try {
      const { shop } = req.query;
      // console.log(
      //   'WebhooksController ~ orderCreate ~ webhookData',
      //   JSON.stringify(req.body),
      // );
      // const webhook = req.body;
      if (req.body.source_name !== 'pos') {
        this.orderCreatedEvent.webhook = req.body;
        this.orderCreatedEvent.shop = shop;
        this.orderCreatedEvent.emit();
      }

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

  @Post('customer-update?')
  async customerUpdate(@Req() req, @Res() res) {
    res.status(HttpStatus.OK).send();
  }

  @Post('collection-create?')
  async collectionCreate(@Req() req, @Res() res) {
    try {
      const { shop } = req.query;
      const rproduct = req.body;
      console.log(
        'WebhooksController ~ collection-create ~ rproduct',
        JSON.stringify(rproduct),
        shop,
      );

      // const { result } = await this.inventryService.remove(
      //   JSON.stringify(rproduct.id),
      // );
      // res.send(result.deletedCount);
    } catch (err) {
      console.log(JSON.stringify(err));
    } finally {
      res.status(HttpStatus.OK).send();
    }
  }

  @Post('collection-update?')
  async collectionUpdate(@Req() req, @Res() res) {
    try {
      // 1. receive collection webhook
      const { shop: shopName } = req.query;
      const rcollection = req.body;
      console.log(
        'WebhooksController ~ collection-update ~ ',
        JSON.stringify(rcollection),
        shopName,
      );

      // 2. delete all previous products collection
      await this.inventryService.remove(rcollection.admin_graphql_api_id);

      // 3. get collection detail from shopify IF its a published collection
      if (rcollection.published_at) {
        const { shop, accessToken } = await this.storesService.findOne(
          shopName,
        );
        const client = await this.shopifyService.client(shopName, accessToken);

        const qres = await client.query({
          data: {
            query: `mutation {
          bulkOperationRunQuery(
            query:"""
            {
              collection(id: "${rcollection.admin_graphql_api_id}") {
                      title
                      id
                      productsCount
                      products(first:10000, reverse: true, sortKey:CREATED){
                        edges{
                          node{
                            title
                            id
                            status
                            createdAt
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
        // console.log(
        //   qres.body['data']['bulkOperationRunQuery']['bulkOperation'],
        // );
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

            // console.log(poll.body['data']['currentBulkOperation']);
            if (
              poll.body['data']['currentBulkOperation']['status'] ===
              'COMPLETED'
            ) {
              clearInterval(pollit);

              // fire inventory received event
              const url = poll.body['data']['currentBulkOperation'].url;
              this.httpService.get(url).subscribe(async (res) => {
                const productsArray = readJsonLines(res.data);
                // console.log(
                //   '\x1b[44m%s\x1b[0m',
                //   'webhooks.controller.ts line:961 inventoryArray',
                //   JSON.stringify(productsArray, null, '\t'),
                // );
                /* 4. loop to the products 
                    5. add collection to products 
      */
                const collectionObjs = productsArray.map((product) => ({
                  id: rcollection.admin_graphql_api_id,
                  title: rcollection.title,
                  // description: rcollection.body_html.replace(
                  //   /<\/?[^>]+(>|$)/g,
                  //   '',
                  // ),
                  description: rcollection.body_html,
                  productsCount: productsArray.length,
                  sortOrder: rcollection.sort_order.toUpperCase(),
                  featuredImage: rcollection?.image?.src,
                  parentId: product.id,
                  shop,
                  recordType: 'Collection',
                }));

                // console.log(
                //   '\x1b[44m%s\x1b[0m',
                //   'webhooks.controller.ts line:982 collectionObjs',
                //   collectionObjs,
                // );

                await this.inventryService.insertMany(collectionObjs);
              });
            }
          }, 3000);
        } else console.log(JSON.stringify(qres.body['data']));
      }
    } catch (err) {
      console.log(JSON.stringify(err));
    } finally {
      res.status(HttpStatus.OK).send();
    }
  }

  @Post('billing-failure?')
  async billingFailure(@Req() req, @Res() res) {
    try {
      const { shop } = req.query;
      const rproduct = req.body;
      console.log(
        'WebhooksController ~ billing-failure ~ rproduct',
        JSON.stringify(rproduct),
        shop,
      );

      // const { result } = await this.inventryService.remove(
      //   JSON.stringify(rproduct.id),
      // );
      // res.send(result.deletedCount);
    } catch (err) {
      console.log(JSON.stringify(err));
    } finally {
      res.status(HttpStatus.OK).send();
    }
  }

  @Post('billing-success?')
  async billingSuccess(@Req() req, @Res() res) {
    try {
      const { shop } = req.query;
      const rproduct = req.body;
      console.log(
        'WebhooksController ~ billing-success ~ rproduct',
        JSON.stringify(rproduct),
        shop,
      );

      // const { result } = await this.inventryService.remove(
      //   JSON.stringify(rproduct.id),
      // );
      // res.send(result.deletedCount);
    } catch (err) {
      console.log(JSON.stringify(err));
    } finally {
      res.status(HttpStatus.OK).send();
    }
  }

  @Post('app-subscription?')
  async appSubscription(@Req() req, @Res() res) {
    try {
      const { shop } = req.query;
      const appsub = req.body;
      console.log(
        'WebhooksController ~ app-subscription ~ rproduct',
        JSON.stringify(appsub),
        shop,
      );
      const subscriptionStatus =
        appsub['app_subscription']['status'].toUpperCase();
      // if (appsub['app_subscription']['status'] === 'ACTIVE') {
      this.storesService.updateField(
        {
          shop,
          'subscription.appSubscription.id':
            appsub['app_subscription'].admin_graphql_api_id,
        },
        {
          'subscription.status': subscriptionStatus,
          installationStep: subscriptionStatus === 'ACTIVE' ? null : 5,
        },
      );
      // }
    } catch (err) {
      console.log(JSON.stringify(err));
    } finally {
      res.status(HttpStatus.OK).send();
    }
  }

  @Get('load-products')
  async loadProducts(@Query('shopName') shopName: any) {
    try {
      const { shop, accessToken } = await this.storesService.findOne(shopName);
      const products = await this.inventryService.findAllProductsOnly(shop);
      console.log(
        '🚀 ~ webhooks.controller.ts ~ line 812 ~ loadProducts ~ products',
        products[0].recordType,
      );
      // eslint-disable-next-line prefer-const
      let resStr = '';
      products.map(({ id, title }) => {
        console.log(title);
        const res = this.refreshSingleProduct(shop, accessToken, id, shopName);
        resStr = `${resStr} ${JSON.stringify(res)}`;
      });
      return JSON.stringify(resStr);
    } catch (err) {
      console.log(JSON.stringify(err));
    }
  }

  @Get('bulkimport')
  async bulkProducts(@Query('shopName') shopName: any) {
    try {
      // http://localhost:5000/webhooks/bulkimport?shopName=native-roots-dev.myshopify.com
      const { shop, accessToken } = await this.storesService.findOne(shopName);
      const client = await this.shopifyService.client(shop, accessToken);
      const qres = await client.query({
        data: {
          query: `mutation {
          bulkOperationRunQuery(
            query:"""
            {
              products(first: 2000, reverse: true)  {
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
                        images(first:20, reverse: true){
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
            const url = poll.body['data']['currentBulkOperation'].url;
            this.httpService.get(url).subscribe(async (res) => {
              const inventoryArray = readJsonLines(res.data);
              // 1- get all inventory
              const inventArr = inventoryArray.map((inventory) => {
                // add record type
                inventory.featuredImage = inventory?.featuredImage?.src;
                inventory.price =
                  inventory?.priceRangeV2?.maxVariantPrice?.amount ||
                  inventory.price;
                inventory.currencyCode =
                  inventory?.priceRangeV2?.maxVariantPrice?.currencyCode;

                //rename inventory __parentId
                if (inventory.__parentId) {
                  inventory.parentId = inventory.__parentId;
                  delete inventory.__parentId;
                }
                // add shop to inventory
                inventory.shop = shop;

                // add record type
                inventory.recordType = inventory.id.split('/')[3];

                inventory.createdAt = new Date();
                inventory.updatedAt = new Date();
                return inventory;
              });

              // 2. Get products
              const products = inventArr.filter(
                (item) => item.recordType === 'Product',
              );

              // products.map((product) => {
              //   console.log(
              //     '\x1b[36m%s\x1b[0m',
              //     '------ product.title : ',

              //     product.title,
              //   );
              //   // this.inventryService.remove(product.id);
              //   product.purchaseCount = 0;

              //   this.inventryService.update(product);
              //   this.inventryService.removeChildren(product.id);
              //   this.inventryService.insertMany(
              //     inventArr.filter((item) => item.parentId === product.id),
              //   );
              // });
              // setTimeout(
              //   async () =>
              await this.inventryService.removeShop(shop),
                //   5000,
                // );
                setTimeout(
                  async () => await this.inventryService.insertMany(inventArr),
                  5000,
                );
              console.log('color: #26bfa5;', '------------------------------');
              console.log(
                '%cwebhooks.controller.ts line:1114 total inventory received',
                'color: #007acc;',
                inventArr.length,
              );
              console.log(
                '%cwebhooks.controller.ts line:1119 total products',
                'color: white; background-color: #007acc;',
                products.length,
              );
              // OrdersSavedEvent -- Purchase Count
              const ordersSavedEvent = new OrdersSavedEvent();
              ordersSavedEvent.shop = shop;
              ordersSavedEvent.accessToken = accessToken;
              this.eventEmitter.emit('orders.saved', ordersSavedEvent);
              // InventorySavedEvent -- out of stock
              const inventorySavedEvent = new InventorySavedEvent();
              inventorySavedEvent.shop = shop;
              inventorySavedEvent.accessToken = accessToken;
              inventorySavedEvent.type = 'outofstock';
              this.eventEmitter.emit(
                'inventory.outofstock',
                inventorySavedEvent,
              );
            });
          }
        }, 3000);
      } else console.log(JSON.stringify(qres.body['data']));
      return JSON.stringify(JSON.stringify(qres.body['data']));
    } catch (err) {
      console.log(JSON.stringify(err));
    }
  }

  @Get('inevent')
  async importEvents(@Query('shopName') shopName: any) {
    // try {
    // http://localhost:5000/webhooks/inevent?shopName=native-roots-dev.myshopify.com
    const { shop, accessToken } = await this.storesService.findOne(shopName);
    // OrdersSavedEvent -- Purchase Count
    const ordersSavedEvent = new OrdersSavedEvent();
    ordersSavedEvent.shop = shop;
    ordersSavedEvent.accessToken = accessToken;
    this.eventEmitter.emit('orders.saved', ordersSavedEvent);
    // InventorySavedEvent -- out of stock
    const inventorySavedEvent = new InventorySavedEvent();
    inventorySavedEvent.shop = shop;
    inventorySavedEvent.accessToken = accessToken;
    inventorySavedEvent.type = 'outofstock';
    this.eventEmitter.emit('inventory.outofstock', inventorySavedEvent);
  }

  @Post('order-updated?')
  async orderUpdated(@Req() req, @Res() res) {
    try {
      const { shop } = req.query;
      const rorder = req.body;
      // console.log(
      //   'WebhooksController ~ orderUpdate ~ webhookData',
      //   JSON.stringify(req.body),
      // );

      const order = new UpdateFullOrderInput();
      order.id = rorder.admin_graphql_api_id;
      order.financialStatus = rorder.financial_status;
      if (rorder.financial_status.includes('refund')) {
        order.refundDetail = rorder.refunds?.map((refund) => {
          if (refund.order_adjustments.length > 0)
            return refund.order_adjustments?.map((oj: any) => ({
              date: refund.created_at,
              note: refund.note,
              type: 'amount adjustment',
              amount: oj.amount,
            }));
          else
            return refund.refund_line_items?.map((rl: any) => ({
              date: refund.created_at,
              note: refund.note,
              type: 'lineitem returned',
              lineItemId: rl.line_item.admin_graphql_api_id,
              amount: rl.subtotal,
              quantity: rl.quantity,
            }));
        });
      }
      order.refundDetail = order.refundDetail?.map((rd) => rd[0]);
      this.orderService.update(order);

      // res.send('order created..');
    } catch (err) {
      console.log(JSON.stringify(err));
    } finally {
      res.status(HttpStatus.OK).send();
    }
  }

  @Get('sync-pc?')
  async updatePurchaseCount(@Query('shop') shop: any, @Res() res) {
    try {
      // const allShopPrd = await this.inventryService.findAllProductsOnly(shop);
      // console.log(
      //   '🚀 ~ file: webhooks.controller.ts ~ line 1331 ~ WebhooksController ~ updatePurchaseCount ~ allShopPrd',
      //   allShopPrd.length,
      // );
      const nowdate = new Date(Date.now() - 15770000000);
      const PurchasedProducts =
        await this.orderService.getPurchasedProductsLastSixMonth(shop, nowdate);

      console.log(
        '🚀 ~ file: webhooks.controller.ts ~ line 1337 ~ WebhooksController ~ updatePurchaseCount ~ PurchasedProducts',
        PurchasedProducts.slice(0, 2),
      );
      const blukWrite = PurchasedProducts.map((item) => {
        return {
          updateOne: {
            filter: { id: item._id },
            update: { $set: { purchaseCount: item.purchaseCount } },
          },
        };
      });
      await this.inventryService.setPurchaseCount(blukWrite);
      // console.log('Product purchase count updated...');

      res.send({
        shop: PurchasedProducts,
        message: 'purchaseCount updated',
      });
    } catch (err) {
      console.log(JSON.stringify(err));
    } finally {
      res.status(HttpStatus.OK).send();
    }
  }
  @Post('plan-reset-date')
  async updatePlanResetDateAllStores(@Req() req, @Res() res) {
    try {
      const stores = await this.storesService.findActiveAll();
      stores.map(
        async ({ id, planResetDate, createdAt }) =>
          await this.storesService.update(id, { id, planResetDate: createdAt }),
      );
      res.send(JSON.stringify(stores));
    } catch (err) {
      console.log(JSON.stringify(err));
    } finally {
      res.status(HttpStatus.OK).send();
    }
  }
}
