import {
  Column,
  CreateDateColumn,
  DeleteDateColumn,
  Entity,
  ObjectIdColumn,
  UpdateDateColumn,
  VersionColumn,
} from 'typeorm';

@Entity()
export class DefaultColumnsService {
  @ObjectIdColumn()
  _id: string;

  @Column({ default: 'active' })
  status: string;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;

  @DeleteDateColumn()
  deletedAt: Date;

  @VersionColumn()
  version: number;
}
