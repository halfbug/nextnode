import { Controller, Get, Req, Res } from '@nestjs/common';
import { Request, response, Response } from 'express';
import { StoreService } from './store/store.service';

@Controller('shopify-store')
export class ShopifyStoreController {
  constructor(private storeService: StoreService) {}

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
  async getStoreProducts(@Req() req: Request, @Res() res: Response) {
    const result = await this.storeService.loadProducts(req, res);
    // console.log(products);

    // .then((res) => {
    //   console.log(res);
    //   return res;
    // });
    if (result) {
      console.log(result);
      return res.redirect(result.frontend);
    }
    // return products;
    return console.log('not done yet');
  }

  @Get('appfront')
  productList(@Req() req: Request, @Res() res: Response) {
    return 'Frontend';
  }
}
