import {
  Controller,
  forwardRef,
  Get,
  Inject,
  Query,
  Req,
  Res,
} from '@nestjs/common';
import { Request, Response } from 'express';
import { BillingsService } from 'src/billing/billing.service';
import { CampaignsService } from 'src/campaigns/campaigns.service';
import { ConfigService } from '@nestjs/config';
import { GroupshopsService } from 'src/groupshops/groupshops.service';
import { InventoryService } from 'src/inventory/inventory.service';
import { OrdersService } from 'src/inventory/orders.service';
import { StoresService } from 'src/stores/stores.service';
import { ShopifyService } from './shopify/shopify.service';
import { StoreService } from './store/store.service';
import { UploadImageService } from './ImageUpload/uploadimage.service';
import { HttpService } from '@nestjs/axios';
import { lastValueFrom, map } from 'rxjs';
import { PartnerService } from 'src/partners/partners.service';
import { EncryptDecryptService } from 'src/utils/encrypt-decrypt/encrypt-decrypt.service';
import { AuthService } from 'src/auth/auth.service';
import { Public } from 'src/auth/public.decorator';
@Public()
@Controller()
export class ShopifyStoreController {
  constructor(
    private storeService: StoreService,
    // private awsService: AwsService,
    // @Inject(forwardRef(() => InventoryService))
    private inventorySrv: InventoryService,
    private campaignSrv: CampaignsService,
    private ordersSrv: OrdersService,
    private groupshopSrv: GroupshopsService,
    private storesService: StoresService,
    private billingService: BillingsService,
    private shopifyService: ShopifyService,
    private configService: ConfigService,
    private imageService: UploadImageService,
    private httpService: HttpService,
    private partnerGSSrv: PartnerService,
    private readonly crypt: EncryptDecryptService,
    private readonly authService: AuthService,
  ) {}

  // @Get()
  // first(@Req() req: Request, @Res() res: Response) {
  //   console.log(req.query);
  //   res.send(req.query);
  // }

  // @Get('login')
  @Get()
  async login(@Req() req: Request, @Res() res: Response) {
    console.log('inside login get request');
    const { query } = req;
    const shop = query.shop as string;

    // const store = await this.storesService.findOne(shop);
    // console.log(
    //   '🚀 ~ file: shopify-store.controller.ts ~ line 59 ~ ShopifyStoreController ~ login ~ store',
    //   store,
    // );
    // if (store && store.status === 'Active')
    //   return await this.storeService.loginOnline(req, res, shop);
    // else
    if (shop) return this.storeService.login(req, res, shop);
    else console.log('referer : ', req.headers.referer);
    // res.redirect(this.storeService.goToAppfront(store));
    // https://native-roots-dev.myshopify.com/admin/auth/login
  }

  @Get('callback')
  async callback(@Req() req: Request, @Res() res: Response) {
    console.log('inside shoify store callback');
    console.log('req.quer :', req.query);
    console.log('req.body :', req.body);
    const store = await this.storesService.findOne(req.query.shop as string);
    return this.storeService.callback(
      req,
      res,
      req.query.shop,
      store && store.status !== 'Uninstalled',
    );
  }

  // @Get('online/callback')
  // callbackOnline(@Req() req: Request, @Res() res: Response) {
  //   console.log('inside online callback');
  //   console.log('req.quer :', req.query);
  //   console.log('req.body :', req.body);
  //   return this.storeService.callback(req, res, req.query.shop);
  // }
  @Get('me')
  async whoami(@Query('name') name: any) {
    const { brandName, shop, id, activeCampaign, settings } =
      await this.storesService.findOneWithActiveCampaing(name);
    // console.log(
    //   '🚀 ~ file: shopify-store.controller.ts ~ line 73 ~ ShopifyStoreController ~ whoami ~ activeCampaign',
    //   activeCampaign,
    // );
    // console.log({ settings, brandName, shop, id, activeCampaign });
    const photo = settings?.general
      ? settings?.general?.imageUrl.split('/')[4]
      : activeCampaign.settings?.general?.imageUrl.split('/')[4];
    const maxReward = activeCampaign.salesTarget.rewards[2].discount;
    // const photo = await this.imageService.getSignedUrl(imgPath );
    // console.log('response', brandName, shop, id, photo, maxReward);
    return { brandName, shop, id, photo, maxReward };
  }
  @Get('mepartner')
  async whoamii(@Query('name') name: any) {
    const {
      partnerRewards: { baseline },
      store,
      campaign,
      shop,
    } = await this.partnerGSSrv.findOne(this.crypt.decrypt(name));
    const photo = store?.settings?.general
      ? store?.settings?.general?.imageUrl.split('/')[4]
      : campaign.settings?.general?.imageUrl.split('/')[4];
    const maxReward = baseline;
    const id = store?.id;
    const brandName = store?.brandName;
    return { brandName, shop, id, photo, maxReward };
  }

  @Get('load-products')
  async getStoreProducts() {
    const result = await this.storeService.loadProducts();
    // console.log(products);

    // .then((res) => {
    //   console.log(res);
    //   return res;
    // });
    if (result) {
      console.log(result);
      return result;
    }
    // return products;
    return console.log('not done yet');
  }
  @Get('test')
  async test() {
    return 'running server on port 5000';
  }

  @Get('refresh')
  async dbfresh() {
    try {
      const shop = 'native-roots-dev.myshopify.com';
      const store = await this.storesService.findOne(shop);
      this.shopifyService.accessToken = store.accessToken;
      this.shopifyService.shop = shop;
      if (store?.resources?.length > 0)
        store?.resources?.map((res) => {
          if (res.type === 'scriptTag') {
            this.shopifyService.scriptTagDelete(res.id);
          }
        });
      await this.inventorySrv.removeShop(shop);
      await this.ordersSrv.removeShop(shop);
      await this.campaignSrv.removeShop(store.id);
      await this.groupshopSrv.removeShop(store.id);
      await this.storesService.removeShop(shop);
      await this.billingService.removeByShop(store.id);
      return 'done';
    } catch (error) {
      return error.message;
    }
  }

  @Get('gs')
  async gropshopTestUrl(
    @Query('sdate') sdate: string,
    @Query('edate') edate: string,
    @Query('shop') shop: string,
  ) {
    const gs = await this.groupshopSrv.findAllByDate(
      new Date(sdate),
      new Date(edate),
      shop,
    );

    return (
      `<h3>total Groupshops : ${gs.length} </h3> <pre>` +
      gs.map(
        (g, idx) =>
          `${idx + 1}. <a href="${this.configService.get('FRONT')}${g.url}">${
            g.url
          } </a> <br/>`,

        // &nbsp;&nbsp; ${
        //   g.members[0].orderDetail.customer.email
        // } <br/><br/>`,
      ) +
      '</pre>'
    );
  }
  @Get('healthcheck')
  async testme() {
    return `server is running properly with CI/CD on
    HOST: ${process.env.HOST}
    FRONT: ${process.env.FRONT}`;
  }

  @Get('type')
  async tesstme() {
    return this.configService.get('BILLING_LIVE');
  }

  @Get('orderinput')
  async orderinput(@Query('id') id: string) {
    const orderRes = await this.groupshopSrv.getOrderDetails(id);
    const accessToken = orderRes[0]?.storeData.accessToken;
    const shop = orderRes[0]?.storeData.shop;
    const apiUrl = `https://${shop}/admin/api/2021-10/orders/${id}.json?access_token=${accessToken}`;
    const res = await lastValueFrom(
      this.httpService.get(apiUrl).pipe(map((res) => res.data)),
    );
    return res;
  }
  @Get('gsp')
  async gropshopPartnerTestUrl(
    @Query('sdate') sdate: string,
    @Query('edate') edate: string,
  ) {
    const gs = await this.partnerGSSrv.findAllByDate(
      new Date(sdate),
      new Date(edate),
    );
    return (
      `<h3>total Influencer Groupshops : ${gs.length} </h3> <pre>` +
      gs.map(
        (g, idx) =>
          `${idx + 1}. <a href="${this.configService.get('FRONT')}${g.url}">${
            g.url
          }</a>&nbsp;&nbsp; ${g.partnerDetails.email} <br/><br/>`,
      ) +
      '</pre>'
    );
  }
  @Get('billing-status')
  async checkbillstatus() {
    return {
      billingStatus: this.configService.get('BILLING_LIVE'),
    };
  }
}
