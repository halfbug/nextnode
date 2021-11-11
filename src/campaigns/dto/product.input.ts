import { InputType, ID, Field } from '@nestjs/graphql';

@InputType()
export class ProductInputType {
  @Field()
  id: string;
}
