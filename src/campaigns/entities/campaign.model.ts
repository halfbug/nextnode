import { Column, Entity } from 'typeorm';
import { DefaultColumnsService } from 'src/utils/default-columns/default-columns.service';
import { SalesTarget } from 'src/appsettings/entities/sales-target.model';
import { Settings } from 'src/stores/entities/settings.model';
import SocialLinks from './social-link.model';

@Entity()
export default class Campaign extends DefaultColumnsService {
  @Column({ nullable: true })
  storeId: string;

  @Column(() => SalesTarget)
  salesTarget?: SalesTarget;

  @Column({ nullable: true })
  name: string;

  @Column({ nullable: true })
  joinExisting: boolean;

  @Column({ nullable: true })
  criteria: string;

  // @Column(() => Product)
  // products?: Product[];

  @Column('string', { nullable: true })
  products?: string[];

  @Column('string', { nullable: true })
  collections?: string[];

  @Column('string', { nullable: true })
  addableProducts?: string[];

  @Column('string', { nullable: true })
  rewards?: string;

  @Column()
  isActive?: boolean;

  @Column({ nullable: true })
  settings?: Settings;

  @Column({ nullable: true })
  socialLinks?: SocialLinks;

  @Column({ nullable: true })
  expiredAt?: Date;
}
