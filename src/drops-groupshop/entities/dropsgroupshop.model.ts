import { Column, Entity } from 'typeorm';
import { DefaultColumnsService } from 'src/utils/default-columns/default-columns.service';
import {
  DiscountCode,
  Member,
  Milestone,
  OBSettings,
} from 'src/groupshops/entities/groupshop.modal';
import { Customer } from 'src/inventory/entities/orders.modal';
import Store from 'src/stores/entities/store.model';

@Entity()
export default class DropsGroupshop extends DefaultColumnsService {
  @Column()
  id: string;

  @Column({ nullable: true })
  storeId: string;

  @Column({ nullable: true })
  url: string;

  @Column({ nullable: true })
  expiredUrl: string;

  @Column({ default: 0 })
  totalProducts: number;

  @Column(() => DiscountCode)
  discountCode: DiscountCode;

  @Column()
  customerDetail: Customer;

  @Column(() => Member)
  members?: Member[];

  @Column()
  shortUrl?: string;

  @Column()
  expiredShortUrl?: string;

  @Column(() => Milestone)
  milestones: Milestone[];

  @Column({ nullable: true })
  obSettings?: OBSettings;
}
