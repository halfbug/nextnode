import { ObjectType, Field, ID, registerEnumType } from '@nestjs/graphql';

export enum BannerDesignTypeEnum {
  GS_NEON,
  GS_WHITE,
  GS_LIGHT,
  GS_DARK,
  GS_LIGHT_A,
  GS_DARK_A,
  GS_CUSTOM_A,
}
registerEnumType(BannerDesignTypeEnum, {
  name: 'BannerDesignTypeEnum',
});
export enum BannerSummaryEnum {
  LEFT,
  RIGHT,
  BOTH,
  NONE,
}
registerEnumType(BannerSummaryEnum, {
  name: 'BannerSummaryEnum',
});

@ObjectType()
export class Settings {
  @Field(() => ID)
  id: string;

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
  bannerSummaryPage: BannerSummaryEnum;
}
