import { Column, Entity } from 'typeorm';
import { DefaultColumnsService } from 'src/utils/default-columns/default-columns.service';
import { Groupshops } from 'src/groupshops/entities/groupshop.modal';

export class IRewards {
  // @Column({ nullable: true })
  // activatedAt: Date;
  @Column({ nullable: true })
  commission: string;
  @Column({ nullable: true })
  baseline: string;
  @Column({ nullable: true })
  average: string;
  @Column({ nullable: true })
  maximum: string;
}

@Entity()
export default class Channel extends DefaultColumnsService {
  @Column({ nullable: true })
  storeId: string;

  @Column({ nullable: true })
  name: string;

  @Column({ nullable: true })
  slugName: string;

  @Column()
  rewards: IRewards;

  @Column({ nullable: true })
  isActive?: boolean;

  // @Column()
  // status: string;
}
