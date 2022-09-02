import { Column, Entity } from 'typeorm';
import { DefaultColumnsService } from 'src/utils/default-columns/default-columns.service';

@Entity()
export class Retentiontool extends DefaultColumnsService {
  @Column()
  storeId: string;

  @Column()
  shop: string;

  @Column({ nullable: true })
  groupshopsCreated?: number;

  @Column({ nullable: true })
  startDate?: string;

  @Column({ nullable: true })
  endDate?: string;

  @Column({ nullable: true })
  minOrderValue?: string;

  @Column({ nullable: true })
  createdAt: Date;

  @Column({ nullable: true })
  updatedAt: Date;
}
