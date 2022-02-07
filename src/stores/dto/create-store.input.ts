import { InputType, ID, Field } from '@nestjs/graphql';
import {
  BannerDesignTypeEnum,
  BannerSummaryEnum,
} from '../entities/settings.entity';
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

  @Field({ defaultValue: 0, nullable: true })
  installationStep?: number | null;

  @Field({ nullable: true })
  logoImage?: string;

  @Field({ nullable: true })
  industry?: string;

  @Field((type) => SettingsInput)
  settings: SettingsInput;
}
