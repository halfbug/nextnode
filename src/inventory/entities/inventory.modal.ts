import { Column, Entity, PrimaryColumn } from 'typeorm';
import { DefaultColumnsService } from 'src/utils/default-columns/default-columns.service';

@Entity()
class IFeatureImage {
  @Column()
  src: string;
}

@Entity()
export default class Inventory extends DefaultColumnsService {
  @Column()
  title: string;

  @Column()
  description: string;

  @Column()
  onlineStorePreviewUrl?: string;

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
  inventory_quantity?: number;
}
