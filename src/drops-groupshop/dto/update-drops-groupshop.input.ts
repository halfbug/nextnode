import { CreateDropsGroupshopInput } from './create-drops-groupshop.input';
import { InputType, Field, Int, PartialType } from '@nestjs/graphql';

@InputType()
export class UpdateDropsGroupshopInput extends PartialType(
  CreateDropsGroupshopInput,
) {
  @Field(() => Int)
  id: number;

  @Field(() => Date)
  expiredAt: Date;
}
