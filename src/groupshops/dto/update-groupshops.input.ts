import { CreateGroupshopInput } from './create-groupshops.input';
import { InputType, Field, Int, PartialType } from '@nestjs/graphql';

@InputType()
export class UpdateGroupshopInput extends PartialType(CreateGroupshopInput) {
  @Field(() => String)
  id: string;
  @Field(() => String)
  _id: string;
}
