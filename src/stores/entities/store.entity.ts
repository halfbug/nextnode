import { ObjectType, Field, ID } from '@nestjs/graphql';

@ObjectType()
export class Store {
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
