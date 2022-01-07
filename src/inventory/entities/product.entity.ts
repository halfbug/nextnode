import { ObjectType, Field, InputType } from '@nestjs/graphql';
import { CreateOrderInput as Orders } from '../dto/create-order.input';
// import Orders from './orders.entity';
// CreateOrderInput
@ObjectType()
class FeatureImageType {
  @Field()
  src: string;
}
@InputType('ProductInput')
@ObjectType('Product')
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
  price?: string;

  @Field({ nullable: true })
  currencyCode?: string;

  @Field({ nullable: true })
  shop?: string;

  @Field({ nullable: true })
  recordType?: string;

  @Field({ nullable: true })
  publishedAt?: string;

  @Field({ nullable: true })
  createdAtShopify?: string;

  @Field({ nullable: true })
  featuredImage?: string;

  @Field(() => [Orders], { nullable: 'itemsAndList' })
  lineItems?: Orders[];

  @Field(() => [Orders], { nullable: 'itemsAndList' })
  orders?: Orders[];
}
