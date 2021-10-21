import { InputType, ID, Field } from '@nestjs/graphql';

@InputType()
export class CreateStoreInput {
  @Field(() => ID)
  shopifySessionId: string;

  @Field()
  brandName: string;

  @Field()
  shop: string;

  @Field()
  accessToken: string;

  @Field()
  price: number;
}
