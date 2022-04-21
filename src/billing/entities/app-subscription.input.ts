import { ObjectType, Field } from '@nestjs/graphql';

@ObjectType()
export class AppSubscription {
  @Field({ description: 'confirmation url for shopify billing subscription' })
  redirectUrl: string;
}
