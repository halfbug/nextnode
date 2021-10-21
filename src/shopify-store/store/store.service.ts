import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import Shopify, { ApiVersion, AuthQuery } from '@shopify/shopify-api';

@Injectable()
export class StoreService {
  private shopify;
  constructor(private configService: ConfigService) {
    this.shopify = Shopify.Context.initialize({
      API_KEY: configService.get('SHOPIFY_API_KEY'),
      API_SECRET_KEY: configService.get('SHOPIFY_API_SECRET'),
      SCOPES: configService.get('SCOPES').split(','),
      HOST_NAME: configService.get('HOST').replace(/https:\/\//, ''),
      API_VERSION: ApiVersion.October20,
      IS_EMBEDDED_APP: false,
      // This should be replaced with your preferred storage strategy
      SESSION_STORAGE: new Shopify.Session.MemorySessionStorage(),
    });
    // console.log(this.shopify);
    console.log(
      '🚀 ~ file: store.service.ts ~ line 20 ~ StoreService ~ constructor ~ this.shopify',
      this.shopify,
    );
    console.log(
      "🚀 ~ file: store.service.ts ~ line 14 ~ StoreService ~ constructor ~ configService.get('HOST')",
      configService.get('HOST'),
    );
  }

  async loadProducts(req, res) {
    // Load the current session to get the `accessToken`
    const session = await Shopify.Utils.loadCurrentSession(req, res, false);
    console.log(
      '🚀 ~ file: store.service.ts ~ line 33 ~ StoreService ~ loadProducts ~ session',
      session,
    );
    // GraphQLClient takes in the shop url and the accessToken for that shop.
    const client = new Shopify.Clients.Graphql(
      session.shop,
      session.accessToken,
    );
    // Use client.query and pass your query as `data`
    const products = await client.query({
      data: `{
      products (first: 20) {
        edges {
          node {
            id
            title
            
          }
        }
      }
    }`,
    });
    console.log(
      '🚀 ~ file: store.service.ts ~ line 56 ~ StoreService ~ loadProducts ~ products',
      JSON.stringify(products),
    );

    return {
      frontend: `https://brave-cobra-51.loca.lt/?shop=${session.shop}`,
      products: products.body['data']['products']['edges'],
    };
  }

  async login(req, res) {
    console.log(
      '🚀 ~ file: store.service.ts ~ line 61 ~ StoreService ~ login ~ res',
    );
    console.log(
      '🚀 ~ file: store.service.ts ~ line 61 ~ StoreService ~ login ~ req',
    );
    const authRoute = await Shopify.Auth.beginAuth(
      req,
      res,
      this.configService.get('SHOP'),
      '/callback',
      true,
    );
    return res.redirect(authRoute);
  }

  async callback(req, res) {
    try {
      await Shopify.Auth.validateAuthCallback(
        req,
        res,
        req.query as unknown as AuthQuery,
      ); // req.query must be cast to unkown and then AuthQuery in order to be accepted
      const session = await Shopify.Utils.loadOfflineSession(
        this.configService.get('SHOP'),
      );
      console.log(session);
    } catch (error) {
      console.error(error); // in practice these should be handled more gracefully
    }
    return res.redirect('/shopify-store/load-products'); // wherever you want your user to end up after OAuth completes
  }
}
