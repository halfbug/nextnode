import { Column } from 'typeorm';
import { BannerDesignTypeEnum, BannerSummaryEnum } from './settings.entity';

export class Settings {
  @Column({ nullable: true })
  brandColor: string;

  @Column()
  customColor: string;

  @Column()
  customBg: string;

  @Column({ nullable: true })
  imageUrl: string;

  @Column({ nullable: true })
  youtubeUrl: string;

  @Column({ nullable: true })
  media: string;

  @Column('enum', { nullable: true })
  bannerDesign: BannerDesignTypeEnum;

  @Column({ nullable: true })
  bannerProductPage: boolean;

  @Column({ nullable: true })
  bannerCartPage: boolean;

  @Column({ nullable: true })
  bannerLocation: string;

  @Column({ nullable: true })
  callToActionText: string;

  @Column('enum', { nullable: true })
  bannerSummaryPage: BannerSummaryEnum;

  constructor(
    brandColor: string,
    customColor: string,
    customBg: string,
    imageUrl: string,
    youtubeUrl: string,
    media: string,
    bannerDesign: BannerDesignTypeEnum,
    bannerProductPage: boolean,
    bannerCartPage: boolean,
    bannerLocation: string,
    callToActionText: string,
    bannerSummaryPage: BannerSummaryEnum,
  ) {
    this.brandColor = brandColor;
    this.customColor = customColor;
    this.customBg = customBg;
    this.imageUrl = imageUrl;
    this.youtubeUrl = youtubeUrl;
    this.media = media;
    this.bannerDesign = bannerDesign;
    this.bannerProductPage = bannerProductPage;
    this.bannerCartPage = bannerCartPage;
    this.bannerLocation = bannerLocation;
    this.callToActionText = callToActionText;
    this.bannerSummaryPage = bannerSummaryPage;
  }
}
