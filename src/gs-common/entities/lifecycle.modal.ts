import { BillingPlanEnum } from 'src/stores/entities/store.entity';
import {
  Column,
  CreateDateColumn,
  Entity,
  Index,
  ObjectIdColumn,
} from 'typeorm';

export enum EventType {
  started = 'started',
  expired = 'expired',
  revised = 'revised',
  installed = 'installed',
  uninstalled = 'uninstalled',
  planReset = 'planReset',
  planChanged = 'planChanged',
  planReset1 = 'planReset1',
}

@Entity()
export class Lifecycle {
  @ObjectIdColumn()
  _id: string;

  @Column()
  event: EventType;

  @Index({ background: true })
  @Column({ nullable: true })
  groupshopId?: string;

  @Index({ background: true })
  @Column({ nullable: true })
  storeId?: string;

  @Column()
  dataTime: Date;

  @Column('enum', { nullable: true })
  plan?: BillingPlanEnum;
}
