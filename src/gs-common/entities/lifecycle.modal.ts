import { Column, CreateDateColumn, Entity, Index, ObjectIdColumn } from 'typeorm';

export enum EventType {
  started = 'started',
  expired = 'expired',
  revised = 'revised',
}

@Entity()
export class Lifecycle {
  @ObjectIdColumn()
  _id: string;

  @Column()
  event: EventType;

  @Index({ background: true })
  @Column()
  groupshopId: string;

  @Column()
  dataTime: Date;
}
