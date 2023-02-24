import {
  ObjectType,
  Field,
  ID,
  registerEnumType,
  InputType,
} from '@nestjs/graphql';
import { Campaign } from 'src/campaigns/entities/campaign.entity';
import { AnyScalar } from 'src/utils/any.scalarType';
import { Settings } from './settings.entity';
import { SocialLinks } from 'src/campaigns/entities/social-links.entity';
import { PartnerRewards } from 'src/partners/entities/partner.entity';
import { Product } from 'src/inventory/entities/product.entity';
import {
  DealProducts,
  DiscountCode,
  GroupShop,
  Member,
} from 'src/groupshops/entities/groupshop.entity';

export enum BillingPlanEnum {
  EXPLORE, // 30days
  LAUNCH, //1 - 1000
  GROWTH, // 10001 -2500
  ENTERPRISE, //2500 - .....
}
export enum BillingTierEnum {
  FREE,
  TIER1,
  TIER2,
  TIER3,
  TIER4,
  TIER5,
  TIER6,
  TIER7,
}
registerEnumType(BillingPlanEnum, {
  name: 'BillingPlanEnum',
});
registerEnumType(BillingTierEnum, {
  name: 'BillingTierEnum',
});

@InputType('ResourceInput')
@ObjectType('Resource')
export class Resource {
  @Field()
  id: string;
  @Field({ nullable: true })
  type?: string;
  @Field({ nullable: true })
  detail?: string;
}

@ObjectType('Subscription')
export class Subscription {
  @Field({ nullable: true })
  status?: string;
}

@ObjectType('Retentiontools')
export class Retentiontools {
  @Field({ nullable: true })
  status?: string;

  @Field({ nullable: true })
  updatedAt?: Date;
}
@ObjectType('MatchingBrandName')
export class MatchingBrandName {
  @Field({ nullable: true })
  id: string;

  @Field({ nullable: true })
  brandName: string;
}
@ObjectType('DiscoveryTools')
export class DiscoveryTools {
  @Field({ nullable: true })
  status?: string;

  @Field(() => [MatchingBrandName], { nullable: 'itemsAndList' })
  matchingBrandName?: MatchingBrandName[];
}
@ObjectType('Collections')
export class Collections {
  @Field({ nullable: true })
  shopifyId?: string;

  @Field({ nullable: true })
  name?: string;
}
@ObjectType('Drops')
export class Drops {
  @Field({ nullable: true })
  status?: string;

  @Field({ nullable: true, defaultValue: false })
  isVideoEnabled?: boolean;

  @Field({ nullable: true })
  spotlightColletionId?: string;

  @Field({ nullable: true })
  spotlightDiscount?: DiscountCode;

  @Field(() => [Collections], { nullable: 'itemsAndList' })
  collections?: Collections[];

  @Field({ nullable: true })
  latestCollectionId?: string;

  @Field({ nullable: true })
  bestSellerCollectionId?: string;

  @Field({ nullable: true })
  runningOutCollectionId?: string;

  @Field({ nullable: true })
  skincareCollectionId?: string;

  @Field({ nullable: true })
  hairCollectionId?: string;

  @Field({ nullable: true })
  allProductsCollectionId?: string;

  @Field({ nullable: true })
  rewards?: PartnerRewards;

  @Field({ nullable: true })
  lastSync?: Date;
}

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

  @Field({ nullable: true })
  installationStep: number | null;

  @Field({ defaultValue: 0 })
  createdAt: string;

  @Field({ nullable: true })
  logoImage: string;

  @Field({ nullable: true })
  status: string;

  @Field(() => [String], { nullable: 'itemsAndList' })
  industry: string[];

  @Field((type) => Settings, { nullable: true })
  settings: Settings;

  @Field(() => [Campaign], { nullable: 'itemsAndList' })
  campaigns?: Campaign[];

  @Field(() => [String], { nullable: 'itemsAndList' })
  hideProducts?: string[];

  @Field(() => Campaign, { nullable: true })
  activeCampaign?: Campaign;

  @Field(() => [Product], { nullable: 'itemsAndList' })
  allProducts?: Product[];

  @Field(() => BillingPlanEnum, {
    defaultValue: BillingPlanEnum.EXPLORE,
  })
  plan?: BillingPlanEnum;

  @Field(() => BillingTierEnum, { defaultValue: BillingTierEnum.FREE })
  tier?: BillingTierEnum;

  @Field({ defaultValue: 0, nullable: true })
  totalGroupShop?: number;

  @Field(() => [Resource], { nullable: 'itemsAndList' })
  resources?: Resource[];

  @Field(() => String, { nullable: true })
  shopifySubscription?: Resource[];

  @Field({ nullable: true })
  appTrialEnd: Date;

  @Field({ nullable: true })
  planResetDate: Date;

  @Field({ nullable: true })
  tierRecurringDate: Date;

  @Field({ nullable: true })
  currencyCode: string;

  @Field({ nullable: true })
  timezone: string;

  @Field({ nullable: true })
  subscription?: Subscription;

  @Field({ nullable: true })
  social?: SocialLinks;

  @Field({ nullable: true })
  retentiontool?: Retentiontools;

  @Field(() => DiscoveryTools, { nullable: true })
  discoveryTool?: DiscoveryTools;

  @Field({ nullable: true })
  recentgs?: string;

  @Field(() => Drops, { nullable: true })
  drops?: Drops;
}
