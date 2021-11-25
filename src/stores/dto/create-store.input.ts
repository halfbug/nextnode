import { InputType, ID, Field } from '@nestjs/graphql';

@InputType()
export class CreateStoreInput {
  @Field()
  id: string;

  @Field({ defaultValue: 'Active' })
  status?: string;

  @Field()
  shopifySessionId?: string;

  @Field({ nullable: true })
  brandName?: string;

  @Field()
  shop: string;

  @Field()
  accessToken?: string;

  @Field({ defaultValue: 0 })
  installationStep?: number;

  @Field({ nullable: true })
  logoImage?: string;

  @Field({ nullable: true })
  industry?: string;
}
