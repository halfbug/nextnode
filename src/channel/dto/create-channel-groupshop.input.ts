import { InputType, Field } from '@nestjs/graphql';
import {
  DealProductsInput,
  DiscountCodeInput,
} from 'src/groupshops/dto/create-groupshops.input';
import { Customer } from 'src/inventory/dto/create-order.input';

@InputType()
export class CreateChannelGroupshopInput {
  @Field()
  customerDetail: Customer;

  @Field({ nullable: true })
  channelId?: string;

  @Field()
  storeId: string;

  @Field({ nullable: true })
  url?: string;

  @Field({ nullable: true })
  shortUrl?: string;

  @Field(() => DiscountCodeInput)
  discountCode?: DiscountCodeInput;

  @Field(() => [DealProductsInput], { nullable: 'itemsAndList' })
  dealProducts?: DealProductsInput[];

  @Field({ nullable: true })
  isActive: boolean;
}
