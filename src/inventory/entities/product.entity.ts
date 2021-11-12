import { ObjectType, Field } from '@nestjs/graphql';

@ObjectType()
class FeatureImageType {
  @Field()
  src: string;
}

@ObjectType()
export class Product {
  // @Field({ description: 'mongo entity id' })
  // _id: string;

  @Field({ description: 'shopify entity id' })
  id: string;

  @Field()
  title: string;

  // @Field({ nullable: true })
  // description: string;

  // @Field({ nullable: true })
  // onlineStorePreviewUrl?: string;

  // @Field({ nullable: true })
  // onlineStoreUrl?: string;

  // @Field({ nullable: true })
  // storefrontId: string;

  // @Field({ nullable: true })
  // descriptionHtml?: string;

  // @Field()
  // productType?: string;

  @Field({ nullable: true })
  totalVariants?: number;

  // @Field({ nullable: true })
  // totalInventory?: number;

  @Field({ nullable: true })
  publishedAt?: string;

  @Field({ nullable: true })
  createdAtShopify?: string;

  @Field({ nullable: true })
  featuredImage?: string;
}
