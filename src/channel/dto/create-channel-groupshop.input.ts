import { InputType, Field, Int } from '@nestjs/graphql';
import {
  DealProductsInput,
  DiscountCodeInput,
  MemberInput,
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

  @Field(() => [MemberInput])
  members?: MemberInput[];

  @Field(() => Int, { defaultValue: 0 })
  totalProducts?: number;

  @Field(() => [String], { nullable: 'itemsAndList' })
  allProducts?: string[]; // to update discount code

  // @Field({ nullable: true })
  // isActive: boolean;
}
