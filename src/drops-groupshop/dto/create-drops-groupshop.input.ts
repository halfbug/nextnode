import { InputType, Field } from '@nestjs/graphql';
import { Customer } from 'src/inventory/dto/create-order.input';

@InputType()
export class CreateDropsGroupshopInput {
  @Field()
  customerDetail: Customer;

  @Field()
  storeId: string;
}
