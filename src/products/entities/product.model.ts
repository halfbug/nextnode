import { Column, Entity, ObjectIdColumn, PrimaryColumn } from 'typeorm';

@Entity()
export default class Product {
  @ObjectIdColumn()
  _id: string;

  @PrimaryColumn()
  shopifyId: string;

  @Column()
  storeId: string;

  @Column()
  image: string;

  @Column()
  name: string;

  @Column()
  price: number;
}
