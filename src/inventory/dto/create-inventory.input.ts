import { InputType, Int, Field } from '@nestjs/graphql';
import { ProductOption, SelectedOption } from '../entities/product.entity';

@InputType()
export class CreateInventoryInput {
  @Field({ description: 'shopify entity admin_graphql_api_id' })
  id: string;

  @Field()
  title: string;

  @Field({ nullable: true })
  totalVariants?: number;

  @Field({ nullable: true })
  price?: string;

  @Field({ nullable: true })
  currencyCode?: string;

  @Field({ nullable: true })
  publishedAt?: string;

  @Field({ nullable: true })
  createdAtShopify?: string;

  @Field({ nullable: true })
  featuredImage?: string;

  @Field({ nullable: true })
  shop?: string;

  @Field({ nullable: true })
  recordType?: string;

  @Field({ nullable: true })
  status?: string;

  @Field({ nullable: true })
  parentId?: string;

  @Field({ nullable: true })
  inventoryQuantity?: number;

  @Field({ nullable: true })
  totalInventory?: number;

  @Field({ nullable: true })
  outofstock?: boolean;

  @Field(() => [ProductOption], { nullable: 'itemsAndList' })
  options?: ProductOption[];

  @Field(() => [SelectedOption], { nullable: 'itemsAndList' })
  selectedOptions?: SelectedOption[];
}
