import { ObjectType, Field, ID } from '@nestjs/graphql';

@ObjectType('Store')
export class Store {
  // @Field({ description: 'mongo entity id' })
  // _id: string;

  @Field(() => ID)
  id: string;

  @Field({ nullable: true })
  shopifySessionId: string;

  @Field({ nullable: true })
  brandName?: string;

  @Field()
  shop: string;

  @Field()
  accessToken: string;

  @Field({ defaultValue: 0 })
  installationStep: number;

  @Field({ defaultValue: 0 })
  createdAt: string;
}
