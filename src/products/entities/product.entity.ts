import { ObjectType, Field, ID } from '@nestjs/graphql';

@ObjectType()
export class Product {
  @Field((type) => ID)
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
