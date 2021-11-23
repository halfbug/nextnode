import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { getMongoManager, Repository } from 'typeorm';
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
}
