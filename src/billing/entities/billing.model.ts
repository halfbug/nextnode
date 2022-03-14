import { Column, Entity } from 'typeorm';
import { DefaultColumnsService } from 'src/utils/default-columns/default-columns.service';
import { BillingTypeEnum } from './billing.entity';

@Entity()
export default class Billing extends DefaultColumnsService {
  // @Column()
  // id: string;

  @Column('enum', { nullable: true })
  type: BillingTypeEnum;

  @Column()
  amount: string;

  @Column()
  totalCashBack: string;

  @Column()
  storeId: string;
}
