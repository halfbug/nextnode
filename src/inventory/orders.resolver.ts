import {
  Resolver,
  Query,
  Mutation,
  Args,
  Int,
  GqlExecutionContext,
} from '@nestjs/graphql';
import { TotalOrders } from 'src/inventory/entities/orders.entity';
import { OrdersService } from './orders.service';

@Resolver()
export class OrdersResolver {
  constructor(private readonly OrderService: OrdersService) {}

  @Query(() => TotalOrders, { name: 'getOrderCount' })
  getOrderCount(@Args('shop') shop: string) {
    const data = this.OrderService.getOrderCount(shop);
    return data;
  }
}
