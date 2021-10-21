import { Controller, Get, Req, Res } from '@nestjs/common';
import { Request, Response } from 'express';
import { ShopifyService } from './shopify/shopify.service';
import { StoreService } from './store/store.service';

@Controller('shopify-store')
export class ShopifyStoreController {
  constructor(
    private storeService: StoreService,
    private shopifyapi: ShopifyService,
  ) {}

  // @Get()
  // async refreshSession(@Req() req: Request, @Res() res: Response) {
  //   // const session = await this.shopifyapi.session(req, res);
  //   const session = await this.shopifyapi.oflineSession(
  //     'native-roots-dev.myshopify.com',
  //   );
  //   // return session;
  //   // return await this.shopifyapi.session(req, res);
  //   console.log('inside');
  //   res.send({ session });
  // }
  // @Get('login')
  @Get()
  login(@Req() req: Request, @Res() res: Response) {
    console.log('inside login get request');
    return this.storeService.login(req, res);
  }

  @Get('callback')
  callback(@Req() req: Request, @Res() res: Response) {
    console.log('inside call back auth end');
    return this.storeService.callback(req, res);
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
}
