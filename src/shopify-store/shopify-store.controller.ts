import { Controller, forwardRef, Get, Inject, Req, Res } from '@nestjs/common';
import { Request, Response } from 'express';
import { CampaignsService } from 'src/campaigns/campaigns.service';
import { GroupshopsService } from 'src/groupshops/groupshops.service';
import { InventoryService } from 'src/inventory/inventory.service';
import { OrdersService } from 'src/inventory/orders.service';
import { StoresService } from 'src/stores/stores.service';
import { StoreService } from './store/store.service';

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
    console.log(req.query);
    console.log(req.body);
    return this.storeService.callback(req, res, req.query.shop);
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
      await this.inventorySrv.removeShop(shop);
      await this.ordersSrv.removeShop(shop);
      await this.campaignSrv.removeShop(store.id);
      await this.groupshopSrv.removeShop(store.id);
      await this.storesService.removeShop(shop);
      return 'done';
    } catch (error) {
      return error.message;
    }
  }

  @Get('gs')
  async gropshopTestUrl() {
    const gs = await this.groupshopSrv.findAll();
    return gs.map((g) => `https://appfront.groupshop.co${g.url} `);
  }
}
