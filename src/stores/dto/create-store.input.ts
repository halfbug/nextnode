import { InputType, ID, Field } from '@nestjs/graphql';

@InputType()
export class CreateStoreInput {
  @Field(() => ID)
  shopifySessionId: string;

  @Field({ nullable: true })
  brandName?: string;

  @Field()
  shop: string;

  @Field()
  accessToken: string;

  @Field({ defaultValue: 0 })
  installationStep: number;
}
