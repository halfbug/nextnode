import { Column, Entity } from 'typeorm';
import { DefaultColumnsService } from 'src/utils/default-columns/default-columns.service';
import {
  DealProducts,
  DiscountCode,
  Member,
} from 'src/groupshops/entities/groupshop.modal';
import { Customer } from 'src/inventory/entities/orders.modal';

@Entity()
export default class ChannelGroupshop extends DefaultColumnsService {
  @Column()
  customerDetail: Customer;

  @Column()
  channelId: string;

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

  @Column()
  shortUrl?: string;

  @Column()
  exipredUrl?: string;

  @Column()
  expiredAt: Date;

  @Column(() => DiscountCode)
  discountCode: DiscountCode;

  @Column(() => Member)
  members?: Member[];

  // @Column()
  // isActive?: boolean;

  // @Column(() => Milestone)
  // milestones: Milestone[];
}
