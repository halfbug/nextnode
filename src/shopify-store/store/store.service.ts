import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import Shopify, { ApiVersion, AuthQuery } from '@shopify/shopify-api';
import { ShopifyService } from '../shopify/shopify.service';

@Injectable()
export class StoreService {
  // private shopify;
  constructor(
    private configService: ConfigService,
    private shopifyapi: ShopifyService,
  ) {}

  async loadProducts() {
    // GraphQLClient takes in the shop url and the accessToken for that shop.
    // const client = new Shopify.Clients.Graphql(
    //   session.shop,
    //   session.accessToken,
    // );
    // const client = await this.shopifyapi.client(this.configService.get('SHOP'));
    // // Use client.query and pass your query as `data`
    // const products = await client.query({
    //   data: `{
    //   products (first: 20) {
    //     edges {
    //       node {
    //         id
    //         title

    //       }
    //     }
    //   }
    // }`,
    // });
    return {
      frontend: `${this.configService.get(
        'FRONT',
      )}?shop=${this.configService.get('SHOP')}`,
      // products: products.body['data']['products']['edges'],
    };
  }

  async login(req, res, shop) {
    const authRoute = await this.shopifyapi.beginAuth(req, res, shop);
    return res.redirect(authRoute);
  }

  async callback(req, res, shop) {
    console.log('inside store servide call back');
    const validateRes = await this.shopifyapi.validateAuth(req, res);
    console.log(
      ' file: store.service.ts ~ line 51 ~ StoreService ~ callback ~ validateRes',
      JSON.stringify(validateRes),
    );
    const offlineSessRes = await this.shopifyapi.offlineSession(shop);
    console.log(
      '🚀 ~ file: store.service.ts ~ line 56 ~ StoreService ~ callback ~ offlineSessRes',
      JSON.stringify(offlineSessRes),
    );

    res.header('shop', shop);
    const shopName = shop.split('.')[0];
    return res.redirect(`${this.configService.get('FRONT')}/${shopName}/0`); // wherever you want your user to end up after OAuth completes
  }

  async loadSession() {
    await this.shopifyapi.offlineSession(this.configService.get('SHOP'));
  }

  goToAppfront(store) {
    const { shop, installationStep } = store;
    const shopName = shop.split('.')[0];
    if (installationStep === null)
      return `${this.configService.get('FRONT')}/${shopName}/overview`;
    else
      return `${this.configService.get(
        'FRONT',
      )}/${shopName}/${installationStep}`;
  }
}
