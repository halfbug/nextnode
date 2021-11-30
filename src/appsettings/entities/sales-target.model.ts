import { ObjectType } from '@nestjs/graphql';
import { DefaultColumnsService } from 'src/utils/default-columns/default-columns.service';
import { Column, Entity } from 'typeorm';
@Entity()
export class Reward {
  @Column()
  id: string;

  @Column({ nullable: true })
  discount?: string;

  @Column({ nullable: true })
  customerDiscount?: string;
}
@Entity()
export class SalesTarget {
  @Column()
  id: string;

  @Column({ nullable: true })
  name: string;

  @Column({ nullable: true })
  rogsMin: string;

  @Column({ nullable: true })
  rogsMax: string;

  @Column({ nullable: true })
  status: string;

  @Column((type) => Reward)
  rewards: Reward[];

  constructor(
    id: string,
    name: string,
    rogsMin: string,
    rogsMax: string,
    status: string,
    rewards: Reward[],
  ) {
    this.id = id;
    this.name = name;
    this.rogsMin = rogsMin;
    this.rogsMax = rogsMax;
    this.status = status;
    this.rewards = rewards;
  }
}
