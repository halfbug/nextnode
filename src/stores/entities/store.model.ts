import { Column, Entity } from 'typeorm';
import { DefaultColumnsService } from 'src/utils/default-columns/default-columns.service';
import { Settings } from './settings.model';
import SocialLinks from 'src/campaigns/entities/social-link.model';
import Campaign from 'src/campaigns/entities/campaign.model';
import { BillingPlanEnum, BillingTierEnum } from './store.entity';
import {
  DiscountCode,
  PartnerRewards,
} from 'src/partners/entities/partner.modal';

export class Resource {
  @Column({ nullable: true })
  id: string;
  @Column({ nullable: true })
  type?: string;
  @Column({ nullable: true })
  detail?: string;
}

export class Subscription {
  @Column({ nullable: true })
  status?: string;
  confirmationUrl?: string;
}

export class Retentiontools {
  @Column({ nullable: true })
  status?: string;

  @Column({ nullable: true })
  updatedAt?: Date;
}
export class MatchingBrandName {
  @Column({ nullable: true })
  id: string;

  @Column({ nullable: true })
  brandName: string;
}
export class DiscoveryTools {
  @Column({ nullable: true })
  status?: string;

  @Column(() => MatchingBrandName)
  matchingBrandName?: MatchingBrandName[];
}
export class Drops {
  @Column({ nullable: true })
  status?: string;

  @Column({ nullable: true })
  isVideoEnabled?: boolean;

  @Column({ nullable: true })
  spotlightColletionId?: string;

  @Column({ nullable: true })
  spotlightDiscount?: DiscountCode;

  @Column({ nullable: true })
  latestCollectionId?: string;

  @Column({ nullable: true })
  bestSellerCollectionId?: string;

  @Column({ nullable: true })
  runningOutCollectionId?: string;

  @Column({ nullable: true })
  skincareCollectionId?: string;

  @Column({ nullable: true })
  hairCollectionId?: string;

  @Column({ nullable: true })
  allProductsCollectionId?: string;

  @Column({ nullable: true })
  rewards?: PartnerRewards;
}

@Entity()
export default class Store extends DefaultColumnsService {
  @Column()
  shopifySessionId: string;

  @Column({ nullable: true })
  brandName: string;

  @Column()
  shop: string;

  @Column()
  accessToken: string;

  @Column({ nullable: true })
  installationStep: number | null;

  @Column({ nullable: true })
  logoImage: string;

  @Column({ nullable: true })
  industry: string[];

  @Column((type) => Settings)
  settings?: Settings;

  @Column((type) => SocialLinks)
  social?: SocialLinks;

  @Column(() => Campaign)
  campaigns?: Campaign[];

  @Column(() => Campaign)
  activeCampaign?: Campaign;

  @Column('enum', { default: BillingPlanEnum.EXPLORE })
  plan?: BillingPlanEnum;

  @Column('enum', { default: BillingTierEnum.FREE })
  tier?: BillingTierEnum;

  @Column({ default: 0, nullable: true })
  totalGroupShop?: number;

  @Column({ nullable: true })
  resources?: Resource[];

  @Column({ nullable: true })
  subscription?: Subscription;

  @Column({ nullable: true })
  retentiontool?: Retentiontools;

  @Column({ nullable: true })
  hideProducts?: string[];

  @Column({ nullable: true })
  appTrialEnd: Date;

  @Column({ nullable: true })
  planResetDate: Date;

  @Column({ nullable: true })
  tierRecurringDate: Date;

  @Column({ nullable: true })
  currencyCode: string;

  @Column({ nullable: true })
  timezone: string;

  @Column({ nullable: true })
  discoveryTool: DiscoveryTools;

  @Column({ nullable: true })
  recentgs: string;

  @Column({ nullable: true })
  drops: Drops;
}
