import { Column, Entity, OneToOne } from 'typeorm';
import { DefaultColumnsService } from 'src/utils/default-columns/default-columns.service';
import { Settings } from './settings.model';

@Entity()
export default class Store extends DefaultColumnsService {
  @Column()
  shopifySessionId: string;

  @Column({ nullable: true })
  brandName: string;

  @Column()
  shop: string;

  @Column()
  accessToken: string;

  @Column({ default: 0, nullable: true })
  installationStep: number | null;

  @Column({ nullable: true })
  logoImage: string;

  @Column({ nullable: true })
  industry: string;

  @Column((type) => Settings)
  settings?: Settings;
}
