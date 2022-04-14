import { ObjectType, Field } from '@nestjs/graphql';

@ObjectType()
class FeatureImageType {
  @Field()
  src: string;
}

@ObjectType()
export class Inventory {
  // @Field({ description: 'mongo entity id' })
  // _id: string;

  @Field({ description: 'shopify entity id' })
  id: string;

  @Field()
  status: string;

  @Field()
  createdAt: Date;

  @Field()
  updatedAt: Date;

  @Field()
  deletedAt: Date;

  @Field()
  version: number;

  @Field()
  title: string;

  @Field()
  description: string;

  @Field()
  onlineStorePreviewUrl?: string;

  @Field()
  onlineStoreUrl?: string;

  @Field()
  storefrontId: string;

  @Field()
  descriptionHtml?: string;

  @Field()
  productType?: string;

  @Field()
  totalVariants?: number;

  @Field()
  totalInventory?: number;

  @Field()
  publishedAt?: string;

  @Field()
  createdAtShopify?: string;

  @Field()
  shopifyCreatedAt?: string;

  @Field()
  recordType: string;

  @Field()
  parentId?: string;

  @Field()
  image?: string;

  @Field()
  sortOrder?: string;

  @Field()
  productsCount?: number;

  @Field()
  displayName?: string;

  @Field()
  featuredImage?: FeatureImageType;

  @Field({ nullable: true })
  outofstock?: boolean;
}
