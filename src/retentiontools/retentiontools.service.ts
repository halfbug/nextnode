import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { CreateRetentiontoolInput } from './dto/create-retentiontool.input';
import { StoresService } from 'src/stores/stores.service';
import { ShopifyService } from 'src/shopify-store/shopify/shopify.service';
import { OrdersReceivedEvent } from 'src/shopify-store/events/orders-received.event';
import { EventEmitter2 } from '@nestjs/event-emitter';
import { Retentiontool } from './entities/retention.modal';
import { UpdateStoreInput } from 'src/stores/dto/update-store.input';
import { getMongoManager, Like, Repository } from 'typeorm';
import { RTPCreatedEvent } from './events/create-retention-tools.event';
import { v4 as uuid } from 'uuid';
import { OrdersService } from 'src/inventory/orders.service';
@Injectable()
export class RetentiontoolsService {
  constructor(
    @InjectRepository(Retentiontool)
    private retentionRepository: Repository<Retentiontool>,
    private readonly storesService: StoresService,
    private shopifyService: ShopifyService,
    private eventEmitter: EventEmitter2,
    private storeService: StoresService,
    private rtcEvent: RTPCreatedEvent,
    private ordersService: OrdersService,
  ) {}

  async create(createRetentiontoolInput: CreateRetentiontoolInput) {
    const retention = this.retentionRepository.create(createRetentiontoolInput);
    retention.id = uuid();
    const d = new Date(retention.startDate);
    const year = d.getFullYear();
    const month = ('0' + (d.getMonth() + 1)).slice(-2);
    const day = ('0' + d.getDate()).slice(-2);
    retention.startDate = `${year}${'-'}${month}${'-'}${day}`;

    const endd = new Date(retention.endDate);
    const endyear = endd.getFullYear();
    const endmonth = ('0' + (endd.getMonth() + 1)).slice(-2);
    const endday = ('0' + endd.getDate()).slice(-2);
    retention.endDate = `${endyear}${'-'}${endmonth}${'-'}${endday}`;

    const pendingGroupshop = await this.ordersService.findpendinggroupshop(
      createRetentiontoolInput.shop,
      retention.startDate,
      retention.endDate,
      createRetentiontoolInput.minOrderValue,
    );
    const orderIds = [];
    pendingGroupshop.map((items) => {
      orderIds.push(items.id);
    });
    retention.orderIds = orderIds;
    retention.progress = true;
    const savedRetention = await this.retentionRepository.save(retention);

    this.rtcEvent.storeId = createRetentiontoolInput.storeId;
    this.rtcEvent.shop = createRetentiontoolInput.shop;
    this.rtcEvent.startDate = retention.startDate;
    this.rtcEvent.endDate = retention.endDate;
    this.rtcEvent.minOrderValue = createRetentiontoolInput.minOrderValue;
    this.rtcEvent.emit();

    const res = {
      status: true,
    };
    return res;
  }

  async findAll(storeId: string) {
    const agg = [
      {
        $match: {
          storeId: storeId,
        },
      },
      {
        $sort: {
          _id: -1,
        },
      },
    ];
    const manager = getMongoManager();
    const gs = await manager.aggregate(Retentiontool, agg).toArray();
    return gs;
  }

  findOne(id: string) {
    return this.retentionRepository.findOne({ id });
  }

  async update(id: string, updateStoreInput: UpdateStoreInput) {
    await this.retentionRepository.update({ id }, updateStoreInput);
    return await this.findOne(id);
  }

  async removeShop(storeId: string) {
    return await this.retentionRepository.delete({ storeId });
  }

  async retentionGroupshopPrgress(storeId: string) {
    const agg = [
      {
        $match: {
          storeId: storeId,
        },
      },
      {
        $sort: {
          _id: -1,
        },
      },
      {
        $limit: 1,
      },
    ];
    const manager = getMongoManager();
    const gs = await manager.aggregate(Retentiontool, agg).toArray();
    return gs[0];
  }

  async syncStoreCustomers(storeId: string) {
    try {
      const { shop, accessToken, appTrialEnd } =
        await this.storesService.findOneById(storeId);
      console.log(appTrialEnd);
      const today = new Date(appTrialEnd);
      today.setDate(today.getDate() - 395);
      const dd = String(today.getDate()).padStart(2, '0');
      const mm = String(today.getMonth() + 1).padStart(2, '0'); //January is 0!
      const yyyy = today.getFullYear();
      const lastYear = yyyy + '-' + mm + '-' + dd;
      const client = await this.shopifyService.client(shop, accessToken);
      // console.log({ lastYear });
      const qres = await client.query({
        data: {
          query: `mutation {
              bulkOperationRunQuery(
               query:"""
                {
                  orders(first:30000,  query: "created_at:>=${
                    yyyy + '-' + mm + '-' + dd
                  }"){          
                            edges{
                              node{
                                name
                                id
                                shopifyCreateAt:createdAt
                                confirmed
                                cancelledAt
                                currencyCode

                                customer{

                                  firstName
                                  lastName
                                  email

                                }
                                discountCode
                                totalPriceSet{
                                  shopMoney{
                                    amount
                                    currencyCode
                                  }
                                }
                                lineItems(first:100){
                                  edges{
                                    node{
                                      id
                                      originalUnitPriceSet{
                                        shopMoney{
                                          amount
                                          currencyCode
                                        }
                                      }
                                      totalDiscountSet{
                                        shopMoney{
                                          amount
                                          currencyCode
                                        }}
                                      quantity
                                      product{
                                        id
                                        priceRangeV2{
                                          maxVariantPrice{
                                            amount
                                            currencyCode
                                          }
                                        }
                                      }
                                      variant{
                                        id,
                                        price
                                        }
                                    }
                                  }
                                }

                              }
                            }
                          }
                }
                """
              ) {
                bulkOperation {
                  id
                  status
                }
                userErrors {
                  field
                  message
                }
              }
            }`,
        },
      });

      // console.log(event);
      console.log(JSON.stringify(qres));
      // console.log(qres.body['data']['bulkOperationRunQuery']['bulkOperation']);
      if (
        qres.body['data']['bulkOperationRunQuery']['bulkOperation'][
          'status'
        ] === 'CREATED'
      ) {
        const pollit = setInterval(async () => {
          const poll = await client.query({
            data: {
              query: `query {
              currentBulkOperation {
                id
                status
                errorCode
                createdAt
                completedAt
                objectCount
                fileSize
                url
                partialDataUrl
              }
            }`,
            },
          });
          console.log(poll.body['data']['currentBulkOperation']);
          if (
            poll.body['data']['currentBulkOperation']['status'] === 'COMPLETED'
          ) {
            clearInterval(pollit);
            // fire inventory received event
            const ordersReceivedEvent = new OrdersReceivedEvent();
            ordersReceivedEvent.bulkOperationResponse =
              poll.body['data']['currentBulkOperation'];
            ordersReceivedEvent.shop = shop;
            ordersReceivedEvent.accessToken = accessToken;
            this.eventEmitter.emit('orders.received', ordersReceivedEvent);
          }
        }, 3000);
        const store = new UpdateStoreInput();
        store.retentiontool = { status: 'Active', updatedAt: new Date() };
        this.storeService.update(storeId, store);
        const res = {
          status: true,
        };
        return res;
      } else console.log(JSON.stringify(qres.body['data']));
      const res = {
        status: false,
      };
      return res;
    } catch (err) {
      const res = {
        status: false,
      };
      return res;
      console.log(JSON.stringify(err));
    }
  }

  async retentionanalytics(id: string) {
    const manager = getMongoManager();
    const agg = [
      {
        $match: {
          id: id,
        },
      },
      {
        $lookup: {
          from: 'orders',
          localField: 'orderIds',
          foreignField: 'id',
          as: 'orders',
        },
      },
      {
        $project: {
          orders: -1,
        },
      },
    ];
    const result = await manager.aggregate(Retentiontool, agg).toArray();
    return result[0]?.orders;
  }
}
