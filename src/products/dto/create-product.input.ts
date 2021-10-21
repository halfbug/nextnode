import { InputType, ID, Field } from '@nestjs/graphql';

@InputType()
export class CreateProductInput {
  @Field(() => ID)
  shopifyId: string;

  @Field()
  storeId: string;

  @Field()
  image: string;

  @Field()
  name: string;

  @Field()
  price: number;
}
