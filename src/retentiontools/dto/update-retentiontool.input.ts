import { CreateRetentiontoolInput } from './create-retentiontool.input';
import { InputType, Field, Int, PartialType } from '@nestjs/graphql';

@InputType()
export class UpdateRetentiontoolInput extends PartialType(
  CreateRetentiontoolInput,
) {
  @Field(() => Int)
  id: string;
}
