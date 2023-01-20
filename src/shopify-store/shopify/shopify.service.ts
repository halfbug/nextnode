import { HttpException, HttpStatus, Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Request, Response } from 'express';
import Shopify, {
  ApiVersion,
  AuthQuery,
  RegisterReturn,
  SessionInterface,
} from '@shopify/shopify-api';
import { HttpService } from '@nestjs/axios';
import { EventEmitter2 } from '@nestjs/event-emitter';
import { TokenReceivedEvent } from '../events/token-received.event';
import { lastValueFrom, map } from 'rxjs';

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
      API_VERSION: ApiVersion.July22,
      IS_EMBEDDED_APP: false,
      // This should be replaced with your preferred storage strategy
      SESSION_STORAGE: new Shopify.Session.MemorySessionStorage(),
    });
  }

  async currentSession(req: Request, res: Response, isOnline: boolean) {
    return await Shopify.Utils.loadCurrentSession(req, res, isOnline);
  }

  async storeSession(session: SessionInterface) {
    return await Shopify.Session.MemorySessionStorage;
  }

  async client(shop: string, accessToken: string) {
    return new Shopify.Clients.Graphql(shop, accessToken);
  }

  async restClient(shop: string, accessToken: string) {
    return new Shopify.Clients.Rest(shop, accessToken);
  }

  async beginAuth(
    req: Request,
    res: Response,
    shop: string,
    redirectUrl = '/callback',
    isOnline = false,
  ) {
    return await Shopify.Auth.beginAuth(req, res, shop, redirectUrl, isOnline);
  }
  async validateAuth(req: Request, res: Response) {
    try {
      const sess = await Shopify.Auth.validateAuthCallback(
        req,
        res,
        req.query as unknown as AuthQuery,
      ); // req.query must be cast to unkown and then AuthQuery in order to be accepted
      console.log({ sess });
      return sess;
    } catch (error) {
      console.error(error); // in practice these should be handled more gracefully
      Logger.error(error, ShopifyService.name);
    }
  }

  async validateAuthOnline(req: Request, res: Response) {
    try {
      // const sess = await Shopify.Auth.validateAuthCallback(
      //   req,
      //   res,
      //   req.query as unknown as AuthQuery,
      // ); // req.query must be cast to unkown and then AuthQuery in order to be accepted
      // console.log({ sess });
      const shop = req.query.shop as string;
      // /* eslint-disable @typescript-eslint/naming-convention */
      const body = JSON.stringify({
        client_id: this.configService.get('SHOPIFY_API_KEY'),
        client_secret: this.configService.get('SHOPIFY_API_SECRET'),
        code: req.query.code,
      });
      /* eslint-enable @typescript-eslint/naming-convention */

      // const postParams = {
      //   path: '/admin/oauth/access_token',
      //   type: DataType.JSON,
      //   data: body,
      // };
      // const cleanShop = sanitizeShop(query.shop, true)!;

      // const client = new HttpClient(cleanShop);
      // const postResponse = await client.post(postParams);
      // Accept: 'application/json',
      const options = {
        headers: {
          'Content-Type': 'application/json',
        },
      };
      // this.httpService
      //   .post(`https://${shop}/admin/oauth/access_token`, body, options)
      //   .subscribe(
      //     (res) => {
      //       console.log(res.data);
      //       return res.data;
      //     },
      //     (error) => {
      //       //Error callback
      //       console.error('error caught in component');
      //       // console.log(error);

      //       //throw error;   //You can also throw the error to a global error handler
      //     },
      //   );
      const res = await lastValueFrom(
        this.httpService
          .post(`https://${shop}/admin/oauth/access_token`, body, options)
          .pipe(map((res) => res.data)),
      );
      console.log(
        '🚀 ~ file: shopify.service.ts ~ line 123 ~ ShopifyService ~ validateAuthOnline ~ res',
        res,
      );
      // const session: Session = createSession(
      //   postResponse,
      //   cleanShop,
      //   stateFromCookie,
      //   isOnline,
      // );
      return res;
    } catch (error) {
      console.error(error); // in practice these should be handled more gracefully
      Logger.error(error, ShopifyService.name);
    }
  }

  async offlineSession(shop: string) {
    // const session = await Shopify.Utils.loadOfflineSession(shop);
    const session = await Shopify.Utils.loadOfflineSession(shop);
    const tokenReceivedEvent = new TokenReceivedEvent();
    tokenReceivedEvent.token = session.accessToken;
    tokenReceivedEvent.session = session;
    this.eventEmitter.emit('token.received', tokenReceivedEvent);
    // await Shopify.Utils.deleteOfflineSession(shop);
    return session;
  }

  emitTokenReceivedEvent(session) {
    const tokenReceivedEvent = new TokenReceivedEvent();
    tokenReceivedEvent.token = session.accessToken;
    tokenReceivedEvent.session = session;
    this.eventEmitter.emit('token.received', tokenReceivedEvent);
  }

  offlineSessionID(shop: string) {
    return Shopify.Auth.getOfflineSessionId(shop);
  }

  async registerHook(shop, accessToken, path, topic) {
    try {
      const host = this.configService.get('HOST') + path;
      const response = await Shopify.Webhooks.Registry.register({
        shop,
        accessToken,
        path: path + '?shop=' + shop,
        topic,
      });
      // const response = await Shopify.Webhooks.Registry.register({
      //   shop,
      //   accessToken,
      //   path: path + '?shop=' + shop,
      //   topic,
      //   webhookHandler: function (topic: string, shop_domain: string, body: string): Promise<void> {
      //     throw new Error('Function not implemented.');
      //   }
      // });
      // console.log(JSON.stringify(response));
      Logger.log(
        `${topic}-webhook - registered for ${shop}`,
        'WEBHOOKS_REGISTERED',
        true,
      );
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
    console.log({ title });
    // console.log({ percentage });
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
              status
              valueV2 {
               ... on PricingPercentageValue{
              percentage
              }
             }
            }
            priceRuleDiscountCode {
              id 
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
              combinesWith: {
                productDiscounts: true,
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
      // console.log('inside update option');
      let variables: any = { id };
      if (percentage)
        variables = {
          id,
          priceRule: {
            value: {
              percentageValue: -percentage,
            },
            combinesWith: {
              productDiscounts: true,
            },
          },
        };
      else if (products)
        variables = {
          id,
          priceRule: {
            itemEntitlements: {
              productIds: products,
            },
            combinesWith: {
              productDiscounts: true,
            },
          },
        };
      else
        variables = {
          id,
          priceRule: {
            validityPeriod: {
              start: starts,
              end: ends,
            },
            combinesWith: {
              productDiscounts: true,
            },
          },
        };

      // console.log({ variables });
      console.log(JSON.stringify(variables));
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
            status
            valueV2 {
               ... on PricingPercentageValue{
              percentage
            }
          }
          }
          priceRuleDiscountCode {
            id
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
        priceRule: { id: priceRuleId, title: title1 },
      },
    } = priceRule.body['data'];
    return {
      title: title ?? title1,
      percentage: percentage?.toString(),
      priceRuleId: priceRuleId,
    };
  }

  async setAutomaticDiscountCode(
    shop: string,
    action: string,
    accessToken: string,
    title?: string,
    percentage?: number,
    collectionIds?: string[],
    oldcollectionIds?: string[],
    starts?: Date,
    ends?: Date,
    id?: string,
  ) {
    try {
      // if (percentage) {
      console.log({ title });
      // console.log({ percentage });
      const client = await this.client(shop, accessToken);
      let automaticDiscount: any;

      if (action === 'Create')
        automaticDiscount = await client.query({
          data: {
            query: `mutation discountAutomaticBasicCreate($automaticBasicDiscount: DiscountAutomaticBasicInput!) {
            discountAutomaticBasicCreate(automaticBasicDiscount: $automaticBasicDiscount) {
              automaticDiscountNode {
                id,
                automaticDiscount {
                  ... on DiscountAutomaticBasic {
                    title
                    customerGets {
                      value {
                        ... on DiscountPercentage {
                          percentage
                        }
                      }
                  }
                }
                
                }
              }
              userErrors {
                field
                message
              }
            }
          }`,
            variables: {
              automaticBasicDiscount: {
                combinesWith: {
                  productDiscounts: true,
                },
                customerGets: {
                  items: {
                    collections: {
                      add: collectionIds,
                    },
                  },
                  value: {
                    percentage: parseFloat((percentage / 100).toString()),
                  },
                },
                minimumRequirement: {
                  quantity: {
                    greaterThanOrEqualToQuantity: '1',
                  },
                },
                startsAt: starts,
                title: title,
              },
            },
          },
        });
      else {
        // console.log('inside update option');
        let variables: any = { id };
        if (percentage && collectionIds && oldcollectionIds) {
          variables = {
            id,
            automaticBasicDiscount: {
              customerGets: {
                value: {
                  percentage: parseFloat((percentage / 100).toString()),
                },
                items: {
                  collections: {
                    add: collectionIds,
                    remove: oldcollectionIds,
                  },
                },
              },
            },
          };
        } else if (percentage) {
          variables = {
            id,
            automaticBasicDiscount: {
              customerGets: {
                value: {
                  percentage: parseFloat((percentage / 100).toString()),
                },
              },
            },
          };
        } else if (collectionIds && oldcollectionIds) {
          variables = {
            id,
            automaticBasicDiscount: {
              customerGets: {
                items: {
                  collections: {
                    add: collectionIds,
                    remove: oldcollectionIds,
                  },
                },
              },
            },
          };
        } else {
          variables = {
            id,
            automaticBasicDiscount: {
              startsAt: starts,
              endsAt: ends,
            },
          };
        }

        automaticDiscount = await client.query({
          data: {
            query: `mutation discountAutomaticBasicUpdate($automaticBasicDiscount: DiscountAutomaticBasicInput!, $id: ID!) {
              discountAutomaticBasicUpdate(automaticBasicDiscount: $automaticBasicDiscount, id: $id) {
                automaticDiscountNode {
                  id,
                  automaticDiscount {
                    ... on DiscountAutomaticBasic {
                      title
                      customerGets {
                        value {
                          ... on DiscountPercentage {
                            percentage
                          }
                        }
                    }
                  }
                  
                  }
                }
                userErrors {
                  field
                  message
                }
              }
            }`,
            variables,
          },
        });
      }
      const {
        [`discountAutomaticBasic${action}`]: {
          automaticDiscountNode: {
            id: priceRuleId,
            automaticDiscount: {
              title: title1,
              customerGets: {
                value: { percentage: percentage1 },
              },
            },
          },
        },
      } = automaticDiscount.body['data'];
      return {
        title: title ?? title1,
        percentage: (percentage1 * 100).toFixed(0)?.toString(),
        priceRuleId: priceRuleId,
      };
    } catch (err) {
      console.log(err.message);
      Logger.error(err, ShopifyService.name);
    }
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
      Logger.error(err, ShopifyService.name);
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
      return scriptTag;
    } catch (err) {
      console.log(err.message);
      Logger.error(err, ShopifyService.name);
    }
  }

  async scriptTagDelete(sid: any) {
    try {
      console.log({ sid });
      console.log(this.shop);
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
      return scriptTagDel;
      // console.log('-------------list scriptTag');

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
      Logger.error(err, ShopifyService.name);
    }
  }

  async AppSubscriptionCreate(trialDays: number) {
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
            name: `Explore (free for ${trialDays} days) + Cashback charge`,
            returnUrl: `${this.configService.get('FRONT')}/${
              this.shop.split('.')[0]
            }/overview`,
            test:
              this.configService.get('BILLING_LIVE') === 'true' ? false : true,
            trialDays,
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
      // if (
      //   AppUsageRecordCreate.body['data']['appUsageRecordCreate'][
      //     'appUsageRecord'
      //   ]
      // ) {
      //   console.log('inside');
      return AppUsageRecordCreate.body['data']['appUsageRecordCreate'][
        'appUsageRecord'
      ];
      // } else
      //   return {
      //    appUsageRecordCreate: { appUsageRecord: false },
      //   };
    } catch (err) {
      // console.log(err.message);
      Logger.error(err, 'AppUsageRecordCreate');
    }
  }

  async storeDetail() {
    try {
      const client = await this.client(this.shop, this.accessToken);
      const sdetail = await client.query({
        data: {
          query: `{
            shop{
              name,
              ianaTimezone,
              currencyCode,
                  
            }
          }`,
        },
      });
      Logger.debug(sdetail, ShopifyService.name);
      return sdetail;
    } catch (err) {
      // console.log(err.message);
      Logger.error(err, ShopifyService.name);
      throw new HttpException(
        {
          status: HttpStatus.UNAUTHORIZED,
          error: JSON.stringify(err.message),
        },
        HttpStatus.UNAUTHORIZED,
      );
      // return err;
    }
  }

  async getCustomerByEmail(shop, accessToken, email: string) {
    try {
      const client = await this.client(shop, accessToken);
      const cdetail = await client.query({
        data: {
          query: `{
            customers(first: 1, query:"${email}") {
              edges {
                node {
                  id
                  lastName                 
                  firstName
                  email                     
                }
              }
            }
          }`,
        },
      });
      // console.log({ cdetail });
      Logger.debug(cdetail, ShopifyService.name);
      return cdetail;
    } catch (err) {
      console.log(err.message);
      Logger.error(err, ShopifyService.name);
    }
  }
}
