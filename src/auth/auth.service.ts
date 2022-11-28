import { HttpException, HttpStatus, Injectable } from '@nestjs/common';
import { ShopifyService } from 'src/shopify-store/shopify/shopify.service';
import { StoresService } from 'src/stores/stores.service';
import { LoginAuthDto } from './dto/login-auth.dto';
import { Request, Response } from 'express';
import { ConfigService } from '@nestjs/config';
import Store from 'src/stores/entities/store.model';
import { JwtService } from '@nestjs/jwt';
import { AuthEntity } from './entities/auth.entity';
// import { UpdateAuthDto } from './dto/update-auth.dto';

@Injectable()
export class AuthService {
  constructor(
    private storesService: StoresService,
    private shopifyService: ShopifyService,
    private configService: ConfigService,
    private jwtService: JwtService,
  ) {}
  async loginOnline(req: Request, res: Response, store: string) {
    const authRoute = await this.shopifyService.beginAuth(
      req,
      res,
      store,
      '/auth/callback',
      true,
    );
    console.log(
      '🚀 ~ file: auth.service.ts ~ line 22 ~ AuthService ~ loginOnline ~ authRoute',
      authRoute,
    );
    return authRoute;
  }

  async validate(req: Request, res: Response) {
    return await this.shopifyService.validateAuth(req, res);
  }

  goToAppfront(store: Store) {
    const { shop, installationStep, subscription } = store;
    const shopName = shop.split('.')[0];
    // if (installationStep === null && subscription.status === 'Active')
    //   return `${this.configService.get('FRONT')}/${shopName}/overview`;
    // else if (subscription.status === 'Pending')
    //   return subscription.confirmationUrl;
    // else
    //   return `${this.configService.get(
    //     'FRONT',
    //   )}/${shopName}/${installationStep}`;
    if (subscription?.status === 'Pending') return subscription.confirmationUrl;
    else {
      return installationStep === null &&
        ['Active', 'ACTIVE', 'actve'].includes(subscription.status)
        ? `${this.configService.get('FRONT')}/${shopName}/overview`
        : `${this.configService.get('FRONT')}/${shopName}/${installationStep}`;
      // return;
    }
  }

  signJwt(payload: AuthEntity): string {
    return this.jwtService.sign(payload);
  }

  decodeJwt(token: string) {
    if (!!token)
      return this.jwtService.verify(token, {
        secret: this.configService.get('JWTSECRET'),
      });
    else
      throw new HttpException(
        {
          status: HttpStatus.FORBIDDEN,
          error: JSON.stringify('Token not found'),
        },
        HttpStatus.FORBIDDEN,
      );
    // console.log("🚀 ~ file: auth.service.ts ~ line 72 ~ AuthService ~ verfiyJwt ~ decoded", decoded)
  }

  async verifyToken(tokenData: any) {
    this.shopifyService.accessToken = tokenData.accessToken;
    this.shopifyService.shop = tokenData.shop;
    try {
      const shopRec = await this.shopifyService.storeDetail();
      // console.log(
      //   '🚀 ~ file: auth.controller.ts ~ line 118 ~ AuthController ~ verify ~ shopRec',
      //   shopRec,
      // );
      // res.send({ ...tokenData.user });
      return { status: true, ...tokenData.user };
    } catch (err) {
      // console.log(
      //   '🚀 ~ file: auth.service.ts ~ line 89 ~ AuthService ~ verifyToken ~ err',
      //   err,
      // );
      // console.log('-----------------');
      throw new HttpException(
        {
          status: HttpStatus.UNAUTHORIZED,
          error: JSON.stringify(err.message),
        },
        HttpStatus.UNAUTHORIZED,
      );
      return err;
    }
  }

  // remove(id: number) {
  //   return `This action removes a #${id} auth`;
  // }
}
