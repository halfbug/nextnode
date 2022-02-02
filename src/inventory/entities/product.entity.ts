import { ObjectType, Field, InputType } from '@nestjs/graphql';
import { CreateOrderInput as Orders } from '../dto/create-order.input';

// @ObjectType()
// class FeatureImageType {
//   @Field()
//   src: string;
// }

@InputType('ProductOptionInput')
@ObjectType('ProductOption')
export class ProductOption {
  @Field()
  id: string;

  @Field()
  name: string;

  @Field()
  position: number;

  @Field(() => [String], { nullable: 'itemsAndList' })
  values?: string[];
}

@InputType('ProductImageInput')
@ObjectType('ProductImage')
export class ProductImage {
  @Field()
  id: string;

  @Field()
  src: string;
}

@InputType('SelectedOptionInput')
@ObjectType('SelectedOption')
export class SelectedOption {
  @Field()
  name: string;

  @Field()
  value: string;
}

@InputType('ProductVariantInput')
@ObjectType('ProductVariant')
export class ProductVariant {
  @Field()
  id: string;

  @Field()
  title: string;

  @Field()
  inventoryQuantity: number;

  @Field()
  price: string;

  @Field(() => [SelectedOption], { nullable: 'itemsAndList' })
  selectedOptions?: SelectedOption[];
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

  @Field({ nullable: true })
  description: string;

  @Field(() => [ProductImage], { nullable: 'itemsAndList' })
  images?: ProductImage[];

  @Field(() => [ProductVariant], { nullable: 'itemsAndList' })
  variants?: ProductVariant[];

  @Field(() => [ProductOption], { nullable: 'itemsAndList' })
  options?: ProductOption[];

  @Field({ nullable: true })
  totalVariants?: number;

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
