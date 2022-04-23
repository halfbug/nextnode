import { Column, Entity } from 'typeorm';
import { DefaultColumnsService } from 'src/utils/default-columns/default-columns.service';
import { BillingTypeEnum } from './billing.entity';
import { BillingPlanEnum } from 'src/stores/entities/store.entity';

@Entity()
export default class Billing extends DefaultColumnsService {
  @Column()
  id: string;

  @Column('enum', { nullable: true })
  type: BillingTypeEnum;

  @Column()
  feeCharges: number;

  @Column({ nullable: true })
  cashBack: number;

  @Column({ nullable: true })
  plan: BillingPlanEnum;

  @Column()
  groupShopId: string;

  @Column()
  storeId: string;

  @Column()
  revenue?: number;

  @Column({ default: false })
  isPaid?: boolean;
}
