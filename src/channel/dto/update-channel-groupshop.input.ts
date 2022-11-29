import { InputType, Field, PartialType } from '@nestjs/graphql';
import { CreateChannelGroupshopInput } from './create-channel-groupshop.input';

@InputType()
export class UpdateChannelGroupshopInput extends PartialType(
  CreateChannelGroupshopInput,
) {
  @Field(() => String)
  id: string;
}
