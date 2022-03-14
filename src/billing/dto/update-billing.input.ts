import { CreateBillingInput } from './create-billing.input';
import { InputType, Field, PartialType } from '@nestjs/graphql';

@InputType()
export class UpdateBillingInput extends PartialType(CreateBillingInput) {
  @Field()
  id: string;
}
