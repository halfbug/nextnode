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

export class DealProducts {
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

export class Refund {
  @Column('enum', { nullable: true })
  status: RefundStatusEnum;
  @Column({ nullable: true })
  createdAt: Date;
  @Column({ nullable: true })
  discount: string;
  @Column({ nullable: true })
  amount: number;
}

export class Milestone {
  @Column({ nullable: true })
  activatedAt: Date;
  @Column({ nullable: true })
  discount: string;
}

export class Member {
  @Column({ nullable: true })
  orderId: string;

  @Column({ nullable: true })
  availedDiscount: string;

  @Column('enum', { nullable: true })
  role: RoleTypeEnum;

  @Column(() => Refund)
  refund?: Refund[];
}

@Entity()
export class Groupshops extends DefaultColumnsService {
  @Column()
  id: string;

  @Column()
  campaignId: string;

  @Column()
  storeId: string;

  @Column({ default: 0 })
  totalProducts: number;

  @Column(() => DealProducts)
  dealProducts?: DealProducts[];

  @Column()
  url: string;

  // @Column()
  // createdAt: string;

  @Column()
  expiredAt: Date;

  @Column(() => DiscountCode)
  discountCode: DiscountCode;

  @Column(() => Member)
  members: Member[];

  @Column(() => Milestone)
  milestones: Milestone[];
}
