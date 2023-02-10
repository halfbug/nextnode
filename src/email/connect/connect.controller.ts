import {
  Controller,
  forwardRef,
  Logger,
  Get,
  Inject,
  Req,
  Res,
  Param,
  Query,
} from '@nestjs/common';
import { Request, Response } from 'express';
import { ConfigService } from '@nestjs/config';
import { HttpService } from '@nestjs/axios';
import { EventEmitter2 } from '@nestjs/event-emitter';
import { map } from 'rxjs/operators';
import { InventoryService } from 'src/inventory/inventory.service';
import { OrdersService } from 'src/inventory/orders.service';
import { GroupshopSavedEvent } from 'src/groupshops/events/groupshop-saved.event';
import { KalavioService } from '../kalavio.service';
import { ShopifyService } from 'src/shopify-store/shopify/shopify.service';
import { StoreService } from 'src/shopify-store/store/store.service';
import { OrdersReceivedEvent } from 'src/shopify-store/events/orders-received.event';
import { StoresService } from 'src/stores/stores.service';
import { DropsGroupshopService } from 'src/drops-groupshop/drops-groupshop.service';
import { DropCreatedEvent } from 'src/drops-groupshop/events/drop-created.event';
import { Cron, CronExpression } from '@nestjs/schedule';
// eslint-disable-next-line @typescript-eslint/ban-ts-comment
// @ts-ignore
import * as getSymbolFromCurrency from 'currency-symbol-map';
import { TokenReceivedEvent } from 'src/shopify-store/events/token-received.event';
import { UploadImageService } from 'src/shopify-store/ImageUpload/uploadimage.service';
import { CampaignsService } from 'src/campaigns/campaigns.service';
import { Public } from 'src/auth/public.decorator';
import { DropCreatedListener } from 'src/drops-groupshop/listeners/drop-created.listener';
import { UpdateDropsGroupshopInput } from 'src/drops-groupshop/dto/update-drops-groupshop.input';
import { EncryptDecryptService } from 'src/utils/encrypt-decrypt/encrypt-decrypt.service';
@Public()
@Controller('connect')
export class CatController {
  // [x: string]: any;
  constructor(
    private configService: ConfigService,
    private eventEmitter: EventEmitter2,
    private httpService: HttpService,
    private inventoryService: InventoryService,
    private shopifyService: ShopifyService,
    private storeService: StoreService,
    private readonly storesService: StoresService,
    private campaignsService: CampaignsService,
    private ordersService: OrdersService,
    private kalavioService: KalavioService,
    private uploadImageService: UploadImageService,
    private dropsGroupshopService: DropsGroupshopService,
    private dropCreatedEvent: DropCreatedEvent,
    private dropCreatedListener: DropCreatedListener,
    private readonly crypt: EncryptDecryptService,
  ) {}
  @Get('/')
  async test() {
    const groupshopSavedEvent = new GroupshopSavedEvent();
    groupshopSavedEvent.data = 'newGroupshop';
    this.eventEmitter.emit('groupshop.saved', groupshopSavedEvent);
    return 'running server on port 5000';
  }

  @Get('pull-orders')
  async pullOrders() {
    try {
      const { shop, accessToken } = await this.storesService.findOneById(
        '0ef135cd-c239-420e-a61f-5177e99c91ab',
      );
      const client = await this.shopifyService.client(shop, accessToken);
      const qres = await client.query({
        data: {
          query: `mutation {
            bulkOperationRunQuery(
             query:"""
              {
                 orders(first:5, , query: "created_at:>=2022-07-08"){
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
      // console.log(JSON.stringify(qres));
      console.log(qres.body['data']['bulkOperationRunQuery']['bulkOperation']);
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

  @Get('klaviyo-email')
  async klaviyoemailURL() {
    const today = new Date();
    const dd = String(today.getDate() - 1).padStart(2, '0');
    const mm = String(today.getMonth() + 1).padStart(2, '0'); //January is 0!
    const yyyy = today.getFullYear();

    const datetoday = yyyy + '-' + mm + '-' + dd;
    console.log(datetoday);
    const groupshops = await this.kalavioService.getGroupdealByDate(datetoday);
    //console.log(JSON.stringify(groupshops));
    groupshops.map(async (groupshop, key) => {
      if (key == 2) {
        const groupshopOwner = groupshop?.members[0];
        const orderId = groupshopOwner.orderId;
        let order_line_items = [];
        let campaigns_line_items = [];
        const campaigns_items = groupshop.campaigns[0].products.slice(0, 2);
        const memberLength = groupshop?.members.length || 0;
        let recDiscount = 0;

        const orderData = await this.ordersService.getOrderDetailsByOrderId(
          orderId,
        );

        orderData[0].LineItems.map((items) => {
          const itemQuantity = items.quantity;
          const itemPrice = items.price;
          const productID = items.product.id;
          const VariantId = items.variant.id;

          let variantTitle = '';
          items.product[0].variants.map((variant) => {
            if (VariantId == variant.id) {
              variantTitle = variant.title;
            }
          });
          const resData = {
            product_title: items.product[0].title,
            variant_title: variantTitle,
            orderProductImage: items.product[0].featuredImage,
            orderProductId: productID,
            orderPrice: itemPrice,
            orderQuantity: itemQuantity,
            orderTotalPrice: (itemPrice * itemQuantity)
              .toString()
              .match(/^-?\d+(?:\.\d{0,2})?/)[0],
          };
          order_line_items = [...order_line_items, { ...resData }];
        });

        const currencySymbol = getSymbolFromCurrency(
          groupshop.orders[0].currencyCode || 'USD',
        );
        let custName = groupshop.orders[0].customer.firstName;
        if (custName === '') {
          custName = groupshop.orders[0].customer.lasttName;
        }
        const campaigns = groupshop.campaigns;
        const shopName = groupshop.orders[0].shop;
        const discount_1 = campaigns[0].salesTarget.rewards[0].discount.replace(
          '%',
          '',
        );
        const discount_2 = campaigns[0].salesTarget.rewards[1].discount.replace(
          '%',
          '',
        );
        const discount_3 = campaigns[0].salesTarget.rewards[2].discount.replace(
          '%',
          '',
        );
        if (memberLength === 0) {
          recDiscount = 0;
        } else if (
          memberLength === 1 ||
          memberLength === 2 ||
          memberLength === 3
        ) {
          recDiscount = discount_1;
        } else if (memberLength === 4) {
          recDiscount = discount_2;
        } else if (memberLength === 5) {
          recDiscount = discount_3;
        }
        const discountCalculate = 50 - recDiscount;
        const calPrice = +(
          (discountCalculate / 100) *
          groupshop.orders[0].price
        )
          .toString()
          .match(/^-?\d+(?:\.\d{0,2})?/)[0];

        await Promise.all(
          campaigns_items.map(async (id) => {
            const campaignSingleProduct =
              await this.inventoryService.findProductById(id);
            const { title, price, totalDiscounts, featuredImage } =
              campaignSingleProduct;
            const variantPrice = (recDiscount / 100) * price;
            const prdId = id.replace('gid://shopify/Product/', '');
            // const getCollectionName =
            //   await this.inventoryService.getCollectionNameByProductId(
            //     shopName,
            //     id,
            //   );
            // const collectionName = getCollectionName[0]?.title || '';

            const campaignResult = {
              product_title: title,
              product_url: `${this.configService.get(
                'FRONT',
              )}${dealUrl}/product&${prdId}`,
              product_category: '',
              product_image:
                featuredImage !== '' ? featuredImage : 'dummy-image',
              product_price: price,
              sale_price: price - variantPrice,
            };
            campaigns_line_items = [
              ...campaigns_line_items,
              { ...campaignResult },
            ];
          }),
        );
        const customerEmail = groupshop.orders[0].customer.email;
        const imgPath = groupshop.stores[0].logoImage.split('/');
        const brandLogo = await this.uploadImageService.getSignedUrl(
          imgPath[4],
        );
        const dealUrl = groupshop.url;
        const shortLink = groupshop.shortUrl;
        const mdata = {
          customerEmail: customerEmail,
          customerName: custName,
          leftCashback: calPrice,
          shopUrl: `https://${groupshop.stores[0].shop}`,
          brandName: groupshop.stores[0].brandName,
          logoImage: brandLogo,
          getUptoDiscount: discountCalculate,
          total_price: groupshop.orders[0].price,
          currencyCode: currencySymbol,
          order_number: groupshop.orders[0].name,
          dealUrl: `${this.configService.get('FRONT')}${dealUrl}`,
          shortUrl: shortLink,
          campaignsLineItems: campaigns_line_items,
          orderLineItems: order_line_items,
        };
        //console.log(JSON.stringify('mdata : ' + JSON.stringify(mdata)));
        const body = {
          event: 'Groupshop Reminders Trigger',
          customer_properties: {
            $email: customerEmail,
          },
          properties: mdata,
        };
        this.kalavioService.sendKlaviyoEmail(body);
      }
    });
  }

  @Get('inventory-insert')
  async inventoryInsert(
    @Query('shop') shop: string,
    @Query('token') token: string,
  ) {
    console.log('inventory-insert  :: ' + shop);
    console.log('inventory-insert  :: ' + token);
    const tokenReceivedEvent = new TokenReceivedEvent();
    const session = {
      shop: shop,
      accessToken: token,
    };
    tokenReceivedEvent.token = session.accessToken;
    tokenReceivedEvent.session = session;
    this.eventEmitter.emit('token.received', tokenReceivedEvent);
  }

  @Get('campaign-insert')
  async campaignInsert() {
    const link = 'http://localhost:3000/native-roots-dev/deal/R1M1OTgxMjcwOQ==';
    const short = await this.kalavioService.generateShortLink(link);
    return { short };
  }

  @Get('update-klaviyo-profile')
  async updateKlaviyoProfile(@Req() req, @Res() res) {
    const { listId, shop } = req.query;

    const storeData = await this.storesService.findOne(shop);
    let nextPage = '';
    let counter = 0;
    let updatedCounter = 0;
    if (storeData?.drops?.rewards) {
      if (typeof listId !== 'undefined' && listId !== '') {
        Logger.log(
          `update-klaviyo-profile start for the   : ${shop} at ${new Date()}`,
          'updateKlaviyoProfile',
          true,
        );
        do {
          const profiles = await this.kalavioService.getProfilesByListId(
            listId,
            nextPage,
          );
          const nextPageLink = profiles?.links?.next
            ? profiles?.links?.next
            : '';
          if (nextPageLink !== '') {
            nextPage = nextPageLink.split('profiles/?')[1];
          } else {
            nextPage = '';
          }
          // console.log('profiles', JSON.stringify(profiles));
          profiles?.data.map(async (profile, index) => {
            const arrayLength = profiles.data.length;
            counter = counter + 1;
            const klaviyoId = profile?.id;
            const profilesExit =
              await this.dropsGroupshopService.findOneByKlaviyoId(klaviyoId);
            if (profilesExit?.id) {
              console.log('Exits ', klaviyoId);
            } else {
              updatedCounter = updatedCounter + 1;
              const webdata = {
                id: klaviyoId,
                first_name: profile?.attributes?.first_name,
                last_name: profile?.attributes?.last_name,
                email: profile?.attributes?.email,
                phone_number: profile?.attributes?.phone_number,
              };
              const inputListener: any = {};
              inputListener.webhook = webdata;
              inputListener.shop = shop;
              await this.dropCreatedListener.addDrop(inputListener);
            }
            // eslint-disable-next-line prettier/prettier
            if (nextPage === '' && arrayLength === (index + 1)) {
              console.log(
                `update-klaviyo-profile completed ${updatedCounter}/${counter} at ${new Date()} `,
              );
              Logger.log(
                `update-klaviyo-profile completed ${updatedCounter}/${counter} at ${new Date()} `,
                'updateKlaviyoProfile',
                true,
              );
            }
          });
        } while (nextPage !== '');
        res.status(200).send('Success');
      } else {
        res.status(200).send('listId not found!');
      }
    } else {
      res.status(200).send('Store rewards not found!');
    }
  }

  // Drop static function for stage testing
  @Get('drop-cron')
  async dropCron(@Req() req, @Res() res) {
    const listId = 'XHxSUT'; // Drop Development Stage Team
    const shop = 'native-root-stage.myshopify.com';
    let lastWeek: any = '';
    let counter = 0;
    let updatedCounter = 0;
    const d = new Date(new Date().setDate(new Date().getDate() - 7));
    const year = d.getFullYear();
    const month = ('0' + (d.getMonth() + 1)).slice(-2);
    const day = ('0' + d.getDate()).slice(-2);
    lastWeek = Date.parse(`${year}${'-'}${month}${'-'}${day}`);
    let nextPage = '';
    Logger.log(
      `Weekly Drop Cron start for the listId : ${listId} at ${new Date()}`,
      'WeeklyDropCron',
      true,
    );
    do {
      const profiles = await this.kalavioService.getProfilesByListId(
        listId,
        nextPage,
      );
      const nextPageLink = profiles?.links?.next ? profiles?.links?.next : '';
      if (nextPageLink !== '') {
        nextPage = nextPageLink.split('profiles/?')[1];
      } else {
        nextPage = '';
      }
      // console.log('profiles', JSON.stringify(profiles));
      profiles?.data.map(async (profile, index) => {
        const arrayLength = profiles.data.length;
        counter = counter + 1;
        const klaviyoId = profile?.id;
        const createdAt = profile.attributes.properties?.groupshop_created_at;
        const drop_source = profile.attributes.properties?.groupshop_source
          ? profile.attributes.properties?.groupshop_source
          : '';

        if (drop_source === 'API' && createdAt > lastWeek) {
          console.log('Drop recently created ', klaviyoId);
        } else {
          updatedCounter = updatedCounter + 1;
          const dropGroupshops =
            await this.dropsGroupshopService.getGroupshopByKlaviyoId(klaviyoId);
          // Update status in database of old pending drop groupshop
          dropGroupshops.map(async (dgroupshop) => {
            dgroupshop.status = 'expired';
            await this.dropsGroupshopService.update(dgroupshop.id, dgroupshop);
          });
          const webdata = {
            id: klaviyoId,
            first_name: profile?.attributes?.first_name,
            last_name: profile?.attributes?.last_name,
            email: profile?.attributes?.email,
            phone_number: profile?.attributes?.phone_number,
          };
          const inputListener: any = {};
          inputListener.webhook = webdata;
          inputListener.shop = shop;
          await this.dropCreatedListener.addCronDrop(inputListener);
        }
        // eslint-disable-next-line prettier/prettier
         if (nextPage === '' && arrayLength === (index + 1)) {
          console.log(
            `Weekly Drop Cron completed ${updatedCounter}/${counter} at ${new Date()} `,
          );
          Logger.log(
            `Weekly Drop Cron completed ${updatedCounter}/${counter} at ${new Date()} `,
            'WeeklyDropCron',
            true,
          );
        }
      });
    } while (nextPage !== '');
    res.status(200).send('Success');
  }

  @Cron('*/10 * * * * FRI') // CronExpression.EVERY_WEEK)
  @Get('update-shortlink')
  async updateShortLink(@Req() req, @Res() res) {
    const dropGroupshops =
      await this.dropsGroupshopService.findMissingDropShortLinks();
    console.log('dropGroupshops', JSON.stringify(dropGroupshops));
    if (dropGroupshops.length > 0) {
      dropGroupshops.forEach(async (profile, index) => {
        const klaviyoId = profile.customerDetail.klaviyoId;
        let shortUrl = profile.shortUrl;
        let expiredShortUrl = profile.expiredShortUrl;
        if (shortUrl.includes('app.groupshop.co')) {
          shortUrl = await this.kalavioService.generateShortLink(shortUrl);
          console.log('shortUrl ', shortUrl);
          profile.shortUrl = shortUrl;
        }
        if (expiredShortUrl.includes('app.groupshop.co')) {
          expiredShortUrl = await this.kalavioService.generateShortLink(
            expiredShortUrl,
          );
          console.log('expiredShortUrl ', expiredShortUrl);
          profile.expiredShortUrl = expiredShortUrl;
        }
        await this.dropsGroupshopService.update(profile.id, profile);
        const params = new URLSearchParams({
          groupshop_url: shortUrl,
          reactivate_groupshop: expiredShortUrl,
        });
        const data = params.toString();
        await this.kalavioService.klaviyoProfileUpdate(klaviyoId, data);
      });
    }
    res.status(200).send('Success');
  }

  @Get('setdiscountcode?')
  async setdiscountcode(@Query('shop') shop: any, @Query('url') url: any) {
    try {
      let dgroupshop = new UpdateDropsGroupshopInput();
      const discountTitle = await this.crypt.decrypt(url.split('/')[3]);
      dgroupshop = await this.dropsGroupshopService.findOneByURL(url);
      const {
        id,
        accessToken,
        drops: {
          rewards: { baseline },
          bestSellerCollectionId,
          latestCollectionId,
          allProductsCollectionId,
        },
      } = await this.storesService.findOne(shop);
      const discountCode = await this.shopifyService.setDiscountCode(
        shop,
        'Create',
        accessToken,
        discountTitle,
        parseInt(baseline, 10),
        [bestSellerCollectionId, latestCollectionId, allProductsCollectionId],
        new Date(),
        null,
        null,
        true,
      );
      dgroupshop.discountCode = discountCode;
      await this.dropsGroupshopService.update(dgroupshop.id, dgroupshop);
      return discountCode;
    } catch (err) {
      console.log(err);
    }
  }

  @Get('updateAllDiscounts')
  async updateAllDiscounts() {
    console.log(`Update all discount`);
    const allDrops = await this.dropsGroupshopService.findAllNullDiscounts();

    allDrops.forEach(async ({ url, storeId }) => {
      console.log(
        '🚀 ~ file: connect.controller.ts:619 ~ CatController ~ allDrops.forEach ~ url',
        url,
      );
      try {
        let dgroupshop = new UpdateDropsGroupshopInput();
        const discountTitle = await this.crypt.decrypt(url.split('/')[3]);
        dgroupshop = await this.dropsGroupshopService.findOneByURL(url);
        const {
          id,
          accessToken,
          shop,
          drops: {
            rewards: { baseline },
            bestSellerCollectionId,
            latestCollectionId,
            allProductsCollectionId,
          },
        } = await this.storesService.findById(storeId);
        setTimeout(() => console.log('discount going to execute'), 8000);
        // await new Promise(() =>
        //   setTimeout(() => console.log('discount going to execute'), 5000),
        // );
        const discountCode = await this.shopifyService.setDiscountCode(
          shop,
          'Create',
          accessToken,
          discountTitle,
          parseInt(baseline, 10),
          [bestSellerCollectionId, latestCollectionId, allProductsCollectionId],
          new Date(),
          null,
          null,
          true,
        );
        dgroupshop.discountCode = discountCode;
        console.log(
          '🚀 ~ file: connect.controller.ts:607 ~ CatController ~ allDrops.forEach ~ discountCode',
          discountCode,
        );
        await this.dropsGroupshopService.update(dgroupshop.id, dgroupshop);
        return discountCode;
      } catch (err) {
        console.log(err);
      }
    });
  }
}
