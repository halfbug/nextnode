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
}
