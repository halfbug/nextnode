import { ObjectType, Field, ID } from '@nestjs/graphql';
import { Campaign } from 'src/campaigns/entities/campaign.entity';
import { Settings } from './settings.entity';

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

  @Field({ defaultValue: 0, nullable: true })
  installationStep: number | null;

  @Field({ defaultValue: 0 })
  createdAt: string;

  @Field({ nullable: true })
  logoImage: string;

  @Field({ nullable: true })
  industry: string;

  @Field((type) => Settings, { nullable: true })
  settings: Settings;

  @Field(() => [Campaign], { nullable: 'itemsAndList' })
  campaigns?: Campaign[];
}
