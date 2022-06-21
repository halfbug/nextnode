import { CreatePartnersInput } from './create-partners.input';
import { InputType, Field, Int, PartialType } from '@nestjs/graphql';

@InputType()
export class UpdatePartnersInput extends PartialType(CreatePartnersInput) {
  @Field()
  id: string;
}
