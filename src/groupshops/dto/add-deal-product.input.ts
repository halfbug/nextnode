import { DealProductsInput } from './create-groupshops.input';
import { InputType, Field, Int, PartialType } from '@nestjs/graphql';

@InputType()
export class AddDealProductInput {
  @Field(() => String)
  id: string;
  @Field(() => [DealProductsInput], { nullable: 'itemsAndList' })
  dealProducts?: DealProductsInput[];
}
