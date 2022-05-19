import { InputType, ID, Field } from '@nestjs/graphql';
import { AnyScalar } from 'src/utils/any.scalarType';
import {
  BannerDesignTypeEnum,
  BannerSummaryEnum,
} from '../entities/settings.entity';
import { BillingPlanEnum, Resource } from '../entities/store.entity';
// import { Settings } from '../entities/settings.entity';
@InputType()
export class SettingsInput {
  @Field({ nullable: true })
  brandColor?: string;

  @Field({ nullable: true })
  customColor?: string;

  @Field({ nullable: true })
  customBg?: string;

  @Field({ nullable: true })
  imageUrl?: string;

  @Field({ nullable: true })
  youtubeUrl?: string;

  @Field({ nullable: true })
  media?: string;

  @Field(() => BannerDesignTypeEnum, { nullable: true })
  bannerDesign: BannerDesignTypeEnum;

  @Field({ nullable: true })
  bannerProductPage?: boolean;

  @Field({ nullable: true })
  bannerCartPage?: boolean;

  @Field({ nullable: true })
  bannerLocation?: string;

  @Field({ nullable: true })
  callToActionText?: string;

  @Field(() => BannerSummaryEnum, { nullable: true })
  bannerSummaryPage?: BannerSummaryEnum;
}

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

  @Field({ nullable: true })
  installationStep?: number | null;

  @Field({ nullable: true })
  logoImage?: string;

  @Field({ nullable: true })
  industry?: string;

  @Field((type) => SettingsInput)
  settings: SettingsInput;

  @Field(() => BillingPlanEnum, { defaultValue: BillingPlanEnum.EXPLORE })
  plan?: BillingPlanEnum;

  @Field({ defaultValue: 0, nullable: true })
  totalGroupShop?: number;

  @Field(() => [Resource], { nullable: 'itemsAndList' })
  resources?: Resource[];

  @Field({ nullable: true })
  currencyCode: string;

  @Field(() => [String], { nullable: true })
  hideProducts?: string[];

  @Field({ nullable: true })
  timezone: string;
}
