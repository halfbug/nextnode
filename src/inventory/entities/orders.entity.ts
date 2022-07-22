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
@InputType('CustomerTypeInput')
@ObjectType('CustomerType')
export class CustomerType {
  @Field({ nullable: true })
  customer_id: string;
  @Field({ nullable: true })
  firstName: string;
  @Field({ nullable: true })
  lastName: string;
  @Field({ nullable: true })
  email: string;
  @Field({ nullable: true })
  ip?: string;
  @Field({ nullable: true })
  phone?: string;
  @Field({ nullable: true })
  sms_marketing?: string;
}
