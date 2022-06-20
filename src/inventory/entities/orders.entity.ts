import { ObjectType, Field, InputType } from '@nestjs/graphql';
import { CreateOrderInput } from '../dto/create-order.input';

// @ObjectType('Order')
// @InputType('OrderInput')
// export default class Orders extends CreateOrderInput {}

@ObjectType()
export class TotalOrders {
  @Field({ nullable: true })
  countTotalOrders?: string;
}
