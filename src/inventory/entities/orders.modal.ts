import { Column, Entity, PrimaryColumn } from 'typeorm';
import { DefaultColumnsService } from 'src/utils/default-columns/default-columns.service';

export class LineProduct {
  @Column({ nullable: true })
  id: string;
}

@Entity()
export default class Orders extends DefaultColumnsService {
  @Column({ nullable: true })
  name: string;
  @Column({ nullable: true })
  shopifyCreatedAt?: string;
  @Column({ nullable: true })
  confirmed?: boolean;
  @Column({ nullable: true })
  cancelledAt?: string;
  @Column({ nullable: true })
  shop?: string;
  @Column({ nullable: true })
  totalPrice?: string;
  @Column({ nullable: true })
  parentId?: string;
  @Column(() => LineProduct)
  product?: LineProduct;
  @Column({ nullable: true })
  price?: string;
}
