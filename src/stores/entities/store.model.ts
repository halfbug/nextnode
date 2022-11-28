import { Column, Entity } from 'typeorm';
import { DefaultColumnsService } from 'src/utils/default-columns/default-columns.service';
import { Settings } from './settings.model';
import SocialLinks from 'src/campaigns/entities/social-link.model';
import Campaign from 'src/campaigns/entities/campaign.model';
import { BillingPlanEnum, BillingTierEnum } from './store.entity';

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
}
