import { Column, Entity, PrimaryColumn } from 'typeorm';
import { DefaultColumnsService } from 'src/utils/default-columns/default-columns.service';
import { SelectedOption } from './product.entity';
// import { InputType } from '@nestjsgraphql';

@Entity()
class IFeatureImage {
  @Column()
  src: string;
}

@Entity('ProductOption')
export class ProductOption {
  @Column()
  id: string;

  @Column()
  name: string;

  @Column()
  postion: number;

  @Column()
  values: string[];
}

@Entity()
export default class Inventory extends DefaultColumnsService {
  @Column()
  title: string;

  @Column()
  description: string;

  @Column()
  onlineStorePreviewUrl?: string;

  @Column(() => ProductOption)
  options: ProductOption[];

  @Column()
  onlineStoreUrl?: string;

  @PrimaryColumn()
  storefrontId: string;

  @Column()
  descriptionHtml?: string;

  @Column()
  productType?: string;

  @Column()
  totalVariants?: number;

  @Column()
  totalInventory?: number;

  @Column()
  publishedAt?: string;

  @Column()
  createdAtShopify?: string;

  @Column()
  shopifyCreatedAt?: string;

  @Column('string', { default: null, nullable: true })
  recordType: string;

  @Column({ nullable: true })
  currencyCode?: string;

  @Column()
  __parentId?: string;

  @Column()
  image?: string;

  @Column()
  displayName?: string;

  @Column()
  featuredImage?: string;

  @Column()
  shop?: string;

  @Column()
  parentId?: string;

  @Column({ nullable: true })
  inventoryQuantity?: number;

  @Column({ nullable: true })
  outofstock?: boolean;

  @Column({ nullable: true })
  price: string;

  @Column(() => SelectedOption)
  selectedOptions?: SelectedOption[];
}
