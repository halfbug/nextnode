import { Column, Entity } from 'typeorm';
import { DefaultColumnsService } from 'src/utils/default-columns/default-columns.service';
import { Settings } from './settings.model';
import Campaign from 'src/campaigns/entities/campaign.model';
import { BillingPlanEnum } from './store.entity';

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

  @Column({ default: 0, nullable: true })
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

  @Column({ nullable: true })
  totalGroupShop?: number;
}
