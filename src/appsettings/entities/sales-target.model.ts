import { Column } from 'typeorm';

export class Reward {
  @Column()
  id: string;

  @Column({ nullable: true })
  discount?: string;

  @Column({ nullable: true })
  customerCount?: string;

  constructor(id: string, discount: string, customerCount: string) {
    this.id = id;
    this.discount = discount;
    this.customerCount = customerCount;
  }
}

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
