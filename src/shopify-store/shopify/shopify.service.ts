import { HttpException, HttpStatus, Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Request, Response } from 'express';
import Shopify, {
  ApiVersion,
  AuthQuery,
  RegisterReturn,
} from '@shopify/shopify-api';
import { HttpService } from '@nestjs/axios';
import { EventEmitter2 } from '@nestjs/event-emitter';
import { TokenReceivedEvent } from '../events/token-received.event';

@Injectable()
export class ShopifyService {
  public shop: string;
  public accessToken: string;
  // private shopify;
  constructor(
    private configService: ConfigService,
    private httpService: HttpService,
    private eventEmitter: EventEmitter2,
  ) {
    Shopify.Context.initialize({
      API_KEY: configService.get('SHOPIFY_API_KEY'),
      API_SECRET_KEY: configService.get('SHOPIFY_API_SECRET'),
      SCOPES: configService.get('SCOPES').split(','),
      HOST_NAME: configService.get('HOST').replace(/https:\/\//, ''),
      API_VERSION: ApiVersion.October20,
      IS_EMBEDDED_APP: false,
      // This should be replaced with your preferred storage strategy
      SESSION_STORAGE: new Shopify.Session.MemorySessionStorage(),
    });
  }

  async currentSession(req: Request, res: Response) {
    return await Shopify.Utils.loadCurrentSession(req, res, false);
  }

  async client(shop: string, accessToken: string) {
    return new Shopify.Clients.Graphql(shop, accessToken);
  }

  async restClient(shop: string, accessToken: string) {
    return new Shopify.Clients.Rest(shop, accessToken);
  }

  async beginAuth(req: Request, res: Response, shop: string) {
    return await Shopify.Auth.beginAuth(req, res, shop, '/callback', false);
  }
  async validateAuth(req: Request, res: Response) {
    try {
      await Shopify.Auth.validateAuthCallback(
        req,
        res,
        req.query as unknown as AuthQuery,
      ); // req.query must be cast to unkown and then AuthQuery in order to be accepted
    } catch (error) {
      console.error(JSON.stringify(error)); // in practice these should be handled more gracefully
      Logger.error(error);
    }
  }

  async offlineSession(shop: string) {
    const session = await Shopify.Utils.loadOfflineSession(shop);
    const tokenReceivedEvent = new TokenReceivedEvent();
    tokenReceivedEvent.token = session.accessToken;
    tokenReceivedEvent.session = session;
    this.eventEmitter.emit('token.received', tokenReceivedEvent);
    return session;
  }

  offlineSessionID(shop: string) {
    return Shopify.Auth.getOfflineSessionId(shop);
  }

  async registerHook(shop, accessToken, path, topic) {
    try {
      // const host = this.configService.get('HOST') + path;

      const response = await Shopify.Webhooks.Registry.register({
        shop,
        accessToken,
        path: path + '?shop=' + shop,
        topic,
        webhookHandler: async (topic, shop, body) => {
          console.log('inside');
        },
      });
      console.log(JSON.stringify(response));
      return response;
    } catch (error) {
      console.log('error : ', error);
    }

    // if (!response.success) {
    //   console.log(
    //     `Failed to register APP_UNINSTALLED webhook: ${response.result}`,
    //   );
    // }
  }

  async setDiscountCode(
    shop: string,
    action: string,
    accessToken: string,
    title?: string,
    percentage?: number,
    products?: string[],
    starts?: Date,
    ends?: Date,
    id?: string,
  ) {
    // if (percentage) {
    const client = await this.client(shop, accessToken);
    let priceRule: any;

    if (action === 'Create')
      priceRule = await client.query({
        data: {
          query: `mutation priceRuleCreate($priceRule: PriceRuleInput!, $priceRuleDiscountCode : PriceRuleDiscountCodeInput) {
          priceRuleCreate(priceRule: $priceRule, priceRuleDiscountCode: $priceRuleDiscountCode) {
            priceRule {
              id
              title
              target
              startsAt
              endsAt
            }
            priceRuleDiscountCode {
              code
            }
            priceRuleUserErrors {
              message
            }
          }
        }`,
          variables: {
            id: id || null,
            priceRule: {
              title: title,
              target: 'LINE_ITEM',
              value: {
                percentageValue: -percentage,
              },
              itemEntitlements: {
                productIds: products,
              },
              customerSelection: {
                forAllCustomers: true,
              },
              allocationMethod: 'EACH',
              validityPeriod: {
                start: starts,
                end: ends,
              },
            },
            priceRuleDiscountCode: { code: title },
          },
        },
      });
    else {
      let variables: any = { id };
      if (percentage)
        variables = {
          id,
          priceRule: {
            value: {
              percentageValue: -percentage,
            },
          },
        };
      if (products)
        variables = {
          id,
          priceRule: {
            itemEntitlements: {
              productIds: products,
            },
          },
        };
      priceRule = await client.query({
        data: {
          query: `mutation priceRuleUpdate($id: ID!,$priceRule: PriceRuleInput!, $priceRuleDiscountCode : PriceRuleDiscountCodeInput) {
          priceRuleUpdate(id: $id, priceRule: $priceRule, priceRuleDiscountCode: $priceRuleDiscountCode) {
          priceRule {
            id
            title
            target
            startsAt
            endsAt
          }
          priceRuleDiscountCode {
            code
          }
          priceRuleUserErrors {
            message
          }
        }
      }`,
          variables,
        },
      });
    }
    console.log(
      '🚀 ~ file: shopify.service.ts ~ line 196 ~ ShopifyService ~ priceRule',
      JSON.stringify(priceRule),
    );
    const {
      [`priceRule${action}`]: {
        priceRule: { id: priceRuleId },
      },
    } = priceRule.body['data'];
    return {
      title,
      percentage: percentage?.toString(),
      priceRuleId: priceRuleId,
    };
  }

  // updateDiscountCode(shop: shop, accessToken: string, variables: any) {
  //   priceRule = await client.query({
  //     data: {
  //       query: `mutation priceRuleUpdate($id: ID!,$priceRule: PriceRuleInput!, $priceRuleDiscountCode : PriceRuleDiscountCodeInput) {
  //       priceRuleUpdate(id: $id, priceRule: $priceRule, priceRuleDiscountCode: $priceRuleDiscountCode) {
  //       priceRule {
  //         id
  //         title
  //         target
  //         startsAt
  //         endsAt
  //       }
  //       priceRuleDiscountCode {
  //         code
  //       }
  //       priceRuleUserErrors {
  //         message
  //       }
  //     }
  //   }`,
  //       variables: {
  //         id,
  //         priceRule: {
  //           value: {
  //             percentageValue: -percentage,
  //           },
  //         },
  //       },
  //     },
  //   });
  // }

  async scriptTagRegister(src: string, scope?: string) {
    try {
      const client = await this.client(this.shop, this.accessToken);
      const scriptTag = await client.query({
        data: {
          query: `mutation scriptTagCreate($input: ScriptTagInput!) {
              scriptTagCreate(input: $input) {
                scriptTag {
                  cache
                  createdAt
                  displayScope
                  id
                  src 
                }
                userErrors {
                  field
                  message
                }
              }
            }`,
          variables: {
            input: {
              cache:
                this.configService.get('SHOPIFYCACHE') === 'true'
                  ? true
                  : false,
              displayScope: scope ?? 'ONLINE_STORE',
              src: `${this.configService.get('HOST')}/public/${src}`,
            },
          },
        },
      });
      console.log('-------------Register scriptTag');
      console.log(JSON.stringify(scriptTag));
      if (scriptTag.body['data']['scriptTagCreate'])
        return scriptTag.body['data']['scriptTagCreate']['scriptTag'];
      else
        throw new HttpException(
          {
            status: HttpStatus.FORBIDDEN,
            error: JSON.stringify(scriptTag),
          },
          HttpStatus.FORBIDDEN,
        );
    } catch (err) {
      console.log(err.message);
      Logger.error(err);
    }
  }

  async scriptTagList() {
    try {
      const client = await this.client(this.shop, this.accessToken);
      const scriptTag = await client.query({
        data: {
          query: `{
            scriptTags(first: 15, reverse: true) {
              edges {
                node {
                  id
                  src
                  displayScope
                  createdAt
                }
              }
            }
          }`,
        },
      });
      console.log('-------------list scriptTag');
      console.log(JSON.stringify(scriptTag));
      return JSON.stringify(scriptTag);
    } catch (err) {
      console.log(err.message);
      Logger.error(err);
    }
  }

  async scriptTagDelete(sid: any) {
    try {
      console.log(sid);
      const client = await this.client(this.shop, this.accessToken);
      const scriptTagDel = await client.query({
        data: {
          query: `mutation scriptTagDelete($id: ID!) {
            scriptTagDelete(id: $id) {
              deletedScriptTagId
              userErrors {
                field
                message
              }
            }
          }`,
          variables: {
            // input: {
            id: sid,
            // },
          },
        },
      });
      console.log('🚀 ~  scriptTagDel', JSON.stringify(scriptTagDel));
      console.log('-------------list scriptTag');

      // if (scriptTag.body['data']['scriptTagCreate'])
      //   return scriptTag.body['data']['scriptTagCreate']['scriptTag'];
      // else
      //   throw new HttpException(
      //     {
      //       status: HttpStatus.FORBIDDEN,
      //       error: JSON.stringify(scriptTag),
      //     },
      //     HttpStatus.FORBIDDEN,
      //   );
    } catch (err) {
      console.log(err.message);
      Logger.error(err);
    }
  }

  async AppSubscriptionCreate() {
    try {
      const client = await this.client(this.shop, this.accessToken);
      const AppSubscriptionCreate = await client.query({
        data: {
          query: `mutation AppSubscriptionCreate($name: String!, $lineItems: [AppSubscriptionLineItemInput!]!, $returnUrl: URL!, $test: Boolean, $trialDays:Int){
            appSubscriptionCreate(name: $name, returnUrl: $returnUrl, lineItems: $lineItems, test:$test, trialDays:$trialDays) {
              userErrors {
                field
                message
              }
              appSubscription {
                id
                lineItems {
                  id
                  plan {
                    pricingDetails
                    __typename
                  }
                }
              }
              confirmationUrl
            }
          }`,
          variables: {
            name: 'Groupshop Super Duper Usage Plan',
            returnUrl: `${this.configService.get('FRONT')}/${
              this.shop.split('.')[0]
            }/overview`,
            test: !this.configService.get('BILLING_LIVE'),
            trialDays: 30,
            lineItems: [
              {
                plan: {
                  appUsagePricingDetails: {
                    terms: 'Groupshop Usage Charge Detail',
                    cappedAmount: {
                      amount: 2000.0,
                      currencyCode: 'USD',
                    },
                  },
                },
              },
            ],
          },
        },
      });
      Logger.debug(AppSubscriptionCreate, 'Response-AppSubscriptionCreate');
      if (AppSubscriptionCreate.body['data']['appSubscriptionCreate'])
        return AppSubscriptionCreate.body['data']['appSubscriptionCreate'];
    } catch (err) {
      // console.log(err.message);
      Logger.error(err, 'AppSubscriptionCreate');
    }
  }

  async appUsageRecordCreate(
    subscriptionLineItemId: string,
    amount: number,
    description: string,
  ) {
    try {
      const client = await this.client(this.shop, this.accessToken);
      const AppUsageRecordCreate = await client.query({
        data: {
          query: `mutation appUsageRecordCreate($description: String!, $price: MoneyInput!, $subscriptionLineItemId: ID!) {
            appUsageRecordCreate(description: $description, price: $price, subscriptionLineItemId: $subscriptionLineItemId) {
              userErrors {
                field
                message
              }
              appUsageRecord {
                id
              }
            }
          }`,
          variables: {
            subscriptionLineItemId,
            price: {
              amount,
              currencyCode: 'USD',
            },
            description,
          },
        },
      });
      Logger.debug(AppUsageRecordCreate, 'Response-AppUsageRecordCreate');
      if (AppUsageRecordCreate.body['data']['appUsageRecordCreate'])
        return AppUsageRecordCreate.body['data']['appUsageRecordCreate'];
    } catch (err) {
      // console.log(err.message);
      Logger.error(err, 'AppUsageRecordCreate');
    }
  }
}
