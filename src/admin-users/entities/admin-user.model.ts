import { Column, Entity } from 'typeorm';
import { DefaultColumnsService } from 'src/utils/default-columns/default-columns.service';

@Entity()
export default class AdminUser extends DefaultColumnsService {
  @Column()
  username: string;

  @Column()
  password: string;

  @Column('string')
  roles: string[];
}
