import {
  Controller,
  Get,
  Req,
  Res,
  // Post,
  // UseInterceptors,
  // UploadedFile,
} from '@nestjs/common';
// import { FileInterceptor } from '@nestjs/platform-express';
import { Request, Response } from 'express';
import { StoresService } from 'src/stores/stores.service';
import { StoreService } from './store/store.service';
// import { AwsService } from './aws.service';

@Controller()
export class ShopifyStoreController {
  constructor(
    private storeService: StoreService,
    // private awsService: AwsService,

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
}
