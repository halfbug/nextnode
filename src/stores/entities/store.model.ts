import { Column, Entity } from 'typeorm';
import { DefaultColumnsService } from 'src/utils/default-columns/default-columns.service';
import { Settings } from './settings.model';
import Campaign from 'src/campaigns/entities/campaign.model';
import { BillingPlanEnum } from './store.entity';

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
  industry: string;

  @Column((type) => Settings)
  settings?: Settings;

  @Column(() => Campaign)
  campaigns?: Campaign[];

  @Column(() => Campaign)
  activeCampaign?: Campaign;

  @Column('enum', { default: BillingPlanEnum.EXPLORE })
  plan?: BillingPlanEnum;

  @Column({ default: 0, nullable: true })
  totalGroupShop?: number;

  @Column({ nullable: true })
  resources?: Resource[];

  @Column({ nullable: true })
  subscription?: Subscription;

  @Column({ nullable: true })
  hideProducts?: string[];

  @Column({ nullable: true })
  appTrialEnd: Date;

  @Column({ nullable: true })
  currencyCode: string;

  @Column({ nullable: true })
  timezone: string;
}
