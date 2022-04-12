import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { getMongoManager, Repository } from 'typeorm';
import { CreateOrderInput, DiscountInfo } from './dto/create-order.input';
import Orders from './entities/orders.modal';

@Injectable()
export class OrdersService {
  constructor(
    @InjectRepository(Orders)
    private ordersRepository: Repository<Orders>,
  ) {}

  async insertMany(orders: []) {
    const manager = getMongoManager();

    return await manager.insertMany(Orders, orders);
  }

  async getPurchasedProducts(shop: string) {
    const agg = [
      {
        $match: {
          $and: [
            {
              id: {
                $regex: 'LineItem',
              },
            },
            {
              shop,
            },
          ],
        },
      },
      {
        $group: {
          _id: {
            id: '$product.id',
          },
          purchaseCount: {
            $sum: 1,
          },
          id: {
            $first: '$id',
          },
          __parentId: {
            $first: '$__parentId',
          },
          productId: {
            $first: '$product.id',
          },
        },
      },
    ];

    const manager = getMongoManager();

    return await manager.aggregate(Orders, agg).toArray();
  }

  async getDataByOrderId(orderId: string) {
    const agg = [
      {
        $match: {
          id: orderId,
        },
      },
      {
        $lookup: {
          from: 'orders',
          localField: 'id',
          foreignField: 'parentId',
          as: 'lineItems',
        },
      },
      {
        $lookup: {
          from: 'inventory',
          localField: 'lineItems.product.id',
          foreignField: 'id',
          as: 'products',
        },
      },
    ];

    const manager = getMongoManager();

    return await manager.aggregate(Orders, agg).toArray();
  }

  async getOrderDetailsByOrderId(orderId: string) {
    const agg = [
      {
        $match: {
          id: orderId,
        },
      },
      {
        $lookup: {
          from: 'orders',
          localField: 'id',
          foreignField: 'parentId',
          as: 'lineItems',
        },
      },
      {
        $lookup: {
          from: 'inventory',
          localField: 'lineItems.product.id',
          foreignField: 'id',
          as: 'products',
        },
      },
      {
        $lookup: {
          from: 'inventory',
          localField: 'products.id',
          foreignField: 'parentId',
          as: 'variants',
        },
      },
      {
        $addFields: {
          Products: {
            $map: {
              input: '$products',
              in: {
                $mergeObjects: [
                  '$$this',
                  {
                    variants: {
                      $filter: {
                        input: '$variants',
                        as: 'j',
                        cond: {
                          $and: [
                            {
                              $eq: ['$$this.id', '$$j.parentId'],
                            },
                            {
                              $eq: ['$$j.recordType', 'ProductVariant'],
                            },
                          ],
                        },
                      },
                    },
                  },
                  {
                    image: {
                      $filter: {
                        input: '$variants',
                        as: 'j',
                        cond: {
                          $and: [
                            {
                              $eq: ['$$this.id', '$$j.parentId'],
                            },
                            {
                              $eq: ['$$j.recordType', 'ProductImage'],
                            },
                          ],
                        },
                      },
                    },
                  },
                  {
                    collections: {
                      $filter: {
                        input: '$variants',
                        as: 'j',
                        cond: {
                          $and: [
                            {
                              $eq: ['$$this.id', '$$j.parentId'],
                            },
                            {
                              $eq: ['$$j.recordType', 'Collection'],
                            },
                          ],
                        },
                      },
                    },
                  },
                ],
              },
            },
          },
        },
      },
      {
        $project: {
          products: 0,
          variants: 0,
        },
      },
      {
        $addFields: {
          LineItems: {
            $map: {
              input: '$lineItems',
              in: {
                $mergeObjects: [
                  '$$this',
                  {
                    product: {
                      $filter: {
                        input: '$Products',
                        as: 'j',
                        cond: {
                          $eq: ['$$this.product.id', '$$j.id'],
                        },
                      },
                    },
                  },
                ],
              },
            },
          },
        },
      },
      {
        $project: {
          lineItems: 0,
          Products: 0,
        },
      },
    ];

    const manager = getMongoManager();

    return await manager.aggregate(Orders, agg).toArray();
  }

  async create(createOrderInput: CreateOrderInput) {
    try {
      const order = this.ordersRepository.create(createOrderInput);
      order.discountInfo = [new DiscountInfo()];
      order.discountInfo = createOrderInput.discountInfo;

      return await this.ordersRepository.save(order);
    } catch (err) {
      console.log(JSON.stringify(err));
    }
  }

  async removeShop(shop: string) {
    return await this.ordersRepository.delete({ shop });
  }

  async findfindQrDealLinkAll(email: string, ordernumber: string) {
    const agg = [
      {
        $match: {
          name: '#' + ordernumber,
          'customer.email': email,
        },
      },
      {
        $lookup: {
          from: 'groupshops',
          localField: 'id',
          foreignField: 'members.orderId',
          as: 'groupshops',
        },
      },
    ];
    console.log(agg);
    const manager = getMongoManager();
    const gs = await manager.aggregate(Orders, agg).toArray();
    console.log('🚀 ~ find qr deal link', gs);
    return gs[0].groupshops[0];
  }
}
