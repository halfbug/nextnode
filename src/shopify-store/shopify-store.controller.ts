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
    const store = await this.storesService.findOne(shop);
    if (store) res.redirect(this.storeService.goToAppfront(store));
    else if (shop) return this.storeService.login(req, res, shop);
    else console.log('referer : ', req.headers.referer);
  }

  @Get('callback')
  callback(@Req() req: Request, @Res() res: Response) {
    console.log('inside call back auth end');
    console.log('req.quer :', req.query);
    console.log('req.body :', req.body);
    return this.storeService.callback(req, res, req.query.shop);
  }

  @Get('me')
  async whoami(@Query('name') name: any) {
    const { brandName, shop, id, activeCampaign } =
      await this.storesService.findOneWithActiveCampaing(name);
    console.log({ brandName, shop, id, activeCampaign });
    const photo = activeCampaign.settings.imageUrl.split('/')[4];
    const maxReward = activeCampaign.salesTarget.rewards[2].discount;
    // const photo = await this.imageService.getSignedUrl(imgPath );
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
  ) {
    const gs = await this.groupshopSrv.findAllByDate(
      new Date(sdate),
      new Date(edate),
    );
    return (
      `<h3>total Groupshops : ${gs.length} </h3> <pre>` +
      gs.map(
        (g, idx) =>
          `${idx + 1}. <a href="${this.configService.get('FRONT')}${g.url}">${
            g.url
          } </a> <br/>`,
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
    return typeof this.configService.get('BILLING_LIVE');
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
}
