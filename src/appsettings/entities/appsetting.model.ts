import { Column, Entity } from 'typeorm';
import { DefaultColumnsService } from 'src/utils/default-columns/default-columns.service';
import { SalesTarget } from './sales-target.model';

@Entity()
export class Appsetting extends DefaultColumnsService {
  @Column()
  id: string;

  @Column((type) => SalesTarget)
  salestargets: SalesTarget[];
}
