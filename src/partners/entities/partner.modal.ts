import { Column, Entity } from 'typeorm';
import { DefaultColumnsService } from 'src/utils/default-columns/default-columns.service';

export enum ProductTypeEnum {
  deal,
  abandoned,
}

export enum RefundStatusEnum {
  done,
  panding,
}

export enum RoleTypeEnum {
  owner,
  referral,
}

export class dealProducts {
  @Column({ nullable: true })
  productId: string;

  @Column('enum', {
    nullable: true,
    comment: 'deal = 0 and abandoned = 1',
    enum: ProductTypeEnum,
  })
  type: ProductTypeEnum;

  @Column({ nullable: true })
  addedBy: string;

  @Column({ nullable: true })
  customerIP: string;
}

export class DiscountCode {
  @Column({ nullable: true })
  title: string;
  @Column({ nullable: true })
  percentage: string;
  @Column({ nullable: true })
  priceRuleId: string;
}

export class PartnerRewards {
  @Column({ nullable: true })
  baseline: string;
  @Column({ nullable: true })
  average: string;
  @Column({ nullable: true })
  maximum: string;
}

export class partnerDetails {
  @Column({ nullable: true })
  fname: string;
  @Column({ nullable: true })
  lname: string;
  @Column({ nullable: true })
  email: string;
  @Column({ nullable: true })
  shopifyCustomerId?: string;
}

@Entity()
export class Partnergroupshop extends DefaultColumnsService {
  @Column()
  campaignId: string;

  @Column()
  storeId: string;

  @Column(() => dealProducts)
  dealProducts?: dealProducts[];

  @Column()
  url: string;

  @Column({ nullable: true })
  shortUrl?: string;

  @Column({ nullable: true })
  createdAt: Date;

  @Column(() => DiscountCode)
  discountCode: DiscountCode;

  @Column(() => PartnerRewards)
  partnerRewards: PartnerRewards;

  @Column({ nullable: true })
  partnerCommission: string;

  @Column(() => partnerDetails)
  partnerDetails: partnerDetails;

  @Column({ nullable: true })
  isActive?: boolean;
}