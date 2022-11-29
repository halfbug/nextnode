import { CreateChannelInput } from './create-channel.input';
import { InputType, Field, PartialType } from '@nestjs/graphql';

@InputType()
export class UpdateChannelInput extends PartialType(CreateChannelInput) {
  @Field(() => String)
  id: string;
}
